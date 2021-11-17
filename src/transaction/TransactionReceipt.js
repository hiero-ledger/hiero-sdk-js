import AccountId from "../account/AccountId.js";
import ContractId from "../contract/ContractId.js";
import FileId from "../file/FileId.js";
import TopicId from "../topic/TopicId.js";
import TokenId from "../token/TokenId.js";
import ScheduleId from "../schedule/ScheduleId.js";
import ExchangeRate from "../ExchangeRate.js";
import Status from "../Status.js";
import Long from "long";
import * as proto from "@exodus/hashgraph-proto";
import TransactionId from "../transaction/TransactionId.js";

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
     * @param {?Long} props.topicSequenceNumber
     * @param {?Uint8Array} props.topicRunningHash
     * @param {?Long} props.totalSupply
     * @param {?TransactionId} props.scheduledTransactionId
     * @param {Long[]} props.serials
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

        this.serials = props.serials;

        Object.freeze(this);
    }

    /**
     * @internal
     * @returns {proto.ITransactionReceipt}
     */
    _toProtobuf() {
        return {
            status: this.status.valueOf(),

            accountID:
                this.accountId != null ? this.accountId._toProtobuf() : null,
            fileID: this.fileId != null ? this.fileId._toProtobuf() : null,
            contractID:
                this.contractId != null ? this.contractId._toProtobuf() : null,
            topicID: this.topicId != null ? this.topicId._toProtobuf() : null,
            tokenID: this.topicId != null ? this.topicId._toProtobuf() : null,
            scheduleID:
                this.topicId != null ? this.topicId._toProtobuf() : null,

            topicRunningHash:
                this.topicRunningHash == null ? null : this.topicRunningHash,

            topicSequenceNumber: this.topicSequenceNumber,

            exchangeRate: {
                nextRate: null,
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
        };
    }

    /**
     * @internal
     * @param {proto.ITransactionReceipt} receipt
     * @returns {TransactionReceipt}
     */
    static _fromProtobuf(receipt) {
        const exchangeRateSet = /** @type {proto.IExchangeRateSet} */ (
            receipt.exchangeRate
        );

        return new TransactionReceipt({
            status: Status._fromCode(
                receipt.status != null ? receipt.status : 0
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
                          /** @type {proto.IExchangeRate} */
                          (exchangeRateSet.currentRate)
                      )
                    : null,

            topicSequenceNumber:
                receipt.topicSequenceNumber == null
                    ? null
                    : Long.fromValue(receipt.topicSequenceNumber),

            topicRunningHash:
                receipt.topicRunningHash != null
                    ? receipt.topicRunningHash
                    : null,

            totalSupply:
                receipt.newTotalSupply != null ? receipt.newTotalSupply : null,

            scheduledTransactionId:
                receipt.scheduledTransactionID != null
                    ? TransactionId._fromProtobuf(
                          receipt.scheduledTransactionID
                      )
                    : null,
            serials: receipt.serialNumbers != null ? receipt.serialNumbers : [],
        });
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionReceipt}
     */
    static fromBytes(bytes) {
        return TransactionReceipt._fromProtobuf(
            proto.TransactionReceipt.decode(bytes)
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.TransactionReceipt.encode(this._toProtobuf()).finish();
    }
}
