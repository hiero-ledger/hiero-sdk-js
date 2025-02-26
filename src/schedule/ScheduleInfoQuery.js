// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import ScheduleId from "./ScheduleId.js";
import ScheduleInfo from "./ScheduleInfo.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HieroProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HieroProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HieroProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HieroProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.IScheduleInfo} HieroProto.proto.IScheduleInfo
 * @typedef {import("@hashgraph/proto").proto.IScheduleGetInfoQuery} HieroProto.proto.IScheduleGetInfoQuery
 * @typedef {import("@hashgraph/proto").proto.IScheduleGetInfoResponse} HieroProto.proto.IScheduleGetInfoResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Retrieve the metadata for a schedule.
 * @augments {Query<ScheduleInfo>}
 */
export default class ScheduleInfoQuery extends Query {
    /**
     * @param {object} properties
     * @param {ScheduleId | string} [properties.scheduleId]
     */
    constructor(properties = {}) {
        super();

        /**
         * @private
         * @type {?ScheduleId}
         */
        this._scheduleId = null;

        if (properties.scheduleId != null) {
            this.setScheduleId(properties.scheduleId);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.IQuery} query
     * @returns {ScheduleInfoQuery}
     */
    static _fromProtobuf(query) {
        const info = /** @type {HieroProto.proto.IScheduleGetInfoQuery} */ (
            query.scheduleGetInfo
        );

        return new ScheduleInfoQuery({
            scheduleId:
                info.scheduleID != null
                    ? ScheduleId._fromProtobuf(info.scheduleID)
                    : undefined,
        });
    }

    /**
     * @returns {?ScheduleId}
     */
    get scheduleId() {
        return this._scheduleId;
    }

    /**
     *
     * @param {ScheduleId | string} scheduleId
     * @returns {ScheduleInfoQuery}
     */
    setScheduleId(scheduleId) {
        this._scheduleId =
            typeof scheduleId === "string"
                ? ScheduleId.fromString(scheduleId)
                : scheduleId.clone();

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
        if (this._scheduleId != null) {
            this._scheduleId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.schedule.getScheduleInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const scheduleGetInfo =
            /** @type {HieroProto.proto.IScheduleGetInfoResponse} */ (
                response.scheduleGetInfo
            );
        return /** @type {HieroProto.proto.IResponseHeader} */ (
            scheduleGetInfo.header
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<ScheduleInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const info = /** @type {HieroProto.proto.IScheduleGetInfoResponse} */ (
            response.scheduleGetInfo
        );

        return Promise.resolve(
            ScheduleInfo._fromProtobuf(
                /** @type {HieroProto.proto.IScheduleInfo} */ (
                    info.scheduleInfo
                ),
            ),
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQueryHeader} header
     * @returns {HieroProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            scheduleGetInfo: {
                header,
                scheduleID:
                    this._scheduleId != null
                        ? this._scheduleId._toProtobuf()
                        : null,
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

        return `ScheduleInfoQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("scheduleGetInfo", ScheduleInfoQuery._fromProtobuf);
