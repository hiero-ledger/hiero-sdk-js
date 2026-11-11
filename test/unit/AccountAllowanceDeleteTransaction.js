import {
    AccountAllowanceDeleteTransaction,
    AccountId,
    Transaction,
    TransactionId,
    TokenId,
    NftId,
    Timestamp,
    Client,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

describe("AccountAllowanceDeleteTransaction", function () {
    it("[from|to]Bytes", async function () {
        const tokenId = TokenId.fromString("1.2.3");
        const serialNumber = Long.fromNumber(4);
        const operatorId = AccountId.fromString("5.6.7");
        const nftId = new NftId(tokenId, serialNumber);
        const transactionId = TransactionId.fromString(
            `${operatorId.toString()}@8.9`,
        );
        const nodeAccountId = AccountId.fromString("10.11.12");
        const transaction = new AccountAllowanceDeleteTransaction()
            .setNodeAccountIds([nodeAccountId])
            .setTransactionId(transactionId)
            .deleteAllTokenNftAllowances(nftId, operatorId)
            .freeze();

        const bytes = transaction.toBytes();
        Transaction.fromBytes(bytes);
    });

    it("deleting NFT allowances is accumulative", function () {
        const operatorId = AccountId.fromString("5.6.7");
        const transaction = new AccountAllowanceDeleteTransaction()
            .deleteAllTokenNftAllowances(
                new NftId(TokenId.fromString("1.2.3"), Long.fromNumber(4)),
                operatorId,
            )
            .deleteAllTokenNftAllowances(
                new NftId(TokenId.fromString("1.2.3"), Long.fromNumber(5)),
                operatorId,
            )
            .deleteAllTokenNftAllowances(
                new NftId(TokenId.fromString("2.3.4"), Long.fromNumber(6)),
                operatorId,
            );

        expect(transaction.tokenNftAllowanceDeletions).to.have.lengthOf(2);

        const [first, second] = transaction.tokenNftAllowanceDeletions;

        expect(first.tokenId.toString()).to.equal("1.2.3");
        expect(first.serialNumbers).to.have.lengthOf(2);
        expect(first.serialNumbers[0].toNumber()).to.equal(4);
        expect(first.serialNumbers[1].toNumber()).to.equal(5);
        expect(first.ownerAccountId.toString()).to.equal("5.6.7");

        expect(second.tokenId.toString()).to.equal("2.3.4");
        expect(second.serialNumbers).to.have.lengthOf(1);
        expect(second.serialNumbers[0].toNumber()).to.equal(6);
    });

    it("accepts string NftIds and owner accounts", function () {
        const transaction =
            new AccountAllowanceDeleteTransaction().deleteAllTokenNftAllowances(
                "1.2.3/4",
                "5.6.7",
            );

        const deletion = transaction.tokenNftAllowanceDeletions[0];

        expect(deletion.tokenId.toString()).to.equal("1.2.3");
        expect(deletion.serialNumbers[0].toNumber()).to.equal(4);
        expect(deletion.ownerAccountId.toString()).to.equal("5.6.7");
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

        /**
         * @returns {AccountId}
         */
        function checksummedAccountId() {
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";
            return accountId;
        }

        it("should check the token ID checksum against the client's network", function () {
            const tokenId = new TokenId(0, 0, 123);
            tokenId._checksum = "vfmkw";

            const transaction =
                new AccountAllowanceDeleteTransaction().deleteAllTokenNftAllowances(
                    new NftId(tokenId, Long.fromNumber(1)),
                    new AccountId(0, 0, 456),
                );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the owner account ID checksum against the client's network", function () {
            const transaction =
                new AccountAllowanceDeleteTransaction().deleteAllTokenNftAllowances(
                    new NftId(new TokenId(0, 0, 456), Long.fromNumber(1)),
                    checksummedAccountId(),
                );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should not throw without any deletions", function () {
            expect(() =>
                new AccountAllowanceDeleteTransaction()._validateChecksums(
                    testnet,
                ),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.deleteAllowances() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    deleteAllowances: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new AccountAllowanceDeleteTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const VALID_START = new Timestamp(1596210382, 0);
            const transaction = new AccountAllowanceDeleteTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `AccountAllowanceDeleteTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
