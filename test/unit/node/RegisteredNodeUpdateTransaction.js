import {
    AccountId,
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    Hbar,
    Long,
    MirrorNodeServiceEndpoint,
    PrivateKey,
    RegisteredNodeUpdateTransaction,
    Timestamp,
    TransactionId,
} from "../../../src/index.js";

describe("RegisteredNodeUpdateTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);
    const ADMIN_KEY = PrivateKey.fromStringED25519(
        "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
    ).publicKey;

    /**
     * @returns {RegisteredNodeUpdateTransaction}
     */
    function makeTransaction() {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];

        return new RegisteredNodeUpdateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setRegisteredNodeId(123)
            .setAdminKey(ADMIN_KEY)
            .setDescription("My Updated Block Node")
            .setNodeAccountId(AccountId.fromString("0.0.7002"))
            .addServiceEndpoint(
                new BlockNodeServiceEndpoint()
                    .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                    .setPort(443)
                    .setRequiresTls(true)
                    .setEndpointApi(BlockNodeApi.Status),
            )
            .addServiceEndpoint(
                new MirrorNodeServiceEndpoint()
                    .setDomainName("mirror.example.com")
                    .setPort(5600)
                    .setRequiresTls(true),
            )
            .setMaxTransactionFee(new Hbar(1));
    }

    it("should convert from and to bytes", function () {
        const tx = makeTransaction();
        const tx2 = RegisteredNodeUpdateTransaction.fromBytes(tx.toBytes());

        expect(tx.transactionId.toString()).to.equal(
            tx2.transactionId.toString(),
        );
        expect(tx2.registeredNodeId.toString()).to.equal("123");
        expect(tx.adminKey.toString()).to.equal(tx2.adminKey.toString());
        expect(tx.description).to.equal(tx2.description);
        expect(tx.nodeAccountId.toString()).to.equal("0.0.7002");
        expect(tx2.serviceEndpoints.length).to.equal(2);
        expect(tx2.serviceEndpoints[0].type).to.equal("blockNode");
        expect(tx2.serviceEndpoints[0].endpointApi).to.equal(
            BlockNodeApi.Status,
        );
        expect(tx2.serviceEndpoints[1].type).to.equal("mirrorNode");
    });

    it("should clear the description", function () {
        const tx = new RegisteredNodeUpdateTransaction().setDescription(
            "to clear",
        );
        tx.clearDescription();
        expect(tx.description).to.equal("");
    });

    it("should require registeredNodeId before freeze", function () {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];
        const tx = new RegisteredNodeUpdateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            );

        expect(() => tx.freeze()).to.throw(
            "RegisteredNodeUpdateTransaction: 'registeredNodeId' must be explicitly set before calling freeze().",
        );
    });

    it("should set registeredNodeId as a long", function () {
        const tx = new RegisteredNodeUpdateTransaction().setRegisteredNodeId(
            Long.fromNumber(456),
        );
        expect(tx.registeredNodeId.toString()).to.equal("456");
    });
});
