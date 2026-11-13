import {
    Client,
    TokenBurnTransaction,
    TokenId,
    AccountId,
    TransactionId,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";
import BigNumber from "bignumber.js";

describe("TokenBurnTransaction", function () {
    const tokenId = new TokenId(1, 2, 3);
    const accountId = new AccountId(1);
    const timestamp = new Timestamp(1234567890, 0);

    it("should create transaction with number amount", function () {
        const amount = 1000;
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toNumber()).to.equal(amount);
    });

    it("should create transaction with Long amount", function () {
        const amount = Long.fromNumber(2000);
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.equals(amount)).to.be.true;
    });

    it("should create transaction with BigNumber amount", function () {
        const amount = new BigNumber("3000.5");
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("3000");
    });

    it("should create transaction with bigint amount", function () {
        const amount = 4000n;
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("4000");
    });

    it("should round trip from bytes with BigNumber amount", function () {
        const amount = new BigNumber("5000.7");
        const originalTransaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        const transactionBytes = originalTransaction.toBytes();
        const reconstructedTransaction =
            Transaction.fromBytes(transactionBytes);

        expect(reconstructedTransaction.tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(reconstructedTransaction.amount.toString()).to.equal("5000");
    });

    it("should round trip from bytes with bigint amount", function () {
        const amount = 6000n;
        const originalTransaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        const transactionBytes = originalTransaction.toBytes();
        const reconstructedTransaction =
            Transaction.fromBytes(transactionBytes);

        expect(reconstructedTransaction.tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(reconstructedTransaction.amount.toString()).to.equal("6000");
    });

    it("should handle large BigNumber amounts", function () {
        const amount = new BigNumber("9000000000000000000");
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("9000000000000000000");
    });

    it("should handle large bigint amounts", function () {
        const amount = 9000000000000000000n;
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("9000000000000000000");
    });

    it("should handle negative amounts", function () {
        const amount = new BigNumber("-1000");
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("-1000");
    });

    it("should handle zero amounts", function () {
        const amount = new BigNumber("0");
        const transaction = new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("0");
    });

    describe("serials", function () {
        it("should default to an empty list", function () {
            expect(new TokenBurnTransaction().serials).to.deep.equal([]);
        });

        it("should set serials from props", function () {
            const transaction = new TokenBurnTransaction({
                serials: [1, 2],
            });

            expect(
                transaction.serials.map((serial) => serial.toNumber()),
            ).to.deep.equal([1, 2]);
        });

        it("should accept Longs and numbers", function () {
            const transaction = new TokenBurnTransaction().setSerials([
                Long.fromNumber(1),
                2,
            ]);

            expect(transaction.serials[0]).to.be.instanceOf(Long);
            expect(transaction.serials[0].toNumber()).to.equal(1);
            expect(transaction.serials[1].toNumber()).to.equal(2);
        });

        it("should be chainable", function () {
            const transaction = new TokenBurnTransaction();

            expect(transaction.setSerials([1])).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = new TokenBurnTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        new Timestamp(1596210382, 0),
                    ),
                )
                .freeze();

            expect(() => transaction.setSerials([1])).to.throw(
                "transaction is immutable",
            );
        });

        it("should encode the serials", function () {
            const transaction = new TokenBurnTransaction().setSerials([1, 2]);

            expect(
                transaction._makeTransactionData().serialNumbers,
            ).to.deep.equal([Long.fromNumber(1), Long.fromNumber(2)]);
        });
    });

    describe("_validateChecksums", function () {
        let mainnet, testnet;

        beforeEach(function () {
            mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
            testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        });

        afterEach(function () {
            mainnet.close();
            testnet.close();
        });

        it("should check the token ID checksum against the client's network", function () {
            const transaction = new TokenBurnTransaction().setTokenId(
                TokenId.fromString("0.0.123-vfmkw"),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset tokenId", function () {
            expect(() =>
                new TokenBurnTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.burnToken() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    burnToken: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenBurnTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new TokenBurnTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `TokenBurnTransaction:${validStart.toString()}`,
            );
        });
    });
});
