import * as hex from "../../src/encoding/hex.js";
import * as rlp from "../../src/encoding/rlp.js";
import EvmAddress from "../../src/EvmAddress.js";
import AccessListItem from "../../src/AccessListItem.js";
import EthereumTransactionDataEip7702 from "../../src/EthereumTransactionDataEip7702.js";

const to = "00000000000000000000000000000000000003f9";
const r = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const s = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const accessAddress = "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181";
const storageKey =
    "0000000000000000000000000000000000000000000000000000000000000001";

/**
 * The encoded EIP-7702 transaction the tests decode: chain ID 0x012a, nonce 5,
 * max priority gas 1, max gas 0xd1385c7bf0, gas limit 0x07a120, a recipient,
 * value 0x0a, call data 0x123456, one access list entry, one authorization and
 * a signature.
 *
 * @returns {Uint8Array}
 */
function encodedTx() {
    return rlp.encodeTyped(0x04, [
        hex.decode("012a"),
        hex.decode("05"),
        hex.decode("01"),
        hex.decode("d1385c7bf0"),
        hex.decode("07a120"),
        hex.decode(to),
        hex.decode("0a"),
        hex.decode("123456"),
        [[hex.decode(accessAddress), [hex.decode(storageKey)]]],
        [
            [
                hex.decode("012a"),
                hex.decode(to),
                hex.decode("07"),
                hex.decode("01"),
                hex.decode(r),
                hex.decode(s),
            ],
        ],
        hex.decode("01"),
        hex.decode(r),
        hex.decode(s),
    ]);
}

describe("EthereumTransactionDataEip7702", function () {
    describe("getters", function () {
        let data;

        beforeEach(function () {
            data = EthereumTransactionDataEip7702.fromBytes(encodedTx());
        });

        it("return the chain ID bytes", function () {
            expect(data.getChainIdBytes()).to.deep.equal(hex.decode("012a"));
        });

        it("return the nonce", function () {
            expect(data.getNonce().toNumber()).to.equal(5);
            expect(data.getNonceBytes()).to.deep.equal(hex.decode("05"));
        });

        it("return the gas bytes", function () {
            expect(data.getMaxPriorityGasBytes()).to.deep.equal(
                hex.decode("01"),
            );
            expect(data.getMaxGasBytes()).to.deep.equal(
                hex.decode("d1385c7bf0"),
            );
            expect(data.getGasLimitBytes()).to.deep.equal(hex.decode("07a120"));
        });

        it("return the recipient", function () {
            expect(data.getTo().toString()).to.equal(to);
            expect(data.getToBytes()).to.deep.equal(hex.decode(to));
        });

        it("return the value", function () {
            expect(data.getValue().toFixed()).to.equal("10");
            expect(data.getValueBytes()).to.deep.equal(hex.decode("0a"));
        });

        it("return the call data", function () {
            expect(data.getCallData()).to.deep.equal(hex.decode("123456"));
        });

        it("return the signature", function () {
            expect(data.getRecId().toNumber()).to.equal(1);
            expect(data.getRecIdBytes()).to.deep.equal(hex.decode("01"));
            expect(data.getR()).to.deep.equal(hex.decode(r));
            expect(data.getS()).to.deep.equal(hex.decode(s));
        });
    });

    describe("setters", function () {
        it("setNonce(), setTo(), setValue() and setCallData() survive toBytes() and fromBytes()", function () {
            const data = EthereumTransactionDataEip7702.fromBytes(encodedTx());

            expect(data.setNonce(9)).to.equal(data);
            expect(data.setTo(EvmAddress.fromString(accessAddress))).to.equal(
                data,
            );
            expect(data.setValue(1000)).to.equal(data);
            expect(data.setCallData(hex.decode("abcdef"))).to.equal(data);

            const decoded = EthereumTransactionDataEip7702.fromBytes(
                data.toBytes(),
            );

            expect(decoded.getNonce().toNumber()).to.equal(9);
            expect(decoded.getTo().toString()).to.equal(accessAddress);
            expect(decoded.getValue().toFixed()).to.equal("1000");
            expect(decoded.getCallData()).to.deep.equal(hex.decode("abcdef"));
        });

        it("addAccessListItem() adds an entry that survives toBytes() and fromBytes()", function () {
            const data = EthereumTransactionDataEip7702.fromBytes(encodedTx());
            const item = new AccessListItem(hex.decode(to), []);

            expect(data.addAccessListItem(item)).to.equal(data);

            const decoded = EthereumTransactionDataEip7702.fromBytes(
                data.toBytes(),
            );
            const accessList = decoded.getAccessList();

            expect(accessList).to.have.length(2);
            expect(accessList[1].getAddress().toString()).to.equal(to);
            expect(accessList[1].getStorageKeys()).to.deep.equal([]);
        });
    });

    describe("fromBytes() errors", function () {
        it("throws for empty bytes", function () {
            expect(() =>
                EthereumTransactionDataEip7702.fromBytes(new Uint8Array()),
            ).to.throw("empty bytes");
        });

        it("throws for an RLP byte string instead of a list", function () {
            expect(() =>
                EthereumTransactionDataEip7702.fromBytes(
                    rlp.encodeTyped(0x04, hex.decode("0102")),
                ),
            ).to.throw("ethereum data is not a list");
        });

        it("throws for a list with one field too few", function () {
            const fields = rlp.decode(encodedTx().subarray(1)).slice(0, 12);

            expect(() =>
                EthereumTransactionDataEip7702.fromBytes(
                    rlp.encodeTyped(0x04, fields),
                ),
            ).to.throw("invalid ethereum transaction data");
        });

        it("throws for an access list entry that is not [address, storageKeys[]]", function () {
            const fields = rlp.decode(encodedTx().subarray(1));
            fields[8] = [hex.decode(accessAddress)];

            expect(() =>
                EthereumTransactionDataEip7702.fromBytes(
                    rlp.encodeTyped(0x04, fields),
                ),
            ).to.throw(
                "invalid access list entry: must be [address, storageKeys[]]",
            );
        });

        it("throws for an authorization list that is not a list", function () {
            const fields = rlp.decode(encodedTx().subarray(1));
            fields[9] = hex.decode("01");

            expect(() =>
                EthereumTransactionDataEip7702.fromBytes(
                    rlp.encodeTyped(0x04, fields),
                ),
            ).to.throw("authorization list must be an array");
        });

        it("throws for an authorization list entry without six fields", function () {
            const fields = rlp.decode(encodedTx().subarray(1));
            fields[9] = [fields[9][0].slice(0, 5)];

            expect(() =>
                EthereumTransactionDataEip7702.fromBytes(
                    rlp.encodeTyped(0x04, fields),
                ),
            ).to.throw(
                "invalid authorization list entry: must be [chainId, contractAddress, nonce, yParity, r, s]",
            );
        });
    });

    describe("toJSON() and toString()", function () {
        it("toJSON() returns every field as hex, including the authorization and access lists", function () {
            const data = EthereumTransactionDataEip7702.fromBytes(encodedTx());

            expect(data.toJSON()).to.deep.equal({
                chainId: "012a",
                nonce: "05",
                maxPriorityGas: "01",
                maxGas: "d1385c7bf0",
                gasLimit: "07a120",
                to,
                value: "0a",
                callData: "123456",
                authorizationList: [["012a", to, "07", "01", r, s]],
                accessList: [
                    { address: accessAddress, storageKeys: [storageKey] },
                ],
                recId: "01",
                r,
                s,
            });
        });

        it("toString() returns toJSON() as JSON", function () {
            const data = EthereumTransactionDataEip7702.fromBytes(encodedTx());

            expect(data.toString()).to.equal(
                JSON.stringify(data.toJSON(), null, 2),
            );
        });
    });
});
