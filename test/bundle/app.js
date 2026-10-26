/**
 * The app that test/bundle/run.mjs bundles with each bundler. It imports only
 * base classes, never a concrete query, key or Ethereum transaction class, so
 * everything the lookups need has to reach the bundle through the SDK's own
 * registration (#3011, #4560). The two transaction classes it does import are
 * not what their checks look up: it schedules a TopicMessageSubmitTransaction
 * to check that ScheduleCreateTransaction is found, and decodes account
 * updates to check that their keys are parsed.
 */
import {
    AccountUpdateTransaction,
    EthereumTransactionData,
    Query,
    TopicMessageSubmitTransaction,
    Transaction,
} from "@hiero-ledger/sdk";

function decode(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function encode(bytes) {
    return btoa(String.fromCharCode(...bytes));
}

/**
 * Runs `fn` and reports whether it threw, so the runner can compare each
 * check against what it expects.
 */
function attempt(fn) {
    try {
        return { ok: true, value: fn() };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export function transactionFromBytes(base64) {
    return attempt(() => {
        Transaction.fromBytes(decode(base64));
    });
}

export function queryFromBytes(base64) {
    return attempt(() => {
        Query.fromBytes(decode(base64));
    });
}

/**
 * Schedules a transaction, which needs `ScheduleCreateTransaction` without the
 * app importing it.
 */
export function schedule() {
    return attempt(() => {
        new TopicMessageSubmitTransaction()
            .setTopicId("0.0.1")
            .setMessage("hi")
            .schedule();
    });
}

/**
 * Decodes an account update and reads its key, which the SDK parses through
 * the key classes registered in its cache.
 */
export function accountUpdateKey(base64) {
    return attempt(() => {
        const transaction = AccountUpdateTransaction.fromBytes(decode(base64));
        if (transaction.key == null) {
            throw new Error("the key was not parsed");
        }
    });
}

/**
 * Decodes signed Ethereum transaction bytes and returns them re-encoded, so
 * the runner can check the round trip without relying on class names, which
 * minification changes.
 */
export function ethereumTransactionDataFromBytes(base64) {
    return attempt(() =>
        encode(EthereumTransactionData.fromBytes(decode(base64)).toBytes()),
    );
}
