import {
    AccountInfoFlow,
    Hbar,
    KeyList,
    PrivateKey,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";

describe("AccountInfoFlow", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("verifySignature should return true for valid signature", async function () {
        const { accountId, newKey } = await createAccount(env.client);

        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const signature = newKey.sign(message);

        const result = await AccountInfoFlow.verifySignature(
            env.client,
            accountId,
            message,
            signature,
        );

        expect(result).to.be.true;

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId);
        });
    });

    it("verifySignature should return false when account key is KeyList", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const keyList = new KeyList([key1.publicKey, key2.publicKey]);

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setKeyWithoutAlias(keyList);
        });

        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const signature = key1.sign(message);

        const result = await AccountInfoFlow.verifySignature(
            env.client,
            accountId,
            message,
            signature,
        );

        expect(result).to.be.false;

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId)
                .freezeWith(env.client);
            key2.signTransaction(transaction);
        });
    });

    it("verifyTransaction should return true for valid signed transaction", async function () {
        const { accountId, newKey } = await createAccount(env.client);

        const transaction = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(1).negated())
            .addHbarTransfer(env.operatorId, new Hbar(1))
            .freezeWith(env.client);

        await transaction.sign(newKey);

        const result = await AccountInfoFlow.verifyTransaction(
            env.client,
            accountId,
            transaction,
        );

        expect(result).to.be.true;

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId);
        });
    });

    it("verifyTransaction should return false when account key is KeyList", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const keyList = new KeyList([key1.publicKey, key2.publicKey]);

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setKeyWithoutAlias(keyList);
        });

        const transaction = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(1).negated())
            .addHbarTransfer(env.operatorId, new Hbar(1))
            .freezeWith(env.client);

        await transaction.sign(key1);

        const result = await AccountInfoFlow.verifyTransaction(
            env.client,
            accountId,
            transaction,
        );

        expect(result).to.be.false;

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId)
                .freezeWith(env.client);
            key2.signTransaction(transaction);
        });
    });

    it("verifySignatureWithSigner should return true for valid signature", async function () {
        const { accountId, newKey } = await createAccount(env.client);

        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const signature = newKey.sign(message);

        const result = await AccountInfoFlow.verifySignatureWithSigner(
            env.client,
            accountId,
            message,
            signature,
        );

        expect(result).to.be.true;

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId);
        });
    });

    it("verifySignatureWithSigner should return false when account key is KeyList", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const keyList = new KeyList([key1.publicKey, key2.publicKey]);

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setKeyWithoutAlias(keyList);
        });

        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const signature = key1.sign(message);

        const result = await AccountInfoFlow.verifySignatureWithSigner(
            env.client,
            accountId,
            message,
            signature,
        );

        expect(result).to.be.false;

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId)
                .freezeWith(env.client);
            key2.signTransaction(transaction);
        });
    });

    it("verifyTransactionWithSigner should return true for valid signed transaction", async function () {
        const { accountId, newKey } = await createAccount(env.client);

        const transaction = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(1).negated())
            .addHbarTransfer(env.operatorId, new Hbar(1))
            .freezeWith(env.client);

        await transaction.sign(newKey);

        const result = await AccountInfoFlow.verifyTransactionWithSigner(
            env.client,
            accountId,
            transaction,
        );

        expect(result).to.be.true;

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId);
        });
    });

    it("verifyTransactionWithSigner should return false when account key is KeyList", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const keyList = new KeyList([key1.publicKey, key2.publicKey]);

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setKeyWithoutAlias(keyList);
        });

        const transaction = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(1).negated())
            .addHbarTransfer(env.operatorId, new Hbar(1))
            .freezeWith(env.client);

        await transaction.sign(key1);

        const result = await AccountInfoFlow.verifyTransactionWithSigner(
            env.client,
            accountId,
            transaction,
        );

        expect(result).to.be.false;

        await deleteAccount(env.client, key1, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(env.operatorId)
                .freezeWith(env.client);
            key2.signTransaction(transaction);
        });
    });

    afterAll(async function () {
        await env.close();
    });
});
