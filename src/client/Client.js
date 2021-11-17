import AccountId from "../account/AccountId.js";
import AccountBalanceQuery from "../account/AccountBalanceQuery.js";
import { PrivateKey, PublicKey } from "@exodus/hashgraph-cryptography";
import Hbar from "../Hbar.js";
import Network from "./Network.js";
import MirrorNetwork from "./MirrorNetwork.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 */

/**
 * @typedef {"mainnet" | "testnet" | "previewnet"} NetworkName
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
 * @property {{[key: string]: (string | AccountId)} | NetworkName} network
 * @property {string[] | NetworkName | string} [mirrorNetwork]
 * @property {Operator} [operator]
 */

/**
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
            this._createMirrorNetworkChannel()
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
         * @type {Hbar}
         */
        this._maxTransactionFee = new Hbar(2);

        /**
         * @private
         * @type {Hbar}
         */
        this._maxQueryPayment = new Hbar(1);

        if (props != null) {
            if (props.operator != null) {
                this.setOperator(
                    props.operator.accountId,
                    props.operator.privateKey
                );
            }
        }

        this._signOnDemand = false;

        this._autoValidateChecksums = false;

        /** @type {number | null} */
        this._maxAttempts = null;

        /** @type {number} */
        this._minBackoff = 250;

        /** @type {number} */
        this._maxBackoff = 8000;
    }

    /**
     * @param {NetworkName} networkName
     * @returns {this}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNetworkName(networkName) {
        this._network.setNetworkName(networkName);
        return this;
    }

    /**
     * @returns {string | null}
     */
    get networkName() {
        return this._network.networkName;
    }

    /**
     * @param {{[key: string]: (string | AccountId)} | NetworkName} network
     * @returns {void}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNetwork(network) {
        throw new Error("not implemented");
    }

    /**
     * @returns {{[key: string]: (string | AccountId)}}
     */
    get network() {
        return this._network.network;
    }

    /**
     * @param {string[] | string | NetworkName} mirrorNetwork
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
     *
     * @param {AccountId | string} accountId
     * @param {PrivateKey | string} privateKey
     * @returns {this}
     */
    setOperator(accountId, privateKey) {
        const key =
            typeof privateKey === "string"
                ? PrivateKey.fromString(privateKey)
                : privateKey;

        return this.setOperatorWith(accountId, key.publicKey, (message) =>
            Promise.resolve(key.sign(message))
        );
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
     * @returns {Hbar}
     */
    get maxTransactionFee() {
        return this._maxTransactionFee;
    }

    /**
     * Set the maximum fee to be paid for transactions
     * executed by this client.
     *
     * @param {Hbar} maxTransactionFee
     * @returns {this}
     */
    setMaxTransactionFee(maxTransactionFee) {
        this._maxTransactionFee = maxTransactionFee;
        return this;
    }

    /**
     * @returns {Hbar}
     */
    get maxQueryPayment() {
        return this._maxQueryPayment;
    }

    /**
     * Set the maximum payment allowable for queries.
     *
     * @param {Hbar} maxQueryPayment
     * @returns {Client<ChannelT, MirrorChannelT>}
     */
    setMaxQueryPayment(maxQueryPayment) {
        this._maxQueryPayment = maxQueryPayment;
        return this;
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

    // /**
    //  * @param {?number} minBackoff
    //  * @param {?number} maxBackoff
    //  * @returns {this}
    //  */
    // _setBackoff(minBackoff, maxBackoff) {
    //     if (minBackoff == null) {
    //         throw new Error("minBackoff cannot be null.");
    //     }
    //     if (maxBackoff == null) {
    //         throw new Error("maxBackoff cannot be null.");
    //     }
    //     if (minBackoff > maxBackoff) {
    //         throw new Error("minBackoff cannot be larger than maxBackoff.");
    //     }
    //     this._minBackoff = minBackoff;
    //     this._maxAttempts = maxBackoff;
    //     return this;
    // }

    // /**
    //  * @typedef {Object} Backoff
    //  * @property {number | null} minBackoff
    //  * @property {number | null} maxBackoff
    //  * @returns {Backoff}
    //  */
    // get _backoff() {
    //     return { minBackoff: this._minBackoff, maxBackoff: this._maxBackoff };
    // }

    /**
     * @param {AccountId | string} accountId
     */
    async ping(accountId) {
        try {
            await new AccountBalanceQuery({ accountId })
                .setNodeAccountIds([
                    accountId instanceof AccountId
                        ? accountId
                        : AccountId.fromString(accountId),
                ])
                .execute(this);
        } catch (_) {
            // Do nothing
        }
    }

    async pingAll() {
        for (const nodeAccountId of Object.values(this._network.network)) {
            await this.ping(nodeAccountId);
        }
    }

    /**
     * @returns {void}
     */
    close() {
        this._network.close();
        this._mirrorNetwork.close();
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
}
