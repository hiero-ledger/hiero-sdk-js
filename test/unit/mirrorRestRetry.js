// SPDX-License-Identifier: Apache-2.0

import { isRetryableNetworkError } from "../../src/network/mirrorRestRetry.js";

/**
 * @param {string} message
 * @param {string} [name]
 */
function error(message, name) {
    const err = new Error(message);
    if (name) err.name = name;
    return err;
}

describe("mirrorRestRetry", function () {
    describe("isRetryableNetworkError", function () {
        it("classifies an HTTP status message by status alone", function () {
            expect(isRetryableNetworkError(error("HTTP 500"))).to.be.true;
            expect(isRetryableNetworkError(error("HTTP 503: Unavailable"))).to
                .be.true;
            expect(isRetryableNetworkError(error("HTTP 404"))).to.be.false;
            expect(isRetryableNetworkError(error("HTTP 429"))).to.be.false;
        });

        it("ignores transport words inside a 4xx body", function () {
            // Real mirror node body for an unmapped route: the request path
            // contains "network".
            expect(
                isRetryableNetworkError(
                    error(
                        "HTTP 404: Not Found: No static resource api/v1/network/nodes for request '/api/v1/network/nodes'.",
                    ),
                ),
            ).to.be.false;
            expect(
                isRetryableNetworkError(
                    error(
                        "HTTP 400: Bad Request: request timeout must be positive",
                    ),
                ),
            ).to.be.false;
            expect(
                isRetryableNetworkError(
                    error('HTTP 404: {"path":"/api/v1/network/nodes"}'),
                ),
            ).to.be.false;
        });

        it("retries abort and timeout signals", function () {
            expect(isRetryableNetworkError(error("aborted", "AbortError"))).to
                .be.true;
            expect(isRetryableNetworkError(error("timed out", "TimeoutError")))
                .to.be.true;
        });

        it("retries fetch transport failures from every runtime", function () {
            for (const message of [
                "fetch failed", // Node (undici)
                "Failed to fetch", // Chrome, Edge
                "Load failed", // Safari
                "NetworkError when attempting to fetch resource.", // Firefox
                "Network request failed", // React Native
                "connect ECONNREFUSED 127.0.0.1:5551",
                "connect ENETUNREACH 10.0.0.1:443",
                "read ECONNRESET",
            ]) {
                expect(isRetryableNetworkError(new TypeError(message)), message)
                    .to.be.true;
            }
        });

        it("does not retry parse errors or non-errors", function () {
            expect(
                isRetryableNetworkError(new SyntaxError("Unexpected token <")),
            ).to.be.false;
            expect(isRetryableNetworkError("HTTP 503")).to.be.false;
            expect(isRetryableNetworkError(null)).to.be.false;
            expect(isRetryableNetworkError(undefined)).to.be.false;
        });
    });
});
