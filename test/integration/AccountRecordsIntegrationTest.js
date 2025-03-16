import {
    AccountRecordsQuery,
    Hbar,
    PrivateKey,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";

describe("AccountRecords", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction
                .setKeyWithoutAlias(key.publicKey)
                .setInitialBalance(new Hbar(2));
        });

        expect(accountId).to.not.be.null;

        await (
            await new TransferTransaction()
                .addHbarTransfer(accountId, new Hbar(1))
                .addHbarTransfer(operatorId, new Hbar(1).negated())
                .execute(env.client)
        ).getReceipt(env.client);

        const records = await new AccountRecordsQuery()
            .setAccountId(operatorId)
            .setMaxQueryPayment(new Hbar(1))
            .execute(env.client);

        expect(records.length).to.be.gt(0);

        await deleteAccount(env.client, key, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId)
                .setTransactionId(TransactionId.generate(accountId));
        });
    });

    after(async function () {
        await env.close();
    });
});
