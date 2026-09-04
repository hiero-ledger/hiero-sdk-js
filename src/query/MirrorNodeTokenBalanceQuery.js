// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import MirrorNodeTokenBalance from "../account/MirrorNodeTokenBalance.js";
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
 */

/**
 * Relevant subset of `GET /api/v1/accounts/{id}/tokens`.
 *
 * @typedef {object} MirrorTokensResponse
 * @property {?{token_id: string, balance: number, decimals: number}[]} tokens
 */

/**
 * Mirror-node REST query for a single token balance held by an account.
 *
 * `AccountBalanceQuery` used to return every token balance alongside the HBAR
 * balance, and `AccountInfoQuery.tokenRelationships` is deprecated as of
 * HIP-367 (and truncated at 1000 relationships), so this is the supported way
 * to read a token balance.
 *
 * Reads `GET /api/v1/accounts/{id}/tokens?token.id={tokenId}` — a single
 * request, scoped to one token, so there is no pagination to walk. Pure HTTP:
 * no query payment, no node rotation, no gRPC, so this class deliberately does
 * not extend `Query`.
 *
 * Both `setAccountId` and `setTokenId` are required.
 *
 * NOTE ON CONSISTENCY: the mirror node ingests consensus state asynchronously
 * and typically lags the network by a few seconds. Results are therefore NOT
 * read-after-write consistent — a balance read immediately after a transfer may
 * still show the pre-transfer value.
 *
 * NOTE ON PRECISION: the balance is parsed from a JSON number, so values above
 * `Number.MAX_SAFE_INTEGER` (2^53 - 1) silently lose precision.
 */
export default class MirrorNodeTokenBalanceQuery {
    /**
     * @param {object} [props]
     * @param {AccountId | string} [props.accountId]
     * @param {TokenId | string} [props.tokenId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?TokenId}
         */
        this._tokenId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account whose token balance to read.
     *
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId;
        return this;
    }

    /**
     * @returns {?TokenId}
     */
    get tokenId() {
        return this._tokenId;
    }

    /**
     * Set the token to read the balance of. Required.
     *
     * @param {TokenId | string} tokenId
     * @returns {this}
     */
    setTokenId(tokenId) {
        this._tokenId =
            typeof tokenId === "string" ? TokenId.fromString(tokenId) : tokenId;
        return this;
    }

    /**
     * @param {Client} client
     * @param {number} [requestTimeout] - total timeout for the whole
     * operation in milliseconds; defaults to `client.requestTimeout`
     * @returns {Promise<MirrorNodeTokenBalance>}
     */
    async execute(client, requestTimeout) {
        const accountIdString = this._accountIdString();
        const tokenId = this._requireTokenId();
        const baseUrl = client.mirrorRestApiBaseUrl;
        // One deadline for the whole operation (every retry) — the timeout is a
        // total operation budget, matching `Executable`, not a per-attempt bound.
        const timeoutMs = requestTimeout ?? client.requestTimeout;
        const deadline = timeoutMs != null ? Date.now() + timeoutMs : null;

        const response = /** @type {MirrorTokensResponse} */ (
            await this._fetchJson(
                `${baseUrl}/accounts/${encodeURIComponent(
                    accountIdString,
                )}/tokens?token.id=${encodeURIComponent(tokenId.toString())}`,
                client,
                deadline,
            )
        );

        // The endpoint returns an empty array (not a 404) when the account
        // holds no relationship with the token; the balance is zero then, and
        // the decimals are unknown from this response alone.
        const held = response.tokens?.[0];

        return new MirrorNodeTokenBalance({
            tokenId,
            balance: Long.fromValue(held?.balance ?? 0),
            decimals: held?.decimals ?? 0,
        });
    }

    /**
     * The `{id}` path segment the mirror node expects for the configured
     * account: `shard.realm.num`, a base32 alias, or a bare EVM address.
     *
     * @private
     * @returns {string}
     */
    _accountIdString() {
        if (this._accountId == null) {
            throw new Error(
                "MirrorNodeTokenBalanceQuery requires an accountId",
            );
        }

        const id = this._accountId;
        if (id.aliasKey != null) {
            // The mirror node only accepts the base32 alias; the DER hex that
            // `AccountId.toString()` emits is rejected with a 400.
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

    /**
     * @private
     * @returns {TokenId}
     */
    _requireTokenId() {
        if (this._tokenId == null) {
            throw new Error("MirrorNodeTokenBalanceQuery requires a tokenId");
        }
        return this._tokenId;
    }

    /**
     * GET the URL and parse the JSON body, retrying transient failures (5xx,
     * network/timeout) with exponential backoff. HTTP 4xx — a malformed ID —
     * throws immediately. `deadline` is the epoch-millisecond cutoff shared by
     * every attempt of the whole operation.
     *
     * @private
     * @param {string} url
     * @param {Client} client
     * @param {?number} deadline
     * @returns {Promise<unknown>}
     */
    async _fetchJson(url, client, deadline) {
        const maxAttempts = client.maxAttempts;
        const maxBackoff = client.maxBackoff;
        let backoff = Math.min(client.minBackoff, maxBackoff);
        /** @type {?Error} */
        let lastError = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const remaining = deadline != null ? deadline - Date.now() : null;
            if (remaining != null && remaining <= 0) {
                throw (
                    lastError ??
                    new Error(
                        `Failed to query ${url}: request timeout exceeded`,
                    )
                );
            }

            try {
                // eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(url, {
                    method: "GET",
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                    // Guarded because React Native's fetch polyfill does not
                    // provide AbortSignal.timeout.
                    signal:
                        remaining != null &&
                        typeof AbortSignal !== "undefined" &&
                        typeof AbortSignal.timeout === "function"
                            ? AbortSignal.timeout(remaining)
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
