import {
    AccountId,
    TransferTransaction,
    Hbar,
    MaxAttemptsOrTimeoutError,
} from "../../src/index.js";
import Mocker from "./Mocker.js";

describe("MaxAttemptsOrTimeoutError", function () {
    let message;
    let nodeAccountId;
    let error;

    beforeEach(function () {
        message = "Test error message";
        nodeAccountId = "0.0.3";

        error = new MaxAttemptsOrTimeoutError(message, nodeAccountId);
    });

    it("should create an instance with correct properties", function () {
        expect(error).to.be.instanceOf(MaxAttemptsOrTimeoutError);
        expect(error.message).to.be.equal(message);
        expect(error.nodeAccountId).to.be.equal(nodeAccountId);
    });

    it("toJSON should return correct JSON representation", function () {
        const expectedJson = {
            message,
            nodeAccountId,
        };

        expect(error.toJSON()).to.be.deep.equal(expectedJson);
    });

    it("toString should return a JSON string", function () {
        const expectedString = JSON.stringify({
            message,
            nodeAccountId,
        });

        expect(error.toString()).to.be.equal(expectedString);
    });

    it("valueOf should return the same result as toJSON", function () {
        expect(error.valueOf()).to.be.deep.equal(error.toJSON());
    });

    describe("Transaction execution errors", function () {
        let client, transaction;

        beforeEach(async function () {
            const setup = await Mocker.withResponses([]);
            client = setup.client;
            transaction = new TransferTransaction()
                .addHbarTransfer("0.0.2", new Hbar(1))
                .setNodeAccountIds([new AccountId(5)]);
        });

        it("should throw a timeout error when the timeout exceeds", async function () {
            // Set the client's request timeout to 0 for testing
            client.setRequestTimeout(0);
            transaction = transaction.freezeWith(client);

            try {
                await transaction.execute(client);
                throw new Error("Expected request to time out but it didn't.");
            } catch (error) {
                expect(error.message).to.include("timeout exceeded");
                expect(error.nodeAccountId).to.equal("0.0.5");
            }
        });

        it("should throw a max attempts error when max attempts is reached", async function () {
            // Set the transaction's max attempts to 0 for testing
            transaction = transaction.setMaxAttempts(0).freezeWith(client);

            try {
                await transaction.execute(client);
                throw new Error(
                    "Expected request to fail due to max attempts being reached.",
                );
            } catch (error) {
                expect(error.message).to.include(
                    "max attempts of 0 was reached for request with last error being:",
                );
                expect(error.nodeAccountId).to.equal("0.0.5");
            }
        });
    });
});
