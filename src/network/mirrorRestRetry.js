/**
 * Returns true when the error is a transient network-level failure
 * that is safe to retry.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
export function isRetryableNetworkError(err) {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return (
        msg.includes("fetch failed") ||
        msg.includes("econnreset") ||
        msg.includes("econnrefused") ||
        msg.includes("etimedout") ||
        msg.includes("socket hang up") ||
        msg.includes("network")
    );
}

/**
 * Attempts to read the error body text from an HTTP response.
 * Returns null if the body is empty or unreadable.
 *
 * @param {Response} response
 * @returns {Promise<string|null>}
 */
export async function readErrorDetail(response) {
    try {
        const text = await response.text();
        return text ? text.trim() : null;
    } catch {
        return null;
    }
}