// SPDX-License-Identifier: Apache-2.0

import TransactionReceipt from "./TransactionReceipt.js";
import TransactionId from "./TransactionId.js";
import Timestamp from "../Timestamp.js";
import Hbar from "../Hbar.js";
import Transfer from "../Transfer.js";
import ContractFunctionResult from "../contract/ContractFunctionResult.js";
import TokenTransferMap from "../account/TokenTransferMap.js";
import TokenNftTransferMap from "../account/TokenNftTransferMap.js";
import * as HieroProto from "@hashgraph/proto";
import ScheduleId from "../schedule/ScheduleId.js";
import AssessedCustomFee from "../token/AssessedCustomFee.js";
import TokenAssocation from "../token/TokenAssociation.js";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";
import TokenTransfer from "../token/TokenTransfer.js";
import EvmAddress from "../EvmAddress.js";
import * as hex from "../encoding/hex.js";
import PendingAirdropRecord from "../token/PendingAirdropRecord.js";

/**
 * @typedef {import("../token/TokenId.js").default} TokenId
 * @typedef {import("../token/TokenTransfer.js").TokenTransferJSON} TokenTransferJSON
 * @typedef {import("../account/HbarAllowance.js").default} HbarAllowance
 * @typedef {import("../account/TokenAllowance.js").default} TokenAllowance
 * @typedef {import("../account/TokenNftAllowance.js").default} TokenNftAllowance
 * @typedef {import("./TransactionReceipt.js").TransactionReceiptJSON} TransactionReceiptJSON
 * @typedef {import("../Transfer.js").TransferJSON} TransferJSON
 */

/**
 * @typedef {object} TransactionRecordJSON
 * @property {TransactionReceiptJSON} receipt
 * @property {?string} transactionHash
 * @property {Date} consensusTimestamp
 * @property {string} transactionId
 * @property {string} transactionMemo
 * @property {string} transactionFee
 * @property {TransferJSON[]} transfers
 * @property {TokenTransferMap} tokenTransfers
 * @property {TokenTransferJSON[]} tokenTransfersList
 * @property {?string} scheduleRef
 * @property {AssessedCustomFee[]} assessedCustomFees
 * @property {TokenNftTransferMap} nftTransfers
 * @property {TokenAssocation[]} automaticTokenAssociations
 * @property {Date | null} parentConsensusTimestamp
 * @property {?string} aliasKey
 * @property {TransactionRecord[]} duplicates
 * @property {TransactionRecord[]} children
 * @property {?string} ethereumHash
 * @property {Transfer[]} paidStakingRewards
 * @property {?string} prngBytes
 * @property {?number} prngNumber
 * @property {?string} evmAddress
 */

/**
 * Either the record of processing the first consensus transaction with the given id whose
 * status was neither <tt>INVALID_NODE_ACCOUNT</tt> nor <tt>INVALID_PAYER_SIGNATURE</tt>;
 * <b>or</b>, if no such record exists, the record of processing the first transaction to reach
 * consensus with the given transaction id.
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
     * @param {TokenTransfer[]} props.tokenTransfersList
     * @param {?ScheduleId} props.scheduleRef
     * @param {AssessedCustomFee[]} props.assessedCustomFees
     * @param {TokenNftTransferMap} props.nftTransfers
     * @param {TokenAssocation[]} props.automaticTokenAssociations
     * @param {Timestamp | null} props.parentConsensusTimestamp
     * @param {PublicKey | null} props.aliasKey
     * @param {TransactionRecord[]} props.duplicates
     * @param {TransactionRecord[]} props.children
     * @param {HbarAllowance[]} props.hbarAllowanceAdjustments
     * @param {TokenAllowance[]} props.tokenAllowanceAdjustments
     * @param {TokenNftAllowance[]} props.nftAllowanceAdjustments
     * @param {?Uint8Array} props.ethereumHash
     * @param {Transfer[]} props.paidStakingRewards
     * @param {?Uint8Array} props.prngBytes
     * @param {?number} props.prngNumber
     * @param {?EvmAddress} props.evmAddress
     * @param {PendingAirdropRecord[]} props.newPendingAirdrops
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
         * All the token transfers from this account
         *
         * @readonly
         */
        this.tokenTransfersList = props.tokenTransfersList;

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

        /**
         * In the record of an internal transaction, the consensus timestamp of the user
         * transaction that spawned it.
         *
         * @readonly
         */
        this.parentConsensusTimestamp = props.parentConsensusTimestamp;

        /**
         * In the record of an internal CryptoCreate transaction triggered by a user
         * transaction with a (previously unused) alias, the new account's alias.
         *
         * @readonly
         */
        this.aliasKey = props.aliasKey;

        /**
         * The records of processing all consensus transaction with the same id as the distinguished
         * record above, in chronological order.
         *
         * @readonly
         */
        this.duplicates = props.duplicates;

        /**
         * The records of processing all child transaction spawned by the transaction with the given
         * top-level id, in consensus order. Always empty if the top-level status is UNKNOWN.
         *
         * @readonly
         */
        this.children = props.children;

        /**
         * @deprecated
         * @readonly
         */
        // eslint-disable-next-line deprecation/deprecation
        this.hbarAllowanceAdjustments = props.hbarAllowanceAdjustments;

        /**
         * @deprecated
         * @readonly
         */
        // eslint-disable-next-line deprecation/deprecation
        this.tokenAllowanceAdjustments = props.tokenAllowanceAdjustments;

        /**
         * @deprecated
         * @readonly
         */
        // eslint-disable-next-line deprecation/deprecation
        this.nftAllowanceAdjustments = props.nftAllowanceAdjustments;

        /**
         * The keccak256 hash of the ethereumData. This field will only be populated for
         * EthereumTransaction.
         *
         * @readonly
         */
        this.ethereumHash = props.ethereumHash;

        /**
         * List of accounts with the corresponding staking rewards paid as a result of a transaction.
         *
         * @readonly
         */
        this.paidStakingRewards = props.paidStakingRewards;

        /**
         * In the record of a PRNG transaction with no output range, a pseudorandom 384-bit string.
         *
         * @readonly
         */
        this.prngBytes = props.prngBytes;

        /**
         * In the record of a PRNG transaction with an output range, the output of a PRNG whose input was a 384-bit string.
         *
         * @readonly
         */
        this.prngNumber = props.prngNumber;

        /**
         * The new default EVM address of the account created by this transaction.
         * This field is populated only when the EVM address is not specified in the related transaction body.
         *
         * @readonly
         */
        this.evmAddress = props.evmAddress;

        /**
         * The new default EVM address of the account created by this transaction.
         * This field is populated only when the EVM address is not specified in the related transaction body.
         *
         * @readonly
         */
        this.newPendingAirdrops = props.newPendingAirdrops;

        Object.freeze(this);
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ITransactionGetRecordResponse}
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

        const duplicates = this.duplicates.map(
            (record) =>
                /** @type {HieroProto.proto.ITransactionRecord} */ (
                    record._toProtobuf().transactionRecord
                ),
        );
        const children = this.children.map(
            (record) =>
                /** @type {HieroProto.proto.ITransactionRecord} */ (
                    record._toProtobuf().transactionRecord
                ),
        );

        return {
            duplicateTransactionRecords: duplicates,
            childTransactionRecords: children,
            transactionRecord: {
                receipt: this.receipt._toProtobuf().receipt,

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
                memo:
                    this.transactionMemo != null ? this.transactionMemo : null,

                transactionFee:
                    this.transactionFee != null
                        ? this.transactionFee.toTinybars()
                        : null,

                contractCallResult:
                    this.contractFunctionResult != null &&
                    !this.contractFunctionResult._createResult
                        ? this.contractFunctionResult._toProtobuf()
                        : null,

                contractCreateResult:
                    this.contractFunctionResult != null &&
                    this.contractFunctionResult._createResult
                        ? this.contractFunctionResult._toProtobuf()
                        : null,

                transferList:
                    this.transfers != null
                        ? {
                              accountAmounts: this.transfers.map((transfer) =>
                                  transfer._toProtobuf(),
                              ),
                          }
                        : null,
                tokenTransferLists,
                scheduleRef:
                    this.scheduleRef != null
                        ? this.scheduleRef._toProtobuf()
                        : null,
                assessedCustomFees: this.assessedCustomFees.map((fee) =>
                    fee._toProtobuf(),
                ),
                automaticTokenAssociations: this.automaticTokenAssociations.map(
                    (association) => association._toProtobuf(),
                ),
                parentConsensusTimestamp:
                    this.parentConsensusTimestamp != null
                        ? this.parentConsensusTimestamp._toProtobuf()
                        : null,
                alias:
                    this.aliasKey != null
                        ? HieroProto.proto.Key.encode(
                              this.aliasKey._toProtobufKey(),
                          ).finish()
                        : null,
                ethereumHash: this.ethereumHash,

                paidStakingRewards: this.paidStakingRewards.map((transfer) =>
                    transfer._toProtobuf(),
                ),

                prngBytes: this.prngBytes,
                prngNumber: this.prngNumber != null ? this.prngNumber : null,
                evmAddress:
                    this.evmAddress != null ? this.evmAddress.toBytes() : null,
                newPendingAirdrops: this.newPendingAirdrops.map((airdrop) =>
                    airdrop.toBytes(),
                ),
            },
        };
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransactionGetRecordResponse} response
     * @returns {TransactionRecord}
     */
    static _fromProtobuf(response) {
        const record = /** @type {HieroProto.proto.ITransactionRecord} */ (
            response.transactionRecord
        );

        let aliasKey =
            record.alias != null && record.alias.length > 0
                ? Key._fromProtobufKey(
                      HieroProto.proto.Key.decode(record.alias),
                  )
                : null;

        if (!(aliasKey instanceof PublicKey)) {
            aliasKey = null;
        }

        const children =
            response.childTransactionRecords != null
                ? response.childTransactionRecords.map((child) =>
                      TransactionRecord._fromProtobuf({
                          transactionRecord: child,
                      }),
                  )
                : [];

        const duplicates =
            response.duplicateTransactionRecords != null
                ? response.duplicateTransactionRecords.map((duplicate) =>
                      TransactionRecord._fromProtobuf({
                          transactionRecord: duplicate,
                      }),
                  )
                : [];

        const contractFunctionResult =
            record.contractCallResult != null
                ? ContractFunctionResult._fromProtobuf(
                      record.contractCallResult,
                      false,
                  )
                : record.contractCreateResult != null
                ? ContractFunctionResult._fromProtobuf(
                      record.contractCreateResult,
                      true,
                  )
                : undefined;

        const newPendingAirdrops =
            record.newPendingAirdrops != null
                ? record.newPendingAirdrops.map((airdrop) =>
                      PendingAirdropRecord.fromBytes(airdrop),
                  )
                : [];

        return new TransactionRecord({
            receipt: TransactionReceipt._fromProtobuf({
                receipt: /** @type {HieroProto.proto.ITransactionReceipt} */ (
                    record.receipt
                ),
            }),
            transactionHash:
                record.transactionHash != null
                    ? record.transactionHash
                    : new Uint8Array(),
            consensusTimestamp: Timestamp._fromProtobuf(
                /** @type {HieroProto.proto.ITimestamp} */
                (record.consensusTimestamp),
            ),
            transactionId: TransactionId._fromProtobuf(
                /** @type {HieroProto.proto.ITransactionID} */ (
                    record.transactionID
                ),
            ),
            transactionMemo: record.memo != null ? record.memo : "",
            transactionFee: Hbar.fromTinybars(
                record.transactionFee != null ? record.transactionFee : 0,
            ),
            transfers: Transfer._fromProtobuf(
                record.transferList != null
                    ? record.transferList.accountAmounts != null
                        ? record.transferList.accountAmounts
                        : []
                    : [],
            ),
            contractFunctionResult,
            tokenTransfers: TokenTransferMap._fromProtobuf(
                record.tokenTransferLists != null
                    ? record.tokenTransferLists
                    : [],
            ),
            tokenTransfersList: TokenTransfer._fromProtobuf(
                record.tokenTransferLists != null
                    ? record.tokenTransferLists
                    : [],
            ),
            scheduleRef:
                record.scheduleRef != null
                    ? ScheduleId._fromProtobuf(record.scheduleRef)
                    : null,
            assessedCustomFees:
                record.assessedCustomFees != null
                    ? record.assessedCustomFees.map((fee) =>
                          AssessedCustomFee._fromProtobuf(fee),
                      )
                    : [],
            nftTransfers: TokenNftTransferMap._fromProtobuf(
                record.tokenTransferLists != null
                    ? record.tokenTransferLists
                    : [],
            ),
            automaticTokenAssociations:
                record.automaticTokenAssociations != null
                    ? record.automaticTokenAssociations.map((association) =>
                          TokenAssocation._fromProtobuf(association),
                      )
                    : [],
            parentConsensusTimestamp:
                record.parentConsensusTimestamp != null
                    ? Timestamp._fromProtobuf(record.parentConsensusTimestamp)
                    : null,
            aliasKey,
            duplicates,
            children,
            hbarAllowanceAdjustments: [],
            tokenAllowanceAdjustments: [],
            nftAllowanceAdjustments: [],
            ethereumHash:
                record.ethereumHash != null ? record.ethereumHash : null,
            paidStakingRewards:
                record.paidStakingRewards != null
                    ? Transfer._fromProtobuf(record.paidStakingRewards)
                    : [],
            prngBytes: record.prngBytes != null ? record.prngBytes : null,
            prngNumber: record.prngNumber != null ? record.prngNumber : null,
            evmAddress:
                record.evmAddress != null
                    ? EvmAddress.fromBytes(record.evmAddress)
                    : null,
            newPendingAirdrops: newPendingAirdrops,
        });
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {TransactionRecord}
     */
    static fromBytes(bytes) {
        return TransactionRecord._fromProtobuf(
            HieroProto.proto.TransactionGetRecordResponse.decode(bytes),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.TransactionGetRecordResponse.encode(
            this._toProtobuf(),
        ).finish();
    }

    /**
     * @returns {TransactionRecordJSON}
     */
    toJSON() {
        return {
            receipt: this.receipt.toJSON(),
            transactionHash: hex.encode(this.transactionHash),
            consensusTimestamp: this.consensusTimestamp.toDate(),
            transactionId: this.transactionId.toString(),
            transactionMemo: this.transactionMemo,
            transactionFee: this.transactionFee.toTinybars().toString(),
            transfers: this.transfers.map((transfer) => transfer.toJSON()),
            tokenTransfers: this.tokenTransfers,
            tokenTransfersList: this.tokenTransfersList.map((transfer) =>
                transfer.toJSON(),
            ),
            scheduleRef: this.scheduleRef?.toString() || null,
            assessedCustomFees: this.assessedCustomFees,
            nftTransfers: this.nftTransfers,
            automaticTokenAssociations: this.automaticTokenAssociations,
            parentConsensusTimestamp:
                this.parentConsensusTimestamp?.toDate() || null,
            aliasKey: this.aliasKey?.toString() || null,
            duplicates: this.duplicates,
            children: this.children,
            ethereumHash:
                this.ethereumHash != null
                    ? hex.encode(this.ethereumHash)
                    : null,
            paidStakingRewards: this.paidStakingRewards,
            prngBytes:
                this.prngBytes != null ? hex.encode(this.prngBytes) : null,
            prngNumber: this.prngNumber,
            evmAddress: this.evmAddress?.toString() || null,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
