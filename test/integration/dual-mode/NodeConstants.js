import { SOLO_NAMESPACE } from "./SharedConstants.js";

const node2Address = `network-node2-svc.${SOLO_NAMESPACE}.svc.cluster.local:50211`;

const network = {
    "localhost:35211": "0.0.3",
    "localhost:36211": "0.0.4",
};

const mirrorNetwork = ["localhost:5600"];

/** NodeClient AddressBookQuery uses mirror gRPC during network refresh. */
const mirrorForAddressBookRefresh = ["localhost:5600"];

export { network, mirrorNetwork, mirrorForAddressBookRefresh, node2Address };
