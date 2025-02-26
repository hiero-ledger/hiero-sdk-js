import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    AccountInfoQuery,
    Hbar,
    PrivateKey,
    Status,
    TokenCreateTransaction,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("AccountInfo", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be able to query cost", async function () {
        const operatorId = env.operatorId;

        const cost = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .getCost(env.client);

        expect(cost.toTinybars().toInt()).to.be.at.least(1);
    });

    it("should error on query cost on deleted account with ACCOUNT_DELETED", async function () {
        const newKey = PrivateKey.generate();

        let createTransaction = await new AccountCreateTransaction()
            .setInitialBalance(new Hbar(10)) // 10 h
            .setKeyWithoutAlias(newKey.publicKey)
            .execute(env.client);

        const receiptCreateTransaction = await createTransaction.getReceipt(
            env.client,
        );

        let deleteTransaction = await new AccountDeleteTransaction()
            .setAccountId(receiptCreateTransaction.accountId)
            .setTransferAccountId(env.operatorId)
            .freezeWith(env.client);

        newKey.signTransaction(deleteTransaction);
        const deleteTransactionSubmitted = await deleteTransaction.execute(
            env.client,
        );

        await deleteTransactionSubmitted.getReceipt(env.client);

        let err;
        try {
            await new AccountInfoQuery()
                .setAccountId(receiptCreateTransaction.accountId)
                .getCost(env.client);
        } catch (error) {
            err = error.toString().includes(Status.AccountDeleted.toString());
        }

        if (!err) {
            throw new Error("query cost did not error");
        }
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .setInitialBalance(new Hbar(2))
            .execute(env.client);

        const receipt = await response.getReceipt(env.client);

        expect(receipt.accountId).to.not.be.null;
        const account = receipt.accountId;

        const info = await new AccountInfoQuery()
            .setAccountId(account)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(account.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(2).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .setTransactionId(TransactionId.generate(account))
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("should be able to get 300 accounts", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();
        let response = [];
        let receipt = [];
        let info = [];

        for (let i = 0; i < 300; i++) {
            response[i] = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .setInitialBalance(new Hbar(2))
                .execute(env.client);
        }

        for (let i = 0; i < 300; i++) {
            receipt[i] = await response[i].getReceipt(env.client);
        }

        for (let i = 0; i < 300; i++) {
            info[i] = await new AccountInfoQuery()
                .setAccountId(receipt[i].accountId)
                .execute(env.client);
        }

        for (let i = 0; i < 300; i++) {
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(receipt[i].accountId)
                        .setTransferAccountId(operatorId)
                        .setTransactionId(
                            TransactionId.generate(receipt[i].accountId),
                        )
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        }
    });

    it("should reflect token with no keys", async function () {
        const operatorId = env.operatorId;

        const token = (
            await (
                await new TokenCreateTransaction()
                    .setTokenName("ffff")
                    .setTokenSymbol("F")
                    .setTreasuryAccountId(operatorId)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).tokenId;

        const info = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .execute(env.client);

        const relationship = info.tokenRelationships.get(token);

        expect(relationship).to.be.not.null;
        expect(relationship.tokenId.toString()).to.be.equal(token.toString());
        expect(relationship.balance.toInt()).to.be.equal(0);
        expect(relationship.isKycGranted).to.be.null;
        expect(relationship.isFrozen).to.be.null;
    });

    it("should be error with no account ID", async function () {
        let err = false;

        try {
            await new AccountInfoQuery().execute(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountId.toString());
        }

        if (!err) {
            throw new Error("query did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
