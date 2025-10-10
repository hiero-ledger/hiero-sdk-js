// SPDX-License-Identifier: Apache-2.0

import TransactionId from "../transaction/TransactionId.js";
import SubscriptionHandle from "./SubscriptionHandle.js";
import TopicMessage from "./TopicMessage.js";
import * as HieroProto from "@hashgraph/proto";
import TopicId from "./TopicId.js";
import Long from "long";
import Timestamp from "../Timestamp.js";
import { RST_STREAM } from "../Executable.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../channel/MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * @template {Channel} ChannelT
 * @typedef {import("../client/Client.js").default<ChannelT, MirrorChannel>} Client<ChannelT, MirrorChannel>
 */

/**
 * Represents a class that you can use to subscribe to
 * different topics on Hedera network.
 * @augments {Query<TopicMessageQuery>}
 */
export default class TopicMessageQuery {
    /**
     * @param {object} props
     * @param {TopicId | string} [props.topicId]
     * @param {Timestamp} [props.startTime]
     * @param {Timestamp} [props.endTime]
     * @param {(message: TopicMessage | null, error: Error)=> void} [props.errorHandler]
     * @param {() => void} [props.completionHandler]
     * @param {(error: MirrorError | Error | null) => boolean} [props.retryHandler]
     * @param {Long | number} [props.limit]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?TopicId}
         */
        this._topicId = null;
        if (props.topicId != null) {
            this.setTopicId(props.topicId);
        }

        /**
         * @private
         * @type {?Timestamp}
         */
        this._startTime = null;
        if (props.startTime != null) {
            this.setStartTime(props.startTime);
        }

        /**
         * @private
         * @type {?Timestamp}
         */
        this._endTime = null;
        if (props.endTime != null) {
            this.setEndTime(props.endTime);
        }

        /**
         * @private
         * @type {?Long}
         */
        this._limit = null;
        if (props.limit != null) {
            this.setLimit(props.limit);
        }

        /**
         * @private
         * @type {(message: TopicMessage | null, error: Error) => void}
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._errorHandler = (message, error) => {
            console.error(
                `Error attempting to subscribe to topic: ${
                    this._topicId != null ? this._topicId.toString() : ""
                }`,
            );
        };

        if (props.errorHandler != null) {
            this._errorHandler = props.errorHandler;
        }

        /*
         * @private
         * @type {((message: TopicMessage) => void) | null}
         */
        this._listener = null;

        /**
         * @private
         * @type {() => void}
         */
        this._completionHandler = () => {
            console.log(
                `Subscription to topic ${
                    this._topicId != null ? this._topicId.toString() : ""
                } complete`,
            );
        };

        if (props.completionHandler != null) {
            this._completionHandler = props.completionHandler;
        }

        /* The number of times we can retry the grpc call
         *
         * @internal
         * @type {number}
         */
        this._maxAttempts = 20;

        /**
         * This is the request's max backoff
         *
         * @internal
         * @type {number}
         */
        this._maxBackoff = 8000;

        /**
         * @private
         * @type {(error: MirrorError | Error | null) => boolean}
         */
        this._retryHandler = (error) => {
            if (error != null) {
                if (error instanceof Error) {
                    // Retry on all errors which are not `MirrorError` because they're
                    // likely lower level HTTP/2 errors
                    return true;
                } else {
                    // Retry on `NOT_FOUND`, `RESOURCE_EXHAUSTED`, `UNAVAILABLE`, and conditionally on `INTERNAL`
                    // if the message matches the right regex.
                    switch (error.code) {
                        // INTERNAL
                        // eslint-disable-next-line no-fallthrough
                        case 13:
                            return RST_STREAM.test(error.details.toString());
                        // NOT_FOUND
                        // eslint-disable-next-line no-fallthrough
                        case 5:
                        // RESOURCE_EXHAUSTED
                        // eslint-disable-next-line no-fallthrough
                        case 8:
                        // UNAVAILABLE
                        // eslint-disable-next-line no-fallthrough
                        case 14:
                        case 17:
                            return true;
                        default:
                            return false;
                    }
                }
            }

            return false;
        };

        if (props.retryHandler != null) {
            this._retryHandler = props.retryHandler;
        }

        /**
         * @private
         * @type {number}
         */
        this._attempt = 0;

        /**
         * @private
         * @type {SubscriptionHandle | null}
         */
        this._handle = null;

        this.setMaxBackoff(8000);
    }

    /**
     * @returns {?TopicId}
     */
    get topicId() {
        return this._topicId;
    }

    /**
     * @param {TopicId | string} topicId
     * @returns {TopicMessageQuery}
     */
    setTopicId(topicId) {
        this.requireNotSubscribed();

        this._topicId =
            typeof topicId === "string"
                ? TopicId.fromString(topicId)
                : topicId.clone();

        return this;
    }

    /**
     * @returns {?Timestamp}
     */
    get startTime() {
        return this._startTime;
    }

    /**
     * @param {Timestamp | Date | number} startTime
     * @returns {TopicMessageQuery}
     */
    setStartTime(startTime) {
        this.requireNotSubscribed();

        this._startTime =
            startTime instanceof Timestamp
                ? startTime
                : startTime instanceof Date
                ? Timestamp.fromDate(startTime)
                : new Timestamp(startTime, 0);
        return this;
    }

    /**
     * @returns {?Timestamp}
     */
    get endTime() {
        return this._endTime;
    }

    /**
     * @param {Timestamp | Date | number} endTime
     * @returns {TopicMessageQuery}
     */
    setEndTime(endTime) {
        this.requireNotSubscribed();

        this._endTime =
            endTime instanceof Timestamp
                ? endTime
                : endTime instanceof Date
                ? Timestamp.fromDate(endTime)
                : new Timestamp(endTime, 0);
        return this;
    }

    /**
     * @returns {?Long}
     */
    get limit() {
        return this._limit;
    }

    /**
     * @param {Long | number} limit
     * @returns {TopicMessageQuery}
     */
    setLimit(limit) {
        this.requireNotSubscribed();

        this._limit = limit instanceof Long ? limit : Long.fromValue(limit);

        return this;
    }

    /**
     * @param {(message: TopicMessage | null, error: Error)=> void} errorHandler
     * @returns {TopicMessageQuery}
     */
    setErrorHandler(errorHandler) {
        this._errorHandler = errorHandler;

        return this;
    }

    /**
     * @param {() => void} completionHandler
     * @returns {TopicMessageQuery}
     */
    setCompletionHandler(completionHandler) {
        this.requireNotSubscribed();

        this._completionHandler = completionHandler;

        return this;
    }

    /**
     * @param {number} attempts
     * @returns {this}
     */
    setMaxAttempts(attempts) {
        this.requireNotSubscribed();
        this._maxAttempts = attempts;
        return this;
    }

    /**
     * @param {number} backoff
     * @returns {this}
     */
    setMaxBackoff(backoff) {
        this.requireNotSubscribed();
        this._maxBackoff = backoff;
        return this;
    }

    /**
     * @param {Client<Channel>} client
     * @param {((message: TopicMessage | null, error: Error) => void) | null} errorHandler
     * @param {(message: TopicMessage) => void} listener
     * @returns {SubscriptionHandle}
     */
    subscribe(client, errorHandler, listener) {
        this._handle = new SubscriptionHandle();
        this._listener = listener;

        if (errorHandler != null) {
            this._errorHandler = errorHandler;
        }

        this._makeServerStreamRequest(client);

        return this._handle;
    }

    /**
     * Makes a server stream request to subscribe to topic messages
     * @private
     * @param {Client<Channel>} client
     * @returns {void}
     */
    _makeServerStreamRequest(client) {
        const request = this._buildConsensusRequest();
        /** @type {Map<string, HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse[]>} */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const list = new Map();

        const streamHandler = client._mirrorNetwork
            .getNextMirrorNode()
            .getChannel()
            .makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                request,
                (data) => this._handleMessage(data, list),
                (error) => this._handleError(error, client),
                this._completionHandler,
            );

        if (this._handle != null) {
            this._handle._setCall(() => streamHandler());
        }
    }

    requireNotSubscribed() {
        if (this._handle != null) {
            throw new Error(
                "Cannot change fields on an already subscribed query",
            );
        }
    }

    /**
     * @private
     * @param {TopicMessage} topicMessage
     */
    _passTopicMessage(topicMessage) {
        try {
            if (this._listener != null) {
                this._listener(topicMessage);
            } else {
                throw new Error("(BUG) listener is unexpectedly not set");
            }
        } catch (error) {
            this._errorHandler(topicMessage, /** @type {Error} */ (error));
        }
    }

    /**
     * Builds the consensus topic query request
     * @private
     * @returns {Uint8Array} Encoded consensus topic query
     */
    _buildConsensusRequest() {
        return HieroProto.com.hedera.mirror.api.proto.ConsensusTopicQuery.encode(
            {
                topicID: this._topicId?._toProtobuf() ?? null,
                consensusStartTime: this._startTime?._toProtobuf() ?? null,
                consensusEndTime: this._endTime?._toProtobuf() ?? null,
                limit: this._limit,
            },
        ).finish();
    }

    /**
     * Handles an incoming message from the topic subscription
     * @private
     * @param {Uint8Array} data - Raw message data
     * @param {Map<string, HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse[]>} list
     */
    _handleMessage(data, list) {
        const message =
            HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse.decode(
                data,
            );

        if (this._limit?.gt(0)) {
            this._limit = this._limit.sub(1);
        }

        this._startTime = Timestamp._fromProtobuf(
            /** @type {HieroProto.proto.ITimestamp} */ (
                message.consensusTimestamp
            ),
        ).plusNanos(1);

        if (
            message.chunkInfo == null ||
            (message.chunkInfo != null && message.chunkInfo.total === 1)
        ) {
            this._passTopicMessage(TopicMessage._ofSingle(message));
        } else {
            this._handleChunkedMessage(message, list);
        }
    }

    /**
     * Handles a chunked message from the topic subscription
     * @private
     * @param {HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse} message - The message response
     * @param {Map<string, HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse[]>} list
     */
    _handleChunkedMessage(message, list) {
        const chunkInfo =
            /** @type {HieroProto.proto.IConsensusMessageChunkInfo} */ (
                message.chunkInfo
            );
        const initialTransactionID =
            /** @type {HieroProto.proto.ITransactionID} */ (
                chunkInfo.initialTransactionID
            );
        const total = /** @type {number} */ (chunkInfo.total);
        const transactionId =
            TransactionId._fromProtobuf(initialTransactionID).toString();

        /** @type {HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse[]} */
        let responses = [];

        const temp = list.get(transactionId);
        if (temp == null) {
            list.set(transactionId, responses);
        } else {
            responses = temp;
        }

        responses.push(message);

        if (responses.length === total) {
            const topicMessage = TopicMessage._ofMany(responses);
            list.delete(transactionId);
            this._passTopicMessage(topicMessage);
        }
    }

    /**
     * Handles errors from the topic subscription
     * @private
     * @param {MirrorError | Error} error - The error that occurred
     * @param {Client<Channel>} client - The client to use for retries
     * @returns {void}
     */
    _handleError(error, client) {
        const message = error instanceof Error ? error.message : error.details;

        if (this._handle?._unsubscribed) {
            return;
        }

        if (this.shouldRetry(error)) {
            this._scheduleRetry(client, message);
        } else {
            this._errorHandler(null, new Error(message));
        }
    }

    /**
     * Determines if a retry should be attempted
     * @private
     * @param {MirrorError | Error} error - The error to check
     * @returns {boolean} - Whether to retry
     */
    shouldRetry(error) {
        return this._attempt < this._maxAttempts && this._retryHandler(error);
    }

    /**
     * Schedules a retry of the server stream request
     * @private
     * @param {Client<Channel>} client - The client to use for the retry
     * @param {string} errorMessage - The error message for logging
     * @returns {void}
     */
    _scheduleRetry(client, errorMessage) {
        const delay = Math.min(250 * 2 ** this._attempt, this._maxBackoff);

        console.warn(
            `Error subscribing to topic ${
                this._topicId?.toString() ?? "UNKNOWN"
            } ` +
                `during attempt ${this._attempt}. Waiting ${delay} ms before next attempt: ${errorMessage}`,
        );

        this._attempt += 1;
        setTimeout(() => this._makeServerStreamRequest(client), delay);
    }
}
