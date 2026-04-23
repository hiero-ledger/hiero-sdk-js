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
                "src/transaction/SignatureMapLegacy.js",
                "src/transaction/NodeAccountIdSignatureMapLegacy.js",
                "src/system/SystemDeleteTransaction.js",
                "src/system/SystemUndeleteTransaction.js",
                "src/contract/ContractCreateFlow.js",
            ],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/node",
        },
    },
});
