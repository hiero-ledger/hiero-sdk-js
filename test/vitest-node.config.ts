import { defineConfig } from "vitest/config";

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: "node",
        include: ["test/unit/**/*.js"],
        exclude: ["test/unit/Mocker.js", "test/unit/browser/*"],
        testTimeout: 120000,
        isolate: false,
        coverage: {
            include: ["src/**/*.js"],
            provider: "istanbul",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/node",
        },
    },
});
