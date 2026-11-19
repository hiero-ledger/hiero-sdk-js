import * as HieroProto from "@hiero-ledger/proto";
import { FeeDataType } from "../../src/exports.js";

describe("FeeDataType", function () {
    it("has all variants", function () {
        for (const [s, code] of Object.entries(HieroProto.proto.SubType)) {
            expect(FeeDataType._fromCode(code).toString()).to.be.equal(s);
        }
    });

    it("throws for an unknown code", function () {
        expect(() => FeeDataType._fromCode(99)).to.throw(
            "(BUG) SubType.fromCode() does not handle code: 99",
        );
    });

    it("returns UNKNOWN (code) for a non-static instance", function () {
        expect(new FeeDataType(99).toString()).to.equal("UNKNOWN (99)");
    });
});
