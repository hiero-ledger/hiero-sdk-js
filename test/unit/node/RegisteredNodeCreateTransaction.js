import {
    AccountId,
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    Hbar,
    PrivateKey,
    RegisteredNodeCreateTransaction,
    Timestamp,
    TransactionId,
} from "../../../src/index.js";

describe("RegisteredNodeCreateTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);
    const ADMIN_KEY = PrivateKey.fromStringED25519(
        "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
    ).publicKey;

    /**
     * @returns {RegisteredNodeCreateTransaction}
     */
    function makeTransaction() {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];

        return new RegisteredNodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setAdminKey(ADMIN_KEY)
            .setDescription("My Block Node")
            .addServiceEndpoint(
                new BlockNodeServiceEndpoint()
                    .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                    .setPort(443)
                    .setRequiresTls(true)
                    .setEndpointApi(BlockNodeApi.SubscribeStream),
            )
            .setMaxTransactionFee(new Hbar(1));
    }

    it("should convert from and to bytes", function () {
        const tx = makeTransaction();
        const tx2 = RegisteredNodeCreateTransaction.fromBytes(tx.toBytes());

        expect(tx.transactionId.toString()).to.equal(
            tx2.transactionId.toString(),
        );
        expect(tx.adminKey.toString()).to.equal(tx2.adminKey.toString());
        expect(tx.description).to.equal(tx2.description);
        expect(tx2.serviceEndpoints.length).to.equal(1);
        expect(tx2.serviceEndpoints[0].type).to.equal("blockNode");
        expect(tx2.serviceEndpoints[0].endpointApi).to.equal(
            BlockNodeApi.SubscribeStream,
        );
    });

    it("should require adminKey before freeze", function () {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];
        const tx = new RegisteredNodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .addServiceEndpoint(
                new BlockNodeServiceEndpoint()
                    .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                    .setPort(443)
                    .setEndpointApi(BlockNodeApi.Status),
            );

        expect(() => tx.freeze()).to.throw(
            "RegisteredNodeCreateTransaction: 'adminKey' must be set before calling freeze().",
        );
    });

    it("should require at least one service endpoint before freeze", function () {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];
        const tx = new RegisteredNodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setAdminKey(ADMIN_KEY);

        expect(() => tx.freeze()).to.throw(
            "RegisteredNodeCreateTransaction: 'serviceEndpoints' must not be empty before calling freeze().",
        );
    });
});
