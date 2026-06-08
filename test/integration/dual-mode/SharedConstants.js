// This should be exactly the same as the namespace in the Hiero Solo action
// otherwise the DAB tests will fail, as domain names for nodes will not be resolved
export const SOLO_NAMESPACE = "solo";

/**
 * Mirror address-book refresh returns in-cluster DNS names. Remap by account ID
 * to localhost port-forwards used by hiero-solo-action in CI.
 *
 * @param {Record<string, string | import("../../../src/account/AccountId.js").default>} mirrorNetworkState
 * @param {Record<string, string>} localNetwork
 * @param {string} node2LocalAddress
 * @returns {Record<string, string | import("../../../src/account/AccountId.js").default>}
 */
export function remapNetworkToLocalPortForwards(
    mirrorNetworkState,
    localNetwork,
    node2LocalAddress,
) {
    const localPortByAccountId = new Map(
        Object.entries(localNetwork).map(([addr, id]) => [String(id), addr]),
    );

    /** @type {Record<string, string | import("../../../src/account/AccountId.js").default>} */
    const remapped = {};

    for (const [, accountId] of Object.entries(mirrorNetworkState)) {
        const idStr = accountId.toString();
        const localAddr =
            localPortByAccountId.get(idStr) ?? node2LocalAddress;
        remapped[localAddr] = accountId;
    }

    return remapped;
}

/**
 * Mirror address-book refresh runs during INVALID_NODE_ACCOUNT retries. Remap
 * immediately so the same execute() keeps using localhost port-forwards in CI.
 *
 * @param {import("../../../src/client/Client.js").default} client
 * @param {Record<string, string>} localNetwork
 * @param {string} node2LocalAddress
 */
export function installLocalPortForwardNetworkRemap(
    client,
    localNetwork,
    node2LocalAddress,
) {
    const originalUpdateNetwork = client.updateNetwork.bind(client);

    client.updateNetwork = async function updateNetworkWithLocalRemap() {
        await originalUpdateNetwork();

        const mirrorNetworkState = client.network;
        if (Object.keys(mirrorNetworkState).length > 0) {
            client.setNetwork(
                remapNetworkToLocalPortForwards(
                    mirrorNetworkState,
                    localNetwork,
                    node2LocalAddress,
                ),
            );
        }

        return client;
    };
}
