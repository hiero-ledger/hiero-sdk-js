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
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprSubmitBundleTransactionBody} IClprSubmitBundleTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Submits an opaque peer bundle to a CLPR Channel under HIP-1535.
 *
 * The SDK copies the payload without interpreting it. The Channel's verifier
 * contract interprets and verifies it. Any payer can currently submit a bundle;
 * the endpoint-only rule in HAPI docs is not enforced by the pinned handler.
 * The deprecated endpointNodeId and endpointSignature fields do not authenticate
 * the caller and are not exposed by this builder. Newly built bodies omit them.
 * Decoded signed transactions keep their original body bytes and signatures.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprSubmitBundleTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {Uint8Array} [props.bundlePayload]
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
        this._bundlePayload = null;

        if (props?.channelId != null) {
            this.setChannelId(props.channelId);
        }
        if (props?.bundlePayload != null) {
            this.setBundlePayload(props.bundlePayload);
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprSubmitBundleTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const submitBundle = /** @type {IClprSubmitBundleTransactionBody} */ (
            bodies[0].clprSubmitBundle
        );

        return Transaction._fromProtobufTransactions(
            new ClprSubmitBundleTransaction({
                channelId: submitBundle.channelId?.length
                    ? submitBundle.channelId
                    : undefined,
                bundlePayload: submitBundle.bundlePayload ?? undefined,
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
     * Sets the opaque bundle payload and copies its bytes without interpreting it.
     *
     * @param {Uint8Array} bundlePayload
     * @returns {this}
     */
    setBundlePayload(bundlePayload) {
        this._requireNotFrozen();
        if (!(bundlePayload instanceof Uint8Array)) {
            throw new Error("bundlePayload must be a Uint8Array");
        }
        this._bundlePayload = new Uint8Array(bundlePayload);
        return this;
    }

    /**
     * Returns a copy of the opaque payload, or null when it has not been set.
     *
     * @returns {?Uint8Array}
     */
    get bundlePayload() {
        return this._bundlePayload == null
            ? null
            : new Uint8Array(this._bundlePayload);
    }

    /**
     * @override
     * @protected
     * @returns {string}
     */
    _getName() {
        return "ClprSubmitBundleTransaction";
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
        return channel.clpr.submitBundle(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprSubmitBundle";
    }

    /**
     * @override
     * @protected
     * @returns {IClprSubmitBundleTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this._channelId,
            bundlePayload: this._bundlePayload,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprSubmitBundleTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprSubmitBundle",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprSubmitBundleTransaction._fromProtobuf,
);
