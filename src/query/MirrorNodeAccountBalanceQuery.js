// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import MirrorNodeAccountBalance from "../account/MirrorNodeAccountBalance.js";
import Hbar from "../Hbar.js";
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
 * Relevant subset of `GET /api/v1/balances`.
 *
 * @typedef {object} MirrorBalancesResponse
 * @property {?{account: string, balance: number}[]} balances
 */

/**
 * Mirror-node REST replacement for the deprecated `AccountBalanceQuery`.
 *
 * Reads the HBAR balance from `GET /api/v1/balances?account.id={id}`.
 * Pure HTTP — no query payment, no node rotation, no gRPC — so this class
 * deliberately does not extend `Query`.
 *
 * `setAccountId` accepts everything the mirror node resolves:
 * `shard.realm.num`, an EVM address, a public key alias, or a contract ID.
 * An `AccountId` carrying an `aliasKey` or an `evmAddress` is sent in the
 * form the mirror node understands (base32 alias / bare EVM address)
 * rather than `AccountId.toString()`.
 *
 * Token balances are deliberately not returned (see
 * {@link MirrorNodeAccountBalance}).
 *
 * NOTE ON CONSISTENCY: the mirror node ingests consensus state
 * asynchronously and typically lags the network by a few seconds. Results
 * are therefore NOT read-after-write consistent — unlike the consensus-node
 * `AccountBalanceQuery` this replaces, a balance read immediately after a
 * transfer may still show the pre-transfer value.
 *
 * NOTE ON PRECISION: the balance is parsed from a JSON number, so values
 * above `Number.MAX_SAFE_INTEGER` (2^53 - 1 tinybars, roughly 90M hbar)
 * silently lose precision — unlike the protobuf-based
 * `AccountBalanceQuery`. Lossless parsing is tracked as a follow-up.
 */
export default class MirrorNodeAccountBalanceQuery {
    /**
     * @param {object} [props]
     * @param {AccountId | string} [props.accountId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account whose balance to read. Contract IDs are accepted
     * too — the mirror node balances endpoint resolves them.
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
     * @param {Client} client
     * @param {number} [requestTimeout] - total timeout for the whole
     * operation in milliseconds; defaults to `client.requestTimeout`
     * @returns {Promise<MirrorNodeAccountBalance>}
     */
    async execute(client, requestTimeout) {
        const idString = this._idString();
        const baseUrl = client.mirrorRestApiBaseUrl;
        // One deadline for the whole operation (every retry) — the
        // timeout is a total operation budget, matching `Executable`,
        // not a per-attempt bound.
        const timeoutMs = requestTimeout ?? client.requestTimeout;
        const deadline = timeoutMs != null ? Date.now() + timeoutMs : null;

        const response = /** @type {MirrorBalancesResponse} */ (
            await this._fetchJson(
                `${baseUrl}/balances?account.id=${encodeURIComponent(
                    idString,
                )}`,
                client,
                deadline,
            )
        );

        // The balances endpoint returns an empty array (not a 404) for an
        // account that does not exist; the balance is zero in that case.
        const balance = response.balances?.[0]?.balance ?? 0;

        return new MirrorNodeAccountBalance({
            hbars: Hbar.fromTinybars(Long.fromValue(balance)),
        });
    }

    /**
     * The `account.id` value the mirror node expects for the configured ID.
     *
     * @private
     * @returns {string}
     */
    _idString() {
        if (this._accountId == null) {
            throw new Error(
                "MirrorNodeAccountBalanceQuery requires an account ID",
            );
        }

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

    /**
     * GET the URL and parse the JSON body, retrying transient failures
     * (5xx, network/timeout) with exponential backoff. HTTP 4xx — a
     * malformed ID — throws immediately. `deadline` is the
     * epoch-millisecond cutoff shared by every attempt of the whole
     * operation.
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
                    // Guarded because React Native's fetch polyfill does
                    // not provide AbortSignal.timeout.
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
