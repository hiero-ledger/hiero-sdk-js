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
});
