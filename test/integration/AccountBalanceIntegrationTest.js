import { AccountBalanceQuery, Status } from "../../src/exports.js";
import IntegrationTestEnv, {
    Client,
    skipTestDueToNodeJsVersion,
} from "./client/NodeIntegrationTestEnv.js";
import { createFungibleToken } from "./utils/Fixtures.js";

describe("AccountBalanceQuery", function () {
    let clientPreviewNet;
    let clientTestnet;
    let env;

    before(async function () {
        clientPreviewNet = Client.forPreviewnet().setTransportSecurity(true);
        clientTestnet = Client.forTestnet().setTransportSecurity(true);
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    it("can query balance of node 0.0.3", async function () {
        const balance = await new AccountBalanceQuery()
            .setAccountId("0.0.3")
            .execute(clientTestnet);
        expect(balance.hbars.toTinybars().compare(0)).to.be.equal(1);
    });

    it("can connect to previewnet with TLS", async function () {
        if (skipTestDueToNodeJsVersion(16)) {
            return;
        }

        for (const [address, nodeAccountId] of Object.entries(
            clientPreviewNet.network,
        )) {
            expect(address.endsWith(":50212")).to.be.true;

            await new AccountBalanceQuery()
                .setAccountId(nodeAccountId)
                .setMaxAttempts(10)
                .execute(clientPreviewNet);
        }
    });

    it("can connect to testnet with TLS", async function () {
        if (skipTestDueToNodeJsVersion(16)) {
            return;
        }

        for (const [address, nodeAccountId] of Object.entries(
            clientTestnet.network,
        )) {
            expect(address.endsWith(":50212")).to.be.true;

            await new AccountBalanceQuery()
                .setAccountId(nodeAccountId)
                .setMaxAttempts(10)
                .execute(clientTestnet);
        }
    });

    it("an account that does not exist should return an error", async function () {
        let err = false;

        try {
            await new AccountBalanceQuery()
                .setAccountId("1.0.3")
                .execute(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidAccountId.toString());
        }

        if (!err) {
            throw new Error("query did not error");
        }
    });

    it("should reflect token with no keys", async function () {
        const tokenId = await createFungibleToken(env.client, (transaction) => {
            transaction.setInitialSupply(0);
        });

        const balances = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(balances.tokens.get(tokenId.toString()).toInt()).to.be.equal(0);
    });

    after(async function () {
        clientPreviewNet.close();
        clientTestnet.close();
        await env.close();
    });
});
