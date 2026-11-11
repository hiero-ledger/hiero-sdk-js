import * as hex from "../../src/encoding/hex.js";
import * as rlp from "../../src/encoding/rlp.js";
import EvmAddress from "../../src/EvmAddress.js";
import AccessListItem from "../../src/AccessListItem.js";
import EthereumTransactionDataEip2930 from "../../src/EthereumTransactionDataEip2930.js";

// A signed EIP-2930 transaction with chain ID 1, nonce 1, gas price 0x0a,
// gas limit 0x0a, recipient 0x...01, value 0x0a, no call data and an empty
// access list.
const rawTx = hex.decode(
    "01f85f01010a0a9400000000000000000000000000000000000000010a80c080a038ba8bdbcd8684ff089b8efaf7b5aaf2071a11ab01b6cc65757af79f1199f2efa0570b83f85d578427becab466ced52da857e2a9e48bf9ec5850cc2f541e9305e9",
);

const to = "0000000000000000000000000000000000000001";
const r = "38ba8bdbcd8684ff089b8efaf7b5aaf2071a11ab01b6cc65757af79f1199f2ef";
const s = "570b83f85d578427becab466ced52da857e2a9e48bf9ec5850cc2f541e9305e9";
const accessAddress = "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181";
const storageKey =
    "0000000000000000000000000000000000000000000000000000000000000001";

describe("EthereumTransactionDataEip2930", function () {
    describe("getters", function () {
        let data;

        beforeEach(function () {
            data = EthereumTransactionDataEip2930.fromBytes(rawTx);
        });

        it("return the chain ID", function () {
            expect(data.getChainId().toNumber()).to.equal(1);
            expect(data.getChainIdBytes()).to.deep.equal(hex.decode("01"));
        });

        it("return the nonce", function () {
            expect(data.getNonce().toNumber()).to.equal(1);
            expect(data.getNonceBytes()).to.deep.equal(hex.decode("01"));
        });

        it("return the gas price and gas limit bytes", function () {
            expect(data.getGasPriceBytes()).to.deep.equal(hex.decode("0a"));
            expect(data.getGasLimitBytes()).to.deep.equal(hex.decode("0a"));
        });

        it("return the recipient bytes", function () {
            expect(data.getToBytes()).to.deep.equal(hex.decode(to));
        });

        it("return the value", function () {
            expect(data.getValue().toFixed()).to.equal("10");
            expect(data.getValueBytes()).to.deep.equal(hex.decode("0a"));
        });

        it("return the call data", function () {
            expect(data.getCallData()).to.deep.equal(new Uint8Array());
        });

        it("return the signature", function () {
            expect(data.getRecId().toNumber()).to.equal(0);
            expect(data.getRecIdBytes()).to.deep.equal(new Uint8Array());
            expect(data.getR()).to.deep.equal(hex.decode(r));
            expect(data.getS()).to.deep.equal(hex.decode(s));
        });
    });

    describe("setters", function () {
        it("setTo() and setCallData() survive toBytes() and fromBytes()", function () {
            const data = EthereumTransactionDataEip2930.fromBytes(rawTx);

            expect(data.setTo(EvmAddress.fromString(accessAddress))).to.equal(
                data,
            );
            expect(data.setCallData("0xabcdef")).to.equal(data);

            const decoded = EthereumTransactionDataEip2930.fromBytes(
                data.toBytes(),
            );

            expect(decoded.getTo().toString()).to.equal(accessAddress);
            expect(decoded.getCallData()).to.deep.equal(hex.decode("abcdef"));
        });

        it("addAccessListItem() adds an entry that survives toBytes() and fromBytes()", function () {
            const data = EthereumTransactionDataEip2930.fromBytes(rawTx);
            const item = new AccessListItem(hex.decode(accessAddress), [
                hex.decode(storageKey),
            ]);

            expect(data.addAccessListItem(item)).to.equal(data);

            const decoded = EthereumTransactionDataEip2930.fromBytes(
                data.toBytes(),
            );
            const accessList = decoded.getAccessList();

            expect(accessList).to.have.length(1);
            expect(accessList[0].getAddress().toString()).to.equal(
                accessAddress,
            );
            expect(accessList[0].getStorageKeys()).to.deep.equal([
                hex.decode(storageKey),
            ]);
        });
    });

    describe("fromBytes() errors", function () {
        it("throws for empty bytes", function () {
            expect(() =>
                EthereumTransactionDataEip2930.fromBytes(new Uint8Array()),
            ).to.throw("empty bytes");
        });

        it("throws for an RLP byte string instead of a list", function () {
            expect(() =>
                EthereumTransactionDataEip2930.fromBytes(
                    rlp.encodeTyped(0x01, hex.decode("0102")),
                ),
            ).to.throw("ethereum data is not a list");
        });

        it("throws for a list with one field too few", function () {
            const fields = rlp.decode(rawTx.subarray(1)).slice(0, 10);

            expect(() =>
                EthereumTransactionDataEip2930.fromBytes(
                    rlp.encodeTyped(0x01, fields),
                ),
            ).to.throw("invalid ethereum transaction data");
        });

        it("throws for an access list entry that is not [address, storageKeys[]]", function () {
            const fields = rlp.decode(rawTx.subarray(1));
            fields[7] = [[hex.decode(accessAddress)]];

            expect(() =>
                EthereumTransactionDataEip2930.fromBytes(
                    rlp.encodeTyped(0x01, fields),
                ),
            ).to.throw(
                "invalid access list entry: must be [address, storageKeys[]]",
            );
        });
    });

    describe("toJSON() and toString()", function () {
        let data;

        beforeEach(function () {
            data = EthereumTransactionDataEip2930.fromBytes(
                rawTx,
            ).addAccessListItem(
                new AccessListItem(hex.decode(accessAddress), [
                    hex.decode(storageKey),
                ]),
            );
        });

        it("toJSON() returns every field as hex, including the access list", function () {
            expect(data.toJSON()).to.deep.equal({
                chainId: "01",
                nonce: "01",
                gasPrice: "0a",
                gasLimit: "0a",
                to,
                value: "0a",
                callData: "",
                accessList: [
                    { address: accessAddress, storageKeys: [storageKey] },
                ],
                recId: "",
                r,
                s,
            });
        });

        it("toString() returns toJSON() as JSON", function () {
            expect(data.toString()).to.equal(
                JSON.stringify(data.toJSON(), null, 2),
            );
        });
    });
});
