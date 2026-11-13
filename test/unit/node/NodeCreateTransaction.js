import {
    AccountId,
    Hbar,
    NodeCreateTransaction,
    PrivateKey,
    ServiceEndpoint,
    Timestamp,
    TransactionId,
} from "../../../src/index.js";

describe("NodeCreateTransaction", function () {
    // setting these variables outside of the beforeEach function to avoid
    // as there is a lint setting that doesn't allow function calls
    // in the describe block
    let tx,
        accountId,
        nodeAccountIds,
        gossipCaCertificate,
        gossipEndpoints,
        serviceEndpoints;

    const VALID_START = new Timestamp(1596210382, 0);
    const DESCRIPTION = "Test Description";
    const IMMUTABLE_ERROR = "transaction is immutable";

    beforeEach(function () {
        const IP_AddressV4 = Uint8Array.of(127, 0, 0, 1);
        accountId = AccountId.fromString("0.6.9");
        nodeAccountIds = [
            AccountId.fromString("0.0.5005"),
            AccountId.fromString("0.0.5006"),
        ];
        gossipCaCertificate = Buffer.from("gossipCaCertificate");
        gossipEndpoints = [new ServiceEndpoint().setIpAddressV4(IP_AddressV4)];
        serviceEndpoints = [new ServiceEndpoint().setIpAddressV4(IP_AddressV4)];
        const grpcProxyEndpoint = new ServiceEndpoint().setIpAddressV4(
            IP_AddressV4,
        );

        const TEST_ADMIN_KEY = PrivateKey.fromStringED25519(
            "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
        ).publicKey;
        const associatedRegisteredNodes = [101, 202];

        tx = new NodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setAccountId(accountId)
            .setDescription(DESCRIPTION)
            .setGossipCaCertificate(gossipCaCertificate)
            .setCertificateHash(gossipCaCertificate) // TODO: change this value to a proper one
            .setAdminKey(TEST_ADMIN_KEY)
            .setServiceEndpoints(serviceEndpoints)
            .setGossipEndpoints(gossipEndpoints)
            .setAssociatedRegisteredNodes(associatedRegisteredNodes)
            .setMaxTransactionFee(new Hbar(1))
            .setDeclineReward(false)
            .setGrpcWebProxyEndpoint(grpcProxyEndpoint);
    });

    it("should set decline reward", function () {
        expect(tx.declineReward).to.equal(false);
        tx.setDeclineReward(true);
        expect(tx.declineReward).to.equal(true);
    });

    it("should not set decline reward if not set explicitly", function () {
        const tx = new NodeCreateTransaction();
        expect(tx.declineReward).to.equal(null);
    });

    it("should convert from and to bytes", function () {
        const tx2 = NodeCreateTransaction.fromBytes(tx.toBytes());

        tx.nodeAccountIds.forEach((_, index) => {
            expect(tx.nodeAccountIds[index].toString()).to.equal(
                tx2.nodeAccountIds[index].toString(),
            );
        });
        expect(tx.transactionId.toString()).to.equal(
            tx2.transactionId.toString(),
        );
        expect(tx.accountId.toString()).to.equal(tx2.accountId.toString());
        expect(tx.description).to.equal(tx2.description);
        expect(tx.gossipCaCertificate.equals(tx2.gossipCaCertificate)).to.be
            .true;
        expect(tx.certificateHash.equals(tx2.certificateHash)).to.be.true;
        expect(tx.adminKey.toString()).to.equal(tx2.adminKey.toString());
        expect(tx.maxTransactionFee.toTinybars().toInt()).to.equal(
            tx2.maxTransactionFee.toTinybars().toInt(),
        );
        expect(tx.declineReward).to.equal(tx2.declineReward);
        expect(
            tx.associatedRegisteredNodes.map((id) => id.toString()),
        ).to.deep.equal(
            tx2.associatedRegisteredNodes.map((id) => id.toString()),
        );
        tx.serviceEndpoints.forEach((_, index) => {
            const TX_IPV4_BUFFER = Buffer.from(
                tx.serviceEndpoints[index]._ipAddressV4,
            );
            const TX2_IPV4_BUFFER = tx2.serviceEndpoints[index]._ipAddressV4;
            expect(TX_IPV4_BUFFER).to.deep.equal(TX2_IPV4_BUFFER);
        });
        tx.gossipEndpoints.forEach((_, index) => {
            const TX_IPV4_BUFFER = Buffer.from(
                tx.gossipEndpoints[index]._ipAddressV4,
            );
            const TX2_IPV4_BUFFER = tx2.gossipEndpoints[index]._ipAddressV4;
            expect(TX_IPV4_BUFFER).to.deep.equal(TX2_IPV4_BUFFER);
        });

        const TX_PROXY_IPV4_BUFFER = Buffer.from(
            tx.grpcWebProxyEndpoint._ipAddressV4,
        );
        const TX2_PROXY_IPV4_BUFFER = tx2.grpcWebProxyEndpoint._ipAddressV4;
        expect(TX_PROXY_IPV4_BUFFER).to.deep.equal(TX2_PROXY_IPV4_BUFFER);
    });

    it("should add associated registered node", function () {
        const tx = new NodeCreateTransaction().addAssociatedRegisteredNode(303);
        expect(tx.associatedRegisteredNodes.map((id) => id.toString())).to.deep
            .equal(["303"]);
    });

    it("should change account id", function () {
        const newAccountId = AccountId.fromString("0.4.20");
        tx.setAccountId(newAccountId);
        expect(tx.accountId.toString()).to.equal(newAccountId.toString());
    });

    it("should not change account id if frozen", function () {
        const newAccountId = AccountId.fromString("0.4.20");
        tx.freeze();
        let err = false;
        try {
            tx.setAccountId(newAccountId);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change description", function () {
        const NEW_DESCRIPTION = "New Description";
        tx.setDescription(NEW_DESCRIPTION);
        expect(tx.description).to.equal(NEW_DESCRIPTION);
    });

    it("should not change description if frozen", function () {
        const NEW_DESCRIPTION = "New Description";
        tx.freeze();
        let err = false;
        try {
            tx.setDescription(NEW_DESCRIPTION);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change admin key", function () {
        const NEW_ADMIN_KEY = PrivateKey.fromStringED25519(
            "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
        ).publicKey;
        tx.setAdminKey(NEW_ADMIN_KEY);
        expect(tx.adminKey.toString()).to.equal(NEW_ADMIN_KEY.toString());
    });

    it("should not change admin key if frozen", function () {
        const NEW_ADMIN_KEY = PrivateKey.fromStringED25519(
            "302e020100300506032b65700422042062c4b69e9f45a554e5424fb5a6fe5e6ac1f19ead31dc7718c2d980fd1f998d4b",
        ).publicKey;
        tx.freeze();
        let err = false;
        try {
            tx.setAdminKey(NEW_ADMIN_KEY);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change certificate", function () {
        const NEW_CERTIFICATE = Buffer.from("newCertificate");
        tx.setGossipCaCertificate(NEW_CERTIFICATE);
        expect(tx.gossipCaCertificate.equals(NEW_CERTIFICATE)).to.be.true;
    });

    it("should not change certificate if frozen", function () {
        const NEW_CERTIFICATE = Buffer.from("newCertificate");
        tx.freeze();
        let err = false;
        try {
            tx.setGossipCaCertificate(NEW_CERTIFICATE);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change certificate hash", function () {
        const NEW_CERTIFICATE = Buffer.from("certificate_hash");
        tx.setCertificateHash(NEW_CERTIFICATE);
        expect(tx.certificateHash.equals(NEW_CERTIFICATE)).to.be.true;
    });

    it("should not change certificate hash if frozen", function () {
        const NEW_CERTIFICATE = Buffer.from("certificate_hash");
        tx.freeze();
        let err = false;
        try {
            tx.setCertificateHash(NEW_CERTIFICATE);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change gossip endpoints", function () {
        const NEW_GOSSIP_ENDPOINTS = [
            new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 2)),
        ];
        tx.setGossipEndpoints(NEW_GOSSIP_ENDPOINTS);
        expect(tx.gossipEndpoints).to.deep.equal(NEW_GOSSIP_ENDPOINTS);
    });

    it("should not change gossip endpoints if frozen", function () {
        const NEW_GOSSIP_ENDPOINTS = [
            new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 2)),
        ];
        tx.freeze();
        let err = false;
        try {
            tx.setGossipEndpoints(NEW_GOSSIP_ENDPOINTS);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change service endpoints", function () {
        const NEW_SERVICE_ENDPOINTS = [
            new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 2)),
        ];
        tx.setServiceEndpoints(NEW_SERVICE_ENDPOINTS);
        expect(tx.serviceEndpoints).to.deep.equal(NEW_SERVICE_ENDPOINTS);
    });

    it("should not change service endpoints if frozen", function () {
        const NEW_SERVICE_ENDPOINTS = [
            new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 2)),
        ];
        tx.freeze();
        let err = false;
        try {
            tx.setServiceEndpoints(NEW_SERVICE_ENDPOINTS);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should change grpc proxy endpoint", function () {
        const NEW_IP_AddressV4 = Uint8Array.of(127, 0, 0, 2);
        const newGrpcProxyEndpoint = new ServiceEndpoint().setIpAddressV4(
            NEW_IP_AddressV4,
        );
        tx.setGrpcWebProxyEndpoint(newGrpcProxyEndpoint);
        expect(tx.grpcWebProxyEndpoint.toString()).to.equal(
            newGrpcProxyEndpoint.toString(),
        );
    });

    it("should not change grpc proxy endpoint if frozen", function () {
        const NEW_IP_AddressV4 = Uint8Array.of(127, 0, 0, 2);
        const newGrpcWebProxyEndpoint = new ServiceEndpoint().setIpAddressV4(
            NEW_IP_AddressV4,
        );
        tx.freeze();
        let err = false;
        try {
            tx.setGrpcWebProxyEndpoint(newGrpcWebProxyEndpoint);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
    });

    it("should not set grpc proxy endpoint if not set explicitly", function () {
        const tx = new NodeCreateTransaction();
        expect(tx.grpcWebProxyEndpoint).to.equal(null);
    });

    it("should add a gossip endpoint to a new transaction", function () {
        const tx = new NodeCreateTransaction();
        const endpoint = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1));

        tx.addGossipEndpoint(endpoint);

        expect(tx.gossipEndpoints).to.deep.equal([endpoint]);
        expect(tx.serviceEndpoints).to.equal(null);
    });

    it("should add multiple gossip endpoints to a new transaction", function () {
        const tx = new NodeCreateTransaction();
        const endpoint1 = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1));
        const endpoint2 = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 2));

        tx.addGossipEndpoint(endpoint1).addGossipEndpoint(endpoint2);

        expect(tx.gossipEndpoints).to.deep.equal([endpoint1, endpoint2]);
    });

    it("should add a service endpoint to a new transaction", function () {
        const tx = new NodeCreateTransaction();
        const endpoint = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1));

        tx.addServiceEndpoint(endpoint);

        expect(tx.serviceEndpoints).to.deep.equal([endpoint]);
        expect(tx.gossipEndpoints).to.equal(null);
    });

    it("should add multiple service endpoints to a new transaction", function () {
        const tx = new NodeCreateTransaction();
        const endpoint1 = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1));
        const endpoint2 = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 2));

        tx.addServiceEndpoint(endpoint1).addServiceEndpoint(endpoint2);

        expect(tx.serviceEndpoints).to.deep.equal([endpoint1, endpoint2]);
    });

    it("should convert gossip endpoints from and to bytes when added", function () {
        const tx = new NodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setAccountId(accountId)
            .addGossipEndpoint(
                new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1)),
            );

        const tx2 = NodeCreateTransaction.fromBytes(tx.toBytes());

        expect(tx.gossipEndpoints[0].toString()).to.equal(
            tx2.gossipEndpoints[0].toString(),
        );
        expect(tx2.gossipEndpoints.length).to.equal(1);
        expect(tx2.serviceEndpoints).to.deep.equal([]);
    });

    it("should convert service endpoints from and to bytes when added", function () {
        const tx = new NodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setAccountId(accountId)
            .addServiceEndpoint(
                new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1)),
            );

        const tx2 = NodeCreateTransaction.fromBytes(tx.toBytes());

        expect(tx.serviceEndpoints[0].toString()).to.equal(
            tx2.serviceEndpoints[0].toString(),
        );
        expect(tx2.serviceEndpoints.length).to.equal(1);
        expect(tx2.gossipEndpoints).to.deep.equal([]);
    });

    it("should not change gossip endpoints if frozen", function () {
        const tx = new NodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(TransactionId.withValidStart(nodeAccountIds[0], VALID_START))
            .setAccountId(accountId);

        const endpoint = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1));

        tx.freeze();

        let err = false;
        try {
            tx.addGossipEndpoint(endpoint);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
        expect(tx.gossipEndpoints).to.equal(null);
    });

    it("should not change service endpoints if frozen", function () {
        const tx = new NodeCreateTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(TransactionId.withValidStart(nodeAccountIds[0], VALID_START))
            .setAccountId(accountId);

        const endpoint = new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1));

        tx.freeze();

        let err = false;
        try {
            tx.addServiceEndpoint(endpoint);
        } catch (error) {
            err = error.toString().includes(IMMUTABLE_ERROR);
        }

        expect(err).to.be.true;
        expect(tx.serviceEndpoints).to.equal(null);
    });

    it("should throw when adding more than 10 gossip endpoints", function () {
        const tx = new NodeCreateTransaction();

        for (let i = 0; i < 10; i++) {
            tx.addGossipEndpoint(new ServiceEndpoint().setIpAddressV4(Uint8Array.of(i, 0, 0, 1)));
        }

        expect(() => {
            tx.addGossipEndpoint(new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1)));
        }).to.throw("GossipEndpoints list must not contain more than 10 entries.");
    });

    it("should throw when adding more than 8 service endpoints", function () {
        const tx = new NodeCreateTransaction();

        for (let i = 0; i < 8; i++) {
            tx.addServiceEndpoint(new ServiceEndpoint().setIpAddressV4(Uint8Array.of(i, 0, 0, 1)));
        }

        expect(() => {
            tx.addServiceEndpoint(new ServiceEndpoint().setIpAddressV4(Uint8Array.of(127, 0, 0, 1)));
        }).to.throw("ServiceEndpoints list must not contain more than 8 entries.");
    });

    describe("_validateChecksums", function () {
        const TransactionType = NodeCreateTransaction;
        const field = "_accountId";

        it("passes the client to the ID validator", function () {
            const client = {};
            const clients = [];
            const transaction = new TransactionType();
            transaction[field] = {
                validateChecksum: (value) => clients.push(value),
            };

            transaction._validateChecksums(client);

            expect(clients).to.have.lengthOf(1);
            expect(clients[0]).to.equal(client);
        });

        it("skips an unset ID", function () {
            expect(() =>
                new TransactionType()._validateChecksums({}),
            ).to.not.throw();
        });
    });
});
