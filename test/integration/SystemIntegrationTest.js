import {
    ContractId,
    FileId,
    Status,
    SystemDeleteTransaction,
    SystemUndeleteTransaction,
    Timestamp,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

/**
 * System delete and system undelete are privileged: by default only accounts
 * 2-59 (delete) and 2-60 (undelete) may submit them, so the ordinary test
 * operator is rejected before the network ever looks at the entity. The
 * contract form is additionally unsupported — the protobufs document it as
 * never implemented, returning `INVALID_FILE_ID` or `MISSING_ENTITY_ID`.
 *
 * These tests therefore assert *rejection*, and accept any of the statuses the
 * network may legitimately answer with, rather than passing on any error at all.
 */
const EXPECTED_REJECTIONS = [
    Status.AuthorizationFailed,
    Status.EntityNotAllowedToDelete,
    Status.InvalidFileId,
    Status.NotSupported,
    Status.Unauthorized,
];

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isExpectedRejection(error) {
    const text = String(error);
    return EXPECTED_REJECTIONS.some((status) => text.includes(String(status)));
}

/**
 * `Timestamp.generate()` subtracts 3-8s of jitter, so it is always in the past
 * and unusable as a new expiry.
 */
function futureExpiration() {
    return Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
}

describe("SystemIntegration", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should reject a file system delete from an unprivileged operator", async function () {
        let observed;

        try {
            await (
                await new SystemDeleteTransaction()
                    .setFileId(new FileId(10))
                    .setExpirationTime(futureExpiration())
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            observed = error;
        }

        if (observed == null || !isExpectedRejection(observed)) {
            throw new Error(
                `expected the file system delete to be rejected with one of ${EXPECTED_REJECTIONS.join(
                    ", ",
                )}, got: ${observed == null ? "no error" : String(observed)}`,
            );
        }
    });

    it("should reject a contract system delete, which the network never implemented", async function () {
        let observed;

        try {
            await (
                await new SystemDeleteTransaction()
                    .setContractId(new ContractId(10))
                    .setExpirationTime(futureExpiration())
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            observed = error;
        }

        if (observed == null || !isExpectedRejection(observed)) {
            throw new Error(
                `expected the contract system delete to be rejected with one of ${EXPECTED_REJECTIONS.join(
                    ", ",
                )}, got: ${observed == null ? "no error" : String(observed)}`,
            );
        }
    });

    it("should reject a file system undelete from an unprivileged operator", async function () {
        let observed;

        try {
            await (
                await new SystemUndeleteTransaction()
                    .setFileId(new FileId(10))
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            observed = error;
        }

        if (observed == null || !isExpectedRejection(observed)) {
            throw new Error(
                `expected the file system undelete to be rejected with one of ${EXPECTED_REJECTIONS.join(
                    ", ",
                )}, got: ${observed == null ? "no error" : String(observed)}`,
            );
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
