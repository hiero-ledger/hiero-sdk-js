import {
    AccountId,
    Client,
    Timestamp,
    TokenDeleteTransaction,
    TokenId,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("TokenDeleteTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let tokenId, transactionId, nodeId;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 5005);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {TokenDeleteTransaction} transaction
     * @returns {TokenDeleteTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {TokenDeleteTransaction}
     */
    function withAllFields() {
        return new TokenDeleteTransaction().setTokenId(tokenId);
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new TokenDeleteTransaction();

            expect(transaction.tokenId).to.be.null;
        });

        it("should set the fields given in props", function () {
            const transaction = new TokenDeleteTransaction({ tokenId });

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should accept strings in props", function () {
            const transaction = new TokenDeleteTransaction({
                tokenId: "0.0.5005",
            });

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
        });
    });

    describe("setTokenId", function () {
        it("should accept an instance", function () {
            const transaction = new TokenDeleteTransaction().setTokenId(
                tokenId,
            );

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should accept a string", function () {
            const transaction = new TokenDeleteTransaction().setTokenId(
                "0.0.5005",
            );

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const transaction = new TokenDeleteTransaction().setTokenId(
                tokenId,
            );

            expect(transaction.tokenId).to.not.equal(tokenId);
        });

        it("should be chainable", function () {
            const transaction = new TokenDeleteTransaction();

            expect(transaction.setTokenId(tokenId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new TokenDeleteTransaction());

            expect(() => transaction.setTokenId(tokenId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                token: tokenId._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new TokenDeleteTransaction()._makeTransactionData(),
            ).to.deep.equal({
                token: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the tokenDeletion body
         * @returns {TokenDeleteTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return TokenDeleteTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ tokenDeletion: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                token: tokenId._toProtobuf(),
            });

            expect(transaction).to.be.instanceOf(TokenDeleteTransaction);
            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should leave missing fields null", function () {
            const transaction = fromBody({});

            expect(transaction.tokenId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(TokenDeleteTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.tokenId.toString()).to.equal(tokenId.toString());
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
            // 0.0.123-vfmkw has the mainnet checksum
            const transaction = new TokenDeleteTransaction().setTokenId(
                TokenId.fromString("0.0.123-vfmkw"),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip unset fields", function () {
            expect(() =>
                new TokenDeleteTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.deleteToken() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    deleteToken: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenDeleteTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return tokenDeletion", function () {
            expect(
                new TokenDeleteTransaction()._getTransactionDataCase(),
            ).to.equal("tokenDeletion");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new TokenDeleteTransaction());

            expect(transaction._getLogId()).to.equal(
                `TokenDeleteTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
