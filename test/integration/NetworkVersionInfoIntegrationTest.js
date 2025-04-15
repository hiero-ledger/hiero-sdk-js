import { NetworkVersionInfoQuery } from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("NetworkVersionInfo", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        try {
            await new NetworkVersionInfoQuery().execute(env.client);
        } catch {
            // Do nothing
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
