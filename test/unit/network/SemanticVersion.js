// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import SemanticVersion from "../../../src/network/SemanticVersion.js";

describe("SemanticVersion", function () {
    it("constructor stores major, minor and patch and freezes the instance", function () {
        const version = new SemanticVersion({ major: 1, minor: 2, patch: 3 });

        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(2);
        expect(version.patch).to.equal(3);
        expect(Object.isFrozen(version)).to.be.true;
    });

    it("_fromProtobuf populates all fields", function () {
        const version = SemanticVersion._fromProtobuf({
            major: 4,
            minor: 5,
            patch: 6,
        });

        expect(version.major).to.equal(4);
        expect(version.minor).to.equal(5);
        expect(version.patch).to.equal(6);
    });

    it("_toProtobuf returns the plain protobuf object", function () {
        const version = new SemanticVersion({ major: 7, minor: 8, patch: 9 });

        expect(version._toProtobuf()).to.deep.equal({
            major: 7,
            minor: 8,
            patch: 9,
        });
    });

    it("toBytes and fromBytes round-trip preserves all values", function () {
        const version = new SemanticVersion({
            major: 10,
            minor: 11,
            patch: 12,
        });

        const decoded = SemanticVersion.fromBytes(version.toBytes());

        expect(decoded.major).to.equal(10);
        expect(decoded.minor).to.equal(11);
        expect(decoded.patch).to.equal(12);
    });

    it("toBytes matches the protobuf encoder output", function () {
        const version = new SemanticVersion({ major: 1, minor: 2, patch: 3 });

        const expected = HieroProto.proto.SemanticVersion.encode({
            major: 1,
            minor: 2,
            patch: 3,
        }).finish();

        expect(version.toBytes()).to.deep.equal(expected);
    });
});
