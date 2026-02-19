import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);
// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/** @type {import("vitest").UserConfig} */
export default defineConfig({
    test: {
        environment: "jsdom",
        watch: false,
        globals: true,
        browser: {
            screenshotFailures: false,
            headless: true,
            provider: playwright(),
            enabled: true,
            instances: [{ browser: "chromium" }],
        },
        include: ["test/integration/**/*.js"],
        exclude: [
            "test/integration/client/*",
            "test/integration/resources/*",
            "test/integration/utils/*",
            "test/integration/contents.js",
            "test/integration/GrpcMetadataIntegrationTest.js",
            "test/integration/TopicMessageQueryTest.js",
            "test/integration/TopicMessageIntegrationTest.js",
            "test/integration/TokenNftsUpdateTransactionIntegrationTest.js",
            "test/integration/ClientIntegrationTest.js",
            "test/integration/dual-mode/**/*.js",
        ],
        hookTimeout: 120000,
        testTimeout: 120000,
        pool: "threads",
        poolOptions: {
            threads: {
                maxThreads: 8,
                minThreads: 8,
            },
        },
        coverage: {
            include: ["src/**/*.js"],
            provider: "istanbul",
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
        "import.meta.env.VITE_GENESIS_OPERATOR_ID": JSON.stringify(
            process.env.GENESIS_OPERATOR_ID || "",
        ),
        "import.meta.env.VITE_GENESIS_OPERATOR_KEY": JSON.stringify(
            process.env.GENESIS_OPERATOR_KEY || "",
        ),
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
            "../client/NodeIntegrationTestEnv.js":
                "../client/WebIntegrationTestEnv.js",
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
