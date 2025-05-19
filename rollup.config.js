import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";

// Read package.json version
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
    readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"),
);

const browserAliases = {
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
        {
            find: "../../src/network/AddressBookQuery.js",
            replacement: "../../src/network/AddressBookQueryWeb.js",
        },
        {
            find: "../network/AddressBookQuery.js",
            replacement: "../network/AddressBookQueryWeb.js",
        },
        // Add the index.js redirects
        { find: "../../src/index.js", replacement: "../../src/browser.js" },
        { find: "../src/index.js", replacement: "../src/browser.js" },
    ],
};

const nativeAliases = {
    entries: [
        { find: "../src/index.js", replacement: "../src/native.js" },
        {
            find: "../src/encoding/hex.js",
            replacement: "../src/encoding/hex.native.js",
        },
        {
            find: "../src/encoding/utf8.js",
            replacement: "../src/encoding/utf8.native.js",
        },
        {
            find: "../src/cryptography/sha384.js",
            replacement: "../src/cryptography/sha384.native.js",
        },
    ],
};

export default [
    {
        input: "src/browser.js",
        plugins: [
            alias(browserAliases),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            terser(),
        ],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
        },
    },
    {
        input: "src/native.js",
        plugins: [
            terser(),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            alias(nativeAliases),
        ],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
        },
    },
    {
        input: "src/index.js",
        plugins: [
            terser(),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
        ],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
        },
    },
    {
        input: "src/browser.js",
        plugins: [
            alias(browserAliases),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs({
                transformMixedEsModules: true,
            }),
            json(),
        ],
        output: {
            file: "dist/umd.js",
            format: "umd",
            name: "sdk",
            sourceMap: true,
        },
        context: "window",
    },
    {
        input: "src/browser.js",
        plugins: [
            alias(browserAliases),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs({
                transformMixedEsModules: true,
            }),
            json(),
            terser(),
        ],
        output: {
            format: "umd",
            name: "sdk",
            sourceMap: true,
            file: "dist/umd.min.js",
        },
        context: "window",
    },
];
