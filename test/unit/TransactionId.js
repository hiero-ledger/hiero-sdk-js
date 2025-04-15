import { TransactionId, AccountId, Timestamp } from "../../src/index.js";
import Long from "long";

describe("TransactionId", function () {
    it("[to|from]Bytes()", function () {
        let transactionId = TransactionId.fromString("1.2.3@4.5/6");

        expect(
            TransactionId.fromBytes(transactionId.toBytes())._toProtobuf(),
        ).to.deep.equal({
            accountID: {
                shardNum: Long.fromNumber(1),
                realmNum: Long.fromNumber(2),
                accountNum: Long.fromNumber(3),
                alias: null,
            },
            transactionValidStart: {
                seconds: Long.fromNumber(4),
                nanos: 5,
            },
            scheduled: false,
            nonce: 6,
        });

        transactionId = TransactionId.fromString("1.2.3@4.5?scheduled/6");

        expect(
            TransactionId.fromBytes(transactionId.toBytes())._toProtobuf(),
        ).to.deep.equal({
            accountID: {
                shardNum: Long.fromNumber(1),
                realmNum: Long.fromNumber(2),
                accountNum: Long.fromNumber(3),
                alias: null,
            },
            transactionValidStart: {
                seconds: Long.fromNumber(4),
                nanos: 5,
            },
            scheduled: true,
            nonce: 6,
        });

        transactionId = TransactionId.fromString("1.2.3@4.5");

        expect(
            TransactionId.fromBytes(transactionId.toBytes())._toProtobuf(),
        ).to.deep.equal({
            accountID: {
                shardNum: Long.fromNumber(1),
                realmNum: Long.fromNumber(2),
                accountNum: Long.fromNumber(3),
                alias: null,
            },
            transactionValidStart: {
                seconds: Long.fromNumber(4),
                nanos: 5,
            },
            scheduled: false,
            nonce: null,
        });
    });

    it("should parse {shard}.{realm}.{num}@{seconds}.{nanos}", function () {
        const transactionId = TransactionId.fromString("1.2.3@4.5");

        expect(transactionId.toString()).to.be.equal("1.2.3@4.000000005");
    });

    it("should parse {num}@{seconds}.{nanos}", function () {
        const transactionId = TransactionId.fromString("3@4.5");

        expect(transactionId.toString()).to.be.equal("0.0.3@4.000000005");
    });

    it("should parse {shard}.{realm}.{num}@{seconds}.{nanos}?scheduled", function () {
        const transactionId = TransactionId.fromString("1.2.3@4.5?scheduled");

        expect(transactionId.toString()).to.be.equal(
            "1.2.3@4.000000005?scheduled",
        );
    });

    it("should parse {num}@{seconds}.{nanos}?scheduled", function () {
        const transactionId = TransactionId.fromString("3@4.5?scheduled");

        expect(transactionId.toString()).to.be.equal(
            "0.0.3@4.000000005?scheduled",
        );
    });

    it("should construct with nonce", function () {
        const accountId = AccountId.fromString("1.1.1");
        const validStart = new Timestamp(5, 4);
        const nonce = 117;
        const transactionId = new TransactionId(
            accountId,
            validStart,
            true,
            nonce,
        );

        expect(transactionId.toString().includes("/117")).to.be.true;
    });

    it("should construct with scheduled without nonce", function () {
        const accountId = AccountId.fromString("1.1.1");
        const validStart = new Timestamp(5, 4);
        let transactionId = new TransactionId(accountId, validStart, true);

        expect(transactionId.toString()).to.equal(
            "1.1.1@5.000000004?scheduled",
        );

        transactionId = new TransactionId(accountId, validStart, true, null);

        expect(transactionId.toString()).to.equal(
            "1.1.1@5.000000004?scheduled",
        );

        transactionId = new TransactionId(
            accountId,
            validStart,
            true,
            undefined,
        );

        expect(transactionId.toString()).to.equal(
            "1.1.1@5.000000004?scheduled",
        );
    });

    it("should construct with nonce without scheduled", function () {
        const accountId = AccountId.fromString("1.1.1");
        const validStart = new Timestamp(5, 4);
        const nonce = 117;
        let transactionId = new TransactionId(
            accountId,
            validStart,
            null,
            nonce,
        );

        expect(transactionId.toString()).to.equal("1.1.1@5.000000004/117");

        transactionId = new TransactionId(accountId, validStart, NaN, nonce);

        expect(transactionId.toString()).to.equal("1.1.1@5.000000004/117");

        transactionId = new TransactionId(
            accountId,
            validStart,
            undefined,
            nonce,
        );

        expect(transactionId.toString()).to.equal("1.1.1@5.000000004/117");
    });

    it("should construct without scheduled and nonce", function () {
        const accountId = AccountId.fromString("1.1.1");
        const validStart = new Timestamp(5, 4);
        let transactionId = new TransactionId(
            accountId,
            validStart,
            null,
            null,
        );

        expect(transactionId.toString()).to.equal("1.1.1@5.000000004");

        transactionId = new TransactionId(
            accountId,
            validStart,
            undefined,
            undefined,
        );

        expect(transactionId.toString()).to.equal("1.1.1@5.000000004");
    });

    it("should construct fromString", function () {
        let stringId = "1.1.1@5.4?scheduled/117";
        let transactionId = TransactionId.fromString(stringId).toString();

        expect(transactionId).to.eql("1.1.1@5.000000004?scheduled/117");
    });

    it("should construct fromString without nonce", function () {
        let stringId = "1.1.1@5.4?scheduled";
        let transactionId = TransactionId.fromString(stringId).toString();

        expect(transactionId).to.eql("1.1.1@5.000000004?scheduled");
    });

    it("should construct fromString without scheduled", function () {
        let stringId = "1.1.1@5.4/117";
        let transactionId = TransactionId.fromString(stringId).toString();

        expect(transactionId).to.eql("1.1.1@5.000000004/117");
    });

    it("should construct fromString without nonce and scheduled", function () {
        let stringId = "1.1.1@5.4";
        let transactionId = TransactionId.fromString(stringId).toString();

        expect(transactionId).to.eql("1.1.1@5.000000004");
    });

    it("should be able to update nonce with a number or date", function () {
        let stringId = "1.1.1@5.4";
        const transactionId = TransactionId.fromString(stringId);
        let nonceToSet = Number(1657293681585);
        let secondNonceToSet = new Date(1657293681585);

        try {
            transactionId.setNonce(nonceToSet);
        } catch (err) {
            throw new Error("Unable to set nonce for number: " + err);
        }

        expect(parseInt(transactionId.nonce)).equals(nonceToSet);

        try {
            transactionId.setNonce(secondNonceToSet);
        } catch (err) {
            throw new Error("Unable to set nonce for number: " + err);
        }

        expect(new Date(transactionId.nonce).getTime()).equals(
            secondNonceToSet.getTime(),
        );
    });
});
