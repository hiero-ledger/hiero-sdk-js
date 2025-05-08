import {
    AccountId,
    NftId,
    Timestamp,
    TokenId,
    TokenRejectTransaction,
    Transaction,
    TransactionId,
} from "../../src/index.js";

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
});
