// SPDX-License-Identifier: Apache-2.0

import HttpTransportConfiguration from "../http/HttpTransportConfiguration.js";
import MirrorNodeHttpRetryPolicy from "./MirrorNodeHttpRetryPolicy.js";
import { freezeHeaders, normalizeRequestHeaders } from "../http/headers.js";

/**
 * @typedef {import("../http/HttpTransport.js").default} HttpTransport
 */

/**
 * Header names the SDK owns. `x-user-agent` identifies the SDK on every
 * mirror request, and a browser cannot set `User-Agent` at all, so neither
 * may be supplied by an application.
 */
const RESERVED_HEADERS = new Set(["user-agent", "x-user-agent"]);

/**
 * Everything a `Client` holds for mirror node REST access, in one value.
 *
 * - `transport` carries provenance. `null` (the default) means the SDK
 *   builds a `DefaultHttpTransport` on first use and owns it; a non-null
 *   value was supplied by the application, which owns it and which
 *   `Client.close()` never closes.
 * - `transportConfiguration` configures the transport the SDK would build.
 *   It is ignored when `transport` is non-null, and must be set before the
 *   first mirror REST call because the transport is built once per client.
 * - `retryPolicy` governs every mirror REST call made through the client.
 * - `requestHeaders` go on every mirror request, below any header a query
 *   sets for its endpoint. `user-agent` and `x-user-agent` are rejected,
 *   matched case-insensitively.
 *
 * `Client.setMirrorNodeHttpConfig` replaces the whole value rather than
 * merging, and `Client.getMirrorNodeHttpConfig` returns what was supplied
 * rather than what was resolved, so derive from the current value:
 * `client.setMirrorNodeHttpConfig({ ...client.getMirrorNodeHttpConfig(), transport })`.
 */
export default class MirrorNodeHttpConfig {
    /**
     * @param {object} [props]
     * @param {?HttpTransport} [props.transport]
     * @param {HttpTransportConfiguration | ConstructorParameters<typeof HttpTransportConfiguration>[0]} [props.transportConfiguration]
     * @param {MirrorNodeHttpRetryPolicy | ConstructorParameters<typeof MirrorNodeHttpRetryPolicy>[0]} [props.retryPolicy]
     * @param {Record<string, string>} [props.requestHeaders]
     */
    constructor(props = {}) {
        const transport = props.transport ?? null;
        if (
            transport != null &&
            typeof (
                /** @type {{roundTrip?: unknown}} */ (transport).roundTrip
            ) !== "function"
        ) {
            throw new TypeError(
                "MirrorNodeHttpConfig.transport must implement HttpTransport.roundTrip()",
            );
        }

        const requestHeaders = normalizeRequestHeaders(props.requestHeaders);
        for (const name of Object.keys(requestHeaders)) {
            if (RESERVED_HEADERS.has(name)) {
                throw new Error(
                    `MirrorNodeHttpConfig.requestHeaders: "${name}" is reserved; the SDK owns the identity header`,
                );
            }
        }

        /**
         * @readonly
         * @type {?HttpTransport}
         */
        this.transport = transport;

        /**
         * @readonly
         * @type {HttpTransportConfiguration}
         */
        this.transportConfiguration = HttpTransportConfiguration.from(
            props.transportConfiguration,
        );

        /**
         * @readonly
         * @type {MirrorNodeHttpRetryPolicy}
         */
        this.retryPolicy = MirrorNodeHttpRetryPolicy.from(props.retryPolicy);

        /**
         * @readonly
         * @type {Readonly<Record<string, string>>}
         */
        this.requestHeaders = freezeHeaders(requestHeaders);

        Object.freeze(this);
    }

    /**
     * @param {MirrorNodeHttpConfig | ConstructorParameters<typeof MirrorNodeHttpConfig>[0] | null | undefined} value
     * @returns {MirrorNodeHttpConfig}
     */
    static from(value) {
        return value instanceof MirrorNodeHttpConfig
            ? value
            : new MirrorNodeHttpConfig(value ?? {});
    }
}
