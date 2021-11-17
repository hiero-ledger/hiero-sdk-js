import TransactionReceipt from "./TransactionReceipt.js";
import TransactionId from "./TransactionId.js";
import Timestamp from "../Timestamp.js";
import Hbar from "../Hbar.js";
import Transfer from "../Transfer.js";
import ContractFunctionResult from "../contract/ContractFunctionResult.js";
import TokenTransferMap from "../account/TokenTransferMap.js";
import TokenNftTransferMap from "../account/TokenNftTransferMap.js";
import * as proto from "@exodus/hashgraph-proto";
import ScheduleId from "../schedule/ScheduleId.js";
import AssessedCustomFee from "../token/AssessedCustomFee.js";
import TokenAssocation from "../token/TokenAssociation.js";

/**
 * @typedef {import("../token/TokenId.js").default} TokenId
 */

/**
 * Response when the client sends the node TransactionGetRecordResponse.
 */
export default class TransactionRecord {
    /**
     * @private
     * @param {object} props
     * @param {ContractFunctionResult} [props.contractFunctionResult]
     * @param {TransactionReceipt} props.receipt
     * @param {Uint8Array} props.transactionHash
     * @param {Timestamp} props.consensusTimestamp
     * @param {TransactionId} props.transactionId
     * @param {string} props.transactionMemo
     * @param {Hbar} props.transactionFee
     * @param {Transfer[]} props.transfers
     * @param {TokenTransferMap} props.tokenTransfers
     * @param {?ScheduleId} props.scheduleRef
     * @param {AssessedCustomFee[]} props.assessedCustomFees
     * @param {TokenNftTransferMap} props.nftTransfers
     * @param {TokenAssocation[]} props.automaticTokenAssociations
     */
    constructor(props) {
        /**
         * The status (reach consensus, or failed, or is unknown) and the ID of
         * any new account/file/instance created.
         *
         * @readonly
         */
        this.receipt = props.receipt;

        /**
         * The hash of the Transaction that executed (not the hash of any Transaction that failed
         * for having a duplicate TransactionID).
         *
         * @readonly
         */
        this.transactionHash = props.transactionHash;

        /**
         * The consensus timestamp (or null if didn't reach consensus yet).
         *
         * @readonly
         */
        this.consensusTimestamp = props.consensusTimestamp;

        /**
         * The ID of the transaction this record represents.
         *
         * @readonly
         */
        this.transactionId = props.transactionId;

        /**
         * The memo that was submitted as part of the transaction (max 100 bytes).
         *
         * @readonly
         */
        this.transactionMemo = props.transactionMemo;

        /**
         * The actual transaction fee charged,
         * not the original transactionFee value from TransactionBody.
         *
         * @readonly
         */
        this.transactionFee = props.transactionFee;

        /**
         * All hbar transfers as a result of this transaction, such as fees, or transfers performed
         * by the transaction, or by a smart contract it calls, or by the creation of threshold
         * records that it triggers.
         *
         * @readonly
         */
        this.transfers = props.transfers;

        /**
         * Record of the value returned by the smart contract function or constructor.
         *
         * @readonly
         */
        this.contractFunctionResult =
            props.contractFunctionResult != null
                ? props.contractFunctionResult
                : null;

        /**
         * All the token transfers from this account
         *
         * @readonly
         */
        this.tokenTransfers = props.tokenTransfers;

        /**
         * Reference to the scheduled transaction ID that this transaction record represent
         *
         * @readonly
         */
        this.scheduleRef = props.scheduleRef;

        /**
         * All custom fees that were assessed during a CryptoTransfer, and must be paid if the
         * transaction status resolved to SUCCESS
         *
         * @readonly
         */
        this.assessedCustomFees = props.assessedCustomFees;

        /** @readonly */
        this.nftTransfers = props.nftTransfers;

        /**
         * All token associations implicitly created while handling this transaction
         *
         * @readonly
         */
        this.automaticTokenAssociations = props.automaticTokenAssociations;

        Object.freeze(this);
    }

    /**
     * @internal
     * @returns {proto.ITransactionRecord}
     */
    _toProtobuf() {
        const tokenTransfers = this.tokenTransfers._toProtobuf();
        const nftTransfers = this.nftTransfers._toProtobuf();

        const tokenTransferLists = [];

        for (const tokenTransfer of tokenTransfers) {
            for (const nftTransfer of nftTransfers) {
                if (
                    tokenTransfer.token != null &&
                    nftTransfer.token != null &&
                    tokenTransfer.token.shardNum ===
                        nftTransfer.token.shardNum &&
                    tokenTransfer.token.realmNum ===
                        nftTransfer.token.realmNum &&
                    tokenTransfer.token.tokenNum === nftTransfer.token.tokenNum
                ) {
                    tokenTransferLists.push({
                        token: tokenTransfer.token,
                        transfers: tokenTransfer.transfers,
                        nftTransfers: tokenTransfer.nftTransfers,
                    });
                } else {
                    tokenTransferLists.push(tokenTransfer);
                    tokenTransferLists.push(nftTransfer);
                }
            }
        }

        return {
            receipt: this.receipt._toProtobuf(),

            transactionHash:
                this.transactionHash != null ? this.transactionHash : null,
            consensusTimestamp:
                this.consensusTimestamp != null
                    ? this.consensusTimestamp._toProtobuf()
                    : null,
            transactionID:
                this.transactionId != null
                    ? this.transactionId._toProtobuf()
                    : null,
            memo: this.transactionMemo != null ? this.transactionMemo : null,

            transactionFee:
                this.transactionFee != null
                    ? this.transactionFee.toTinybars()
                    : null,

            contractCallResult:
                this.contractFunctionResult != null
                    ? this.contractFunctionResult
                    : null,

            contractCreateResult:
                this.contractFunctionResult != null
                    ? this.contractFunctionResult
                    : null,

            transferList:
                this.transfers != null
                    ? {
                          accountAmounts: this.transfers.map((transfer) =>
                              transfer._toProtobuf()
                          ),
                      }
                    : null,
            tokenTransferLists,
            scheduleRef:
                this.scheduleRef != null
                    ? this.scheduleRef._toProtobuf()
                    : null,
            assessedCustomFees: this.assessedCustomFees.map((fee) =>
                fee._toProtobuf()
            ),
            automaticTokenAssociations: this.automaticTokenAssociations.map(
                (association) => association._toProtobuf()
            ),
        };
    }

    /**
     * @internal
     * @param {proto.ITransactionRecord} record
     * @returns {TransactionRecord}
     */
    static _fromProtobuf(record) {
        const contractFunctionResult =
            record.contractCallResult != null
                ? ContractFunctionResult._fromProtobuf(
                      record.contractCallResult
                  )
                : record.contractCreateResult != null
                ? ContractFunctionResult._fromProtobuf(
                      record.contractCreateResult
                  )
                : undefined;

        return new TransactionRecord({
            receipt: TransactionReceipt._fromProtobuf(
                /** @type {proto.ITransactionReceipt} */ (record.receipt)
            ),
            transactionHash:
                record.transactionHash != null
                    ? record.transactionHash
                    : new Uint8Array(),
            consensusTimestamp: Timestamp._fromProtobuf(
                /** @type {proto.ITimestamp} */
                (record.consensusTimestamp)
            ),
            transactionId: TransactionId._fromProtobuf(
                /** @type {proto.ITransactionID} */ (record.transactionID)
            ),
            transactionMemo: record.memo != null ? record.memo : "",
            transactionFee: Hbar.fromTinybars(
                record.transactionFee != null ? record.transactionFee : 0
            ),
            transfers: (record.transferList != null
                ? record.transferList.accountAmounts != null
                    ? record.transferList.accountAmounts
                    : []
                : []
            ).map((aa) => Transfer._fromProtobuf(aa)),
            contractFunctionResult,
            tokenTransfers: TokenTransferMap._fromProtobuf(
                record.tokenTransferLists != null
                    ? record.tokenTransferLists
                    : []
            ),
            scheduleRef:
                record.scheduleRef != null
                    ? ScheduleId._fromProtobuf(record.scheduleRef)
                    : null,
            assessedCustomFees:
                record.assessedCustomFees != null
                    ? record.assessedCustomFees.map((fee) =>
                          AssessedCustomFee._fromProtobuf(fee)
                      )
                    : [],
            nftTransfers: TokenNftTransferMap._fromProtobuf(
                record.tokenTransferLists != null
                    ? record.tokenTransferLists
                    : []
            ),
            automaticTokenAssociations:
                record.automaticTokenAssociations != null
                    ? record.automaticTokenAssociations.map((association) =>
                          TokenAssocation._fromProtobuf(association)
                      )
                    : [],
        });
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionRecord}
     */
    static fromBytes(bytes) {
        return TransactionRecord._fromProtobuf(
            proto.TransactionRecord.decode(bytes)
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.TransactionRecord.encode(this._toProtobuf()).finish();
    }
}
