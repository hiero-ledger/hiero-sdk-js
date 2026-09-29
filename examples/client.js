// SPDX-License-Identifier: Apache-2.0

import {
    AccountId,
    Client,
    FetchHttpTransport,
    HttpRequest,
} from "@hiero-ledger/sdk";

/**
 * `Client.forName(name)`, pointed at the endpoints in these optional
 * environment variables, so the examples run against a local network with
 * its own port mappings (a Solo deployment, say) without source edits. An
 * unset or empty variable keeps the named network's default.
 *
 * - `NODE_IP` and `NODE_ACCOUNT_ID`, set together: the consensus node
 *   `host:port` and its account ID. They replace the network map.
 * - `MIRROR_NETWORK`: the mirror node gRPC `host:port`.
 * - `MIRROR_NODE_REST_URL`: the mirror node HTTP ingress, such as
 *   `http://127.0.0.1:38081`. Every mirror REST call goes there.
 *
 * The integration tests read the same variables in
 * `test/integration/client/endpointOverrides.js`. The examples load the SDK
 * from `lib/` and the tests from `src/`, so the two cannot share a module.
 *
 * @param {string} name - `mainnet`, `testnet`, `previewnet` or `local-node`
 * @returns {Client}
 */
export function clientForName(name) {
    if (!name) {
        throw new Error("The HEDERA_NETWORK environment variable is required");
    }
    const client = Client.forName(name);
    const env = process.env;

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
        // The SDK maps a loopback mirror node to one port per mirror service
        // (5551, 8084, 8545); an ingress serves them all on one port, so
        // keep the path and query the SDK built and swap the origin.
        // Note: FetchHttpTransport owns no connections, so nothing closes it.
        const inner = FetchHttpTransport.create();
        client.setMirrorNodeHttpConfig({
            ...client.getMirrorNodeHttpConfig(),
            transport: {
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
            },
        });
    }

    return client;
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
