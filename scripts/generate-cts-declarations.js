// SPDX-License-Identifier: Apache-2.0

/**
 * Mirrors `*.d.ts` files to sibling `*.d.cts` for CJS consumers on
 * node16/nodenext resolution (issue #2722): rewrites relative `./x.js`
 * specifiers to `./x.cjs` and drops `.default`/`.BigNumber` from
 * `long`/`bignumber.js` imports, whose CJS types use `export =`.
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
