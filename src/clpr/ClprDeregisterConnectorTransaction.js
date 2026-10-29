// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import AccountId from "../account/AccountId.js";
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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprDeregisterConnectorTransactionBody} IClprDeregisterConnectorTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Deregisters a CLPR Connector and returns its locked stake only to the named account.
 *
 * The Connector admin key and the explicitly named stake recipient must sign
 * using the normal transaction signing flow. The SDK never defaults the recipient.
 * The ownership commitment stays registered, so registering another Connector
 * requires a new salt and Connector ID.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprDeregisterConnectorTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {Uint8Array} [props.connectorId]
     * @param {AccountId | string} [props.stakeRecipient]
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
        this._connectorId = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._stakeRecipient = null;

        if (props?.channelId != null) {
            this.setChannelId(props.channelId);
        }
        if (props?.connectorId != null) {
            this.setConnectorId(props.connectorId);
        }
        if (props?.stakeRecipient != null) {
            this.setStakeRecipient(props.stakeRecipient);
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprDeregisterConnectorTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const deregisterConnector =
            /** @type {IClprDeregisterConnectorTransactionBody} */ (
                bodies[0].clprDeregisterConnector
            );

        return Transaction._fromProtobufTransactions(
            new ClprDeregisterConnectorTransaction({
                channelId: deregisterConnector.channelId ?? undefined,
                connectorId: deregisterConnector.connectorId ?? undefined,
                stakeRecipient:
                    deregisterConnector.stakeRecipient != null
                        ? AccountId._fromProtobuf(
                              deregisterConnector.stakeRecipient,
                          )
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
     * Sets the 32-byte Connector ID and copies its bytes.
     *
     * @param {Uint8Array} connectorId
     * @returns {this}
     */
    setConnectorId(connectorId) {
        this._requireNotFrozen();
        const bytes = copyBytes32(connectorId, "connectorId");
        this._connectorId = bytes;
        return this;
    }

    /**
     * Returns a copy of the Connector ID, or null when it has not been set.
     *
     * @returns {?Uint8Array}
     */
    get connectorId() {
        return this._connectorId == null
            ? null
            : copyBytes32(this._connectorId, "connectorId");
    }

    /**
     * Sets the account that receives the returned stake. This account must sign.
     *
     * @param {AccountId | string} stakeRecipient
     * @returns {this}
     */
    setStakeRecipient(stakeRecipient) {
        this._requireNotFrozen();
        this._stakeRecipient =
            typeof stakeRecipient === "string"
                ? AccountId.fromString(stakeRecipient)
                : stakeRecipient.clone();
        return this;
    }

    /**
     * Returns a copy of the stake recipient, or null when it has not been set.
     *
     * @returns {?AccountId}
     */
    get stakeRecipient() {
        return this._stakeRecipient == null
            ? null
            : this._stakeRecipient.clone();
    }

    /**
     * @override
     * @protected
     * @returns {Record<string, unknown>}
     */
    _getRequiredFields() {
        return {
            channelId: this._channelId,
            connectorId: this._connectorId,
            stakeRecipient: this._stakeRecipient,
        };
    }

    /**
     * @override
     * @param {Client} client
     */
    _validateChecksums(client) {
        this._stakeRecipient?.validateChecksum(client);
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
        return channel.clpr.deregisterConnector(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprDeregisterConnector";
    }

    /**
     * @override
     * @protected
     * @returns {IClprDeregisterConnectorTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this._channelId,
            connectorId: this._connectorId,
            stakeRecipient: this._stakeRecipient?._toProtobuf() ?? null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprDeregisterConnectorTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprDeregisterConnector",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprDeregisterConnectorTransaction._fromProtobuf,
);
