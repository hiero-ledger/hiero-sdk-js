// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import LiveHash from "./LiveHash.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.ICryptoGetLiveHashQuery} HashgraphProto.proto.ICryptoGetLiveHashQuery
 * @typedef {import("@hashgraph/proto").proto.ICryptoGetLiveHashResponse} HashgraphProto.proto.ICryptoGetLiveHashResponse
 * @typedef {import("@hashgraph/proto").proto.ILiveHash} HashgraphProto.proto.ILiveHash
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * @augments {Query<LiveHash>}
 * @deprecated
 * Тhis query is no longer supported.
 */
export default class LiveHashQuery extends Query {
    /**
     * @param {object} [props]
     * @param {AccountId | string} [props.accountId]
     * @param {Uint8Array} [props.hash]
     */
    constructor(props = {}) {
        super();

        /**
         * @type {?AccountId}
         * @private
         */
        this._accountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        /**
         * @type {?Uint8Array}
         * @private
         */
        this._hash = null;

        if (props.hash != null) {
            this.setHash(props.hash);
        }
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {LiveHashQuery}
     */
    static _fromProtobuf(query) {
        const hash =
            /** @type {HashgraphProto.proto.ICryptoGetLiveHashQuery} */ (
                query.cryptoGetLiveHash
            );

        // eslint-disable-next-line deprecation/deprecation
        return new LiveHashQuery({
            accountId:
                hash.accountID != null
                    ? AccountId._fromProtobuf(hash.accountID)
                    : undefined,
            hash: hash.hash != null ? hash.hash : undefined,
        });
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account to which the livehash is associated.
     *
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId =
            accountId instanceof AccountId
                ? accountId
                : AccountId.fromString(accountId);

        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get liveHash() {
        return this._hash;
    }

    /**
     * Set the SHA-384 data in the livehash.
     *
     * @param {Uint8Array} hash
     * @returns {this}
     */
    setHash(hash) {
        this._hash = hash;

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<HashgraphProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.getLiveHash(request);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const cryptoGetLiveHash =
            /** @type {HashgraphProto.proto.ICryptoGetLiveHashResponse} */ (
                response.cryptoGetLiveHash
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            cryptoGetLiveHash.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {Promise<LiveHash>}
     */
    _mapResponse(response) {
        const hashes =
            /** @type {HashgraphProto.proto.ICryptoGetLiveHashResponse} */ (
                response.cryptoGetLiveHash
            );

        return Promise.resolve(
            LiveHash._fromProtobuf(
                /** @type {HashgraphProto.proto.ILiveHash} */ (hashes.liveHash),
            ),
        );
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IQueryHeader} header
     * @returns {HashgraphProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            cryptoGetLiveHash: {
                header,
                accountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
                hash: this._hash,
            },
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp =
            this._paymentTransactionId != null &&
            this._paymentTransactionId.validStart != null
                ? this._paymentTransactionId.validStart
                : this._timestamp;

        return `LiveHashQuery:${timestamp.toString()}`;
    }
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/unbound-method, deprecation/deprecation
QUERY_REGISTRY.set("cryptoGetLiveHash", LiveHashQuery._fromProtobuf);
