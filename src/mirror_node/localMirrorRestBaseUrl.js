// SPDX-License-Identifier: Apache-2.0

/**
 * The mirror node REST endpoint families a local network serves on
 * different ports: `rest` (`/balances`, `/accounts`, `/network/nodes`),
 * `rest-java` (`/network/fees`, `/network/registered-nodes`) and `web3`
 * (`/contracts/call`).
 *
 * @typedef {"rest" | "rest-java" | "web3"} MirrorRestEndpointFamily
 */

/**
 * Ports a local mirror node (hiero-local-node, Solo) serves each family on.
 */
const LOCAL_PORTS = Object.freeze({
    rest: 5551,
    "rest-java": 8084,
    web3: 8545,
});

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
 * Resolve the base URL for an endpoint family on a local network.
 *
 * A hosted mirror node serves every family behind one ingress, so the base
 * URL is returned unchanged. A local one serves them on different ports and
 * over plain HTTP, and this is the single place that mapping lives: a
 * bridge to be deleted once the ingress proposal resolves local ports at
 * the base URL, rather than a rewrite repeated at every call site.
 *
 * @param {string} baseUrl - the client's mirror REST base URL
 * @param {MirrorRestEndpointFamily} family
 * @returns {string}
 */
export function resolveMirrorRestBaseUrl(baseUrl, family) {
    const parsed = parseMirrorRestBaseUrl(baseUrl);
    if (parsed == null || !isLoopbackHost(parsed.host)) {
        return baseUrl;
    }

    const port = LOCAL_PORTS[family];
    if (port == null) {
        throw new Error(`unknown mirror REST endpoint family: ${family}`);
    }

    return `http://${parsed.host}:${port}${parsed.path.replace(/\/+$/, "")}`;
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
