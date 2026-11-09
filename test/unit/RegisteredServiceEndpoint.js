import {
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    GeneralServiceEndpoint,
    MirrorNodeServiceEndpoint,
    RegisteredServiceEndpoint,
    RpcRelayServiceEndpoint,
} from "../../src/index.js";

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

    it("should accept a 16-byte IPv6 address", function () {
        const ipv6 = new Uint8Array(16);
        ipv6[15] = 1;
        const endpoint = new RpcRelayServiceEndpoint().setIpAddress(ipv6);
        expect(endpoint.ipAddress).to.deep.equal(ipv6);
    });

    it("should reject null setters", function () {
        const endpoint = new BlockNodeServiceEndpoint();
        expect(() => endpoint.setIpAddress(null)).to.throw(TypeError);
        expect(() => endpoint.setDomainName(null)).to.throw(TypeError);
        expect(() => endpoint.setEndpointApis(null)).to.throw(TypeError);
    });

    // Note: description max-bytes (100, UTF-8) is enforced by the consensus
    // node; not pre-checked SDK-side. See integration tests.

    // Note: port range, IP-byte-length, FQDN length, and ip-or-domain-required
    // are enforced by the consensus node via INVALID_REGISTERED_ENDPOINT and
    // INVALID_REGISTERED_ENDPOINT_ADDRESS — see integration tests.

    it("endpointApis getter should return a defensive copy", function () {
        const endpoint = new BlockNodeServiceEndpoint().setEndpointApis([
            BlockNodeApi.Status,
        ]);
        const apis = endpoint.endpointApis;
        apis.push(BlockNodeApi.Publish);
        expect(endpoint.endpointApis).to.deep.equal([BlockNodeApi.Status]);
    });

    it("type getter throws when no type is set on base instance", function () {
        // Access _type directly via a plain instance constructed without
        // calling _setType (the base constructor doesn't set it).
        const endpoint = new MirrorNodeServiceEndpoint();
        // Reset _type to simulate the unset state covered by the getter guard.
        endpoint._type = null;
        expect(() => endpoint.type).to.throw(
            "RegisteredServiceEndpoint type is not set; use a concrete endpoint subtype.",
        );
    });

    it("setDomainName throws when IP address is already set", function () {
        const endpoint = new MirrorNodeServiceEndpoint().setIpAddress(
            Uint8Array.of(127, 0, 0, 1),
        );
        expect(() => endpoint.setDomainName("example.com")).to.throw(
            "Cannot set domain name when IP address is already set.",
        );
    });

    it("setRequiresTls throws for non-boolean value", function () {
        const endpoint = new MirrorNodeServiceEndpoint();
        expect(() => endpoint.setRequiresTls("yes")).to.throw(
            TypeError,
            "requiresTls must be a boolean.",
        );
        expect(() => endpoint.setRequiresTls(1)).to.throw(
            TypeError,
            "requiresTls must be a boolean.",
        );
    });

    it("_fromProtobuf throws when no endpoint type is present", function () {
        expect(() =>
            RegisteredServiceEndpoint._fromProtobuf({
                ipAddress: Uint8Array.of(127, 0, 0, 1),
                port: 443,
            }),
        ).to.throw(
            "Unable to decode registered service endpoint: endpoint type is missing.",
        );
    });

    it("_fromProtobuf decodes endpoint when endpointType property is set directly", function () {
        const endpoint = RegisteredServiceEndpoint._fromProtobuf({
            endpointType: "mirrorNode",
            domainName: "mirror.example.com",
            port: 443,
            requiresTls: true,
        });
        expect(endpoint).to.be.instanceOf(MirrorNodeServiceEndpoint);
        expect(endpoint.type).to.equal("mirrorNode");
    });
});

// ---------------------------------------------------------------------------
// _fromJson – IP parsing and type discrimination
// ---------------------------------------------------------------------------

/**
 * Small helper: builds a minimal valid JSON blob and merges extra fields,
 * then calls the base-class dispatcher so the IP-parsing helpers are exercised.
 *
 * @param {object} fields
 * @returns {RegisteredServiceEndpoint}
 */
function fromJson(fields) {
    return RegisteredServiceEndpoint._fromJson({
        mirror_node: {},
        port: 443,
        requires_tls: true,
        ...fields,
    });
}

describe("RegisteredServiceEndpoint._fromJson", function () {
    // -----------------------------------------------------------------------
    // Type discrimination via `type` string field
    // -----------------------------------------------------------------------

    it("decodes type BLOCK_NODE", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            type: "BLOCK_NODE",
            ip_address: "127.0.0.1",
            port: 443,
            requires_tls: true,
        });
        expect(ep).to.be.instanceOf(BlockNodeServiceEndpoint);
        expect(ep.type).to.equal("blockNode");
    });

    it("decodes type MIRROR_NODE", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            type: "MIRROR_NODE",
            ip_address: "127.0.0.1",
            port: 443,
            requires_tls: true,
        });
        expect(ep).to.be.instanceOf(MirrorNodeServiceEndpoint);
        expect(ep.type).to.equal("mirrorNode");
    });

    it("decodes type RPC_RELAY", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            type: "RPC_RELAY",
            ip_address: "127.0.0.1",
            port: 7546,
            requires_tls: false,
        });
        expect(ep).to.be.instanceOf(RpcRelayServiceEndpoint);
        expect(ep.type).to.equal("rpcRelay");
    });

    it("decodes type GENERAL_SERVICE", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            type: "GENERAL_SERVICE",
            ip_address: "127.0.0.1",
            port: 8080,
            requires_tls: false,
        });
        expect(ep).to.be.instanceOf(GeneralServiceEndpoint);
        expect(ep.type).to.equal("generalService");
    });

    // -----------------------------------------------------------------------
    // Type discrimination via nested object fields
    // -----------------------------------------------------------------------

    it("decodes block_node nested field", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            block_node: { endpoint_apis: [] },
            ip_address: "127.0.0.1",
            port: 443,
            requires_tls: true,
        });
        expect(ep).to.be.instanceOf(BlockNodeServiceEndpoint);
        expect(ep.type).to.equal("blockNode");
    });

    it("decodes mirror_node nested field", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            mirror_node: {},
            ip_address: "127.0.0.1",
            port: 443,
            requires_tls: true,
        });
        expect(ep).to.be.instanceOf(MirrorNodeServiceEndpoint);
        expect(ep.type).to.equal("mirrorNode");
    });

    it("decodes rpc_relay nested field", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            rpc_relay: {},
            ip_address: "127.0.0.1",
            port: 7546,
            requires_tls: false,
        });
        expect(ep).to.be.instanceOf(RpcRelayServiceEndpoint);
        expect(ep.type).to.equal("rpcRelay");
    });

    it("decodes general_service nested field", function () {
        const ep = RegisteredServiceEndpoint._fromJson({
            general_service: { description: "test" },
            ip_address: "127.0.0.1",
            port: 8080,
            requires_tls: false,
        });
        expect(ep).to.be.instanceOf(GeneralServiceEndpoint);
        expect(ep.type).to.equal("generalService");
    });

    it("throws when no recognized type is present", function () {
        expect(() =>
            RegisteredServiceEndpoint._fromJson({
                port: 443,
                requires_tls: true,
                ip_address: "127.0.0.1",
            }),
        ).to.throw(
            "Registered service endpoint response did not include a recognized endpoint type.",
        );
    });

    // -----------------------------------------------------------------------
    // Missing address
    // -----------------------------------------------------------------------

    it("throws when neither ip_address nor domain_name is present", function () {
        expect(() =>
            RegisteredServiceEndpoint._fromJson({
                mirror_node: {},
                port: 443,
                requires_tls: true,
            }),
        ).to.throw(
            "Registered service endpoint response did not include an IP address or domain name.",
        );
    });

    it("uses domain_name when no ip_address is provided", function () {
        const ep = fromJson({ domain_name: "mirror.example.com" });
        expect(ep.domainName).to.equal("mirror.example.com");
        expect(ep.ipAddress).to.be.null;
    });

    // -----------------------------------------------------------------------
    // IPv4 – valid
    // -----------------------------------------------------------------------

    it("parses 127.0.0.1", function () {
        expect(fromJson({ ip_address: "127.0.0.1" }).ipAddress).to.deep.equal(
            Uint8Array.of(127, 0, 0, 1),
        );
    });

    it("parses 0.0.0.0", function () {
        expect(fromJson({ ip_address: "0.0.0.0" }).ipAddress).to.deep.equal(
            Uint8Array.of(0, 0, 0, 0),
        );
    });

    it("parses 255.255.255.255", function () {
        expect(
            fromJson({ ip_address: "255.255.255.255" }).ipAddress,
        ).to.deep.equal(Uint8Array.of(255, 255, 255, 255));
    });

    // -----------------------------------------------------------------------
    // IPv4 – errors
    // -----------------------------------------------------------------------

    it("throws for wrong number of IPv4 parts", function () {
        expect(() => fromJson({ ip_address: "127.0.1" })).to.throw(
            "Invalid IPv4 address: 127.0.1",
        );
        expect(() => fromJson({ ip_address: "127.0.0.1.5" })).to.throw(
            "Invalid IPv4 address: 127.0.0.1.5",
        );
    });

    it("throws for non-numeric IPv4 part", function () {
        expect(() => fromJson({ ip_address: "127.0.0.x" })).to.throw(
            "Invalid IPv4 address: 127.0.0.x",
        );
    });

    it("throws for IPv4 part above 255", function () {
        expect(() => fromJson({ ip_address: "127.0.0.256" })).to.throw(
            "Invalid IPv4 address: 127.0.0.256",
        );
    });

    // -----------------------------------------------------------------------
    // IPv6 – valid (unbracketed)
    // -----------------------------------------------------------------------

    it("parses ::1 (loopback)", function () {
        expect(fromJson({ ip_address: "::1" }).ipAddress).to.deep.equal(
            Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1),
        );
    });

    it("parses :: (all-zeros)", function () {
        expect(fromJson({ ip_address: "::" }).ipAddress).to.deep.equal(
            new Uint8Array(16),
        );
    });

    it("parses 2001:db8::1", function () {
        expect(fromJson({ ip_address: "2001:db8::1" }).ipAddress).to.deep.equal(
            Uint8Array.of(
                0x20,
                0x01,
                0x0d,
                0xb8,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
            ),
        );
    });

    it("parses full 8-group IPv6 address", function () {
        expect(
            fromJson({
                ip_address: "2001:db8:0:0:0:0:0:1",
            }).ipAddress,
        ).to.deep.equal(
            Uint8Array.of(
                0x20,
                0x01,
                0x0d,
                0xb8,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
            ),
        );
    });

    it("parses :: compression at the start", function () {
        expect(fromJson({ ip_address: "::ffff:1" }).ipAddress).to.deep.equal(
            Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0, 1),
        );
    });

    it("parses :: compression at the end", function () {
        expect(fromJson({ ip_address: "2001:db8::" }).ipAddress).to.deep.equal(
            Uint8Array.of(
                0x20,
                0x01,
                0x0d,
                0xb8,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ),
        );
    });

    // -----------------------------------------------------------------------
    // IPv6 – bracketed form
    // -----------------------------------------------------------------------

    it("parses [::1] (bracketed loopback)", function () {
        expect(fromJson({ ip_address: "[::1]" }).ipAddress).to.deep.equal(
            Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1),
        );
    });

    it("parses [2001:db8::1] (bracketed)", function () {
        expect(
            fromJson({ ip_address: "[2001:db8::1]" }).ipAddress,
        ).to.deep.equal(
            Uint8Array.of(
                0x20,
                0x01,
                0x0d,
                0xb8,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
            ),
        );
    });

    // -----------------------------------------------------------------------
    // IPv6 – embedded IPv4 (::ffff:192.0.2.1 style)
    // -----------------------------------------------------------------------

    it("parses ::ffff:192.0.2.1 (IPv4-mapped IPv6)", function () {
        expect(
            fromJson({ ip_address: "::ffff:192.0.2.1" }).ipAddress,
        ).to.deep.equal(
            Uint8Array.of(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0xff,
                0xff,
                192,
                0,
                2,
                1,
            ),
        );
    });

    // -----------------------------------------------------------------------
    // IPv6 – errors
    // -----------------------------------------------------------------------

    it("throws for more than one :: in IPv6 address", function () {
        expect(() => fromJson({ ip_address: "1::2::3" })).to.throw(
            "Invalid IPv6 address: 1::2::3",
        );
    });

    it("throws for too many groups in IPv6 address (no ::)", function () {
        expect(() => fromJson({ ip_address: "1:2:3:4:5:6:7:8:9" })).to.throw(
            "Invalid IPv6 address: 1:2:3:4:5:6:7:8:9",
        );
    });

    it("throws for too few groups in IPv6 address (no ::)", function () {
        expect(() => fromJson({ ip_address: "1:2:3:4" })).to.throw(
            "Invalid IPv6 address: 1:2:3:4",
        );
    });

    it("throws for too many groups with :: present", function () {
        expect(() => fromJson({ ip_address: "1:2:3:4::5:6:7:8" })).to.throw(
            "Invalid IPv6 address: 1:2:3:4::5:6:7:8",
        );
    });

    it("throws for empty group in IPv6 address", function () {
        expect(() => fromJson({ ip_address: "2001:db8:::1" })).to.throw(
            "Invalid IPv6 address segment: :1",
        );
    });

    it("throws for invalid hex segment in IPv6", function () {
        expect(() => fromJson({ ip_address: "2001:db8::xyz:1" })).to.throw(
            "Invalid IPv6 address segment: xyz",
        );
    });

    it("throws for segment with more than 4 hex digits", function () {
        expect(() => fromJson({ ip_address: "2001:db8::12345:1" })).to.throw(
            "Invalid IPv6 address segment: 12345",
        );
    });
});
