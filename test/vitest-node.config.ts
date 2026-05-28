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
            exclude: [
                "src/client/addressbooks/mainnet.js",
                "src/client/addressbooks/previewnet.js",
                "src/client/addressbooks/testnet.js",
            ],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/node",
        },
    },
});
