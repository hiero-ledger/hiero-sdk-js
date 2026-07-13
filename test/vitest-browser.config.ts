import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { browserEncodingAlias } from "./browser-encoding-alias.js";

export default defineConfig({
    plugins: [browserEncodingAlias()],
    test: {
        watch: false,
        globals: true,
        isolate: false,
        environment: "jsdom",
        browser: {
            screenshotFailures: false,
            headless: true,
            provider: playwright(),
            enabled: true,
            instances: [{ browser: "chromium" }],
        },
        include: ["test/unit/**/*.js"],
        exclude: [
            "test/unit/Mocker.js",
            "test/unit/browser/utils/*",
            "test/unit/node/*",
        ],
        testTimeout: 120000,
        retry: 1,
        coverage: {
            include: ["src/**/*.js"],
            exclude: [
                "src/client/addressbooks/mainnet.js",
                "src/client/addressbooks/previewnet.js",
                "src/client/addressbooks/testnet.js",
            ],
            provider: "v8",
            reporter: ["text-summary", "lcov"],
            reportsDirectory: "./coverage/browser",
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
            // Note: the bare `./encoding/hex.js` / `../encoding/utf8.js` / `./hex.js`
            // forms are handled by the browserEncodingAlias() plugin so they don't
            // leak into the isomorphic @hiero-ledger/cryptography package.
            "../../../src/encoding/hex.js":
                "../../../src/encoding/hex.browser.js",
            "../../src/encoding/hex.js": "../../src/encoding/hex.browser.js",
            "../src/encoding/hex.js": "../src/encoding/hex.browser.js",
            "src/encoding/hex.js": "src/encoding/hex.browser.js",
            "../src/encoding/utf8.js": "../src/encoding/utf8.browser.js",
            "../../src/encoding/utf8.js": "../../src/encoding/utf8.browser.js",
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
