import {
    Client,
    TokenPauseTransaction,
    TransactionId,
    AccountId,
    Timestamp,
    TokenId,
    Transaction,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

describe("TokenPauseTransaction", function () {
    it("encodes to correct protobuf", function () {
        const transaction = new TokenPauseTransaction()
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(1),
                    new Timestamp(2, 3),
                ),
            )
            .setNodeAccountIds([new AccountId(4)])
            .setTokenId("0.0.5")
            .setTransactionMemo("random memo")
            .freeze();

        const protobuf = transaction._makeTransactionBody();

        expect(protobuf).to.deep.include({
            tokenPause: {
                token: {
                    tokenNum: Long.fromNumber(5),
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                },
            },
            transactionFee: Long.fromNumber(200000000),
            memo: "random memo",
            transactionID: {
                accountID: {
                    accountNum: Long.fromNumber(1),
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    alias: null,
                },
                transactionValidStart: {
                    seconds: Long.fromNumber(2),
                    nanos: 3,
                },
                scheduled: false,
                nonce: null,
            },
            nodeAccountID: null,
            transactionValidDuration: {
                seconds: Long.fromNumber(120),
            },
        });
    });

    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );

        const tx = new TokenPauseTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenId(TokenId.fromString("0.0.5005"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenPauseTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenId.toString()).to.equal("0.0.5005");
    });

    describe("tokenId and _makeTransactionData", function () {
        const tokenId = new TokenId(0, 0, 5005);
        const transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            new Timestamp(1596210382, 0),
        );
        const nodeId = new AccountId(0, 0, 3);

        function freezeWithIds(transaction) {
            return transaction
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze();
        }

        it("should default tokenId to null", function () {
            expect(new TokenPauseTransaction().tokenId).to.be.null;
        });

        it("should set tokenId from props", function () {
            const transaction = new TokenPauseTransaction({ tokenId });

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should set tokenId from a string", function () {
            const transaction = new TokenPauseTransaction().setTokenId(
                "0.0.5005",
            );

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of tokenId", function () {
            const transaction = new TokenPauseTransaction().setTokenId(tokenId);

            expect(transaction.tokenId).to.not.equal(tokenId);
        });

        it("should be chainable", function () {
            const transaction = new TokenPauseTransaction();

            expect(transaction.setTokenId(tokenId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new TokenPauseTransaction());

            expect(() => transaction.setTokenId(tokenId)).to.throw(
                "transaction is immutable",
            );
        });

        it("should encode the token", function () {
            const transaction = new TokenPauseTransaction().setTokenId(tokenId);

            expect(transaction._makeTransactionData()).to.deep.equal({
                token: tokenId._toProtobuf(),
            });
        });

        it("should encode an unset token as null", function () {
            expect(
                new TokenPauseTransaction()._makeTransactionData(),
            ).to.deep.equal({
                token: null,
            });
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
            const transaction = new TokenPauseTransaction().setTokenId(
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
                new TokenPauseTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.pauseToken() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    pauseToken: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenPauseTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return tokenPause", function () {
            expect(
                new TokenPauseTransaction()._getTransactionDataCase(),
            ).to.equal("tokenPause");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new TokenPauseTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `TokenPauseTransaction:${validStart.toString()}`,
            );
        });
    });
});
