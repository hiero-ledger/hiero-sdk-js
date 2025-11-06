// SPDX-License-Identifier: Apache-2.0
import { ALL_WEB_NETWORK_NODES } from "../constants/ClientConstants.js";
import GrpcServiceError from "../grpc/GrpcServiceError.js";
import GrpcStatus from "../grpc/GrpcStatus.js";
import HttpError from "../http/HttpError.js";
import HttpStatus from "../http/HttpStatus.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";
import Channel, { encodeRequest, decodeUnaryResponse } from "./Channel.js";

export default class WebChannel extends Channel {
    /**
     * @param {string} address
     * @param {number=} grpcDeadline
     */
    constructor(address, grpcDeadline) {
        super(grpcDeadline);

        /**
         * @type {string}
         * @private
         */
        this._address = address;

        // Set the gRPC deadline using the base class method

        /**
         * Flag indicating if the connection is ready (health check has passed)
         * Set to true after the first successful health check
         *
         * @type {boolean}
         * @private
         */
        this._isReady = false;

        /**
         * Promise that resolves when the health check is complete
         * Used to prevent multiple concurrent health checks
         *
         * @type {Promise<void>|null}
         * @private
         */
        this._healthCheckPromise = null;
    }

    /**
     * Determines whether to use HTTPS based on the address
     * @param {string} address - The address to check
     * @returns {boolean} - True if HTTPS should be used, false for HTTP
     * @private
     */
    _shouldUseHttps(address) {
        return !(
            address.includes("localhost") || address.includes("127.0.0.1")
        );
    }

    /**
     * Builds the full URL with appropriate scheme (http/https)
     * @param {string} address - The base address
     * @returns {string} - The full URL with scheme
     * @private
     */
    _buildUrl(address) {
        // Check if address already contains a scheme
        const hasScheme =
            address.startsWith("http://") || address.startsWith("https://");

        if (hasScheme) {
            // Use the address as-is if it already has a scheme
            return address;
        } else {
            // Only prepend scheme if none exists
            const shouldUseHttps = this._shouldUseHttps(address);
            return shouldUseHttps ? `https://${address}` : `http://${address}`;
        }
    }

    /**
     * Check if the gRPC-Web proxy is reachable and healthy
     * Performs a POST request and verifies the response has gRPC-Web headers,
     * which indicates the proxy is running and processing gRPC requests.
     * Results are cached per address for the entire lifecycle.
     * Uses promise-based synchronization to prevent multiple concurrent health checks.
     *
     * @param {Date} deadline - Deadline for the health check
     * @returns {Promise<void>}
     * @private
     */
    async _waitForReady(deadline) {
        // Check if we've already validated this address
        if (this._isReady) {
            return; // Health check already passed for this address
        }

        // If a health check is already in progress, wait for it to complete
        if (this._healthCheckPromise) {
            return this._healthCheckPromise;
        }

        // Start a new health check and store the promise
        this._healthCheckPromise = this._performHealthCheck(deadline);

        try {
            await this._healthCheckPromise;
        } finally {
            // Clear the promise when done (success or failure)
            this._healthCheckPromise = null;
        }
    }

    /**
     * Performs the actual health check request
     * @param {Date} deadline - Deadline for the health check
     * @returns {Promise<void>}
     * @private
     */
    async _performHealthCheck(deadline) {
        const address = this._buildUrl(this._address);

        // Calculate remaining time until deadline
        const timeoutMs = deadline.getTime() - Date.now();
        if (timeoutMs <= 0) {
            throw new GrpcServiceError(
                GrpcStatus.Timeout,
                ALL_WEB_NETWORK_NODES?.[this._address]?.toString(),
            );
        }

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

        try {
            // Make a POST request to verify the gRPC-Web proxy is running
            // We use a minimal gRPC-Web compatible request
            //eslint-disable-next-line n/no-unsupported-features/node-builtins
            const response = await fetch(address, {
                method: "POST",
                headers: {
                    "content-type": "application/grpc-web+proto",
                    "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
                    "x-grpc-web": "1",
                },
                body: new Uint8Array(0), // Empty body for health check
                signal: abortController.signal,
            });

            clearTimeout(timeoutId);

            // Check if response is successful (200) or indicates a redirect (3xx)
            // 3xx status codes indicate the resource has moved, which is valid for proxies
            if (
                response.ok ||
                (response.status >= 300 && response.status < 400)
            ) {
                const grpcStatus = response.headers.get("grpc-status");
                const grpcMessage = response.headers.get("grpc-message");

                // If gRPC headers exist, the proxy is running and processing requests
                if (grpcStatus != null || grpcMessage != null) {
                    // Mark this connection as ready
                    this._isReady = true;
                    return; //  Healthy - gRPC-Web proxy is responding
                }
            }

            // If we get here, either status isn't 200/3xx or no gRPC headers present
            // This means the proxy might not be configured correctly or not running
            throw new GrpcServiceError(
                GrpcStatus.Unavailable,
                ALL_WEB_NETWORK_NODES?.[this._address]?.toString(),
            );
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === "AbortError") {
                throw new GrpcServiceError(
                    GrpcStatus.Timeout,
                    ALL_WEB_NETWORK_NODES?.[this._address]?.toString(),
                );
            }

            if (error instanceof GrpcServiceError) {
                throw error;
            }

            // Network error - server is not reachable
            throw new GrpcServiceError(
                GrpcStatus.Unavailable,
                ALL_WEB_NETWORK_NODES?.[this._address]?.toString(),
            );
        }
    }

    /**
     * @override
     * @returns {void}
     */
    close() {
        // do nothing
    }

    /**
     * @override
     * @protected
     * @param {string} serviceName
     * @returns {import("protobufjs").RPCImpl}
     */
    _createUnaryClient(serviceName) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return async (method, requestData, callback) => {
            // Calculate deadline for connection check
            const deadline = new Date();
            const milliseconds = this._grpcDeadline;

            deadline.setMilliseconds(deadline.getMilliseconds() + milliseconds);

            try {
                // Wait for connection to be ready (similar to gRPC waitForReady)
                await this._waitForReady(deadline);

                // Build the full URL with appropriate scheme
                const address = this._buildUrl(this._address);
                // this will be executed in a browser environment so eslint is
                // disabled for the fetch call
                //eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(
                    `${address}/proto.${serviceName}/${method.name}`,
                    {
                        method: "POST",
                        headers: {
                            "content-type": "application/grpc-web+proto",
                            "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
                            "x-grpc-web": "1",
                        },
                        body: encodeRequest(requestData),
                    },
                );

                if (!response.ok) {
                    const error = new HttpError(
                        HttpStatus._fromValue(response.status),
                    );
                    callback(error, null);
                    return;
                }

                // Check headers for gRPC errors
                const grpcStatus = response.headers.get("grpc-status");
                const grpcMessage = response.headers.get("grpc-message");

                if (grpcStatus != null && grpcMessage != null) {
                    const error = new GrpcServiceError(
                        GrpcStatus._fromValue(parseInt(grpcStatus)),
                        ALL_WEB_NETWORK_NODES?.[this._address]?.toString(),
                    );
                    error.message = grpcMessage;
                    callback(error, null);
                    return;
                }

                const responseBuffer = await response.arrayBuffer();
                const unaryResponse = decodeUnaryResponse(responseBuffer);

                callback(null, unaryResponse);
            } catch (error) {
                if (error instanceof GrpcServiceError) {
                    callback(error, null);
                    return;
                }

                const err = new GrpcServiceError(
                    // retry on grpc web errors
                    GrpcStatus._fromValue(18),
                    ALL_WEB_NETWORK_NODES?.[this._address]?.toString(),
                );
                callback(err, null);
            }
        };
    }
}
