import { SOLO_NAMESPACE } from "./SharedConstants.js";

/** In-cluster address mirror returns after address-book refresh. */
const node2Address = `network-node2-svc.${SOLO_NAMESPACE}.svc.cluster.local:50211`;

/** Local port-forward endpoints reachable from the CI runner host. */
const network = {
    "localhost:35211": "0.0.3",
    "localhost:36211": "0.0.4",
};

const mirrorNetwork = ["localhost:5600"];

/** Local port-forward for the second consensus node. */
const node2LocalAddress = "localhost:36211";

/**
 * Mirror address-book refresh returns in-cluster DNS names on port 50211.
 * Remap by account ID to localhost port-forwards used by hiero-solo-action in CI.
 *
 * @param {Record<string, string | import("../../../src/account/AccountId.js").default>} mirrorNetworkState
 * @returns {Record<string, string | import("../../../src/account/AccountId.js").default>}
 */
function remapNetworkToLocalPortForwards(mirrorNetworkState) {
    const localPortByAccountId = new Map(
        Object.entries(network).map(([addr, id]) => [String(id), addr]),
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
 * @param {import("../../../src/client/NodeClient.js").default} client
 */
function installLocalPortForwardNetworkRemap(client) {
    const originalUpdateNetwork = client.updateNetwork.bind(client);

    client.updateNetwork = async function updateNetworkWithLocalRemap() {
        await originalUpdateNetwork();

        const mirrorNetworkState = client.network;
        if (Object.keys(mirrorNetworkState).length > 0) {
            client.setNetwork(
                remapNetworkToLocalPortForwards(mirrorNetworkState),
            );
        }

        return client;
    };
}

export {
    network,
    mirrorNetwork,
    node2Address,
    node2LocalAddress,
    installLocalPortForwardNetworkRemap,
    remapNetworkToLocalPortForwards,
};
