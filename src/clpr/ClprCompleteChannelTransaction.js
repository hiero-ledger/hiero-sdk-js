// SPDX-License-Identifier: Apache-2.0

import Transaction from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import ContractId from "../contract/ContractId.js";
import { copyBytes32, requireUint8Array } from "../util.js";
import OwnershipProofState from "./OwnershipProofState.js";
import { copyContractId } from "./copy.js";
import { channelSigningPreimage, contractBytes } from "./ownership.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.TransactionBody} TransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} ITransactionResponse
 */

/**
 * @namespace com.hedera.hapi.node.clpr
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprCompleteChannelTransactionBody} IClprCompleteChannelTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../PrivateKey.js").default} PrivateKey
 * @typedef {import("./ClprSignatureScheme.js").default} ClprSignatureScheme
 */

/**
 * Completes a CLPR Channel registration by revealing its ownership proof.
 *
 * Any payer can submit this reveal. The ownership private key is used only
 * during setOwnershipProof() and is never retained. Changing any signed field
 * clears the proof; setting the same bytes keeps it.
 *
 * The verifier contract and its configuration and endpoint manifest proofs are
 * opaque to the SDK. Set all four signed inputs before creating the proof,
 * including explicit empty proof bytes when the verifier permits them.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprCompleteChannelTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {ContractId | string} [props.verifierContract]
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
         * @type {?ContractId}
         */
        this._verifierContract = null;

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

        /**
         * @private
         * @type {OwnershipProofState}
         */
        this._ownershipProof = new OwnershipProofState();

        if (props?.channelId != null) {
            this.setChannelId(props.channelId);
        }
        if (props?.verifierContract != null) {
            this.setVerifierContract(props.verifierContract);
        }
        if (props?.configProofBytes != null) {
            this.setConfigProofBytes(props.configProofBytes);
        }
        if (props?.endpointManifestProofBytes != null) {
            this.setEndpointManifestProofBytes(
                props.endpointManifestProofBytes,
            );
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprCompleteChannelTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const completion = /** @type {IClprCompleteChannelTransactionBody} */ (
            bodies[0].clprCompleteChannel
        );
        const transaction = new ClprCompleteChannelTransaction({
            channelId: completion.channelId?.length
                ? completion.channelId
                : undefined,
            verifierContract:
                completion.verifierContract != null
                    ? ContractId._fromProtobuf(completion.verifierContract)
                    : undefined,
            configProofBytes: completion.configProofBytes ?? undefined,
            endpointManifestProofBytes:
                completion.endpointManifestProofBytes ?? undefined,
        });

        transaction._ownershipProof.restore(completion);

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
     * Sets and copies the 32-byte Channel ID. A different ID clears the bound
     * ownership proof. Setting identical bytes keeps the proof.
     *
     * @param {Uint8Array} channelId
     * @returns {this}
     */
    setChannelId(channelId) {
        this._requireNotFrozen();
        const bytes = copyBytes32(channelId, "channelId");
        this._ownershipProof.clearIfChanged(this._channelId, channelId);
        this._channelId = bytes;
        return this;
    }

    /**
     * Returns a copy of the Channel ID, or null when it has not been set.
     * @returns {?Uint8Array}
     */
    get channelId() {
        return this._channelId == null
            ? null
            : copyBytes32(this._channelId, "channelId");
    }

    /**
     * Signs all completion inputs using the shared ownership signer. The private
     * key is never stored. Set the ID, verifier and both proof fields first.
     *
     * @param {PrivateKey} privateKey
     * @returns {this}
     */
    setOwnershipProof(privateKey) {
        this._requireNotFrozen();
        this._requireFields(
            {
                channelId: this._channelId,
                verifierContract: this._verifierContract,
                configProofBytes: this._configProofBytes,
                endpointManifestProofBytes: this._endpointManifestProofBytes,
            },
            "calling setOwnershipProof()",
        );
        this._ownershipProof.sign(
            privateKey,
            channelSigningPreimage(
                /** @type {Uint8Array} */ (this._channelId),
                /** @type {ContractId} */ (this._verifierContract),
                /** @type {Uint8Array} */ (this._configProofBytes),
                /** @type {Uint8Array} */ (this._endpointManifestProofBytes),
            ),
        );
        return this;
    }

    /**
     * Returns a copy of the canonical ownership public key, or null without a proof.
     * @returns {?Uint8Array}
     */
    get publicKey() {
        return this._ownershipProof.publicKey;
    }

    /**
     * Returns a copy of the ownership signature, or null without a proof.
     * @returns {?Uint8Array}
     */
    get signature() {
        return this._ownershipProof.signature;
    }

    /**
     * Returns the proof's scheme, including ECDSA code zero, or null without a proof.
     * @returns {?ClprSignatureScheme}
     */
    get signatureScheme() {
        return this._ownershipProof.signatureScheme;
    }

    /**
     * Sets the verifier contract. The SDK does not interpret its proof format.
     * @param {ContractId | string} verifierContract
     * @returns {this}
     */
    setVerifierContract(verifierContract) {
        this._requireNotFrozen();
        const contract = copyContractId(
            typeof verifierContract === "string"
                ? ContractId.fromString(verifierContract)
                : verifierContract,
        );
        this._ownershipProof.clearIfChanged(
            this._verifierContract == null
                ? null
                : contractBytes(this._verifierContract),
            contractBytes(contract),
        );
        this._verifierContract = contract;
        return this;
    }

    /**
     * @returns {?ContractId}
     */
    get verifierContract() {
        return this._verifierContract == null
            ? null
            : copyContractId(this._verifierContract);
    }

    /**
     * Sets and copies the opaque configuration proof bytes.
     * @param {Uint8Array} configProofBytes
     * @returns {this}
     */
    setConfigProofBytes(configProofBytes) {
        this._requireNotFrozen();
        const bytes = new Uint8Array(requireUint8Array(configProofBytes));
        this._ownershipProof.clearIfChanged(this._configProofBytes, bytes);
        this._configProofBytes = bytes;
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get configProofBytes() {
        return this._configProofBytes == null
            ? null
            : new Uint8Array(this._configProofBytes);
    }

    /**
     * Sets and copies the opaque endpoint manifest proof bytes.
     * @param {Uint8Array} endpointManifestProofBytes
     * @returns {this}
     */
    setEndpointManifestProofBytes(endpointManifestProofBytes) {
        this._requireNotFrozen();
        const bytes = new Uint8Array(
            requireUint8Array(endpointManifestProofBytes),
        );
        this._ownershipProof.clearIfChanged(
            this._endpointManifestProofBytes,
            bytes,
        );
        this._endpointManifestProofBytes = bytes;
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get endpointManifestProofBytes() {
        return this._endpointManifestProofBytes == null
            ? null
            : new Uint8Array(this._endpointManifestProofBytes);
    }

    /**
     * @override
     * @protected
     * @returns {string}
     */
    _getName() {
        return "ClprCompleteChannelTransaction";
    }

    /**
     * @override
     * @protected
     * @returns {Record<string, unknown>}
     */
    _getRequiredFields() {
        return {
            channelId: this._channelId,
            ownershipProof: this._ownershipProof,
            verifierContract: this._verifierContract,
            configProofBytes: this._configProofBytes,
            endpointManifestProofBytes: this._endpointManifestProofBytes,
        };
    }
    /**
     * @override
     * @protected
     * @returns {boolean}
     */
    _isSchedulable() {
        return false;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.clpr.completeChannel(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprCompleteChannel";
    }

    /**
     * @override
     * @protected
     * @returns {IClprCompleteChannelTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this.channelId,
            verifierContract: this._verifierContract?._toProtobuf(),
            configProofBytes: this.configProofBytes,
            endpointManifestProofBytes: this.endpointManifestProofBytes,
            ...this._ownershipProof._toProtobuf(),
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprCompleteChannelTransaction:${timestamp.toString()}`;
    }
}
