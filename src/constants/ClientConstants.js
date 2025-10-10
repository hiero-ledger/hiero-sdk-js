/* NOSONAR */
import AccountId from "../account/AccountId.js";

// MAINNET node proxies are the same for both 'WebClient' and 'NativeClient'
export const MAINNET = {
    "node00.swirldslabs.com:443": new AccountId(3),
    "node01-00-grpc.swirlds.com:443": new AccountId(4),
    "node03.swirldslabs.com:443": new AccountId(6),
    "node04.swirldslabs.com:443": new AccountId(7),
    "node05.swirldslabs.com:443": new AccountId(8),
    "node06.swirldslabs.com:443": new AccountId(9),
    "node07.swirldslabs.com:443": new AccountId(10),
    "node09.swirldslabs.com:443": new AccountId(12),
    "node10.swirldslabs.com:443": new AccountId(13),
    "node11.swirldslabs.com:443": new AccountId(14),
    "node12.swirldslabs.com:443": new AccountId(15),
    "node14.swirldslabs.com:443": new AccountId(17),
    "node15.swirldslabs.com:443": new AccountId(18),
    "node16.swirldslabs.com:443": new AccountId(19),
    "node17.swirldslabs.com:443": new AccountId(20),
    "node18.swirldslabs.com:443": new AccountId(21),
    "node19.swirldslabs.com:443": new AccountId(22),
    "node20.swirldslabs.com:443": new AccountId(23),
    "node21.swirldslabs.com:443": new AccountId(24),
    "node22.swirldslabs.com:443": new AccountId(25),
    "node24.swirldslabs.com:443": new AccountId(27),
    "node25.swirldslabs.com:443": new AccountId(28),
    "node26.swirldslabs.com:443": new AccountId(29),
    "node27.swirldslabs.com:443": new AccountId(30),
    "node28.swirldslabs.com:443": new AccountId(31),
    "node29.swirldslabs.com:443": new AccountId(32),
    "node30.swirldslabs.com:443": new AccountId(33),
    "node31.swirldslabs.com:443": new AccountId(34),
    // "node32.swirldslabs.com:443": new AccountId(35), - temporarily disabled
    "node33.swirldslabs.com:443": new AccountId(36),
    "node34.swirldslabs.com:443": new AccountId(37),
};

export const WEB_TESTNET = {
    "testnet-node00-00-grpc.hedera.com:443": new AccountId(3),
    "testnet-node01-00-grpc.hedera.com:443": new AccountId(4),
    "testnet-node02-00-grpc.hedera.com:443": new AccountId(5),
    "testnet-node03-00-grpc.hedera.com:443": new AccountId(6),
    "testnet-node04-00-grpc.hedera.com:443": new AccountId(7),
    "testnet-node05-00-grpc.hedera.com:443": new AccountId(8),
    "testnet-node06-00-grpc.hedera.com:443": new AccountId(9),
};

export const WEB_PREVIEWNET = {
    "previewnet-node00-00-grpc.hedera.com:443": new AccountId(3),
    "previewnet-node01-00-grpc.hedera.com:443": new AccountId(4),
    "previewnet-node02-00-grpc.hedera.com:443": new AccountId(5),
    "previewnet-node03-00-grpc.hedera.com:443": new AccountId(6),
    "previewnet-node04-00-grpc.hedera.com:443": new AccountId(7),
    "previewnet-node05-00-grpc.hedera.com:443": new AccountId(8),
    "previewnet-node06-00-grpc.hedera.com:443": new AccountId(9),
};

export const NATIVE_TESTNET = {
    "testnet-node00-00-grpc.hedera.com:443": new AccountId(3),
};

export const NATIVE_PREVIEWNET = {
    "previewnet-node00-00-grpc.hedera.com:443": new AccountId(3),
};

export const LocalNodeNetwork = {
    "127.0.0.1:50211": new AccountId(3),
};

export const LocalNodeWebNetwork = {
    "localhost:8080": new AccountId(3),
};

/**
 * @type {Record<string, AccountId>}
 */
export const ALL_WEB_NETWORK_NODES = {
    ...MAINNET,
    ...WEB_TESTNET,
    ...WEB_PREVIEWNET,
};

/**
 * @type {Record<string, string>}
 */
export const ALL_NETWORK_IPS = {
    // MAINNET
    "34.239.82.6:": "0.0.3",
    "35.237.200.180:": "0.0.3",
    "3.130.52.236:": "0.0.4",
    "35.186.191.247:": "0.0.4",
    "3.18.18.254:": "0.0.5",
    "35.192.2.25:": "0.0.5",
    "74.50.117.35:": "0.0.5",
    "23.111.186.250:": "0.0.5",
    "107.155.64.98:": "0.0.5",
    "13.52.108.243:": "0.0.6",
    "35.199.161.108:": "0.0.6",
    "3.114.54.4:": "0.0.7",
    "35.203.82.240:": "0.0.7",
    "35.236.5.219:": "0.0.8",
    "35.183.66.150:": "0.0.8",
    "35.181.158.250:": "0.0.9",
    "35.197.192.225:": "0.0.9",
    "177.154.62.234:": "0.0.10",
    "3.248.27.48:": "0.0.10",
    "35.242.233.154:": "0.0.10",
    "35.204.86.32:": "0.0.12",
    "35.177.162.180:": "0.0.12",
    "34.215.192.104:": "0.0.13",
    "35.234.132.107:": "0.0.13",
    "52.8.21.141:": "0.0.14",
    "35.236.2.27:": "0.0.14",
    "35.228.11.53:": "0.0.15",
    "3.121.238.26:": "0.0.15",
    "34.86.212.247:": "0.0.17",
    "18.232.251.19:": "0.0.17",
    "141.94.175.187:": "0.0.18",
    "34.89.87.138:": "0.0.19",
    "18.168.4.59:": "0.0.19",
    "34.82.78.255:": "0.0.20",
    "52.39.162.216:": "0.0.20",
    "34.76.140.109:": "0.0.21",
    "13.36.123.209:": "0.0.21",
    "52.78.202.34:": "0.0.22",
    "34.64.141.166:": "0.0.22",
    "3.18.91.176:": "0.0.23",
    "35.232.244.145:": "0.0.23",
    "69.167.169.208:": "0.0.23",
    "34.89.103.38:": "0.0.24",
    "18.135.7.211:": "0.0.24",
    "34.93.112.7:": "0.0.25",
    "13.232.240.207:": "0.0.25",
    "13.56.4.96:": "0.0.27",
    "34.125.200.96:": "0.0.27",
    "35.198.220.75:": "0.0.28",
    "18.139.47.5:": "0.0.28",
    "54.74.60.120:": "0.0.29",
    "34.142.71.129:": "0.0.29",
    "80.85.70.197:": "0.0.29",
    "35.234.249.150:": "0.0.30",
    "34.201.177.212:": "0.0.30",
    "217.76.57.165:": "0.0.31",
    "3.77.94.254:": "0.0.31",
    "34.107.78.179:": "0.0.31",
    "34.86.186.151:": "0.0.32",
    "3.20.81.230:": "0.0.32",
    "18.136.65.22:": "0.0.33",
    "34.142.172.228:": "0.0.33",
    "34.16.139.248:": "0.0.34",
    "35.155.212.90:": "0.0.34",
    // TESTNET
    "34.94.106.61:": "0.0.3",
    "50.18.132.211:": "0.0.3",
    "3.212.6.13:": "0.0.4",
    "35.237.119.55:": "0.0.4",
    "35.245.27.193:": "0.0.5",
    "52.20.18.86:": "0.0.5",
    "34.83.112.116:": "0.0.6",
    "54.70.192.33:": "0.0.6",
    "34.94.160.4:": "0.0.7",
    "54.176.199.109:": "0.0.7",
    "35.155.49.147:": "0.0.8",
    "34.106.102.218:": "0.0.8",
    "34.133.197.230:": "0.0.9",
    "52.14.252.207:": "0.0.9",
    // LOCAL NODE
    "127.0.0.1:": "0.0.3",
    // PREVIEW NET
    "3.211.248.172:": "0.0.3",
    "35.231.208.148:": "0.0.3",
    "35.199.15.177:": "0.0.4",
    "3.133.213.146:": "0.0.4",
    "35.225.201.195:": "0.0.5",
    "52.15.105.130:": "0.0.5",
    "54.241.38.1:": "0.0.6",
    "35.247.109.135:": "0.0.6",
    "54.177.51.127:": "0.0.7",
    "35.235.65.51:": "0.0.7",
    "34.106.247.65:": "0.0.8",
    "35.83.89.171:": "0.0.8",
    "50.18.17.93:": "0.0.9",
    "34.125.23.49:": "0.0.9",
};

export const MirrorNetwork = {
    /**
     * @param {string} name
     * @returns {string[]}
     */
    fromName(name) {
        switch (name) {
            case "mainnet":
                return MirrorNetwork.MAINNET;

            case "testnet":
                return MirrorNetwork.TESTNET;

            case "previewnet":
                return MirrorNetwork.PREVIEWNET;

            case "local-node":
                return MirrorNetwork.LOCAL_NODE;

            default:
                throw new Error(`unknown network name: ${name}`);
        }
    },

    MAINNET: ["mainnet-public.mirrornode.hedera.com:443"],
    TESTNET: ["testnet.mirrornode.hedera.com:443"],
    PREVIEWNET: ["previewnet.mirrornode.hedera.com:443"],
    LOCAL_NODE: ["127.0.0.1:5600"],
};

export const WebMirrorNetwork = {
    ...MirrorNetwork,
    LOCAL_NODE: ["127.0.0.1:5551"],
};

export const WebNetwork = {
    /**
     * @param {string} name
     * @returns {{[key: string]: (string | AccountId)}}
     */
    fromName(name) {
        switch (name) {
            case "mainnet":
                return WebNetwork.MAINNET;

            case "testnet":
                return WebNetwork.TESTNET;

            case "previewnet":
                return WebNetwork.PREVIEWNET;

            case "local-node":
                return WebNetwork.LOCAL_NODE;

            default:
                throw new Error(`unknown network name: ${name}`);
        }
    },

    MAINNET: MAINNET,
    TESTNET: WEB_TESTNET,
    PREVIEWNET: WEB_PREVIEWNET,
    LOCAL_NODE: LocalNodeWebNetwork,
};
