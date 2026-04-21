#!/usr/bin/env node

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const MINIMAL_SRC = "minimal_src";
const STAGE = ".proto-stage";
const GEN = ".minimal-gen";
const OUT_DIR = "src/minimal";

const BUF = "./node_modules/.bin/buf";
const TSC = "./node_modules/.bin/tsc";

// ------------------------------------------------------------------------------
// Scope: this script consumes minimal_src/ and emits one ts-proto module per
// proto file into src/minimal/.
//
// Why per-transaction isolation?  Every `*_transaction.proto` redeclares
// `message Transaction`, `TransactionBody` and `TransactionList` under the
// same `package proto`.  pbjs tolerated that because each file was a
// standalone invocation, but buf/protoc resolves all files in a module
// together and rejects the duplicate symbols.  To reproduce the pbjs
// behaviour we stage the non-transaction helpers once and then run buf
// once per transaction file with that single transaction added alongside.
// ------------------------------------------------------------------------------

function rmrf(p) {
    fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

function runBuf() {
    execFileSync(BUF, ["generate", "--template", "buf.gen.yaml", STAGE], {
        stdio: ["ignore", "ignore", "inherit"],
    });
}

// --- 1. Stage helper protos (everything except *_transaction.proto) -----------

rmrf(STAGE);
rmrf(GEN);
fs.mkdirSync(STAGE, { recursive: true });
fs.mkdirSync(GEN, { recursive: true });

const allProtos = fs.readdirSync(MINIMAL_SRC).filter((f) => f.endsWith(".proto"));
// The hand-rolled copy of google/protobuf/wrappers.proto collides with buf's
// built-in WKT; drop it from the stage and let buf ship its own.
const SKIP = new Set(["google_protobuf_wrappers.proto"]);

const txProtos = allProtos
    .filter((f) => f.endsWith("_transaction.proto") && !SKIP.has(f))
    .sort();
const helperProtos = allProtos
    .filter((f) => !f.endsWith("_transaction.proto") && !SKIP.has(f))
    .sort();

for (const f of helperProtos) {
    fs.copyFileSync(path.join(MINIMAL_SRC, f), path.join(STAGE, f));
}

// --- 2. Auto-inject missing imports into the staged files ---------------------
//
// Several curated protos reference types (AccountID, Key, TransactionID,
// Timestamp, Duration, ...) without explicitly importing the file that
// defines them.  Build a symbol index and rewrite the staged copy so buf
// can resolve them.  The upstream minimal_src/ files remain untouched.

const WORD_RE = /\b([A-Z][A-Za-z0-9_]*)\b/g;

// Google well-known-type wrappers — buf ships these internally but we still
// need an explicit import wherever they're referenced.
const WKT_WRAPPER_TYPES = new Set([
    "BoolValue", "BytesValue", "DoubleValue", "FloatValue",
    "Int32Value", "Int64Value", "StringValue", "UInt32Value", "UInt64Value",
]);
const WKT_WRAPPERS_IMPORT = "google/protobuf/wrappers.proto";

function buildSymbolIndex(files) {
    const index = new Map();
    for (const [dir, f] of files) {
        const src = fs.readFileSync(path.join(dir, f), "utf8");
        for (const m of src.matchAll(/^(?:message|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)) {
            if (!index.has(m[1])) index.set(m[1], f);
        }
    }
    return index;
}

function injectImports(filePath, symbolIndex) {
    let src = fs.readFileSync(filePath, "utf8");
    const selfName = path.basename(filePath);
    const existing = new Set();
    for (const m of src.matchAll(/^import\s+"([^"]+)";/gm)) existing.add(m[1]);

    const code = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");

    // Types declared locally — don't treat references to them as unresolved.
    const localTypes = new Set();
    for (const m of code.matchAll(/(?:message|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
        localTypes.add(m[1]);
    }

    const needed = new Set();
    const wktNeeded = new Set();
    for (const m of code.matchAll(WORD_RE)) {
        const sym = m[1];
        if (localTypes.has(sym)) continue;
        if (WKT_WRAPPER_TYPES.has(sym)) {
            wktNeeded.add(sym);
            if (!existing.has(WKT_WRAPPERS_IMPORT)) needed.add(WKT_WRAPPERS_IMPORT);
            continue;
        }
        const owner = symbolIndex.get(sym);
        if (!owner || owner === selfName) continue;
        if (existing.has(owner)) continue;
        needed.add(owner);
    }

    // buf/protoc requires WKT wrapper references to be fully qualified.
    // pbjs tolerated bare names like `BytesValue`; rewrite them so buf accepts.
    for (const wkt of wktNeeded) {
        src = src.replace(
            new RegExp(`(?<![\\w.])${wkt}\\b`, "g"),
            `google.protobuf.${wkt}`,
        );
    }

    if (needed.size > 0) {
        const lines = [...needed].sort().map((n) => `import "${n}";`).join("\n") + "\n";
        if (/^import\s+"[^"]+";/m.test(src)) {
            src = src.replace(/((?:^import\s+"[^"]+";\s*\n)+)/m, `$1${lines}`);
        } else {
            src = src.replace(/^(package\s+[^;]+;\s*\n)/m, `$1\n${lines}`);
        }
    }
    fs.writeFileSync(filePath, src);
}

// Pbjs ignored conflicts where a `reserved` field number was also actively used
// (e.g. `reserved 30; ... tokenBurn = 30;` in token_burn_transaction.proto).
// buf rejects them.  Walk each `message` body, collect declared field numbers,
// and strip those from any `reserved` list inside the same scope.
function fixReservedConflicts(filePath) {
    const original = fs.readFileSync(filePath, "utf8");
    const lines = original.split("\n");

    const messages = [];
    let depth = 0;
    let messageStart = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isMessageDecl = /^\s*message\s+\w+/.test(line);
        if (isMessageDecl && depth === 0) messageStart = i;
        depth += (line.match(/\{/g) || []).length;
        depth -= (line.match(/\}/g) || []).length;
        if (depth === 0 && messageStart >= 0) {
            messages.push([messageStart, i]);
            messageStart = -1;
        }
    }

    const FIELD_RE = /^\s*(?:repeated\s+|optional\s+)?[\w.]+\s+\w+\s*=\s*(\d+)\s*;/;
    let changed = false;
    for (const [start, end] of messages) {
        const used = new Set();
        for (let i = start; i <= end; i++) {
            const m = FIELD_RE.exec(lines[i]);
            if (m) used.add(parseInt(m[1], 10));
        }
        for (let i = start; i <= end; i++) {
            const replaced = lines[i].replace(/reserved\s+([\d,\s]+);/g, (_, list) => {
                const nums = list.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
                const kept = nums.filter((n) => !used.has(n));
                if (kept.length === nums.length) return _;
                return kept.length === 0 ? "" : `reserved ${kept.join(", ")};`;
            });
            if (replaced !== lines[i]) {
                lines[i] = replaced;
                changed = true;
            }
        }
    }

    if (changed) fs.writeFileSync(filePath, lines.join("\n"));
}

// Only index the helper protos: every *_transaction.proto redeclares the
// same `Transaction` / `TransactionBody` / `TransactionList` symbols, so
// including them in the index would mis-attribute locally-defined types to
// whichever transaction file happened to be indexed first.
const symbolIndex = buildSymbolIndex(helperProtos.map((f) => [STAGE, f]));

for (const f of helperProtos) {
    injectImports(path.join(STAGE, f), symbolIndex);
    fixReservedConflicts(path.join(STAGE, f));
}

// --- 3. First buf run: generate all helper .ts files --------------------------

process.stdout.write(`Generating ${helperProtos.length} helper modules... `);
runBuf();
console.log("ok");

// --- 4. Per-transaction: stage the tx, run buf, then remove it ---------------

let count = 0;
for (const f of txProtos) {
    const staged = path.join(STAGE, f);
    fs.copyFileSync(path.join(MINIMAL_SRC, f), staged);
    injectImports(staged, symbolIndex);
    fixReservedConflicts(staged);
    process.stdout.write(`[${++count}/${txProtos.length}] ${f}... `);
    runBuf();
    console.log("ok");
    fs.unlinkSync(staged);
}

// --- 5. Compile generated .ts into src/minimal/ as .js + .d.ts ---------------

rmrf(OUT_DIR);
fs.mkdirSync(OUT_DIR, { recursive: true });

execFileSync(TSC, ["--project", "tsconfig.minimal.json"], { stdio: "inherit" });

// --- 6. Emit a top-level index.js / index.d.ts for tree-shakable named access -
//
// Each proto file becomes a namespace export: consumers can write
// `import { FileAppendTransaction } from "@hiero-ledger/proto/minimal"` and
// reach every generated message via FileAppendTransaction.TransactionList etc.

const pascalCase = (name) =>
    name.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

const emittedJs = fs.readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".js") && f !== "index.js")
    .sort();

const indexLines = emittedJs.map((f) => {
    const base = path.basename(f, ".js");
    return `export * as ${pascalCase(base)} from "./${base}.js";`;
});

fs.writeFileSync(
    path.join(OUT_DIR, "index.js"),
    "// Auto-generated. Do not edit.\n" + indexLines.join("\n") + "\n",
);
fs.writeFileSync(
    path.join(OUT_DIR, "index.d.ts"),
    "// Auto-generated. Do not edit.\n" + indexLines.join("\n") + "\n",
);

console.log(`\n✓ Wrote ${emittedJs.length} modules + index to ${OUT_DIR}/`);

rmrf(STAGE);
rmrf(GEN);
