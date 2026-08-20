// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import MirrorNodeAccountBalance from "../account/MirrorNodeAccountBalance.js";
import PrecheckStatusError from "../PrecheckStatusError.js";
import Status from "../Status.js";
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
 * Only the HBAR balance is returned (see {@link MirrorNodeAccountBalance}).
 *
 * An account the mirror node does not know returns an empty result rather
 * than a 404; the SDK maps that to a {@link PrecheckStatusError} carrying
 * {@link Status.InvalidAccountId}, the status `AccountBalanceQuery`
 * reported. An account that exists holding nothing returns `"balance": 0`,
 * so a real zero is never mistaken for a missing account.
 *
 * Eventual consistency: the mirror node trails the network by a few
 * seconds, and the lag covers the account's existence as well as its
 * balance — a just-created account transiently fails with
 * `INVALID_ACCOUNT_ID`, so retry rather than treat the first failure as
 * final.
 *
 * A deleted account reads as a zero balance: the balances endpoint does not
 * expose the deleted flag, so unlike `AccountBalanceQuery` this query cannot
 * report `ACCOUNT_DELETED`. Use `/accounts/{id}` if that matters.
 *
 * Precision: the balance is parsed from a JSON number, so values above
 * `Number.MAX_SAFE_INTEGER` (2^53 - 1 tinybars, roughly 90M hbar) silently
 * lose precision, unlike the protobuf-based `AccountBalanceQuery`.
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
     * @throws {PrecheckStatusError} with {@link Status.InvalidAccountId} if
     * the mirror node knows no such account
     */
    async execute(client, requestTimeout) {
        const idString = this._idString();
        const baseUrl = client.mirrorRestApiBaseUrl;
        // One deadline for the whole operation (every retry) — the
        // timeout is a total operation budget, matching `Executable`,
        // not a per-attempt bound.
        const timeoutMs = requestTimeout ?? client.requestTimeout;
        const deadline = timeoutMs != null ? Date.now() + timeoutMs : null;

        const url = `${baseUrl}/balances?account.id=${encodeURIComponent(
            idString,
        )}`;

        const response = /** @type {MirrorBalancesResponse} */ (
            await this._fetchJson(url, client, deadline)
        );

        if (!Array.isArray(response.balances)) {
            throw new Error(
                `Failed to query ${url}: response has no balances array`,
            );
        }

        // An existing account with no hbar still has a `"balance": 0` entry, so
        // an empty list means the account is unknown.
        if (response.balances.length === 0) {
            throw new PrecheckStatusError({
                status: Status.InvalidAccountId,
                transactionId: null,
                nodeId: null,
                contractFunctionResult: null,
            });
        }

        return new MirrorNodeAccountBalance({
            hbars: Hbar.fromTinybars(
                Long.fromValue(response.balances[0].balance),
            ),
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
