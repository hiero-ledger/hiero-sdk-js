// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import TopicId from "./TopicId.js";
import TopicInfo from "./TopicInfo.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.IConsensusGetTopicInfoResponse} HashgraphProto.proto.IConsensusGetTopicInfoResponse
 * @typedef {import("@hashgraph/proto").proto.IConsensusGetTopicInfoQuery} HashgraphProto.proto.IConsensusGetTopicInfoQuery
 */

/**
 * @namespace com
 * @typedef {import("@hashgraph/proto").com.hedera.mirror.api.proto.IConsensusTopicResponse} com.hedera.mirror.api.proto.IConsensusTopicResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Retrieve the latest state of a topic.
 *
 * @augments {Query<TopicInfo>}
 */
export default class TopicInfoQuery extends Query {
    /**
     * @param {object} [props]
     * @param {TopicId | string} [props.topicId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?TopicId}
         */
        this._topicId = null;

        if (props.topicId != null) {
            this.setTopicId(props.topicId);
        }
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {TopicInfoQuery}
     */
    static _fromProtobuf(query) {
        const info =
            /** @type {HashgraphProto.proto.IConsensusGetTopicInfoQuery} */ (
                query.consensusGetTopicInfo
            );

        return new TopicInfoQuery({
            topicId:
                info.topicID != null
                    ? TopicId._fromProtobuf(info.topicID)
                    : undefined,
        });
    }

    /**
     * @returns {?TopicId}
     */
    get topicId() {
        return this._topicId;
    }

    /**
     * Set the topic ID for which the info is being requested.
     *
     * @param {TopicId | string} topicId
     * @returns {TopicInfoQuery}
     */
    setTopicId(topicId) {
        this._topicId =
            typeof topicId === "string"
                ? TopicId.fromString(topicId)
                : topicId.clone();

        return this;
    }

    /**
     * @override
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<Hbar>}
     */
    async getCost(client) {
        return super.getCost(client);
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._topicId != null) {
            this._topicId.validateChecksum(client);
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
        return channel.consensus.getTopicInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const consensusGetTopicInfo =
            /** @type {HashgraphProto.proto.IConsensusGetTopicInfoResponse} */ (
                response.consensusGetTopicInfo
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            consensusGetTopicInfo.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HashgraphProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<TopicInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        return Promise.resolve(
            TopicInfo._fromProtobuf(
                /** @type {HashgraphProto.proto.IConsensusGetTopicInfoResponse} */ (
                    response.consensusGetTopicInfo
                ),
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
            consensusGetTopicInfo: {
                header,
                topicID:
                    this._topicId != null ? this._topicId._toProtobuf() : null,
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

        return `TopicInfoQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("consensusGetTopicInfo", TopicInfoQuery._fromProtobuf);
