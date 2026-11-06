import {
    AccountId,
    Client,
    Timestamp,
    TokenId,
    TokenRevokeKycTransaction,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("TokenRevokeKycTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let tokenId, accountId, transactionId, nodeId;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 5005);
        accountId = new AccountId(0, 0, 5006);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {TokenRevokeKycTransaction} transaction
     * @returns {TokenRevokeKycTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {TokenRevokeKycTransaction}
     */
    function withAllFields() {
        return new TokenRevokeKycTransaction()
            .setTokenId(tokenId)
            .setAccountId(accountId);
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new TokenRevokeKycTransaction();

            expect(transaction.tokenId).to.be.null;
            expect(transaction.accountId).to.be.null;
        });

        it("should set the fields given in props", function () {
            const transaction = new TokenRevokeKycTransaction({
                tokenId,
                accountId,
            });

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should accept strings in props", function () {
            const transaction = new TokenRevokeKycTransaction({
                tokenId: "0.0.5005",
                accountId: "0.0.5006",
            });

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
            expect(transaction.accountId.toString()).to.equal("0.0.5006");
        });
    });

    describe("setTokenId", function () {
        it("should accept an instance", function () {
            const transaction = new TokenRevokeKycTransaction().setTokenId(
                tokenId,
            );

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should accept a string", function () {
            const transaction = new TokenRevokeKycTransaction().setTokenId(
                "0.0.5005",
            );

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const transaction = new TokenRevokeKycTransaction().setTokenId(
                tokenId,
            );

            expect(transaction.tokenId).to.not.equal(tokenId);
        });

        it("should be chainable", function () {
            const transaction = new TokenRevokeKycTransaction();

            expect(transaction.setTokenId(tokenId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new TokenRevokeKycTransaction());

            expect(() => transaction.setTokenId(tokenId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setAccountId", function () {
        it("should accept an instance", function () {
            const transaction = new TokenRevokeKycTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should accept a string", function () {
            const transaction = new TokenRevokeKycTransaction().setAccountId(
                "0.0.5006",
            );

            expect(transaction.accountId.toString()).to.equal("0.0.5006");
        });

        it("should store a copy of the instance", function () {
            const transaction = new TokenRevokeKycTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId).to.not.equal(accountId);
        });

        it("should be chainable", function () {
            const transaction = new TokenRevokeKycTransaction();

            expect(transaction.setAccountId(accountId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new TokenRevokeKycTransaction());

            expect(() => transaction.setAccountId(accountId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                token: tokenId._toProtobuf(),
                account: accountId._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new TokenRevokeKycTransaction()._makeTransactionData(),
            ).to.deep.equal({
                token: null,
                account: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the tokenRevokeKyc body
         * @returns {TokenRevokeKycTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return TokenRevokeKycTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ tokenRevokeKyc: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                token: tokenId._toProtobuf(),
                account: accountId._toProtobuf(),
            });

            expect(transaction).to.be.instanceOf(TokenRevokeKycTransaction);
            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should leave missing fields null", function () {
            const transaction = fromBody({});

            expect(transaction.tokenId).to.be.null;
            expect(transaction.accountId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(TokenRevokeKycTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.tokenId.toString()).to.equal(tokenId.toString());
            expect(decoded.accountId.toString()).to.equal(accountId.toString());
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
            const transaction = new TokenRevokeKycTransaction().setTokenId(
                TokenId.fromString("0.0.123-vfmkw"),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should validate the account ID checksum", function () {
            const clients = [];
            const transaction = new TokenRevokeKycTransaction();
            transaction._accountId = {
                validateChecksum: (client) => clients.push(client),
            };

            transaction._validateChecksums(mainnet);

            expect(clients).to.deep.equal([mainnet]);
        });

        it("should skip unset fields", function () {
            expect(() =>
                new TokenRevokeKycTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.revokeKycFromTokenAccount() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    revokeKycFromTokenAccount: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenRevokeKycTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return tokenRevokeKyc", function () {
            expect(
                new TokenRevokeKycTransaction()._getTransactionDataCase(),
            ).to.equal("tokenRevokeKyc");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new TokenRevokeKycTransaction());

            expect(transaction._getLogId()).to.equal(
                `TokenRevokeKycTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
