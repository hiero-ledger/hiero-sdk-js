// SPDX-License-Identifier: Apache-2.0

import Hbar from "./Hbar.js";
import FileId from "./file/FileId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "./transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IEthereumTransactionBody} HieroProto.proto.IEthereumTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./channel/Channel.js").default} Channel
 * @typedef {import("./client/Client.js").default<*, *>} Client
 * @typedef {import("./Timestamp.js").default} Timestamp
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("long")} Long
 */

/**
 * Create a new Hedera™ transaction wrapped ethereum transaction.
 */
export default class EthereumTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.ethereumData]
     * @param {FileId} [props.callData]
     * @param {FileId} [props.callDataFileId]
     * @param {number | string | Long | BigNumber | Hbar} [props.maxGasAllowance]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._ethereumData = null;

        /**
         * @private
         * @type {?FileId}
         */
        this._callDataFileId = null;

        /**
         * @private
         * @type {?Hbar}
         */
        this._maxGasAllowance = null;

        if (props.ethereumData != null) {
            this.setEthereumData(props.ethereumData);
        }

        if (props.callData != null) {
            this.setCallDataFileId(props.callData);
        }

        if (props.callDataFileId != null) {
            this.setCallDataFileId(props.callDataFileId);
        }

        if (props.maxGasAllowance != null) {
            this.setMaxGasAllowanceHbar(props.maxGasAllowance);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {EthereumTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const transaction =
            /** @type {HieroProto.proto.IEthereumTransactionBody} */ (
                body.ethereumTransaction
            );

        return Transaction._fromProtobufTransactions(
            new EthereumTransaction({
                ethereumData:
                    transaction.ethereumData != null
                        ? transaction.ethereumData
                        : undefined,
                callData:
                    transaction.callData != null
                        ? FileId._fromProtobuf(transaction.callData)
                        : undefined,
                maxGasAllowance:
                    transaction.maxGasAllowance != null
                        ? Hbar.fromTinybars(transaction.maxGasAllowance)
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
     * @returns {?(Uint8Array | FileId)}
     */
    get ethereumData() {
        return this._ethereumData;
    }

    /**
     * The raw Ethereum transaction (RLP encoded type 0, 1, and 2). Complete
     * unless the callData field is set.
     *
     * @param {Uint8Array} ethereumData
     * @returns {this}
     */
    setEthereumData(ethereumData) {
        this._requireNotFrozen();
        this._ethereumData = ethereumData;
        return this;
    }

    /**
     * @deprecated - Use `callDataFileId` instead
     * @returns {?FileId}
     */
    get callData() {
        return this.callDataFileId;
    }

    /**
     * @deprecated - Use `setCallDataFileId()` instead
     *
     * For large transactions (for example contract create) this is the callData
     * of the callData. The data in the callData will be re-written with
     * the callData element as a zero length string with the original contents in
     * the referenced file at time of execution. The callData will need to be
     * "rehydrated" with the callData for signature validation to pass.
     * @param {FileId} callDataFileId
     * @returns {this}
     */
    setCallData(callDataFileId) {
        return this.setCallDataFileId(callDataFileId);
    }

    /**
     * @returns {?FileId}
     */
    get callDataFileId() {
        return this._callDataFileId;
    }

    /**
     * For large transactions (for example contract create) this is the callData
     * of the callData. The data in the callData will be re-written with
     * the callData element as a zero length string with the original contents in
     * the referenced file at time of execution. The callData will need to be
     * "rehydrated" with the callData for signature validation to pass.
     *
     * @param {FileId} callDataFileId
     * @returns {this}
     */
    setCallDataFileId(callDataFileId) {
        this._requireNotFrozen();
        this._callDataFileId = callDataFileId;
        return this;
    }

    /**
     * @returns {?Hbar}
     */
    get maxGasAllowance() {
        return this._maxGasAllowance;
    }

    /**
     * @deprecated -- use setMaxGasAllowanceHbar instead
     * @param {number | string | Long | BigNumber | Hbar} maxGasAllowance
     * @returns {this}
     */
    setMaxGasAllowance(maxGasAllowance) {
        return this.setMaxGasAllowanceHbar(maxGasAllowance);
    }

    /**
     * The maximum amount, in hbars, that the payer of the hedera transaction
     * is willing to pay to complete the transaction.
     *
     * Ordinarily the account with the ECDSA alias corresponding to the public
     * key that is extracted from the ethereum_data signature is responsible for
     * fees that result from the execution of the transaction. If that amount of
     * authorized fees is not sufficient then the payer of the transaction can be
     * charged, up to but not exceeding this amount. If the ethereum_data
     * transaction authorized an amount that was insufficient then the payer will
     * only be charged the amount needed to make up the difference. If the gas
     * price in the transaction was set to zero then the payer will be assessed
     * the entire fee.
     *
     * @param {number | string | Long | BigNumber | Hbar} maxGasAllowance
     * @returns {this}
     */
    setMaxGasAllowanceHbar(maxGasAllowance) {
        this._requireNotFrozen();
        this._maxGasAllowance =
            maxGasAllowance instanceof Hbar
                ? maxGasAllowance
                : new Hbar(maxGasAllowance);
        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (
            this._ethereumData != null &&
            this._ethereumData instanceof FileId
        ) {
            this._ethereumData.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.smartContract.callEthereum(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "ethereumTransaction";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IEthereumTransactionBody}
     */
    _makeTransactionData() {
        return {
            ethereumData: this._ethereumData,
            callData:
                this._callDataFileId != null
                    ? this._callDataFileId._toProtobuf()
                    : null,
            maxGasAllowance:
                this._maxGasAllowance != null
                    ? this._maxGasAllowance.toTinybars()
                    : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("./Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `EthereumTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "ethereumTransaction",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    EthereumTransaction._fromProtobuf,
);
