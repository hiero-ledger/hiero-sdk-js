import {
    AccountId,
    Client,
    TokenAirdropTransaction,
    NftId,
    TokenId,
    TransactionId,
    Timestamp,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

const SENDER = new AccountId(0, 0, 100);
const RECEIVER = new AccountId(0, 0, 101);

describe("TokenAirdropTransaction", function () {
    it("from | toBytes", async function () {
        const SENDER = new AccountId(0, 0, 100);
        const RECEIVER = new AccountId(0, 0, 101);
        const TOKEN_IDS = [
            new TokenId(0, 0, 1),
            new TokenId(0, 0, 2),
            new TokenId(0, 0, 3),
            new TokenId(0, 0, 4),
        ];
        const NFT_IDS = [
            new NftId(TOKEN_IDS[0], 1),
            new NftId(TOKEN_IDS[0], 2),
        ];
        const AMOUNT = 1000;
        const EXPECTED_DECIMALS = 1;

        const transaction = new TokenAirdropTransaction()
            .addTokenTransfer(TOKEN_IDS[0], SENDER, AMOUNT)
            .addTokenTransferWithDecimals(
                TOKEN_IDS[1],
                SENDER,
                AMOUNT,
                EXPECTED_DECIMALS,
            )
            .addApprovedTokenTransfer(TOKEN_IDS[2], SENDER, AMOUNT)
            .addApprovedTokenTransferWithDecimals(
                TOKEN_IDS[3],
                SENDER,
                AMOUNT,
                EXPECTED_DECIMALS,
            )
            .addNftTransfer(NFT_IDS[0], SENDER, RECEIVER)
            .addApprovedNftTransfer(NFT_IDS[1], SENDER, RECEIVER);

        const txBytes = transaction.toBytes();
        const tx = TokenAirdropTransaction.fromBytes(txBytes);

        // normal token transfer
        const tokenNormalTransfer = tx._tokenTransfers[0];
        expect(tokenNormalTransfer.tokenId).to.deep.equal(TOKEN_IDS[0]);
        expect(tokenNormalTransfer.accountId).to.deep.equal(SENDER);
        expect(tokenNormalTransfer.amount.toInt()).to.equal(AMOUNT);

        // token transfer with decimals
        const tokenTransferWithDecimals = tx._tokenTransfers[1];
        expect(tokenTransferWithDecimals.tokenId).to.deep.equal(TOKEN_IDS[1]);
        expect(tokenTransferWithDecimals.accountId).to.deep.equal(SENDER);
        expect(tokenTransferWithDecimals.amount.toInt()).to.equal(AMOUNT);

        expect(tokenTransferWithDecimals.expectedDecimals).to.equal(
            EXPECTED_DECIMALS,
        );

        // approved token transfer
        const approvedTokenTransfer = tx._tokenTransfers[2];
        expect(approvedTokenTransfer.tokenId).to.deep.equal(TOKEN_IDS[2]);
        expect(approvedTokenTransfer.accountId).to.deep.equal(SENDER);
        expect(approvedTokenTransfer.amount.toInt()).to.equal(AMOUNT);
        expect(approvedTokenTransfer.isApproved).to.equal(true);

        // approved token transfer with decimals
        const approvedTokenTransferWithDecimals = tx._tokenTransfers[3];
        expect(approvedTokenTransferWithDecimals.tokenId).to.deep.equal(
            TOKEN_IDS[3],
        );
        expect(approvedTokenTransferWithDecimals.accountId).to.deep.equal(
            SENDER,
        );
        expect(approvedTokenTransferWithDecimals.amount.toInt()).to.equal(
            AMOUNT,
        );
        expect(approvedTokenTransferWithDecimals.isApproved).to.equal(true);
        expect(approvedTokenTransferWithDecimals.expectedDecimals).to.equal(
            EXPECTED_DECIMALS,
        );

        // nft transfer
        const nftTransfer = tx._nftTransfers[0];
        expect(nftTransfer.tokenId).to.deep.equal(NFT_IDS[0].tokenId);
        expect(nftTransfer.serialNumber).to.deep.equal(NFT_IDS[0].serial);
        expect(nftTransfer.senderAccountId).to.deep.equal(SENDER);
        expect(nftTransfer.receiverAccountId).to.deep.equal(RECEIVER);

        // approved nft transfer
        const approvedNftTransfer = tx._nftTransfers[1];
        expect(approvedNftTransfer.tokenId).to.deep.equal(NFT_IDS[1].tokenId);
        expect(approvedNftTransfer.serialNumber).to.deep.equal(
            NFT_IDS[1].serial,
        );
        expect(approvedNftTransfer.senderAccountId).to.deep.equal(SENDER);
        expect(approvedNftTransfer.receiverAccountId).to.deep.equal(RECEIVER);
        expect(approvedNftTransfer.isApproved).to.equal(true);
    });

    it("should call token.airdropTokens() with the request", async function () {
        const request = {};
        const response = {};
        const calls = [];
        const channel = {
            token: {
                airdropTokens: (arg) => {
                    calls.push(arg);
                    return Promise.resolve(response);
                },
            },
        };

        expect(
            await new TokenAirdropTransaction()._execute(channel, request),
        ).to.equal(response);
        expect(calls).to.deep.equal([request]);
        expect(calls[0]).to.equal(request);
    });

    it("should include the class name and valid start in the log ID", function () {
        const validStart = new Timestamp(1596210382, 0);
        const transaction = new TokenAirdropTransaction()
            .setNodeAccountIds([new AccountId(0, 0, 3)])
            .setTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    validStart,
                ),
            )
            .freeze();

        expect(transaction._getLogId()).to.equal(
            `TokenAirdropTransaction:${validStart.toString()}`,
        );
    });

    describe("addTokenTransfer", function () {
        it("should accept string token and account IDs", function () {
            const transaction = new TokenAirdropTransaction().addTokenTransfer(
                "0.0.1",
                "0.0.100",
                5,
            );

            expect(transaction._tokenTransfers).to.have.length(1);
            expect(transaction._tokenTransfers[0].tokenId.toString()).to.equal(
                "0.0.1",
            );
            expect(
                transaction._tokenTransfers[0].accountId.toString(),
            ).to.equal("0.0.100");
            expect(transaction._tokenTransfers[0].amount.toNumber()).to.equal(
                5,
            );
            expect(transaction._tokenTransfers[0].isApproved).to.be.false;
        });

        it("should sum duplicate token transfers", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransfer(tokenId, SENDER, 7);

            expect(transaction._tokenTransfers).to.have.length(1);
            expect(transaction._tokenTransfers[0].amount.toNumber()).to.equal(
                12,
            );
        });

        it("should keep separate accounts for the same token", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransfer(tokenId, RECEIVER, 7);

            expect(transaction._tokenTransfers).to.have.length(2);
        });

        it("should keep Long amounts", function () {
            const transaction = new TokenAirdropTransaction().addTokenTransfer(
                new TokenId(0, 0, 1),
                SENDER,
                Long.fromNumber(5),
            );

            expect(
                transaction._tokenTransfers[0].amount.equals(
                    Long.fromNumber(5),
                ),
            ).to.be.true;
        });
    });

    describe("addApprovedTokenTransfer", function () {
        it("should mark the transfer as approved", function () {
            const transaction =
                new TokenAirdropTransaction().addApprovedTokenTransfer(
                    new TokenId(0, 0, 1),
                    SENDER,
                    5,
                );

            expect(transaction._tokenTransfers[0].isApproved).to.be.true;
        });
    });

    describe("addTokenTransferWithDecimals", function () {
        it("should add a new transfer with decimals", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction =
                new TokenAirdropTransaction().addTokenTransferWithDecimals(
                    tokenId,
                    SENDER,
                    5,
                    2,
                );

            expect(transaction._tokenTransfers).to.have.length(1);
            expect(transaction._tokenTransfers[0].expectedDecimals).to.equal(2);
        });

        it("should sum an existing transfer and set its decimals", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransferWithDecimals(tokenId, SENDER, 7, 2);

            expect(transaction._tokenTransfers).to.have.length(1);
            expect(transaction._tokenTransfers[0].amount.toNumber()).to.equal(
                12,
            );
            expect(transaction._tokenTransfers[0].expectedDecimals).to.equal(2);
        });

        it("should add a new transfer for an existing token with a different account", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransferWithDecimals(tokenId, RECEIVER, 7, 2);

            expect(transaction._tokenTransfers).to.have.length(2);
            expect(transaction._tokenTransfers[1].expectedDecimals).to.equal(2);
        });

        it("should throw on a decimals mismatch", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction =
                new TokenAirdropTransaction().addTokenTransferWithDecimals(
                    tokenId,
                    SENDER,
                    5,
                    2,
                );

            expect(() =>
                transaction.addTokenTransferWithDecimals(
                    tokenId,
                    RECEIVER,
                    7,
                    3,
                ),
            ).to.throw("expected decimals mismatch");
        });
    });

    describe("addNftTransfer", function () {
        it("should accept an NftId and string account IDs", function () {
            const nftId = new NftId(new TokenId(0, 0, 1), 1);
            const transaction = new TokenAirdropTransaction().addNftTransfer(
                nftId,
                "0.0.100",
                "0.0.101",
            );

            expect(transaction._nftTransfers).to.have.length(1);
            expect(
                transaction._nftTransfers[0].senderAccountId.toString(),
            ).to.equal("0.0.100");
            expect(
                transaction._nftTransfers[0].receiverAccountId.toString(),
            ).to.equal("0.0.101");
        });

        it("should accept a TokenId and serial number", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction().addNftTransfer(
                tokenId,
                2,
                SENDER,
                RECEIVER,
            );

            expect(transaction._nftTransfers).to.have.length(1);
            expect(
                transaction._nftTransfers[0].serialNumber.toNumber(),
            ).to.equal(2);
            expect(transaction._nftTransfers[0].tokenId).to.deep.equal(tokenId);
        });

        it("should accept an NFT ID string", function () {
            const transaction = new TokenAirdropTransaction().addNftTransfer(
                "0.0.1/2",
                SENDER,
                RECEIVER,
            );

            expect(transaction._nftTransfers).to.have.length(1);
            expect(
                transaction._nftTransfers[0].serialNumber.toNumber(),
            ).to.equal(2);
        });

        it("should accept a token ID string with a serial number", function () {
            const transaction = new TokenAirdropTransaction().addNftTransfer(
                "0.0.1",
                2,
                SENDER,
                RECEIVER,
            );

            expect(transaction._nftTransfers).to.have.length(1);
            expect(transaction._nftTransfers[0].tokenId.toString()).to.equal(
                "0.0.1",
            );
            expect(
                transaction._nftTransfers[0].serialNumber.toNumber(),
            ).to.equal(2);
        });

        it("should update a duplicate NFT transfer", function () {
            const nftId = new NftId(new TokenId(0, 0, 1), 1);
            const transaction = new TokenAirdropTransaction()
                .addNftTransfer(nftId, SENDER, RECEIVER)
                .addNftTransfer(nftId, RECEIVER, SENDER);

            expect(transaction._nftTransfers).to.have.length(1);
            expect(transaction._nftTransfers[0].senderAccountId).to.deep.equal(
                RECEIVER,
            );
            expect(
                transaction._nftTransfers[0].receiverAccountId,
            ).to.deep.equal(SENDER);
        });
    });

    describe("addApprovedNftTransfer", function () {
        it("should mark the transfer as approved", function () {
            const transaction =
                new TokenAirdropTransaction().addApprovedNftTransfer(
                    new NftId(new TokenId(0, 0, 1), 1),
                    SENDER,
                    RECEIVER,
                );

            expect(transaction._nftTransfers[0].isApproved).to.be.true;
        });
    });

    describe("getters", function () {
        it("should expose tokenIdDecimals", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction =
                new TokenAirdropTransaction().addTokenTransferWithDecimals(
                    tokenId,
                    SENDER,
                    5,
                    2,
                );

            expect(transaction.tokenIdDecimals.get(tokenId)).to.equal(2);
        });

        it("should group nftTransfers by token", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addNftTransfer(new NftId(tokenId, 1), SENDER, RECEIVER)
                .addNftTransfer(new NftId(tokenId, 2), SENDER, RECEIVER);

            expect(transaction.nftTransfers.get(tokenId)).to.have.length(2);
        });

        it("should group tokenTransfers by token and account", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransfer(tokenId, RECEIVER, 7);

            expect(
                transaction.tokenTransfers.get(tokenId).get(SENDER).toNumber(),
            ).to.equal(5);
            expect(
                transaction.tokenTransfers
                    .get(tokenId)
                    .get(RECEIVER)
                    .toNumber(),
            ).to.equal(7);
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode a token transfer that sorts before an NFT transfer", function () {
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(new TokenId(0, 0, 1), SENDER, 5)
                .addNftTransfer(
                    new NftId(new TokenId(0, 0, 2), 1),
                    SENDER,
                    RECEIVER,
                );

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(2);
            expect(data.tokenTransfers[0].transfers).to.have.length(1);
            expect(data.tokenTransfers[0].nftTransfers).to.have.length(0);
            expect(data.tokenTransfers[1].transfers).to.have.length(0);
            expect(data.tokenTransfers[1].nftTransfers).to.have.length(1);
        });

        it("should encode an NFT transfer that sorts before a token transfer", function () {
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(new TokenId(0, 0, 2), SENDER, 5)
                .addNftTransfer(
                    new NftId(new TokenId(0, 0, 1), 1),
                    SENDER,
                    RECEIVER,
                );

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(2);
            expect(data.tokenTransfers[0].transfers).to.have.length(0);
            expect(data.tokenTransfers[0].nftTransfers).to.have.length(1);
        });

        it("should combine token and NFT transfers with the same token", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addNftTransfer(new NftId(tokenId, 1), SENDER, RECEIVER);

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(1);
            expect(data.tokenTransfers[0].transfers).to.have.length(1);
            expect(data.tokenTransfers[0].nftTransfers).to.have.length(1);
        });

        it("should merge multiple token transfers for the same token", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransfer(tokenId, RECEIVER, 7);

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(1);
            expect(data.tokenTransfers[0].transfers).to.have.length(2);
        });

        it("should merge multiple NFT transfers for the same token", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addNftTransfer(new NftId(tokenId, 1), SENDER, RECEIVER)
                .addNftTransfer(new NftId(tokenId, 2), SENDER, RECEIVER);

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(1);
            expect(data.tokenTransfers[0].nftTransfers).to.have.length(2);
        });

        it("should append a token transfer after a combined entry", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransfer(tokenId, RECEIVER, 7)
                .addNftTransfer(new NftId(tokenId, 1), SENDER, RECEIVER)
                .addNftTransfer(
                    new NftId(new TokenId(0, 0, 2), 1),
                    SENDER,
                    RECEIVER,
                );

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(2);
            expect(data.tokenTransfers[0].transfers).to.have.length(2);
            expect(data.tokenTransfers[0].nftTransfers).to.have.length(1);
        });

        it("should append an NFT transfer after a combined entry", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction = new TokenAirdropTransaction()
                .addTokenTransfer(tokenId, SENDER, 5)
                .addTokenTransfer(new TokenId(0, 0, 2), SENDER, 7)
                .addNftTransfer(new NftId(tokenId, 1), SENDER, RECEIVER)
                .addNftTransfer(new NftId(tokenId, 2), SENDER, RECEIVER);

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers).to.have.length(2);
            expect(data.tokenTransfers[0].nftTransfers).to.have.length(2);
        });

        it("should encode decimals when present", function () {
            const tokenId = new TokenId(0, 0, 1);
            const transaction =
                new TokenAirdropTransaction().addTokenTransferWithDecimals(
                    tokenId,
                    SENDER,
                    5,
                    2,
                );

            const data = transaction._makeTransactionData();

            expect(data.tokenTransfers[0].expectedDecimals).to.deep.equal({
                value: 2,
            });
        });
    });

    // TODO(#4683): TokenAirdropTransaction does not validate entity ID checksums yet.
    describe.skip("_validateChecksums", function () {
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
            const transaction = new TokenAirdropTransaction().addTokenTransfer(
                TokenId.fromString("0.0.123-vfmkw"),
                SENDER,
                5,
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the sender and receiver checksums", function () {
            const sender = new AccountId(0, 0, 123);
            sender._checksum = "vfmkw";
            const receiver = new AccountId(0, 0, 456);
            receiver._checksum = "vfmkw";

            const transaction = new TokenAirdropTransaction().addTokenTransfer(
                new TokenId(0, 0, 1),
                sender,
                5,
            );

            transaction.addNftTransfer(
                new NftId(new TokenId(0, 0, 1), 1),
                sender,
                receiver,
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
