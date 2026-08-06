// SPDX-License-Identifier: Apache-2.0

import MirrorChannel from "./MirrorChannel.js";
import GrpcWebFrameParser, {
    TRAILER_FLAG,
    parseGrpcWebTrailers,
} from "./GrpcWebFrameParser.js";
import { encodeRequest } from "./Channel.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";

/**
 * @typedef {import("./MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * Mirror channel for browsers, implemented over gRPC-Web with a streaming
 * `fetch` response body. The configured mirror address must be a
 * gRPC-Web-capable endpoint (e.g. an Envoy proxy in front of the mirror
 * node gRPC API, or the local-node mirror gRPC-Web port).
 *
 * @internal
 */
export default class WebMirrorChannel extends MirrorChannel {
    /**
     * @internal
     * @param {string} address
     */
    constructor(address) {
        super();

        /**
         * @private
         * @type {string}
         */
        this._address = address;

        /**
         * @private
         * @type {Set<AbortController>}
         */
        this._abortControllers = new Set();
    }

    /**
     * @override
     * @returns {void}
     */
    close() {
        for (const controller of this._abortControllers) {
            controller.abort();
        }
        this._abortControllers.clear();
    }

    /**
     * @override
     * @internal
     * @param {string} serviceName
     * @param {string} methodName
     * @param {Uint8Array} requestData
     * @param {(data: Uint8Array) => void} callback
     * @param {(error: MirrorError | Error) => void} error
     * @param {() => void} end
     * @returns {() => void}
     */
    makeServerStreamRequest(
        serviceName,
        methodName,
        requestData,
        callback,
        error,
        end,
    ) {
        const controller = new AbortController();
        this._abortControllers.add(controller);

        const parser = new GrpcWebFrameParser();
        let ended = false;

        /**
         * @param {{type: number, data: Uint8Array}[]} frames
         */
        const handleFrames = (frames) => {
            for (const frame of frames) {
                if (ended) {
                    return;
                }

                if ((frame.type & TRAILER_FLAG) !== 0) {
                    const trailers = parseGrpcWebTrailers(frame.data);
                    ended = true;

                    if (trailers.code === 0) {
                        end();
                    } else {
                        error(trailers);
                    }
                } else {
                    callback(frame.data);
                }
            }
        };

        const url = `${buildUrl(
            this._address,
        )}/com.hedera.mirror.api.proto.${serviceName}/${methodName}`;

        // this executes in a browser environment so eslint is disabled
        // for the fetch call
        //eslint-disable-next-line n/no-unsupported-features/node-builtins
        fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/grpc-web+proto",
                "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
                "x-grpc-web": "1",
            },
            body: encodeRequest(requestData),
            signal: controller.signal,
        })
            .then(async (response) => {
                // Errors the proxy reports before the stream starts arrive
                // as response headers instead of a trailers frame
                const grpcStatus = response.headers.get("grpc-status");

                if (!response.ok || (grpcStatus != null && grpcStatus != "0")) {
                    ended = true;
                    error({
                        code: grpcStatus != null ? parseInt(grpcStatus) : 2,
                        details:
                            response.headers.get("grpc-message") ??
                            `received HTTP status ${response.status}`,
                    });
                    return;
                }

                if (response.body == null) {
                    throw new Error(
                        "response body streaming is not supported in this environment",
                    );
                }

                const reader = response.body.getReader();

                for (;;) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    handleFrames(parser.feed(value));

                    if (ended) {
                        await reader.cancel();
                        break;
                    }
                }

                if (!ended) {
                    // The stream closed without a trailers frame — signal a
                    // retryable UNAVAILABLE so subscriptions reconnect
                    ended = true;
                    error({
                        code: 14,
                        details: "stream ended without receiving trailers",
                    });
                }
            })
            .catch((/** @type {Error} */ err) => {
                if (ended || controller.signal.aborted) {
                    return;
                }

                ended = true;
                error(err instanceof Error ? err : new Error(String(err)));
            })
            .finally(() => {
                this._abortControllers.delete(controller);
            });

        return () => {
            this._abortControllers.delete(controller);
            controller.abort();
        };
    }
}

/**
 * @param {string} address
 * @returns {string}
 */
function buildUrl(address) {
    if (address.startsWith("http://") || address.startsWith("https://")) {
        return address;
    }

    const useHttp =
        address.includes("localhost") ||
        address.includes("127.0.0.1") ||
        address.includes(".cluster.local");

    return useHttp ? `http://${address}` : `https://${address}`;
}
