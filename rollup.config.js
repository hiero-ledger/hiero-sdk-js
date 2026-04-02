import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";

/**
 * Rollup plugin that resolves .js imports to .ts files when the .js file
 * doesn't exist. This enables incremental JSDoc-to-TypeScript migration.
 */
function resolveTypescriptExtensions() {
    return {
        name: "resolve-typescript-extensions",
        resolveId(source, importer) {
            if (!source.endsWith(".js") || !importer) return null;
            const resolved = path.resolve(path.dirname(importer), source);
            if (existsSync(resolved)) return null;
            const tsPath = resolved.replace(/\.js$/, ".ts");
            if (existsSync(tsPath)) return tsPath;
            return null;
        },
    };
}

/**
 * Shared babel plugin config for stripping TypeScript syntax in rollup builds.
 * Uses babelrc: false to avoid picking up the CJS-specific .babelrc.json config.
 */
const babelPlugin = babel({
    babelHelpers: "bundled",
    extensions: [".js", ".ts"],
    babelrc: false,
    configFile: false,
    presets: ["@babel/preset-typescript"],
});

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
        {
            find: "../../src/network/AddressBookQuery.js",
            replacement: "../../src/network/AddressBookQueryWeb.js",
        },
        {
            find: "../network/AddressBookQuery.js",
            replacement: "../network/AddressBookQueryWeb.js",
        },
    ],
};

export default [
    {
        input: "src/browser.js",
        plugins: [
            resolveTypescriptExtensions(),
            alias(browserAliases),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            babelPlugin,
            terser(terserOptions),
        ],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
            entryFileNames: "[name].js",
        },
    },
    {
        input: "src/native.js",
        plugins: [
            resolveTypescriptExtensions(),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            alias(nativeAliases),
            babelPlugin,
            terser(terserOptions),
        ],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
            entryFileNames: "[name].js",
        },
    },
    {
        input: "src/index.js",
        plugins: [
            resolveTypescriptExtensions(),
            json(),
            replace({
                preventAssignment: true,
                __SDK_VERSION__: JSON.stringify(pkg.version),
            }),
            babelPlugin,
            terser(terserOptions),
        ],
        output: {
            dir: "lib/",
            format: "esm",
            sourcemap: true,
            preserveModules: true,
            entryFileNames: "[name].js",
        },
    },
    {
        input: "src/browser.js",
        plugins: [
            resolveTypescriptExtensions(),
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
            babelPlugin,
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
            resolveTypescriptExtensions(),
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
            babelPlugin,
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
