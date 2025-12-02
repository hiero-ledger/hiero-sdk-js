import { SOLO_NAMESPACE } from "./SharedConstants.js";
const node2Address = `envoy-proxy-node2-svc.${SOLO_NAMESPACE}.svc.cluster.local:8080`;
const node2PortToReplace = 8081;
const network = {
    "localhost:8080": "0.0.3",
    "localhost:8081": "0.0.4",
};

const mirrorNetwork = ["localhost:5551"];

export { network, mirrorNetwork, node2Address, node2PortToReplace };
