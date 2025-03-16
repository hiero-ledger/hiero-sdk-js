import TokenTransfer from "../../src/token/TokenTransfer.js";

describe("TokenTransfer", function () {
    describe("_fromProtobuf with optional parameters", function () {
        it("should deserialize with expectedDecimals being null", function () {
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: 100,
                expectedDecimals: null,
                isApproved: true,
            });

            const transfersProtobuf = [
                {
                    token: transfer.tokenId._toProtobuf(),
                    expectedDecimals: {},
                    transfers: [transfer._toProtobuf()],
                },
            ];

            const [transferFromProtobuf] =
                TokenTransfer._fromProtobuf(transfersProtobuf);

            expect(transferFromProtobuf.expectedDecimals).to.be.null;
        });
    });
});
