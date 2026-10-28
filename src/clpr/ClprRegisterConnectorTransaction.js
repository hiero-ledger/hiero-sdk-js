// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import { requireUint8ArrayLength } from "../util.js";
import { computeConnectorId, computeConnectorCommitment } from "./ownership.js";

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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprRegisterConnectorTransactionBody} IClprRegisterConnectorTransactionBody
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
 * Reserves a CLPR Connector in the commit phase of HIP-1535 commit-reveal.
 *
 * Derive the Connector ID with computeConnectorId(), then register the result
 * of computeOwnershipCommitment(). Complete the registration by revealing the
 * bound Channel ID, Connector ID, salt and ownership proof with
 * ClprCompleteConnectorTransaction. The reveal's admin key keeps deregistration
 * possible, and its payer funds the locked stake.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprRegisterConnectorTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.commitment]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._commitment = null;

        if (props?.commitment != null) {
            this.setCommitment(props.commitment);
        }
    }

    /**
     * Computes keccak256(channelId || canonical public key || salt).
     * Supports ECDSA secp256k1 and Ed25519 ownership keys.
     *
     * @param {Uint8Array} channelId - The 32-byte Channel ID.
     * @param {PublicKey} publicKey - The ownership public key.
     * @param {Uint8Array} salt - The 32-byte operator-chosen salt.
     * @returns {Uint8Array}
     */
    static computeConnectorId(channelId, publicKey, salt) {
        return computeConnectorId(channelId, publicKey, salt);
    }

    /**
     * Computes keccak256(connectorId || canonical public key).
     *
     * @param {Uint8Array} connectorId - The 32-byte Connector ID.
     * @param {PublicKey} publicKey - The ownership public key.
     * @returns {Uint8Array}
     */
    static computeOwnershipCommitment(connectorId, publicKey) {
        return computeConnectorCommitment(connectorId, publicKey);
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprRegisterConnectorTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const registerConnector =
            /** @type {IClprRegisterConnectorTransactionBody} */ (
                bodies[0].clprRegisterConnector
            );

        return Transaction._fromProtobufTransactions(
            new ClprRegisterConnectorTransaction({
                commitment: registerConnector.commitment ?? undefined,
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
     * @param {Uint8Array} commitment
     * @returns {this}
     */
    setCommitment(commitment) {
        this._requireNotFrozen();
        requireUint8ArrayLength(commitment, 32, "commitment");
        this._commitment = new Uint8Array(commitment);
        return this;
    }

    /**
     * Returns a copy of the commitment, or null when it has not been set.
     *
     * @returns {?Uint8Array}
     */
    get commitment() {
        return this._commitment == null
            ? null
            : new Uint8Array(this._commitment);
    }

    /**
     * @override
     * @param {?Client} client
     * @returns {this}
     */
    freezeWith(client) {
        if (this._commitment == null) {
            throw new Error(
                "ClprRegisterConnectorTransaction: 'commitment' must be explicitly set before calling freeze().",
            );
        }

        return super.freezeWith(client);
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
        return channel.clpr.registerConnector(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprRegisterConnector";
    }

    /**
     * @override
     * @protected
     * @returns {IClprRegisterConnectorTransactionBody}
     */
    _makeTransactionData() {
        return { commitment: this._commitment };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprRegisterConnectorTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprRegisterConnector",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprRegisterConnectorTransaction._fromProtobuf,
);
