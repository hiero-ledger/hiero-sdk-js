import {
    LiveHashAddTransaction,
    LiveHashDeleteTransaction,
    LiveHashQuery,
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, deleteAccount } from "./utils/Fixtures.js";
import Long from "long";

describe("LiveHash", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const _hash = hex.decode(
            "100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002",
        );

        const operatorId = env.operatorId;
        let errorThrown = false;

        const { accountId, newKey: key } = await createAccount(env.client);

        expect(accountId).to.not.be.null;

        try {
            await new LiveHashAddTransaction()
                .setAccountId(accountId)
                .setDuration(Long.fromInt(30))
                .setHash(_hash)
                .setKeys(key)
                .execute(env.client);
        } catch (_) {
            errorThrown = true;
        }

        expect(errorThrown).to.be.true;
        errorThrown = false;

        try {
            await new LiveHashDeleteTransaction()
                .setAccountId(accountId)
                .setHash(_hash)
                .execute(env.client);
        } catch (_) {
            errorThrown = true;
        }

        expect(errorThrown).to.be.true;
        errorThrown = false;

        try {
            await new LiveHashQuery()
                .setAccountId(accountId)
                .setHash(_hash)
                .execute(env.client);
        } catch (_) {
            errorThrown = true;
        }

        expect(errorThrown).to.be.true;

        await deleteAccount(env.client, key, (transaction) => {
            transaction
                .setAccountId(accountId)
                .setTransferAccountId(operatorId);
        });
    });

    afterAll(async function () {
        await env.close();
    });
});
