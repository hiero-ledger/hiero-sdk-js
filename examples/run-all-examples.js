import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
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
];
const cmd = process.env.NODE_COMMAND;

fs.readdir(examplesDirectory, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        return;
    }

    if (cmd === undefined) {
        throw new Error("Environment variable NODE_COMMAND is required.");
    }

    let completed = 0;
    let failed = 0;

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

    const total = examples.length;

    examples.forEach((file, index) => {
        console.log(`\n⏳ ${index + 1}. Running ${file}...`);
        const examplePath = path.join(examplesDirectory, file);

        const result = spawnSync(cmd, [examplePath], {
            stdio: "ignore",
        });

        if (result.status === 0) {
            completed += 1;
            console.log(`✅ Successfully executed.`);
        } else {
            failed += 1;
            throw new Error("Task failed");
        }
    });

    console.log(
        `\nTotal: [${total}] \n✅ Completed: [${completed}] \n❌ Failed: [${failed}] ${
            failed === 0 ? " \nGreat job! 🎉" : ""
        } `,
    );
});
