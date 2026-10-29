// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import { copyBytes32 } from "../util.js";

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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprCloseChannelTransactionBody} IClprCloseChannelTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Initiates graceful closure of a CLPR Channel under HIP-1535.
 *
 * This privileged operation requires the treasury or system admin authority.
 * An existing Channel stops accepting new messages and drains its queues before
 * closing. When no Channel exists, ownershipCommitment identifies an abandoned
 * pending registration to sweep. The commitment is ignored for an existing Channel.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprCloseChannelTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {Uint8Array} [props.ownershipCommitment]
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
        this._ownershipCommitment = null;

        if (props?.channelId != null) {
            this.setChannelId(props.channelId);
        }
        if (props?.ownershipCommitment != null) {
            this.setOwnershipCommitment(props.ownershipCommitment);
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprCloseChannelTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const closeChannel = /** @type {IClprCloseChannelTransactionBody} */ (
            bodies[0].clprCloseChannel
        );

        return Transaction._fromProtobufTransactions(
            new ClprCloseChannelTransaction({
                channelId: closeChannel.channelId?.length
                    ? closeChannel.channelId
                    : undefined,
                ownershipCommitment: closeChannel.ownershipCommitment?.length
                    ? closeChannel.ownershipCommitment
                    : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * Sets the 32-byte Channel ID and copies its bytes.
     *
     * @param {Uint8Array} channelId
     * @returns {this}
     */
    setChannelId(channelId) {
        this._requireNotFrozen();
        const bytes = copyBytes32(channelId, "channelId");
        this._channelId = bytes;
        return this;
    }

    /**
     * Returns a copy of the Channel ID, or null when it has not been set.
     *
     * @returns {?Uint8Array}
     */
    get channelId() {
        return this._channelId == null
            ? null
            : copyBytes32(this._channelId, "channelId");
    }

    /**
     * Sets the 32-byte commitment for sweeping an abandoned pending registration.
     * Copies the bytes. This field is ignored when the Channel already exists.
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
     * Returns a copy of the optional commitment, or null when it has not been set.
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
            channelId: this._channelId,
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
        return channel.clpr.closeChannel(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprCloseChannel";
    }

    /**
     * @override
     * @protected
     * @returns {IClprCloseChannelTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this._channelId,
            ownershipCommitment: this._ownershipCommitment,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprCloseChannelTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprCloseChannel",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprCloseChannelTransaction._fromProtobuf,
);
