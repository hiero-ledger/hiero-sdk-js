// SPDX-License-Identifier: Apache-2.0

import ScheduleId from "./ScheduleId.js";
import AccountId from "../account/AccountId.js";
import Timestamp from "../Timestamp.js";
import Transaction from "../transaction/Transaction.js";
import * as HieroProto from "@hashgraph/proto";
import TransactionId from "../transaction/TransactionId.js";
import Key from "../Key.js";
import KeyList from "../KeyList.js";

const { proto } = HieroProto;

/**
 * Response when the client sends the node ScheduleGetInfoQuery.
 */
export default class ScheduleInfo {
    /**
     * @private
     * @param {object} props
     * @param {ScheduleId} props.scheduleId;
     * @param {?AccountId} props.creatorAccountID;
     * @param {?AccountId} props.payerAccountID;
     * @param {?HieroProto.proto.ISchedulableTransactionBody} props.schedulableTransactionBody;
     * @param {?Key} props.adminKey
     * @param {?KeyList} props.signers;
     * @param {?string} props.scheduleMemo;
     * @param {?Timestamp} props.expirationTime;
     * @param {?Timestamp} props.executed;
     * @param {?Timestamp} props.deleted;
     * @param {?TransactionId} props.scheduledTransactionId;
     * @param {boolean} props.waitForExpiry;
     */
    constructor(props) {
        /**
         * @readonly
         */
        this.scheduleId = props.scheduleId;

        /**
         * @readonly
         */
        this.creatorAccountId = props.creatorAccountID;

        /**
         * @readonly
         */
        this.payerAccountId = props.payerAccountID;

        /**
         * @readonly
         */
        this.schedulableTransactionBody = props.schedulableTransactionBody;

        /**
         * @readonly
         */
        this.signers = props.signers;

        /**
         * @readonly
         */
        this.scheduleMemo = props.scheduleMemo;

        /**
         * @readonly
         */
        this.adminKey = props.adminKey != null ? props.adminKey : null;

        /**
         * @readonly
         */
        this.expirationTime = props.expirationTime;

        /**
         * @readonly
         */
        this.executed = props.executed;

        /**
         * @readonly
         */
        this.deleted = props.deleted;

        /**
         * @readonly
         */
        this.scheduledTransactionId = props.scheduledTransactionId;

        /**
         *
         * @readonly
         */
        this.waitForExpiry = props.waitForExpiry;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.IScheduleInfo} info
     * @returns {ScheduleInfo}
     */
    static _fromProtobuf(info) {
        return new ScheduleInfo({
            scheduleId: ScheduleId._fromProtobuf(
                /** @type {HieroProto.proto.IScheduleID} */ (info.scheduleID),
            ),
            creatorAccountID:
                info.creatorAccountID != null
                    ? AccountId._fromProtobuf(
                          /** @type {HieroProto.proto.IAccountID} */ (
                              info.creatorAccountID
                          ),
                      )
                    : null,
            payerAccountID:
                info.payerAccountID != null
                    ? AccountId._fromProtobuf(
                          /** @type {HieroProto.proto.IAccountID} */ (
                              info.payerAccountID
                          ),
                      )
                    : null,
            schedulableTransactionBody:
                info.scheduledTransactionBody != null
                    ? info.scheduledTransactionBody
                    : null,
            adminKey:
                info.adminKey != null
                    ? Key._fromProtobufKey(info.adminKey)
                    : null,
            signers:
                info.signers != null
                    ? KeyList.__fromProtobufKeyList(info.signers)
                    : null,
            scheduleMemo: info.memo != null ? info.memo : null,
            expirationTime:
                info.expirationTime != null
                    ? Timestamp._fromProtobuf(
                          /** @type {HieroProto.proto.ITimestamp} */ (
                              info.expirationTime
                          ),
                      )
                    : null,
            executed:
                info.executionTime != null
                    ? Timestamp._fromProtobuf(
                          /** @type {HieroProto.proto.ITimestamp} */ (
                              info.executionTime
                          ),
                      )
                    : null,
            deleted:
                info.deletionTime != null
                    ? Timestamp._fromProtobuf(
                          /** @type {HieroProto.proto.ITimestamp} */ (
                              info.deletionTime
                          ),
                      )
                    : null,
            scheduledTransactionId:
                info.scheduledTransactionID != null
                    ? TransactionId._fromProtobuf(info.scheduledTransactionID)
                    : null,
            waitForExpiry:
                info.waitForExpiry != null ? info.waitForExpiry : false,
        });
    }

    /**
     * @returns {HieroProto.proto.IScheduleInfo}
     */
    _toProtobuf() {
        return {
            scheduleID:
                this.scheduleId != null ? this.scheduleId._toProtobuf() : null,
            creatorAccountID:
                this.creatorAccountId != null
                    ? this.creatorAccountId._toProtobuf()
                    : null,
            payerAccountID:
                this.payerAccountId != null
                    ? this.payerAccountId._toProtobuf()
                    : null,
            scheduledTransactionBody:
                this.schedulableTransactionBody != null
                    ? this.schedulableTransactionBody
                    : null,
            adminKey:
                this.adminKey != null ? this.adminKey._toProtobufKey() : null,
            signers:
                this.signers != null
                    ? this.signers._toProtobufKey().keyList
                    : null,
            memo: this.scheduleMemo != null ? this.scheduleMemo : "",
            expirationTime:
                this.expirationTime != null
                    ? this.expirationTime._toProtobuf()
                    : null,
            scheduledTransactionID:
                this.scheduledTransactionId != null
                    ? this.scheduledTransactionId._toProtobuf()
                    : null,
            waitForExpiry: this.waitForExpiry,
        };
    }

    /**
     * @returns {Transaction}
     */
    get scheduledTransaction() {
        if (this.schedulableTransactionBody == null) {
            throw new Error("Scheduled transaction body is empty");
        }

        const scheduled = new proto.SchedulableTransactionBody(
            this.schedulableTransactionBody,
        );
        const data =
            /** @type {NonNullable<HieroProto.proto.SchedulableTransactionBody["data"]>} */ (
                scheduled.data
            );

        return Transaction.fromBytes(
            proto.TransactionList.encode({
                transactionList: [
                    {
                        signedTransactionBytes: proto.SignedTransaction.encode({
                            bodyBytes: proto.TransactionBody.encode({
                                transactionFee:
                                    this.schedulableTransactionBody
                                        .transactionFee,
                                memo: this.schedulableTransactionBody.memo,
                                [data]: scheduled[data],
                            }).finish(),
                        }).finish(),
                    },
                ],
            }).finish(),
        );
    }
}
