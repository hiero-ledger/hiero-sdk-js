import { defineConfig } from "vitest/config";

import path from "path";
import fs from "fs";

const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        environment: "jsdom",
        watch: false,
        globals: true,

        browser: {
            screenshotFailures: false,
            headless: true,
            provider: "playwright",
            enabled: true,
            instances: [{ browser: "chromium" }],
        },
        include: ["test/integration/dual-mode/**/*.js"],
        exclude: [
            "test/integration/client/*",
            "test/integration/resources/*",
            "test/integration/utils/*",
            "test/integration/dual-mode/NodeConstants.js",
            "test/integration/dual-mode/WebConstants.js",
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
    define: {
        __SDK_VERSION__: JSON.stringify(pkg.version),
        "import.meta.env.VITE_OPERATOR_ID": JSON.stringify(
            process.env.OPERATOR_ID || "",
        ),
        "import.meta.env.VITE_OPERATOR_KEY": JSON.stringify(
            process.env.OPERATOR_KEY || "",
        ),
        "import.meta.env.VITE_HEDERA_NETWORK": JSON.stringify(
            process.env.HEDERA_NETWORK || "",
        ),
    },
    resolve: {
        alias: {
            // redirect src/ to src/browser
            // note that this is NOT needed when consuming this package as the browser field in package.json
            // will take care of this
            "../../src/index.js": "../../src/browser.js",
            "../src/index.js": "../src/browser.js",
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
            "../../../src/client/NodeClient.js":
                "../../../src/client/WebClient.js",
            "./client/NodeClient.js": "./client/WebClient.js",
            "../../../src/LocalProvider.js": "../../../src/LocalProviderWeb.js",
            "../../src/LocalProvider.js": "../../src/LocalProviderWeb.js",
            "../src/LocalProvider.js": "../src/LocalProviderWeb.js",
            "src/LocalProvider.js": "src/LocalProviderWeb.js",
            "./NodeConstants.js": "./WebConstants.js",
            // Add more comprehensive aliases for NodeIntegrationTestEnv
            "NodeIntegrationTestEnv.js": "WebIntegrationTestEnv.js",
            "./client/NodeIntegrationTestEnv": "./client/WebIntegrationTestEnv",
            "../client/NodeIntegrationTestEnv":
                "../client/WebIntegrationTestEnv",
            "../../client/NodeIntegrationTestEnv":
                "../../client/WebIntegrationTestEnv",
            "../../../src/client/NodeIntegrationTestEnv":
                "../../../src/client/WebIntegrationTestEnv",
            // Add aliases for NodeClient
            "NodeClient.js": "WebClient.js",
        },
    },
});
