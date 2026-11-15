// SPDX-License-Identifier: Apache-2.0

/**
 * Loopback detection for mirror REST base URLs. The SDK uses a mirror node
 * URL as it is given, also on a local network, where Solo's ingress serves
 * every mirror node API on one port (#3590); these helpers only decide how
 * to treat a local mirror node, such as giving it a longer startup budget.
 */

/**
 * `scheme://host[:port][/path]`, with a bracketed IPv6 literal allowed as
 * the host. Parsed by hand rather than with `URL`, because React Native's
 * built-in `URL` throws on `hostname`, `protocol` and `port`, and this runs
 * on every mirror REST call there.
 */
const BASE_URL_PATTERN =
    /^(https?):\/\/(\[[^\]/?#]+\]|[^[\]/:?#]+)(?::(\d+))?(\/[^?#]*)?$/i;

/**
 * @typedef {object} ParsedBaseUrl
 * @property {string} scheme - `http` or `https`, lowercased
 * @property {string} host - the host name or IP literal as written
 * @property {?string} port
 * @property {string} path - the path, `""` when absent
 */

/**
 * Split a mirror REST base URL into its parts, or return `null` when it is
 * not a plain `scheme://host[:port][/path]` URL.
 *
 * @param {string} baseUrl
 * @returns {?ParsedBaseUrl}
 */
export function parseMirrorRestBaseUrl(baseUrl) {
    const match = BASE_URL_PATTERN.exec(baseUrl);
    if (match == null) {
        return null;
    }
    return {
        scheme: match[1].toLowerCase(),
        host: match[2],
        port: match[3] ?? null,
        path: match[4] ?? "",
    };
}

/**
 * Whether a base URL points at a loopback mirror node. `false` for a URL
 * that cannot be parsed.
 *
 * @param {string} baseUrl
 * @returns {boolean}
 */
export function isLoopbackBaseUrl(baseUrl) {
    const parsed = parseMirrorRestBaseUrl(baseUrl);
    return parsed != null && isLoopbackHost(parsed.host);
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
export function isLoopbackHost(hostname) {
    const host = hostname.toLowerCase();
    return (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "[::1]" ||
        host === "::1"
    );
}
