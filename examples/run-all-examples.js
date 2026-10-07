import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import dotenv from "dotenv";
import { MaxAttemptsOrTimeoutError } from "@hiero-ledger/sdk";
import { clientForName } from "./client.js";

dotenv.config();

const examplesDirectory = "./";
const excludedDirectories = [
    "./node_modules",
    "./precompile-example",
    "./react-native-example",
    "./react-native-example-legacy",
    "./simple_rest_signature_provider",
    "./contracts",
    "./demo-umd",
    "./frontend-examples",
    "./custom-grpc-web-proxies-network",
];
const excludedJSFile = [
    "run-all-examples.js",
    "wait-for-mirror.js",
    "client.js",
    path.join("consensus", "pub-sub.js"),
    path.join("consensus", "pub-sub-with-submit-key.js"),
    "batch-tx.js",
    path.join("schedule", "long-term-transaction.js"),
];
const cmd = process.env.NODE_COMMAND;
const concurrency = Math.max(
    1,
    // Examples share the configured operator and some system accounts. Running
    // them concurrently makes unrelated balance changes create false positives.
    parseInt(process.env.EXAMPLES_CONCURRENCY || "1", 10),
);
// An example that never exits must not stall the whole run until the
// CI job-level timeout (6 hours) kills it; kill it here instead.
const exampleTimeoutMs = Math.max(
    1000,
    parseInt(process.env.EXAMPLES_TIMEOUT_MS || "300000", 10),
);
// Once the consensus node stops answering (issue #4357), every example that
// talks to it waits out the SDK's 2 min request timeout before it fails or,
// when it swallows the error, exits 0, so a run that takes 8 min when healthy
// takes hours. After every example that failed, was killed, or ran longer
// than EXAMPLES_SLOW_MS (healthy examples finish in under 20 s), the node is
// pinged with a 10 s deadline. EXAMPLES_FAILED_PROBES_TO_ABORT unanswered
// pings in a row stop the run: the remaining examples are skipped and the run
// fails. A ping the node answers resets the count, so a broken or slow
// example on its own never stops the run.
const slowExampleMs = Math.max(
    1000,
    parseInt(process.env.EXAMPLES_SLOW_MS || "60000", 10),
);
const failedProbesToAbort = Math.max(
    1,
    parseInt(process.env.EXAMPLES_FAILED_PROBES_TO_ABORT || "2", 10),
);
const probeDeadlineMs = 10_000;

// Cap captured per-example output so a chatty example cannot exhaust memory.
const maxCapturedOutput = 64 * 1024;

/**
 * @typedef {object} ExampleRunResult
 * @property {string} file
 * @property {number} code
 * @property {boolean} timedOut
 * @property {string} output
 */

/**
 * @param {string} examplePath
 * @param {string} file
 * @returns {Promise<ExampleRunResult>}
 */
function runExample(examplePath, file) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, [examplePath], {
            stdio: ["ignore", "pipe", "pipe"],
        });
        // Keep the output so it can be printed when the example fails;
        // without it a failure is undiagnosable from the CI log.
        let output = "";
        /**
         * @param {Buffer} chunk
         */
        const capture = (chunk) => {
            if (output.length < maxCapturedOutput) {
                output += chunk
                    .toString()
                    .slice(0, maxCapturedOutput - output.length);
            }
        };
        child.stdout.on("data", capture);
        child.stderr.on("data", capture);
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, exampleTimeoutMs);
        child.on("close", (code) => {
            clearTimeout(timer);
            resolve({ file, code: code ?? -1, timedOut, output });
        });
        child.on("error", (error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}

/**
 * @param {string} file
 * @param {string} output
 * @returns {void}
 */
function printOutput(file, output) {
    if (output.length === 0) {
        return;
    }
    console.log(`----- output of ${file} -----`);
    console.log(output.trimEnd());
    console.log(`----- end of output of ${file} -----`);
}

/**
 * Pings the consensus node the way `Client.ping()` does (a free cost query
 * that needs no operator), with 2 attempts and a 10 s deadline, through the
 * same client setup the examples use. Only a transport failure means the node
 * is unreachable; any answer, even an error status, proves it is there.
 *
 * @returns {Promise<string | null>} null when the node answered, otherwise why it did not
 */
async function probeNetwork() {
    const client = clientForName(process.env.HEDERA_NETWORK ?? "");
    try {
        client.setMaxAttempts(2);
        client.setGrpcDeadline(probeDeadlineMs);
        const [nodeAccountId] = Object.values(client.network);
        await client.ping(nodeAccountId);
        return null;
    } catch (error) {
        if (!isTransportFailure(error)) {
            return null;
        }
        return error instanceof Error ? error.message : String(error);
    } finally {
        client.close();
    }
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isTransportFailure(error) {
    if (error instanceof MaxAttemptsOrTimeoutError) {
        return /timeout|UNAVAILABLE|DEADLINE_EXCEEDED|ECONN|ETIMEDOUT/i.test(
            error.message,
        );
    }
    // A single node that is not a local network is marked unhealthy after
    // its first transport failure, and the SDK then throws this plain Error
    // instead of retrying it.
    if (
        error instanceof Error &&
        /All nodes are unhealthy/.test(error.message)
    ) {
        return true;
    }
    // GrpcServiceError is not exported by the package. Its status converts
    // to the gRPC code: DEADLINE_EXCEEDED (4), UNAVAILABLE (14) and the
    // SDK's own Timeout (17) are transport failures, anything else is an
    // answer from the node.
    if (error instanceof Error && error.name === "GrpcServiceError") {
        const status = /** @type {{ status?: unknown }} */ (error).status;
        return [4, 14, 17].includes(Number(status));
    }
    return false;
}

/**
 * @param {string[]} examples
 * @param {number} maxConcurrency
 * @returns {Promise<void>}
 */
async function runInParallel(examples, maxConcurrency) {
    let completed = 0;
    let failed = 0;
    let failedProbesInARow = 0;
    let aborted = false;
    const total = examples.length;
    let nextIndex = 0;

    /**
     *
     */
    async function worker() {
        for (
            let index = nextIndex++;
            index < total && !aborted;
            index = nextIndex++
        ) {
            const file = examples[index];
            const examplePath = path.join(examplesDirectory, file);
            console.log(
                `\n⏳ ${String(index + 1)}/${String(
                    total,
                )}. Running ${file}...`,
            );
            const startedAt = Date.now();
            const {
                file: f,
                code,
                timedOut,
                output,
            } = await runExample(examplePath, file);
            const elapsedMs = Date.now() - startedAt;
            if (timedOut) {
                failed += 1;
                console.log(
                    `❌ ${f} timed out after ${String(
                        exampleTimeoutMs,
                    )} ms and was killed.`,
                );
                printOutput(f, output);
            } else if (code === 0) {
                completed += 1;
                console.log(`✅ ${f} completed.`);
            } else {
                failed += 1;
                console.log(`❌ ${f} failed with code ${String(code)}.`);
                printOutput(f, output);
            }
            if (
                aborted ||
                (!timedOut && code === 0 && elapsedMs < slowExampleMs)
            ) {
                continue;
            }

            let unreachable;
            try {
                unreachable = await probeNetwork();
            } catch (error) {
                console.log(
                    `⚠️ could not ping the node after ${f}: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
                continue;
            }
            if (unreachable == null) {
                failedProbesInARow = 0;
                continue;
            }
            failedProbesInARow += 1;
            console.log(
                `⚠️ the node did not answer a ${String(
                    probeDeadlineMs / 1000,
                )} s ping after ${f} (${String(failedProbesInARow)} of ${String(
                    failedProbesToAbort,
                )} before the run stops): ${unreachable}`,
            );
            if (failedProbesInARow >= failedProbesToAbort) {
                aborted = true;
                console.log(
                    `\n⛔ The run stops here: the network stopped answering. The remaining examples are skipped instead of waiting up to ${String(
                        exampleTimeoutMs / 1000,
                    )} s for each of them.`,
                );
            }
        }
    }

    const workers = Math.min(maxConcurrency, total);
    await Promise.all(Array.from({ length: workers }, () => worker()));

    const skipped = total - completed - failed;
    console.log(
        `\nTotal: [${total}] \n✅ Completed: [${completed}] \n❌ Failed: [${failed}] ${
            skipped > 0
                ? `\n⏭️ Skipped: [${skipped}] (the network stopped answering)`
                : ""
        }${failed === 0 && skipped === 0 ? " \nGreat job! 🎉" : ""} `,
    );
    if (failed > 0 || skipped > 0) {
        process.exit(1);
    }
}

/**
 * @param {NodeJS.ErrnoException | null} err
 * @param {string[]} files
 * @returns {void}
 */
fs.readdir(examplesDirectory, { withFileTypes: true }, (err, entries) => {
    if (err) {
        console.error("Error reading directory:", err);
        process.exit(1);
    }

    if (cmd === undefined) {
        throw new Error("Environment variable NODE_COMMAND is required.");
    }

    const examples = [];

    // Top-level .js files.
    for (const entry of entries) {
        if (
            entry.isFile() &&
            entry.name.endsWith(".js") &&
            !excludedJSFile.includes(entry.name)
        ) {
            examples.push(entry.name);
        }
    }

    // .js files one level deep — only inside non-excluded subdirectories.
    for (const entry of entries) {
        if (
            !entry.isDirectory() ||
            excludedDirectories.includes(`./${entry.name}`)
        ) {
            continue;
        }
        const subDir = path.join(examplesDirectory, entry.name);
        const subFiles = fs.readdirSync(subDir, { withFileTypes: true });
        for (const sub of subFiles) {
            const relativePath = path.join(entry.name, sub.name);
            if (
                sub.isFile() &&
                sub.name.endsWith(".js") &&
                !excludedJSFile.includes(relativePath)
            ) {
                examples.push(relativePath);
            }
        }
    }

    console.log(
        `Running ${examples.length} examples with concurrency ${concurrency}...\n`,
    );

    void runInParallel(examples, concurrency);
});
