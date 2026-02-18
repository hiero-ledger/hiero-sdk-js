import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        browser: {
            screenshotFailures: false,
            headless: true,
            provider: playwright(),
            enabled: true,
            instances: [{ browser: "chromium" }],
            isolate: false,
        },
        include: ["test/unit/**/*.js"],
        exclude: [
            "test/unit/Mocker.js",
            "test/unit/browser/utils/*",
            "test/unit/node/*",
        ],
        testTimeout: 120000,
        retry: 1,
        pool: "threads",
        poolOptions: {
            threads: {
                maxThreads: 8,
                minThreads: 8,
            },
        },
        fileParallelism: false,
        coverage: {
            include: ["src/**/*.js"],
            provider: "istanbul",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
    resolve: {
        alias: {
            // redirect src/ to src/browser
            // note that this is NOT needed when consuming this package as the browser field in package.json
            // will take care of this
            "../../src/index.js": "../../src/browser.js",
            "../src/index.js": "../src/browser.js",
            // Redirect proto package to use ESM version in browser mode
            "@hiero-ledger/proto": "/packages/proto/src/index.js",
            // TODO: extract `encoding/hex.js` etc into a variable and call a function to generate
            // all the prefixes.
            "../../../src/encoding/hex.js":
                "../../../src/encoding/hex.browser.js",
            "../../src/encoding/hex.js": "../../src/encoding/hex.browser.js",
            "../src/encoding/hex.js": "../src/encoding/hex.browser.js",
            "src/encoding/hex.js": "src/encoding/hex.browser.js",
            "../encoding/hex.js": "../encoding/hex.browser.js",
            "./encoding/hex.js": "./encoding/hex.browser.js",
            "../src/encoding/utf8.js": "../src/encoding/utf8.browser.js",
            "../../src/encoding/utf8.js": "../../src/encoding/utf8.browser.js",
            "../encoding/utf8.js": "../encoding/utf8.browser.js",
            "../src/cryptography/sha384.js":
                "../src/cryptography/sha384.browser.js",
            "../cryptography/sha384.js": "../cryptography/sha384.browser.js",
            "./client/NodeIntegrationTestEnv.js":
                "./client/WebIntegrationTestEnv.js",
            "../integration/client/NodeIntegrationTestEnv.js":
                "../integration/client/WebIntegrationTestEnv.js",
            "../../src/client/NodeClient.js": "../../src/client/WebClient.js",
        },
    },
});
