// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import SemanticVersion from "../../../src/network/SemanticVersion.js";
import NetworkVersionInfo from "../../../src/network/NetworkVersionInfo.js";

describe("NetworkVersionInfo", function () {
    it("constructor stores both versions and freezes the instance", function () {
        const protobufVersion = new SemanticVersion({
            major: 1,
            minor: 2,
            patch: 3,
        });
        const servicesVersion = new SemanticVersion({
            major: 4,
            minor: 5,
            patch: 6,
        });

        const info = new NetworkVersionInfo({
            protobufVersion,
            servicesVersion,
        });

        expect(info.protobufVersion).to.equal(protobufVersion);
        expect(info.servicesVersion).to.equal(servicesVersion);
        expect(Object.isFrozen(info)).to.be.true;
    });

    it("_fromProtobuf populates both versions", function () {
        const info = NetworkVersionInfo._fromProtobuf({
            hapiProtoVersion: { major: 1, minor: 2, patch: 3 },
            hederaServicesVersion: { major: 4, minor: 5, patch: 6 },
        });

        expect(info.protobufVersion.major).to.equal(1);
        expect(info.protobufVersion.minor).to.equal(2);
        expect(info.protobufVersion.patch).to.equal(3);
        expect(info.servicesVersion.major).to.equal(4);
        expect(info.servicesVersion.minor).to.equal(5);
        expect(info.servicesVersion.patch).to.equal(6);
    });

    it("_toProtobuf returns the plain protobuf object", function () {
        const info = new NetworkVersionInfo({
            protobufVersion: new SemanticVersion({
                major: 7,
                minor: 8,
                patch: 9,
            }),
            servicesVersion: new SemanticVersion({
                major: 10,
                minor: 11,
                patch: 12,
            }),
        });

        expect(info._toProtobuf()).to.deep.equal({
            hapiProtoVersion: { major: 7, minor: 8, patch: 9 },
            hederaServicesVersion: { major: 10, minor: 11, patch: 12 },
        });
    });

    it("_toProtobuf uses the protobuf field names, not the instance property names", function () {
        // The instance properties are protobufVersion/servicesVersion while the
        // protobuf message fields are hapiProtoVersion/hederaServicesVersion.
        // Renaming either pair independently would silently drop data on the
        // wire, so the mapping is pinned here.
        const info = new NetworkVersionInfo({
            protobufVersion: new SemanticVersion({
                major: 1,
                minor: 0,
                patch: 0,
            }),
            servicesVersion: new SemanticVersion({
                major: 2,
                minor: 0,
                patch: 0,
            }),
        });

        const proto = info._toProtobuf();

        expect(proto.hapiProtoVersion).to.deep.equal({
            major: 1,
            minor: 0,
            patch: 0,
        });
        expect(proto.hederaServicesVersion).to.deep.equal({
            major: 2,
            minor: 0,
            patch: 0,
        });
        expect(proto.protobufVersion).to.be.undefined;
        expect(proto.servicesVersion).to.be.undefined;
    });

    it("toBytes and fromBytes round-trip preserves both versions", function () {
        const info = new NetworkVersionInfo({
            protobufVersion: new SemanticVersion({
                major: 13,
                minor: 14,
                patch: 15,
            }),
            servicesVersion: new SemanticVersion({
                major: 16,
                minor: 17,
                patch: 18,
            }),
        });

        const decoded = NetworkVersionInfo.fromBytes(info.toBytes());

        expect(decoded.protobufVersion.major).to.equal(13);
        expect(decoded.protobufVersion.minor).to.equal(14);
        expect(decoded.protobufVersion.patch).to.equal(15);
        expect(decoded.servicesVersion.major).to.equal(16);
        expect(decoded.servicesVersion.minor).to.equal(17);
        expect(decoded.servicesVersion.patch).to.equal(18);
    });

    it("toBytes matches the protobuf encoder output", function () {
        const info = new NetworkVersionInfo({
            protobufVersion: new SemanticVersion({
                major: 1,
                minor: 2,
                patch: 3,
            }),
            servicesVersion: new SemanticVersion({
                major: 4,
                minor: 5,
                patch: 6,
            }),
        });

        const expected = HieroProto.proto.NetworkGetVersionInfoResponse.encode({
            hapiProtoVersion: { major: 1, minor: 2, patch: 3 },
            hederaServicesVersion: { major: 4, minor: 5, patch: 6 },
        }).finish();

        expect(info.toBytes()).to.deep.equal(expected);
    });
});
