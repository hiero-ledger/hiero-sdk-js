// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import ClprThrottles from "./ClprThrottles.js";

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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprUpdateLedgerConfigurationTransactionBody} IClprUpdateLedgerConfigurationTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Updates the local CLPR ledger's capacity limits.
 *
 * Requires treasury or system admin authority. Send all seven limits: read the
 * current throttles with ClprGetLedgerConfigurationQuery, change the desired
 * fields through ClprThrottles.of while retaining the other limits, then submit
 * the resulting throttles with this transaction.
 *
 * Newly built bodies contain only configuration.throttles. Decoding exposes only
 * throttles and preserves incoming signed bytes and signatures unchanged.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprUpdateLedgerConfigurationTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {ClprThrottles} [props.throttles]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?ClprThrottles}
         */
        this._throttles = null;

        if (props?.throttles != null) {
            this.setThrottles(props.throttles);
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprUpdateLedgerConfigurationTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const updateLedgerConfiguration =
            /** @type {IClprUpdateLedgerConfigurationTransactionBody} */ (
                bodies[0].clprUpdateLedgerConfiguration
            );
        const throttles = updateLedgerConfiguration.configuration?.throttles;

        return Transaction._fromProtobufTransactions(
            new ClprUpdateLedgerConfigurationTransaction({
                throttles:
                    throttles != null
                        ? ClprThrottles._fromProtobuf(throttles)
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
     * Sets all seven capacity limits using an immutable ClprThrottles value.
     *
     * @param {ClprThrottles} throttles
     * @returns {this}
     */
    setThrottles(throttles) {
        this._requireNotFrozen();
        if (!(throttles instanceof ClprThrottles)) {
            throw new TypeError("throttles must be a ClprThrottles");
        }
        this._throttles = throttles;
        return this;
    }

    /**
     * Returns the immutable throttles, or null when they have not been set.
     *
     * @returns {?ClprThrottles}
     */
    get throttles() {
        return this._throttles;
    }

    /**
     * @override
     * @protected
     * @returns {Record<string, unknown>}
     */
    _getRequiredFields() {
        return {
            throttles: this._throttles,
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
        return channel.clpr.updateLedgerConfiguration(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprUpdateLedgerConfiguration";
    }

    /**
     * @override
     * @protected
     * @returns {IClprUpdateLedgerConfigurationTransactionBody}
     */
    _makeTransactionData() {
        return {
            configuration: {
                throttles: this._throttles?._toProtobuf() ?? null,
            },
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprUpdateLedgerConfigurationTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprUpdateLedgerConfiguration",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprUpdateLedgerConfigurationTransaction._fromProtobuf,
);
