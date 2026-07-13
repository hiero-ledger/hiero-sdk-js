import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        pool: "threads",
        isolate: false,
        browser: {
            headless: true,
            provider: playwright(),
            enabled: true,
            instances: [{ browser: "chromium" }],
        },
        include: ["test/unit/**/*.js"],
        exclude: ["test/unit/keystore.js"],
        coverage: {
            provider: "istanbul",
            include: ["src/**/*.js"],
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/browser",
        },
    },
});
