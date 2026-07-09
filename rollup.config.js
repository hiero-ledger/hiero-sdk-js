import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";

// Terser options for Windows compatibility
// Windows has issues with worker threads in some environments
const terserOptions = {
    maxWorkers: process.platform === "win32" ? 1 : undefined,
};

// Read package.json version
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
    readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"),
);

// Alias replacements must be absolute paths. @rollup/plugin-commonjs (used in
// the UMD/dist builds) resolves a relative replacement against the CWD instead
// of the importing module and fails with ENOENT; absolute paths also dedupe the
// substituted module instead of duplicating it. The many `find` variants stay
// relative — they match the import specifier as written from varying depths.
const abs = (p) => path.resolve(__dirname, p);

/**
 * `@rollup/plugin-alias` matches on the import specifier alone, ignoring the
 * importer. The `@hiero-ledger/cryptography` package imports its own encoding
 * modules through the exact same relative specifiers the SDK uses
 * (`../encoding/hex.js`, `./hex.js`, ...), so the browser aliases below would
 * silently swap the SDK's copies into that package. It is isomorphic
 * (Noble/Scure) and has no `*.browser.js` variants, so its modules must be left
 * alone.
 *
 * Resolving them here, ahead of `alias()`, short-circuits the rewrite: the
 * first plugin to return a non-null id wins. Mirrors the vite plugin in
 * `test/browser-encoding-alias.js`.
 * @returns {import("rollup").Plugin}
 */
const keepCryptographyEncoding = () => ({
    name: "keep-cryptography-encoding",
    resolveId(source, importer) {
        if (importer == null || !source.startsWith(".")) return null;
        if (!/packages[\\/]cryptography/.test(importer)) return null;
        if (!/(^|\/)(encoding\/)?(hex|utf8)\.js$/.test(source)) return null;

        return path.resolve(path.dirname(importer), source);
    },
});

const browserAliases = {
    entries: [
        {
            find: "../src/encoding/hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            find: "../../src/encoding/hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            find: "../../../src/encoding/hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            find: "src/encoding/hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            find: "../encoding/hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            find: "./encoding/hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            // sibling import from within src/encoding (rlpNumber.js); without
            // this the browser bundle pulls in the Buffer-backed hex module
            find: "./hex.js",
            replacement: abs("src/encoding/hex.browser.js"),
        },
        {
            find: "../src/encoding/utf8.js",
            replacement: abs("src/encoding/utf8.browser.js"),
        },
        {
            find: "../../src/encoding/utf8.js",
            replacement: abs("src/encoding/utf8.browser.js"),
        },
        {
            find: "../encoding/utf8.js",
            replacement: abs("src/encoding/utf8.browser.js"),
        },
        {
            find: "../src/cryptography/sha384.js",
            replacement: abs("src/cryptography/sha384.browser.js"),
        },
        {
            find: "../cryptography/sha384.js",
            replacement: abs("src/cryptography/sha384.browser.js"),
        },
        {
            find: "./client/NodeIntegrationTestEnv.js",
            replacement: abs(
                "test/integration/client/WebIntegrationTestEnv.js",
            ),
        },
        {
            find: "../integration/client/NodeIntegrationTestEnv.js",
            replacement: abs(
                "test/integration/client/WebIntegrationTestEnv.js",
            ),
        },
        {
            find: "../../src/client/NodeClient.js",
            replacement: abs("src/client/WebClient.js"),
        },
        {
            find: "../../src/network/AddressBookQuery.js",
            replacement: abs("src/network/AddressBookQueryWeb.js"),
        },
        {
            find: "../network/AddressBookQuery.js",
            replacement: abs("src/network/AddressBookQueryWeb.js"),
        },
        // Add the index.js redirects
        { find: "../../src/index.js", replacement: abs("src/browser.js") },
        { find: "../src/index.js", replacement: abs("src/browser.js") },
    ],
};

const nativeAliases = {
    entries: [
        { find: "../src/index.js", replacement: abs("src/native.js") },
        {
            find: "../src/encoding/hex.js",
            replacement: abs("src/encoding/hex.native.js"),
        },
        {
            find: "../src/encoding/utf8.js",
            replacement: abs("src/encoding/utf8.native.js"),
        },
        {
            find: "../src/cryptography/sha384.js",
            replacement: abs("src/cryptography/sha384.native.js"),
        },
        {
            find: "../../src/network/AddressBookQuery.js",
            replacement: abs("src/network/AddressBookQueryWeb.js"),
        },
        {
            find: "../network/AddressBookQuery.js",
            replacement: abs("src/network/AddressBookQueryWeb.js"),
        },
    ],
};

export default [
    {
        input: "src/browser.js",
        plugins: [
            keepCryptographyEncoding(),
            alias(browserAliases),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            terser(terserOptions),
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
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            alias(nativeAliases),
            terser(terserOptions),
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
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            terser(terserOptions),
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
            keepCryptographyEncoding(),
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
            sourcemap: true,
        },
        context: "window",
    },
    {
        input: "src/browser.js",
        plugins: [
            keepCryptographyEncoding(),
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
            terser(terserOptions),
        ],
        output: {
            format: "umd",
            name: "sdk",
            sourcemap: true,
            file: "dist/umd.min.js",
        },
        context: "window",
    },
];
