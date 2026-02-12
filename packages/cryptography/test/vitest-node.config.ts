import { defineConfig } from "vitest/config";

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: "node",
        pool: "threads",
        poolOptions: {
            threads: {
                maxThreads: 8,
                minThreads: 8,
            },
        },
        include: ["test/unit/**/*.js"],
        exclude: [
            "test/unit/keystore.js",
            "test/unit/primitive/aes.browser.js",
        ],
        testTimeout: 8000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.js"],
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
});
