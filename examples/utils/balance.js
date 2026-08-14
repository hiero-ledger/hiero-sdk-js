import {
    AccountInfoQuery,
    MirrorNodeAccountBalanceQuery,
} from "@hiero-ledger/sdk";

/**
 * Reading account balances after the removal of `AccountBalanceQuery`.
 *
 * The consensus node no longer serves `CryptoService/cryptoGetBalance`, so
 * balances come from two places now:
 *
 * - HBAR: `MirrorNodeAccountBalanceQuery`, the direct replacement. It reads
 *   `GET /api/v1/balances` and needs no query payment.
 * - Tokens: the mirror node balance query deliberately returns HBAR only, so
 *   token balances are read from `AccountInfoQuery`, which the consensus node
 *   still serves and which is immediately consistent.
 *
 * @typedef {import("@hiero-ledger/sdk").Client} Client
 * @typedef {import("@hiero-ledger/sdk").AccountId} AccountId
 * @typedef {import("@hiero-ledger/sdk").TokenId} TokenId
 * @typedef {import("@hiero-ledger/sdk").Hbar} Hbar
 * @typedef {import("long")} Long
 */

/**
 * An account's balances, keyed the way the removed `AccountBalance` was.
 * `tokens` is keyed by the stringified token ID.
 *
 * @typedef {object} Balance
 * @property {Hbar} hbars
 * @property {Map<string, Long>} tokens
 */

/**
 * How long to give the mirror node to ingest the latest consensus state.
 * The mirror node lags the network by a few seconds, so a balance read
 * immediately after a transfer can still return the pre-transfer value.
 */
const MIRROR_NODE_LAG_MS = 3000;

/**
 * Wait for the mirror node to catch up with consensus.
 *
 * Call this between a transaction and an HBAR balance read, otherwise the
 * balance may still be the pre-transaction one.
 *
 * @returns {Promise<void>}
 */
export function waitForMirrorNode() {
    return new Promise((resolve) => setTimeout(resolve, MIRROR_NODE_LAG_MS));
}

/**
 * Read an account's HBAR balance, from the mirror node.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @returns {Promise<{hbars: Hbar}>}
 */
export async function getAccountBalance(client, accountId) {
    return { hbars: await getHbarBalance(client, accountId) };
}

/**
 * Read an account's HBAR and token balances.
 *
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @returns {Promise<Balance>}
 */
export async function getAccountBalanceWithTokens(client, accountId) {
    const info = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client);

    /** @type {Map<string, Long>} */
    const tokens = new Map();

    for (const [tokenId, relationship] of info.tokenRelationships) {
        tokens.set(tokenId.toString(), relationship.balance);
    }

    return { hbars: info.balance, tokens };
}

/**
 * Read only an account's HBAR balance, from the mirror node.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @returns {Promise<Hbar>}
 */
export async function getHbarBalance(client, accountId) {
    const balance = await new MirrorNodeAccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

    return balance.hbars;
}

/**
 * Read every token balance held by an account, keyed by the stringified token
 * ID: `tokens.get(tokenId.toString())` is a `Long`, or `undefined` when the
 * account does not hold the token.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @returns {Promise<Map<string, Long>>}
 */
export async function getTokenBalances(client, accountId) {
    return (await getAccountBalanceWithTokens(client, accountId)).tokens;
}

/**
 * Read an account's balance of a single token.
 *
 * @param {Client} client
 * @param {AccountId | string} accountId
 * @param {TokenId | string} tokenId
 * @returns {Promise<Long | undefined>}
 */
export async function getTokenBalance(client, accountId, tokenId) {
    const tokens = await getTokenBalances(client, accountId);

    return tokens.get(tokenId.toString());
}
