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
            // projectRoot makes lcov paths relative to the repository root so
            // Codecov attributes coverage to packages/cryptography/src/ instead of
            // clashing with SDK files of the same name in src/.
            reporter: ["text-summary", ["lcov", { projectRoot: "../.." }]],
            reportsDirectory: "./coverage/browser",
        },
    },
});
