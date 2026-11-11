// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    AccountUpdateTransaction,
    PrivateKey,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import Duration from "../../src/Duration.js";

describe("Account update wire contract", function () {
    const key = PrivateKey.fromStringED25519("11".repeat(32)).publicKey;

    it("preserves optional constructor fields through bytes without losing false or zero values", function () {
        const expiration = new Date("2030-01-01T00:00:00Z");
        const transaction = new AccountUpdateTransaction({
            accountId: new AccountId(100),
            key,
            receiverSignatureRequired: false,
            autoRenewPeriod: new Duration(7890000),
            expirationTime: expiration,
            accountMemo: "release fixture",
            maxAutomaticTokenAssociations: 0,
            stakedAccountId: "0.0.101",
            declineStakingReward: false,
        });
        const restored = Transaction.fromBytes(transaction.toBytes());
        expect(restored).to.be.instanceOf(AccountUpdateTransaction);
        expect(restored.accountId.toString()).to.equal("0.0.100");
        expect(restored.key.toString()).to.equal(key.toString());
        expect(restored.receiverSignatureRequired).to.be.false;
        expect(restored.autoRenewPeriod.seconds.toString()).to.equal("7890000");
        expect(restored.expirationTime.toDate().toISOString()).to.equal(
            expiration.toISOString(),
        );
        expect(restored.accountMemo).to.equal("release fixture");
        expect(restored.maxAutomaticTokenAssociations.toString()).to.equal("0");
        expect(restored.stakedAccountId.toString()).to.equal("0.0.101");
        expect(restored.declineStakingRewards).to.be.false;
        expect(restored.toBytes()).to.deep.equal(transaction.toBytes());
    });

    it("preserves node staking and both protocol removal sentinels through bytes", function () {
        const byNode = new AccountUpdateTransaction({
            accountId: new AccountId(100),
            stakedNodeId: 3,
        });
        expect(
            Transaction.fromBytes(byNode.toBytes()).stakedNodeId.toString(),
        ).to.equal("3");
        byNode.clearStakedNodeId();
        expect(
            Transaction.fromBytes(byNode.toBytes()).stakedNodeId.toString(),
        ).to.equal("-1");
        const byAccount = new AccountUpdateTransaction({
            stakedAccountId: "0.0.101",
        }).clearStakedAccountId();
        expect(
            Transaction.fromBytes(
                byAccount.toBytes(),
            ).stakedAccountId.toString(),
        ).to.equal("0.0.0");
    });

    it("accepts a Timestamp expiry and numeric renewal period", function () {
        const transaction = new AccountUpdateTransaction({
            expirationTime: new Timestamp(2000000000, 123),
            autoRenewPeriod: 7890000,
        });
        const restored = Transaction.fromBytes(transaction.toBytes());
        expect(restored.expirationTime.toString()).to.equal(
            "2000000000.000000123",
        );
        expect(restored.autoRenewPeriod.seconds.toString()).to.equal("7890000");
    });
});
