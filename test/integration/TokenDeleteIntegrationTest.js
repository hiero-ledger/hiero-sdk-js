import { TokenDeleteTransaction, Status } from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createFungibleToken } from "./utils/Fixtures.js";

describe("TokenDelete", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const tokenId = await createFungibleToken(env.client);

        await (
            await new TokenDeleteTransaction()
                .setTokenId(tokenId)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error with no token ID set", async function () {
        let err = false;

        try {
            await (
                await new TokenDeleteTransaction().execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTokenId);
        }

        if (!err) {
            throw new Error("token deletion did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
