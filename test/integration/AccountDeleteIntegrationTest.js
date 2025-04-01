import {
    AccountDeleteTransaction,
    AccountInfoQuery,
    Hbar,
    Status,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";

describe("AccountDelete", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;

        const { accountId, newKey } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        const info = await new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(info.accountId.toString()).to.be.equal(accountId.toString());
        expect(info.isDeleted).to.be.false;
        expect(info.key.toString()).to.be.equal(newKey.publicKey.toString());
        expect(info.balance.toTinybars().toInt()).to.be.equal(
            new Hbar(1).toTinybars().toInt(),
        );
        expect(info.autoRenewPeriod.seconds.toNumber()).to.be.equal(7776000);
        expect(info.proxyAccountId).to.be.null;
        expect(info.proxyReceived.toTinybars().toInt()).to.be.equal(0);

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(accountId)
                    .setTransferAccountId(operatorId)
                    .setTransactionId(TransactionId.generate(accountId))
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error with invalid signature", async function () {
        const operatorId = env.operatorId;

        const { accountId } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        let err = false;

        try {
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(accountId)
                    .setTransferAccountId(operatorId)
                    .setTransactionId(TransactionId.generate(accountId))
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidSignature.toString());
        }

        if (!err) {
            throw new Error("account deletion did not error");
        }
    });

    it("should error with no account ID set", async function () {
        let status;

        try {
            await (
                await new AccountDeleteTransaction()
                    .setTransferAccountId(env.operatorId)
                    .freezeWith(env.client)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            status = error.status;
        }

        expect(status).to.be.eql(Status.AccountIdDoesNotExist);
    });

    after(async function () {
        await env.close();
    });
});
