import terser from "@rollup/plugin-terser";
import alias from "@rollup/plugin-alias";

const aliases = {
    entries: [
        {
            find: "../src/encoding/hex.js",
            replacement: "../src/encoding/hex.browser.js",
        },
        {
            find: "../../src/encoding/hex.js",
            replacement: "../../src/encoding/hex.browser.js",
        },
        {
            find: "../../../src/encoding/hex.js",
            replacement: "../../../src/encoding/hex.browser.js",
        },
        {
            find: "src/encoding/hex.js",
            replacement: "src/encoding/hex.browser.js",
        },
        {
            find: "../encoding/hex.js",
            replacement: "../encoding/hex.browser.js",
        },
        { find: "./encoding/hex.js", replacement: "./encoding/hex.browser.js" },
        {
            find: "../src/encoding/utf8.js",
            replacement: "../src/encoding/utf8.browser.js",
        },
        {
            find: "../../src/encoding/utf8.js",
            replacement: "../../src/encoding/utf8.browser.js",
        },
        {
            find: "../encoding/utf8.js",
            replacement: "../encoding/utf8.browser.js",
        },
        {
            find: "../src/cryptography/sha384.js",
            replacement: "../src/cryptography/sha384.browser.js",
        },
        {
            find: "../cryptography/sha384.js",
            replacement: "../cryptography/sha384.browser.js",
        },
        {
            find: "./client/NodeIntegrationTestEnv.js",
            replacement: "./client/WebIntegrationTestEnv.js",
        },
        {
            find: "../integration/client/NodeIntegrationTestEnv.js",
            replacement: "../integration/client/WebIntegrationTestEnv.js",
        },
        {
            find: "../../src/client/NodeClient.js",
            replacement: "../../src/client/WebClient.js",
        },
        // Add the index.js redirects
        { find: "../../src/index.js", replacement: "../../src/browser.js" },
        { find: "../src/index.js", replacement: "../src/browser.js" },
    ],
};

export default [
    {
        input: "src/index.js",
        plugins: [alias(aliases), terser()],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
        },
    },
    {
        input: "src/browser.js",
        plugins: [alias(aliases), terser()],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
        },
    },
    {
        input: "src/native.js",
        plugins: [alias(aliases), terser()],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
        },
    },
];
