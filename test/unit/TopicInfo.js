import { expect } from "chai";
import Duration from "../../src/Duration.js";
import {
    AccountId,
    CustomFixedFee,
    LedgerId,
    Long,
    PrivateKey,
    Timestamp,
    TokenId,
    TopicId,
    TopicInfo,
} from "../../src/index.js";

describe("TopicInfo", function () {
    it("encodes to correct protobuf", function () {
        const adminKey = PrivateKey.generateED25519();
        const submitKey = PrivateKey.generateED25519();
        const feeScheduleKey = PrivateKey.generateED25519();
        const feeExemptKeys = [
            PrivateKey.generateED25519(),
            PrivateKey.generateED25519(),
        ];

        const denominatingTokenId = new TokenId(0);
        const amount = 100;

        const customFees = [
            new CustomFixedFee({ denominatingTokenId, amount }),
        ];
        const autoRenewAccountId = new AccountId(1, 2, 3);
        const autoRenewPeriod = new Duration(123);
        const topicId = new TopicId(0);
        const topicMemo = "topic";
        const runningHash = Uint8Array.from([0]);
        const expirationTime = new Timestamp(123, 456);
        const sequenceNumber = 0;
        const ledgerId = LedgerId.MAINNET;

        const topicInfo = new TopicInfo({
            topicId,
            topicMemo,
            runningHash,
            sequenceNumber,
            expirationTime,
            adminKey,
            submitKey,
            feeScheduleKey,
            feeExemptKeys,
            customFees,
            autoRenewAccountId,
            autoRenewPeriod,
            ledgerId,
        });

        const expectedProtobuf = {
            topicID: topicId._toProtobuf(),
            topicInfo: {
                memo: topicMemo,
                runningHash: runningHash,
                sequenceNumber: sequenceNumber,
                expirationTime: expirationTime._toProtobuf(),
                adminKey: adminKey._toProtobufKey(),
                submitKey: submitKey._toProtobufKey(),
                feeScheduleKey: feeScheduleKey._toProtobufKey(),
                customFees: customFees.map((fee) => fee._toProtobuf()),
                feeExemptKeyList: feeExemptKeys.map((key) =>
                    key._toProtobufKey(),
                ),
                autoRenewAccount: autoRenewAccountId._toProtobuf(),
                autoRenewPeriod: autoRenewPeriod,
            },
        };

        expect(topicInfo._toProtobuf()).to.deep.equal(expectedProtobuf);
    });

    it("decodes from correct protobuf", function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const submitKey = PrivateKey.generateED25519().publicKey;
        const feeScheduleKey = PrivateKey.generateED25519().publicKey;
        const feeExemptKeys = [
            PrivateKey.generateED25519().publicKey,
            PrivateKey.generateED25519().publicKey,
        ];
        const denominatingTokenId = new TokenId(0);
        const amount = 100;
        const customFees = [
            new CustomFixedFee({ denominatingTokenId, amount }),
        ];
        const autoRenewAccountId = new AccountId(1, 2, 3);
        const autoRenewPeriod = new Duration(123);
        const topicId = new TopicId(0);
        const topicMemo = "topic";
        const runningHash = Uint8Array.from([0]);
        const expirationTime = new Timestamp(123, 456);
        const sequenceNumber = Long.fromString("0");

        const expectedProtobuf = {
            topicID: topicId._toProtobuf(),
            topicInfo: {
                memo: topicMemo,
                runningHash: runningHash,
                sequenceNumber: sequenceNumber.toBytes(),
                expirationTime: expirationTime._toProtobuf(),
                adminKey: adminKey._toProtobufKey(),
                submitKey: submitKey._toProtobufKey(),
                feeScheduleKey: feeScheduleKey._toProtobufKey(),
                customFees: customFees.map((fee) => fee._toProtobuf()),
                feeExemptKeyList: feeExemptKeys.map((key) =>
                    key._toProtobufKey(),
                ),
                autoRenewAccount: autoRenewAccountId._toProtobuf(),
                autoRenewPeriod: autoRenewPeriod,
            },
        };

        const topicInfo = new TopicInfo({
            topicId,
            topicMemo,
            runningHash,
            sequenceNumber,
            expirationTime,
            adminKey,
            submitKey,
            feeScheduleKey,
            feeExemptKeys,
            customFees,
            autoRenewAccountId,
            autoRenewPeriod,
            ledgerId: null,
        });

        expect(TopicInfo._fromProtobuf(expectedProtobuf)).to.deep.equal(
            topicInfo,
        );
    });

    it("should decode/encode correctly", function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const submitKey = PrivateKey.generateED25519().publicKey;
        const autoRenewAccountId = new AccountId(1, 2, 3);
        const autoRenewPeriod = new Duration(123);
        const topicId = new TopicId(0);
        const topicMemo = "topic";
        const runningHash = Uint8Array.from([0]);
        const expirationTime = new Timestamp(123, 456);
        const sequenceNumber = Long.fromString("0");

        const topicInfo = new TopicInfo({
            topicId,
            topicMemo,
            runningHash,
            sequenceNumber,
            expirationTime,
            adminKey,
            submitKey,
            autoRenewAccountId,
            autoRenewPeriod,
        });

        const topicInfoBytes = topicInfo.toBytes();
        const topicInfo2 = TopicInfo.fromBytes(topicInfoBytes);

        expect(topicInfo2.adminKey.toString()).to.eql(adminKey.toString());
        expect(topicInfo2.submitKey.toString()).to.eql(submitKey.toString());
        expect(topicInfo2.autoRenewAccountId.toString()).to.eql(
            autoRenewAccountId.toString(),
        );
        expect(topicInfo2.autoRenewPeriod.seconds.toInt()).to.eql(
            autoRenewPeriod.seconds.toInt(),
        );
        expect(topicInfo2.topicId.toString()).to.eql(topicId.toString());
        expect(topicInfo2.topicMemo).to.eql(topicMemo);
        expect(topicInfo2.runningHash).to.eql(runningHash);
        expect(topicInfo2.expirationTime.seconds).to.eql(
            expirationTime.seconds,
        );
        expect(topicInfo2.expirationTime.nanos).to.eql(expirationTime.nanos);
        expect(topicInfo2.sequenceNumber.toInt()).to.eql(
            sequenceNumber.toInt(),
        );
    });
});
