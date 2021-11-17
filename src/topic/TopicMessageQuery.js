import TransactionId from "../transaction/TransactionId.js";
import SubscriptionHandle from "./SubscriptionHandle.js";
import TopicMessage from "./TopicMessage.js";
import * as proto from "@exodus/hashgraph-proto";
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

export default class TopicMessageQuery {
    /**
     * @param {object} props
     * @param {TopicId | string} [props.topicId]
     * @param {Timestamp} [props.startTime]
     * @param {Timestamp} [props.endTime]
     * @param {(message: TopicMessage, error: Error)=> void} [props.errorHandler]
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
         * @type {(message: TopicMessage, error: Error) => void}
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._errorHandler = (message, error) => {
            console.error(
                `Error attempting to subscribe to topic: ${
                    this._topicId != null ? this._topicId.toString() : ""
                }`
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
                } complete`
            );
        };

        if (props.completionHandler != null) {
            this._completionHandler = props.completionHandler;
        }

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
                    // if the messasge matches the right regex.
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
        this._maxAttempts = 10;

        /**
         * @private
         * @type {number}
         */
        this._maxBackoff = 8000;

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
     * @param {(message: TopicMessage, error: Error)=> void} errorHandler
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
     */
    setMaxAttempts(attempts) {
        this.requireNotSubscribed();

        this._maxAttempts = attempts;
    }

    /**
     * @param {number} backoff
     */
    setMaxBackoff(backoff) {
        this.requireNotSubscribed();

        this._maxBackoff = backoff;
    }

    /**
     * @param {Client<*>} client
     * @param {((message: TopicMessage, error: Error) => void) | null} errorHandler
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
     * @private
     * @param {import("../client/Client.js").default<Channel, MirrorChannel>} client
     * @returns {void}
     */
    _makeServerStreamRequest(client) {
        /** @type {Map<string, proto.ConsensusTopicResponse[]>} */

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const list = new Map();

        const request = proto.ConsensusTopicQuery.encode({
            topicID: this._topicId != null ? this._topicId._toProtobuf() : null,
            consensusStartTime:
                this._startTime != null ? this._startTime._toProtobuf() : null,
            consensusEndTime:
                this._endTime != null ? this._endTime._toProtobuf() : null,
            limit: this._limit,
        }).finish();

        const cancel = client._mirrorNetwork
            .getNextMirrorNode()
            .getChannel()
            .makeServerStreamRequest(
                request,
                (data) => {
                    const message = proto.ConsensusTopicResponse.decode(data);

                    if (this._limit != null && this._limit.gt(0)) {
                        this._limit = this._limit.sub(1);
                    }

                    this._startTime = Timestamp._fromProtobuf(
                        /** @type {proto.ITimestamp} */ (
                            message.consensusTimestamp
                        )
                    ).plusNanos(1);

                    if (
                        message.chunkInfo == null ||
                        (message.chunkInfo != null &&
                            message.chunkInfo.total === 1)
                    ) {
                        this._passTopicMessage(TopicMessage._ofSingle(message));
                    } else {
                        const chunkInfo =
                            /** @type {proto.IConsensusMessageChunkInfo} */ (
                                message.chunkInfo
                            );
                        const initialTransactionID =
                            /** @type {proto.ITransactionID} */ (
                                chunkInfo.initialTransactionID
                            );
                        const total = /** @type {number} */ (chunkInfo.total);
                        const transactionId =
                            TransactionId._fromProtobuf(
                                initialTransactionID
                            ).toString();

                        /** @type {proto.ConsensusTopicResponse[]} */
                        let responses = [];

                        const temp = list.get(transactionId);
                        if (temp == null) {
                            list.set(transactionId, responses);
                        } else {
                            responses = temp;
                        }

                        responses.push(message);

                        if (responses.length === total) {
                            const topicMessage =
                                TopicMessage._ofMany(responses);

                            list.delete(transactionId);

                            this._passTopicMessage(topicMessage);
                        }
                    }
                },
                (error) => {
                    const message =
                        error instanceof Error ? error.message : error.details;

                    if (
                        this._attempt < this._maxAttempts &&
                        this._retryHandler(error)
                    ) {
                        const delay = Math.min(
                            250 * 2 ** this._attempt,
                            this._maxBackoff
                        );
                        console.warn(
                            `Error subscribing to topic ${
                                this._topicId != null
                                    ? this._topicId.toString()
                                    : "UNKNOWN"
                            } during attempt ${
                                this._attempt
                            }. Waiting ${delay} ms before next attempt: ${message}`
                        );

                        this._attempt += 1;

                        setTimeout(() => {
                            this._makeServerStreamRequest(client);
                        }, delay);
                    }
                },
                this._completionHandler
            );

        if (this._handle != null) {
            this._handle._setCall(() => cancel());
        }
    }

    requireNotSubscribed() {
        if (this._handle != null) {
            throw new Error(
                "Cannot change fields on an already subscribed query"
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
}
