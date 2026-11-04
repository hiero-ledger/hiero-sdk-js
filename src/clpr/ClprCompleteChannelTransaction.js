// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import ContractId from "../contract/ContractId.js";
import { copyBytes32 } from "../util.js";
import OwnershipProofState from "./OwnershipProofState.js";

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
 * during setOwnershipProof() and is never retained. Changing channelId clears
 * the proof; setting the same bytes keeps it.
 *
 * The verifier contract and its configuration and endpoint manifest proofs are
 * opaque to the SDK. They are optional locally because verifier families differ.
 * Only channelId and a complete ownership proof are required at freeze.
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
         * @type {Uint8Array}
         */
        this._configProofBytes = new Uint8Array();

        /**
         * @private
         * @type {Uint8Array}
         */
        this._endpointManifestProofBytes = new Uint8Array();

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
     * Signs the Channel ID using the shared ownership signer. The private key
     * is never stored. Set channelId before calling this method.
     *
     * @param {PrivateKey} privateKey
     * @returns {this}
     */
    setOwnershipProof(privateKey) {
        this._requireNotFrozen();
        this._requireFields(
            { channelId: this._channelId },
            "calling setOwnershipProof()",
        );
        this._ownershipProof.sign(
            privateKey,
            /** @type {Uint8Array} */ (this._channelId),
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
        this._verifierContract =
            typeof verifierContract === "string"
                ? ContractId.fromString(verifierContract)
                : verifierContract.clone();
        return this;
    }

    /**
     * @returns {?ContractId}
     */
    get verifierContract() {
        return this._verifierContract?.clone() ?? null;
    }

    /**
     * Sets and copies the opaque configuration proof bytes.
     * @param {Uint8Array} configProofBytes
     * @returns {this}
     */
    setConfigProofBytes(configProofBytes) {
        this._requireNotFrozen();
        this._configProofBytes = new Uint8Array(configProofBytes);
        return this;
    }

    /**
     * @returns {Uint8Array}
     */
    get configProofBytes() {
        return new Uint8Array(this._configProofBytes);
    }

    /**
     * Sets and copies the opaque endpoint manifest proof bytes.
     * @param {Uint8Array} endpointManifestProofBytes
     * @returns {this}
     */
    setEndpointManifestProofBytes(endpointManifestProofBytes) {
        this._requireNotFrozen();
        this._endpointManifestProofBytes = new Uint8Array(
            endpointManifestProofBytes,
        );
        return this;
    }

    /**
     * @returns {Uint8Array}
     */
    get endpointManifestProofBytes() {
        return new Uint8Array(this._endpointManifestProofBytes);
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

TRANSACTION_REGISTRY.set(
    "clprCompleteChannel",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprCompleteChannelTransaction._fromProtobuf,
);
