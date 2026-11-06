import {
    AccountId,
    Client,
    Hbar,
    Timestamp,
    TokenDissociateTransaction,
    TokenId,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("TokenDissociateTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let tokenIds, accountId, transactionId, nodeId;

    beforeEach(function () {
        tokenIds = [new TokenId(0, 0, 5005), new TokenId(0, 0, 5006)];
        accountId = new AccountId(0, 0, 5007);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {TokenDissociateTransaction} transaction
     * @returns {TokenDissociateTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {TokenDissociateTransaction}
     */
    function withAllFields() {
        return new TokenDissociateTransaction()
            .setTokenIds(tokenIds)
            .setAccountId(accountId);
    }

    /**
     * @param {?TokenId[]} ids
     * @returns {?string[]}
     */
    function toStrings(ids) {
        return ids != null ? ids.map((id) => id.toString()) : null;
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new TokenDissociateTransaction();

            expect(transaction.tokenIds).to.be.null;
            expect(transaction.accountId).to.be.null;
        });

        it("should set the fields given in props", function () {
            const transaction = new TokenDissociateTransaction({
                tokenIds,
                accountId,
            });

            expect(toStrings(transaction.tokenIds)).to.deep.equal(
                toStrings(tokenIds),
            );
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should accept strings in props", function () {
            const transaction = new TokenDissociateTransaction({
                tokenIds: ["0.0.5005", "0.0.5006"],
                accountId: "0.0.5007",
            });

            expect(toStrings(transaction.tokenIds)).to.deep.equal([
                "0.0.5005",
                "0.0.5006",
            ]);
            expect(transaction.accountId.toString()).to.equal("0.0.5007");
        });

        it("should default the max transaction fee to 5 Hbar", function () {
            const transaction = new TokenDissociateTransaction();

            expect(
                transaction._defaultMaxTransactionFee.toTinybars().toString(),
            ).to.equal(new Hbar(5).toTinybars().toString());
        });
    });

    describe("setTokenIds", function () {
        it("should accept instances and strings", function () {
            const transaction = new TokenDissociateTransaction().setTokenIds([
                tokenIds[0],
                "0.0.5006",
            ]);

            expect(toStrings(transaction.tokenIds)).to.deep.equal([
                "0.0.5005",
                "0.0.5006",
            ]);
        });

        it("should accept an empty list", function () {
            const transaction = new TokenDissociateTransaction().setTokenIds(
                [],
            );

            expect(transaction.tokenIds).to.deep.equal([]);
        });

        it("should store copies of the instances", function () {
            const transaction = new TokenDissociateTransaction().setTokenIds(
                tokenIds,
            );

            expect(transaction.tokenIds).to.not.equal(tokenIds);
            expect(transaction.tokenIds[0]).to.not.equal(tokenIds[0]);
        });

        it("should be chainable", function () {
            const transaction = new TokenDissociateTransaction();

            expect(transaction.setTokenIds(tokenIds)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new TokenDissociateTransaction());

            expect(() => transaction.setTokenIds(tokenIds)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setAccountId", function () {
        it("should accept an instance", function () {
            const transaction = new TokenDissociateTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should accept a string", function () {
            const transaction = new TokenDissociateTransaction().setAccountId(
                "0.0.5007",
            );

            expect(transaction.accountId.toString()).to.equal("0.0.5007");
        });

        it("should store a copy of the instance", function () {
            const transaction = new TokenDissociateTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId).to.not.equal(accountId);
        });

        it("should be chainable", function () {
            const transaction = new TokenDissociateTransaction();

            expect(transaction.setAccountId(accountId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new TokenDissociateTransaction());

            expect(() => transaction.setAccountId(accountId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                tokens: tokenIds.map((id) => id._toProtobuf()),
                account: accountId._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new TokenDissociateTransaction()._makeTransactionData(),
            ).to.deep.equal({
                tokens: null,
                account: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the tokenDissociate body
         * @returns {TokenDissociateTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return TokenDissociateTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ tokenDissociate: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                tokens: tokenIds.map((id) => id._toProtobuf()),
                account: accountId._toProtobuf(),
            });

            expect(transaction).to.be.instanceOf(TokenDissociateTransaction);
            expect(toStrings(transaction.tokenIds)).to.deep.equal(
                toStrings(tokenIds),
            );
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should leave missing fields null", function () {
            const transaction = fromBody({});

            expect(transaction.tokenIds).to.be.null;
            expect(transaction.accountId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(TokenDissociateTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(toStrings(decoded.tokenIds)).to.deep.equal(
                toStrings(tokenIds),
            );
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

        it("should check every token ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const transaction = new TokenDissociateTransaction().setTokenIds([
                "0.0.5005",
                TokenId.fromString("0.0.123-vfmkw"),
            ]);

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should validate the account ID checksum", function () {
            // AccountId.fromString() doesn't keep the checksum, so a stand-in
            // records the call instead.
            const clients = [];
            const transaction = new TokenDissociateTransaction();
            transaction._accountId = {
                validateChecksum: (client) => clients.push(client),
            };

            transaction._validateChecksums(mainnet);

            expect(clients).to.deep.equal([mainnet]);
        });

        it("should skip unset fields", function () {
            expect(() =>
                new TokenDissociateTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.dissociateTokens() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    dissociateTokens: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenDissociateTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.have.lengthOf(1);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return tokenDissociate", function () {
            expect(
                new TokenDissociateTransaction()._getTransactionDataCase(),
            ).to.equal("tokenDissociate");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new TokenDissociateTransaction());

            expect(transaction._getLogId()).to.equal(
                `TokenDissociateTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
