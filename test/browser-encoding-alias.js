// SPDX-License-Identifier: Apache-2.0

/**
 * Redirects the SDK's Node encoding modules to their browser variants when
 * running the browser test suites.
 *
 * This can't be a plain `resolve.alias` entry: the SDK's own files, the
 * `@hiero-ledger/cryptography` package and dependencies in `node_modules`
 * (`@peculiar/utils`, used by asn1js 4) all import `./encoding/hex.js` etc. via
 * the exact same relative specifier, and a string alias can't tell them apart.
 * They have no `*.browser.js` variants, so redirecting their imports would
 * resolve to files that don't exist. A plugin can inspect the importer and
 * skip them.
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
            // Only the SDK's own modules have browser variants.
            if (/node_modules|packages[\\/]cryptography/.test(importer)) {
                return null;
            }
            const resolved = await this.resolve(target, importer, {
                ...options,
                skipSelf: true,
            });
            return resolved ?? null;
        },
    };
}
