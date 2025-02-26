// SPDX-License-Identifier: Apache-2.0

import Client from "./Client.js";
import NativeChannel from "../channel/NativeChannel.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AccountId from "../account/AccountId.js";
import LedgerId from "../LedgerId.js";
import {
    MAINNET,
    NATIVE_TESTNET,
    NATIVE_PREVIEWNET,
} from "../constants/ClientConstants.js";

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
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
    TESTNET: NATIVE_TESTNET,
    PREVIEWNET: NATIVE_PREVIEWNET,
};

/**
 * @augments {Client<NativeChannel, *>}
 */
export default class NativeClient extends Client {
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
     * @returns {NativeClient}
     */
    static fromConfig(data) {
        return new NativeClient(
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
     * @returns {NativeClient}
     */
    static forNetwork(network) {
        return new NativeClient({ network, scheduleNetworkUpdate: false });
    }

    /**
     * @param {string} network
     * @returns {NativeClient}
     */
    static forName(network) {
        return new NativeClient({ network, scheduleNetworkUpdate: false });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access.
     *
     * @returns {NativeClient}
     */
    static forMainnet() {
        return new NativeClient({
            network: "mainnet",
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access.
     *
     * @returns {NativeClient}
     */
    static forTestnet() {
        return new NativeClient({
            network: "testnet",
            scheduleNetworkUpdate: false,
        });
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access.
     *
     * @returns {NativeClient}
     */
    static forPreviewnet() {
        return new NativeClient({
            network: "previewnet",
            scheduleNetworkUpdate: false,
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
     * @returns {void}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setMirrorNetwork(mirrorNetwork) {
        // Do nothing as this is not currently supported
    }

    /**
     * @override
     * @returns {(address: string) => NativeChannel}
     */
    _createNetworkChannel() {
        return (address) => new NativeChannel(address);
    }

    /**
     * @abstract
     * @returns {(address: string) => *}
     */
    _createMirrorNetworkChannel() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (address) => null;
    }
}
