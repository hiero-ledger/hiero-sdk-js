// SPDX-License-Identifier: Apache-2.0

/**
 * Shared retry-classification helpers for mirror-node REST queries.
 *
 * These helpers describe the retry policy for fetch-based mirror REST
 * endpoints — distinct from the gRPC `Executable` retry policy, which
 * keys off gRPC error codes and is irrelevant on the HTTP transport.
 */

/**
 * Recognize transient network/timeout errors that should be retried.
 *
 * Returns `true` for:
 * - `AbortError` / `TimeoutError` — request was cancelled by an abort signal
 *   (typically the caller's deadline)
 * - Errors whose message starts with `"HTTP 5"` — the caller's own
 *   classifier already deemed the response a 5xx
 * - Generic transport-level failure messages (`timeout`, `network`,
 *   `fetch failed`, `Failed to fetch`, `Load failed`, `ECONN…`,
 *   `ENETUNREACH`) — Node, Chrome/Edge, Safari and Firefox fetch surface
 *   these for connection-reset and DNS-style failures
 *
 * An `"HTTP <status>"` message is classified by its status alone. The
 * mirror node echoes the request path in its error body, and every mirror
 * REST path contains `network`, `timeout` or similar words, so the
 * transport regex must never see a status message.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
export function isRetryableNetworkError(err) {
    if (!(err instanceof Error)) return false;
    const name = err.name || "";
    const message = err.message || "";
    if (name === "AbortError" || name === "TimeoutError") return true;
    if (/^HTTP \d{3}/.test(message)) return /^HTTP 5\d\d/.test(message);
    return /timeout|timed out|network|fetch failed|failed to fetch|load failed|ECONN|ENETUNREACH/i.test(
        message,
    );
}

/**
 * Read a short, human-readable error detail from a mirror-node REST
 * error response. Mirror node returns JSON of the form
 * `{"_status":{"messages":[{"message":"...","detail":"..."}]}}`, but
 * plain-text responses are also handled.
 *
 * @param {Response} response
 * @returns {Promise<string>} The detail string (truncated to 500 chars
 *   for plain text), or an empty string when the body is empty or
 *   unreadable.
 */
export async function readErrorDetail(response) {
    try {
        const text = await response.text();
        if (!text) return "";
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const parsed =
                /** @type {{_status?: {messages?: {message?: string, detail?: string}[]}}} */ (
                    JSON.parse(text)
                );
            const first = parsed._status?.messages?.[0];
            // Mirror node's error envelope: `message` is the HTTP reason
            // phrase ("Bad Request") and `detail` is the actual cause
            // ("Unable to parse transaction", "Unknown transaction type",
            // etc.). Prefer detail; fall back to message.
            const detail = first?.detail;
            const message = first?.message;
            if (typeof detail === "string" && detail.length > 0) {
                return typeof message === "string" && message.length > 0
                    ? `${message}: ${detail}`
                    : detail;
            }
            if (typeof message === "string" && message.length > 0) {
                return message;
            }
        } catch {
            // not JSON — fall through to the raw text
        }
        return text.slice(0, 500);
    } catch {
        return "";
    }
}
