import {
    SOLO_NAMESPACE,
    installLocalPortForwardNetworkRemap as installRemap,
    remapNetworkToLocalPortForwards as remapNetwork,
} from "./SharedConstants.js";

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
 * @param {import("../../../src/client/NodeClient.js").default} client
 */
function installLocalPortForwardNetworkRemap(client) {
    installRemap(client, network, node2LocalAddress);
}

/**
 * @param {Record<string, string | import("../../../src/account/AccountId.js").default>} mirrorNetworkState
 */
function remapNetworkToLocalPortForwards(mirrorNetworkState) {
    return remapNetwork(mirrorNetworkState, network, node2LocalAddress);
}

export {
    network,
    mirrorNetwork,
    node2Address,
    node2LocalAddress,
    installLocalPortForwardNetworkRemap,
    remapNetworkToLocalPortForwards,
};
