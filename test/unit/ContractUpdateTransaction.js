import {
    ContractUpdateTransaction,
    ContractId,
    AccountId,
    FileId,
    Timestamp,
    PrivateKey,
} from "../../src/index.js";
import Duration from "../../src/Duration.js";
import Long from "long";

describe("ContractUpdateTransaction", function () {
    describe("constructor", function () {
        it("should set all properties correctly via constructor", function () {
            const contractId = new ContractId(1);
            const expirationTime = new Timestamp(500, 600);
            const adminKey = PrivateKey.generateED25519().publicKey;
            const proxyAccountId = new AccountId(2);
            const autoRenewPeriod = new Duration(7000);
            const bytecodeFileId = new FileId(3);
            const contractMemo = "test memo";
            const maxAutomaticTokenAssociations = 10;
            const stakedAccountId = new AccountId(4);
            const stakedNodeId = Long.fromNumber(5);
            const declineStakingReward = true;
            const autoRenewAccountId = new AccountId(6);

            const tx = new ContractUpdateTransaction({
                contractId,
                expirationTime,
                adminKey,
                proxyAccountId,
                autoRenewPeriod,
                bytecodeFileId,
                contractMemo,
                maxAutomaticTokenAssociations,
                stakedAccountId,
                stakedNodeId,
                declineStakingReward,
                autoRenewAccountId,
            });

            expect(tx.contractId.toString()).to.equal(contractId.toString());
            expect(tx.expirationTime).to.equal(expirationTime);
            expect(tx.adminKey).to.equal(adminKey);
            expect(tx.proxyAccountId.toString()).to.equal(
                proxyAccountId.toString(),
            );
            expect(tx.autoRenewPeriod.toString()).to.equal(
                autoRenewPeriod.toString(),
            );
            expect(tx.bytecodeFileId.toString()).to.equal(
                bytecodeFileId.toString(),
            );
            expect(tx.contractMemo).to.equal(contractMemo);
            expect(tx.maxAutomaticTokenAssociations).to.equal(
                maxAutomaticTokenAssociations,
            );
            expect(tx.stakedAccountId.toString()).to.equal(
                stakedAccountId.toString(),
            );
            expect(tx.stakedNodeId.toString()).to.equal(
                stakedNodeId.toString(),
            );
            expect(tx.declineStakingRewards).to.equal(declineStakingReward);
            expect(tx.autoRenewAccountId.toString()).to.equal(
                autoRenewAccountId.toString(),
            );
        });

        it("should accept string values for IDs in constructor", function () {
            const tx = new ContractUpdateTransaction({
                contractId: "0.0.1",
                proxyAccountId: "0.0.2",
                bytecodeFileId: "0.0.3",
                stakedAccountId: "0.0.4",
                autoRenewAccountId: "0.0.5",
            });

            expect(tx.contractId.toString()).to.equal("0.0.1");
            expect(tx.proxyAccountId.toString()).to.equal("0.0.2");
            expect(tx.bytecodeFileId.toString()).to.equal("0.0.3");
            expect(tx.stakedAccountId.toString()).to.equal("0.0.4");
            expect(tx.autoRenewAccountId.toString()).to.equal("0.0.5");
        });

        it("should accept Date for expirationTime in constructor", function () {
            const date = new Date();

            const tx = new ContractUpdateTransaction({
                expirationTime: date,
            });

            expect(tx.expirationTime.toDate().getTime()).to.equal(
                date.getTime(),
            );
        });

        it("should accept number or Long for autoRenewPeriod in constructor", function () {
            const numberPeriod = 8000;
            const tx1 = new ContractUpdateTransaction({
                autoRenewPeriod: numberPeriod,
            });

            expect(tx1.autoRenewPeriod.seconds.toNumber()).to.equal(
                numberPeriod,
            );

            const longPeriod = Long.fromNumber(9000);
            const tx2 = new ContractUpdateTransaction({
                autoRenewPeriod: longPeriod,
            });

            expect(tx2.autoRenewPeriod.seconds.toNumber()).to.equal(
                longPeriod.toNumber(),
            );
        });

        it("should accept number and Long for stakedNodeId in constructor", function () {
            const numberNodeId = 6;
            const tx1 = new ContractUpdateTransaction({
                stakedNodeId: numberNodeId,
            });

            expect(tx1.stakedNodeId.toNumber()).to.equal(numberNodeId);

            const longNodeId = Long.fromNumber(7);
            const tx2 = new ContractUpdateTransaction({
                stakedNodeId: longNodeId,
            });

            expect(tx2.stakedNodeId.toNumber()).to.equal(longNodeId.toNumber());
        });
    });

    describe("deserialization of optional parameters", function () {
        it("should deserialize with contractMemo being null", function () {
            const tx = new ContractUpdateTransaction();
            const tx2 = ContractUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.contractMemo).to.be.null;
            expect(tx2.contractMemo).to.be.null;
        });
    });

    describe("serialization and deserialization", function () {
        it("should maintain all properties after serialization and deserialization", function () {
            const originalTx = new ContractUpdateTransaction({
                contractId: "0.0.1",
                expirationTime: new Timestamp(500, 600),
                autoRenewPeriod: 7000,
                contractMemo: "test memo",
                maxAutomaticTokenAssociations: 10,
                stakedNodeId: 5,
                declineStakingReward: true,
                autoRenewAccountId: "0.0.6",
            });

            const recreatedTx = ContractUpdateTransaction.fromBytes(
                originalTx.toBytes(),
            );

            expect(recreatedTx.contractId.toString()).to.equal("0.0.1");
            expect(recreatedTx.expirationTime.seconds.toString()).to.equal(
                "500",
            );
            expect(recreatedTx.expirationTime.nanos.toString()).to.equal("600");
            expect(recreatedTx.autoRenewPeriod.seconds.toString()).to.equal(
                "7000",
            );
            expect(recreatedTx.contractMemo).to.equal("test memo");
            expect(recreatedTx.maxAutomaticTokenAssociations).to.equal(10);
            expect(recreatedTx.stakedNodeId.toString()).to.equal("5");
            expect(recreatedTx.declineStakingRewards).to.equal(true);
            expect(recreatedTx.autoRenewAccountId.toString()).to.equal("0.0.6");
        });
    });
});
