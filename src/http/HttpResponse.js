// SPDX-License-Identifier: Apache-2.0

import { freezeHeaders, normalizeResponseHeaders } from "./headers.js";

/**
 * The result of one successful HTTP exchange.
 *
 * A non-2xx status is a successful exchange: `404` and `503` arrive here
 * carrying their `statusCode`, and the layer above decides what they mean.
 * Only a failure to obtain a response fails a `roundTrip`.
 *
 * Response header names are ASCII-lowercased and a header may repeat, so
 * `headers` maps each name to the list of values it carried. `body` is the
 * whole body, fully buffered, so a request can be replayed without any
 * body-lifecycle discipline at the call site.
 */
export default class HttpResponse {
    /**
     * @param {object} props
     * @param {number} props.statusCode
     * @param {Uint8Array} [props.body] - defaults to an empty body
     * @param {Record<string, string | string[]> | Iterable<[string, string]>} [props.headers]
     */
    constructor(props) {
        if (props == null || typeof props !== "object") {
            throw new TypeError("HttpResponse requires a props object");
        }

        if (
            typeof props.statusCode !== "number" ||
            !Number.isInteger(props.statusCode) ||
            props.statusCode < 0 ||
            props.statusCode > 65535
        ) {
            throw new TypeError(
                `HttpResponse.statusCode must be an integer status code, got ${String(
                    props.statusCode,
                )}`,
            );
        }

        const body = props.body ?? new Uint8Array(0);
        if (!(body instanceof Uint8Array)) {
            throw new TypeError("HttpResponse.body must be a Uint8Array");
        }

        /**
         * @readonly
         * @type {number}
         */
        this.statusCode = props.statusCode;

        /**
         * @readonly
         * @type {Uint8Array}
         */
        this.body = body;

        /**
         * Lowercased, list-valued response headers.
         *
         * @readonly
         * @type {Readonly<Record<string, string[]>>}
         */
        this.headers = freezeHeaders(normalizeResponseHeaders(props.headers));

        Object.freeze(this);
    }

    /**
     * `true` for a 2xx status.
     *
     * @returns {boolean}
     */
    get ok() {
        return this.statusCode >= 200 && this.statusCode < 300;
    }

    /**
     * The first value of a header, looked up by its lowercased name, or
     * `null` when the response did not carry it.
     *
     * @param {string} name
     * @returns {?string}
     */
    header(name) {
        const values = this.headers[name.toLowerCase()];
        return values != null && values.length > 0 ? values[0] : null;
    }
}
