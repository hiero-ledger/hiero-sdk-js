import { defineConfig } from "vitest/config";

import path from "path";
import fs from "fs";
import CustomSequencer from "./custom-sequencer.js";

const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        sequence: {
            sequencer: CustomSequencer,
        },
        isolate: false,
        watch: false,
        globals: true,
        environment: "node",
        // Cap parallelism to avoid THROTTLED_AT_CONSENSUS from the shared
        // operator account hitting per-payer throttle buckets. Raise this as
        // network throttles allow.
        pool: "forks",
        poolOptions: {
            forks: { minForks: 1, maxForks: 4 },
        },
        fileParallelism: true,
        include: ["test/integration/**/*.js"],
        exclude: [
            "test/integration/client/*",
            "test/integration/resources/*",
            "test/integration/utils/*",
            "test/integration/contents.js",
            "test/integration/dual-mode/**/*.js",
        ],
        hookTimeout: 120000,
        testTimeout: 120000,
        coverage: {
            include: ["src/**/*.js"],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/node-integration",
        },
    },
    define: {
        __SDK_VERSION__: JSON.stringify(pkg.version),
    },
});
