import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import dotenv from "dotenv";

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
    "consensus-pub-sub.js",
    "consensus-pub-sub-chunked.js",
    "consensus-pub-sub-with-submit-key.js",
    "create-update-delete-node.js",
    "batch-tx.js",
    "long-term-schedule-transaction.js",
    "mirror-node-contract-queries-example.js",
    "node-client-async-testnet.js",
];
const cmd = process.env.NODE_COMMAND;
const concurrency = Math.max(
    1,
    parseInt(process.env.EXAMPLES_CONCURRENCY || "4", 10),
);
// An example that never exits must not stall the whole run until the
// CI job-level timeout (6 hours) kills it; kill it here instead.
const exampleTimeoutMs = Math.max(
    1000,
    parseInt(process.env.EXAMPLES_TIMEOUT_MS || "300000", 10),
);

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
                output += chunk.toString();
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
 * @param {string[]} examples
 * @param {number} maxConcurrency
 * @returns {Promise<void>}
 */
async function runInParallel(examples, maxConcurrency) {
    let completed = 0;
    let failed = 0;
    const total = examples.length;
    let nextIndex = 0;

    /**
     *
     */
    async function worker() {
        for (let index = nextIndex++; index < total; index = nextIndex++) {
            const file = examples[index];
            const examplePath = path.join(examplesDirectory, file);
            console.log(
                `\n⏳ ${String(index + 1)}/${String(total)}. Running ${file}...`,
            );
            const {
                file: f,
                code,
                timedOut,
                output,
            } = await runExample(examplePath, file);
            if (timedOut) {
                failed += 1;
                console.log(
                    `❌ ${f} timed out after ${String(exampleTimeoutMs)} ms and was killed.`,
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
        }
    }

    const workers = Math.min(maxConcurrency, total);
    await Promise.all(Array.from({ length: workers }, () => worker()));

    console.log(
        `\nTotal: [${total}] \n✅ Completed: [${completed}] \n❌ Failed: [${failed}] ${
            failed === 0 ? " \nGreat job! 🎉" : ""
        } `,
    );
    if (failed > 0) {
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
            if (sub.isFile() && sub.name.endsWith(".js")) {
                examples.push(path.join(entry.name, sub.name));
            }
        }
    }

    console.log(
        `Running ${examples.length} examples with concurrency ${concurrency}...\n`,
    );

    void runInParallel(examples, concurrency);
});
