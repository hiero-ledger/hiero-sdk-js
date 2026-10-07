const {
    Client,
    MirrorNodeAccountBalanceQuery,
    Hbar,
} = require("@hiero-ledger/sdk");

describe("CommonJS", function () {
    it("should read a balance from the mirror node", async function () {
        const client = Client.forTestnet();

        try {
            const balance = await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.2")
                .execute(client);

            if (!(balance.hbars instanceof Hbar)) {
                throw new Error("expected an Hbar balance");
            }
        } finally {
            // Close the client connection
            client.close();
        }
    });
});
