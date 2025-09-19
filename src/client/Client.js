// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import AccountBalanceQuery from "../account/AccountBalanceQuery.js";
import Hbar from "../Hbar.js";
import Network from "./Network.js";
import MirrorNetwork from "./MirrorNetwork.js";
import PublicKey from "../PublicKey.js";
import PrivateKey from "../PrivateKey.js";
import LedgerId from "../LedgerId.js";
import FileId from "../file/FileId.js";
import Logger from "../logger/Logger.js"; // eslint-disable-line
import { convertToNumber } from "../util.js";
import AddressBookQuery from "../network/AddressBookQuery.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../address_book/NodeAddressBook.js").default} NodeAddressBook
 */

/**
 * @typedef {object} Operator
 * @property {string | PrivateKey} privateKey
 * @property {string | AccountId} accountId
 */

/**
 * @typedef {object} ClientOperator
 * @property {PublicKey} publicKey
 * @property {AccountId} accountId
 * @property {(message: Uint8Array) => Promise<Uint8Array>} transactionSigner
 */

/**
 * @typedef {object} ClientConfiguration
 * @property {{[key: string]: (string | AccountId)} | string} [network]
 * @property {string[] | string} [mirrorNetwork]
 * @property {Operator} [operator]
 * @property {boolean} [scheduleNetworkUpdate]
 * @property {number} [shard]
 * @property {number} [realm]
 */

/**
 * @typedef {"mainnet" | "testnet" | "previewnet"} NetworkName
 */

/**
 * The `Client` class is the main entry point for interacting with the Hedera Hashgraph network.
 * It provides methods for managing network connections, setting operators, handling transactions
 * and queries, and configuring various client settings.
 *
 * @abstract
 * @template {Channel} ChannelT
 * @template {MirrorChannel} MirrorChannelT
 */
export default class Client {
    /**
     * @protected
     * @hideconstructor
     * @param {ClientConfiguration} [props]
     */
    constructor(props) {
        /**
         * List of mirror network URLs.
         *
         * @internal
         * @type {MirrorNetwork}
         */
        this._mirrorNetwork = new MirrorNetwork(
            this._createMirrorNetworkChannel(),
        );

        /**
         * Map of node account ID (as a string)
         * to the node URL.
         *
         * @internal
         * @type {Network}
         */
        this._network = new Network(this._createNetworkChannel());

        /**
         * @internal
         * @type {?ClientOperator}
         */
        this._operator = null;

        /**
         * @private
         * @type {?Hbar}
         */
        this._defaultMaxTransactionFee = null;

        /**
         * @private
         * @type {Hbar}
         */
        this._defaultMaxQueryPayment = new Hbar(1);

        if (props != null) {
            if (props.operator != null) {
                this.setOperator(
                    props.operator.accountId,
                    props.operator.privateKey,
                );
            }
        }

        /** @type {number | null} */
        this._maxAttempts = null;

        /** @private */
        this._signOnDemand = false;

        /** @private */
        this._autoValidateChecksums = false;

        /** @private */
        this._minBackoff = 250;

        /** @private */
        this._maxBackoff = 8000;

        /** @private */
        this._defaultRegenerateTransactionId = true;

        /** @private */
        this._requestTimeout = null;

        /**
         * @type {boolean}
         */
        this._isUpdatingNetwork = false;

        /** @private */
        this._networkUpdatePeriod = 24 * 60 * 60 * 1000;

        /** @private */
        this._isShutdown = false;

        this._shard = 0;

        this._realm = 0;

        if (props != null && props.scheduleNetworkUpdate !== false) {
            this._scheduleNetworkUpdate();
        }

        if (props != null && props.shard != null) {
            this._shard = props.shard;
        }

        if (props != null && props.realm != null) {
            this._realm = props.realm;
        }

        /** @internal */
        /** @type {NodeJS.Timeout} */
        this._timer;

        /**
         * Logger
         *
         * @external
         * @type {Logger | null}
         */
        this._logger = null;
    }

    /**
     * @deprecated
     * @param {NetworkName} networkName
     * @returns {this}
     */
    setNetworkName(networkName) {
        // uses custom NetworkName type
        // remove if phasing out set|get NetworkName
        console.warn("Deprecated: Use `setLedgerId` instead");
        return this.setLedgerId(networkName);
    }

    /**
     * @deprecated
     * @returns {string | null}
     */
    get networkName() {
        console.warn("Deprecated: Use `ledgerId` instead");
        return this.ledgerId != null ? this.ledgerId.toString() : null;
    }

    /**
     * @param {string|LedgerId} ledgerId
     * @returns {this}
     */
    setLedgerId(ledgerId) {
        this._network.setLedgerId(
            typeof ledgerId === "string"
                ? LedgerId.fromString(ledgerId)
                : ledgerId,
        );

        return this;
    }

    /**
     * @returns {LedgerId | null}
     */
    get ledgerId() {
        return this._network._ledgerId != null ? this._network.ledgerId : null;
    }

    /**
     * @param {{[key: string]: (string | AccountId)} | string} network
     * @returns {void}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNetwork(network) {
        // TODO: This logic _can_ be de-duplicated and likely should
        throw new Error("not implemented");
    }

    /**
     * @param {NodeAddressBook} addressBook
     * @returns {this}
     */
    setNetworkFromAddressBook(addressBook) {
        this._network.setNetworkFromAddressBook(addressBook);
        return this;
    }

    /**
     * @returns {{[key: string]: (string | AccountId)}}
     */
    get network() {
        return this._network.network;
    }

    /**
     * @returns {number}
     */
    get shard() {
        return this._shard;
    }

    /**
     * @returns {number}
     */
    get realm() {
        return this._realm;
    }

    /**
     * @param {string[] | string} mirrorNetwork
     * @returns {void}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setMirrorNetwork(mirrorNetwork) {
        throw new Error("not implemented");
    }

    /**
     * @returns {string[]}
     */
    get mirrorNetwork() {
        return this._mirrorNetwork.network;
    }

    /**
     * @returns {string}
     * @throws {Error} When no mirror network is configured or available
     */
    get mirrorRestApiBaseUrl() {
        try {
            const mirrorNode = this._mirrorNetwork.getNextMirrorNode();
            const host = mirrorNode.address.address;
            const port = mirrorNode.address.port;

            if (!host || !port) {
                throw new Error(
                    "Mirror node has invalid address configuration",
                );
            }

            const scheme = this._getSchemeFromHostAndPort(host, port);

            return `${scheme}://${host}:${port}/api/v1`;
        } catch (error) {
            // Re-throw with a more descriptive error message
            throw new Error(
                "Client has no mirror network configured or no healthy mirror nodes are available",
            );
        }
    }

    /**
     * @returns {boolean}
     */
    get signOnDemand() {
        return this._signOnDemand;
    }

    /**
     * @param {boolean} signOnDemand
     */
    setSignOnDemand(signOnDemand) {
        this._signOnDemand = signOnDemand;
    }

    /**
     * @returns {boolean}
     */
    isTransportSecurity() {
        return this._network.isTransportSecurity();
    }

    /**
     * @param {boolean} transportSecurity
     * @returns {this}
     */
    setTransportSecurity(transportSecurity) {
        this._network.setTransportSecurity(transportSecurity);
        return this;
    }

    /**
     * Set the account that will, by default, pay for transactions and queries built with this client.
     * NOTE: When using string for private key, the string needs to contain DER headers
     *
     * @param {AccountId | string} accountId
     * @param {PrivateKey | string} privateKey
     * @returns {this}
     */
    setOperator(accountId, privateKey) {
        const key =
            typeof privateKey === "string"
                ? PrivateKey.fromStringDer(privateKey)
                : privateKey;

        return this.setOperatorWith(accountId, key.publicKey, (message) =>
            Promise.resolve(key.sign(message)),
        );
    }

    /**
     * @returns {?ClientOperator}
     */
    getOperator() {
        return this._operator;
    }

    /**
     * Sets the account that will, by default, pay for transactions and queries built with
     * this client.
     *
     * @param {AccountId | string} accountId
     * @param {PublicKey | string} publicKey
     * @param {(message: Uint8Array) => Promise<Uint8Array>} transactionSigner
     * @returns {this}
     */
    setOperatorWith(accountId, publicKey, transactionSigner) {
        const accountId_ =
            accountId instanceof AccountId
                ? accountId
                : AccountId.fromString(accountId);

        if (this._network._ledgerId != null) {
            accountId_.validateChecksum(this);
        }

        this._operator = {
            transactionSigner,

            accountId: accountId_,

            publicKey:
                publicKey instanceof PublicKey
                    ? publicKey
                    : PublicKey.fromString(publicKey),
        };

        return this;
    }

    /**
     * @param {boolean} value
     * @returns {this}
     */
    setAutoValidateChecksums(value) {
        this._autoValidateChecksums = value;
        return this;
    }

    /**
     * @returns {boolean}
     */
    isAutoValidateChecksumsEnabled() {
        return this._autoValidateChecksums;
    }

    /**
     * @returns {?AccountId}
     */
    get operatorAccountId() {
        return this._operator != null ? this._operator.accountId : null;
    }

    /**
     * @returns {?PublicKey}
     */
    get operatorPublicKey() {
        return this._operator != null ? this._operator.publicKey : null;
    }

    /**
     * @returns {?Hbar}
     */
    get defaultMaxTransactionFee() {
        return this._defaultMaxTransactionFee;
    }

    /**
     * @deprecated - Use `defaultMaxTransactionFee` instead
     * @returns {?Hbar}
     */
    get maxTransactionFee() {
        return this.defaultMaxTransactionFee;
    }

    /**
     * Set the defaultimum fee to be paid for transactions
     * executed by this client.
     *
     * @param {Hbar} defaultMaxTransactionFee
     * @returns {this}
     */
    setDefaultMaxTransactionFee(defaultMaxTransactionFee) {
        if (defaultMaxTransactionFee.toTinybars().toInt() < 0) {
            throw new Error("defaultMaxTransactionFee must be non-negative");
        }
        this._defaultMaxTransactionFee = defaultMaxTransactionFee;
        return this;
    }

    /**
     * @deprecated - Use `setDefaultMaxTransactionFee()` instead
     * Set the maximum fee to be paid for transactions
     * executed by this client.
     * @param {Hbar} maxTransactionFee
     * @returns {this}
     */
    setMaxTransactionFee(maxTransactionFee) {
        return this.setDefaultMaxTransactionFee(maxTransactionFee);
    }

    /**
     * @returns {boolean}
     */
    get defaultRegenerateTransactionId() {
        return this._defaultRegenerateTransactionId;
    }

    /**
     * Set if a new transaction ID should be generated when a `TRANSACTION_EXPIRED` status
     * is returned.
     *
     * @param {boolean} defaultRegenerateTransactionId
     * @returns {this}
     */
    setDefaultRegenerateTransactionId(defaultRegenerateTransactionId) {
        this._defaultRegenerateTransactionId = defaultRegenerateTransactionId;
        return this;
    }

    /**
     * @returns {Hbar}
     */
    get defaultMaxQueryPayment() {
        return this._defaultMaxQueryPayment;
    }

    /**
     * @deprecated in a favor of defaultMaxQueryPayment
     * @returns {Hbar}
     */
    get maxQueryPayment() {
        return this.defaultMaxQueryPayment;
    }

    /**
     * Set the maximum payment allowable for queries.
     *
     * @param {Hbar} defaultMaxQueryPayment
     * @returns {Client<ChannelT, MirrorChannelT>}
     */
    setDefaultMaxQueryPayment(defaultMaxQueryPayment) {
        const isMaxQueryPaymentNegative =
            convertToNumber(defaultMaxQueryPayment.toTinybars()) < 0;
        if (isMaxQueryPaymentNegative) {
            throw new Error("defaultMaxQueryPayment must be non-negative");
        }
        this._defaultMaxQueryPayment = defaultMaxQueryPayment;
        return this;
    }
    /**
     * @deprecated in a favor of setDefaultMaxQueryPayment()
     * Set the maximum payment allowable for queries.
     * @param {Hbar} maxQueryPayment
     * @returns {Client<ChannelT, MirrorChannelT>}
     */
    setMaxQueryPayment(maxQueryPayment) {
        return this.setDefaultMaxQueryPayment(maxQueryPayment);
    }

    /**
     * @returns {number}
     */
    get maxAttempts() {
        return this._maxAttempts != null ? this._maxAttempts : 10;
    }

    /**
     * @param {number} maxAttempts
     * @returns {this}
     */
    setMaxAttempts(maxAttempts) {
        this._maxAttempts = maxAttempts;
        return this;
    }

    /**
     * @returns {number}
     */
    get maxNodeAttempts() {
        return this._network.maxNodeAttempts;
    }

    /**
     * @param {number} maxNodeAttempts
     * @returns {this}
     */
    setMaxNodeAttempts(maxNodeAttempts) {
        this._network.setMaxNodeAttempts(maxNodeAttempts);
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeWaitTime() {
        return this._network.minBackoff;
    }

    /**
     * @param {number} nodeWaitTime
     * @returns {this}
     */
    setNodeWaitTime(nodeWaitTime) {
        this._network.setMinBackoff(nodeWaitTime);
        return this;
    }

    /**
     * @returns {number}
     */
    get maxNodesPerTransaction() {
        return this._network.maxNodesPerTransaction;
    }

    /**
     * @param {number} maxNodesPerTransaction
     * @returns {this}
     */
    setMaxNodesPerTransaction(maxNodesPerTransaction) {
        this._network.setMaxNodesPerTransaction(maxNodesPerTransaction);
        return this;
    }

    /**
     * @param {?number} minBackoff
     * @returns {this}
     */
    setMinBackoff(minBackoff) {
        if (minBackoff == null) {
            throw new Error("minBackoff cannot be null.");
        }
        if (minBackoff > this._maxBackoff) {
            throw new Error("minBackoff cannot be larger than maxBackoff.");
        }
        this._minBackoff = minBackoff;
        return this;
    }

    /**
     * @returns {number}
     */
    get minBackoff() {
        return this._minBackoff;
    }

    /**
     * @param {?number} maxBackoff
     * @returns {this}
     */
    setMaxBackoff(maxBackoff) {
        if (maxBackoff == null) {
            throw new Error("maxBackoff cannot be null.");
        } else if (maxBackoff < this._minBackoff) {
            throw new Error("maxBackoff cannot be smaller than minBackoff.");
        }
        this._maxBackoff = maxBackoff;
        return this;
    }

    /**
     * @returns {number}
     */
    get maxBackoff() {
        return this._maxBackoff;
    }

    /**
     * @param {number} nodeMinBackoff
     * @returns {this}
     */
    setNodeMinBackoff(nodeMinBackoff) {
        this._network.setMinBackoff(nodeMinBackoff);
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeMinBackoff() {
        return this._network.minBackoff;
    }

    /**
     * @param {number} nodeMaxBackoff
     * @returns {this}
     */
    setNodeMaxBackoff(nodeMaxBackoff) {
        this._network.setMaxBackoff(nodeMaxBackoff);
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeMaxBackoff() {
        return this._network.maxBackoff;
    }

    /**
     * @param {number} nodeMinReadmitPeriod
     * @returns {this}
     */
    setNodeMinReadmitPeriod(nodeMinReadmitPeriod) {
        this._network.setNodeMinReadmitPeriod(nodeMinReadmitPeriod);
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeMinReadmitPeriod() {
        return this._network.nodeMinReadmitPeriod;
    }

    /**
     * @param {number} nodeMaxReadmitPeriod
     * @returns {this}
     */
    setNodeMaxReadmitPeriod(nodeMaxReadmitPeriod) {
        this._network.setNodeMaxReadmitPeriod(nodeMaxReadmitPeriod);
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeMaxReadmitPeriod() {
        return this._network.nodeMaxReadmitPeriod;
    }

    /**
     * @param {number} requestTimeout - Number of milliseconds
     * @returns {this}
     */
    setRequestTimeout(requestTimeout) {
        this._requestTimeout = requestTimeout;
        return this;
    }

    /**
     * @returns {?number}
     */
    get requestTimeout() {
        return this._requestTimeout;
    }

    /**
     * @returns {number}
     */
    get networkUpdatePeriod() {
        return this._networkUpdatePeriod;
    }

    /**
     * @param {number} networkUpdatePeriod
     * @returns {this}
     */
    setNetworkUpdatePeriod(networkUpdatePeriod) {
        clearTimeout(this._timer);
        this._networkUpdatePeriod = networkUpdatePeriod;
        this._scheduleNetworkUpdate();
        return this;
    }
    /**
     * Set logger
     *
     * @param {Logger} logger
     * @returns {this}
     */
    setLogger(logger) {
        this._logger = logger;
        return this;
    }

    /**
     * Get logger if set
     *
     * @returns {?Logger}
     */
    get logger() {
        return this._logger;
    }

    /**
     * @param {AccountId | string} accountId
     */
    async ping(accountId) {
        await new AccountBalanceQuery({ accountId })
            .setNodeAccountIds([
                accountId instanceof AccountId
                    ? accountId
                    : AccountId.fromString(accountId),
            ])
            .execute(this);
    }

    async pingAll() {
        for (const nodeAccountId of Object.values(this._network.network)) {
            await this.ping(nodeAccountId);
        }
    }

    /**
     * Update the network address book.
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
                    FileId.getAddressBookFileIdFor(this._shard, this._realm),
                )
                .execute(this);
            this.setNetworkFromAddressBook(addressBook);
        } catch (error) {
            if (this._logger) {
                this._logger.trace(
                    `failed to update client address book: ${
                        /** @type {Error} */ (error).toString()
                    }`,
                );
            }
        } finally {
            this._isUpdatingNetwork = false;
        }

        return this;
    }

    /**
     * @returns {void}
     */
    close() {
        this._network.close();
        this._mirrorNetwork.close();
        this._isShutdown = true;
        clearTimeout(this._timer);
    }

    /**
     * @abstract
     * @returns {(address: string) => ChannelT}
     */
    _createNetworkChannel() {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @returns {(address: string) => MirrorChannelT}
     */
    _createMirrorNetworkChannel() {
        throw new Error("not implemented");
    }

    /**
     * @private
     */
    _scheduleNetworkUpdate() {
        // This is the automatic network update promise that _eventually_ completes
        // eslint-disable-next-line @typescript-eslint/no-floating-promises,@typescript-eslint/no-misused-promises
        this._timer = setTimeout(async () => {
            await this.updateNetwork();

            if (!this._isShutdown) {
                // Recall this method to continuously update the network
                // every `networkUpdatePeriod` amount of itme
                this._scheduleNetworkUpdate();
            }
        }, this._networkUpdatePeriod);
    }

    /**
     * Determines the appropriate scheme (http/https) based on the host and port.
     *
     * @private
     * @param {string} host - The host address
     * @param {number} port - The port number
     * @returns {string} - The scheme ('http' or 'https')
     */
    _getSchemeFromHostAndPort(host, port) {
        // For localhost and 127.0.0.1, use HTTP scheme
        if (host === "localhost" || host === "127.0.0.1") {
            return "http";
        }

        // Standard HTTPS ports
        if (port === 443) {
            return "https";
        }

        // Standard HTTP ports
        if (port === 80) {
            return "http";
        }

        // For other ports, assume HTTPS for security
        return "https";
    }

    /**
     * @returns {boolean}
     */
    get isClientShutDown() {
        return this._isShutdown;
    }

    /**
     * Validates that all nodes in a network are in the same shard and realm.
     *
     * @param {{[key: string]: (string | AccountId)}} network
     */
    static _validateNetworkConsistency(network) {
        if (Object.keys(network).length === 0) {
            return;
        }

        const [, nodeAccountId] = Object.entries(network)[0];

        const accountIdStr = nodeAccountId.toString();

        const [firstNodeShard, firstNodeRealm] = accountIdStr
            .split(".")
            .map(Number);

        const isNetworkValid = Object.values(network).every((accountId) => {
            const accountIdStr = accountId.toString();

            const [currentShard, currentRealm] = accountIdStr
                .split(".")
                .map(Number);
            return (
                currentShard === firstNodeShard &&
                currentRealm === firstNodeRealm
            );
        });

        if (!isNetworkValid) {
            throw new Error(
                "Network is not valid, all nodes must be in the same shard and realm",
            );
        }
    }

    /**
     * Extracts shard and realm values from a network configuration.
     * Note: This method assumes the network is consistent (all nodes in same shard/realm).
     * Use validateNetworkConsistency() first to ensure this.
     *
     * @param {{[key: string]: (string | AccountId)}} network
     * @returns {{shard: number, realm: number}}
     */
    static _extractShardRealm(network) {
        const entries = Object.entries(network);
        if (entries.length === 0) {
            return { shard: 0, realm: 0 };
        }

        const [, firstNodeAccountId] = entries[0];

        const accountIdStr = firstNodeAccountId.toString();
        const [shard, realm] = accountIdStr.split(".").map(Number);

        return { shard, realm };
    }
}
