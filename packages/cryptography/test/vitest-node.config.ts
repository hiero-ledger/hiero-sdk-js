import { defineConfig } from "vitest/config";

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: "node",
        pool: "threads",
        isolate: false,
        include: ["test/unit/**/*.js"],
        // Not a test file: a shared keystore fixture that `include` would
        // otherwise pick up and fail on for having no suite.
        exclude: ["test/unit/keystore.js"],
        // The keystore round-trip runs three 262144-iteration PBKDF2 derivations
        // through pure-JS @noble/hashes, which is ~10x slower than the native
        // crypto.pbkdf2 this budget was originally set for.
        testTimeout: 30000,
        coverage: {
            // Not "v8": its process-wide block coverage instruments @noble/hashes'
            // sha256 loop in node_modules, making PBKDF2 ~9x slower. Istanbul only
            // instruments `include` below, so Noble runs at full speed. Matches
            // vitest-browser.config.ts.
            provider: "istanbul",
            include: ["src/**/*.js"],
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/node",
        },
    },
});
