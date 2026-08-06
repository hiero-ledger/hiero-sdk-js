// SPDX-License-Identifier: Apache-2.0

/**
 * Mirrors every `*.d.ts` under the given directories to a sibling `*.d.cts`
 * so that CommonJS consumers using `moduleResolution: node16`/`nodenext`
 * resolve CJS-flavored declarations (see issue #2722).
 *
 * The packages set `"type": "module"`, so TypeScript treats `.d.ts` files as
 * ESM-only: a CJS `require()` of the package is rejected with TS1479 even
 * though a real CJS build (`lib/*.cjs`) is shipped. The mirrored `.d.cts`
 * files describe those `.cjs` files.
 *
 * Two rewrites are applied to each mirrored file:
 *
 * 1. Relative import specifiers `./x.js` -> `./x.cjs`, matching the specifier
 *    rewrite babel applies to the runtime `.cjs` build. TypeScript then
 *    resolves them to the sibling `.d.cts` declarations.
 *
 * 2. `import("long").default` / `import("bignumber.js").default` (and the
 *    `.BigNumber` named form tsc prints for the latter) -> `import("long")` /
 *    `import("bignumber.js")`. Both packages are dual-typed: their ESM
 *    declarations use default/named exports while their CJS declarations use
 *    `export =`, which has neither member.
 *
 * Usage: node generate-cts-declarations.js <dir> [<dir> ...]
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const RELATIVE_JS_SPECIFIER = /((?:from |import\()\s*")(\.\.?\/[^"]*)\.js(")/g;
const EXPORT_EQUALS_DEFAULT =
    /import\("(long|bignumber\.js)"\)\.(?:default|BigNumber)/g;

/**
 * @param {string} dir
 * @returns {string[]}
 */
function collectDeclarationFiles(dir) {
    /** @type {string[]} */
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectDeclarationFiles(full));
        } else if (entry.name.endsWith(".d.ts")) {
            files.push(full);
        }
    }
    return files;
}

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
    console.error("Usage: node generate-cts-declarations.js <dir> [<dir> ...]");
    process.exit(1);
}

let count = 0;
for (const dir of dirs) {
    for (const file of collectDeclarationFiles(dir)) {
        const source = readFileSync(file, "utf8");
        const rewritten = source
            .replace(RELATIVE_JS_SPECIFIER, "$1$2.cjs$3")
            .replace(EXPORT_EQUALS_DEFAULT, 'import("$1")');
        writeFileSync(file.replace(/\.d\.ts$/, ".d.cts"), rewritten);
        count += 1;
    }
}
console.log(`generate-cts-declarations: mirrored ${count} .d.ts -> .d.cts`);
