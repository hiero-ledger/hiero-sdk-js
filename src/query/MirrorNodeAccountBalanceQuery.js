// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import MirrorNodeAccountBalance from "../account/MirrorNodeAccountBalance.js";
import MirrorNodeStatusError from "../MirrorNodeStatusError.js";
import Status from "../Status.js";
import Hbar from "../Hbar.js";
import * as EntityIdHelper from "../EntityIdHelper.js";
import {
    bodyJson,
    errorMessage,
    statusMessage,
} from "../mirror_node/MirrorNodeHttpClient.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 */

/**
 * Relevant subset of `GET /api/v1/balances`.
 *
 * @typedef {object} MirrorBalancesResponse
 * @property {?{account: string, balance: number | string}[]} balances
 */

/**
 * Mirror-node REST replacement for the deprecated `AccountBalanceQuery`.
 *
 * Reads the HBAR balance from `GET /api/v1/balances?account.id={id}`
 * through the client's shared HTTP transport. Pure HTTP: no query payment,
 * no node rotation, no gRPC, so this class deliberately does not extend
 * `Query`. Retry, backoff and timeouts follow the client's
 * `MirrorNodeHttpRetryPolicy` (see `Client.setMirrorNodeHttpConfig`).
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
 * than a 404; the SDK maps that to a {@link MirrorNodeStatusError} carrying
 * {@link Status.InvalidAccountId}, the status `AccountBalanceQuery`
 * reported. An account that exists holding nothing returns `"balance": 0`,
 * so a real zero is never mistaken for a missing account.
 *
 * Eventual consistency: the mirror node trails the network by a few
 * seconds, and the lag covers the account's existence as well as its
 * balance. A just-created account transiently fails with
 * `INVALID_ACCOUNT_ID`, so retry rather than treat the first failure as
 * final.
 *
 * A deleted account reads as a zero balance: the balances endpoint does not
 * expose the deleted flag, so unlike `AccountBalanceQuery` this query cannot
 * report `ACCOUNT_DELETED`. Use `/accounts/{id}` if that matters.
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
     * too, since the mirror node balances endpoint resolves them.
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
     * operation in milliseconds, every retry included; defaults to the
     * retry policy's `totalDeadline`, which in turn defaults to
     * `client.requestTimeout`
     * @returns {Promise<MirrorNodeAccountBalance>}
     * @throws {MirrorNodeStatusError} with {@link Status.InvalidAccountId} if
     * the mirror node knows no such account
     */
    async execute(client, requestTimeout) {
        const idString = this._idString();
        const http = client._mirrorNodeHttpClient({
            family: "rest",
            totalDeadline: requestTimeout,
        });

        const path = `/balances?account.id=${encodeURIComponent(idString)}`;
        const url = `${http.baseUrl}${path}`;

        /** @type {MirrorBalancesResponse} */
        let response;
        try {
            const httpResponse = await http.get(path);
            if (!httpResponse.ok) {
                throw new Error(statusMessage(httpResponse));
            }
            response = /** @type {MirrorBalancesResponse} */ (
                bodyJson(httpResponse)
            );
        } catch (error) {
            // `cause` keeps the adapter's verdict (`retries-exhausted-error`,
            // `deadline-exceeded-error`, ...) and the last response.
            throw new Error(`Failed to query ${url}: ${errorMessage(error)}`, {
                cause: error,
            });
        }

        if (!Array.isArray(response?.balances)) {
            throw new Error(
                `Failed to query ${url}: response has no balances array`,
            );
        }

        // An existing account with no hbar still has a `"balance": 0` entry, so
        // an empty list means the account is unknown.
        if (response.balances.length === 0) {
            throw new MirrorNodeStatusError(
                { status: Status.InvalidAccountId },
                `account ${idString} was not found on the mirror node`,
            );
        }

        // `Long.fromValue` turns a non-number into 0 rather than failing, which
        // would reintroduce the silent-zero bug this query just fixed. A
        // string is a balance above 2^53 that `bodyJson` kept exact.
        const balance = response.balances[0].balance;
        if (
            typeof balance !== "number" &&
            !(typeof balance === "string" && /^-?\d+$/.test(balance))
        ) {
            throw new Error(`Failed to query ${url}: balance is not a number`);
        }

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
}
