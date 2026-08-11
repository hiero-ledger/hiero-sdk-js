// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import ContractId from "../contract/ContractId.js";
import AccountBalance from "../account/AccountBalance.js";
import TokenId from "../token/TokenId.js";
import * as EntityIdHelper from "../EntityIdHelper.js";
import {
    isRetryableNetworkError,
    readErrorDetail,
} from "../network/mirrorRestRetry.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("@hiero-ledger/proto").proto.ITokenBalance} ITokenBalance
 */

/**
 * Relevant subset of `GET /api/v1/accounts/{id}`. The embedded
 * `balance.tokens` array is a truncated preview and is deliberately not
 * read here — the full token list comes from the `/tokens` sub-resource.
 *
 * @typedef {object} MirrorAccountResponse
 * @property {?{balance: ?number}} balance
 */

/**
 * One entry of `GET /api/v1/accounts/{id}/tokens`.
 *
 * @typedef {object} MirrorTokenRelationship
 * @property {string} token_id
 * @property {number} balance
 * @property {?number} decimals
 */

/**
 * Paging envelope of `GET /api/v1/accounts/{id}/tokens`.
 *
 * @typedef {object} MirrorAccountTokensResponse
 * @property {?MirrorTokenRelationship[]} tokens
 * @property {?{next: ?string}} links
 */

/**
 * Initial retry backoff in milliseconds for transient mirror errors.
 * @constant {number}
 */
const INITIAL_BACKOFF_MS = 250;

/**
 * Mirror-node REST replacement for the deprecated `AccountBalanceQuery`.
 *
 * Reads `GET /api/v1/accounts/{id}` for the hbar balance and
 * `GET /api/v1/accounts/{id}/tokens` (following every page) for the token
 * balances and decimals. Pure HTTP — no query payment, no node rotation,
 * no gRPC — so this class deliberately does not extend `Query`.
 *
 * Accepts either an account ID or a contract ID; both are resolved through
 * the mirror node's `accounts` endpoints, which accept contract IDs too.
 * An `AccountId` carrying an `aliasKey` or an `evmAddress` is sent in the
 * form the mirror node understands (base32 alias / bare EVM address)
 * rather than `AccountId.toString()`.
 *
 * NOTE ON CONSISTENCY: the mirror node ingests consensus state
 * asynchronously and typically lags the network by a few seconds. Results
 * are therefore NOT read-after-write consistent — unlike the consensus-node
 * `AccountBalanceQuery` this replaces, a balance read immediately after a
 * transfer may still show the pre-transfer value.
 */
export default class MirrorNodeAccountBalanceQuery {
    /**
     * @param {object} [props]
     * @param {AccountId | string} [props.accountId]
     * @param {ContractId | string} [props.contractId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?ContractId}
         */
        this._contractId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account whose balance to read. Mutually exclusive with
     * `setContractId`.
     *
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        if (this._contractId != null) {
            throw new Error(
                "MirrorNodeAccountBalanceQuery accepts either an account ID or a contract ID, not both",
            );
        }

        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId;
        return this;
    }

    /**
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * Set the contract whose balance to read. Mutually exclusive with
     * `setAccountId`.
     *
     * @param {ContractId | string} contractId
     * @returns {this}
     */
    setContractId(contractId) {
        if (this._accountId != null) {
            throw new Error(
                "MirrorNodeAccountBalanceQuery accepts either an account ID or a contract ID, not both",
            );
        }

        this._contractId =
            typeof contractId === "string"
                ? ContractId.fromString(contractId)
                : contractId;
        return this;
    }

    /**
     * @param {Client} client
     * @returns {Promise<AccountBalance>}
     */
    async execute(client) {
        const idString = this._idString();
        const baseUrl = client.mirrorRestApiBaseUrl;

        const account = /** @type {MirrorAccountResponse} */ (
            await this._fetchJson(`${baseUrl}/accounts/${idString}`, client)
        );

        /** @type {ITokenBalance[]} */
        const tokenBalances = [];

        let url = `${baseUrl}/accounts/${idString}/tokens`;
        for (;;) {
            const page = /** @type {MirrorAccountTokensResponse} */ (
                await this._fetchJson(url, client)
            );

            for (const entry of page.tokens ?? []) {
                tokenBalances.push({
                    tokenId: TokenId.fromString(entry.token_id)._toProtobuf(),
                    balance: Long.fromValue(entry.balance),
                    decimals: entry.decimals ?? 0,
                });
            }

            const next = page.links?.next;
            if (next == null) {
                break;
            }
            // `links.next` is a root-absolute path, so resolve it against
            // the mirror node origin.
            url = new URL(next, baseUrl).toString();
        }

        // `AccountBalance`'s constructor is private, so reuse the same
        // internal factory the gRPC path uses; it owns the token
        // balance/decimal map building.
        return AccountBalance._fromProtobuf({
            balance: Long.fromValue(account.balance?.balance ?? 0),
            tokenBalances,
        });
    }

    /**
     * The path segment the mirror node expects for the configured ID.
     *
     * @private
     * @returns {string}
     */
    _idString() {
        if (this._accountId != null) {
            const id = this._accountId;
            if (id.aliasKey != null) {
                // The mirror node only accepts the base32 alias; the DER hex
                // that `AccountId.toString()` emits is rejected with a 400.
                const alias = EntityIdHelper.publicKeyToAlias(id.aliasKey);
                if (alias != null) {
                    return alias;
                }
            }
            if (id.evmAddress != null) {
                return id.evmAddress.toString();
            }
            return id.toString();
        }

        if (this._contractId != null) {
            const id = this._contractId;
            if (id.evmAddress != null) {
                return EntityIdHelper.toEvmAddress(id.evmAddress);
            }
            return id.toString();
        }

        throw new Error(
            "MirrorNodeAccountBalanceQuery requires an account ID or a contract ID",
        );
    }

    /**
     * GET the URL and parse the JSON body, retrying transient failures
     * (5xx, network/timeout) with exponential backoff. HTTP 4xx — an
     * unknown or malformed ID — throws immediately.
     *
     * @private
     * @param {string} url
     * @param {Client} client
     * @returns {Promise<unknown>}
     */
    async _fetchJson(url, client) {
        const maxAttempts = client.maxAttempts;
        const maxBackoff = client.maxBackoff;
        let backoff = Math.min(INITIAL_BACKOFF_MS, maxBackoff);
        /** @type {?Error} */
        let lastError = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(url, {
                    method: "GET",
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                    signal:
                        client.requestTimeout &&
                        typeof AbortSignal !== "undefined" &&
                        typeof AbortSignal.timeout === "function"
                            ? AbortSignal.timeout(client.requestTimeout)
                            : undefined,
                });

                if (response.ok) {
                    const responseJson = /** @type {unknown} */ (
                        await response.json()
                    );
                    return responseJson;
                }

                const detail = await readErrorDetail(response);
                const error = new Error(
                    `Failed to query ${url}: HTTP ${response.status}${
                        detail ? `: ${detail}` : ""
                    }`,
                );

                if (response.status >= 500 && attempt < maxAttempts) {
                    lastError = error;
                    await sleep(backoff);
                    backoff = Math.min(backoff * 2, maxBackoff);
                    continue;
                }

                throw error;
            } catch (err) {
                lastError = /** @type {Error} */ (err);
                if (attempt < maxAttempts && isRetryableNetworkError(err)) {
                    await sleep(backoff);
                    backoff = Math.min(backoff * 2, maxBackoff);
                    continue;
                }
                throw lastError;
            }
        }

        throw lastError ?? new Error(`Failed to query ${url}`);
    }
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
