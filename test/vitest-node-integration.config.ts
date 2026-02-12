import { defineConfig } from "vitest/config";

import path from "path";
import fs from "fs";

const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: "node",
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
        pool: "threads",
        poolOptions: {
            threads: {
                maxThreads: 8,
                minThreads: 8,
            },
        },
        coverage: {
            include: ["src/**/*.js"],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
    define: {
        __SDK_VERSION__: JSON.stringify(pkg.version),
    },
});
