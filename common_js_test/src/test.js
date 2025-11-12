const { Client, AccountBalanceQuery } = require("@hiero-ledger/sdk");

describe("CommonJS", function () {
    it("should query each node's balance", async function () {
        const client = Client.forTestnet();

        let succeededAtLeastOnce = false;

        // Iterate over the nodes in the network
        for (const [, nodeAccountId] of Object.entries(client.network)) {
            try {
                await new AccountBalanceQuery()
                    .setNodeAccountIds([nodeAccountId])
                    .setAccountId(nodeAccountId)
                    .execute(client);
                succeededAtLeastOnce = true;
            } catch (error) {
                console.log(`Failed for ${nodeAccountId}`);
            }
        }

        // Close the client connection
        client.close();

        // Ensure that at least one attempt was successful
        if (!succeededAtLeastOnce) {
            throw new Error("No successful query attempts were made.");
        }
    });
});
