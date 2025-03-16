import {
    Timestamp,
    FreezeTransaction,
    FreezeType,
    // TransactionResponse,
    // TransactionReceipt,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("FreezeTransaction", function () {
    let client;

    before(async function () {
        const env = await IntegrationTestEnv.new();
        client = env.client;
    });

    it("should be executable but not supported", async function () {
        const seconds = Math.round(Date.now() / 1000);
        const validStart = new Timestamp(seconds, 0);

        const transaction = new FreezeTransaction()
            .setStartTimestamp(validStart)
            .setFreezeType(new FreezeType(1))
            .freezeWith(client);
        expect(transaction.startTimestamp).to.be.equal(validStart);
        expect(transaction.freezeType).to.be.instanceof(FreezeType);

        try {
            await transaction.execute(client);
        } catch (error) {
            expect(error.status).to.be.equal(Status.NotSupported);
        }

        client.close();
    });
});
