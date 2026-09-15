// SPDX-License-Identifier: Apache-2.0

import { retryOnStatus, untilMirror } from "../../examples/wait-for-mirror.js";

describe("example mirror-node polling", function () {
    it("waits for a stale value to become current", async function () {
        const expected = { balance: 10 };
        const reads = [null, expected];
        let sleeps = 0;

        const result = await untilMirror(async () => reads.shift() ?? null, {
            now: () => 0,
            sleep: async () => {
                sleeps += 1;
            },
        });

        expect(result).to.equal(expected);
        expect(sleeps).to.equal(1);
    });

    it("retries an explicitly allowed missing-account error", async function () {
        const invalidAccountId = {};
        const missingAccount = Object.assign(new Error("INVALID_ACCOUNT_ID"), {
            status: invalidAccountId,
        });
        const expected = { balance: 10 };
        let reads = 0;

        const result = await untilMirror(
            async () => {
                reads += 1;
                if (reads === 1) {
                    throw missingAccount;
                }
                return expected;
            },
            {
                retryError: retryOnStatus(invalidAccountId),
                now: () => 0,
                sleep: async () => {},
            },
        );

        expect(result).to.equal(expected);
        expect(reads).to.equal(2);
    });

    it("does not retry a different status", async function () {
        const invalidAccountId = {};
        const malformedInput = Object.assign(new Error("INVALID_FILE_ID"), {
            status: {},
        });
        let reads = 0;

        await expect(
            untilMirror(
                async () => {
                    reads += 1;
                    throw malformedInput;
                },
                {
                    retryError: retryOnStatus(invalidAccountId),
                    now: () => 0,
                    sleep: async () => {},
                },
            ),
        ).rejects.toBe(malformedInput);
        expect(reads).to.equal(1);
    });

    it("times out when the expected mirror state never arrives", async function () {
        let currentTime = 0;

        await expect(
            untilMirror(async () => null, {
                timeoutMs: 10,
                pollIntervalMs: 10,
                now: () => currentTime,
                sleep: async (milliseconds) => {
                    currentTime += milliseconds;
                },
            }),
        ).rejects.toThrow("mirror node did not ingest in time");
    });

    it("reports the last retryable error when it times out", async function () {
        const missingAccount = Object.assign(new Error("INVALID_ACCOUNT_ID"), {
            status: "INVALID_ACCOUNT_ID",
        });

        await expect(
            untilMirror(
                async () => {
                    throw missingAccount;
                },
                {
                    timeoutMs: 0,
                    retryError: retryOnStatus("INVALID_ACCOUNT_ID"),
                },
            ),
        ).rejects.toThrow("last retryable error: Error: INVALID_ACCOUNT_ID");
    });

    it("propagates genuine errors without retrying", async function () {
        const genuineError = new Error("malformed account ID");
        let reads = 0;

        await expect(
            untilMirror(
                async () => {
                    reads += 1;
                    throw genuineError;
                },
                {
                    retryError: () => false,
                    now: () => 0,
                    sleep: async () => {},
                },
            ),
        ).rejects.toBe(genuineError);
        expect(reads).to.equal(1);
    });

    it("rejects invalid polling limits", async function () {
        await expect(
            untilMirror(async () => null, { timeoutMs: -1 }),
        ).rejects.toThrow("timeoutMs must be a non-negative finite number");
        await expect(
            untilMirror(async () => null, { pollIntervalMs: Infinity }),
        ).rejects.toThrow(
            "pollIntervalMs must be a non-negative finite number",
        );
    });
});
