import Long from "long";
import BigNumber from "bignumber.js";

import {
    AccountAllowanceApproveTransaction,
    AccountId,
    Hbar,
    NftId,
    Timestamp,
    TokenId,
    Transaction,
    TransactionId,
    Client,
} from "../../src/index.js";
import sinon from "sinon";

describe("AccountAllowanceApproveTransaction", function () {
    it("should round trip from bytes and maintain order", function () {
        const tokenId1 = new TokenId(1);
        const tokenId2 = new TokenId(141);
        const serialNumber1 = Long.fromNumber(3);
        const serialNumber2 = Long.fromNumber(4);
        const nftId1 = new NftId(tokenId2, serialNumber1);
        const nftId2 = new NftId(tokenId2, serialNumber2);
        const spenderAccountId1 = new AccountId(7);
        const spenderAccountId2 = new AccountId(7890);
        const nodeAccountId = new AccountId(10, 11, 12);
        const timestamp1 = new Timestamp(14, 15);
        const hbarAmount = Hbar.fromTinybars(100);
        const tokenAmount = Long.fromNumber(101);
        const ownerAccountId = new AccountId(20);

        let transaction = new AccountAllowanceApproveTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .approveHbarAllowance(ownerAccountId, spenderAccountId1, hbarAmount)
            .approveTokenAllowance(
                tokenId1,
                ownerAccountId,
                spenderAccountId1,
                tokenAmount,
            )
            .approveTokenNftAllowance(nftId1, ownerAccountId, spenderAccountId1)
            .approveTokenNftAllowance(nftId2, ownerAccountId, spenderAccountId1)
            .approveTokenNftAllowance(nftId2, ownerAccountId, spenderAccountId2)
            .approveTokenNftAllowanceAllSerials(
                tokenId1,
                ownerAccountId,
                spenderAccountId1,
            )
            .freeze();

        transaction = Transaction.fromBytes(transaction.toBytes());

        const data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            cryptoAllowances: [
                {
                    owner: ownerAccountId._toProtobuf(),
                    amount: hbarAmount.toTinybars(),
                    spender: spenderAccountId1._toProtobuf(),
                },
            ],
            nftAllowances: [
                {
                    owner: ownerAccountId._toProtobuf(),
                    serialNumbers: [serialNumber1, serialNumber2],
                    spender: spenderAccountId1._toProtobuf(),
                    tokenId: tokenId2._toProtobuf(),
                    approvedForAll: null,
                    delegatingSpender: null,
                },
                {
                    owner: ownerAccountId._toProtobuf(),
                    serialNumbers: [serialNumber2],
                    spender: spenderAccountId2._toProtobuf(),
                    tokenId: tokenId2._toProtobuf(),
                    approvedForAll: null,
                    delegatingSpender: null,
                },
                {
                    owner: ownerAccountId._toProtobuf(),
                    serialNumbers: null,
                    spender: spenderAccountId1._toProtobuf(),
                    tokenId: tokenId1._toProtobuf(),
                    approvedForAll: { value: true },
                    delegatingSpender: null,
                },
            ],
            tokenAllowances: [
                {
                    owner: ownerAccountId._toProtobuf(),
                    amount: tokenAmount,
                    spender: spenderAccountId1._toProtobuf(),
                    tokenId: tokenId1._toProtobuf(),
                },
            ],
        });
    });

    // Test for addHbarAllowance (deprecated)
    it("should add hbar allowance with deprecated method", function () {
        const spenderAccountId = new AccountId(5);
        const hbarAmount = Hbar.fromTinybars(200);

        const transaction =
            new AccountAllowanceApproveTransaction().addHbarAllowance(
                spenderAccountId,
                hbarAmount,
            );

        expect(transaction.hbarApprovals.length).to.equal(1);
        expect(
            transaction.hbarApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.hbarApprovals[0].amount.toString()).to.equal(
            hbarAmount.toString(),
        );
        expect(transaction.hbarApprovals[0].ownerAccountId).to.be.null;

        // Test with string parameter
        const transaction2 =
            new AccountAllowanceApproveTransaction().addHbarAllowance(
                "0.0.6",
                300,
            );

        expect(transaction2.hbarApprovals.length).to.equal(1);
        expect(
            transaction2.hbarApprovals[0].spenderAccountId.toString(),
        ).to.equal("0.0.6");
        expect(
            transaction2.hbarApprovals[0].amount.toTinybars().toString(),
        ).to.equal("30000000000");
    });

    // Test for addTokenAllowance (deprecated)
    it("should add token allowance with deprecated method", function () {
        const tokenId = new TokenId(10);
        const spenderAccountId = new AccountId(15);
        const amount = Long.fromNumber(500);

        const transaction =
            new AccountAllowanceApproveTransaction().addTokenAllowance(
                tokenId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            amount.toString(),
        );
        expect(transaction.tokenApprovals[0].ownerAccountId).to.be.null;

        // Test with string parameters
        const transaction2 =
            new AccountAllowanceApproveTransaction().addTokenAllowance(
                "0.0.11",
                "0.0.16",
                600,
            );

        expect(transaction2.tokenApprovals.length).to.equal(1);
        expect(transaction2.tokenApprovals[0].tokenId.toString()).to.equal(
            "0.0.11",
        );
        expect(
            transaction2.tokenApprovals[0].spenderAccountId.toString(),
        ).to.equal("0.0.16");
        expect(transaction2.tokenApprovals[0].amount.toString()).to.equal(
            "600",
        );
    });

    // Test for addAllTokenNftAllowance (deprecated)
    it("should add all token NFT allowance with deprecated method", function () {
        const tokenId = new TokenId(20);
        const ownerAccountId = new AccountId(25);
        const spenderAccountId = new AccountId(30);

        const transaction =
            new AccountAllowanceApproveTransaction().addAllTokenNftAllowance(
                tokenId,
                ownerAccountId,
                spenderAccountId,
            );

        expect(transaction.tokenNftApprovals.length).to.equal(1);
        expect(transaction.tokenNftApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenNftApprovals[0].ownerAccountId.toString(),
        ).to.equal(ownerAccountId.toString());
        expect(
            transaction.tokenNftApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenNftApprovals[0].serialNumbers).to.be.null;
        expect(transaction.tokenNftApprovals[0].allSerials).to.be.true;

        // Test with string parameters
        const transaction2 =
            new AccountAllowanceApproveTransaction().addAllTokenNftAllowance(
                "0.0.21",
                "0.0.26",
                "0.0.31",
            );

        expect(transaction2.tokenNftApprovals.length).to.equal(1);
        expect(transaction2.tokenNftApprovals[0].tokenId.toString()).to.equal(
            "0.0.21",
        );
        expect(
            transaction2.tokenNftApprovals[0].ownerAccountId.toString(),
        ).to.equal("0.0.26");
        expect(
            transaction2.tokenNftApprovals[0].spenderAccountId.toString(),
        ).to.equal("0.0.31");
    });

    // Test for deleteTokenNftAllowanceAllSerials
    it("should delete token NFT allowance all serials", function () {
        const tokenId = new TokenId(40);
        const ownerAccountId = new AccountId(45);
        const spenderAccountId = new AccountId(50);

        const transaction =
            new AccountAllowanceApproveTransaction().deleteTokenNftAllowanceAllSerials(
                tokenId,
                ownerAccountId,
                spenderAccountId,
            );

        expect(transaction.tokenNftApprovals.length).to.equal(1);
        expect(transaction.tokenNftApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenNftApprovals[0].ownerAccountId.toString(),
        ).to.equal(ownerAccountId.toString());
        expect(
            transaction.tokenNftApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenNftApprovals[0].serialNumbers).to.be.null;
        expect(transaction.tokenNftApprovals[0].allSerials).to.be.false;

        // Test with string parameters
        const transaction2 =
            new AccountAllowanceApproveTransaction().deleteTokenNftAllowanceAllSerials(
                "0.0.41",
                "0.0.46",
                "0.0.51",
            );

        expect(transaction2.tokenNftApprovals.length).to.equal(1);
        expect(transaction2.tokenNftApprovals[0].tokenId.toString()).to.equal(
            "0.0.41",
        );
        expect(
            transaction2.tokenNftApprovals[0].ownerAccountId.toString(),
        ).to.equal("0.0.46");
        expect(
            transaction2.tokenNftApprovals[0].spenderAccountId.toString(),
        ).to.equal("0.0.51");
        expect(transaction2.tokenNftApprovals[0].allSerials).to.be.false;
    });

    // Test for _validateChecksums
    it("should validate checksums for all approvals", function () {
        const client = new Client({
            network: { "127.0.0.1:50211": "0.0.3" },
        });

        // Create stubs for validateChecksum methods
        const hbarAllowanceValidateStub = sinon.stub();
        const tokenAllowanceValidateStub = sinon.stub();
        const nftAllowanceValidateStub = sinon.stub();

        const hbarAllowance = { _validateChecksums: hbarAllowanceValidateStub };
        const tokenAllowance = {
            _validateChecksums: tokenAllowanceValidateStub,
        };
        const nftAllowance = { _validateChecksums: nftAllowanceValidateStub };

        // Create transaction with mocked allowances
        const transaction = new AccountAllowanceApproveTransaction();
        transaction._hbarApprovals = [hbarAllowance];
        transaction._tokenApprovals = [tokenAllowance];
        transaction._nftApprovals = [nftAllowance];

        // Call _validateChecksums
        transaction._validateChecksums(client);

        // Verify that each allowance's _validateChecksums was called
        expect(hbarAllowanceValidateStub.calledOnceWith(client)).to.be.true;
        expect(tokenAllowanceValidateStub.calledOnceWith(client)).to.be.true;
        expect(nftAllowanceValidateStub.calledOnceWith(client)).to.be.true;
    });

    it("should handle BigNumber amount in approveTokenAllowance", function () {
        const tokenId = new TokenId(10);
        const ownerAccountId = new AccountId(15);
        const spenderAccountId = new AccountId(20);
        const amount = new BigNumber("1000.5");

        const transaction =
            new AccountAllowanceApproveTransaction().approveTokenAllowance(
                tokenId,
                ownerAccountId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenApprovals[0].ownerAccountId.toString(),
        ).to.equal(ownerAccountId.toString());
        expect(
            transaction.tokenApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            "1000",
        );
    });

    it("should handle bigint amount in approveTokenAllowance", function () {
        const tokenId = new TokenId(10);
        const ownerAccountId = new AccountId(15);
        const spenderAccountId = new AccountId(20);
        const amount = 2000n;

        const transaction =
            new AccountAllowanceApproveTransaction().approveTokenAllowance(
                tokenId,
                ownerAccountId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenApprovals[0].ownerAccountId.toString(),
        ).to.equal(ownerAccountId.toString());
        expect(
            transaction.tokenApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            "2000",
        );
    });

    it("should handle BigNumber amount in addTokenAllowance", function () {
        const tokenId = new TokenId(10);
        const spenderAccountId = new AccountId(15);
        const amount = new BigNumber("3000.7");

        const transaction =
            new AccountAllowanceApproveTransaction().addTokenAllowance(
                tokenId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            "3000",
        );
        expect(transaction.tokenApprovals[0].ownerAccountId).to.be.null;
    });

    it("should handle bigint amount in addTokenAllowance", function () {
        const tokenId = new TokenId(10);
        const spenderAccountId = new AccountId(15);
        const amount = 4000n;

        const transaction =
            new AccountAllowanceApproveTransaction().addTokenAllowance(
                tokenId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(
            transaction.tokenApprovals[0].spenderAccountId.toString(),
        ).to.equal(spenderAccountId.toString());
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            "4000",
        );
        expect(transaction.tokenApprovals[0].ownerAccountId).to.be.null;
    });

    it("should handle large BigNumber amounts", function () {
        const tokenId = new TokenId(10);
        const ownerAccountId = new AccountId(15);
        const spenderAccountId = new AccountId(20);
        const amount = new BigNumber("9000000000000000000");

        const transaction =
            new AccountAllowanceApproveTransaction().approveTokenAllowance(
                tokenId,
                ownerAccountId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            "9000000000000000000",
        );
    });

    it("should handle large bigint amounts", function () {
        const tokenId = new TokenId(10);
        const ownerAccountId = new AccountId(15);
        const spenderAccountId = new AccountId(20);
        const amount = 9000000000000000000n;

        const transaction =
            new AccountAllowanceApproveTransaction().approveTokenAllowance(
                tokenId,
                ownerAccountId,
                spenderAccountId,
                amount,
            );

        expect(transaction.tokenApprovals.length).to.equal(1);
        expect(transaction.tokenApprovals[0].amount.toString()).to.equal(
            "9000000000000000000",
        );
    });
});
