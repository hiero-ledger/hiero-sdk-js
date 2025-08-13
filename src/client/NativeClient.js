// SPDX-License-Identifier: Apache-2.0

import Client from "./Client.js";
import NativeChannel from "../channel/NativeChannel.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AccountId from "../account/AccountId.js";
import LedgerId from "../LedgerId.js";
import { MirrorNetwork, WebNetwork } from "../constants/ClientConstants.js";
import AddressBookQuery from "../network/AddressBookQueryWeb.js";
import FileId from "../file/FileId.js";

/**
 * @typedef {import("./Client.js").ClientConfiguration} ClientConfiguration
 */

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
                        this.setNetwork(WebNetwork.MAINNET);
                        this.setLedgerId(LedgerId.MAINNET);
                        this.setMirrorNetwork(MirrorNetwork.MAINNET);
                        break;

                    case "testnet":
                        this.setNetwork(WebNetwork.TESTNET);
                        this.setLedgerId(LedgerId.TESTNET);
                        this.setMirrorNetwork(MirrorNetwork.TESTNET);
                        break;

                    case "previewnet":
                        this.setNetwork(WebNetwork.PREVIEWNET);
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
        return new NativeClient({
            network,
        });
    }

    /**
     * @param {string} network
     * @returns {NativeClient}
     */
    static forName(network) {
        return new NativeClient({ network });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access.
     *
     * @returns {NativeClient}
     */
    static forMainnet() {
        return new NativeClient({
            network: "mainnet",
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
        });
    }

    /**
     * Construct a Hedera client pre-configured for Mainnet access with network update.
     *
     * @returns {Promise<NativeClient>}
     */
    static async forMainnetAsync() {
        return new NativeClient({
            network: "mainnet",
        }).updateNetwork();
    }

    /**
     * Construct a Hedera client pre-configured for Testnet access with network update.
     *
     * @returns {Promise<NativeClient>}
     */
    static async forTestnetAsync() {
        return new NativeClient({
            network: "testnet",
        }).updateNetwork();
    }

    /**
     * Construct a Hedera client pre-configured for Previewnet access with network update.
     *
     * @returns {Promise<NativeClient>}
     */
    static async forPreviewnetAsync() {
        return new NativeClient({
            network: "previewnet",
        }).updateNetwork();
    }

    /**
     * Construct a client for a specific network with optional network update.
     * Updates network only if the network is not "local-node".
     *
     * @param {string} network
     * @returns {Promise<NativeClient>}
     */
    static async forNameAsync(network) {
        const client = new NativeClient({ network });

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
     * @returns {Promise<NativeClient>}
     */
    static async forMirrorNetwork(mirrorNetwork) {
        const client = new NativeClient({
            mirrorNetwork,
        });

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
     * @returns {(address: string) => NativeChannel}
     */
    _createNetworkChannel() {
        return (address) => new NativeChannel(address);
    }

    /**
     * @override
     * @returns {(address: string) => *}
     */
    _createMirrorNetworkChannel() {
        return () => {
            throw new Error("mirror support is not supported in native");
        };
    }
}
