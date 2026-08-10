import { AccountBalanceQuery, Status } from "../../src/exports.js";
import IntegrationTestEnv, {
    Client,
    skipTestDueToNodeJsVersion,
} from "./client/NodeIntegrationTestEnv.js";
import { createFungibleToken } from "./utils/Fixtures.js";

/**
 * Queries the balance of a node account, tolerating a BUSY precheck.
 * Public networks throttle CI runner IPs, but a BUSY response still
 * proves the TLS connection works — the node answered over it.
 *
 * @param {Client} client
 * @param {import("../../src/exports.js").AccountId} nodeAccountId
 */
async function queryBalanceToleratingBusy(client, nodeAccountId) {
    try {
        await new AccountBalanceQuery()
            .setAccountId(nodeAccountId)
            .setMaxAttempts(3)
            .execute(client);
    } catch (error) {
        if (!error.message.endsWith(Status.Busy.toString())) {
            throw error;
        }
    }
}

describe("AccountBalanceQuery", function () {
    let clientPreviewNet;
    let clientTestnet;
    let env;

    beforeAll(async function () {
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

            await queryBalanceToleratingBusy(clientPreviewNet, nodeAccountId);
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

            await queryBalanceToleratingBusy(clientTestnet, nodeAccountId);
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

    afterAll(async function () {
        clientPreviewNet.close();
        clientTestnet.close();
        await env.close();
    });
});
