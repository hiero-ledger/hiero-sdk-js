// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import { copyBytes32 } from "../util.js";
import { computeChannelCommitment } from "./ownership.js";

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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprRegisterChannelTransactionBody} IClprRegisterChannelTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../PublicKey.js").default} PublicKey
 */

/**
 * Reserves a CLPR Channel in the commit phase of HIP-1535 commit-reveal.
 *
 * Any payer can register a 32-byte ownership commitment, computed as
 * keccak256(channelId || canonical public key). The Channel ID and public key
 * are revealed during Channel completion to prevent front-running.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprRegisterChannelTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.ownershipCommitment]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._ownershipCommitment = null;

        if (props?.ownershipCommitment != null) {
            this.setOwnershipCommitment(props.ownershipCommitment);
        }
    }

    /**
     * Computes the 32-byte ownership commitment for a Channel registration.
     * Uses the canonical key encoding for ECDSA secp256k1 or Ed25519.
     *
     * @param {Uint8Array} channelId - The 32-byte Channel ID.
     * @param {PublicKey} publicKey - The ownership public key.
     * @returns {Uint8Array}
     */
    static computeOwnershipCommitment(channelId, publicKey) {
        return computeChannelCommitment(channelId, publicKey);
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprRegisterChannelTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const registerChannel =
            /** @type {IClprRegisterChannelTransactionBody} */ (
                bodies[0].clprRegisterChannel
            );

        return Transaction._fromProtobufTransactions(
            new ClprRegisterChannelTransaction({
                ownershipCommitment:
                    registerChannel.ownershipCommitment ?? undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * Sets the 32-byte ownership commitment and copies its bytes.
     *
     * @param {Uint8Array} ownershipCommitment
     * @returns {this}
     */
    setOwnershipCommitment(ownershipCommitment) {
        this._requireNotFrozen();
        const bytes = copyBytes32(ownershipCommitment, "ownershipCommitment");
        this._ownershipCommitment = bytes;
        return this;
    }

    /**
     * Returns a copy of the commitment, or null when it has not been set.
     *
     * @returns {?Uint8Array}
     */
    get ownershipCommitment() {
        return this._ownershipCommitment == null
            ? null
            : copyBytes32(this._ownershipCommitment, "ownershipCommitment");
    }

    /**
     * @override
     * @protected
     * @returns {Record<string, unknown>}
     */
    _getRequiredFields() {
        return {
            ownershipCommitment: this._ownershipCommitment,
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
        return channel.clpr.registerChannel(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprRegisterChannel";
    }

    /**
     * @override
     * @protected
     * @returns {IClprRegisterChannelTransactionBody}
     */
    _makeTransactionData() {
        return { ownershipCommitment: this._ownershipCommitment };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprRegisterChannelTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprRegisterChannel",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprRegisterChannelTransaction._fromProtobuf,
);
