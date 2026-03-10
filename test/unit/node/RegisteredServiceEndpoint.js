import {
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    MirrorNodeServiceEndpoint,
    RegisteredServiceEndpoint,
    RpcRelayServiceEndpoint,
} from "../../../src/index.js";

describe("RegisteredServiceEndpoint", function () {
    it("should round-trip a block node endpoint", function () {
        const endpoint = new BlockNodeServiceEndpoint()
            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApi(BlockNodeApi.SubscribeStream);

        const endpoint2 = RegisteredServiceEndpoint._fromProtobuf(
            endpoint._toProtobuf(),
        );

        expect(endpoint2).to.be.instanceOf(BlockNodeServiceEndpoint);
        expect(endpoint2.type).to.equal("blockNode");
        expect(endpoint2.ipAddress).to.deep.equal(Uint8Array.of(127, 0, 0, 1));
        expect(endpoint2.port).to.equal(443);
        expect(endpoint2.requiresTls).to.equal(true);
        expect(endpoint2.endpointApi).to.equal(BlockNodeApi.SubscribeStream);
    });

    it("should round-trip a mirror node endpoint", function () {
        const endpoint = new MirrorNodeServiceEndpoint()
            .setDomainName("mirror.example.com")
            .setPort(5600)
            .setRequiresTls(true);

        const endpoint2 = RegisteredServiceEndpoint._fromProtobuf(
            endpoint._toProtobuf(),
        );

        expect(endpoint2).to.be.instanceOf(MirrorNodeServiceEndpoint);
        expect(endpoint2.type).to.equal("mirrorNode");
        expect(endpoint2.domainName).to.equal("mirror.example.com");
        expect(endpoint2.port).to.equal(5600);
        expect(endpoint2.requiresTls).to.equal(true);
    });

    it("should round-trip an rpc relay endpoint", function () {
        const endpoint = new RpcRelayServiceEndpoint()
            .setDomainName("rpc.example.com")
            .setPort(7546)
            .setRequiresTls(false);

        const endpoint2 = RegisteredServiceEndpoint._fromProtobuf(
            endpoint._toProtobuf(),
        );

        expect(endpoint2).to.be.instanceOf(RpcRelayServiceEndpoint);
        expect(endpoint2.type).to.equal("rpcRelay");
        expect(endpoint2.domainName).to.equal("rpc.example.com");
        expect(endpoint2.port).to.equal(7546);
        expect(endpoint2.requiresTls).to.equal(false);
    });

    it("should enforce ip/domain one-of semantics", function () {
        const endpoint = new MirrorNodeServiceEndpoint().setDomainName(
            "mirror.example.com",
        );

        expect(() => endpoint.setIpAddress(Uint8Array.of(127, 0, 0, 1))).to
            .throw;
    });

    it("should validate the port range", function () {
        const endpoint = new RpcRelayServiceEndpoint();
        expect(() => endpoint.setPort(-1)).to.throw(
            "Port must be an integer in the range [0, 65535].",
        );
        expect(() => endpoint.setPort(65536)).to.throw(
            "Port must be an integer in the range [0, 65535].",
        );
    });
});
