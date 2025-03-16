import {
    Status,
    TokenBurnTransaction,
    AccountBalanceQuery,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createFungibleToken,
    createNonFungibleToken,
} from "./utils/Fixtures.js";

describe("TokenBurn", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const token = await createFungibleToken(env.client);

        await (
            await new TokenBurnTransaction()
                .setAmount(10)
                .setTokenId(token)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when token ID is not set", async function () {
        let err = false;

        try {
            await (
                await new TokenBurnTransaction()
                    .setAmount(10)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token Burn did not error");
        }
    });

    it("should not error when amount is not set", async function () {
        const operatorId = env.operatorId;

        const token = await createFungibleToken(env.client);

        let err = false;

        try {
            await (
                await new TokenBurnTransaction()
                    .setTokenId(token)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error;
        }

        const accountBalance = await new AccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(env.client);

        expect(
            accountBalance.tokens._map.get(token.toString()).toNumber(),
        ).to.be.equal(1000000);

        if (err) {
            throw new Error("token burn did error");
        }
    });

    it("cannot burn token with invalid metadata", async function () {
        const token = await createNonFungibleToken(env.client);

        let err = false;

        try {
            await (
                await new TokenBurnTransaction()
                    .setTokenId(token)
                    .setAmount(1)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenBurnMetadata);
        }

        if (!err) {
            throw new Error("token mint did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
