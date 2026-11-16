import { vi } from "vitest";
import Client from "../../src/client/Client.js";
import AccountId from "../../src/account/AccountId.js";
import PrivateKey from "../../src/PrivateKey.js";
import AddressBookQuery from "../../src/network/AddressBookQuery.js";
import {
    DEFAULT_GRPC_DEADLINE,
    DEFAULT_LOCAL_MAX_ATTEMPTS,
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_REQUEST_TIMEOUT,
} from "../../src/constants/ClientConstants.js";

describe("Client deadline configuration", function () {
    it("uses DEFAULT_GRPC_DEADLINE and DEFAULT_REQUEST_TIMEOUT by default", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        expect(client.grpcDeadline).to.equal(DEFAULT_GRPC_DEADLINE);
        expect(client.requestTimeout).to.equal(DEFAULT_REQUEST_TIMEOUT);
    });

    it("uses local max attempts for a local-node network name", function () {
        const client = new Client({
            network: "local-node",
            scheduleNetworkUpdate: false,
        });

        expect(client.maxAttempts).to.equal(DEFAULT_LOCAL_MAX_ATTEMPTS);
    });

    it("uses local max attempts for an object network with local addresses", function () {
        const client = new Client({
            network: {
                "localhost:50211": "0.0.3",
                "127.0.0.1:50212": "0.0.4",
            },
            scheduleNetworkUpdate: false,
        });

        expect(client.maxAttempts).to.equal(DEFAULT_LOCAL_MAX_ATTEMPTS);
    });

    it("uses default max attempts for non-local networks", function () {
        const namedClient = new Client({
            network: "testnet",
            scheduleNetworkUpdate: false,
        });
        const objectClient = new Client({
            network: {
                "testnet-node00-00-grpc.hedera.com:443": "0.0.3",
            },
            scheduleNetworkUpdate: false,
        });

        expect(namedClient.maxAttempts).to.equal(DEFAULT_MAX_ATTEMPTS);
        expect(objectClient.maxAttempts).to.equal(DEFAULT_MAX_ATTEMPTS);
    });

    it("allows setting grpcDeadline via setter to a positive value", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        client.setGrpcDeadline(12345);
        expect(client.grpcDeadline).to.equal(12345);
    });

    it("throws when setting grpcDeadline via setter to zero or negative", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        expect(() => client.setGrpcDeadline(0)).to.throw(
            "grpcDeadline must be a positive number",
        );
        expect(() => client.setGrpcDeadline(-1)).to.throw(
            "grpcDeadline must be a positive number",
        );
    });

    it("allows setting requestTimeout via setter to a positive value", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        client.setRequestTimeout(60000);
        expect(client.requestTimeout).to.equal(60000);
    });

    it("throws when setting requestTimeout via setter to zero or negative", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        expect(() => client.setRequestTimeout(0)).to.throw(
            "requestTimeout must be a positive number",
        );
        expect(() => client.setRequestTimeout(-1)).to.throw(
            "requestTimeout must be a positive number",
        );
    });

    it("supports initializing values via constructor (positive)", function () {
        const client = new Client({
            scheduleNetworkUpdate: false,
            grpcDeadline: 2500,
            requestTimeout: 120000,
        });
        expect(client.grpcDeadline).to.equal(2500);
        expect(client.requestTimeout).to.equal(120000);
    });

    it("throws when initializing grpcDeadline via constructor with zero or negative", function () {
        expect(
            () => new Client({ scheduleNetworkUpdate: false, grpcDeadline: 0 }),
        ).to.throw("grpcDeadline must be a positive number");
        expect(
            () =>
                new Client({ scheduleNetworkUpdate: false, grpcDeadline: -1 }),
        ).to.throw("grpcDeadline must be a positive number");
    });

    it("throws when initializing requestTimeout via constructor with zero or negative", function () {
        expect(
            () =>
                new Client({ scheduleNetworkUpdate: false, requestTimeout: 0 }),
        ).to.throw("requestTimeout must be a positive number");
        expect(
            () =>
                new Client({
                    scheduleNetworkUpdate: false,
                    requestTimeout: -1,
                }),
        ).to.throw("requestTimeout must be a positive number");
    });

    it("warns when grpcDeadline is set to be larger than or equal to requestTimeout", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        client.setRequestTimeout(12000); // Set requestTimeout to 12 seconds

        // Capture console.warn calls
        const originalWarn = console.warn;
        const warnings = [];
        console.warn = (...args) => warnings.push(args.join(" "));

        try {
            // These should warn but not throw
            client.setGrpcDeadline(13000);
            client.setGrpcDeadline(12000);

            // Verify warnings were issued
            expect(warnings).to.have.length(2);
            expect(warnings[0]).to.include("DEPRECATION WARNING");
            expect(warnings[0]).to.include(
                "grpcDeadline (13000ms) should be smaller than requestTimeout (12000ms)",
            );
            expect(warnings[1]).to.include("DEPRECATION WARNING");
            expect(warnings[1]).to.include(
                "grpcDeadline (12000ms) should be smaller than requestTimeout (12000ms)",
            );
        } finally {
            console.warn = originalWarn;
        }
    });

    it("warns when requestTimeout is set to be smaller than or equal to grpcDeadline", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        client.setGrpcDeadline(5000); // Set grpcDeadline to 5 seconds

        // Capture console.warn calls
        const originalWarn = console.warn;
        const warnings = [];
        console.warn = (...args) => warnings.push(args.join(" "));

        try {
            // These should warn but not throw
            client.setRequestTimeout(5000);
            client.setRequestTimeout(3000);

            // Verify warnings were issued
            expect(warnings).to.have.length(2);
            expect(warnings[0]).to.include("DEPRECATION WARNING");
            expect(warnings[0]).to.include(
                "requestTimeout (5000ms) should be larger than grpcDeadline (5000ms)",
            );
            expect(warnings[1]).to.include("DEPRECATION WARNING");
            expect(warnings[1]).to.include(
                "requestTimeout (3000ms) should be larger than grpcDeadline (5000ms)",
            );
        } finally {
            console.warn = originalWarn;
        }
    });

    it("warns when initializing via constructor with grpcDeadline larger than or equal to requestTimeout", function () {
        // Capture console.warn calls
        const originalWarn = console.warn;
        const warnings = [];
        console.warn = (...args) => warnings.push(args.join(" "));

        try {
            // These should warn but not throw
            new Client({
                scheduleNetworkUpdate: false,
                grpcDeadline: 10000,
                requestTimeout: 10000,
            });

            new Client({
                scheduleNetworkUpdate: false,
                grpcDeadline: 15000,
                requestTimeout: 10000,
            });

            // Verify warnings were issued
            expect(warnings).to.have.length(4);
            expect(warnings[0]).to.include("DEPRECATION WARNING");
            expect(warnings[1]).to.include(
                "requestTimeout (10000ms) should be larger than grpcDeadline (10000ms)",
            );
            expect(warnings[2]).to.include("DEPRECATION WARNING");
            expect(warnings[3]).to.include(
                "requestTimeout (10000ms) should be larger than grpcDeadline (15000ms)",
            );
        } finally {
            console.warn = originalWarn;
        }
    });

    it("allows valid combinations where requestTimeout is larger than grpcDeadline", function () {
        const client = new Client({ scheduleNetworkUpdate: false });

        // Test setter methods
        client.setGrpcDeadline(5000);
        client.setRequestTimeout(10000);
        expect(client.grpcDeadline).to.equal(5000);
        expect(client.requestTimeout).to.equal(10000);

        // Test constructor
        const client2 = new Client({
            scheduleNetworkUpdate: false,
            grpcDeadline: 2000,
            requestTimeout: 8000,
        });
        expect(client2.grpcDeadline).to.equal(2000);
        expect(client2.requestTimeout).to.equal(8000);
    });

    it("allows setting grpcDeadline and requestTimeout in any order when both are valid", function () {
        const client1 = new Client({ scheduleNetworkUpdate: false });
        client1.setRequestTimeout(15000);
        client1.setGrpcDeadline(5000);
        expect(client1.grpcDeadline).to.equal(5000);
        expect(client1.requestTimeout).to.equal(15000);

        const client2 = new Client({ scheduleNetworkUpdate: false });
        client2.setGrpcDeadline(3000);
        client2.setRequestTimeout(12000);
        expect(client2.grpcDeadline).to.equal(3000);
        expect(client2.requestTimeout).to.equal(12000);
    });
});

describe("Client configuration", function () {
    let client;

    beforeEach(function () {
        client = new Client({ scheduleNetworkUpdate: false });
    });

    afterEach(function () {
        client.close();
        vi.restoreAllMocks();
    });

    describe("operator", function () {
        it("getOperator() returns null when no operator is set", function () {
            expect(client.getOperator()).to.be.null;
        });

        it("sets the operator from the operator prop with a DER private key string", function () {
            const privateKey = PrivateKey.generateED25519();

            const operatorClient = new Client({
                operator: {
                    accountId: "0.0.1001",
                    privateKey: privateKey.toStringDer(),
                },
                scheduleNetworkUpdate: false,
            });

            const operator = operatorClient.getOperator();
            expect(operator.accountId.toString()).to.equal("0.0.1001");
            expect(operator.publicKey.toStringDer()).to.equal(
                privateKey.publicKey.toStringDer(),
            );
            operatorClient.close();
        });

        it("sets the operator from the operator prop with a PrivateKey", function () {
            const privateKey = PrivateKey.generateECDSA();

            const operatorClient = new Client({
                operator: {
                    accountId: new AccountId(1002),
                    privateKey,
                },
                scheduleNetworkUpdate: false,
            });

            expect(operatorClient.operatorAccountId.toString()).to.equal(
                "0.0.1002",
            );
            expect(operatorClient.operatorPublicKey.toStringDer()).to.equal(
                privateKey.publicKey.toStringDer(),
            );
            operatorClient.close();
        });

        it("getOperator() returns the operator set with setOperator()", async function () {
            const privateKey = PrivateKey.generateED25519();
            const message = new Uint8Array([1, 2, 3]);

            client.setOperator("0.0.1003", privateKey);

            const operator = client.getOperator();
            expect(operator.accountId.toString()).to.equal("0.0.1003");
            expect(operator.publicKey.toStringDer()).to.equal(
                privateKey.publicKey.toStringDer(),
            );
            expect(await operator.transactionSigner(message)).to.deep.equal(
                privateKey.sign(message),
            );
        });
    });

    describe("transport security", function () {
        it("is off by default", function () {
            expect(client.isTransportSecurity()).to.be.false;
        });

        it("isTransportSecurity() returns the value set with setTransportSecurity()", function () {
            expect(client.setTransportSecurity(true)).to.equal(client);
            expect(client.isTransportSecurity()).to.be.true;

            client.setTransportSecurity(false);
            expect(client.isTransportSecurity()).to.be.false;
        });
    });

    describe("checksum validation", function () {
        it("is off by default", function () {
            expect(client.isAutoValidateChecksumsEnabled()).to.be.false;
        });

        it("setAutoValidateChecksums() changes the value and returns the client", function () {
            expect(client.setAutoValidateChecksums(true)).to.equal(client);
            expect(client.isAutoValidateChecksumsEnabled()).to.be.true;

            client.setAutoValidateChecksums(false);
            expect(client.isAutoValidateChecksumsEnabled()).to.be.false;
        });
    });

    describe("isClientShutDown", function () {
        it("is false until close() is called", function () {
            expect(client.isClientShutDown).to.be.false;

            client.close();

            expect(client.isClientShutDown).to.be.true;
        });
    });

    describe("node backoff and readmit periods", function () {
        it("have the network defaults", function () {
            expect(client.nodeMinBackoff).to.equal(8000);
            expect(client.nodeMaxBackoff).to.equal(60 * 60 * 1000);
            expect(client.nodeMinReadmitPeriod).to.equal(8000);
            expect(client.nodeMaxReadmitPeriod).to.equal(60 * 60 * 1000);
        });

        it("nodeMinBackoff returns the value set with setNodeMinBackoff()", function () {
            expect(client.setNodeMinBackoff(100)).to.equal(client);
            expect(client.nodeMinBackoff).to.equal(100);
        });

        it("nodeMaxBackoff returns the value set with setNodeMaxBackoff()", function () {
            expect(client.setNodeMaxBackoff(5000)).to.equal(client);
            expect(client.nodeMaxBackoff).to.equal(5000);
        });

        it("nodeMinReadmitPeriod returns the value set with setNodeMinReadmitPeriod()", function () {
            expect(client.setNodeMinReadmitPeriod(200)).to.equal(client);
            expect(client.nodeMinReadmitPeriod).to.equal(200);
        });

        it("nodeMaxReadmitPeriod returns the value set with setNodeMaxReadmitPeriod()", function () {
            expect(client.setNodeMaxReadmitPeriod(6000)).to.equal(client);
            expect(client.nodeMaxReadmitPeriod).to.equal(6000);
        });
    });

    describe("maxNodeAttempts", function () {
        it("is -1 by default, so nodes are never removed", function () {
            expect(client.maxNodeAttempts).to.equal(-1);
        });

        it("returns the value set with setMaxNodeAttempts()", function () {
            expect(client.setMaxNodeAttempts(3)).to.equal(client);
            expect(client.maxNodeAttempts).to.equal(3);
        });
    });

    describe("request backoff", function () {
        it("setMinBackoff() throws for null", function () {
            expect(() => client.setMinBackoff(null)).to.throw(
                "minBackoff cannot be null.",
            );
        });

        it("setMinBackoff() throws for a value larger than maxBackoff", function () {
            expect(() => client.setMinBackoff(8001)).to.throw(
                "minBackoff cannot be larger than maxBackoff.",
            );
            expect(client.minBackoff).to.equal(250);
        });

        it("setMaxBackoff() throws for null", function () {
            expect(() => client.setMaxBackoff(null)).to.throw(
                "maxBackoff cannot be null.",
            );
        });

        it("setMaxBackoff() throws for a value smaller than minBackoff", function () {
            expect(() => client.setMaxBackoff(249)).to.throw(
                "maxBackoff cannot be smaller than minBackoff.",
            );
            expect(client.maxBackoff).to.equal(8000);
        });
    });

    describe("updateNetwork()", function () {
        it("returns the client without querying while an update is running", async function () {
            let rejectQuery;
            const execute = vi
                .spyOn(AddressBookQuery.prototype, "execute")
                .mockImplementation(
                    () =>
                        new Promise((resolve, reject) => {
                            rejectQuery = reject;
                        }),
                );

            const running = client.updateNetwork();

            expect(await client.updateNetwork()).to.equal(client);
            expect(execute).toHaveBeenCalledTimes(1);

            rejectQuery(new Error("mirror node unavailable"));
            expect(await running).to.equal(client);
            expect(client._isUpdatingNetwork).to.be.false;
        });

        it("logs the error and keeps the network when the update fails", async function () {
            vi.spyOn(AddressBookQuery.prototype, "execute").mockRejectedValue(
                new Error("mirror node unavailable"),
            );
            const logger = { trace: vi.fn() };
            client.setLogger(logger);
            client._network.setNetwork({ "127.0.0.1:50211": "0.0.3" });

            expect(await client.updateNetwork()).to.equal(client);

            expect(logger.trace).toHaveBeenCalledWith(
                "failed to update client address book: Error: mirror node unavailable",
            );
            expect(Object.keys(client.network)).to.deep.equal([
                "127.0.0.1:50211",
            ]);
            expect(client._isUpdatingNetwork).to.be.false;
        });

        it("does not throw when the update fails without a logger", async function () {
            vi.spyOn(AddressBookQuery.prototype, "execute").mockRejectedValue(
                new Error("mirror node unavailable"),
            );

            expect(await client.updateNetwork()).to.equal(client);
            expect(client._isUpdatingNetwork).to.be.false;
        });
    });

    describe("scheduled network update", function () {
        beforeEach(function () {
            vi.useFakeTimers();
        });

        afterEach(function () {
            vi.useRealTimers();
        });

        it("networkUpdatePeriod is 24 hours by default", function () {
            expect(client.networkUpdatePeriod).to.equal(24 * 60 * 60 * 1000);
        });

        it("runs updateNetwork() after networkUpdatePeriod and again after each period", async function () {
            const scheduledClient = new Client({});
            const updateNetwork = vi
                .spyOn(scheduledClient, "updateNetwork")
                .mockResolvedValue(scheduledClient);

            await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 - 1);
            expect(updateNetwork).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(1);
            expect(updateNetwork).toHaveBeenCalledTimes(1);

            await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
            expect(updateNetwork).toHaveBeenCalledTimes(2);

            scheduledClient.close();
        });

        it("setNetworkUpdatePeriod() restarts the timer with the new period", async function () {
            const scheduledClient = new Client({});
            const updateNetwork = vi
                .spyOn(scheduledClient, "updateNetwork")
                .mockResolvedValue(scheduledClient);

            await vi.advanceTimersByTimeAsync(1000);

            expect(scheduledClient.setNetworkUpdatePeriod(5000)).to.equal(
                scheduledClient,
            );
            expect(scheduledClient.networkUpdatePeriod).to.equal(5000);

            await vi.advanceTimersByTimeAsync(4999);
            expect(updateNetwork).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(1);
            expect(updateNetwork).toHaveBeenCalledTimes(1);

            await vi.advanceTimersByTimeAsync(5000);
            expect(updateNetwork).toHaveBeenCalledTimes(2);

            scheduledClient.close();
        });

        it("stops after close()", async function () {
            const scheduledClient = new Client({});
            const updateNetwork = vi
                .spyOn(scheduledClient, "updateNetwork")
                .mockResolvedValue(scheduledClient);
            scheduledClient.setNetworkUpdatePeriod(5000);

            await vi.advanceTimersByTimeAsync(5000);
            expect(updateNetwork).toHaveBeenCalledTimes(1);

            scheduledClient.close();

            await vi.advanceTimersByTimeAsync(10000);
            expect(updateNetwork).toHaveBeenCalledTimes(1);
        });

        it("does not schedule an update with scheduleNetworkUpdate: false", async function () {
            const updateNetwork = vi
                .spyOn(client, "updateNetwork")
                .mockResolvedValue(client);

            await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);

            expect(updateNetwork).not.toHaveBeenCalled();
        });
    });

    describe("network helpers", function () {
        it("_isLocalNetwork(null) returns false", function () {
            expect(client._isLocalNetwork(null)).to.be.false;
        });

        it("_validateNetworkConsistency() accepts an empty network", function () {
            expect(() => Client._validateNetworkConsistency({})).to.not.throw();
        });

        it("_extractShardRealm() returns shard 0, realm 0 for an empty network", function () {
            expect(Client._extractShardRealm({})).to.deep.equal({
                shard: 0,
                realm: 0,
            });
        });
    });
});
