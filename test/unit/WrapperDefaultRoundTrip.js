import {
    AccountUpdateTransaction,
    ContractUpdateTransaction,
    NodeUpdateTransaction,
    RegisteredNodeUpdateTransaction,
    TokenUpdateNftsTransaction,
    TokenUpdateTransaction,
    TopicUpdateTransaction,
    Transaction,
    TransferTransaction,
} from "../../src/index.js";

/**
 * Wrapper-typed fields set to their default value ("", 0, false, empty bytes)
 * must survive a bytes round trip, so "clear" is not read back as "unchanged".
 *
 * @template {Transaction} T
 * @param {T} tx
 * @returns {T}
 */
function roundTrip(tx) {
    return /** @type {T} */ (Transaction.fromBytes(tx.toBytes()));
}

describe("wrapper fields set to their default value", function () {
    it("AccountUpdateTransaction keeps false and 0", function () {
        const tx = roundTrip(
            new AccountUpdateTransaction()
                .setAccountId("0.0.5")
                .setReceiverSignatureRequired(false)
                .setMaxAutomaticTokenAssociations(0)
                .setDeclineStakingReward(false),
        );

        expect(tx.receiverSignatureRequired).to.equal(false);
        expect(tx.maxAutomaticTokenAssociations.toNumber()).to.equal(0);
        expect(tx.declineStakingRewards).to.equal(false);
    });

    it("ContractUpdateTransaction keeps false and an unset field stays null", function () {
        const tx = roundTrip(
            new ContractUpdateTransaction()
                .setContractId("0.0.5")
                .setDeclineStakingReward(false),
        );
        const unset = roundTrip(
            new ContractUpdateTransaction().setContractId("0.0.5"),
        );

        expect(tx.declineStakingRewards).to.equal(false);
        expect(unset.declineStakingRewards).to.be.null;
    });

    it("NodeUpdateTransaction keeps an empty description and hash", function () {
        const tx = roundTrip(
            new NodeUpdateTransaction()
                .setNodeId(1)
                .setDescription("")
                .setCertificateHash(new Uint8Array()),
        );

        expect(tx.description).to.equal("");
        expect(tx.certificateHash).to.deep.equal(new Uint8Array());
    });

    it("RegisteredNodeUpdateTransaction keeps an empty description", function () {
        const tx = roundTrip(
            new RegisteredNodeUpdateTransaction()
                .setRegisteredNodeId(1)
                .setDescription(""),
        );

        expect(tx.description).to.equal("");
    });

    it("TopicUpdateTransaction keeps an empty memo", function () {
        const tx = roundTrip(
            new TopicUpdateTransaction().setTopicId("0.0.5").setTopicMemo(""),
        );

        expect(tx.topicMemo).to.equal("");
    });

    it("TokenUpdateTransaction keeps empty metadata", function () {
        const tx = roundTrip(
            new TokenUpdateTransaction()
                .setTokenId("0.0.5")
                .setMetadata(new Uint8Array()),
        );

        expect(tx.metadata).to.deep.equal(new Uint8Array());
    });

    it("TokenUpdateNftsTransaction keeps empty metadata", function () {
        const tx = roundTrip(
            new TokenUpdateNftsTransaction()
                .setTokenId("0.0.5")
                .setMetadata(new Uint8Array()),
        );

        expect(tx._makeTransactionData().metadata.value).to.deep.equal(
            new Uint8Array(),
        );
    });

    it("TransferTransaction keeps 0 expected decimals", function () {
        const tx = roundTrip(
            new TransferTransaction()
                .addTokenTransferWithDecimals("0.0.5", "0.0.6", -1, 0)
                .addTokenTransferWithDecimals("0.0.5", "0.0.7", 1, 0),
        );

        expect(tx.tokenIdDecimals.get("0.0.5")).to.equal(0);
    });
});
