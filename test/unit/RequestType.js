import * as HieroProto from "@hashgraph/proto";
import { RequestType } from "../../src/exports.js";

describe("RequestType", function () {
    it("has all the response codes", function () {
        for (const [s, code] of Object.entries(
            HieroProto.proto.HederaFunctionality,
        )) {
            expect(RequestType._fromCode(code).toString()).to.be.equal(s);
        }
    });
});
