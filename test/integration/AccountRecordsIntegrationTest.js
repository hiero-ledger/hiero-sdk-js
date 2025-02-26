import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    AccountRecordsQuery,
    Hbar,
    PrivateKey,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("AccountRecords", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
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

        await (
            await new TransferTransaction()
                .addHbarTransfer(account, new Hbar(1))
                .addHbarTransfer(operatorId, new Hbar(1).negated())
                .execute(env.client)
        ).getReceipt(env.client);

        const records = await new AccountRecordsQuery()
            .setAccountId(operatorId)
            .setMaxQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(records.length).to.be.gt(0);

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

    after(async function () {
        await env.close();
    });
});
