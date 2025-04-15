import {
    AccountId,
    Hbar,
    NodeUpdateTransaction,
    PrivateKey,
    ServiceEndpoint,
    Timestamp,
    TransactionId,
} from "../../../src/index.js";

describe("NodeUpdateTransaction", function () {
    const IMMUTABLE_ERROR = "transaction is immutable";

    it("should convert from and to bytes", function () {
        const NODE_ACCOUNT_IDS = [
            AccountId.fromString("0.0.5005"),
            AccountId.fromString("0.0.5006"),
        ];

        const IP_AddressV4 = Uint8Array.of(127, 0, 0, 1);
        const VALID_START = new Timestamp(1596210382, 0);
        const NODE_ID = 420;
        const DESCRIPTION = "Test Description";
        const ACCOUNT_ID = AccountId.fromString("0.6.9");
        const ADMIN_KEY = PrivateKey.fromStringED25519(
            "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
        ).publicKey;

        const GOSSIP_CA_CERTIFICATE = Buffer.from("gossipCaCertificate");
        const GRPC_CERTIFICATE_HASH = Buffer.from("grpcCertificateHash");
        const GOSSIP_ENDPOINTS = [
            new ServiceEndpoint().setIpAddressV4(IP_AddressV4),
        ];
        const SERVICE_ENDPOINTS = [
            new ServiceEndpoint().setIpAddressV4(IP_AddressV4),
        ];

        const tx = new NodeUpdateTransaction()
            .setNodeAccountIds(NODE_ACCOUNT_IDS)
            .setTransactionId(
                TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
            )
            .setNodeId(NODE_ID)
            .setAccountId(ACCOUNT_ID)
            .setDescription(DESCRIPTION)
            .setGossipEndpoints(GOSSIP_ENDPOINTS)
            .setGossipCaCertificate(GOSSIP_CA_CERTIFICATE)
            .setServiceEndpoints(SERVICE_ENDPOINTS)
            .setCertificateHash(GRPC_CERTIFICATE_HASH)
            .setAdminKey(ADMIN_KEY)
            .setMaxTransactionFee(new Hbar(1));

        const tx2 = NodeUpdateTransaction.fromBytes(tx.toBytes());

        tx.nodeAccountIds.forEach((_, index) => {
            expect(tx.nodeAccountIds[index].toString()).to.equal(
                tx2.nodeAccountIds[index].toString(),
            );
        });

        expect(tx.transactionId.toString()).to.equal(
            tx2.transactionId.toString(),
        );
        expect(tx.nodeId).to.equal(tx2.nodeId.toInt());
        expect(tx.accountId.toString()).to.equal(tx2.accountId.toString());
        expect(tx.description).to.equal(tx2.description);
        expect(tx.maxTransactionFee.toTinybars().toInt()).to.equal(
            tx2.maxTransactionFee.toTinybars().toInt(),
        );

        expect(tx.gossipEndpoints[0].toString()).to.equal(
            tx2.gossipEndpoints[0].toString(),
        );
        expect(tx.gossipCaCertificate.toString()).to.equal(
            tx2.gossipCaCertificate.toString(),
        );
        expect(tx.serviceEndpoints[0].toString()).to.equal(
            tx2.serviceEndpoints[0].toString(),
        );
        expect(tx.certificateHash.toString()).to.equal(
            tx2.certificateHash.toString(),
        );
        expect(tx.adminKey.toString()).to.equal(tx2.adminKey.toString());
    });

    it("should change account id", function () {
        const newAccountId = AccountId.fromString("0.4.20");
        const tx = new NodeUpdateTransaction().setAccountId(newAccountId);
        expect(tx.accountId.toString()).to.equal(newAccountId.toString());
    });

    it("should change node id", function () {
        const newNodeId = 421;
        const tx = new NodeUpdateTransaction().setNodeId(newNodeId);
        expect(tx.nodeId).to.equal(newNodeId);
    });

    it("should change description", function () {
        const newDescription = "New Description";
        const tx = new NodeUpdateTransaction().setDescription(newDescription);
        expect(tx.description).to.equal(newDescription);
    });

    it("should change gossip endpoints", function () {
        const NEW_IP_AddressV4 = Uint8Array.of(127, 0, 0, 2);
        const newGossipEndpoints = [
            new ServiceEndpoint().setIpAddressV4(NEW_IP_AddressV4),
        ];
        const tx = new NodeUpdateTransaction().setGossipEndpoints(
            newGossipEndpoints,
        );
        expect(tx.gossipEndpoints[0].toString()).to.equal(
            newGossipEndpoints[0].toString(),
        );
    });

    it("should change service endpoints", function () {
        const NEW_IP_AddressV4 = Uint8Array.of(127, 0, 0, 2);
        const newServiceEndpoints = [
            new ServiceEndpoint().setIpAddressV4(NEW_IP_AddressV4),
        ];
        const tx = new NodeUpdateTransaction().setServiceEndpoints(
            newServiceEndpoints,
        );
        expect(tx.serviceEndpoints[0].toString()).to.equal(
            newServiceEndpoints[0].toString(),
        );
    });

    it("should change gossip ca certificate", function () {
        const newGossipCaCertificate = Buffer.from("newGossipCaCertificate");
        const tx = new NodeUpdateTransaction().setGossipCaCertificate(
            newGossipCaCertificate,
        );
        expect(tx.gossipCaCertificate.toString()).to.equal(
            newGossipCaCertificate.toString(),
        );
    });

    it("should change certificate hash", function () {
        const newCertificateHash = Buffer.from("newCertificateHash");
        const tx = new NodeUpdateTransaction().setCertificateHash(
            newCertificateHash,
        );
        expect(tx.certificateHash.toString()).to.equal(
            newCertificateHash.toString(),
        );
    });

    it("should change admin key", function () {
        const newAdminKey = PrivateKey.fromStringED25519(
            "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
        ).publicKey;
        const tx = new NodeUpdateTransaction().setAdminKey(newAdminKey);
        expect(tx.adminKey.toString()).to.equal(newAdminKey.toString());
    });

    it("should change max transaction fee", function () {
        const newMaxTransactionFee = new Hbar(1);
        const tx = new NodeUpdateTransaction().setMaxTransactionFee(
            newMaxTransactionFee,
        );
        expect(tx.maxTransactionFee.toTinybars().toInt()).to.equal(
            newMaxTransactionFee.toTinybars().toInt(),
        );
    });

    describe("frozen transaction", function () {
        let tx;

        beforeAll(function () {
            const ACCOUNT_ID = AccountId.fromString("0.4.20");
            const VALID_START = new Timestamp(1596210382, 0);

            tx = new NodeUpdateTransaction()
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setTransactionId(
                    TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
                )
                .freeze();
        });

        it("should not change node account id", function () {
            const NODE_ACCOUNT_IDS = [
                AccountId.fromString("0.0.5007"),
                AccountId.fromString("0.0.5008"),
            ];
            let err = false;
            try {
                tx.setNodeAccountIds(NODE_ACCOUNT_IDS);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }

            expect(err).to.be.true;
        });

        it("should not change node id", function () {
            let err = false;
            try {
                tx.setNodeId(421);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });

        it("should not change account id", function () {
            let err = false;
            const ACCOUNT_ID = AccountId.fromString("0.4.20");
            try {
                tx.setAccountId(ACCOUNT_ID);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });

        it("should not change description", function () {
            let err = false;
            const DESCRIPTION = "New Description";
            try {
                tx.setDescription(DESCRIPTION);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });

        it("should not change gossip endpoints", function () {
            let err = false;
            const NEW_IP_AddressV4 = Uint8Array.of(127, 0, 0, 2);
            const newGossipEndpoints = [
                new ServiceEndpoint().setIpAddressV4(NEW_IP_AddressV4),
            ];
            try {
                tx.setGossipEndpoints(newGossipEndpoints);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });

        it("should not change service endpoints", function () {
            let err = false;
            const NEW_IP_AddressV4 = Uint8Array.of(127, 0, 0, 2);
            const newServiceEndpoints = [
                new ServiceEndpoint().setIpAddressV4(NEW_IP_AddressV4),
            ];
            try {
                tx.setServiceEndpoints(newServiceEndpoints);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });

        it("should not change gossip ca certificate", function () {
            let err = false;
            const newGossipCaCertificate = Buffer.from(
                "newGossipCaCertificate",
            );
            try {
                tx.setGossipCaCertificate(newGossipCaCertificate);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });

        it("should not change certificate hash", function () {
            let err = false;
            const newCertificateHash = Buffer.from("newCertificateHash");
            try {
                tx.setCertificateHash(newCertificateHash);
            } catch (error) {
                err = error.toString().includes(IMMUTABLE_ERROR);
            }
            expect(err).to.be.true;
        });
    });

    describe("deserialization of optional parameters", function () {
        it("should deserialize with gossipCaCertificate, grpcCertificateHash being null", function () {
            const tx = new NodeUpdateTransaction();
            const tx2 = NodeUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.gossipCaCertificate).to.be.null;
            expect(tx.certificateHash).to.be.null;
            expect(tx2.gossipCaCertificate).to.be.null;
            expect(tx2.certificateHash).to.be.null;
        });

        it("should deserialize with description being null", function () {
            const tx = new NodeUpdateTransaction();
            const tx2 = NodeUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.description).to.be.null;
            expect(tx2.description).to.be.null;
        });
    });
});
