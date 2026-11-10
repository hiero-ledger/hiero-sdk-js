import {
    Client,
    TokenUpdateNftsTransaction,
    TokenId,
    Timestamp,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import TransactionId from "../../src/transaction/TransactionId.js";
import AccountId from "../../src/account/AccountId.js";

describe("TokenUpdateNftsTransaction", function () {
    it("should create from a protobuf", function () {
        const tokenId = "0.0.123";
        const serials = [1, 2, 3];
        const metadata = new Uint8Array([1, 2, 3]);

        /**
         * @type {HieroProto.proto.ITokenUpdateNftsTransactionBody}
         */
        const body = {
            tokenUpdateNfts: {
                token: { shardNum: 0, realmNum: 0, tokenNum: 123 },
                serialNumbers: serials,
                metadata: { value: metadata },
            },
        };

        const transactions = [{ body }];
        const signedTransactions = [{}];
        const transactionIds = [TransactionId.generate(new AccountId(1))];
        const nodeIds = [new AccountId(3)];
        const bodies = [body];

        const transaction = TokenUpdateNftsTransaction._fromProtobuf(
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );

        expect(transaction._tokenId.toString()).to.eql(tokenId);
        expect(transaction._serialNumbers).to.eql(serials);
        expect(transaction._metadata).to.eql(metadata);
    });

    it("should _metadata equal to null", async function () {
        const tx = new TokenUpdateNftsTransaction();
        const tx2 = TokenUpdateNftsTransaction.fromBytes(tx.toBytes());

        expect(tx._metadata).to.be.null;
        expect(tx2._metadata).to.be.null;
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
            const transaction = new TokenUpdateNftsTransaction().setTokenId(
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
                new TokenUpdateNftsTransaction()._validateChecksums(testnet),
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
                await new TokenUpdateNftsTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new TokenUpdateNftsTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `TokenUpdateNftsTransaction:${validStart.toString()}`,
            );
        });
    });
});
