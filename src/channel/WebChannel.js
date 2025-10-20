// SPDX-License-Identifier: Apache-2.0
import {
    ALL_WEB_NETWORK_NODES,
    DEFAULT_GRPC_DEADLINE,
} from "../constants/ClientConstants.js";
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
        super();

        /**
         * @type {string}
         * @private
         */
        this._address = address;

        /**
         * gRPC deadline in milliseconds for initial connection to a node
         *
         * @type {number}
         * @private
         */
        this._grpcDeadline = grpcDeadline ?? DEFAULT_GRPC_DEADLINE;

        /**
         * Flag indicating if the connection is ready (health check has passed)
         * Set to true after the first successful health check
         *
         * @type {boolean}
         * @private
         */
        this._isReady = false;
    }

    /**
     * Check if the gRPC-Web proxy is reachable and healthy
     * Performs a POST request and verifies the response has gRPC-Web headers,
     * which indicates the proxy is running and processing gRPC requests.
     * Results are cached per address for the entire lifecycle.
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

        const shouldUseHttps = !(
            this._address.includes("localhost") ||
            this._address.includes("127.0.0.1")
        );

        const address = shouldUseHttps
            ? `https://${this._address}`
            : `http://${this._address}`;

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

            // Check if response is successful (200) and has gRPC headers
            if (response.status === 200) {
                const grpcStatus = response.headers.get("grpc-status");
                const grpcMessage = response.headers.get("grpc-message");

                // If gRPC headers exist, the proxy is running and processing requests
                if (grpcStatus != null || grpcMessage != null) {
                    // Mark this connection as ready
                    this._isReady = true;
                    return; //  Healthy - gRPC-Web proxy is responding
                }
            }

            // If we get here, either status isn't 200 or no gRPC headers present
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
                // Check if address already contains a scheme
                const hasScheme =
                    this._address.startsWith("http://") ||
                    this._address.startsWith("https://");
                // Wait for connection to be ready (similar to gRPC waitForReady)
                await this._waitForReady(deadline);

                let address;
                if (hasScheme) {
                    // Use the address as-is if it already has a scheme
                    address = this._address;
                } else {
                    // Only prepend scheme if none exists
                    const shouldUseHttps = !(
                        this._address.includes("localhost") ||
                        this._address.includes("127.0.0.1")
                    );

                    address = shouldUseHttps
                        ? `https://${this._address}`
                        : `http://${this._address}`;
                }
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
