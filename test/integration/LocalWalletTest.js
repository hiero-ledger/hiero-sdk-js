import { Wallet, LocalProvider } from "../../src/index.js";

import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("LocalWallet", function () {
    it("can fetch wallet's info", async function () {
        const env = await IntegrationTestEnv.new();
        const wallet = new Wallet(
            env.operatorId,
            env.operatorKey,
            new LocalProvider(),
        );

        const info = await wallet.getAccountInfo();

        expect(info.accountId.compare(wallet.getAccountId())).to.be.equal(0);
    });
});
