import Query, { QUERY_REGISTRY } from "../query/Query.js";
import TopicId from "./TopicId.js";
import TopicInfo from "./TopicInfo.js";
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").IConsensusTopicQuery} proto.IConsensusTopicQuery
 * @typedef {import("@exodus/hashgraph-proto").IConsensusGetTopicInfoResponse} proto.IConsensusGetTopicInfoResponse
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
     * @param {proto.IQuery} query
     * @returns {TopicInfoQuery}
     */
    static _fromProtobuf(query) {
        const info = /** @type {proto.IConsensusTopicQuery} */ (
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
        let cost = await super.getCost(client);

        if (cost.toTinybars().greaterThan(25)) {
            return cost;
        } else {
            return Hbar.fromTinybars(25);
        }
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
     * @param {proto.IQuery} request
     * @returns {Promise<proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.consensus.getTopicInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const consensusGetTopicInfo =
            /** @type {proto.IConsensusGetTopicInfoResponse} */ (
                response.consensusGetTopicInfo
            );
        return /** @type {proto.IResponseHeader} */ (
            consensusGetTopicInfo.header
        );
    }

    /**
     * @protected
     * @override
     * @param {proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {proto.IQuery} request
     * @returns {Promise<TopicInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        return Promise.resolve(
            TopicInfo._fromProtobuf(
                /** @type {proto.IConsensusGetTopicInfoResponse} */ (
                    response.consensusGetTopicInfo
                )
            )
        );
    }

    /**
     * @override
     * @internal
     * @param {proto.IQueryHeader} header
     * @returns {proto.IQuery}
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
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("consensusGetTopicInfo", TopicInfoQuery._fromProtobuf);
