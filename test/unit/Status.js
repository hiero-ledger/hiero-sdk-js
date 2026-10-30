import * as HieroProto from "@hiero-ledger/proto";
import { Status } from "../../src/exports.js";

describe("Status", function () {
    it("has all the response codes", function () {
        for (const [s, code] of Object.entries(
            HieroProto.proto.ResponseCodeEnum,
        )) {
            expect(Status._fromCode(code).toString()).to.be.equal(s);
        }
    });

    it.each([
        [536, "CONFIG_FILE_PART_UPLOADED"],
        [537, "CLPR_NOT_ENABLED"],
        [538, "INVALID_CLPR_CONFIGURATION"],
        [539, "CLPR_CHAIN_ID_IMMUTABLE"],
        [540, "CLPR_TOO_MANY_SEED_ENDPOINTS"],
        [541, "CLPR_INVALID_SEED_ENDPOINT"],
        [542, "CLPR_CHANNEL_ALREADY_EXISTS"],
        [543, "CLPR_INVALID_SIGNATURE"],
        [544, "CLPR_INVALID_VERIFIER_CONTRACT"],
        [545, "CLPR_VERIFIER_CONFIG_FAILED"],
        [546, "CLPR_COMMITMENT_MISMATCH"],
        [547, "CLPR_CHANNEL_NOT_FOUND"],
        [548, "CLPR_INVALID_CHANNEL_STATUS"],
        [549, "CLPR_MESSAGE_NOT_FOUND"],
        [551, "CLPR_INVALID_ENDPOINT_SIGNATURE"],
        [552, "CLPR_BUNDLE_VERIFICATION_FAILED"],
        [553, "CLPR_RUNNING_HASH_MISMATCH"],
        [554, "CLPR_QUEUE_FULL"],
        [555, "CLPR_CONNECTOR_NOT_FOUND"],
        [556, "CLPR_CONNECTOR_ALREADY_EXISTS"],
        [557, "CLPR_CONNECTOR_UNAUTHORIZED"],
        [558, "CLPR_INVALID_CONNECTOR_ADDRESS"],
        [559, "CLPR_INVALID_CONNECTOR_CONTRACT"],
        [560, "CLPR_INSUFFICIENT_STAKE"],
        [561, "CLPR_PAYLOAD_TOO_LARGE"],
        [562, "CLPR_AUTHORIZATION_FAILED"],
        [564, "CLPR_QUEUE_QUOTA_EXCEEDED"],
        [565, "CLPR_INSUFFICIENT_CONNECTOR_BALANCE"],
        [566, "CLPR_INTERNAL_STATE_CORRUPTION"],
        [567, "CLPR_CONNECTOR_HAS_IN_FLIGHT_MESSAGES"],
        [568, "CLPR_BUNDLE_DECODE_FAILED"],
        [569, "CLPR_EMPTY_BUNDLE"],
        [570, "CLPR_RATE_LIMITED"],
        [571, "CLPR_NO_PROGRESS"],
    ])("round-trips response code %i as %s", function (code, name) {
        const status = Status._fromCode(code);

        expect(status.toString()).to.equal(name);
        expect(status.valueOf()).to.equal(code);
        expect(HieroProto.proto.ResponseCodeEnum[name]).to.equal(code);
    });

    it.each([550, 563])("rejects reserved response code %i", function (code) {
        expect(() => Status._fromCode(code)).to.throw(
            `Status.fromCode() does not handle code: ${code}`,
        );
    });

    it("keeps CLPR authorization failure distinct from generic authorization failure", function () {
        const status = Status._fromCode(562);

        expect(status).not.to.equal(Status.AuthorizationFailed);
        expect(status.toString()).to.equal("CLPR_AUTHORIZATION_FAILED");
        expect(Status.AuthorizationFailed.toString()).to.equal(
            "AUTHORIZATION_FAILED",
        );
    });
});
