import { SOLO_NAMESPACE } from "./SharedConstants.js";
const node2Address = `network-node2-svc.${SOLO_NAMESPACE}.svc.cluster.local:50211`;
// Must match the node2 HAProxy host port hardcoded in hiero-solo-action
// (36211 as of v0.22.0 — not configurable via an action input).
const node2PortToReplace = 36211;
// Node 1 is on 50211, not Solo's local 35211: these tests make the SDK
// replace its nodes with the address book, which lists node 1 as
// network-node1-svc.<namespace>.svc.cluster.local:50211 (its pod port), and
// the action points that name at 127.0.0.1. The DAB CI job forwards 50211.
const network = {
    "127.0.0.1:50211": "0.0.3",
    "127.0.0.1:36211": "0.0.4",
};

const mirrorNetwork = ["localhost:38081"];

export { network, mirrorNetwork, node2Address, node2PortToReplace };
