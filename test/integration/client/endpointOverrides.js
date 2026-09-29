// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    FetchHttpTransport,
    HttpRequest,
} from "../../../src/exports.js";

/**
 * @typedef {import("../../../src/client/Client.js").default<*, *>} Client
 * @typedef {import("../../../src/http/HttpTransport.js").default} HttpTransport
 */

/**
 * Point a client at a deployment whose endpoints differ from the ones it
 * was built with, such as a Solo network with its own port mappings.
 * Every variable is optional; an unset or empty one keeps what the client
 * already has.
 *
 * - `NODE_IP` and `NODE_ACCOUNT_ID`, set together: the consensus node
 *   `host:port` and its account ID. They replace the network map.
 * - `MIRROR_NETWORK`: the mirror node gRPC `host:port`.
 * - `MIRROR_NODE_REST_URL`: the mirror node HTTP ingress, such as
 *   `http://127.0.0.1:38081`. Every mirror REST call goes there.
 *
 * The same variable names configure the TCK server.
 *
 * @param {Client} client
 * @param {Record<string, string | undefined>} env
 * @returns {void}
 */
export function applyEndpointOverrides(client, env) {
    const nodeIp = env.NODE_IP || null;
    const nodeAccountId = env.NODE_ACCOUNT_ID || null;
    if ((nodeIp == null) !== (nodeAccountId == null)) {
        throw new Error("NODE_IP and NODE_ACCOUNT_ID must be set together");
    }

    if (nodeIp != null && nodeAccountId != null) {
        const accountId = parse("NODE_ACCOUNT_ID", nodeAccountId, (value) =>
            AccountId.fromString(value),
        );
        parse("NODE_IP", nodeIp, (value) =>
            client.setNetwork({ [value]: accountId }),
        );
    }

    if (env.MIRROR_NETWORK) {
        parse("MIRROR_NETWORK", env.MIRROR_NETWORK, (value) =>
            client.setMirrorNetwork([value]),
        );
    }

    if (env.MIRROR_NODE_REST_URL) {
        const origin = parse(
            "MIRROR_NODE_REST_URL",
            env.MIRROR_NODE_REST_URL,
            (value) => {
                const url = new URL(value);
                if (url.protocol !== "http:" && url.protocol !== "https:") {
                    throw new Error("expected an http:// or https:// URL");
                }
                return url.origin;
            },
        );
        client.setMirrorNodeHttpConfig({
            ...client.getMirrorNodeHttpConfig(),
            transport: ingressTransport(origin),
        });
    }
}

/**
 * A transport that sends every mirror REST request to `origin`, keeping the
 * path and query the SDK built. The SDK maps a loopback mirror node to one
 * port per mirror service (5551, 8084, 8545); an ingress serves them all on
 * one port.
 *
 * ponytail: FetchHttpTransport owns no connections, so nothing closes it.
 *
 * @param {string} origin
 * @param {HttpTransport} [inner]
 * @returns {HttpTransport}
 */
export function ingressTransport(origin, inner = FetchHttpTransport.create()) {
    return {
        roundTrip(request, signal) {
            const { pathname, search } = new URL(request.url);
            return inner.roundTrip(
                new HttpRequest({
                    ...request,
                    url: origin + pathname + search,
                }),
                signal,
            );
        },
        close: (closeTimeout) => inner.close(closeTimeout),
    };
}

/**
 * @template T
 * @param {string} name
 * @param {string} value
 * @param {(value: string) => T} apply
 * @returns {T}
 */
function parse(name, value, apply) {
    try {
        return apply(value);
    } catch (error) {
        throw new Error(
            `Invalid ${name} "${value}": ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
