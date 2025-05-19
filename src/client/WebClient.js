// SPDX-License-Identifier: Apache-2.0

import Client from "./Client.js";
import WebChannel from "../channel/WebChannel.js";
import LedgerId from "../LedgerId.js";
import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
    MirrorNetwork,
} from "../constants/ClientConstants.js";

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

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

    MAINNET: MAINNET,
    TESTNET: WEB_TESTNET,
    PREVIEWNET: WEB_PREVIEWNET,
};

/**
 * Represents a client for interacting with the Hedera network over the web.
 * The `WebClient` class extends the base `Client` class and provides methods
 * for configuring and managing connections to the Hedera network, including
 * setting the network type (mainnet, testnet, previewnet) and handling
 * transactions and queries.
 * @augments {Client<WebChannel, *>}
 */
export default class WebClient extends Client {
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
                        this.setLedgerId(LedgerId.TESTNET);
                        this.setMirrorNetwork(MirrorNetwork.TESTNET);
                        break;

                    case "previewnet":
                        this.setNetwork(Network.PREVIEWNET);
                        this.setLedgerId(LedgerId.PREVIEWNET);
                        this.setMirrorNetwork(MirrorNetwork.PREVIEWNET);
                        break;

                    default:
                        throw new Error(
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            `unknown network: ${props.network}`,
                        );
                }
            } else if (props.network != null) {
                Client._validateNetworkConsistency(props.network);

                const { shard, realm } = Client._extractShardRealm(
                    props.network,
                );

                // Shard and realm are inferred from the network, so we need to set them here
                // to ensure that the client is properly configured.
                this._shard = shard;
                this._realm = realm;

                this.setNetwork(props.network);
            }
        }
    }

    /**
     * @param {string | ClientConfiguration} data
     * @returns {WebClient}
     */
    static fromConfig(data) {
        return new WebClient(
            typeof data === "string"
                ? /** @type {ClientConfiguration | undefined} */ (
                      JSON.parse(data)
                  )
                : data,
        );
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
     * @param {{[key: string]: (string | AccountId)} | string} network
     * @returns {WebClient}
     */
    static forNetwork(network) {
        return new WebClient({ network });
    }

    /**
     * @param {string} network
     * @returns {WebClient}
     */
    static forName(network) {
        return new WebClient({ network });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access.
     *
     * @returns {WebClient}
     */
    static forMainnet() {
        return new WebClient({
            network: "mainnet",
        });
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access.
     *
     * @returns {WebClient}
     */
    static forTestnet() {
        return new WebClient({
            network: "testnet",
        });
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access.
     *
     * @returns {WebClient}
     */
    static forPreviewnet() {
        return new WebClient({
            network: "previewnet",
        });
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
                    break;
                case "testnet":
                    this._network.setNetwork(Network.TESTNET);
                    break;
                case "mainnet":
                    this._network.setNetwork(Network.MAINNET);
            }
        } else {
            this._network.setNetwork(network);
        }
    }

    /**
     * @param {string[] | string} mirrorNetwork
     * @returns {this}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setMirrorNetwork(mirrorNetwork) {
        if (typeof mirrorNetwork === "string") {
            this._mirrorNetwork.setNetwork([]);
        } else {
            this._mirrorNetwork.setNetwork(mirrorNetwork);
        }

        return this;
    }

    /**
     * @override
     * @returns {(address: string) => WebChannel}
     */
    _createNetworkChannel() {
        return (address) => new WebChannel(address);
    }

    /**
     * @override
     * @returns {(address: string) => *}
     */
    _createMirrorNetworkChannel() {
        return () => {
            throw new Error("mirror support is not supported in browsers");
        };
    }
}
