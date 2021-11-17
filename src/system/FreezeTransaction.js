import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Timestamp from "../Timestamp.js";
import FileId from "../file/FileId.js";
import * as hex from "../encoding/hex.js";
import FreezeType from "../FreezeType.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IFreezeTransactionBody} proto.IFreezeTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * @typedef {object} HourMinute
 * @property {number} hour
 * @property {number} minute
 */

export default class FreezeTransaction extends Transaction {
    /**
     * @param {Object} [props]
     * @param {HourMinute} [props.startTime]
     * @param {HourMinute} [props.endTime]
     * @param {Timestamp} [props.startTimestamp]
     * @param {FileId} [props.updateFileId]
     * @param {FileId} [props.fileId]
     * @param {Uint8Array | string} [props.fileHash]
     * @param { FreezeType } [props.freezeType]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?HourMinute}
         */
        this._startTime = null;

        /**
         * @private
         * @type {?Timestamp}
         */
        this._startTimestamp = null;

        /**
         * @private
         * @type {?HourMinute}
         */
        this._endTime = null;

        /**
         * @private
         * @type {?FileId}
         */
        this._fileId = null;

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._fileHash = null;

        /**
         * @private
         * @type {?FreezeType}
         */
        this._freezeType = null;

        if (props.startTime != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setStartTime(props.startTime.hour, props.startTime.minute);
        }

        if (props.endTime != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setEndTime(props.endTime.hour, props.endTime.minute);
        }

        if (props.startTimestamp != null) {
            this.setStartTimestamp(props.startTimestamp);
        }

        if (props.updateFileId != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setUpdateFileId(props.updateFileId);
        }

        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }

        if (props.fileHash != null) {
            this.setFileHash(props.fileHash);
        }

        if (props.freezeType != null) {
            this.setFreezeType(props.freezeType);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {FreezeTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const freeze = /** @type {proto.IFreezeTransactionBody} */ (
            body.freeze
        );

        return Transaction._fromProtobufTransactions(
            new FreezeTransaction({
                startTime:
                    freeze.startHour != null && freeze.startMin != null
                        ? {
                              hour: freeze.startHour,
                              minute: freeze.startMin,
                          }
                        : undefined,
                endTime:
                    freeze.endHour != null && freeze.endMin != null
                        ? {
                              hour: freeze.endHour,
                              minute: freeze.endMin,
                          }
                        : undefined,
                startTimestamp:
                    freeze.startTime != null
                        ? Timestamp._fromProtobuf(freeze.startTime)
                        : undefined,
                updateFileId:
                    freeze.updateFile != null
                        ? FileId._fromProtobuf(freeze.updateFile)
                        : undefined,
                fileHash: freeze.fileHash != null ? freeze.fileHash : undefined,
                freezeType:
                    freeze.freezeType != null
                        ? FreezeType._fromCode(freeze.freezeType)
                        : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @deprecated - Use `startTimestamp` instead
     * @returns {?HourMinute}
     */
    get startTime() {
        return null;
    }

    /**
     * @deprecated - Use `startTimestamp` instead
     * @param {number | string} startHourOrString
     * @param {?number} startMinute
     * @returns {FreezeTransaction}
     */
    setStartTime(startHourOrString, startMinute) {
        this._requireNotFrozen();
        if (typeof startHourOrString === "string") {
            const split = startHourOrString.split(":");
            this._startTime = {
                hour: Number(split[0]),
                minute: Number(split[1]),
            };
        } else {
            this._startTime = {
                hour: startHourOrString,
                minute: /** @type {number} */ (startMinute),
            };
        }

        return this;
    }

    /**
     * @returns {?Timestamp}
     */
    get startTimestamp() {
        return this._startTimestamp;
    }

    /**
     * @param {Timestamp} startTimestamp
     * @returns {FreezeTransaction}
     */
    setStartTimestamp(startTimestamp) {
        this._requireNotFrozen();
        this._startTimestamp = startTimestamp;

        return this;
    }

    /**
     * @deprecated
     * @returns {?HourMinute}
     */
    get endTime() {
        console.warn("`FreezeTransaction.endTime` is deprecated");
        return this._endTime;
    }

    /**
     * @deprecated
     * @param {number | string} endHourOrString
     * @param {?number} endMinute
     * @returns {FreezeTransaction}
     */
    setEndTime(endHourOrString, endMinute) {
        console.warn("`FreezeTransaction.endTime` is deprecated");
        this._requireNotFrozen();
        if (typeof endHourOrString === "string") {
            const split = endHourOrString.split(":");
            this._endTime = {
                hour: Number(split[0]),
                minute: Number(split[1]),
            };
        } else {
            this._endTime = {
                hour: endHourOrString,
                minute: /** @type {number} */ (endMinute),
            };
        }

        return this;
    }

    /**
     * @deprecated - Use `fileId` instead
     * @returns {?FileId}
     */
    get updateFileId() {
        return this.fileId;
    }

    /**
     * @deprecated - Use `setFileId()` instead
     * @param {FileId} updateFileId
     * @returns {FreezeTransaction}
     */
    setUpdateFileId(updateFileId) {
        return this.setFileId(updateFileId);
    }

    /**
     * @returns {?FileId}
     */
    get fileId() {
        return this._fileId;
    }

    /**
     * @param {FileId} fileId
     * @returns {FreezeTransaction}
     */
    setFileId(fileId) {
        this._requireNotFrozen();
        this._fileId = fileId;

        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get fileHash() {
        return this._fileHash;
    }

    /**
     * @param {Uint8Array | string} fileHash
     * @returns {FreezeTransaction}
     */
    setFileHash(fileHash) {
        this._requireNotFrozen();
        this._fileHash =
            typeof fileHash === "string" ? hex.decode(fileHash) : fileHash;

        return this;
    }

    /**
     * @returns {?FreezeType}
     */
    get freezeType() {
        return this._freezeType;
    }

    /**
     * @param {FreezeType} freezeType
     * @returns {FreezeTransaction}
     */
    setFreezeType(freezeType) {
        this._requireNotFrozen();
        this._freezeType = freezeType;
        return this;
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "freeze";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IFreezeTransactionBody}
     */
    _makeTransactionData() {
        return {
            startTime:
                this._startTimestamp != null
                    ? this._startTimestamp._toProtobuf()
                    : null,
            updateFile:
                this._fileId != null ? this._fileId._toProtobuf() : null,
            fileHash: this._fileHash,
            freezeType:
                this._freezeType != null ? this._freezeType.valueOf() : null,
        };
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
TRANSACTION_REGISTRY.set("freeze", FreezeTransaction._fromProtobuf);
