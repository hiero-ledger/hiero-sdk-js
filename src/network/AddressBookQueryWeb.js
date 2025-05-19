// SPDX-License-Identifier: Apache-2.0
// @ts-nocheck

import Query from "../query/Query.js";
import NodeAddressBook from "../address_book/NodeAddressBook.js";
import FileId from "../file/FileId.js";
import { RST_STREAM } from "../Executable.js";
import AccountId from "../account/AccountId.js";
import NodeAddress from "../address_book/NodeAddress.js";
import Long from "long";
import EndPoint from "../address_book/Endpoint.js";
import * as hex from "../encoding/hex.js";
import IPv4Address from "../address_book/IPv4Address.js";
/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../channel/MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * @template {Channel} ChannelT
 * @typedef {import("../client/Client.js").default<ChannelT, MirrorChannel>} Client<ChannelT, MirrorChannel>
 */

/**
 * @typedef {object} MirrorNodeResponse
 * @property {Array<{
 *   admin_key: {
 *     key: string,
 *     _type: string,
 *   },
 *   decline_reward: boolean,
 *   file_id: string,
 *   memo: string,
 *   public_key: string,
 *   node_id: number,
 *   node_account_id: string,
 *   node_cert_hash: string,
 *   address: string,
 *   service_endpoints: {
 *     domain_name: string,
 *     ip_address_v4: string,
 *     port: number
 *   }[],
 *   description: string,
 *   stake: number
 * }>} nodes
 */

/**
 * Web-compatible query to get a list of Hedera network node addresses from a mirror node.
 * Uses fetch API instead of gRPC for web environments.
 *
 * This query can be used to retrieve node addresses either from a specific file ID
 * or from the most recent address book if no file ID is specified. The response
 * contains node metadata including IP addresses and ports for both node and mirror
 * node services.
 * @augments {Query<NodeAddressBook>}
 */
export default class AddressBookQueryWeb extends Query {
    /**
     * @param {object} props
     * @param {FileId | string} [props.fileId]
     * @param {number} [props.limit]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?FileId}
         */
        this._fileId = null;
        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }

        /**
         * @private
         * @type {?number}
         */
        this._limit = null;
        if (props.limit != null) {
            this.setLimit(props.limit);
        }

        /**
         * @private
         * @type {(error: MirrorError | Error | null) => boolean}
         */
        this._retryHandler = (error) => {
            if (error != null) {
                if (error instanceof Error) {
                    // Retry on all errors which are not `MirrorError` because they're
                    // likely lower level HTTP errors
                    return true;
                } else {
                    // Retry on `NOT_FOUND`, `RESOURCE_EXHAUSTED`, `UNAVAILABLE`, and conditionally on `INTERNAL`
                    // if the message matches the right regex.
                    switch (error.code) {
                        // INTERNAL
                        // eslint-disable-next-line no-fallthrough
                        case 13:
                            return RST_STREAM.test(error.details.toString());
                        // NOT_FOUND
                        // eslint-disable-next-line no-fallthrough
                        case 5:
                        // RESOURCE_EXHAUSTED
                        // eslint-disable-next-line no-fallthrough
                        case 8:
                        // UNAVAILABLE
                        // eslint-disable-next-line no-fallthrough
                        case 14:
                        case 17:
                            return true;
                        default:
                            return false;
                    }
                }
            }

            return false;
        };

        /** @type {NodeAddress[]} */
        this._addresses = [];

        /**
         * @private
         * @type {number}
         */
        this._attempt = 0;
    }

    /**
     * @returns {?FileId}
     */
    get fileId() {
        return this._fileId;
    }

    /**
     * @param {FileId | string} fileId
     * @returns {AddressBookQueryWeb}
     */
    setFileId(fileId) {
        this._fileId =
            typeof fileId === "string"
                ? FileId.fromString(fileId)
                : fileId.clone();

        return this;
    }

    /**
     * @returns {?number}
     */
    get limit() {
        return this._limit;
    }

    /**
     * @param {number} limit
     * @returns {AddressBookQueryWeb}
     */
    setLimit(limit) {
        this._limit = limit;

        return this;
    }

    /**
     * @param {number} attempts
     * @returns {this}
     */
    setMaxAttempts(attempts) {
        this._maxAttempts = attempts;
        return this;
    }

    /**
     * @param {number} backoff
     * @returns {this}
     */
    setMaxBackoff(backoff) {
        this._maxBackoff = backoff;
        return this;
    }

    /**
     * @param {Client<Channel>} client
     * @param {number=} requestTimeout
     * @returns {Promise<NodeAddressBook>}
     */
    execute(client, requestTimeout) {
        // Extra validation when initializing the client with only a mirror network
        if (client._network._network.size === 0 && !client._timer) {
            throw new Error(
                "The client's network update period is required. Please set it using the setNetworkUpdatePeriod method.",
            );
        }

        return new Promise((resolve, reject) => {
            void this._makeFetchRequest(
                client,
                resolve,
                reject,
                requestTimeout,
            );
        });
    }

    /**
     * @private
     * @param {Client<Channel>} client
     * @param {(value: NodeAddressBook) => void} resolve
     * @param {(error: Error) => void} reject
     * @param {number=} requestTimeout
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    async _makeFetchRequest(client, resolve, reject, requestTimeout) {
        const baseUrl = `https://${client._mirrorNetwork.getNextMirrorNode()._address._address}`;

        console.log("baseUrl");
        console.log(baseUrl);

        const url = new URL(`${baseUrl}/api/v1/network/nodes`);
        if (this._fileId != null) {
            url.searchParams.append("file.id", this._fileId.toString());
        }
        if (this._limit != null) {
            url.searchParams.append("limit", this._limit.toString());
        }

        try {
            // eslint-disable-next-line n/no-unsupported-features/node-builtins
            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                signal: requestTimeout
                    ? AbortSignal.timeout(requestTimeout)
                    : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data = /** @type {MirrorNodeResponse} */ (
                await response.json()
            );

            const nodes = data.nodes || [];

            this._addresses = nodes.map((node) => {
                const accountId = AccountId.fromString(node.node_account_id);
                const certHash = hex.decode(node.node_cert_hash);
                return new NodeAddress({
                    nodeId: Long.fromNumber(node.node_id),
                    accountId,
                    addresses: node.service_endpoints.map(
                        (endpoint) =>
                            new EndPoint({
                                address: IPv4Address._fromString(
                                    endpoint.ip_address_v4,
                                ),
                                port: endpoint.port,
                            }),
                    ),
                    certHash,
                    address: node.address,
                    publicKey: node.public_key.startsWith("0x")
                        ? node.public_key.substring(2)
                        : node.public_key,
                    description: node.description,
                    stake: Long.fromNumber(node.stake),
                });
            });

            const addressBook = new NodeAddressBook({
                nodeAddresses: this._addresses,
            });
            resolve(addressBook);
        } catch (error) {
            console.error("Error in _makeFetchRequest:", error);
            const message =
                error instanceof Error ? error.message : String(error);
            if (
                this._attempt < this._maxAttempts &&
                !client.isClientShutDown &&
                this._retryHandler(
                    /** @type {MirrorError | Error | null} */ (error),
                )
            ) {
                const delay = Math.min(
                    250 * 2 ** this._attempt,
                    this._maxBackoff,
                );
                if (this._attempt >= this._maxAttempts) {
                    console.warn(
                        `Error getting nodes from mirror for file ${
                            this._fileId != null
                                ? this._fileId.toString()
                                : "UNKNOWN"
                        } during attempt ${
                            this._attempt
                        }. Waiting ${delay} ms before next attempt: ${message}`,
                    );
                }
                if (this._logger) {
                    this._logger.debug(
                        `Error getting nodes from mirror for file ${
                            this._fileId != null
                                ? this._fileId.toString()
                                : "UNKNOWN"
                        } during attempt ${
                            this._attempt
                        }. Waiting ${delay} ms before next attempt: ${message}`,
                    );
                }

                this._attempt += 1;

                setTimeout(() => {
                    void this._makeFetchRequest(
                        client,
                        resolve,
                        reject,
                        requestTimeout,
                    );
                }, delay);
            } else {
                reject(new Error("failed to query address book"));
            }
        }
    }
}
