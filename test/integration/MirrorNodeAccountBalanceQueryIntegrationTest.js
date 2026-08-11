import {
    AccountId,
    MirrorNodeAccountBalanceQuery,
    TokenCreateTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

// Cross-environment sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Poll the mirror node until `fn` resolves to a truthy value, retrying
 * both rejections (the entity is not ingested yet, so the mirror returns
 * 404) and falsy results, up to a deadline. Fixed sleeps flake on slow
 * CI runners; polling does not.
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

    it("should return the token balance and decimals of the treasury", async function () {
        const response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setDecimals(3)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(env.operatorId)
            .setAdminKey(env.operatorKey.publicKey)
            .setSupplyKey(env.operatorKey.publicKey)
            .setAutoRenewAccountId(env.operatorId)
            .execute(env.client);

        const tokenId = (await response.getReceipt(env.client)).tokenId;

        const balance = await untilMirror(async () => {
            const result = await new MirrorNodeAccountBalanceQuery()
                .setAccountId(env.operatorId)
                .execute(env.client);
            return result.tokens.get(tokenId) != null ? result : null;
        });

        expect(balance.tokens.get(tokenId).toNumber()).to.eql(1000000);
        expect(balance.tokenDecimals.get(tokenId)).to.eql(3);
    });

    it("should reject a non-existent account", async function () {
        let message = "";

        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId(new AccountId(999999999))
                .execute(env.client);
        } catch (error) {
            message = error.message;
        }

        expect(message).to.include("404");
    });

    afterAll(async function () {
        await env.close();
    });
});
