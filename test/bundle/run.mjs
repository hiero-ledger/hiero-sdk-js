#!/usr/bin/env node
/**
 * Bundles the published packages with webpack, Vite and esbuild and checks
 * that every class `Transaction.fromBytes()`, `Query.fromBytes()`,
 * `Transaction.schedule()`, key parsing and `EthereumTransactionData.fromBytes()`
 * look up at runtime is still in the bundle.
 *
 *   node test/bundle/run.mjs [--keep]
 *
 * The SDK, proto and cryptography packages must be built (`task build`). The
 * script packs them, installs the tarballs into a temporary project, and
 * bundles test/bundle/app.js, which imports only base classes. The bytes come
 * from the protobuf definitions rather than from SDK classes. One transaction
 * per `TransactionBody.data` case and one query per `Query.query` case, so a
 * case whose class goes missing fails here instead of being skipped.
 *
 * Every bundler runs twice: once with the package.json as published, where
 * every check must pass, and once with `"sideEffects": false` forced into the
 * SDK's package.json, where some check must fail. The second run proves the
 * bundles are really tree-shaken; if it passed, this test could not catch a
 * dropped class.
 *
 * Why this exists: #2863 set `"sideEffects": false`, bundlers dropped the files
 * that only register themselves when they load, and `Transaction.fromBytes()`
 * failed in production wallets (#3011). #3149 went back to `true`. #4560 makes
 * the registration explicit, and this test guards that change. It would also
 * have caught #4342, where removing two transaction classes broke
 * `Transaction.fromBytes()`.
 *
 * Exit code 1 on any failure. `--keep` leaves the temporary project in place.
 */

import { execFileSync } from "node:child_process";
import {
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
    copyFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const keep = process.argv.includes("--keep");

/**
 * Oneof cases the SDK has no class for. `fromBytes()` must reject these; when
 * one starts to decode, the SDK gained a class and the case moves out of this
 * list.
 */
const TRANSACTION_CASES_WITHOUT_CLASS = new Set([
    "cryptoAddLiveHash",
    "cryptoDeleteLiveHash",
    "uncheckedSubmit",
    "nodeStakeUpdate",
    "stateSignatureTransaction",
    "hintsPreprocessingVote",
    "hintsKeyPublication",
    "hintsPartialSignature",
    "historyProofSignature",
    "historyProofKeyPublication",
    "historyProofVote",
    "crsPublication",
    "hookDispatch",
    "ledgerIdPublication",
    "migrationRootHashVote",
]);

const QUERY_CASES_WITHOUT_CLASS = new Set([
    "getByKey",
    "getBySolidityID",
    "ContractGetRecords",
    "cryptoGetLiveHash",
    "cryptoGetProxyStakers",
    "transactionGetFastRecord",
    "tokenGetAccountNftInfos",
    "tokenGetNftInfos",
    "networkGetExecutionTime",
    "accountDetails",
]);

/**
 * Transaction types a batch may not contain.
 */
const NOT_BATCHABLE = new Set(["atomicBatch", "freeze"]);

function run(command, args, cwd, stderr = "inherit") {
    return execFileSync(command, args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", stderr],
    });
}

/**
 * Packs the SDK, proto and cryptography packages into `dir`, the way they
 * would be published. `pnpm pack` replaces the `workspace:*` dependencies with
 * real versions.
 */
function packPackages(dir) {
    const tarballs = {};

    for (const [name, packageDir] of [
        ["sdk", "."],
        ["proto", "packages/proto"],
        ["cryptography", "packages/cryptography"],
    ]) {
        const before = new Set(readdirSync(dir));

        run(
            "pnpm",
            ["pack", "--pack-destination", dir],
            join(repoRoot, packageDir),
        );

        const created = readdirSync(dir).filter((file) => !before.has(file));

        if (created.length !== 1) {
            throw new Error(
                `pnpm pack in ${packageDir} created ${created.length} files`,
            );
        }

        tarballs[name] = join(dir, created[0]);
    }
    return tarballs;
}

/**
 * Creates the project the apps are bundled in and installs the tarballs. The
 * overrides keep npm from fetching the published proto and cryptography
 * packages that the SDK tarball depends on.
 */
function createProject(dir, tarballs) {
    const packageJson = {
        name: "sdk-bundle-test",
        private: true,
        type: "module",
        dependencies: {
            "@hiero-ledger/sdk": `file:${tarballs.sdk}`,
            "@hiero-ledger/proto": `file:${tarballs.proto}`,
            "@hiero-ledger/cryptography": `file:${tarballs.cryptography}`,
        },
        overrides: {
            "@hiero-ledger/proto": "$@hiero-ledger/proto",
            "@hiero-ledger/cryptography": "$@hiero-ledger/cryptography",
        },
    };

    writeFileSync(
        join(dir, "package.json"),
        JSON.stringify(packageJson, null, 4),
    );

    copyFileSync(join(here, "app.js"), join(dir, "app.js"));
    run(
        "npm",
        [
            "install",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            "--loglevel=error",
        ],
        dir,
    );
}

/**
 * Finds the cases of a oneof at runtime: a field belongs to the oneof when
 * setting it alone makes the oneof's getter return its name.
 */
function oneofCases(Message, oneof) {
    const cases = [];
    for (const key of Object.getOwnPropertyNames(Message.prototype)) {
        if (key === oneof || key === "constructor") {
            continue;
        }
        const message = new Message();
        message[key] = {};
        if (message[oneof] === key) {
            cases.push(key);
        }
    }
    return cases;
}

/**
 * Builds the bytes the bundled app decodes, using the packed proto package and
 * ethers (an SDK dependency) from the test project.
 */
async function createInputs(dir) {
    const require = createRequire(join(dir, "package.json"));
    const { proto } = await import(
        pathToFileURL(require.resolve("@hiero-ledger/proto")).href
    );

    const { Wallet } = await import(
        pathToFileURL(require.resolve("ethers")).href
    );

    const accountId = { shardNum: 0, realmNum: 0, accountNum: 1001 };

    const signedTransaction = (fields) =>
        proto.SignedTransaction.encode({
            bodyBytes: proto.TransactionBody.encode({
                transactionID: {
                    accountID: accountId,
                    transactionValidStart: { seconds: 1700000000, nanos: 0 },
                },
                nodeAccountID: { shardNum: 0, realmNum: 0, accountNum: 3 },
                transactionFee: 100000000,
                transactionValidDuration: { seconds: 120 },
                ...fields,
            }).finish(),
            sigMap: { sigPair: [] },
        }).finish();

    const transactionList = (signed) =>
        base64(
            proto.TransactionList.encode({
                transactionList: [{ signedTransactionBytes: signed }],
            }).finish(),
        );

    /**
     * The smallest body each case decodes from. Only a schedule needs a
     * scheduled transaction inside it.
     */
    const body = (kase) =>
        kase === "scheduleCreate"
            ? {
                  scheduledTransactionBody: {
                      transactionFee: 1,
                      cryptoTransfer: {},
                  },
              }
            : {};

    const transactionCases = oneofCases(proto.TransactionBody, "data");
    const queryCases = oneofCases(proto.Query, "query");

    const transactions = Object.fromEntries(
        transactionCases.map((kase) => [
            kase,
            transactionList(signedTransaction({ [kase]: body(kase) })),
        ]),
    );

    const queries = Object.fromEntries(
        queryCases.map((kase) => [
            kase,
            base64(proto.Query.encode({ [kase]: {} }).finish()),
        ]),
    );

    // One batch whose inner transactions cover every case the SDK has a class
    // for, because inner transactions are decoded through the same lookup.
    const batch = transactionList(
        signedTransaction({
            atomicBatch: {
                transactions: transactionCases
                    .filter(
                        (kase) =>
                            !TRANSACTION_CASES_WITHOUT_CLASS.has(kase) &&
                            !NOT_BATCHABLE.has(kase),
                    )
                    .map((kase) => signedTransaction({ [kase]: body(kase) })),
            },
        }),
    );

    // Key parsing reads each key type from CACHE: one account update per type.
    const wallet = new Wallet(`0x${"11".repeat(32)}`);
    const ecdsa = Buffer.from(
        wallet.signingKey.compressedPublicKey.slice(2),
        "hex",
    );
    const ed25519 = new Uint8Array(32).fill(1);
    const contractId = { shardNum: 0, realmNum: 0, contractNum: 5005 };
    const keys = {
        ed25519: { ed25519 },
        ECDSASecp256k1: { ECDSASecp256k1: ecdsa },
        keyList: {
            keyList: { keys: [{ ed25519 }, { ECDSASecp256k1: ecdsa }] },
        },
        thresholdKey: {
            thresholdKey: { threshold: 1, keys: { keys: [{ ed25519 }] } },
        },
        contractID: { contractID: contractId },
        delegatableContractId: { delegatableContractId: contractId },
    };
    const keyTransactions = Object.fromEntries(
        Object.entries(keys).map(([name, key]) => [
            name,
            transactionList(
                signedTransaction({
                    cryptoUpdateAccount: { accountIDToUpdate: accountId, key },
                }),
            ),
        ]),
    );

    // One signed Ethereum transaction per type the SDK parses.
    const ethereum = {};
    for (const [name, type] of [
        ["legacy", 0],
        ["eip2930", 1],
        ["eip1559", 2],
        ["eip7702", 4],
    ]) {
        const signed = await wallet.signTransaction({
            type,
            chainId: 298,
            nonce: 0,
            gasLimit: 21000,
            to: "0x0000000000000000000000000000000000000001",
            value: 1,
            ...(type < 2
                ? { gasPrice: 1 }
                : { maxFeePerGas: 2, maxPriorityFeePerGas: 1 }),
            ...(type === 4
                ? {
                      authorizationList: [
                          await wallet.authorize({
                              address:
                                  "0x0000000000000000000000000000000000000002",
                              nonce: 1,
                              chainId: 298,
                          }),
                      ],
                  }
                : {}),
        });
        ethereum[name] = Buffer.from(signed.slice(2), "hex").toString("base64");
    }

    return { transactions, queries, batch, keyTransactions, ethereum };
}

function base64(bytes) {
    return Buffer.from(bytes).toString("base64");
}

/**
 * The bundlers, each building app.js into one ES module the runner imports.
 * They come from the repository's devDependencies and resolve the SDK from
 * the test project's node_modules.
 */
const BUNDLERS = {
    async esbuild(dir, outFile) {
        const esbuild = await import("esbuild");
        await esbuild.build({
            absWorkingDir: dir,
            entryPoints: ["app.js"],
            bundle: true,
            minify: true,
            platform: "browser",
            format: "esm",
            target: "es2022",
            outfile: outFile,
            logLevel: "error",
        });
    },

    async vite(dir, outFile) {
        const { build } = await import("vite");
        await build({
            root: dir,
            configFile: false,
            logLevel: "error",
            build: {
                lib: {
                    entry: join(dir, "app.js"),
                    formats: ["es"],
                    fileName: () => outFile.split("/").pop(),
                },
                outDir: dirname(outFile),
                emptyOutDir: false,
                target: "es2022",
                minify: true,
            },
        });
    },

    async webpack(dir, outFile) {
        const { default: webpack } = await import("webpack");
        const stats = await new Promise((resolvePromise, reject) => {
            webpack(
                {
                    mode: "production",
                    target: "web",
                    context: dir,
                    entry: "./app.js",
                    experiments: { outputModule: true },
                    output: {
                        path: dirname(outFile),
                        filename: outFile.split("/").pop(),
                        module: true,
                        library: { type: "module" },
                        chunkFormat: "module",
                    },
                    optimization: { splitChunks: false },
                    performance: { hints: false },
                },
                (error, result) =>
                    error ? reject(error) : resolvePromise(result),
            );
        });
        if (stats.hasErrors()) {
            throw new Error(stats.toString({ all: false, errors: true }));
        }
    },
};

/**
 * Runs every check against one bundle in a fresh Node process, so bundles
 * don't share the SDK's module state. The SDK's stderr (deprecation notices)
 * is dropped; the results come back as JSON on stdout.
 */
function runChecks(bundle, inputsFile) {
    const output = run(
        process.execPath,
        [join(here, "check.mjs"), bundle, inputsFile],
        dirname(bundle),
        "ignore",
    );
    return JSON.parse(output.slice(output.indexOf("{")));
}

/**
 * Compares the results of one bundle with what the published package must do.
 */
function failures(results, inputs) {
    const failed = [];
    for (const [name, result] of Object.entries(results)) {
        const [kind, kase] = name.split(":");
        const withoutClass =
            (kind === "transaction" &&
                TRANSACTION_CASES_WITHOUT_CLASS.has(kase)) ||
            (kind === "query" && QUERY_CASES_WITHOUT_CLASS.has(kase));

        if (withoutClass) {
            if (result.ok) {
                failed.push(
                    `${name}: decodes now; remove it from the list of cases without a class`,
                );
            } else if (!result.error?.includes("not implemented for type")) {
                failed.push(`${name}: ${result.error}`);
            }
        } else if (!result.ok) {
            failed.push(`${name}: ${result.error}`);
        } else if (
            kind === "ethereum" &&
            result.value !== inputs.ethereum[kase]
        ) {
            failed.push(`${name}: bytes changed in the round trip`);
        }
    }
    return failed;
}

function setSdkSideEffects(dir, sideEffects) {
    const file = join(dir, "node_modules/@hiero-ledger/sdk/package.json");
    const packageJson = JSON.parse(readFileSync(file, "utf8"));
    packageJson.sideEffects = sideEffects;
    writeFileSync(file, JSON.stringify(packageJson, null, 4));
}

async function main() {
    for (const dir of [
        "lib",
        "packages/proto/lib",
        "packages/cryptography/lib",
    ]) {
        try {
            readdirSync(join(repoRoot, dir));
        } catch {
            throw new Error(`${dir} is missing; run \`task build\` first`);
        }
    }

    const dir = mkdtempSync(join(tmpdir(), "sdk-bundle-test-"));
    try {
        console.log("Packing the SDK, proto and cryptography packages...");
        const tarballs = packPackages(dir);

        console.log("Installing the tarballs...");
        createProject(dir, tarballs);

        const inputs = await createInputs(dir);
        const inputsFile = join(dir, "inputs.json");
        writeFileSync(inputsFile, JSON.stringify(inputs));

        const published = JSON.parse(
            readFileSync(
                join(dir, "node_modules/@hiero-ledger/sdk/package.json"),
                "utf8",
            ),
        ).sideEffects;

        console.log(
            `${Object.keys(inputs.transactions).length} transaction and ` +
                `${Object.keys(inputs.queries).length} query cases; ` +
                `published "sideEffects": ${JSON.stringify(published)}`,
        );

        let ok = true;
        for (const [variant, sideEffects] of [
            ["published", published],
            ["sideEffects: false", false],
        ]) {
            setSdkSideEffects(dir, sideEffects);
            console.log(`\n${variant}:`);

            for (const [name, bundle] of Object.entries(BUNDLERS)) {
                const outFile = join(
                    dir,
                    "out",
                    `${name}-${
                        variant === "published"
                            ? "published"
                            : "no-side-effects"
                    }.mjs`,
                );
                await bundle(dir, outFile);

                const size = readFileSync(outFile).length;
                const failed = failures(runChecks(outFile, inputsFile), inputs);

                if (variant === "published") {
                    console.log(
                        `  ${name.padEnd(8)} ${String(
                            Math.round(size / 1000),
                        ).padStart(5)} KB  ` +
                            (failed.length === 0
                                ? "all checks pass"
                                : `${failed.length} FAILED`),
                    );

                    for (const failure of failed) {
                        console.log(`      ${failure}`);
                    }

                    ok &&= failed.length === 0;
                } else {
                    // Forced off, the bundler drops the files that only
                    // register themselves. If nothing fails, the bundle wasn't
                    // tree-shaken and the published run proves nothing.
                    console.log(
                        `  ${name.padEnd(8)} ${String(
                            Math.round(size / 1000),
                        ).padStart(5)} KB  ` +
                            (failed.length > 0
                                ? `${failed.length} checks fail, as expected`
                                : "NOTHING FAILED: the bundle was not tree-shaken"),
                    );

                    ok &&= failed.length > 0;
                }
            }
        }

        if (!ok) {
            console.error("\nBundle regression test failed.");
            process.exitCode = 1;
        }
    } finally {
        if (keep) {
            console.log(`\nKept ${dir}`);
        } else {
            rmSync(dir, { recursive: true, force: true });
        }
    }
}

await main();
