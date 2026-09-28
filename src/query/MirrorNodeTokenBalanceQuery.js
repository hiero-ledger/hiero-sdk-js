// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import MirrorNodeStatusError from "../MirrorNodeStatusError.js";
import MirrorNodeTokenBalance from "../account/MirrorNodeTokenBalance.js";
import Status from "../Status.js";
import TokenId from "../token/TokenId.js";
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
 * Relevant subset of `GET /api/v1/accounts/{id}/tokens`.
 *
 * @typedef {object} MirrorTokensResponse
 * @property {?{token_id: string, balance: number | string, decimals: number}[]} tokens
 */

/**
 * Mirror-node REST query for a single token balance held by an account.
 *
 * `AccountBalanceQuery` used to return every token balance alongside the HBAR
 * balance, and `AccountInfoQuery.tokenRelationships` is deprecated as of
 * HIP-367 (and truncated at 1000 relationships), so this is the supported way
 * to read a token balance.
 *
 * Reads `GET /api/v1/accounts/{id}/tokens?token.id={tokenId}` through the
 * client's shared HTTP transport: a single request, scoped to one token, so
 * there is no pagination to walk. Pure HTTP: no query payment, no node
 * rotation, no gRPC, so this class deliberately does not extend `Query`.
 * Retry, backoff and timeouts follow the client's `MirrorNodeHttpRetryPolicy`
 * (see `Client.setMirrorNodeHttpConfig`).
 *
 * Both `setAccountId` and `setTokenId` are required.
 *
 * NOTE ON STABILITY: the cross-SDK proposal for this query
 * (hiero-ledger/sdk-collaboration-hub#281) is still under review, and its
 * current draft returns a page with a cursor and an optional token filter
 * rather than a single balance. This single-token form is shipping now to meet
 * the consensus node release 0.77 cutoff, so **this API may change once that
 * proposal is finalized**.
 *
 * An account the mirror node does not know throws a {@link MirrorNodeStatusError}
 * carrying {@link Status.InvalidAccountId}, matching
 * `MirrorNodeAccountBalanceQuery`. An account that exists but holds no
 * relationship with the token returns a zero balance with zero decimals, since
 * the decimals are not knowable from that response.
 *
 * NOTE ON CONSISTENCY: the mirror node ingests consensus state asynchronously
 * and typically lags the network by a few seconds. Results are therefore NOT
 * read-after-write consistent: a balance read immediately after a transfer may
 * still show the pre-transfer value.
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
     * operation in milliseconds, every retry included; defaults to the
     * retry policy's `totalDeadline`, which in turn defaults to
     * `client.requestTimeout`
     * @returns {Promise<MirrorNodeTokenBalance>}
     */
    async execute(client, requestTimeout) {
        const accountIdString = this._accountIdString();
        const tokenId = this._requireTokenId();
        const http = client._mirrorNodeHttpClient({
            family: "rest",
            totalDeadline: requestTimeout,
        });

        const path = `/accounts/${encodeURIComponent(
            accountIdString,
        )}/tokens?token.id=${encodeURIComponent(tokenId.toString())}`;
        const url = `${http.baseUrl}${path}`;

        /** @type {MirrorTokensResponse} */
        let response;
        try {
            const httpResponse = await http.get(path);

            // Unlike `/balances`, this endpoint 404s for an account it does
            // not know. Report that the same way
            // `MirrorNodeAccountBalanceQuery` does, so callers can match on
            // `status` rather than on the error class.
            if (httpResponse.statusCode === 404) {
                throw new MirrorNodeStatusError(
                    { status: Status.InvalidAccountId },
                    `account ${accountIdString} was not found on the mirror node`,
                );
            }
            if (!httpResponse.ok) {
                throw new Error(statusMessage(httpResponse));
            }
            response = /** @type {MirrorTokensResponse} */ (
                bodyJson(httpResponse)
            );
        } catch (error) {
            if (error instanceof MirrorNodeStatusError) {
                throw error;
            }
            throw new Error(`Failed to query ${url}: ${errorMessage(error)}`, {
                cause: error,
            });
        }

        // An empty or foreign body is not an account with no tokens.
        if (!Array.isArray(response?.tokens)) {
            throw new Error(
                `Failed to query ${url}: response has no tokens array`,
            );
        }

        // The endpoint returns an empty array (not a 404) when the account
        // holds no relationship with the token; the balance is zero then, and
        // the decimals are unknown from this response alone.
        const held = response.tokens[0];

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
}
