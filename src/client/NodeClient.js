// SPDX-License-Identifier: Apache-2.0

import fs from "fs";
import util from "util";
import Client from "./Client.js";
import NodeChannel from "../channel/NodeChannel.js";
import NodeMirrorChannel from "../channel/NodeMirrorChannel.js";
import LedgerId from "../LedgerId.js";
import AccountId from "../account/AccountId.js";
import NodeAddressBook from "../address_book/NodeAddressBook.js";
import * as mainnet from "./addressbooks/mainnet.js";
import * as testnet from "./addressbooks/testnet.js";
import * as previewnet from "./addressbooks/previewnet.js";
import * as hex from "../encoding/hex.js";

const readFileAsync = util.promisify(fs.readFile);

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
 */

export const Network = {
    LOCAL_NODE: {
        "127.0.0.1:50211": new AccountId(3),
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

/**
 * @augments {Client<NodeChannel, NodeMirrorChannel>}
 * Client for interacting with the Hedera network using Node.js.
 * Extends the base Client class with Node.js specific implementations.
 */
export default class NodeClient extends Client {
    /**
     * @param {ClientConfiguration} [props]
     */
    constructor(props) {
        super(props);

        /** @private */
        this._maxExecutionTime = 10000;

        if (props != null) {
            if (typeof props.network === "string") {
                this._setNetworkFromName(props.network);
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
                : data,
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
     * @param {Omit<ClientConfiguration, 'network'>} [props]
     * @returns {NodeClient}
     */
    static forNetwork(network, props) {
        return new NodeClient({ network, ...props });
    }

    /**
     * @param {string} network
     * @param {Omit<ClientConfiguration, 'network'>} [props]
     * @returns {NodeClient}
     */
    static forName(network, props = {}) {
        return new NodeClient({ network, ...props });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access.
     *
     * @param {Omit<ClientConfiguration, 'network'>} [props]
     * @returns {NodeClient}
     */
    static forMainnet(props = {}) {
        return new NodeClient({ network: "mainnet", ...props });
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access.
     *
     * @param {Omit<ClientConfiguration, 'network'>} [props]
     * @returns {NodeClient}
     */
    static forTestnet(props = {}) {
        return new NodeClient({ network: "testnet", ...props });
    }

    /**
     * Creates a NodeClient instance configured for a mirror network.     *
     * @overload
     * @param {string[] | string} mirrorNetwork - The mirror network address or addresses.
     * @param {ClientConfiguration} props - Configuration properties for the client.
     * @returns {Promise<NodeClient>} A configured NodeClient instance.
     */

    /**
     * @deprecated
     * @overload
     * @param {string[] | string} mirrorNetwork - The mirror network address or addresses.
     * @param {number} realm - The realm number for the address book query.
     * @param {number} shard - The shard number for the address book query.
     * @returns {Promise<NodeClient>} A configured NodeClient instance.
     */

    /**
     * @param {string[] | string} mirrorNetwork - The mirror network address or addresses.
     * @param {number | ClientConfiguration} realmOrProps - The realm number for the address book query.
     * @param {number} shard - The shard number for the address book query.
     * @returns {Promise<NodeClient>} A configured NodeClient instance.
     */
    static async forMirrorNetwork(mirrorNetwork, realmOrProps, shard = 0) {
        /**@type {NodeClient} */
        let client;

        if (typeof realmOrProps === "object" && realmOrProps !== null) {
            const props = /** @type {ClientConfiguration} */ (realmOrProps);
            client = new NodeClient({
                mirrorNetwork,
                ...props,
            });
        } else {
            client = new NodeClient({
                mirrorNetwork,
                realm: realmOrProps,
                shard,
            });
        }

        await client.updateNetwork();

        return client;
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access.
     *
     * @param {Omit<ClientConfiguration, 'network'>} [props]
     * @returns {NodeClient}
     */
    static forPreviewnet(props = {}) {
        return new NodeClient({ network: "previewnet", ...props });
    }

    /**
     * Construct a Hedera client pre-configured for local-node access.
     *
     * @param {Omit<ClientConfiguration, 'network'>} [props]
     * @returns {NodeClient}
     */
    static forLocalNode(props = { scheduleNetworkUpdate: false }) {
        return new NodeClient({
            network: "local-node",
            scheduleNetworkUpdate: false,
            ...props,
        });
    }

    /**
     * @param {{[key: string]: (string | AccountId)} | string} network
     * @returns {void}
     */
    setNetwork(network) {
        if (typeof network === "string") {
            this._setNetworkFromName(network);
        } else {
            this._network.setNetwork(network);
        }
    }

    /**
     * Available only for NodeClient
     *
     * @param {number} maxExecutionTime
     * @returns {this}
     */
    setMaxExecutionTime(maxExecutionTime) {
        this._maxExecutionTime = maxExecutionTime;
        return this;
    }

    /**
     * @private
     * @param {string} name
     * @returns {this}
     */
    _setNetworkFromName(name) {
        switch (name) {
            case "mainnet":
                this.setNetworkFromAddressBook(
                    NodeAddressBook.fromBytes(hex.decode(mainnet.addressBook)),
                );
                this.setMirrorNetwork(MirrorNetwork.MAINNET);
                this.setLedgerId(LedgerId.MAINNET);
                break;

            case "testnet":
                this.setNetworkFromAddressBook(
                    NodeAddressBook.fromBytes(hex.decode(testnet.addressBook)),
                );
                this.setMirrorNetwork(MirrorNetwork.TESTNET);
                this.setLedgerId(LedgerId.TESTNET);
                break;

            case "previewnet":
                this.setNetworkFromAddressBook(
                    NodeAddressBook.fromBytes(
                        hex.decode(previewnet.addressBook),
                    ),
                );
                this.setMirrorNetwork(MirrorNetwork.PREVIEWNET);
                this.setLedgerId(LedgerId.PREVIEWNET);
                break;

            case "local-node":
                this.setNetwork(Network.LOCAL_NODE);
                this.setMirrorNetwork(MirrorNetwork.LOCAL_NODE);
                this.setLedgerId(LedgerId.LOCAL_NODE);
                break;

            default:
                throw new Error(
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `unknown network: ${name}`,
                );
        }
        return this;
    }

    /**
     * @param {string[] | string} mirrorNetwork
     * @returns {this}
     */
    setMirrorNetwork(mirrorNetwork) {
        if (typeof mirrorNetwork === "string") {
            switch (mirrorNetwork) {
                case "local-node":
                    this._mirrorNetwork.setNetwork(MirrorNetwork.LOCAL_NODE);
                    break;
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
        return (address) => new NodeChannel(address, this._maxExecutionTime);
    }

    /**
     * @override
     * @returns {(address: string) => NodeMirrorChannel}
     */
    _createMirrorNetworkChannel() {
        return (address) => new NodeMirrorChannel(address);
    }
}
