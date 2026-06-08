import { SOLO_NAMESPACE } from "./SharedConstants.js";
const node2Address = `network-node2-svc.${SOLO_NAMESPACE}.svc.cluster.local:50211`;
const node2PortToReplace = 36211;
const network = {
    "127.0.0.1:35211": "0.0.3",
    "127.0.0.1:36211": "0.0.4",
};

const mirrorNetwork = ["localhost:5600"];

export { network, mirrorNetwork, node2Address, node2PortToReplace };
