import { AddressBookQuery } from "../../src/index.js";
import { Client } from "./client/NodeIntegrationTestEnv.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("AddressBookQuery", function () {
    it("should be query the addressbook on local node", async function () {
        // NOTE: Ensure the environment is configured for local use
        const env = await IntegrationTestEnv.new();

        const addressBook = await new AddressBookQuery()
            .setFileId("0.0.102")
            .execute(env.client);

        expect(addressBook.nodeAddresses.length).to.be.above(0);
        env.client.close();
    });

    it("should be query the addressbook on testnet", async function () {
        const client = Client.forTestnet();

        const addressBook = await new AddressBookQuery()
            .setFileId("0.0.102")
            .execute(client);

        expect(addressBook.nodeAddresses.length).to.be.above(0);
        client.close();
    });

    it("should be query the addressbook on mainnet", async function () {
        const client = Client.forMainnet();

        const addressBook = await new AddressBookQuery()
            .setFileId("0.0.102")
            .execute(client);

        expect(addressBook.nodeAddresses.length).to.be.above(0);
        client.close();
    });
});
