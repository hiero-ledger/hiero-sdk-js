import fs from "fs";
import util from "util";
import Client from "./Client.js";
import NodeChannel from "../channel/NodeChannel.js";
import NodeMirrorChannel from "../channel/NodeMirrorChannel.js";
import AccountId from "../account/AccountId.js";
import LedgerId from "../LedgerId.js";

const readFileAsync = util.promisify(fs.readFile);

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
 */
//@typedef {import("./Client.js").NetworkName} NetworkName

export const Network = {
    /**
     * @param {string} name
     * @returns {{[key: string]: (string | AccountId)}}
     */
    fromName(name) {
        switch (name) {
            case "mainnet":
                return Network.MAINNET;

            case "testnet":
                return Network.TESTNET;

            case "previewnet":
                return Network.PREVIEWNET;

            default:
                throw new Error(`unknown network name: ${name}`);
        }
    },

    MAINNET: {
        "34.70.108.154:50211": new AccountId(3),
    },

    TESTNET: {
        "0.testnet.hedera.com:50211": new AccountId(3),
        "1.testnet.hedera.com:50211": new AccountId(4),
        "2.testnet.hedera.com:50211": new AccountId(5),
        "3.testnet.hedera.com:50211": new AccountId(6),
        "4.testnet.hedera.com:50211": new AccountId(7),
    },

    PREVIEWNET: {
        "0.previewnet.hedera.com:50211": new AccountId(3),
        "1.previewnet.hedera.com:50211": new AccountId(4),
        "2.previewnet.hedera.com:50211": new AccountId(5),
        "3.previewnet.hedera.com:50211": new AccountId(6),
        "4.previewnet.hedera.com:50211": new AccountId(7),
    },
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

            default:
                throw new Error(`unknown network name: ${name}`);
        }
    },

    MAINNET: ["hcs.mainnet.mirrornode.hedera.com:5600"],
    TESTNET: ["hcs.testnet.mirrornode.hedera.com:5600"],
    PREVIEWNET: ["hcs.previewnet.mirrornode.hedera.com:5600"],
};

/**
 * @augments {Client<NodeChannel, NodeMirrorChannel>}
 */
export default class NodeClient extends Client {
    /**
     * @param {ClientConfiguration} [props]
     */
    constructor(props) {
        super(props);

        if (props != null) {
            if (typeof props.network === "string") {
                switch (props.network) {
                    case "mainnet":
                        this.setNetwork(Network.MAINNET);
                        this.setMirrorNetwork(MirrorNetwork.MAINNET);
                        this.setLedgerId(LedgerId.MAINNET);
                        break;

                    case "testnet":
                        this.setNetwork(Network.TESTNET);
                        this.setMirrorNetwork(MirrorNetwork.TESTNET);
                        this.setLedgerId(LedgerId.TESTNET);
                        break;

                    case "previewnet":
                        this.setNetwork(Network.PREVIEWNET);
                        this.setMirrorNetwork(MirrorNetwork.PREVIEWNET);
                        this.setLedgerId(LedgerId.PREVIEWNET);
                        break;

                    default:
                        throw new Error(
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            `unknown network: ${props.network}`
                        );
                }
            } else if (props.network != null) {
                this.setNetwork(props.network);
            }

            if (typeof props.mirrorNetwork === "string") {
                switch (props.mirrorNetwork) {
                    case "mainnet":
                        this.setMirrorNetwork(MirrorNetwork.MAINNET);
                        break;

                    case "testnet":
                        this.setMirrorNetwork(MirrorNetwork.TESTNET);
                        break;

                    case "previewnet":
                        this.setMirrorNetwork(MirrorNetwork.PREVIEWNET);
                        break;

                    default:
                        this.setMirrorNetwork([props.mirrorNetwork]);
                        break;
                }
            } else if (props.mirrorNetwork != null) {
                this.setMirrorNetwork(props.mirrorNetwork);
            }
        }
    }

    /**
     * @param {string | ClientConfiguration} data
     * @returns {NodeClient}
     */
    static fromConfig(data) {
        return new NodeClient(
            typeof data === "string"
                ? /** @type {ClientConfiguration | undefined} */ (
                      JSON.parse(data)
                  )
                : data
        );
    }

    /**
     * @param {string} filename
     * @returns {Promise<NodeClient>}
     */
    static async fromConfigFile(filename) {
        return NodeClient.fromConfig(await readFileAsync(filename, "utf8"));
    }

    /**
     * Construct a client for a specific network.
     *
     * It is the responsibility of the caller to ensure that all nodes in the map are part of the
     * same Hedera network. Failure to do so will result in undefined behavior.
     *
     * The client will load balance all requests to Hedera using a simple round-robin scheme to
     * chose nodes to send transactions to. For one transaction, at most 1/3 of the nodes will be
     * tried.
     *
     * @param {{[key: string]: (string | AccountId)}} network
     * @returns {NodeClient}
     */
    static forNetwork(network) {
        return new NodeClient({ network });
    }

    /**
     * @param {string} network
     * @returns {NodeClient}
     */
    static forName(network) {
        return new NodeClient({ network });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access.
     *
     * @returns {NodeClient}
     */
    static forMainnet() {
        return new NodeClient({ network: "mainnet" });
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access.
     *
     * @returns {NodeClient}
     */
    static forTestnet() {
        return new NodeClient({ network: "testnet" });
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access.
     *
     * @returns {NodeClient}
     */
    static forPreviewnet() {
        return new NodeClient({ network: "previewnet" });
    }

    /**
     * @param {{[key: string]: (string | AccountId)} | string} network
     * @returns {void}
     */
    setNetwork(network) {
        if (typeof network === "string") {
            switch (network) {
                case "previewnet":
                    this._network.setNetwork(Network.PREVIEWNET);
                    this._network._ledgerId = LedgerId.PREVIEWNET;
                    break;
                case "testnet":
                    this._network.setNetwork(Network.TESTNET);
                    this._network._ledgerId = LedgerId.TESTNET;
                    break;
                case "mainnet":
                    this._network.setNetwork(Network.MAINNET);
                    this._network._ledgerId = LedgerId.MAINNET;
            }
        } else {
            this._network.setNetwork(network);
        }
    }

    /**
     * @param {string[] | string} mirrorNetwork
     * @returns {this}
     */
    setMirrorNetwork(mirrorNetwork) {
        if (typeof mirrorNetwork === "string") {
            switch (mirrorNetwork) {
                case "previewnet":
                    this._mirrorNetwork.setNetwork(MirrorNetwork.PREVIEWNET);
                    break;
                case "testnet":
                    this._mirrorNetwork.setNetwork(MirrorNetwork.TESTNET);
                    break;
                case "mainnet":
                    this._mirrorNetwork.setNetwork(MirrorNetwork.MAINNET);
                    break;
                default:
                    this._mirrorNetwork.setNetwork([mirrorNetwork]);
            }
        } else {
            this._mirrorNetwork.setNetwork(mirrorNetwork);
        }

        return this;
    }

    /**
     * @override
     * @returns {(address: string, cert?: string) => NodeChannel}
     */
    _createNetworkChannel() {
        return (address, cert) => new NodeChannel(address, cert);
    }

    /**
     * @override
     * @returns {(address: string) => NodeMirrorChannel}
     */
    _createMirrorNetworkChannel() {
        return (address) => new NodeMirrorChannel(address);
    }
}
