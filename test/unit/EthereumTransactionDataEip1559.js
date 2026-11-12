import * as hex from "../../src/encoding/hex.js";
import * as rlp from "../../src/encoding/rlp.js";
import EthereumTransactionDataEip1559 from "../../src/EthereumTransactionDataEip1559.js";

// A signed EIP-1559 transaction with chain ID 0x012a, nonce 2, max priority
// gas and max gas 0x2f, gas limit 0x018000, a recipient, value 1e18, call
// data 0x123456 and an empty access list.
const rawTx = hex.decode(
    "02f87082012a022f2f83018000947e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181880de0b6b3a764000083123456c001a0df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479a01aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66",
);

const to = "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181";
const r = "df48f2efd10421811de2bfb125ab75b2d3c44139c4642837fb1fccce911fd479";
const s = "1aaf7ae92bee896651dfc9d99ae422a296bf5d9f1ca49b2d96d82b79eb112d66";
const storageKey =
    "0000000000000000000000000000000000000000000000000000000000000001";

describe("EthereumTransactionDataEip1559", function () {
    describe("getters", function () {
        let data;

        beforeEach(function () {
            data = EthereumTransactionDataEip1559.fromBytes(rawTx);
        });

        it("return the chain ID bytes", function () {
            expect(data.getChainIdBytes()).to.deep.equal(hex.decode("012a"));
        });

        it("return the max priority gas and max gas", function () {
            expect(data.getMaxPriorityGas().toFixed()).to.equal("47");
            expect(data.getMaxGasBytes()).to.deep.equal(hex.decode("2f"));
        });

        it("return the recovery ID", function () {
            expect(data.getRecId().toNumber()).to.equal(1);
            expect(data.getRecIdBytes()).to.deep.equal(hex.decode("01"));
        });
    });

    describe("fromBytes() errors", function () {
        it("throws for empty bytes", function () {
            expect(() =>
                EthereumTransactionDataEip1559.fromBytes(new Uint8Array()),
            ).to.throw("empty bytes");
        });

        it("throws for an RLP byte string instead of a list", function () {
            expect(() =>
                EthereumTransactionDataEip1559.fromBytes(
                    rlp.encodeTyped(0x02, hex.decode("0102")),
                ),
            ).to.throw("ethereum data is not a list");
        });

        it("throws for a list with one field too few", function () {
            const fields = rlp.decode(rawTx.subarray(1)).slice(0, 11);

            expect(() =>
                EthereumTransactionDataEip1559.fromBytes(
                    rlp.encodeTyped(0x02, fields),
                ),
            ).to.throw("invalid ethereum transaction data");
        });

        it("throws for an access list entry that is not [address, storageKeys[]]", function () {
            const fields = rlp.decode(rawTx.subarray(1));
            fields[8] = [[hex.decode(to), [], hex.decode("01")]];

            expect(() =>
                EthereumTransactionDataEip1559.fromBytes(
                    rlp.encodeTyped(0x02, fields),
                ),
            ).to.throw(
                "invalid access list entry: must be [address, storageKeys[]]",
            );
        });
    });

    describe("toJSON() and toString()", function () {
        let data;

        beforeEach(function () {
            const fields = rlp.decode(rawTx.subarray(1));
            fields[8] = [[hex.decode(to), [hex.decode(storageKey)]]];
            data = EthereumTransactionDataEip1559.fromBytes(
                rlp.encodeTyped(0x02, fields),
            );
        });

        it("toJSON() returns every field as hex, including the access list", function () {
            expect(data.toJSON()).to.deep.equal({
                chainId: "012a",
                nonce: "02",
                maxPriorityGas: "2f",
                maxGas: "2f",
                gasLimit: "018000",
                to,
                value: "0de0b6b3a7640000",
                callData: "123456",
                accessList: [{ address: to, storageKeys: [storageKey] }],
                recId: "01",
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
