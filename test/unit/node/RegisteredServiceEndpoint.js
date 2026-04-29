import {
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    GeneralServiceEndpoint,
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
            .setEndpointApis([
                BlockNodeApi.SubscribeStream,
                BlockNodeApi.Status,
            ]);

        const endpoint2 = RegisteredServiceEndpoint._fromProtobuf(
            endpoint._toProtobuf(),
        );

        expect(endpoint2).to.be.instanceOf(BlockNodeServiceEndpoint);
        expect(endpoint2.type).to.equal("blockNode");
        expect(endpoint2.ipAddress).to.deep.equal(Uint8Array.of(127, 0, 0, 1));
        expect(endpoint2.port).to.equal(443);
        expect(endpoint2.requiresTls).to.equal(true);
        expect(endpoint2.endpointApis).to.deep.equal([
            BlockNodeApi.SubscribeStream,
            BlockNodeApi.Status,
        ]);
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

    it("should round-trip a general service endpoint", function () {
        const endpoint = new GeneralServiceEndpoint()
            .setDomainName("general.example.com")
            .setPort(8080)
            .setRequiresTls(true)
            .setDescription("Archive API");

        const endpoint2 = RegisteredServiceEndpoint._fromProtobuf(
            endpoint._toProtobuf(),
        );

        expect(endpoint2).to.be.instanceOf(GeneralServiceEndpoint);
        expect(endpoint2.type).to.equal("generalService");
        expect(endpoint2.domainName).to.equal("general.example.com");
        expect(endpoint2.port).to.equal(8080);
        expect(endpoint2.requiresTls).to.equal(true);
        expect(endpoint2.description).to.equal("Archive API");
    });

    it("should enforce ip/domain one-of semantics", function () {
        const endpoint = new MirrorNodeServiceEndpoint().setDomainName(
            "mirror.example.com",
        );

        expect(() =>
            endpoint.setIpAddress(Uint8Array.of(127, 0, 0, 1)),
        ).to.throw("Cannot set IP address when domain name is already set.");
    });

    it("should reject IP addresses that are not 4 or 16 bytes", function () {
        const endpoint = new BlockNodeServiceEndpoint();

        expect(() => endpoint.setIpAddress(Uint8Array.of(1, 2, 3))).to.throw(
            /must be 4 bytes \(IPv4\) or 16 bytes \(IPv6\)/,
        );
        expect(() => endpoint.setIpAddress(new Uint8Array(8))).to.throw(
            /must be 4 bytes \(IPv4\) or 16 bytes \(IPv6\)/,
        );
    });

    it("should accept a 16-byte IPv6 address", function () {
        const ipv6 = new Uint8Array(16);
        ipv6[15] = 1;
        const endpoint = new RpcRelayServiceEndpoint().setIpAddress(ipv6);
        expect(endpoint.ipAddress).to.deep.equal(ipv6);
    });

    it("should reject a domain name longer than 250 ASCII chars", function () {
        const endpoint = new MirrorNodeServiceEndpoint();
        expect(() => endpoint.setDomainName("a".repeat(251))).to.throw(
            /at most 250 ASCII characters/,
        );
    });

    it("should reject null setters", function () {
        const endpoint = new BlockNodeServiceEndpoint();
        expect(() => endpoint.setIpAddress(null)).to.throw(TypeError);
        expect(() => endpoint.setDomainName(null)).to.throw(TypeError);
        expect(() => endpoint.setEndpointApis(null)).to.throw(TypeError);
    });

    it("should reject a general service description longer than 100 UTF-8 bytes", function () {
        const endpoint = new GeneralServiceEndpoint();
        expect(() => endpoint.setDescription("a".repeat(101))).to.throw(
            /at most 100 bytes when encoded as UTF-8/,
        );
        // Multi-byte UTF-8 character: 'é' = 2 bytes; 51 of them = 102 bytes.
        expect(() => endpoint.setDescription("é".repeat(51))).to.throw(
            /at most 100 bytes when encoded as UTF-8/,
        );
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

    it("_validate should fail when neither ipAddress nor domainName is set", function () {
        const endpoint = new BlockNodeServiceEndpoint().setPort(443);
        expect(() => endpoint._validate()).to.throw(
            /must have either an IP address or a domain name set/,
        );
    });

    it("endpointApis getter should return a defensive copy", function () {
        const endpoint = new BlockNodeServiceEndpoint().setEndpointApis([
            BlockNodeApi.Status,
        ]);
        const apis = endpoint.endpointApis;
        apis.push(BlockNodeApi.Publish);
        expect(endpoint.endpointApis).to.deep.equal([BlockNodeApi.Status]);
    });
});
