import {
    AccountId,
    Client,
    NftId,
    Timestamp,
    TokenId,
    TokenRejectTransaction,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("Transaction", function () {
    const owner = new AccountId(1);
    const tokenIds = [new TokenId(2)];
    const nftId = new NftId(tokenIds[0], 3);

    it("encodes to correct protobuf", async function () {
        const owner = new AccountId(1);
        const tokenReject = new TokenRejectTransaction()
            .setOwnerId(owner)
            .setTokenIds(tokenIds)
            .setNftIds([nftId]);

        const protobuf = await tokenReject._makeTransactionData();
        expect(protobuf).to.deep.include({
            owner: owner._toProtobuf(),
            rejections: [
                {
                    fungibleToken: tokenIds[0]._toProtobuf(),
                },
                {
                    nft: nftId._toProtobuf(),
                },
            ],
        });
    });

    it("decodes from protobuf", async function () {
        const tx = new TokenRejectTransaction()
            .setOwnerId(owner)
            .setTokenIds(tokenIds)
            .setNftIds([nftId]);

        const decodedBackTx = Transaction.fromBytes(tx.toBytes());
        expect(tx.ownerId.toString()).to.equal(
            decodedBackTx.ownerId.toString(),
        );
        expect(tx.tokenIds.toString()).to.equal(
            decodedBackTx.tokenIds.toString(),
        );
        expect(tx.nftIds.toString()).to.equal(decodedBackTx.nftIds.toString());
    });

    it("should set owner id", function () {
        const owner = new AccountId(1);
        const tx = new TokenRejectTransaction().setOwnerId(owner);
        expect(tx.ownerId).to.equal(owner);
    });

    it("should revert when updating owner id while frozen", function () {
        const owner = new AccountId(1);
        const timestamp = new Timestamp(14, 15);

        const tx = new TokenRejectTransaction()
            .setTransactionId(TransactionId.withValidStart(owner, timestamp))
            .setNodeAccountIds([new AccountId(10, 11, 12)])
            .freeze();

        expect(() => tx.setOwnerId(new AccountId(2))).to.throw(
            "transaction is immutable; it has at least one signature or has been explicitly frozen",
        );
    });

    it("should set token ids", function () {
        const tokenIds = [new TokenId(1), new TokenId(2)];
        const tx = new TokenRejectTransaction().setTokenIds(tokenIds);
        expect(tx.tokenIds).to.deep.equal(tokenIds);
    });

    it("should revert when updating token ids when frozen", function () {
        const tokenIds = [new TokenId(1), new TokenId(2)];
        const owner = new AccountId(1);
        const timestamp = new Timestamp(14, 15);

        const tx = new TokenRejectTransaction()
            .setNodeAccountIds([new AccountId(10, 11, 12)])
            .setTransactionId(TransactionId.withValidStart(owner, timestamp))
            .freeze();
        expect(() => tx.setTokenIds(tokenIds)).to.throw(
            "transaction is immutable; it has at least one signature or has been explicitly frozen",
        );
    });

    it("should set nft ids", function () {
        const nftIds = [new NftId(1), new NftId(2)];
        const tx = new TokenRejectTransaction().setNftIds(nftIds);
        expect(tx.nftIds).to.deep.equal(nftIds);
    });

    it("should revert when updating nft ids when frozen", function () {
        const nftIds = [new NftId(1), new NftId(2)];
        const owner = new AccountId(1);
        const timestamp = new Timestamp(14, 15);

        const tx = new TokenRejectTransaction()
            .setNodeAccountIds([new AccountId(10, 11, 12)])
            .setTransactionId(TransactionId.withValidStart(owner, timestamp))
            .freeze();
        expect(() => tx.setNftIds(nftIds)).to.throw(
            "transaction is immutable; it has at least one signature or has been explicitly frozen",
        );
    });

    it("should add a token ID", function () {
        const transaction = new TokenRejectTransaction();
        const tokenId = new TokenId(1);

        expect(transaction.addTokenId(tokenId)).to.equal(transaction);
        expect(transaction.tokenIds).to.deep.equal([tokenId]);
    });

    it("should throw adding a token ID once frozen", function () {
        const transaction = new TokenRejectTransaction()
            .setNodeAccountIds([new AccountId(10, 11, 12)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(1),
                    new Timestamp(14, 15),
                ),
            )
            .freeze();

        expect(() => transaction.addTokenId(new TokenId(1))).to.throw(
            "transaction is immutable",
        );
    });

    it("should add an NFT ID", function () {
        const transaction = new TokenRejectTransaction();
        const nftId = new NftId(new TokenId(1), 2);

        expect(transaction.addNftId(nftId)).to.equal(transaction);
        expect(transaction.nftIds).to.deep.equal([nftId]);
    });

    it("should throw adding an NFT ID once frozen", function () {
        const transaction = new TokenRejectTransaction()
            .setNodeAccountIds([new AccountId(10, 11, 12)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(1),
                    new Timestamp(14, 15),
                ),
            )
            .freeze();

        expect(() =>
            transaction.addNftId(new NftId(new TokenId(1), 2)),
        ).to.throw("transaction is immutable");
    });

    it("should call token.rejectToken() with the request", async function () {
        const request = {};
        const response = {};
        const calls = [];
        const channel = {
            token: {
                rejectToken: (arg) => {
                    calls.push(arg);
                    return Promise.resolve(response);
                },
            },
        };

        expect(
            await new TokenRejectTransaction()._execute(channel, request),
        ).to.equal(response);
        expect(calls).to.deep.equal([request]);
        expect(calls[0]).to.equal(request);
    });

    it("should include the class name and valid start in the log ID", function () {
        const validStart = new Timestamp(1596210382, 0);
        const transaction = new TokenRejectTransaction()
            .setNodeAccountIds([new AccountId(0, 0, 3)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    validStart,
                ),
            )
            .freeze();

        expect(transaction._getLogId()).to.equal(
            `TokenRejectTransaction:${validStart.toString()}`,
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

        it("should check the token ID checksum", function () {
            const transaction = new TokenRejectTransaction().addTokenId(
                TokenId.fromString("0.0.123-vfmkw"),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the owner checksum", function () {
            const owner = new AccountId(0, 0, 123);
            owner._checksum = "vfmkw";

            const transaction = new TokenRejectTransaction().setOwnerId(owner);

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("validates the owner and every fungible and NFT token ID", function () {
            const validated = [];
            const id = (name) => ({
                validateChecksum: (client) => {
                    expect(client).to.equal(mainnet);
                    validated.push(name);
                },
            });

            const transaction = new TokenRejectTransaction();
            transaction._owner = id("owner");
            transaction._tokenIds = [id("token1"), null, id("token2")];
            transaction._nftIds = [
                { tokenId: id("nft1") },
                { tokenId: id("nft2") },
            ];

            transaction._validateChecksums(mainnet);

            expect(validated).to.have.members([
                "owner",
                "token1",
                "token2",
                "nft1",
                "nft2",
            ]);
        });

        it("skips unset IDs and empty lists", function () {
            const transaction = new TokenRejectTransaction();

            expect(() =>
                transaction._validateChecksums(testnet),
            ).to.not.throw();

            transaction._tokenIds = null;

            expect(() =>
                transaction._validateChecksums(testnet),
            ).to.not.throw();
        });

        it("checks the token checksum of an NFT", function () {
            const transaction = new TokenRejectTransaction().addNftId(
                new NftId(TokenId.fromString("0.0.123-vfmkw"), 1),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });
    });
});
