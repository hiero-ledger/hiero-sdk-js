import Long from "long";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import * as sdk from "../../src/index.js";

const ERROR_NAME = "BadEntityIdException";
const SHARD = Long.ZERO;
const REALM = Long.ZERO;
const NUM = Long.fromNumber(123);
// 0.0.123 checksum
const PRESENT_CHECKSUM = "esxsf";
// 0.0.321 checksum
const EXPECTED_CHECKSUM = "uhcxp";
const EXPECTED_ERROR_MESSAGE = `Entity ID ${SHARD.toString()}.${REALM.toString()}.${NUM.toString()}-${PRESENT_CHECKSUM} was incorrect.`;

const badEntityIdErrorBuilder = ({
    shard = SHARD,
    realm = REALM,
    num = NUM,
    presentChecksum = PRESENT_CHECKSUM,
    expectedChecksum = EXPECTED_CHECKSUM,
} = {}) =>
    new BadEntityIdError(shard, realm, num, presentChecksum, expectedChecksum);

describe("BadEntityIdError", function () {
    it("should be an instance of Error", function () {
        const badEntityIdError = badEntityIdErrorBuilder();
        expect(badEntityIdError).toBeInstanceOf(Error);
    });
    it("should be an instance of BadEntityIdError", function () {
        const badEntityIdError = badEntityIdErrorBuilder();
        expect(badEntityIdError).toBeInstanceOf(BadEntityIdError);
    });
    it("should set name to BadEntityIdException", function () {
        const badEntityIdError = badEntityIdErrorBuilder();
        expect(badEntityIdError.name).toBe(ERROR_NAME);
    });
    it("should store all constructor arguments", function () {
        const badEntityIdError = badEntityIdErrorBuilder();
        expect(badEntityIdError).toMatchObject({
            shard: SHARD,
            realm: REALM,
            num: NUM,
            presentChecksum: PRESENT_CHECKSUM,
            expectedChecksum: EXPECTED_CHECKSUM,
        });
    });
    it("should format the error message correctly", function () {
        const badEntityIdError = badEntityIdErrorBuilder();
        expect(badEntityIdError.message).toBe(EXPECTED_ERROR_MESSAGE);
    });
    it("should have a stack trace", function () {
        const badEntityIdError = badEntityIdErrorBuilder();
        expect(badEntityIdError.stack).toEqual(expect.any(String));
        expect(badEntityIdError.stack).toContain(ERROR_NAME);
    });
});

describe("BadEntityIdError export", function () {
    it("should be exported from the SDK entry point as the same class", function () {
        // A missing named export is undefined, so check the export itself first.
        expect(sdk.BadEntityIdError).toBeTypeOf("function");
        expect(sdk.BadEntityIdError).toBe(BadEntityIdError);
    });

    it("should be what validateChecksum throws for a wrong checksum", function () {
        const client = sdk.Client.forTestnet();
        try {
            const expectedChecksum = sdk.AccountId.fromString("0.0.123")
                .toStringWithChecksum(client)
                .split("-")[1];

            let error;
            try {
                sdk.AccountId.fromString("0.0.123-aaaaa").validateChecksum(
                    client,
                );
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(sdk.BadEntityIdError);
            expect(error.presentChecksum).toBe("aaaaa");
            expect(error.expectedChecksum).toBe(expectedChecksum);
        } finally {
            client.close();
        }
    });
});
