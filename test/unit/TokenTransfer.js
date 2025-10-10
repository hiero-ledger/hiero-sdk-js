import TokenTransfer from "../../src/token/TokenTransfer.js";
import Long from "long";
import BigNumber from "bignumber.js";

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

    describe("amount type support", function () {
        it("should handle BigNumber amount", function () {
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: new BigNumber("1000.5"),
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.toString()).to.equal("1000");
        });

        it("should handle bigint amount", function () {
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: 2000n,
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.toString()).to.equal("2000");
        });

        it("should handle Long amount", function () {
            const amount = Long.fromNumber(3000);
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: amount,
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.equals(amount)).to.be.true;
        });

        it("should handle number amount", function () {
            const amount = 4000;
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: amount,
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.toNumber()).to.equal(amount);
        });

        it("should handle large BigNumber amount", function () {
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: new BigNumber("9000000000000000000"),
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.toString()).to.equal("9000000000000000000");
        });

        it("should handle large bigint amount", function () {
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: 9000000000000000000n,
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.toString()).to.equal("9000000000000000000");
        });

        it("should handle zero amount", function () {
            const transfer = new TokenTransfer({
                tokenId: "0.0.123",
                accountId: "0.0.456",
                amount: new BigNumber("0"),
                expectedDecimals: null,
                isApproved: true,
            });

            expect(transfer.amount.toString()).to.equal("0");
        });
    });
});
