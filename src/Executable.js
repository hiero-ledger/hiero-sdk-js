import GrpcServiceError from "./grpc/GrpcServiceError.js";
import GrpcStatus from "./grpc/GrpcStatus.js";

/**
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./channel/Channel.js").default} Channel
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 */

/**
 * @enum {string}
 */
export const ExecutionState = {
    Finished: "Finished",
    Retry: "Retry",
    Error: "Error",
};

export const RST_STREAM = /\brst[^0-9a-zA-Z]stream\b/gi;

/**
 * @abstract
 * @internal
 * @template RequestT
 * @template ResponseT
 * @template OutputT
 */
export default class Executable {
    constructor() {
        /**
         * The number of times we can retry the grpc call
         *
         * @private
         * @type {number}
         */
        this._maxAttempts = 10;

        /**
         * The index of the next transaction to be executed.
         *
         * @protected
         * @type {number}
         */
        this._nextNodeIndex = 0;

        /**
         * List of node account IDs for each transaction that has been
         * built.
         *
         * @internal
         * @type {AccountId[]}
         */
        this._nodeIds = [];

        /** @type {number | null} */
        this._minBackoff = null;

        /** @type {number | null} */
        this._maxBackoff = null;
    }

    /**
     * @returns {?AccountId[]}
     */
    get nodeAccountIds() {
        return this._nodeIds.length != 0 ? this._nodeIds : null;
    }

    /**
     * @param {AccountId[]} nodeIds
     * @returns {this}
     */
    setNodeAccountIds(nodeIds) {
        this._nodeIds = nodeIds;

        return this;
    }

    /**
     * @deprecated
     * @returns {number}
     */
    get maxRetries() {
        console.warn("Deprecated: use maxAttempts instead");
        return this.maxAttempts;
    }

    /**
     * @param {number} maxRetries
     * @returns {this}
     */
    setMaxRetries(maxRetries) {
        console.warn("Deprecated: use setMaxAttempts() instead");
        return this.setMaxAttempts(maxRetries);
    }

    /**
     * @returns {number}
     */
    get maxAttempts() {
        return this._maxAttempts;
    }

    /**
     * @param {number} maxAttempts
     * @returns {this}
     */
    setMaxAttempts(maxAttempts) {
        this._maxAttempts = maxAttempts;

        return this;
    }

    /**
     * @param {number} minBackoff
     * @returns {this}
     */
    setMinBackoff(minBackoff) {
        if (minBackoff == null) {
            throw new Error("minBackoff cannot be null.");
        } else if (this._maxBackoff != null && minBackoff > this._maxBackoff) {
            throw new Error("minBackoff cannot be larger than maxBackoff.");
        }
        this._minBackoff = minBackoff;
        return this;
    }

    /**
     * @returns {number | null}
     */
    get minBackoff() {
        return this._minBackoff;
    }

    /**
     * @param {?number} maxBackoff
     * @returns {this}
     */
    setMaxBackoff(maxBackoff) {
        if (maxBackoff == null) {
            throw new Error("maxBackoff cannot be null.");
        } else if (this._minBackoff != null && maxBackoff < this._minBackoff) {
            throw new Error("maxBackoff cannot be smaller than minBackoff.");
        }
        this._maxBackoff = maxBackoff;
        return this;
    }

    /**
     * @returns {number | null}
     */
    get maxBackoff() {
        return this._maxBackoff;
    }

    // /**
    //  * @param {?number} minBackoff
    //  * @param {?number} maxBackoff
    //  * @returns {this}
    //  */
    // _setBackoff(minBackoff, maxBackoff) {
    //     if (minBackoff == null) {
    //         throw new Error("minBackoff cannot be null.");
    //     }
    //     if (maxBackoff == null) {
    //         throw new Error("maxBackoff cannot be null.");
    //     }
    //     if (minBackoff > maxBackoff) {
    //         throw new Error("minBackoff cannot be larger than maxBackoff.");
    //     }
    //     this._minBackoff = minBackoff;
    //     this._maxAttempts = maxBackoff;
    //     return this;
    // }

    // /**
    //  * @typedef {Object} Backoff
    //  * @property {number | null} minBackoff
    //  * @property {number | null} maxBackoff
    //  * @returns {Backoff}
    //  */
    // get _backoff() {
    //     return { minBackoff: this._minBackoff, maxBackoff: this._maxBackoff };
    // }

    /**
     * @abstract
     * @protected
     * @param {import("./client/Client.js").default<Channel, *>} client
     * @returns {Promise<void>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _beforeExecute(client) {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @protected
     * @returns {Promise<RequestT>}
     */
    _makeRequestAsync() {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @internal
     * @param {RequestT} request
     * @param {ResponseT} response
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response) {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @protected
     * @param {ResponseT} response
     * @param {AccountId} nodeAccountId
     * @param {RequestT} request
     * @returns {Promise<OutputT>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @internal
     * @param {Channel} channel
     * @param {RequestT} request
     * @returns {Promise<ResponseT>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _execute(channel, request) {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @protected
     * @returns {AccountId}
     */
    _getNodeAccountId() {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @protected
     * @returns {TransactionId}
     */
    _getTransactionId() {
        throw new Error("not implemented");
    }

    /**
     * @protected
     * @returns {void}
     */
    _advanceRequest() {
        // each time we move our cursor to the next transaction
        // wrapping around to ensure we are cycling
        this._nextNodeIndex = (this._nextNodeIndex + 1) % this._nodeIds.length;
    }

    /**
     * @abstract
     * @protected
     * @param {RequestT} request
     * @param {ResponseT} response
     * @returns {ExecutionState}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        throw new Error("not implemented");
    }

    /**
     * @protected
     * @param {GrpcServiceError} error
     * @returns {boolean}
     */
    _shouldRetryExceptionally(error) {
        if (error instanceof GrpcServiceError) {
            return (
                error.status._code === GrpcStatus.Timeout._code ||
                error.status._code === GrpcStatus.Unavailable._code ||
                error.status._code === GrpcStatus.ResourceExhausted._code ||
                error.status._code === GrpcStatus.GrpcWeb._code ||
                (error.status._code === GrpcStatus.Internal._code &&
                    RST_STREAM.test(error.message))
            );
        } else {
            // if we get to the 'else' statement, the 'error' is instanceof 'HttpError'
            // and in this case, we have to retry always
            return true;
        }
    }

    /**
     * @template {Channel} ChannelT
     * @template MirrorChannelT
     * @param {import("./client/Client.js").default<ChannelT, MirrorChannelT>} client
     * @returns {Promise<OutputT>}
     */
    async execute(client) {
        await this._beforeExecute(client);

        if (this._maxBackoff == null) {
            this._maxBackoff = client.maxBackoff;
        }
        if (this._minBackoff == null) {
            this._minBackoff = client.minBackoff;
        }

        const maxAttempts =
            client._maxAttempts != null
                ? client._maxAttempts
                : this._maxAttempts;

        for (let attempt = 1 /* loop forever */; ; attempt += 1) {
            const nodeAccountId = this._getNodeAccountId();
            const node = client._network.getNode(nodeAccountId);

            if (node == null) {
                throw new Error(
                    `NodeAccountId not recognized: ${nodeAccountId.toString()}`
                );
            }

            const channel = node.getChannel();
            const request = await this._makeRequestAsync();

            // advance the internal index
            // non-free queries and transactions map to more than 1 actual transaction and this will cause
            // the next invocation of makeRequest to return the _next_ transaction
            this._advanceRequest();

            let response;

            if (!node.isHealthy()) {
                await node.wait();
            }

            try {
                response = await this._execute(channel, request);
            } catch (err) {
                const error = GrpcServiceError._fromResponse(
                    /** @type {Error} */ (err)
                );

                if (
                    error instanceof GrpcServiceError &&
                    this._shouldRetryExceptionally(error) &&
                    attempt <= maxAttempts
                ) {
                    node.increaseDelay();
                    continue;
                }

                throw err;
            }

            node.decreaseDelay();

            switch (this._shouldRetry(request, response)) {
                case ExecutionState.Retry:
                    await delayForAttempt(
                        attempt,
                        this._minBackoff,
                        this._maxBackoff
                    );
                    continue;
                case ExecutionState.Finished:
                    return this._mapResponse(response, nodeAccountId, request);
                case ExecutionState.Error:
                    throw this._mapStatusError(request, response);
                default:
                    throw new Error(
                        "(BUG) non-exhuastive switch statement for `ExecutionState`"
                    );
            }
        }
    }
}

/**
 * @param {number} attempt
 * @param {number} minBackoff
 * @param {number} maxBackoff
 * @returns {Promise<void>}
 */
function delayForAttempt(attempt, minBackoff, maxBackoff) {
    // 0.1s, 0.2s, 0.4s, 0.8s, ...
    const ms = Math.min(
        Math.floor(minBackoff * Math.pow(2, attempt)),
        maxBackoff
    );
    return new Promise((resolve) => setTimeout(resolve, ms));
}
