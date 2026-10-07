// SPDX-License-Identifier: Apache-2.0

import FeeEstimateQuery from "../../src/query/FeeEstimateQuery.js";
import FeeEstimateMode from "../../src/query/enums/FeeEstimateMode.js";
import {
    TransferTransaction,
    AccountId,
    Hbar,
    Client,
    PrivateKey,
} from "../../src/index.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "./utils/FakeHttpTransport.js";

describe("FeeEstimateQuery", function () {
    let mockTransaction;

    beforeEach(function () {
        mockTransaction = new TransferTransaction()
            .addHbarTransfer(new AccountId(1001), new Hbar(-10))
            .addHbarTransfer(new AccountId(1002), new Hbar(10));
    });

    describe("constructor", function () {
        it("should create with INTRINSIC as default mode per HIP-1261", function () {
            const query = new FeeEstimateQuery();

            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(query.transaction).to.be.null;
            expect(query.getHighVolumeThrottle()).to.equal(0);
        });

        it("should create with mode prop", function () {
            const query = new FeeEstimateQuery({
                mode: FeeEstimateMode.STATE,
            });

            expect(query.mode).to.equal(FeeEstimateMode.STATE);
            expect(query.transaction).to.be.null;
        });

        it("should create with transaction prop", function () {
            const query = new FeeEstimateQuery({
                transaction: mockTransaction,
            });

            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(query.transaction).to.equal(mockTransaction);
        });

        it("should create with highVolumeThrottle prop", function () {
            const query = new FeeEstimateQuery({ highVolumeThrottle: 5000 });

            expect(query.getHighVolumeThrottle()).to.equal(5000);
        });
    });

    describe("setMode", function () {
        it("should set STATE mode", function () {
            const query = new FeeEstimateQuery();
            const result = query.setMode(FeeEstimateMode.STATE);

            expect(query.mode).to.equal(FeeEstimateMode.STATE);
            expect(result).to.equal(query);
        });

        it("should set INTRINSIC mode", function () {
            const query = new FeeEstimateQuery({
                mode: FeeEstimateMode.STATE,
            });
            const result = query.setMode(FeeEstimateMode.INTRINSIC);

            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(result).to.equal(query);
        });

        it("should throw error for invalid mode", function () {
            const query = new FeeEstimateQuery();

            expect(() => query.setMode(999)).to.throw(
                Error,
                "Invalid FeeEstimateMode: 999. Must be one of: STATE (0), INTRINSIC (1)",
            );
        });
    });

    describe("setTransaction", function () {
        it("should set transaction", function () {
            const query = new FeeEstimateQuery();
            const result = query.setTransaction(mockTransaction);

            expect(query.transaction).to.equal(mockTransaction);
            expect(result).to.equal(query);
        });

        it("should set null transaction", function () {
            const query = new FeeEstimateQuery();
            query.setTransaction(mockTransaction);
            query.setTransaction(null);

            expect(query.transaction).to.be.null;
        });
    });

    describe("getMode", function () {
        it("should get current mode", function () {
            const query = new FeeEstimateQuery();
            query.setMode(FeeEstimateMode.STATE);

            expect(query.getMode()).to.equal(FeeEstimateMode.STATE);
        });

        it("should default to INTRINSIC", function () {
            expect(new FeeEstimateQuery().getMode()).to.equal(
                FeeEstimateMode.INTRINSIC,
            );
        });
    });

    describe("getTransaction", function () {
        it("should get current transaction", function () {
            const query = new FeeEstimateQuery();
            query.setTransaction(mockTransaction);

            expect(query.getTransaction()).to.equal(mockTransaction);
        });
    });

    describe("setHighVolumeThrottle", function () {
        it("should default to 0", function () {
            expect(new FeeEstimateQuery().getHighVolumeThrottle()).to.equal(0);
        });

        it("should set valid throttle value", function () {
            const query = new FeeEstimateQuery();
            const result = query.setHighVolumeThrottle(7500);

            expect(query.getHighVolumeThrottle()).to.equal(7500);
            expect(result).to.equal(query);
        });

        it("should accept the bounds 0 and 10000", function () {
            const q = new FeeEstimateQuery();
            q.setHighVolumeThrottle(0);
            expect(q.getHighVolumeThrottle()).to.equal(0);
            q.setHighVolumeThrottle(10000);
            expect(q.getHighVolumeThrottle()).to.equal(10000);
        });

        it("should throw on negative throttle", function () {
            const query = new FeeEstimateQuery();
            expect(() => query.setHighVolumeThrottle(-1)).to.throw(
                /Invalid highVolumeThrottle/,
            );
        });

        it("should throw when throttle exceeds 10000", function () {
            const query = new FeeEstimateQuery();
            expect(() => query.setHighVolumeThrottle(10001)).to.throw(
                /Invalid highVolumeThrottle/,
            );
        });

        it("should throw on non-integer throttle", function () {
            const query = new FeeEstimateQuery();
            expect(() => query.setHighVolumeThrottle(1.5)).to.throw(
                /Invalid highVolumeThrottle/,
            );
        });
    });

    describe("_validateChecksums", function () {
        it("should validate transaction checksums when transaction is set", function () {
            const query = new FeeEstimateQuery({
                transaction: mockTransaction,
            });

            let validated = false;
            mockTransaction._validateChecksums = () => {
                validated = true;
            };

            query._validateChecksums({});

            expect(validated).to.be.true;
        });

        it("should not throw when transaction is null", function () {
            const query = new FeeEstimateQuery();

            expect(() => query._validateChecksums({})).to.not.throw();
        });
    });

    describe("execute", function () {
        it("should reject when transaction is not set", async function () {
            const query = new FeeEstimateQuery();
            let caught = null;
            try {
                await query.execute(/** @type {any} */ ({}));
            } catch (err) {
                caught = err;
            }
            expect(caught).to.be.instanceOf(Error);
            expect(caught.message).to.match(/requires a transaction/);
        });
    });

    describe("wire", function () {
        const FEE_RESPONSE = {
            high_volume_multiplier: 1,
            network: { multiplier: 2, subtotal: 20 },
            node: { base: 10, extras: [] },
            service: { base: 5, extras: [] },
            total: 35,
        };

        /** @type {FakeHttpTransport} */
        let fake;
        /** @type {Client} */
        let client;

        beforeEach(function () {
            fake = new FakeHttpTransport(() => jsonResponse(200, FEE_RESPONSE));
            client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
            client.setMirrorNetwork(["127.0.0.1:5600"]);
            client.setOperator(new AccountId(2), PrivateKey.generateED25519());
            client.setMirrorNodeHttpConfig({
                transport: fake,
                retryPolicy: {
                    maxAttempts: 3,
                    initialBackoff: 1,
                    maxBackoff: 1,
                },
            });
        });

        afterEach(function () {
            client.close();
        });

        it("posts the protobuf transaction to the Java REST fees endpoint", async function () {
            const estimate = await new FeeEstimateQuery()
                .setTransaction(mockTransaction)
                .execute(client);

            expect(estimate.total.toString()).to.equal("35");
            expect(fake.requests).to.have.length(1);
            expect(fake.requests[0].method).to.equal("POST");
            expect(fake.requests[0].url).to.equal(
                "http://127.0.0.1:8084/api/v1/network/fees?mode=INTRINSIC",
            );
            expect(fake.requests[0].contentType).to.equal(
                "application/protobuf",
            );
            expect(fake.requests[0].body.byteLength).to.be.above(0);
        });

        it("encodes the mode and the throttle as query parameters", async function () {
            await new FeeEstimateQuery()
                .setTransaction(mockTransaction)
                .setMode(FeeEstimateMode.STATE)
                .setHighVolumeThrottle(5000)
                .execute(client);

            expect(fake.requests[0].url).to.equal(
                "http://127.0.0.1:8084/api/v1/network/fees?mode=STATE&high_volume_throttle=5000",
            );
        });

        it("retries a 503 and replays the same body", async function () {
            fake.handler = null;
            fake.respond(errorResponse(503, "Unavailable")).respondJson(
                200,
                FEE_RESPONSE,
            );

            const estimate = await new FeeEstimateQuery()
                .setTransaction(mockTransaction)
                .execute(client);

            expect(estimate.total.toString()).to.equal("35");
            expect(fake.requests).to.have.length(2);
            expect([...fake.requests[1].body]).to.deep.equal([
                ...fake.requests[0].body,
            ]);
        });

        it("does not retry a 400 and surfaces the mirror node detail", async function () {
            fake.handler = () =>
                errorResponse(400, "Unable to parse transaction");

            let caught = null;
            try {
                await new FeeEstimateQuery()
                    .setTransaction(mockTransaction)
                    .execute(client);
            } catch (err) {
                caught = err;
            }

            expect(caught.message).to.equal(
                "Failed to estimate fees: HTTP 400: Error: Unable to parse transaction",
            );
            expect(fake.requests).to.have.length(1);
        });

        it("bounds the operation by the given requestTimeout", async function () {
            await new FeeEstimateQuery()
                .setTransaction(mockTransaction)
                .execute(client, 2500);

            expect(fake.requests[0].deadline).to.be.within(2400, 2500);
        });
    });
});
