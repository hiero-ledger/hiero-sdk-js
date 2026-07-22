// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * Bit set on the frame flag byte when the frame carries the gRPC trailers
 * instead of a message payload.
 *
 * @internal
 */
export const TRAILER_FLAG = 0x80;

/**
 * Incremental parser for gRPC-Web framed response bodies.
 *
 * A gRPC-Web body is a sequence of frames, each a 1-byte flag (bit 7 set
 * marks the trailers frame), a 4-byte big-endian payload length, and the
 * payload itself. Frames may be split across, or share, transport chunks,
 * so the parser buffers partial frames between `feed` calls.
 *
 * @internal
 */
export default class GrpcWebFrameParser {
    constructor() {
        /**
         * @private
         * @type {Uint8Array}
         */
        this._buffer = new Uint8Array(0);
    }

    /**
     * Feed a transport chunk and get back any frames it completed.
     *
     * @param {Uint8Array} chunk
     * @returns {{type: number, data: Uint8Array}[]}
     */
    feed(chunk) {
        let combined;
        if (this._buffer.length === 0) {
            combined = chunk;
        } else {
            combined = new Uint8Array(this._buffer.length + chunk.length);
            combined.set(this._buffer);
            combined.set(chunk, this._buffer.length);
        }

        /** @type {{type: number, data: Uint8Array}[]} */
        const frames = [];
        let offset = 0;

        while (offset + 5 <= combined.length) {
            const view = new DataView(
                combined.buffer,
                combined.byteOffset + offset,
                5,
            );
            const length = view.getUint32(1);

            if (offset + 5 + length > combined.length) {
                break;
            }

            frames.push({
                type: combined[offset],
                data: combined.slice(offset + 5, offset + 5 + length),
            });

            offset += 5 + length;
        }

        this._buffer = combined.slice(offset);

        return frames;
    }
}

/**
 * Parse a gRPC-Web trailers frame payload — HTTP/1.1 style
 * `name: value\r\n` pairs — into a mirror error shape.
 *
 * @internal
 * @param {Uint8Array} data
 * @returns {MirrorError}
 */
export function parseGrpcWebTrailers(data) {
    // Trailers are ASCII header lines
    let text = "";
    for (const byte of data) {
        text += String.fromCharCode(byte);
    }

    let code = null;
    let details = "";

    for (const line of text.split("\r\n")) {
        const separator = line.indexOf(":");
        if (separator === -1) {
            continue;
        }

        const name = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        if (name === "grpc-status") {
            code = parseInt(value);
        } else if (name === "grpc-message") {
            details = decodeURIComponent(value);
        }
    }

    if (code == null || isNaN(code)) {
        // 2 = UNKNOWN
        return { code: 2, details: "missing grpc-status in trailers" };
    }

    return { code, details };
}
