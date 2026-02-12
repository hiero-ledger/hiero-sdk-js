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
        exclude: ["test/unit/Mocker.js", "test/unit/browser/*"],
        testTimeout: 120000,
        coverage: {
            include: ["src/**/*.js"],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
});
