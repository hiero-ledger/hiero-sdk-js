import { expect } from "chai";
import {
    AccountId,
    TokenAirdropTransaction,
    NftId,
    TokenId,
} from "../../src/index.js";

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
});
