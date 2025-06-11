// SPDX-License-Identifier: Apache-2.0

import Client from "./Client.js";
import WebChannel from "../channel/WebChannel.js";
import LedgerId from "../LedgerId.js";
import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
} from "../constants/ClientConstants.js";

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
 * @typedef {import("./Client.js").BaseClientConfiguration} BaseClientConfiguration
 * @typedef {import("./Client.js").MirrorNetworkConfiguration} MirrorNetworkConfiguration
 * @typedef {import("./Client.js").NetworkConfiguration} NetworkConfiguration
 */

export const Network = {
    /**
     * @param {string} name
     * @returns {NetworkConfiguration}
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
                        this.setLedgerId(LedgerId.MAINNET);
                        break;

                    case "testnet":
                        this.setNetwork(Network.TESTNET);
                        this.setLedgerId(LedgerId.TESTNET);
                        break;

                    case "previewnet":
                        this.setNetwork(Network.PREVIEWNET);
                        this.setLedgerId(LedgerId.PREVIEWNET);
                        break;

                    default:
                        throw new Error(
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            `unknown network: ${props.network}`,
                        );
                }
            } else if (props.network != null) {
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
     * @param {NetworkConfiguration} network
     * @param {BaseClientConfiguration} [props]
     * @returns {WebClient}
     */
    static forNetwork(network, props) {
        return new WebClient({
            network,
            ...props,
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * @param {string} network
     * @param {BaseClientConfiguration} [props]
     * @returns {WebClient}
     */
    static forName(network, props) {
        return new WebClient({
            network,
            ...props,
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access.
     *
     * @param {BaseClientConfiguration} [props]
     * @returns {WebClient}
     */
    static forMainnet(props) {
        return new WebClient({
            network: "mainnet",
            ...props,
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access.
     *
     * @param {BaseClientConfiguration} [props]
     * @returns {WebClient}
     */
    static forTestnet(props) {
        return new WebClient({
            network: "testnet",
            ...props,
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access.
     *
     * @param {BaseClientConfiguration} [props]
     * @returns {WebClient}
     */
    static forPreviewnet(props) {
        return new WebClient({
            network: "previewnet",
            ...props,
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * @param {NetworkConfiguration} network
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

    /**
     * @override
     * @returns {Promise<void>}
     */
    updateNetwork() {
        return Promise.reject(
            new Error("Update network is not supported in browsers"),
        );
    }
}
