// SPDX-License-Identifier: Apache-2.0
import Channel, { encodeRequest, decodeUnaryResponse } from "./Channel.js";
import * as base64 from "../encoding/base64.native.js";
import HttpError from "../http/HttpError.js";
import HttpStatus from "../http/HttpStatus.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";
import GrpcServiceError from "../grpc/GrpcServiceError.js";
import GrpcStatus from "../grpc/GrpcStatus.js";

export default class NativeChannel extends Channel {
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
     * @override
     * @returns {void}
     */
    close() {
        // do nothing
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
            throw new GrpcServiceError(GrpcStatus.Timeout);
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
                    "content-type": "application/grpc-web-text",
                    "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
                    "x-grpc-web": "1",
                },
                body: base64.encode(new Uint8Array(0)), // Empty body for health check
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
            throw new GrpcServiceError(GrpcStatus.Unavailable);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === "AbortError") {
                throw new GrpcServiceError(GrpcStatus.Timeout);
            }

            if (error instanceof GrpcServiceError) {
                throw error;
            }

            // Network error - server is not reachable
            throw new GrpcServiceError(GrpcStatus.Unavailable);
        }
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

                const data = base64.encode(
                    new Uint8Array(encodeRequest(requestData)),
                );

                const shouldUseHttps = !(
                    this._address.includes("localhost") ||
                    this._address.includes("127.0.0.1")
                );

                const address = shouldUseHttps
                    ? `https://${this._address}`
                    : `http://${this._address}`;
                // this will be executed in react native environment sho
                // fetch should be available
                //eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(
                    `${address}/proto.${serviceName}/${method.name}`,
                    {
                        method: "POST",
                        headers: {
                            "content-type": "application/grpc-web-text",
                            "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
                            "x-accept-content-transfer-encoding": "base64",
                            "x-grpc-web": "1",
                        },
                        body: data,
                    },
                );

                if (!response.ok) {
                    const error = new HttpError(
                        HttpStatus._fromValue(response.status),
                    );
                    callback(error, null);
                }

                const blob = await response.blob();

                /** @type {string} */
                const responseData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        resolve(/** @type {string} */ (reader.result));
                    };
                    reader.onerror = reject;
                });

                let responseBuffer;
                if (
                    responseData.startsWith(
                        "data:application/octet-stream;base64,",
                    )
                ) {
                    responseBuffer = base64.decode(
                        responseData.split(
                            "data:application/octet-stream;base64,",
                        )[1],
                    );
                } else if (
                    responseData.startsWith(
                        "data:application/grpc-web+proto;base64,",
                    )
                ) {
                    responseBuffer = base64.decode(
                        responseData.split(
                            "data:application/grpc-web+proto;base64,",
                        )[1],
                    );
                } else {
                    throw new Error(
                        `Expected response data to be base64 encode with a 'data:application/octet-stream;base64,' or 'data:application/grpc-web+proto;base64,' prefix, but found: ${responseData}`,
                    );
                }

                const unaryResponse = decodeUnaryResponse(
                    // @ts-ignore
                    responseBuffer.buffer,
                    responseBuffer.byteOffset,
                    responseBuffer.byteLength,
                );

                callback(null, unaryResponse);
            } catch (error) {
                if (error instanceof GrpcServiceError) {
                    callback(error, null);
                    return;
                }

                callback(/** @type {Error} */ (error), null);
            }
        };
    }
}
