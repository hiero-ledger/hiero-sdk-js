// SPDX-License-Identifier: Apache-2.0

import GrpcServiceError from "./grpc/GrpcServiceError.js";
import GrpcStatus from "./grpc/GrpcStatus.js";
import List from "./transaction/List.js";
import * as hex from "./encoding/hex.js";
import HttpError from "./http/HttpError.js";
import Status from "./Status.js";
import MaxAttemptsOrTimeoutError from "./MaxAttemptsOrTimeoutError.js";

/**
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./channel/Channel.js").default} Channel
 * @typedef {import("./channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./client/Client.js").ClientOperator} ClientOperator
 * @typedef {import("./Signer.js").Signer} Signer
 * @typedef {import("./PublicKey.js").default} PublicKey
 * @typedef {import("./logger/Logger.js").default} Logger
 */

/**
 * @enum {string}
 */
export const ExecutionState = {
    Finished: "Finished",
    Retry: "Retry",
    Error: "Error",
};

export const RST_STREAM = /\brst[^0-9a-zA-Z]stream\b/i;
export const DEFAULT_MAX_ATTEMPTS = 10;

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
         * @internal
         * @type {number}
         */
        this._maxAttempts = DEFAULT_MAX_ATTEMPTS;

        /**
         * List of node account IDs for each transaction that has been
         * built.
         *
         * @internal
         * @type {List<AccountId>}
         */
        this._nodeAccountIds = new List();

        /**
         * List of the transaction node account IDs to check if
         * the node account ID of the request is in the list
         *
         * @protected
         * @type {Array<string>}
         */
        this.transactionNodeIds = [];

        /**
         * @internal
         */
        this._signOnDemand = false;

        /**
         * This is the request's min backoff
         *
         * @internal
         * @type {number | null}
         */
        this._minBackoff = null;

        /**
         * This is the request's max backoff
         *
         * @internal
         * @type {number}
         */
        this._maxBackoff = 8000;

        /**
         * The operator that was used to execute this request.
         * The reason we save the operator in the request is because of the signing on
         * demand feature. This feature requires us to sign new request on each attempt
         * meaning if a client with an operator was used we'd need to sign with the operator
         * on each attempt.
         *
         * @internal
         * @type {ClientOperator | null}
         */
        this._operator = null;

        /**
         * The complete timeout for running the `execute()` method
         *
         * @internal
         * @type {number | null}
         */
        this._requestTimeout = null;

        /**
         * The grpc request timeout aka deadline.
         *
         * The reason we have this is because there were times that consensus nodes held the grpc
         * connection, but didn't return anything; not error nor regular response. This resulted
         * in some weird behavior in the SDKs. To fix this we've added a grpc deadline to prevent
         * nodes from stalling the executing of a request.
         *
         * @internal
         * @type {number | null}
         */
        this._grpcDeadline = null;

        /**
         * Logger
         *
         * @protected
         * @type {Logger | null}
         */
        this._logger = null;
    }

    /**
     * Get the list of node account IDs on the request. If no nodes are set, then null is returned.
     * The reasoning for this is simply "legacy behavior".
     *
     * @returns {?AccountId[]}
     */
    get nodeAccountIds() {
        if (this._nodeAccountIds.isEmpty) {
            return null;
        } else {
            this._nodeAccountIds.setLocked();
            return this._nodeAccountIds.list;
        }
    }

    /**
     * Set the node account IDs on the request
     *
     * @param {AccountId[]} nodeIds
     * @returns {this}
     */
    setNodeAccountIds(nodeIds) {
        // Set the node account IDs, and lock the list. This will require `execute`
        // to use these nodes instead of random nodes from the network.
        this._nodeAccountIds.setList(nodeIds).setLocked();
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
     * Get the max attempts on the request
     *
     * @returns {number}
     */
    get maxAttempts() {
        return this._maxAttempts;
    }

    /**
     * Set the max attempts on the request
     *
     * @param {number} maxAttempts
     * @returns {this}
     */
    setMaxAttempts(maxAttempts) {
        this._maxAttempts = maxAttempts;

        return this;
    }

    /**
     * Get the grpc deadline
     *
     * @returns {?number}
     */
    get grpcDeadline() {
        return this._grpcDeadline;
    }

    /**
     * Set the grpc deadline
     *
     * @param {number} grpcDeadline
     * @returns {this}
     */
    setGrpcDeadline(grpcDeadline) {
        this._grpcDeadline = grpcDeadline;

        return this;
    }

    /**
     * Set the min backoff for the request
     *
     * @param {number} minBackoff
     * @returns {this}
     */
    setMinBackoff(minBackoff) {
        // Honestly we shouldn't be checking for null since that should be TypeScript's job.
        // Also verify that min backoff is not greater than max backoff.
        if (minBackoff == null) {
            throw new Error("minBackoff cannot be null.");
        } else if (this._maxBackoff != null && minBackoff > this._maxBackoff) {
            throw new Error("minBackoff cannot be larger than maxBackoff.");
        }
        this._minBackoff = minBackoff;
        return this;
    }

    /**
     * Get the min backoff
     *
     * @returns {number | null}
     */
    get minBackoff() {
        return this._minBackoff;
    }

    /**
     * Set the max backoff for the request
     *
     * @param {?number} maxBackoff
     * @returns {this}
     */
    setMaxBackoff(maxBackoff) {
        // Honestly we shouldn't be checking for null since that should be TypeScript's job.
        // Also verify that max backoff is not less than min backoff.
        if (maxBackoff == null) {
            throw new Error("maxBackoff cannot be null.");
        } else if (this._minBackoff != null && maxBackoff < this._minBackoff) {
            throw new Error("maxBackoff cannot be smaller than minBackoff.");
        }
        this._maxBackoff = maxBackoff;
        return this;
    }

    /**
     * Get the max backoff
     *
     * @returns {number}
     */
    get maxBackoff() {
        return this._maxBackoff;
    }

    /**
     * This method is responsible for doing any work before the executing process begins.
     * For paid queries this will result in executing a cost query, for transactions this
     * will make sure we save the operator and sign any requests that need to be signed
     * in case signing on demand is disabled.
     *
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
     * Create a protobuf request which will be passed into the `_execute()` method
     *
     * @abstract
     * @protected
     * @returns {Promise<RequestT>}
     */
    _makeRequestAsync() {
        throw new Error("not implemented");
    }

    /**
     * This name is a bit wrong now, but the purpose of this method is to map the
     * request and response into an error. This method will only be called when
     * `_shouldRetry` returned `ExecutionState.Error`
     *
     * @abstract
     * @internal
     * @param {RequestT} request
     * @param {ResponseT} response
     * @param {AccountId} nodeId
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response, nodeId) {
        throw new Error("not implemented");
    }

    /**
     * Map the request, response, and the node account ID used for this attempt into a response.
     * This method will only be called when `_shouldRetry` returned `ExecutionState.Finished`
     *
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
     * Perform a single grpc call with the given request. Each request has it's own
     * required service so we just pass in channel, and it'$ the request's responsiblity
     * to use the right service and call the right grpc method.
     *
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
     * Return the current transaction ID for the request. All requests which are
     * use the same transaction ID for each node, but the catch is that `Transaction`
     * implicitly supports chunked transactions. Meaning there could be multiple
     * transaction IDs stored in the request, and a different transaction ID will be used
     * on subsequent calls to `execute()`
     *
     * FIXME: This method can most likely be removed, although some further inspection
     * is required.
     *
     * @abstract
     * @protected
     * @returns {TransactionId}
     */
    _getTransactionId() {
        throw new Error("not implemented");
    }

    /**
     * Return the log ID for this particular request
     *
     * Log IDs are simply a string constructed to make it easy to track each request's
     * execution even when mulitple requests are executing in parallel. Typically, this
     * method returns the format of `[<request type>.<timestamp of the transaction ID>]`
     *
     * Maybe we should deduplicate this using ${this.consturtor.name}
     *
     * @abstract
     * @internal
     * @returns {string}
     */
    _getLogId() {
        throw new Error("not implemented");
    }

    /**
     * Serialize the request into bytes
     *
     * @abstract
     * @param {RequestT} request
     * @returns {Uint8Array}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _requestToBytes(request) {
        throw new Error("not implemented");
    }

    /**
     * Serialize the response into bytes
     *
     * @abstract
     * @param {ResponseT} response
     * @returns {Uint8Array}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _responseToBytes(response) {
        throw new Error("not implemented");
    }

    /**
     * Determine if we should continue the execution process, error, or finish.
     *
     * FIXME: This method should really be called something else. Initially it returned
     * a boolean so `shouldRetry` made sense, but now it returns an enum, so the name
     * no longer makes sense.
     *
     * @abstract
     * @protected
     * @param {RequestT} request
     * @param {ResponseT} response
     * @returns {[Status, ExecutionState]}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        throw new Error("not implemented");
    }

    /**
     * Determine if we should error based on the gRPC status
     *
     * Unlike `shouldRetry` this method does in fact still return a boolean
     *
     * @protected
     * @param {Error} error
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
     * A helper method for setting the operator on the request
     *
     * @internal
     * @param {AccountId} accountId
     * @param {PublicKey} publicKey
     * @param {(message: Uint8Array) => Promise<Uint8Array>} transactionSigner
     * @returns {this}
     */
    _setOperatorWith(accountId, publicKey, transactionSigner) {
        this._operator = {
            transactionSigner,
            accountId,
            publicKey,
        };
        return this;
    }

    /**
     * Execute this request using the signer
     *
     * This method is part of the signature providers feature
     * https://hips.hedera.com/hip/hip-338
     *
     * @param {Signer} signer
     * @returns {Promise<OutputT>}
     */
    async executeWithSigner(signer) {
        return signer.call(this);
    }

    /**
     * @returns {boolean}
     * @abstract
     * @protected
     */
    isBatchedAndNotBatchTransaction() {
        return false;
    }

    /**
     * Execute the request using a client and an optional request timeout
     *
     * @template {Channel} ChannelT
     * @template {MirrorChannel} MirrorChannelT
     * @param {import("./client/Client.js").default<ChannelT, MirrorChannelT>} client
     * @param {number=} requestTimeout
     * @returns {Promise<OutputT>}
     */
    async execute(client, requestTimeout) {
        // we check if its local node then backoff mechanism should be disabled
        // and we increase the retry attempts
        const isLocalNode = client.network["127.0.0.1:50211"] != null;

        if (this.isBatchedAndNotBatchTransaction()) {
            throw new Error(
                "Cannot execute batchified transaction outside of BatchTransaction",
            );
        }

        // If the logger on the request is not set, use the logger in client
        // (if set, otherwise do not use logger)
        this._logger =
            this._logger == null
                ? client._logger != null
                    ? client._logger
                    : null
                : this._logger;

        // If the request timeout is set on the request we'll prioritize that instead
        // of the parameter provided, and if the parameter isn't provided we'll
        // use the default request timeout on client
        if (this._requestTimeout == null) {
            this._requestTimeout =
                requestTimeout != null ? requestTimeout : client.requestTimeout;
        }

        // Some request need to perform additional requests before the executing
        // such as paid queries need to fetch the cost of the query before
        // finally executing the actual query.
        await this._beforeExecute(client);

        // If the max backoff on the request is not set, use the default value in client
        if (this._maxBackoff == null) {
            this._maxBackoff = client.maxBackoff;
        }

        // If the min backoff on the request is not set, use the default value in client
        if (this._minBackoff == null) {
            this._minBackoff = client.minBackoff;
        }

        // Save the start time to be used later with request timeout
        const startTime = Date.now();

        // Saves each error we get so when we err due to max attempts exceeded we'll have
        // the last error that was returned by the consensus node
        let persistentError = null;

        // If the max attempts on the request is not set, use the default value in client
        // If the default value in client is not set, use a default of 10.
        //
        // FIXME: current implementation is wrong, update to follow comment above.
        // ... existing code ...
        const LOCAL_NODE_ATTEMPTS = 1000;
        const maxAttempts = isLocalNode
            ? LOCAL_NODE_ATTEMPTS
            : client._maxAttempts ?? this._maxAttempts;

        // Checks if has a valid nodes to which the TX can be sent
        if (this.transactionNodeIds.length) {
            const nodeAccountIds = this._nodeAccountIds.list.map((nodeId) =>
                nodeId.toString(),
            );

            const hasValidNodes = this.transactionNodeIds.some((nodeId) =>
                nodeAccountIds.includes(nodeId),
            );

            if (!hasValidNodes) {
                const displayNodeAccountIds =
                    nodeAccountIds.length > 2
                        ? `${nodeAccountIds.slice(0, 2).join(", ")} ...`
                        : nodeAccountIds.join(", ");
                const isSingleNode = nodeAccountIds.length === 1;

                throw new Error(
                    `Attempting to execute a transaction against node${
                        isSingleNode ? "" : "s"
                    } ${displayNodeAccountIds}, ` +
                        `which ${
                            isSingleNode ? "is" : "are"
                        } not included in the Client's node list. Please review your Client configuration.`,
                );
            }
        }

        // The retry loop
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            // Determine if we've exceeded request timeout
            if (
                this._requestTimeout != null &&
                startTime + this._requestTimeout <= Date.now()
            ) {
                throw new MaxAttemptsOrTimeoutError(
                    `timeout exceeded`,
                    this._nodeAccountIds.isEmpty
                        ? "No node account ID set"
                        : this._nodeAccountIds.current.toString(),
                );
            }

            let nodeAccountId;
            let node;

            if (this._nodeAccountIds.isEmpty) {
                node = client._network.getNode();
                nodeAccountId = node.accountId;
                this._nodeAccountIds.setList([nodeAccountId]);
            } else {
                nodeAccountId = this._nodeAccountIds.current;
                node = client._network.getNode(nodeAccountId);
            }

            if (node == null) {
                throw new Error(
                    `NodeAccountId not recognized: ${nodeAccountId.toString()}`,
                );
            }

            if (this.transactionNodeIds.length) {
                const isNodeAccountIdValid = this.transactionNodeIds.includes(
                    nodeAccountId.toString(),
                );

                if (!isNodeAccountIdValid) {
                    console.error(
                        `Attempting to execute a transaction against node ${nodeAccountId.toString()}, which is not included in the Client's node list. Please review your Client configuration.`,
                    );

                    this._nodeAccountIds.advance();
                    continue;
                }
            }

            // Get the log ID for the request.
            const logId = this._getLogId();
            if (this._logger) {
                this._logger.debug(
                    `[${logId}] Node AccountID: ${node.accountId.toString()}, IP: ${node.address.toString()}`,
                );
            }

            const channel = node.getChannel();
            const request = await this._makeRequestAsync();

            let response;

            if (!node.isHealthy()) {
                const isLastNode =
                    this._nodeAccountIds.index ===
                    this._nodeAccountIds.list.length - 1;

                // Check if the request is a transaction receipt or record
                // request to retry 10 times, because getReceiptQuery/getRecordQuery
                // are single node requests
                if (
                    isTransactionReceiptOrRecordRequest(request) ||
                    isLocalNode
                ) {
                    await delayForAttempt(
                        isLocalNode,
                        attempt,
                        this._minBackoff,
                        this._maxBackoff,
                    );
                    continue;
                }

                if (isLastNode || this._nodeAccountIds.length <= 1) {
                    throw new Error(
                        `Network connectivity issue: All nodes are unhealthy. Original node list: ${this._nodeAccountIds.list.join(
                            ", ",
                        )}`,
                    );
                }

                if (this._logger) {
                    this._logger.debug(
                        `[${logId}] Node is not healthy, trying the next node.`,
                    );
                }

                this._nodeAccountIds.advance();
                continue;
            }

            this._nodeAccountIds.advance();

            try {
                // Race the execution promise against the grpc timeout to prevent grpc connections
                // from blocking this request
                const promises = [];

                // If a grpc deadline is est, we should race it, otherwise the only thing in the
                // list of promises will be the execution promise.
                if (this._grpcDeadline != null) {
                    promises.push(
                        // eslint-disable-next-line ie11/no-loop-func
                        new Promise((_, reject) =>
                            setTimeout(
                                // eslint-disable-next-line ie11/no-loop-func
                                () =>
                                    reject(new Error("grpc deadline exceeded")),
                                /** @type {number=} */ (this._grpcDeadline),
                            ),
                        ),
                    );
                }
                if (this._logger) {
                    this._logger.trace(
                        `[${this._getLogId()}] sending protobuf ${hex.encode(
                            this._requestToBytes(request),
                        )}`,
                    );
                }

                promises.push(this._execute(channel, request));
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                response = /** @type {ResponseT} */ (
                    await Promise.race(promises)
                );
            } catch (err) {
                // If we received a grpc status error we need to determine if
                // we should retry on this error, or err from the request entirely.
                const error = GrpcServiceError._fromResponse(
                    /** @type {Error} */ (err),
                );

                // Save the error in case we retry
                persistentError = error;
                if (this._logger) {
                    this._logger.debug(
                        `[${logId}] received error ${JSON.stringify(error)}`,
                    );
                }

                if (
                    (error instanceof GrpcServiceError ||
                        error instanceof HttpError) &&
                    this._shouldRetryExceptionally(error) &&
                    attempt <= maxAttempts
                ) {
                    // Increase the backoff for the particular node and remove it from
                    // the healthy node list
                    if (this._logger) {
                        this._logger.debug(
                            `[${this._getLogId()}] node with accountId: ${node.accountId.toString()} and proxy IP: ${node.address.toString()} is unhealthy`,
                        );
                    }

                    client._network.increaseBackoff(node);
                    continue;
                }

                throw err;
            }
            if (this._logger) {
                this._logger.trace(
                    `[${this._getLogId()}] sending protobuf ${hex.encode(
                        this._responseToBytes(response),
                    )}`,
                );
            }

            // If we didn't receive an error we should decrease the current nodes backoff
            // in case it is a recovering node
            client._network.decreaseBackoff(node);

            // Determine what execution state we're in by the response
            // For transactions this would be as simple as checking the response status is `OK`
            // while for _most_ queries it would check if the response status is `SUCCESS`
            // The only odd balls are `TransactionReceiptQuery` and `TransactionRecordQuery`
            const [status, shouldRetry] = this._shouldRetry(request, response);
            if (
                status.toString() !== Status.Ok.toString() &&
                status.toString() !== Status.Success.toString()
            ) {
                persistentError = status;
            }

            // Determine by the executing state what we should do
            switch (shouldRetry) {
                case ExecutionState.Retry:
                    await delayForAttempt(
                        isLocalNode,
                        attempt,
                        this._minBackoff,
                        this._maxBackoff,
                    );
                    continue;
                case ExecutionState.Finished:
                    return this._mapResponse(response, nodeAccountId, request);
                case ExecutionState.Error:
                    throw this._mapStatusError(
                        request,
                        response,
                        nodeAccountId,
                    );
                default:
                    throw new Error(
                        "(BUG) non-exhaustive switch statement for `ExecutionState`",
                    );
            }
        }

        // We'll only get here if we've run out of attempts, so we return an error wrapping the
        // persistent error we saved before.

        throw new MaxAttemptsOrTimeoutError(
            `max attempts of ${maxAttempts.toString()} was reached for request with last error being: ${
                persistentError != null ? persistentError.toString() : ""
            }`,
            this._nodeAccountIds.current.toString(),
        );
    }

    /**
     * The current purpose of this method is to easily support signature providers since
     * signature providers need to serialize _any_ request into bytes. `Query` and `Transaction`
     * already implement `toBytes()` so it only made sense to make it available here too.
     *
     * @abstract
     * @returns {Uint8Array}
     */
    toBytes() {
        throw new Error("not implemented");
    }

    /**
     * Set logger
     *
     * @param {Logger} logger
     * @returns {this}
     */
    setLogger(logger) {
        this._logger = logger;
        return this;
    }

    /**
     * Get logger if set
     *
     * @returns {?Logger}
     */
    get logger() {
        return this._logger;
    }
}

/**
 * Checks if the request is a transaction receipt or record request
 *
 * @template T
 * @param {T} request - The request to check
 * @returns {boolean} - True if the request is a transaction receipt or record
 */
function isTransactionReceiptOrRecordRequest(request) {
    if (typeof request !== "object" || request === null) {
        return false;
    }

    return (
        "transactionGetReceipt" in request || "transactionGetRecord" in request
    );
}

/**
 * A simple function that returns a promise timeout for a specific period of time
 *
 * @param {boolean} isLocalNode
 * @param {number} attempt
 * @param {number} minBackoff
 * @param {number} maxBackoff
 * @returns {Promise<void>}
 */
function delayForAttempt(isLocalNode, attempt, minBackoff, maxBackoff) {
    if (isLocalNode) {
        return new Promise((resolve) => setTimeout(resolve, minBackoff));
    }

    // 0.1s, 0.2s, 0.4s, 0.8s, ...
    const ms = Math.min(
        Math.floor(minBackoff * Math.pow(2, attempt)),
        maxBackoff,
    );
    return new Promise((resolve) => setTimeout(resolve, ms));
}
