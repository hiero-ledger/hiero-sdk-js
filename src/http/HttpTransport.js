// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./HttpRequest.js").default} HttpRequest
 * @typedef {import("./HttpResponse.js").default} HttpResponse
 */

/**
 * The HTTP transport SPI: one request in, one response out, and nothing
 * else. This is the type an application, a platform or a test implements
 * to route the SDK's mirror node REST traffic through its own HTTP stack
 * (a corporate proxy, mTLS, tracing, or a platform without `fetch`).
 *
 * Install one with `client.setMirrorNodeHttpConfig({ ...client.getMirrorNodeHttpConfig(), transport })`.
 * A transport the application injects is owned by the application: the
 * SDK never closes it.
 *
 * An implementation must satisfy the following; everything not listed is
 * free.
 *
 * - **A non-2xx status is a successful exchange.** Return the
 *   `HttpResponse` carrying the status; never fail on a status code.
 * - **Only a failure to obtain a response fails the call**, ideally with an
 *   `HttpTransportError` carrying one of the seven codes, so the retry
 *   policy knows whether repeating the exchange can help. Any other error
 *   is treated as non-retryable.
 * - **No policy at this layer.** No retry, no backoff, no status
 *   interpretation. The mirror node adapter above owns those.
 * - **Honour `request.deadline`** by abandoning the exchange, body
 *   included, and failing with `timeout-error`.
 * - **Honour the `AbortSignal`** by ending the exchange and failing with
 *   `cancelled-error`, and release the abort listener when the exchange
 *   ends so a long-lived signal does not accumulate closures.
 * - **Buffer the whole body** before resolving.
 * - **`roundTrip` is safe to call concurrently**, including concurrently
 *   with `close`.
 * - **After `close`, `roundTrip` fails fast** with `client-closed-error`.
 *   `close` is idempotent, never reports failure, and releases only what
 *   the transport itself owns.
 *
 * @abstract
 */
export default class HttpTransport {
    /**
     * Perform one exchange.
     *
     * @abstract
     * @param {HttpRequest} request
     * @param {AbortSignal} signal - the caller's cancellation; never null
     * @returns {Promise<HttpResponse>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    roundTrip(request, signal) {
        return Promise.reject(
            new Error("HttpTransport.roundTrip() is not implemented"),
        );
    }

    /**
     * Stop accepting new work, wait up to `closeTimeout` milliseconds for
     * exchanges already in flight, then abort whatever remains. A
     * transport that owns no resources may leave this as the default no-op.
     *
     * The drain is only observable through the returned promise, which is
     * why the JavaScript form returns one; `Client.close()` does not wait
     * for it.
     *
     * @param {number} [closeTimeout] - milliseconds, `>= 0`
     * @returns {void | Promise<void>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    close(closeTimeout) {}
}
