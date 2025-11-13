const node2Address = "network-node2-svc.solo.svc.cluster.local:50211";
const node2PortToReplace = 51211;
const network = {
    "127.0.0.1:50211": "0.0.3",
    "127.0.0.1:51211": "0.0.4",
};

const mirrorNetwork = ["localhost:5600"];

export { network, mirrorNetwork, node2Address, node2PortToReplace };
