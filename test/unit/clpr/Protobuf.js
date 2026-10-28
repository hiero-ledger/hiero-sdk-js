import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";

const { proto } = HieroProto;

describe("CLPR protobufs", function () {
    it.each([
        ["clprUpdateLedgerConfiguration", [146, 5, 0]],
        ["clprRegisterChannel", [154, 5, 0]],
        ["clprCompleteChannel", [162, 5, 0]],
        ["clprCloseChannel", [170, 5, 0]],
        ["clprSubmitBundle", [178, 5, 0]],
        ["clprRegisterConnector", [194, 5, 0]],
        ["clprDeregisterConnector", [202, 5, 0]],
        ["clprCompleteConnector", [210, 5, 0]],
        ["clprEndpointPublication", [218, 5, 0]],
        ["clprMaintenance", [226, 5, 0]],
    ])(
        "round-trips TransactionBody.%s at its pinned tag",
        function (field, wire) {
            const bytes = new Uint8Array(wire);
            const body = proto.TransactionBody.decode(bytes);

            expect(body[field]).not.to.be.undefined;
            expect(
                proto.TransactionBody.encode({ [field]: {} }).finish(),
            ).to.deep.equal(bytes);
            expect(proto.TransactionBody.encode(body).finish()).to.deep.equal(
                bytes,
            );
        },
    );

    it.each([
        ["clprGetLedgerConfiguration", [218, 3, 0]],
        ["clprGetEndpointManifest", [226, 3, 0]],
    ])("round-trips Query.%s at its pinned tag", function (field, wire) {
        const bytes = new Uint8Array(wire);
        const query = proto.Query.decode(bytes);

        expect(query[field]).not.to.be.undefined;
        expect(proto.Query.encode({ [field]: {} }).finish()).to.deep.equal(
            bytes,
        );
        expect(proto.Query.encode(query).finish()).to.deep.equal(bytes);
    });

    it.each([
        ["clprGetLedgerConfiguration", [250, 9, 0]],
        ["clprGetEndpointManifest", [130, 10, 0]],
    ])("round-trips Response.%s at its pinned tag", function (field, wire) {
        const bytes = new Uint8Array(wire);
        const response = proto.Response.decode(bytes);

        expect(response[field]).not.to.be.undefined;
        expect(proto.Response.encode({ [field]: {} }).finish()).to.deep.equal(
            bytes,
        );
        expect(proto.Response.encode(response).finish()).to.deep.equal(bytes);
    });

    it("includes both CLPR signature schemes in the service namespace", function () {
        expect({
            ...HieroProto.com.hedera.hapi.node.clpr?.ClprSignatureScheme,
        }).to.deep.equal({ ECDSA_SECP256K1: 0, ED25519: 1 });
    });

    it("keeps uint64 throttle limits and an empty configuration proof through Response bytes", function () {
        const bytes = proto.Response.encode({
            clprGetLedgerConfiguration: {
                configuration: {
                    throttles: {
                        maxGasPerMessage: Long.MAX_UNSIGNED_VALUE,
                        maxSyncBytes: Long.MAX_UNSIGNED_VALUE,
                    },
                },
                configurationStateProof: new Uint8Array(),
            },
        }).finish();
        const response = proto.Response.decode(bytes);

        expect(response.clprGetLedgerConfiguration).not.to.be.undefined;
        const { configuration, configurationStateProof } =
            response.clprGetLedgerConfiguration;

        for (const value of [
            configuration.throttles.maxGasPerMessage,
            configuration.throttles.maxSyncBytes,
        ]) {
            expect(Long.isLong(value)).to.be.true;
            expect(value.unsigned).to.be.true;
            expect(value.toString()).to.equal("18446744073709551615");
        }
        expect(Array.from(configurationStateProof)).to.deep.equal([]);
        expect(proto.Response.encode(response).finish()).to.deep.equal(bytes);
    });

    it("keeps a uint64 manifest version and an empty manifest proof through Response bytes", function () {
        const bytes = proto.Response.encode({
            clprGetEndpointManifest: {
                manifest: { version: Long.MAX_UNSIGNED_VALUE },
                manifestStateProof: new Uint8Array(),
            },
        }).finish();
        const response = proto.Response.decode(bytes);

        expect(response.clprGetEndpointManifest).not.to.be.undefined;
        const { manifest, manifestStateProof } =
            response.clprGetEndpointManifest;

        expect(Long.isLong(manifest.version)).to.be.true;
        expect(manifest.version.unsigned).to.be.true;
        expect(manifest.version.toString()).to.equal("18446744073709551615");
        expect(Array.from(manifestStateProof)).to.deep.equal([]);
        expect(proto.Response.encode(response).finish()).to.deep.equal(bytes);
    });
});
