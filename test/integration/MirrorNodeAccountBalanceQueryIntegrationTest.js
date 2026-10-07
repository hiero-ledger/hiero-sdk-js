import {
    AccountId,
    MirrorNodeAccountBalanceQuery,
    MirrorNodeStatusError,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

// Cross-environment sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Poll the mirror node until `fn` resolves to a truthy value, retrying
 * both rejections and falsy results, up to a deadline. Fixed sleeps flake
 * on slow CI runners; polling does not.
 *
 * @template T
 * @param {() => Promise<T | null>} fn
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
const untilMirror = async (fn, timeoutMs = 60000) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            const result = await fn();
            if (result) {
                return result;
            }
            if (Date.now() >= deadline) {
                throw new Error("mirror node did not ingest in time");
            }
        } catch (error) {
            if (Date.now() >= deadline) {
                throw error;
            }
        }
        await sleep(2000);
    }
};

describe("MirrorNodeAccountBalanceQuery", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should return the hbar balance of the operator account", async function () {
        const balance = await untilMirror(async () => {
            const result = await new MirrorNodeAccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);
            return result.hbars.toTinybars().toNumber() > 0 ? result : null;
        });

        expect(balance.hbars.toTinybars().toNumber()).to.be.gt(0);
    });

    it("should fail with INVALID_ACCOUNT_ID for a non-existent account", async function () {
        let error = null;
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId(new AccountId(999999999))
                .execute(env.client);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.instanceOf(MirrorNodeStatusError);
        expect(error.status).to.equal(Status.InvalidAccountId);
    });

    afterAll(async function () {
        await env.close();
    });
});
