// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";

describe("CLPR TCK test isolation", function () {
    it.each([
        ["test/vitest-node.config.ts", []],
        ["test/vitest-tck.config.ts", ["test/unit/node/ClprTckAdapter.js"]],
    ])(
        "collects only the intended adapter files using %s",
        function (config, expected) {
            const root = fileURLToPath(new URL("../../../", import.meta.url));
            const child = spawnSync(
                process.execPath,
                [
                    "node_modules/vitest/vitest.mjs",
                    "list",
                    "test/unit/node/ClprTckAdapter.js",
                    `--config=${config}`,
                    "--filesOnly",
                    "--json",
                ],
                { cwd: root, encoding: "utf8", timeout: 30_000 },
            );
            expect(child.error).toBeUndefined();
            expect(child.status, child.stderr).toBe(0);
            const files = JSON.parse(child.stdout).map(({ file }) =>
                relative(root, file),
            );
            expect(files).toEqual(expected);
        },
    );
});
