import * as HieroProto from "@hiero-ledger/proto";
import { vi } from "vitest";
import Channel from "../../../src/channel/Channel.js";

const RPC_METHODS = [
    "registerChannel",
    "completeChannel",
    "closeChannel",
    "submitBundle",
    "registerConnector",
    "deregisterConnector",
    "completeConnector",
    "updateLedgerConfiguration",
    "getLedgerConfiguration",
    "getEndpointManifest",
];

describe("Channel", function () {
    it("creates the CLPR service on first access and reuses its unary client", async function () {
        const unaryClient = vi.fn((_method, _requestData, callback) =>
            callback(null, new Uint8Array()),
        );
        const createUnaryClient = vi.fn(() => unaryClient);

        class TestChannel extends Channel {
            _createUnaryClient(serviceName) {
                return createUnaryClient(serviceName);
            }
        }

        const channel = new TestChannel();
        expect(createUnaryClient).not.toHaveBeenCalled();

        const service = channel.clpr;
        expect(service).not.to.be.undefined;
        expect(service).to.be.instanceOf(HieroProto.proto.ClprService);
        expect(channel.clpr).to.equal(service);
        expect(createUnaryClient).toHaveBeenCalledExactlyOnceWith(
            "ClprService",
        );

        for (const method of RPC_METHODS) {
            expect(service[method]).to.be.a("function");
            await service[method]({});
        }

        expect(
            unaryClient.mock.calls.map(([method]) => method.name),
        ).to.deep.equal(RPC_METHODS);
        expect(channel.clpr).to.equal(service);
        expect(createUnaryClient).toHaveBeenCalledTimes(1);
    });
});
