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
                    .setEndpointApis([
                        BlockNodeApi.SubscribeStream,
                        BlockNodeApi.Status,
                    ]),
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
        expect(tx2.serviceEndpoints[0].endpointApis).to.deep.equal([
            BlockNodeApi.SubscribeStream,
            BlockNodeApi.Status,
        ]);
    });

    // Note: missing adminKey (KEY_REQUIRED precheck) and empty/oversized
    // serviceEndpoints lists (INVALID_REGISTERED_ENDPOINT,
    // REGISTERED_ENDPOINTS_EXCEEDED_LIMIT) are rejected by the consensus
    // node — see integration tests.

    describe("null arguments", function () {
        it("setAdminKey() throws a TypeError for null", function () {
            expect(() =>
                new RegisteredNodeCreateTransaction().setAdminKey(null),
            ).to.throw(TypeError, "adminKey must not be null or undefined.");
        });

        it("setDescription() throws a TypeError for null", function () {
            expect(() =>
                new RegisteredNodeCreateTransaction().setDescription(null),
            ).to.throw(TypeError, "description must not be null or undefined.");
        });

        it("setServiceEndpoints() throws a TypeError for null", function () {
            expect(() =>
                new RegisteredNodeCreateTransaction().setServiceEndpoints(null),
            ).to.throw(
                TypeError,
                "serviceEndpoints must not be null or undefined.",
            );
        });

        it("addServiceEndpoint() throws a TypeError for null", function () {
            expect(() =>
                new RegisteredNodeCreateTransaction().addServiceEndpoint(null),
            ).to.throw(
                TypeError,
                "serviceEndpoint must not be null or undefined.",
            );
        });
    });

    describe("_execute", function () {
        it("should call addressBook.createRegisteredNode() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                addressBook: {
                    createRegisteredNode: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new RegisteredNodeCreateTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return registeredNodeCreate", function () {
            expect(
                new RegisteredNodeCreateTransaction()._getTransactionDataCase(),
            ).to.equal("registeredNodeCreate");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new RegisteredNodeCreateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `RegisteredNodeCreateTransaction:${validStart.toString()}`,
            );
        });
    });
});
