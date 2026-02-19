import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        pool: "threads",
        poolOptions: {
            threads: {
                maxThreads: 8,
                minThreads: 8,
            },
        },
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
            reportsDirectory: "./coverage",
        },
    },
    resolve: {
        alias: {
            "../../../src/primitive/aes.js":
                "../../../src/primitive/aes.browser.js",
            "../../../src/encoding/base64.js":
                "../../../src/encoding/base64.browser.js",
            "../../../src/encoding/hex.js":
                "../../../src/encoding/hex.browser.js",
            "../../../src/primitive/hmac.js":
                "../../../src/primitive/hmac.browser.js",
            "../../../src/primitive/pbkdf2.js":
                "../../../src/primitive/pbkdf2.browser.js",
            "../../../src/primitive/sha256.js":
                "../../../src/primitive/sha256.browser.js",
            "../../../src/encoding/utf8.js":
                "../../../src/encoding/utf8.browser.js",
            "../../src/primitive/aes.js": "../../src/primitive/aes.browser.js",
            "../../src/encoding/base64.js":
                "../../src/encoding/base64.browser.js",
            "../../src/encoding/hex.js": "../../src/encoding/hex.browser.js",
            "../../src/primitive/hmac.js":
                "../../src/primitive/hmac.browser.js",
            "../../src/primitive/pbkdf2.js":
                "../../src/primitive/pbkdf2.browser.js",
            "../../src/primitive/sha256.js":
                "../../src/primitive/sha256.browser.js",
            "../../src/encoding/utf8.js": "../../src/encoding/utf8.browser.js",
            "../src/primitive/aes.js": "../src/primitive/aes.browser.js",
            "../src/encoding/base64.js": "../src/encoding/base64.browser.js",
            "../src/encoding/hex.js": "../src/encoding/hex.browser.js",
            "../src/primitive/hmac.js": "../src/primitive/hmac.browser.js",
            "../src/primitive/pbkdf2.js": "../src/primitive/pbkdf2.browser.js",
            "../src/primitive/sha256.js": "../src/primitive/sha256.browser.js",
            "../src/encoding/utf8.js": "../src/encoding/utf8.browser.js",
            "./src/primitive/aes.js": "./src/primitive/aes.browser.js",
            "./src/encoding/base64.js": "./src/encoding/base64.browser.js",
            "./src/encoding/hex.js": "./src/encoding/hex.browser.js",
            "./src/primitive/hmac.js": "./src/primitive/hmac.browser.js",
            "./src/primitive/pbkdf2.js": "./src/primitive/pbkdf2.browser.js",
            "./src/primitive/sha256.js": "./src/primitive/sha256.browser.js",
            "./src/encoding/utf8.js": "./src/encoding/utf8.browser.js",
            "./primitive/aes.js": "./primitive/aes.browser.js",
            "./encoding/base64.js": "./encoding/base64.browser.js",
            "./encoding/hex.js": "./encoding/hex.browser.js",
            "./primitive/hmac.js": "./primitive/hmac.browser.js",
            "./primitive/pbkdf2.js": "./primitive/pbkdf2.browser.js",
            "./primitive/sha256.js": "./primitive/sha256.browser.js",
            "./encoding/utf8.js": "./encoding/utf8.browser.js",
            "../primitive/aes.js": "../primitive/aes.browser.js",
            "../encoding/base64.js": "../encoding/base64.browser.js",
            "../encoding/hex.js": "../encoding/hex.browser.js",
            "../primitive/hmac.js": "../primitive/hmac.browser.js",
            "../primitive/pbkdf2.js": "../primitive/pbkdf2.browser.js",
            "../primitive/sha256.js": "../primitive/sha256.browser.js",
            "../encoding/utf8.js": "../encoding/utf8.browser.js",
            "./aes.js": "./aes.browser.js",
            "./base64.js": "./base64.browser.js",
            "./hex.js": "./hex.browser.js",
            "./hmac.js": "./hmac.browser.js",
            "./pbkdf2.js": "./pbkdf2.browser.js",
            "./sha256.js": "./sha256.browser.js",
            "./utf8.js": "./utf8.browser.js",
        },
    },
});
