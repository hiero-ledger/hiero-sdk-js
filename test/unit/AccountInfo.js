import { AccountInfo } from "../../src/index.js";
import AccountId from "../../src/account/AccountId.js";
import PublicKey from "../../src/PublicKey.js";
import Hbar from "../../src/Hbar.js";
import Timestamp from "../../src/Timestamp.js";
import Duration from "../../src/Duration.js";
import TokenRelationshipMap from "../../src/account/TokenRelationshipMap.js";
import LedgerId from "../../src/LedgerId.js";
import StakingInfo from "../../src/StakingInfo.js";
import Long from "long";

describe("AccountInfo", function () {
    // Sample account info for testing
    let sampleAccountInfo;
    let accountId;
    let key;

    beforeEach(function () {
        accountId = new AccountId(5);
        key = PublicKey.fromString(
            "302a300506032b657003210023f9a785a0e36e59c2c3f606afb392a675ab887c86c27dcf13b7a980ddf4ad32",
        );

        sampleAccountInfo = new AccountInfo({
            accountId,
            contractAccountId: "0.0.5-vfmk",
            isDeleted: false,
            proxyAccountId: new AccountId(10),
            proxyReceived: new Hbar(20),
            key,
            balance: new Hbar(100),
            sendRecordThreshold: new Hbar(5),
            receiveRecordThreshold: new Hbar(10),
            isReceiverSignatureRequired: true,
            expirationTime: new Timestamp(1000, 0),
            autoRenewPeriod: new Duration(90 * 24 * 60 * 60), // 90 days
            liveHashes: [],
            tokenRelationships: new TokenRelationshipMap(),
            accountMemo: "test memo",
            ownedNfts: Long.fromNumber(5),
            maxAutomaticTokenAssociations: Long.fromNumber(10),
            aliasKey: key,
            ledgerId: LedgerId.MAINNET,
            hbarAllowances: [],
            tokenAllowances: [],
            nftAllowances: [],
            ethereumNonce: Long.fromNumber(42),
            stakingInfo: new StakingInfo({
                declineReward: false,
                stakePeriodStart: new Timestamp(900, 0),
                pendingReward: new Hbar(10),
                stakedAccountId: new AccountId(15),
                stakedNodeId: 5,
            }),
        });
    });

    describe("_toProtobuf", function () {
        it("should correctly convert AccountInfo to protobuf format", function () {
            const proto = sampleAccountInfo._toProtobuf();

            expect(proto.accountID).to.exist;
            expect(proto.accountID.accountNum.toNumber()).to.equal(5);

            expect(proto.contractAccountID).to.equal("0.0.5-vfmk");
            expect(proto.deleted).to.be.false;

            expect(proto.proxyAccountID).to.exist;
            expect(proto.proxyAccountID.accountNum.toNumber()).to.equal(10);

            expect(proto.proxyReceived.toNumber()).to.equal(
                new Hbar(20).toTinybars().toNumber(),
            );

            expect(proto.key).to.exist;
            expect(proto.balance.toNumber()).to.equal(
                new Hbar(100).toTinybars().toNumber(),
            );

            expect(proto.generateSendRecordThreshold.toNumber()).to.equal(
                new Hbar(5).toTinybars().toNumber(),
            );
            expect(proto.generateReceiveRecordThreshold.toNumber()).to.equal(
                new Hbar(10).toTinybars().toNumber(),
            );

            expect(proto.receiverSigRequired).to.be.true;

            expect(proto.expirationTime).to.exist;
            expect(proto.expirationTime.seconds.toNumber()).to.equal(1000);

            expect(proto.autoRenewPeriod).to.exist;
            expect(proto.autoRenewPeriod.seconds.toNumber()).to.equal(
                90 * 24 * 60 * 60,
            );

            expect(proto.memo).to.equal("test memo");
            expect(proto.ownedNfts.toNumber()).to.equal(5);
            expect(proto.maxAutomaticTokenAssociations).to.equal(10);

            expect(proto.alias).to.exist;
            expect(proto.ledgerId).to.exist;
            expect(proto.ethereumNonce.toNumber()).to.equal(42);

            expect(proto.stakingInfo).to.exist;
            expect(
                proto.stakingInfo.stakedAccountId.accountNum.toNumber(),
            ).to.equal(15);
        });

        it("should handle null values correctly", function () {
            const accountInfoWithNulls = new AccountInfo({
                accountId,
                contractAccountId: null,
                isDeleted: false,
                proxyAccountId: null,
                proxyReceived: new Hbar(0),
                key,
                balance: new Hbar(0),
                sendRecordThreshold: new Hbar(0),
                receiveRecordThreshold: new Hbar(0),
                isReceiverSignatureRequired: false,
                expirationTime: new Timestamp(0, 0),
                autoRenewPeriod: new Duration(0),
                liveHashes: [],
                tokenRelationships: new TokenRelationshipMap(),
                accountMemo: "",
                ownedNfts: Long.ZERO,
                maxAutomaticTokenAssociations: Long.ZERO,
                aliasKey: null,
                ledgerId: null,
                hbarAllowances: [],
                tokenAllowances: [],
                nftAllowances: [],
                ethereumNonce: null,
                stakingInfo: null,
            });

            const proto = accountInfoWithNulls._toProtobuf();

            expect(proto.contractAccountID).to.be.null;
            expect(proto.proxyAccountID).to.be.null;
            expect(proto.alias).to.be.null;
            expect(proto.ledgerId).to.be.null;
            expect(proto.ethereumNonce).to.be.null;
            expect(proto.stakingInfo).to.be.null;
        });
    });

    describe("toJSON", function () {
        it("should correctly convert AccountInfo to JSON representation", function () {
            const json = sampleAccountInfo.toJSON();

            expect(json.accountId).to.equal("0.0.5");
            expect(json.contractAccountId).to.equal("0.0.5-vfmk");
            expect(json.isDeleted).to.be.false;
            expect(json.proxyAccountId).to.equal("0.0.10");
            expect(json.proxyReceived).to.equal("20 ℏ");
            expect(json.key).to.exist;
            expect(json.balance).to.equal("100 ℏ");
            expect(json.sendRecordThreshold).to.equal("5 ℏ");
            expect(json.receiveRecordThreshold).to.equal("10 ℏ");
            expect(json.isReceiverSignatureRequired).to.be.true;
            expect(json.expirationTime).to.equal(
                new Timestamp(1000, 0).toString(),
            );
            expect(json.autoRenewPeriod).to.exist;
            expect(json.accountMemo).to.equal("test memo");
            expect(json.ownedNfts).to.equal("5");
            expect(json.maxAutomaticTokenAssociations).to.equal("10");
            expect(json.aliasKey).to.exist;
            expect(json.ledgerId).to.equal("mainnet");
            expect(json.ethereumNonce).to.equal("42");
            expect(json.stakingInfo).to.exist;
            expect(json.stakingInfo.stakedAccountId).to.equal("0.0.15");
        });

        it("should handle null values correctly in JSON representation", function () {
            const accountInfoWithNulls = new AccountInfo({
                accountId,
                contractAccountId: null,
                isDeleted: false,
                proxyAccountId: null,
                proxyReceived: new Hbar(0),
                key,
                balance: new Hbar(0),
                sendRecordThreshold: new Hbar(0),
                receiveRecordThreshold: new Hbar(0),
                isReceiverSignatureRequired: false,
                expirationTime: new Timestamp(0, 0),
                autoRenewPeriod: new Duration(0),
                liveHashes: [],
                tokenRelationships: new TokenRelationshipMap(),
                accountMemo: "",
                ownedNfts: Long.ZERO,
                maxAutomaticTokenAssociations: Long.ZERO,
                aliasKey: null,
                ledgerId: null,
                hbarAllowances: [],
                tokenAllowances: [],
                nftAllowances: [],
                ethereumNonce: null,
                stakingInfo: null,
            });

            const json = accountInfoWithNulls.toJSON();

            expect(json.contractAccountId).to.be.null;
            expect(json.proxyAccountId).to.be.null;
            expect(json.proxyReceived).to.equal("0 tℏ");
            expect(json.aliasKey).to.be.null;
            expect(json.ledgerId).to.be.null;
            expect(json.ethereumNonce).to.be.null;
            expect(json.stakingInfo).to.be.null;
        });
    });
});
