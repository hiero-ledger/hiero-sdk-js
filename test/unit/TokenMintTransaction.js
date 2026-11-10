import { vi } from "vitest";
import {
    Client,
    TokenMintTransaction,
    TokenId,
    AccountId,
    TransactionId,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";
import BigNumber from "bignumber.js";

describe("TokenMintTransaction", function () {
    const tokenId = new TokenId(1, 2, 3);
    const accountId = new AccountId(1);
    const timestamp = new Timestamp(1234567890, 0);

    it("should create transaction with number amount", function () {
        const amount = 1000;
        const transaction = new TokenMintTransaction()
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
        const transaction = new TokenMintTransaction()
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
        const transaction = new TokenMintTransaction()
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
        const transaction = new TokenMintTransaction()
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
        const originalTransaction = new TokenMintTransaction()
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
        const originalTransaction = new TokenMintTransaction()
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
        const transaction = new TokenMintTransaction()
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
        const transaction = new TokenMintTransaction()
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

    it("should handle zero amounts", function () {
        const amount = new BigNumber("0");
        const transaction = new TokenMintTransaction()
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

    it("should handle decimal BigNumber amounts (truncated)", function () {
        const amount = new BigNumber("1234.56789");
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("1234");
    });

    describe("metadata", function () {
        it("should default to an empty list", function () {
            expect(new TokenMintTransaction().metadata).to.deep.equal([]);
        });

        it("should accept a Uint8Array in addMetadata", function () {
            const metadata = new TextEncoder().encode("metadata");
            const transaction = new TokenMintTransaction().addMetadata(
                metadata,
            );

            expect(transaction.metadata).to.deep.equal([metadata]);
        });

        it("should decode a string in addMetadata and warn", function () {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

            try {
                const transaction = new TokenMintTransaction().addMetadata(
                    "deadbeef",
                );

                expect(transaction.metadata).to.deep.equal([
                    Uint8Array.of(0xde, 0xad, 0xbe, 0xef),
                ]);
                expect(warn).toHaveBeenCalledTimes(1);
            } finally {
                warn.mockRestore();
            }
        });

        it("should be chainable in addMetadata", function () {
            const transaction = new TokenMintTransaction();

            expect(
                transaction.addMetadata(new TextEncoder().encode("a")),
            ).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = new TokenMintTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        new Timestamp(1596210382, 0),
                    ),
                )
                .freeze();

            expect(() =>
                transaction.addMetadata(new TextEncoder().encode("a")),
            ).to.throw("transaction is immutable");
        });

        it("should set metadata from Uint8Arrays", function () {
            const metadata = new TextEncoder().encode("metadata");
            const transaction = new TokenMintTransaction().setMetadata([
                metadata,
            ]);

            expect(transaction.metadata).to.deep.equal([metadata]);
        });

        it("should decode string metadata and warn", function () {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

            try {
                const transaction = new TokenMintTransaction().setMetadata([
                    "deadbeef",
                ]);

                expect(transaction.metadata).to.deep.equal([
                    Uint8Array.of(0xde, 0xad, 0xbe, 0xef),
                ]);
                expect(warn).toHaveBeenCalledTimes(1);
            } finally {
                warn.mockRestore();
            }
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
            const transaction = new TokenMintTransaction().setTokenId(
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
                new TokenMintTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.mintToken() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    mintToken: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenMintTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new TokenMintTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `TokenMintTransaction:${validStart.toString()}`,
            );
        });
    });
});
