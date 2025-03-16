import {
    Hbar,
    PrivateKey,
    Status,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";

describe("CryptoTransfer", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;

        const { accountId, newKey } = await createAccount(
            env.client,
            (transaction) => {
                transaction.setInitialBalance(new Hbar(2));
            },
        );

        expect(accountId).to.not.be.null;

        await (
            await new TransferTransaction()
                .addHbarTransfer(accountId, new Hbar(1))
                .addHbarTransfer(operatorId, new Hbar(-1))
                .execute(env.client)
        ).getReceipt(env.client);

        await deleteAccount(env.client, newKey, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId)
                .setTransactionId(TransactionId.generate(accountId));
        });
    });

    it("should error when there is invalid account amounts", async function () {
        const operatorId = env.operatorId;
        const key = PrivateKey.generateED25519();

        const { accountId } = await createAccount(env.client, (transaction) => {
            transaction.setKeyWithoutAlias(key).setInitialBalance(new Hbar(0));
        });

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await new TransferTransaction()
                    .addHbarTransfer(accountId, new Hbar(1))
                    .addHbarTransfer(operatorId, new Hbar(1))
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountAmounts);
        }

        if (!err) {
            throw new Error("Crypto transfer did not error.");
        }
    });

    after(async function () {
        await env.close();
    });
});
