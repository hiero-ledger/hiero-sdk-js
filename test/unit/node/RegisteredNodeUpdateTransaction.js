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
            .addServiceEndpoint(
                new BlockNodeServiceEndpoint()
                    .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                    .setPort(443)
                    .setRequiresTls(true)
                    .setEndpointApis([BlockNodeApi.Status]),
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
        expect(tx2.serviceEndpoints).to.have.length(2);
        expect(tx2.serviceEndpoints[0].type).to.equal("blockNode");
        expect(tx2.serviceEndpoints[0].endpointApis).to.deep.equal([
            BlockNodeApi.Status,
        ]);
        expect(tx2.serviceEndpoints[1].type).to.equal("mirrorNode");
    });

    it("setDescription('') is the documented way to clear description on the network", function () {
        const tx = new RegisteredNodeUpdateTransaction().setDescription("");
        expect(tx.description).to.equal("");
    });

    // Note: missing/invalid registeredNodeId is rejected by the consensus
    // node with INVALID_REGISTERED_NODE_ID — see integration tests.

    it("should set registeredNodeId as a long", function () {
        const tx = new RegisteredNodeUpdateTransaction().setRegisteredNodeId(
            Long.fromNumber(456),
        );
        expect(tx.registeredNodeId.toString()).to.equal("456");
    });

    it("partial update without serviceEndpoints leaves the field unset", function () {
        const tx = new RegisteredNodeUpdateTransaction()
            .setRegisteredNodeId(1)
            .setDescription("only description");

        expect(tx.serviceEndpoints).to.equal(null);

        // Verify the wire body does not include a serviceEndpoint replacement.
        // eslint-disable-next-line no-underscore-dangle
        const data = tx._makeTransactionData();
        expect(data.serviceEndpoint).to.equal(null);
    });

    it("setServiceEndpoints with non-empty list emits a replacement on the wire", function () {
        const tx = new RegisteredNodeUpdateTransaction()
            .setRegisteredNodeId(1)
            .setServiceEndpoints([
                new MirrorNodeServiceEndpoint()
                    .setDomainName("mirror.example.com")
                    .setPort(5600),
            ]);

        // eslint-disable-next-line no-underscore-dangle
        const data = tx._makeTransactionData();
        expect(data.serviceEndpoint).to.have.length(1);
    });

    it("should reject null in setters", function () {
        const tx = new RegisteredNodeUpdateTransaction();
        expect(() => tx.setRegisteredNodeId(null)).to.throw(TypeError);
        expect(() => tx.setAdminKey(null)).to.throw(TypeError);
        expect(() => tx.setDescription(null)).to.throw(TypeError);
        expect(() => tx.setServiceEndpoints(null)).to.throw(TypeError);
        expect(() => tx.addServiceEndpoint(null)).to.throw(TypeError);
    });

    // Note: empty / oversized serviceEndpoints lists are rejected by the
    // consensus node with INVALID_REGISTERED_ENDPOINT and
    // REGISTERED_ENDPOINTS_EXCEEDED_LIMIT — see integration tests.
});
