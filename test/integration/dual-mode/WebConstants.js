import {
    SOLO_NAMESPACE,
    installLocalPortForwardNetworkRemap as installRemap,
    remapNetworkToLocalPortForwards as remapNetwork,
} from "./SharedConstants.js";

/** In-cluster address mirror returns after address-book refresh. */
const node2Address = `envoy-proxy-node2-svc.${SOLO_NAMESPACE}.svc.cluster.local:8080`;

/** Local port-forward endpoints reachable from the CI runner host. */
const network = {
    "localhost:8080": "0.0.3",
    "localhost:8081": "0.0.4",
};

const mirrorNetwork = ["localhost:38081"];

/** Local port-forward for the second gRPC web proxy. */
const node2LocalAddress = "localhost:8081";

/** @deprecated kept for any legacy imports */
const node2PortToReplace = 8081;

/**
 * @param {import("../../../src/client/WebClient.js").default} client
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
    node2PortToReplace,
    node2LocalAddress,
    installLocalPortForwardNetworkRemap,
    remapNetworkToLocalPortForwards,
};
