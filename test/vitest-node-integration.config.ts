import { defineConfig } from "vitest/config";

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
        ],
        hookTimeout: 120000,
        testTimeout: 120000,
        coverage: {
            include: ["src/**/*.js"],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
});
