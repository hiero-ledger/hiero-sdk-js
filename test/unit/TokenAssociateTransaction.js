import {
    Client,
    TokenAssociateTransaction,
    AccountId,
    TransactionId,
    Timestamp,
    TokenId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

describe("TokenAssociateTransaction", function () {
    it("serializes and deserializes correctly", function () {
        const accountId = new AccountId(5);
        const tokenId1 = new TokenId(10);
        const tokenId2 = new TokenId(11);
        const tokenIds = [tokenId1, tokenId2];

        const transaction = new TokenAssociateTransaction()
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(3),
                    new Timestamp(4, 5),
                ),
            )
            .setNodeAccountIds([new AccountId(6)])
            .setAccountId(accountId)
            .setTokenIds(tokenIds)
            .freeze();

        const txBytes = transaction.toBytes();
        const txFromBytes = TokenAssociateTransaction.fromBytes(txBytes);

        expect(txFromBytes.accountId.toString()).to.equal(accountId.toString());
        expect(txFromBytes.tokenIds.length).to.equal(tokenIds.length);
        expect(txFromBytes.tokenIds[0].toString()).to.equal(
            tokenId1.toString(),
        );
        expect(txFromBytes.tokenIds[1].toString()).to.equal(
            tokenId2.toString(),
        );
    });

    it("handles null values correctly", function () {
        const tx = new TokenAssociateTransaction();
        expect(tx.accountId).to.be.null;
        expect(tx.tokenIds).to.be.null;

        const txFromBytes = TokenAssociateTransaction.fromBytes(tx.toBytes());
        expect(txFromBytes.accountId).to.be.null;
        expect(txFromBytes.tokenIds).to.deep.equal([]);
    });

    it("properly serializes to protobuf", function () {
        const accountId = new AccountId(42);
        const tokenId1 = new TokenId(100);
        const tokenId2 = new TokenId(101);

        const transaction = new TokenAssociateTransaction()
            .setAccountId(accountId)
            .setTokenIds([tokenId1, tokenId2]);

        const protobuf = transaction._makeTransactionData();

        expect(protobuf.account).to.deep.include({
            accountNum: Long.fromNumber(42),
            shardNum: Long.fromNumber(0),
            realmNum: Long.fromNumber(0),
        });

        expect(protobuf.tokens.length).to.equal(2);
        expect(protobuf.tokens[0]).to.deep.include({
            tokenNum: Long.fromNumber(100),
            shardNum: Long.fromNumber(0),
            realmNum: Long.fromNumber(0),
        });
        expect(protobuf.tokens[1]).to.deep.include({
            tokenNum: Long.fromNumber(101),
            shardNum: Long.fromNumber(0),
            realmNum: Long.fromNumber(0),
        });
    });

    it("_fromProtobuf deserializes correctly", function () {
        // Create and freeze a transaction
        const originalTx = new TokenAssociateTransaction()
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(3),
                    new Timestamp(4, 5),
                ),
            )
            .setNodeAccountIds([new AccountId(6)])
            .setAccountId(new AccountId(7))
            .setTokenIds([new TokenId(8), new TokenId(9)])
            .freeze();

        // Convert to bytes and back
        const recreatedTx = TokenAssociateTransaction.fromBytes(
            originalTx.toBytes(),
        );

        // Verify properties are preserved
        expect(recreatedTx.accountId.toString()).to.equal("0.0.7");
        expect(recreatedTx.tokenIds.length).to.equal(2);
        expect(recreatedTx.tokenIds[0].toString()).to.equal("0.0.8");
        expect(recreatedTx.tokenIds[1].toString()).to.equal("0.0.9");

        // Verify the transaction can be executed
        expect(recreatedTx._getTransactionDataCase()).to.equal(
            "tokenAssociate",
        );
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

        it("should check every token ID checksum", function () {
            const transaction = new TokenAssociateTransaction().setTokenIds([
                TokenId.fromString("0.0.123-vfmkw"),
            ]);

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the account ID checksum", function () {
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";

            const transaction = new TokenAssociateTransaction().setAccountId(
                accountId,
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
                new TokenAssociateTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.associateTokens() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    associateTokens: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenAssociateTransaction()._execute(
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
            const transaction = new TokenAssociateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `TokenAssociateTransaction:${validStart.toString()}`,
            );
        });
    });
});
