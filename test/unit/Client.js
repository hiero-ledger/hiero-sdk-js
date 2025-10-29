import Client from "../../src/client/Client.js";
import {
    DEFAULT_GRPC_DEADLINE,
    DEFAULT_REQUEST_TIMEOUT,
} from "../../src/constants/ClientConstants.js";

describe("Client deadline configuration", function () {
    it("uses DEFAULT_GRPC_DEADLINE and DEFAULT_REQUEST_TIMEOUT by default", function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        expect(client.grpcDeadline).to.equal(DEFAULT_GRPC_DEADLINE);
        expect(client.requestTimeout).to.equal(DEFAULT_REQUEST_TIMEOUT);
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
