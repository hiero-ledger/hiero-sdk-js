import * as HieroProto from "@hiero-ledger/proto";
import { RequestType } from "../../src/exports.js";

describe("RequestType", function () {
    it("has all the response codes", function () {
        for (const [s, code] of Object.entries(
            HieroProto.proto.HederaFunctionality,
        )) {
            expect(RequestType._fromCode(code).toString()).to.be.equal(s);
        }
    });

    it.each([
        [117, "ClprUpdateLedgerConfiguration"],
        [118, "ClprRegisterChannel"],
        [119, "ClprCompleteChannel"],
        [120, "ClprCloseChannel"],
        [121, "ClprGetLedgerConfiguration"],
        [122, "ClprSubmitBundle"],
        [124, "ClprRegisterConnector"],
        [125, "ClprDeregisterConnector"],
        [126, "ClprCompleteConnector"],
        [127, "ClprEndpointPublication"],
        [128, "ClprGetEndpointManifest"],
        [129, "ClprMaintenance"],
    ])("round-trips functionality code %i as %s", function (code, name) {
        const requestType = RequestType._fromCode(code);

        expect(requestType.toString()).to.equal(name);
        expect(requestType.valueOf()).to.equal(code);
        expect(HieroProto.proto.HederaFunctionality[name]).to.equal(code);
    });

    it("rejects reserved functionality code 123", function () {
        expect(() => RequestType._fromCode(123)).to.throw(
            "RequestType.fromCode() does not handle code: 123",
        );
    });
});
