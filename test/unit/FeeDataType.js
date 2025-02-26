import * as HieroProto from "@hashgraph/proto";
import { FeeDataType } from "../../src/exports.js";

describe("FeeDataType", function () {
    it("has all variants", function () {
        for (const [s, code] of Object.entries(HieroProto.proto.SubType)) {
            expect(FeeDataType._fromCode(code).toString()).to.be.equal(s);
        }
    });
});
