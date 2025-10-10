// SPDX-License-Identifier: Apache-2.0

import Client from "./Client.js";
import WebChannel from "../channel/WebChannel.js";
import LedgerId from "../LedgerId.js";
import { WebNetwork, WebMirrorNetwork } from "../constants/ClientConstants.js";

import AddressBookQuery from "../network/AddressBookQueryWeb.js";
import FileId from "../file/FileId.js";

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

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
                        this.setNetwork(WebNetwork.MAINNET);
                        this.setMirrorNetwork(WebMirrorNetwork.MAINNET);
                        this.setLedgerId(LedgerId.MAINNET);
                        break;

                    case "testnet":
                        this.setNetwork(WebNetwork.TESTNET);
                        this.setLedgerId(LedgerId.TESTNET);
                        this.setMirrorNetwork(WebMirrorNetwork.TESTNET);
                        break;

                    case "previewnet":
                        this.setNetwork(WebNetwork.PREVIEWNET);
                        this.setLedgerId(LedgerId.PREVIEWNET);
                        this.setMirrorNetwork(WebMirrorNetwork.PREVIEWNET);
                        break;

                    case "local-node":
                        this.setNetwork(WebNetwork.LOCAL_NODE);
                        this.setLedgerId(LedgerId.LOCAL_NODE);
                        this.setMirrorNetwork(WebMirrorNetwork.LOCAL_NODE);
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
     * Construct a Hedera client pre-configured for local-node access.
     *
     * @param {object} [props]
     * @param {boolean} [props.scheduleNetworkUpdate]
     * @returns {WebClient}
     */
    static forLocalNode(props = { scheduleNetworkUpdate: false }) {
        return new WebClient({
            network: "local-node",
            ...props,
        });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access with network update.
     *
     * @returns {Promise<WebClient>}
     */
    static async forMainnetAsync() {
        return new WebClient({
            network: "mainnet",
        }).updateNetwork();
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access with network update.
     *
     * @returns {Promise<WebClient>}
     */
    static async forTestnetAsync() {
        return new WebClient({
            network: "testnet",
        }).updateNetwork();
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access with network update.
     *
     * @returns {Promise<WebClient>}
     */
    static async forPreviewnetAsync() {
        return new WebClient({
            network: "previewnet",
        }).updateNetwork();
    }

    /**
     * Construct a client for a specific network with optional network update.
     * Updates network only if the network is not "local-node".
     *
     * @param {string} network
     * @returns {Promise<WebClient>}
     */
    static async forNameAsync(network) {
        const client = new WebClient({ network });

        if (network !== "local-node") {
            await client.updateNetwork();
        }

        return client;
    }

    /**
     * Construct a client configured to use mirror nodes.
     * This will query the address book to get the network nodes.
     *
     * @param {string[] | string} mirrorNetwork
     * @returns {Promise<WebClient>}
     */
    static async forMirrorNetwork(mirrorNetwork) {
        const client = new WebClient({ mirrorNetwork: mirrorNetwork });

        await client.updateNetwork();

        return client;
    }

    /**
     * @param {{[key: string]: (string | AccountId)} | string} network
     * @returns {void}
     */
    setNetwork(network) {
        if (typeof network === "string") {
            switch (network) {
                case "previewnet":
                    this._network.setNetwork(WebNetwork.PREVIEWNET);
                    break;
                case "testnet":
                    this._network.setNetwork(WebNetwork.TESTNET);
                    break;
                case "mainnet":
                    this._network.setNetwork(WebNetwork.MAINNET);
                    break;
                case "local-node":
                    this._network.setNetwork(WebNetwork.LOCAL_NODE);
                    break;
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
                case "local-node":
                    this._mirrorNetwork.setNetwork(WebMirrorNetwork.LOCAL_NODE);
                    break;
                case "previewnet":
                    this._mirrorNetwork.setNetwork(WebMirrorNetwork.PREVIEWNET);
                    break;
                case "testnet":
                    this._mirrorNetwork.setNetwork(WebMirrorNetwork.TESTNET);
                    break;
                case "mainnet":
                    this._mirrorNetwork.setNetwork(WebMirrorNetwork.MAINNET);
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
     * @returns {Promise<this>}
     */
    async updateNetwork() {
        if (this._isUpdatingNetwork) {
            return this;
        }

        this._isUpdatingNetwork = true;

        try {
            const addressBook = await new AddressBookQuery()
                .setFileId(
                    FileId.getAddressBookFileIdFor(this.shard, this.realm),
                )
                .execute(this);

            /** @type {Record<string, AccountId>} */
            const network = {};
            for (const nodeAddress of addressBook.nodeAddresses) {
                for (const endpoint of nodeAddress.addresses) {
                    if (nodeAddress.accountId != null) {
                        network[endpoint.toString()] = nodeAddress.accountId;
                    }
                }
            }

            this.setNetwork(network);
        } catch (/** @type {unknown} */ error) {
            if (this._logger) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                this._logger.trace(
                    `failed to update client address book: ${errorMessage}`,
                );
            }
        } finally {
            this._isUpdatingNetwork = false;
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
