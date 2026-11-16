// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../../", import.meta.url);

describe("CLPR live test opt-in", function () {
    it("passes with every CLPR case skipped and a printed reason when CLPR_ENABLED is unset", function () {
        const temp = mkdtempSync(new URL(".clpr-gate-", import.meta.url));
        const report = `${temp}/results.json`;

        try {
            const child = spawnSync(
                process.execPath,
                [
                    "node_modules/vitest/vitest.mjs",
                    "run",
                    "--config=test/vitest-node-integration.config.ts",
                    "test/integration/ClprIntegrationTest.js",
                    "--reporter=default",
                    "--reporter=json",
                    `--outputFile=${report}`,
                ],
                {
                    cwd: fileURLToPath(root),
                    env: { ...process.env, CLPR_ENABLED: "" },
                    encoding: "utf8",
                    timeout: 30_000,
                },
            );
            const output = `${child.stdout}\n${child.stderr}`;
            expect(child.error, output).toBeUndefined();
            expect(child.status, output).toBe(0);
            expect(output).toMatch(/Skipping CLPR[\s\S]*CLPR_ENABLED/);

            const results = JSON.parse(readFileSync(report, "utf8"));
            expect(results.numTotalTests).toBeGreaterThan(0);
            expect(results.numPassedTests).toBe(0);
            expect(results.numFailedTests).toBe(0);
            expect(results.numPendingTests).toBe(results.numTotalTests);
            const names = results.testResults.flatMap((suite) =>
                suite.assertionResults.map((test) => test.fullName),
            );
            expect(names).toEqual(
                expect.arrayContaining([
                    expect.stringContaining(
                        "Channel lifecycle: register, complete, close",
                    ),
                    expect.stringContaining(
                        "Connector lifecycle: register, complete, deregister",
                    ),
                    expect.stringContaining(
                        "rejects a CLPR transaction in an atomic batch by default",
                    ),
                ]),
            );
        } finally {
            rmSync(temp, { recursive: true, force: true });
        }
    });

    it("documents true, false and unset CLPR_ENABLED modes in env.example", function () {
        const sample = readFileSync(new URL("env.example", root), "utf8");

        expect(
            sample.includes("CLPR_ENABLED"),
            "CLPR_ENABLED is documented",
        ).toBe(true);
        expect(
            /CLPR_ENABLED=true/.test(sample),
            "enabled mode is documented",
        ).toBe(true);
        expect(
            /CLPR_ENABLED=false/.test(sample),
            "disabled mode is documented",
        ).toBe(true);
        expect(
            /unset[\s\S]*skip|skip[\s\S]*unset/i.test(sample),
            "unset mode skips",
        ).toBe(true);
    });
});
