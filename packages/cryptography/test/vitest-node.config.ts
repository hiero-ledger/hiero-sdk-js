import { defineConfig } from "vitest/config";

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: "node",
        include: ["test/unit/**/*.js"],
        exclude: ["test/unit/keystore.js"],
        testTimeout: 8000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.js"],
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
});
