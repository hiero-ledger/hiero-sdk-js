#!/usr/bin/env node
//
// Bundles two tiny apps — one importing @hiero-ledger/proto (full, pbjs) and
// one importing @hiero-ledger/proto/minimal (ts-proto) — with rollup + terser
// and reports raw + gzipped output sizes.  Writes the result to
// public/bundle-sizes.json so the frontend can pick it up at runtime.

import { rollup } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
// Temp entries must live inside the project so Node resolution walks up to
// proto-compare/node_modules and finds the symlinked @hiero-ledger/proto.
const tmp = fs.mkdtempSync(path.join(root, ".measure-"));

// Three workloads, measured with identical bundler settings:
//
//   fullEnvelope    – pbjs package, build a full Transaction (body + envelope).
//                     Realistic cost of the old design: the 49-way oneof
//                     transitively pulls in every *TransactionBody.
//   minimalEnvelope – ts-proto per-transaction module, same full-Transaction
//                     workload.  The oneof has exactly one case, so the graph
//                     closes at FileAppendTransactionBody.
//   minimalBody     – ts-proto, body-only workload (e.g. a mirror-node decoder
//                     that already knows the transaction kind).  Floor of the
//                     minimal design.

const ENTRY_FULL_ENVELOPE = `
import { proto } from "@hiero-ledger/proto";
const bodyBytes = proto.TransactionBody.encode(
    proto.TransactionBody.create({
        transactionID: {
            accountID: { shardNum: 0, realmNum: 0, accountNum: 2 },
        },
        nodeAccountID: { shardNum: 0, realmNum: 0, accountNum: 3 },
        transactionFee: 100000,
        transactionValidDuration: { seconds: 120 },
        fileAppend: {
            fileID: { shardNum: 0, realmNum: 0, fileNum: 42 },
            contents: new Uint8Array([1, 2, 3]),
        },
    }),
).finish();
const txBytes = proto.Transaction.encode(
    proto.Transaction.create({ signedTransactionBytes: bodyBytes }),
).finish();
globalThis.__result = txBytes.length;
`;

const ENTRY_MINIMAL_ENVELOPE = `
import {
    Transaction,
    TransactionBody,
} from "@hiero-ledger/proto/minimal/file_append_transaction";
const bodyBytes = TransactionBody.encode(
    TransactionBody.fromPartial({
        transactionID: {
            accountID: { shardNum: 0n, realmNum: 0n, accountNum: 2n },
        },
        nodeAccountID: { shardNum: 0n, realmNum: 0n, accountNum: 3n },
        transactionFee: 100000n,
        transactionValidDuration: { seconds: 120n },
        data: {
            $case: "fileAppend",
            fileAppend: {
                fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
                contents: new Uint8Array([1, 2, 3]),
            },
        },
    }),
).finish();
const txBytes = Transaction.encode(
    Transaction.fromPartial({ signedTransactionBytes: bodyBytes }),
).finish();
globalThis.__result = txBytes.length;
`;

const ENTRY_MINIMAL_BODY = `
import { FileAppendTransactionBody } from "@hiero-ledger/proto/minimal";
const bodyBytes = FileAppendTransactionBody.encode(
    FileAppendTransactionBody.fromPartial({
        fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
        contents: new Uint8Array([1, 2, 3]),
    }),
).finish();
globalThis.__result = bodyBytes.length;
`;

const ENTRY_MINIMAL_ACCOUNT_ID = `
import { AccountID } from "@hiero-ledger/proto/minimal";
const bytes = AccountID.encode(
    AccountID.fromPartial({
        shardNum: 0n,
        realmNum: 0n,
        account: { $case: "accountNum", accountNum: 2n },
    }),
).finish();
globalThis.__result = bytes.length;
`;

const ENTRY_FULL_ACCOUNT_ID = `
import { proto } from "@hiero-ledger/proto";
const bytes = proto.AccountID.encode(
    proto.AccountID.create({ shardNum: 0, realmNum: 0, accountNum: 2 }),
).finish();
globalThis.__result = bytes.length;
`;

async function bundle(label, source) {
    const entry = path.join(tmp, `${label}.js`);
    fs.writeFileSync(entry, source);
    const bundleBuild = await rollup({
        input: entry,
        onwarn(warning, warn) {
            if (warning.code === "CIRCULAR_DEPENDENCY") return;
            if (warning.code === "THIS_IS_UNDEFINED") return;
            warn(warning);
        },
        plugins: [
            nodeResolve({ browser: true, preferBuiltins: false }),
            commonjs({ ignoreDynamicRequires: true }),
            terser(),
        ],
    });
    const { output } = await bundleBuild.generate({ format: "esm" });
    await bundleBuild.close();
    const code = output.map((c) => c.code ?? "").join("");
    const raw = Buffer.byteLength(code, "utf8");
    const gz = zlib.gzipSync(Buffer.from(code), { level: 9 }).length;
    return { raw, gz };
}

const humanKb = (n) => (n / 1024).toFixed(1) + " KB";
const savings = (before, after) =>
    (100 * (1 - after / before)).toFixed(1) + "%";

const specs = [
    {
        id: "fullEnvelope",
        label: "Full package · full Transaction",
        source: ENTRY_FULL_ENVELOPE,
    },
    {
        id: "minimalEnvelope",
        label: "Minimal · per-transaction envelope",
        source: ENTRY_MINIMAL_ENVELOPE,
    },
    {
        id: "minimalBody",
        label: "Minimal · body only",
        source: ENTRY_MINIMAL_BODY,
    },
    {
        id: "fullAccountId",
        label: "Full package · just AccountID",
        source: ENTRY_FULL_ACCOUNT_ID,
    },
    {
        id: "minimalAccountId",
        label: "Minimal · just AccountID",
        source: ENTRY_MINIMAL_ACCOUNT_ID,
    },
];

console.log("Bundling three workloads in parallel…");
const bundled = await Promise.all(
    specs.map(async (s) => ({ ...s, ...(await bundle(s.id, s.source)) })),
);

const out = {
    generatedAt: new Date().toISOString(),
    workloads: bundled.map(({ id, label, raw, gz }) => ({ id, label, raw, gz })),
};
const outDir = path.join(root, "public");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
    path.join(outDir, "bundle-sizes.json"),
    JSON.stringify(out, null, 2) + "\n",
);

const baseline = bundled.find((b) => b.id === "fullEnvelope");
console.log("");
for (const b of bundled) {
    const raw = humanKb(b.raw).padStart(10);
    const gz = humanKb(b.gz).padStart(10);
    const vsBaseline =
        b === baseline
            ? ""
            : `  (raw ${savings(baseline.raw, b.raw)}  |  gz ${savings(baseline.gz, b.gz)} vs full)`;
    console.log(`  ${b.label.padEnd(38)} ${raw} raw  |  ${gz} gz${vsBaseline}`);
}
console.log("");
console.log(`Wrote ${path.relative(process.cwd(), path.join(outDir, "bundle-sizes.json"))}`);

fs.rmSync(tmp, { recursive: true, force: true });
