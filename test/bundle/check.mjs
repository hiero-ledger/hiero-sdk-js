/**
 * Loads one bundle of test/bundle/app.js and runs every check against it,
 * printing the results as JSON. test/bundle/run.mjs starts this in a fresh
 * process per bundle and decides which results are failures.
 *
 *   node test/bundle/check.mjs <bundle.mjs> <inputs.json>
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [bundle, inputsFile] = process.argv.slice(2);

const inputs = JSON.parse(readFileSync(inputsFile, "utf8"));
const app = await import(pathToFileURL(bundle).href);

const results = {};

for (const [kase, bytes] of Object.entries(inputs.transactions)) {
    results[`transaction:${kase}`] = app.transactionFromBytes(bytes);
}

for (const [kase, bytes] of Object.entries(inputs.queries)) {
    results[`query:${kase}`] = app.queryFromBytes(bytes);
}

results["batch:inner transactions"] = app.transactionFromBytes(inputs.batch);
results["schedule:TopicMessageSubmitTransaction"] = app.schedule();

for (const [name, bytes] of Object.entries(inputs.keyTransactions)) {
    results[`key:${name}`] = app.accountUpdateKey(bytes);
}

for (const [name, bytes] of Object.entries(inputs.ethereum)) {
    results[`ethereum:${name}`] = app.ethereumTransactionDataFromBytes(bytes);
}

process.stdout.write(JSON.stringify(results));
