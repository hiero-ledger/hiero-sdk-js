// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import ContractId from "../contract/ContractId.js";
import FileId from "../file/FileId.js";
import TopicId from "../topic/TopicId.js";
import TokenId from "../token/TokenId.js";
import ScheduleId from "../schedule/ScheduleId.js";
import ExchangeRate from "../ExchangeRate.js";
import Status from "../Status.js";
import Long from "long";
import * as HieroProto from "@hashgraph/proto";
import TransactionId from "../transaction/TransactionId.js";
import * as hex from "../encoding/hex.js";

/**
 * @typedef {import("../ExchangeRate.js").ExchangeRateJSON} ExchangeRateJSON
 */

/**
 * @typedef {object} TransactionReceiptJSON
 * @property {string} status
 * @property {?string} accountId
 * @property {?string} filedId
 * @property {?string} contractId
 * @property {?string} topicId
 * @property {?string} tokenId
 * @property {?string} scheduleId
 * @property {?ExchangeRateJSON} exchangeRate
 * @property {?ExchangeRateJSON} nextExchangeRate
 * @property {?string} topicSequenceNumber
 * @property {?string} topicRunningHash
 * @property {?string} totalSupply
 * @property {?string} scheduledTransactionId
 * @property {string[]} serials
 * @property {TransactionReceiptJSON[]} duplicates
 * @property {TransactionReceiptJSON[]} children
 * @property {?string} nodeId
 */

/**
 * The consensus result for a transaction, which might not be currently known,
 * or may succeed or fail.
 */
export default class TransactionReceipt {
    /**
     * @private
     * @param {object} props
     * @param {Status} props.status
     * @param {?AccountId} props.accountId
     * @param {?FileId} props.fileId
     * @param {?ContractId} props.contractId
     * @param {?TopicId} props.topicId
     * @param {?TokenId} props.tokenId
     * @param {?ScheduleId} props.scheduleId
     * @param {?ExchangeRate} props.exchangeRate
     * @param {?ExchangeRate} props.nextExchangeRate
     * @param {?Long} props.topicSequenceNumber
     * @param {?Uint8Array} props.topicRunningHash
     * @param {?Long} props.totalSupply
     * @param {?TransactionId} props.scheduledTransactionId
     * @param {Long[]} props.serials
     * @param {TransactionReceipt[]} props.duplicates
     * @param {TransactionReceipt[]} props.children
     * @param {?Long} props.nodeId
     */
    constructor(props) {
        /**
         * Whether the transaction succeeded or failed (or is unknown).
         *
         * @readonly
         */
        this.status = props.status;

        /**
         * The account ID, if a new account was created.
         *
         * @readonly
         */
        this.accountId = props.accountId;

        /**
         * The file ID, if a new file was created.
         *
         * @readonly
         */
        this.fileId = props.fileId;

        /**
         * The contract ID, if a new contract was created.
         *
         * @readonly
         */
        this.contractId = props.contractId;

        /**
         * The topic ID, if a new topic was created.
         *
         * @readonly
         */
        this.topicId = props.topicId;

        /**
         * The token ID, if a new token was created.
         *
         * @readonly
         */
        this.tokenId = props.tokenId;

        /**
         * The schedule ID, if a new schedule was created.
         *
         * @readonly
         */
        this.scheduleId = props.scheduleId;

        /**
         * The exchange rate of Hbars to cents (USD).
         *
         * @readonly
         */
        this.exchangeRate = props.exchangeRate;

        /**
         * The next exchange rate of Hbars to cents (USD).
         *
         * @readonly
         */
        this.nextExchangeRate = props.nextExchangeRate;

        /**
         * Updated sequence number for a consensus service topic.
         *
         * @readonly
         */
        this.topicSequenceNumber = props.topicSequenceNumber;

        /**
         * Updated running hash for a consensus service topic.
         *
         * @readonly
         */
        this.topicRunningHash = props.topicRunningHash;

        /**
         * Updated total supply for a token
         *
         * @readonly
         */
        this.totalSupply = props.totalSupply;

        this.scheduledTransactionId = props.scheduledTransactionId;

        this.serials = props.serials ?? [];

        /**
         * @readonly
         */
        this.duplicates = props.duplicates ?? [];

        /**
         * @readonly
         */
        this.children = props.children ?? [];

        /**
         * @readonly
         * @description In the receipt of a NodeCreate, NodeUpdate, NodeDelete, the id of the newly created node.
         * An affected node identifier.
         * This value SHALL be set following a `createNode` transaction.
         * This value SHALL be set following a `updateNode` transaction.
         * This value SHALL be set following a `deleteNode` transaction.
         * This value SHALL NOT be set following any other transaction.
         */
        this.nodeId = props.nodeId;

        Object.freeze(this);
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ITransactionGetReceiptResponse}
     */
    _toProtobuf() {
        const duplicates = this.duplicates.map(
            (receipt) =>
                /** @type {HieroProto.proto.ITransactionReceipt} */ (
                    receipt._toProtobuf().receipt
                ),
        );
        const children = this.children.map(
            (receipt) =>
                /** @type {HieroProto.proto.ITransactionReceipt} */ (
                    receipt._toProtobuf().receipt
                ),
        );

        return {
            duplicateTransactionReceipts: duplicates,
            childTransactionReceipts: children,
            receipt: {
                status: this.status.valueOf(),

                accountID:
                    this.accountId != null
                        ? this.accountId._toProtobuf()
                        : null,
                fileID: this.fileId != null ? this.fileId._toProtobuf() : null,
                contractID:
                    this.contractId != null
                        ? this.contractId._toProtobuf()
                        : null,
                topicID:
                    this.topicId != null ? this.topicId._toProtobuf() : null,
                tokenID:
                    this.tokenId != null ? this.tokenId._toProtobuf() : null,
                scheduleID:
                    this.scheduleId != null
                        ? this.scheduleId._toProtobuf()
                        : null,

                topicRunningHash:
                    this.topicRunningHash == null
                        ? null
                        : this.topicRunningHash,

                topicSequenceNumber: this.topicSequenceNumber,

                exchangeRate: {
                    nextRate:
                        this.nextExchangeRate != null
                            ? this.nextExchangeRate._toProtobuf()
                            : null,
                    currentRate:
                        this.exchangeRate != null
                            ? this.exchangeRate._toProtobuf()
                            : null,
                },

                scheduledTransactionID:
                    this.scheduledTransactionId != null
                        ? this.scheduledTransactionId._toProtobuf()
                        : null,

                serialNumbers: this.serials,
                newTotalSupply: this.totalSupply,
                nodeId: this.nodeId,
            },
        };
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransactionGetReceiptResponse} response
     * @returns {TransactionReceipt}
     */
    static _fromProtobuf(response) {
        const receipt = /** @type {HieroProto.proto.ITransactionReceipt} */ (
            response.receipt
        );

        const children =
            response.childTransactionReceipts != null
                ? response.childTransactionReceipts.map((child) =>
                      TransactionReceipt._fromProtobuf({ receipt: child }),
                  )
                : [];

        const duplicates =
            response.duplicateTransactionReceipts != null
                ? response.duplicateTransactionReceipts.map((duplicate) =>
                      TransactionReceipt._fromProtobuf({ receipt: duplicate }),
                  )
                : [];

        return new TransactionReceipt({
            status: Status._fromCode(
                receipt.status != null ? receipt.status : 0,
            ),

            accountId:
                receipt.accountID != null
                    ? AccountId._fromProtobuf(receipt.accountID)
                    : null,

            fileId:
                receipt.fileID != null
                    ? FileId._fromProtobuf(receipt.fileID)
                    : null,

            contractId:
                receipt.contractID != null
                    ? ContractId._fromProtobuf(receipt.contractID)
                    : null,

            topicId:
                receipt.topicID != null
                    ? TopicId._fromProtobuf(receipt.topicID)
                    : null,

            tokenId:
                receipt.tokenID != null
                    ? TokenId._fromProtobuf(receipt.tokenID)
                    : null,

            scheduleId:
                receipt.scheduleID != null
                    ? ScheduleId._fromProtobuf(receipt.scheduleID)
                    : null,

            exchangeRate:
                receipt.exchangeRate != null
                    ? ExchangeRate._fromProtobuf(
                          /** @type {HieroProto.proto.IExchangeRate} */
                          (receipt.exchangeRate.currentRate),
                      )
                    : null,

            nextExchangeRate:
                receipt.exchangeRate != null
                    ? ExchangeRate._fromProtobuf(
                          /** @type {HieroProto.proto.IExchangeRate} */
                          (receipt.exchangeRate.nextRate),
                      )
                    : null,

            topicSequenceNumber:
                receipt.topicSequenceNumber == null
                    ? null
                    : Long.fromString(receipt.topicSequenceNumber.toString()),

            topicRunningHash:
                receipt.topicRunningHash != null
                    ? new Uint8Array(receipt.topicRunningHash)
                    : null,

            totalSupply:
                receipt.newTotalSupply != null
                    ? Long.fromString(receipt.newTotalSupply.toString())
                    : null,

            scheduledTransactionId:
                receipt.scheduledTransactionID != null
                    ? TransactionId._fromProtobuf(
                          receipt.scheduledTransactionID,
                      )
                    : null,
            serials:
                receipt.serialNumbers != null
                    ? receipt.serialNumbers.map((serial) =>
                          Long.fromValue(serial),
                      )
                    : [],
            children,
            duplicates,
            nodeId: receipt.nodeId != null ? receipt.nodeId : null,
        });
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionReceipt}
     */
    static fromBytes(bytes) {
        return TransactionReceipt._fromProtobuf(
            HieroProto.proto.TransactionGetReceiptResponse.decode(bytes),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.TransactionGetReceiptResponse.encode(
            this._toProtobuf(),
        ).finish();
    }

    /**
     * @returns {TransactionReceiptJSON}
     */
    toJSON() {
        return {
            status: this.status.toString(),
            accountId: this.accountId?.toString() || null,
            filedId: this.fileId?.toString() || null,
            contractId: this.contractId?.toString() || null,
            topicId: this.topicId?.toString() || null,
            tokenId: this.tokenId?.toString() || null,
            scheduleId: this.scheduleId?.toString() || null,
            exchangeRate: this.exchangeRate?.toJSON() || null,
            nextExchangeRate: this.nextExchangeRate?.toJSON() || null,
            topicSequenceNumber: this.topicSequenceNumber?.toString() || null,
            topicRunningHash:
                this.topicRunningHash != null
                    ? hex.encode(this.topicRunningHash)
                    : null,
            totalSupply: this.totalSupply?.toString() || null,
            scheduledTransactionId:
                this.scheduledTransactionId?.toString() || null,
            serials: this.serials.map((serial) => serial.toString()),
            duplicates: this.duplicates.map((receipt) => receipt.toJSON()),
            children: this.children.map((receipt) => receipt.toJSON()),
            nodeId: this.nodeId?.toString() || null,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
