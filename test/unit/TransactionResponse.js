import {
    AccountId,
    TransactionId,
    TransactionResponse,
} from "../../src/index.js";

describe("TransactionResponse", function () {
    it("toJSON()", function () {
        const response = new TransactionResponse({
            nodeId: AccountId.fromString("0.0.3"),
            transactionHash: Uint8Array.of(1, 2, 3),
            transactionId: TransactionId.fromString("0.0.12@13.000000014"),
        });

        const expectedJSON = `{"nodeId":"0.0.3","transactionHash":"010203","transactionId":"0.0.12@13.000000014"}`;
        const expectedJSONParsed = JSON.parse(expectedJSON);

        const resultJSON = JSON.parse(JSON.stringify(response));
        expect(resultJSON).to.deep.equal(expectedJSONParsed);
    });
});
