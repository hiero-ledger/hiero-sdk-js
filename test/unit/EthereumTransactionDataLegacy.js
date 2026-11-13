import * as hex from "../../src/encoding/hex.js";
import * as rlp from "../../src/encoding/rlp.js";
import EvmAddress from "../../src/EvmAddress.js";
import EthereumTransactionDataLegacy from "../../src/EthereumTransactionDataLegacy.js";

// A signed legacy transaction with nonce 1, gas price 0x2f, gas limit
// 0x018000, a recipient, no value and call data 0x7653.
const rawTx = hex.decode(
    "f864012f83018000947e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc18180827653820277a0f9fbff985d374be4a55f296915002eec11ac96f1ce2df183adf992baa9390b2fa00c1e867cc960d9c74ec2e6a662b7908ec4c8cc9f3091e886bcefbeb2290fb792",
);

const to = "7e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc181";
const r = "f9fbff985d374be4a55f296915002eec11ac96f1ce2df183adf992baa9390b2f";
const s = "0c1e867cc960d9c74ec2e6a662b7908ec4c8cc9f3091e886bcefbeb2290fb792";

describe("EthereumTransactionDataLegacy", function () {
    describe("getters", function () {
        let data;

        beforeEach(function () {
            data = EthereumTransactionDataLegacy.fromBytes(rawTx);
        });

        it("return the nonce", function () {
            expect(data.getNonce().toNumber()).to.equal(1);
            expect(data.getNonceBytes()).to.deep.equal(hex.decode("01"));
        });

        it("return the gas price and gas limit bytes", function () {
            expect(data.getGasPriceBytes()).to.deep.equal(hex.decode("2f"));
            expect(data.getGasLimitBytes()).to.deep.equal(hex.decode("018000"));
        });

        it("return the recipient", function () {
            expect(data.getTo().toString()).to.equal(to);
            expect(data.getToBytes()).to.deep.equal(hex.decode(to));
        });

        it("return the value", function () {
            expect(data.getValue().toFixed()).to.equal("0");
            expect(data.getValueBytes()).to.deep.equal(new Uint8Array());
        });

        it("return the call data", function () {
            expect(data.getCallData()).to.deep.equal(hex.decode("7653"));
        });

        it("return the signature", function () {
            expect(data.getV().toNumber()).to.equal(0x0277);
            expect(data.getVBytes()).to.deep.equal(hex.decode("0277"));
            expect(data.getR()).to.deep.equal(hex.decode(r));
            expect(data.getS()).to.deep.equal(hex.decode(s));
        });
    });

    describe("setters", function () {
        it("setTo() takes an EvmAddress or a hex string and survives toBytes() and fromBytes()", function () {
            const other = "0000000000000000000000000000000000000abc";
            const data = EthereumTransactionDataLegacy.fromBytes(rawTx);

            expect(data.setTo(EvmAddress.fromString(other))).to.equal(data);
            expect(data.getToBytes()).to.deep.equal(hex.decode(other));

            data.setTo(`0x${to}`);
            const decoded = EthereumTransactionDataLegacy.fromBytes(
                data.toBytes(),
            );

            expect(decoded.getTo().toString()).to.equal(to);
        });

        it("setCallData() changes the call data and survives toBytes() and fromBytes()", function () {
            const data = EthereumTransactionDataLegacy.fromBytes(rawTx);

            expect(data.setCallData(hex.decode("abcdef"))).to.equal(data);

            const decoded = EthereumTransactionDataLegacy.fromBytes(
                data.toBytes(),
            );

            expect(decoded.getCallData()).to.deep.equal(hex.decode("abcdef"));
        });
    });

    describe("fromBytes() errors", function () {
        it("throws for empty bytes", function () {
            expect(() =>
                EthereumTransactionDataLegacy.fromBytes(new Uint8Array()),
            ).to.throw("empty bytes");
        });

        it("throws for an RLP byte string instead of a list", function () {
            expect(() =>
                EthereumTransactionDataLegacy.fromBytes(
                    rlp.encode(hex.decode("0102")),
                ),
            ).to.throw("invalid ethereum transaction data");
        });

        it("throws for a list with one field too few", function () {
            const fields = rlp.decode(rawTx).slice(0, 8);

            expect(() =>
                EthereumTransactionDataLegacy.fromBytes(rlp.encode(fields)),
            ).to.throw("invalid ethereum transaction data");
        });
    });

    describe("toJSON() and toString()", function () {
        it("toJSON() returns every field as hex", function () {
            const data = EthereumTransactionDataLegacy.fromBytes(rawTx);

            expect(data.toJSON()).to.deep.equal({
                nonce: "01",
                gasPrice: "2f",
                gasLimit: "018000",
                to,
                value: "",
                callData: "7653",
                v: "0277",
                r,
                s,
            });
        });

        it("toString() returns toJSON() as JSON", function () {
            const data = EthereumTransactionDataLegacy.fromBytes(rawTx);

            expect(JSON.parse(data.toString())).to.deep.equal(data.toJSON());
            expect(data.toString()).to.equal(
                JSON.stringify(data.toJSON(), null, 2),
            );
        });
    });
});
