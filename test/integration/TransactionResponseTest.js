import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    PrivateKey,
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TransactionResponse", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const record = await transaction.getRecord(env.client);

        expect(hex.encode(record.transactionHash)).to.be.equal(
            hex.encode(transaction.transactionHash),
        );

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should make a transaction receipt query available", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const transactionReceiptQuery = transaction.getReceiptQuery();
        expect(transactionReceiptQuery).to.not.be.null;

        const record = await transaction.getRecord(env.client);

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should make a transaction record query available", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const transactionRecordQuery = transaction.getRecordQuery();
        expect(transactionRecordQuery).to.not.be.null;

        const record = await transaction.getRecord(env.client);

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should return nextExchangeRate in receipt", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const receipt = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client)
        ).getReceipt(env.client);

        expect(receipt.nextExchangeRate).to.not.be.null;
    });

    after(async function () {
        await env.close();
    });
});
