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
    "./simple_rest_signature_provider",
];
const excludedJSFile = [
    "run-all-examples.js",
    "consensus-pub-sub.js",
    "create-update-delete-node.js",
    "batch-tx.js",
    "long-term-schedule-transaction.js",
    "mirror-node-contract-queries-example.js",
    "node-client-async-testnet.js",
];
const cmd = process.env.NODE_COMMAND;
const concurrency = Math.max(1, parseInt(process.env.EXAMPLES_CONCURRENCY || "4", 10));

function runExample(examplePath, file) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, [examplePath], {
            stdio: "ignore",
        });
        child.on("close", (code) => {
            resolve({ file, code });
        });
        child.on("error", reject);
    });
}

async function runInParallel(examples, maxConcurrency) {
    let completed = 0;
    let failed = 0;
    const total = examples.length;
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;
            if (index >= total) break;
            const file = examples[index];
            const examplePath = path.join(examplesDirectory, file);
            console.log(`\n⏳ ${index + 1}/${total}. Running ${file}...`);
            const { file: f, code } = await runExample(examplePath, file);
            if (code === 0) {
                completed += 1;
                console.log(`✅ ${f} completed.`);
            } else {
                failed += 1;
                console.log(`❌ ${f} failed with code ${code}.`);
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

fs.readdir(examplesDirectory, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        process.exit(1);
    }

    if (cmd === undefined) {
        throw new Error("Environment variable NODE_COMMAND is required.");
    }

    const isPathStartsWith = (
        /** @type {string} */ file,
        /** @type {string} */ directory,
    ) => path.join(examplesDirectory, file).startsWith(directory);

    const examples = files.filter(
        (file) =>
            file.endsWith(".js") &&
            !excludedJSFile.includes(file) &&
            excludedDirectories.some(
                (directory) => !isPathStartsWith(directory, file),
            ),
    );

    console.log(`Running ${examples.length} examples with concurrency ${concurrency}...\n`);

    runInParallel(examples, concurrency);
});
