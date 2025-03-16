import {
    AccountInfoQuery,
    AccountUpdateTransaction,
    Hbar,
    PrivateKey,
    Status,
    Timestamp,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import Long from "long";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";

describe("AccountUpdate", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;

        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(key1.publicKey)
                .setInitialBalance(new Hbar(2));
        });

        expect(accountId).to.not.be.null;

        let info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key1.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(2).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        const response = await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .setKey(key2.publicKey)
                    // .setAutoRenewPeriod(777600000)
                    // .setExpirationTime(new Date(Date.now() + 7776000000))
                    .freezeWith(env.client)
                    .sign(key1)
            ).sign(key2)
        ).execute(env.client);

        await response.getReceipt(env.client);

        info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(key2.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(2).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        await deleteAccount(env.client, key2, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId)
                .setTransactionId(TransactionId.generate(accountId));
        });
    });

    it("should error with invalid auto renew period", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(key1.publicKey)
                .setInitialBalance(new Hbar(2));
        });

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .setKey(key2.publicKey)
                            .setAutoRenewPeriod(777600000)
                            .freezeWith(env.client)
                            .sign(key1)
                    ).sign(key2)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.AutorenewDurationNotInRange.toString());
        }

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.client.operatorAccountId)
                .setTransactionId(TransactionId.generate(accountId));
        });

        if (!err) {
            throw new Error("account update did not error");
        }
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip("should error with insufficent tx fee when a large expiration time is set", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, {
            key: key1.publicKey,
            initialBalance: new Hbar(2),
        });

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .setKey(key2.publicKey)
                            .setExpirationTime(new Timestamp(Long.MAX, 0))
                            .freezeWith(env.client)
                            .sign(key1)
                    ).sign(key2)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error
                .toString()
                .includes(Status.InsufficientTxFee.toString());
        }

        if (!err) {
            throw new Error("account update did not error");
        }
    });

    it("should error when account ID is not set", async function () {
        let status;

        try {
            await (
                await new AccountUpdateTransaction()
                    .setKey(env.client.operatorPublicKey)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.AccountIdDoesNotExist);
    });

    it("should execute with only account ID", async function () {
        const key1 = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(key1.publicKey)
                .setInitialBalance(new Hbar(2));
        });

        expect(accountId).to.not.be.null;

        await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(accountId)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.client.operatorAccountId)
                .setTransactionId(TransactionId.generate(accountId));
        });
    });

    it("should error with invalid signature", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(key1.publicKey)
                .setInitialBalance(new Hbar(2));
        });

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await (
                    await new AccountUpdateTransaction()
                        .setAccountId(accountId)
                        .setKey(key2.publicKey)
                        .freezeWith(env.client)
                        .sign(key1)
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.client.operatorAccountId)
                .setTransactionId(TransactionId.generate(accountId));
        });

        if (!err) {
            throw new Error("account update did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
