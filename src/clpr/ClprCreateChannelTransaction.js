// SPDX-License-Identifier: Apache-2.0

import Transaction from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import ContractId from "../contract/ContractId.js";
import { copyBytes32, requireUint8Array } from "../util.js";
import { copyContractId } from "./copy.js";
import { computeChannelId } from "./ownership.js";

/**
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} ITransactionResponse
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprCreateChannelTransactionBody} IClprCreateChannelTransactionBody
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/** Opens a verifier-bound CLPR Channel in one transaction on RC3. */
export default class ClprCreateChannelTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId] Expected ID agreed by the two peers.
     * @param {Uint8Array} [props.salt]
     * @param {ContractId | string} [props.verifierContract]
     * @param {Uint8Array} [props.peerVerifier]
     * @param {Uint8Array} [props.configProofBytes]
     * @param {Uint8Array} [props.endpointManifestProofBytes]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._channelId = null;
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._salt = null;
        /**
         * @private
         * @type {?ContractId}
         */
        this._verifierContract = null;
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._peerVerifier = null;
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._configProofBytes = null;
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._endpointManifestProofBytes = null;

        if (props?.channelId != null) this.setChannelId(props.channelId);
        if (props?.salt != null) this.setSalt(props.salt);
        if (props?.verifierContract != null)
            this.setVerifierContract(props.verifierContract);
        if (props?.peerVerifier != null)
            this.setPeerVerifier(props.peerVerifier);
        if (props?.configProofBytes != null)
            this.setConfigProofBytes(props.configProofBytes);
        if (props?.endpointManifestProofBytes != null)
            this.setEndpointManifestProofBytes(
                props.endpointManifestProofBytes,
            );
    }

    /**
     * Derives the Channel ID the network checks on creation, so an agreed ID can
     * be confirmed before submitting. Hiero ledgers use the CLPR service address
     * 0x000000000000000000000000000000000000016e. A Hiero verifier is its
     * contract's EVM alias, or the long-zero address when it has none.
     * @param {object} params
     * @param {string} params.localChainId
     * @param {Uint8Array} params.localService
     * @param {Uint8Array} params.localVerifier
     * @param {string} params.peerChainId
     * @param {Uint8Array} params.peerService
     * @param {Uint8Array} params.peerVerifier
     * @param {Uint8Array} params.salt
     * @returns {Uint8Array}
     */
    static computeChannelId(params) {
        return computeChannelId(params);
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprCreateChannelTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const data = bodies[0].clprCreateChannel;
        const transaction = new ClprCreateChannelTransaction({
            channelId: data?.channelId?.length ? data.channelId : undefined,
            salt: data?.salt?.length ? data.salt : undefined,
            verifierContract:
                data?.verifierContract == null
                    ? undefined
                    : ContractId._fromProtobuf(data.verifierContract),
            peerVerifier: data?.peerVerifier ?? undefined,
            configProofBytes: data?.configProofBytes?.length
                ? data.configProofBytes
                : undefined,
            endpointManifestProofBytes:
                data?.endpointManifestProofBytes ?? undefined,
        });
        return Transaction._fromProtobufTransactions(
            transaction,
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @param {Uint8Array} channelId
     * @returns {this}
     */
    setChannelId(channelId) {
        this._requireNotFrozen();
        this._channelId = copyBytes32(channelId, "channelId");
        return this;
    }

    /** @returns {?Uint8Array} */
    get channelId() {
        return this._channelId == null ? null : new Uint8Array(this._channelId);
    }

    /**
     * @param {Uint8Array} salt
     * @returns {this}
     */
    setSalt(salt) {
        this._requireNotFrozen();
        this._salt = copyBytes32(salt, "salt");
        return this;
    }

    /** @returns {?Uint8Array} */
    get salt() {
        return this._salt == null ? null : new Uint8Array(this._salt);
    }

    /**
     * @param {ContractId | string} verifierContract
     * @returns {this}
     */
    setVerifierContract(verifierContract) {
        this._requireNotFrozen();
        this._verifierContract = copyContractId(
            typeof verifierContract === "string"
                ? ContractId.fromString(verifierContract)
                : verifierContract,
        );
        return this;
    }

    /** @returns {?ContractId} */
    get verifierContract() {
        return this._verifierContract == null
            ? null
            : copyContractId(this._verifierContract);
    }

    /**
     * @param {Uint8Array} peerVerifier
     * @returns {this}
     */
    setPeerVerifier(peerVerifier) {
        this._requireNotFrozen();
        this._peerVerifier = new Uint8Array(requireUint8Array(peerVerifier));
        return this;
    }

    /** @returns {?Uint8Array} */
    get peerVerifier() {
        return this._peerVerifier == null
            ? null
            : new Uint8Array(this._peerVerifier);
    }

    /**
     * @param {Uint8Array} configProofBytes
     * @returns {this}
     */
    setConfigProofBytes(configProofBytes) {
        this._requireNotFrozen();
        const proof = requireUint8Array(configProofBytes);
        if (proof.length === 0)
            throw new Error("configProofBytes must not be empty");
        this._configProofBytes = new Uint8Array(proof);
        return this;
    }

    /** @returns {?Uint8Array} */
    get configProofBytes() {
        return this._configProofBytes == null
            ? null
            : new Uint8Array(this._configProofBytes);
    }

    /**
     * @param {Uint8Array} endpointManifestProofBytes
     * @returns {this}
     */
    setEndpointManifestProofBytes(endpointManifestProofBytes) {
        this._requireNotFrozen();
        this._endpointManifestProofBytes = new Uint8Array(
            requireUint8Array(endpointManifestProofBytes),
        );
        return this;
    }

    /** @returns {?Uint8Array} */
    get endpointManifestProofBytes() {
        return this._endpointManifestProofBytes == null
            ? null
            : new Uint8Array(this._endpointManifestProofBytes);
    }

    /** @override */
    _getName() {
        return "ClprCreateChannelTransaction";
    }

    /** @override */
    _getRequiredFields() {
        return {
            channelId: this._channelId,
            salt: this._salt,
            verifierContract: this._verifierContract,
            configProofBytes: this._configProofBytes,
        };
    }

    /** @override */
    _isSchedulable() {
        return false;
    }

    /**
     * @override
     * @param {import("../channel/Channel.js").default} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.clpr.createChannel(request);
    }

    /**
     * @override
     * @returns {"clprCreateChannel"}
     */
    _getTransactionDataCase() {
        return "clprCreateChannel";
    }

    /**
     * @override
     * @returns {IClprCreateChannelTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this.channelId,
            salt: this.salt,
            verifierContract: this.verifierContract?._toProtobuf(),
            peerVerifier: this.peerVerifier,
            configProofBytes: this.configProofBytes,
            endpointManifestProofBytes: this.endpointManifestProofBytes,
        };
    }
}
