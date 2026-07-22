// SPDX-License-Identifier: Apache-2.0

import MirrorChannel from "./MirrorChannel.js";
import GrpcWebFrameParser, {
    TRAILER_FLAG,
    parseGrpcWebTrailers,
} from "./GrpcWebFrameParser.js";
import * as base64 from "../encoding/base64.native.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";

/**
 * @typedef {import("./MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * Mirror channel for React Native, implemented over gRPC-Web in text
 * (base64) mode. React Native's `fetch` cannot stream response bodies, so
 * this uses `XMLHttpRequest` with incremental `responseText` reads — the
 * base64 wire format keeps the streamed text ASCII-safe. The configured
 * mirror address must be a gRPC-Web-capable endpoint.
 *
 * @internal
 */
export default class NativeMirrorChannel extends MirrorChannel {
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
         * @type {Set<XMLHttpRequest>}
         */
        this._requests = new Set();
    }

    /**
     * @override
     * @returns {void}
     */
    close() {
        for (const request of this._requests) {
            request.abort();
        }
        this._requests.clear();
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
        const frameParser = new GrpcWebFrameParser();
        const base64Decoder = new Base64StreamDecoder();
        let seenLength = 0;
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

        const consumeResponseText = () => {
            const text = xhr.responseText;

            if (text.length > seenLength) {
                const chunk = text.slice(seenLength);
                seenLength = text.length;
                handleFrames(frameParser.feed(base64Decoder.feed(chunk)));
            }
        };

        const url = `${buildUrl(
            this._address,
        )}/com.hedera.mirror.api.proto.${serviceName}/${methodName}`;

        const xhr = new XMLHttpRequest();
        this._requests.add(xhr);

        xhr.open("POST", url);
        xhr.responseType = "text";
        xhr.setRequestHeader("content-type", "application/grpc-web-text");
        xhr.setRequestHeader("accept", "application/grpc-web-text");
        xhr.setRequestHeader("x-user-agent", `${SDK_NAME}/${SDK_VERSION}`);
        xhr.setRequestHeader("x-grpc-web", "1");

        xhr.onprogress = consumeResponseText;

        xhr.onload = () => {
            this._requests.delete(xhr);
            consumeResponseText();

            if (!ended) {
                // The stream closed without a trailers frame — signal a
                // retryable UNAVAILABLE so subscriptions reconnect
                ended = true;
                error({
                    code: 14,
                    details: "stream ended without receiving trailers",
                });
            }
        };

        xhr.onerror = () => {
            this._requests.delete(xhr);

            if (!ended) {
                ended = true;
                error({ code: 14, details: "transport error" });
            }
        };

        // Frame the request — 1-byte flag, 4-byte big-endian length,
        // payload — then base64 it for text mode
        const frame = new Uint8Array(requestData.length + 5);
        new DataView(frame.buffer).setUint32(1, requestData.length);
        frame.set(requestData, 5);
        xhr.send(base64.encode(frame));

        return () => {
            this._requests.delete(xhr);
            ended = true;
            xhr.abort();
        };
    }
}

/**
 * Incremental base64 decoder for gRPC-Web text mode. Proxies may
 * base64-encode each frame independently, so the stream can contain
 * padding mid-stream; padded segments are decoded as they complete and
 * unpadded text is decoded in 4-character groups.
 *
 * @internal
 */
export class Base64StreamDecoder {
    constructor() {
        /**
         * @private
         * @type {string}
         */
        this._pending = "";
    }

    /**
     * @param {string} text
     * @returns {Uint8Array}
     */
    feed(text) {
        this._pending += text;

        /** @type {Uint8Array[]} */
        const parts = [];

        for (;;) {
            const padding = this._pending.indexOf("=");

            if (padding !== -1) {
                let segmentEnd = padding + 1;
                if (this._pending[segmentEnd] === "=") {
                    segmentEnd += 1;
                }

                parts.push(base64.decode(this._pending.slice(0, segmentEnd)));
                this._pending = this._pending.slice(segmentEnd);
                continue;
            }

            const usable = this._pending.length - (this._pending.length % 4);
            if (usable > 0) {
                parts.push(base64.decode(this._pending.slice(0, usable)));
                this._pending = this._pending.slice(usable);
            }
            break;
        }

        let total = 0;
        for (const part of parts) {
            total += part.length;
        }

        const out = new Uint8Array(total);
        let offset = 0;
        for (const part of parts) {
            out.set(part, offset);
            offset += part.length;
        }

        return out;
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
        address.includes("localhost") || address.includes("127.0.0.1");

    return useHttp ? `http://${address}` : `https://${address}`;
}
