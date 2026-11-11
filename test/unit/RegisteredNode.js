import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import { KeyList, PrivateKey } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import RegisteredNode from "../../src/node/RegisteredNode.js";
import RegisteredServiceEndpoint from "../../src/node/RegisteredServiceEndpoint.js";

describe("RegisteredNode", function () {
    let adminKey;

    beforeEach(function () {
        adminKey = PrivateKey.generateED25519().publicKey;
    });

    /**
     * @returns {object} a block node endpoint as the mirror node returns it
     */
    function endpointJson() {
        return {
            block_node: { endpoint_apis: ["STATUS"] },
            domain_name: null,
            general_service: null,
            ip_address: "127.0.0.1",
            mirror_node: null,
            port: 443,
            requires_tls: true,
            rpc_relay: null,
            type: "BLOCK_NODE",
        };
    }

    describe("constructor", function () {
        it("should set the fields given in props", function () {
            const node = new RegisteredNode({
                registeredNodeId: 7,
                adminKey,
                description: "alpha",
                serviceEndpoints: [],
            });

            expect(node.registeredNodeId).to.be.instanceOf(Long);
            expect(node.registeredNodeId.toNumber()).to.equal(7);
            expect(node.adminKey).to.equal(adminKey);
            expect(node.description).to.equal("alpha");
            expect(node.serviceEndpoints).to.deep.equal([]);
        });

        it("should default description to null", function () {
            const node = new RegisteredNode({
                registeredNodeId: 7,
                adminKey,
                serviceEndpoints: [],
            });

            expect(node.description).to.be.null;
        });

        it("should copy the service endpoints", function () {
            const serviceEndpoints = [];
            const node = new RegisteredNode({
                registeredNodeId: 7,
                adminKey,
                serviceEndpoints,
            });

            expect(node.serviceEndpoints).to.not.equal(serviceEndpoints);
        });

        it("should freeze the node and its service endpoints", function () {
            const node = new RegisteredNode({
                registeredNodeId: 7,
                adminKey,
                serviceEndpoints: [],
            });

            expect(Object.isFrozen(node)).to.be.true;
            expect(Object.isFrozen(node.serviceEndpoints)).to.be.true;
        });

        it("should throw a TypeError without props", function () {
            expect(() => new RegisteredNode()).to.throw(
                TypeError,
                "RegisteredNode props are required.",
            );
        });

        it("should throw a TypeError without a registeredNodeId", function () {
            expect(
                () => new RegisteredNode({ adminKey, serviceEndpoints: [] }),
            ).to.throw(
                TypeError,
                "RegisteredNode requires a registeredNodeId.",
            );
        });

        it("should throw a TypeError without an adminKey", function () {
            expect(
                () =>
                    new RegisteredNode({
                        registeredNodeId: 7,
                        serviceEndpoints: [],
                    }),
            ).to.throw(TypeError, "RegisteredNode requires an adminKey.");
        });

        it("should throw a TypeError without serviceEndpoints", function () {
            expect(
                () => new RegisteredNode({ registeredNodeId: 7, adminKey }),
            ).to.throw(
                TypeError,
                "RegisteredNode requires a serviceEndpoints array.",
            );
        });
    });

    describe("_fromJson", function () {
        it("should decode every field", function () {
            const node = RegisteredNode._fromJson({
                registered_node_id: 7,
                admin_key: { _type: "ED25519", key: adminKey.toStringRaw() },
                description: "alpha",
                service_endpoints: [endpointJson()],
            });

            expect(node.registeredNodeId.toNumber()).to.equal(7);
            expect(node.adminKey.toStringRaw()).to.equal(
                adminKey.toStringRaw(),
            );
            expect(node.description).to.equal("alpha");
            expect(node.serviceEndpoints).to.have.length(1);
            expect(node.serviceEndpoints[0]).to.be.instanceOf(
                RegisteredServiceEndpoint,
            );
        });

        it("should read a registered node ID above 2^53 exactly", function () {
            const node = RegisteredNode._fromJson({
                registered_node_id: "9007199254740993",
                admin_key: { _type: "ED25519", key: adminKey.toStringRaw() },
                service_endpoints: [],
            });

            expect(node.registeredNodeId.toString()).to.equal(
                "9007199254740993",
            );
        });

        it("should leave a missing description null", function () {
            const node = RegisteredNode._fromJson({
                registered_node_id: 7,
                admin_key: { _type: "ED25519", key: adminKey.toStringRaw() },
                service_endpoints: [],
            });

            expect(node.description).to.be.null;
        });

        it("should decode an ECDSA_SECP256K1 admin key", function () {
            const ecdsaKey = PrivateKey.generateECDSA().publicKey;

            const node = RegisteredNode._fromJson({
                registered_node_id: 7,
                admin_key: {
                    _type: "ECDSA_SECP256K1",
                    key: ecdsaKey.toStringRaw(),
                },
                service_endpoints: [],
            });

            expect(node.adminKey.toStringRaw()).to.equal(
                ecdsaKey.toStringRaw(),
            );
        });

        it("should decode a ProtobufEncoded admin key", function () {
            const keyList = new KeyList([
                adminKey,
                PrivateKey.generateED25519().publicKey,
            ]);
            const encoded = hex.encode(
                HieroProto.proto.Key.encode(keyList._toProtobufKey()).finish(),
            );

            const node = RegisteredNode._fromJson({
                registered_node_id: 7,
                admin_key: { _type: "ProtobufEncoded", key: encoded },
                service_endpoints: [],
            });

            expect(node.adminKey).to.be.instanceOf(KeyList);
            expect(node.adminKey.toArray().map(String)).to.deep.equal(
                keyList.toArray().map(String),
            );
        });

        it("should throw for a ProtobufEncoded admin key without a key", function () {
            expect(() =>
                RegisteredNode._fromJson({
                    registered_node_id: 7,
                    admin_key: { _type: "ProtobufEncoded", key: "" },
                    service_endpoints: [],
                }),
            ).to.throw(
                "Mirror node returned a protobuf-encoded admin key that could not be decoded.",
            );
        });

        it("should throw for an unsupported admin key type", function () {
            expect(() =>
                RegisteredNode._fromJson({
                    registered_node_id: 7,
                    admin_key: { _type: "RSA_3072", key: "00" },
                    service_endpoints: [],
                }),
            ).to.throw("Unsupported registered node admin key type: RSA_3072");
        });
    });
});
