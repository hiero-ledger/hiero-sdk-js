// SPDX-License-Identifier: Apache-2.0

/**
 * Redirects the SDK's Node encoding modules to their browser variants when
 * running the browser test suites.
 *
 * This can't be a plain `resolve.alias` entry: the SDK's own files and the
 * `@hiero-ledger/cryptography` package both import `./encoding/hex.js` etc. via
 * the exact same relative specifier, and a string alias can't tell them apart.
 * The cryptography package is isomorphic (Noble/Scure) and has no `*.browser.js`
 * variants, so redirecting its imports would resolve to files that don't exist.
 * A plugin can inspect the importer and skip the cryptography package.
 *
 * @returns {import("vite").Plugin}
 */
export function browserEncodingAlias() {
    const map = {
        "./encoding/hex.js": "./encoding/hex.browser.js",
        "../encoding/hex.js": "../encoding/hex.browser.js",
        "../encoding/utf8.js": "../encoding/utf8.browser.js",
        // sibling import from within src/encoding (e.g. rlpNumber.js)
        "./hex.js": "./hex.browser.js",
    };

    return {
        name: "browser-encoding-alias",
        enforce: "pre",
        async resolveId(source, importer, options) {
            const target = map[source];
            if (!target || !importer) return null;
            // The cryptography package is isomorphic; leave its plain modules.
            if (/packages[\\/]cryptography/.test(importer)) return null;
            const resolved = await this.resolve(target, importer, {
                ...options,
                skipSelf: true,
            });
            return resolved ?? null;
        },
    };
}
