// SPDX-License-Identifier: Apache-2.0

import Hbar from "../Hbar.js";
import Transaction, {
    TRANSACTION_REGISTRY,
    DEFAULT_AUTO_RENEW_PERIOD,
} from "../transaction/Transaction.js";
import * as utf8 from "../encoding/utf8.js";
import Timestamp from "../Timestamp.js";
import Key from "../Key.js";
import KeyList from "../KeyList.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IFileCreateTransactionBody} HieroProto.proto.IFileCreateTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Create a new Hedera™ crypto-currency file.
 */
export default class FileCreateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Key[] | KeyList} [props.keys]
     * @param {Timestamp | Date} [props.expirationTime]
     * @param {Uint8Array | string} [props.contents]
     * @param {string} [props.fileMemo]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Key[]}
         */
        this._keys = null;

        /**
         * @private
         * @type {Timestamp}
         */
        this._expirationTime = new Timestamp(0, 0).plusNanos(
            Long.fromNumber(Date.now())
                .mul(1000000)
                .add(DEFAULT_AUTO_RENEW_PERIOD.mul(1000000000)),
        );

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._contents = null;

        /**
         * @private
         * @type {?string}
         */
        this._fileMemo = null;

        this._defaultMaxTransactionFee = new Hbar(5);

        if (props.keys != null) {
            this.setKeys(props.keys);
        }

        if (props.expirationTime != null) {
            this.setExpirationTime(props.expirationTime);
        }

        if (props.contents != null) {
            this.setContents(props.contents);
        }

        if (props.fileMemo && props.fileMemo != null) {
            this.setFileMemo(props.fileMemo);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {FileCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const create =
            /** @type {HieroProto.proto.IFileCreateTransactionBody} */ (
                body.fileCreate
            );

        return Transaction._fromProtobufTransactions(
            new FileCreateTransaction({
                keys:
                    create.keys != null
                        ? create.keys.keys != null
                            ? create.keys.keys.map((key) =>
                                  Key._fromProtobufKey(key),
                              )
                            : undefined
                        : undefined,
                expirationTime:
                    create.expirationTime != null
                        ? Timestamp._fromProtobuf(create.expirationTime)
                        : undefined,
                contents: create.contents != null ? create.contents : undefined,
                fileMemo: create.memo != null ? create.memo : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {?Key[]}
     */
    get keys() {
        return this._keys;
    }

    /**
     * Set the keys which must sign any transactions modifying this file. Required.
     *
     * All keys must sign to modify the file's contents or keys. No key is required
     * to sign for extending the expiration time (except the one for the operator account
     * paying for the transaction). Only one key must sign to delete the file, however.
     *
     * To require more than one key to sign to delete a file, add them to a
     * KeyList and pass that here.
     *
     * The network currently requires a file to have at least one key (or key list or threshold key)
     * but this requirement may be lifted in the future.
     *
     * @param {Key[] | KeyList} keys
     * @returns {this}
     */
    setKeys(keys) {
        this._requireNotFrozen();
        if (keys instanceof KeyList && keys.threshold != null) {
            throw new Error("Cannot set threshold key as file key");
        }

        this._keys = keys instanceof KeyList ? keys.toArray() : keys;

        return this;
    }

    /**
     * @returns {Timestamp}
     */
    get expirationTime() {
        return this._expirationTime;
    }

    /**
     * Set the instant at which this file will expire, after which its contents will no longer be
     * available.
     *
     * Defaults to 1/4 of a Julian year from the instant FileCreateTransaction
     * was invoked.
     *
     * May be extended using FileUpdateTransaction#setExpirationTime(Timestamp).
     *
     * @param {Timestamp | Date} expirationTime
     * @returns {this}
     */
    setExpirationTime(expirationTime) {
        this._requireNotFrozen();
        this._expirationTime =
            expirationTime instanceof Timestamp
                ? expirationTime
                : Timestamp.fromDate(expirationTime);

        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get contents() {
        return this._contents;
    }

    /**
     * Set the given byte array as the file's contents.
     *
     * This may be omitted to create an empty file.
     *
     * Note that total size for a given transaction is limited to 6KiB (as of March 2020) by the
     * network; if you exceed this you may receive a HederaPreCheckStatusException
     * with Status#TransactionOversize.
     *
     * In this case, you will need to break the data into chunks of less than ~6KiB and execute this
     * transaction with the first chunk and then use FileAppendTransaction with
     * FileAppendTransaction#setContents(Uint8Array) for the remaining chunks.
     *
     * @param {Uint8Array | string} contents
     * @returns {this}
     */
    setContents(contents) {
        this._requireNotFrozen();
        this._contents =
            contents instanceof Uint8Array ? contents : utf8.encode(contents);

        return this;
    }

    /**
     * @returns {?string}
     */
    get fileMemo() {
        return this._fileMemo;
    }

    /**
     * @param {string} memo
     * @returns {this}
     */
    setFileMemo(memo) {
        this._requireNotFrozen();
        this._fileMemo = memo;

        return this;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.file.createFile(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "fileCreate";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IFileCreateTransactionBody}
     */
    _makeTransactionData() {
        return {
            keys:
                this._keys != null
                    ? {
                          keys: this._keys.map((key) => key._toProtobufKey()),
                      }
                    : null,
            expirationTime: this._expirationTime._toProtobuf(),
            contents: this._contents,
            memo: this._fileMemo,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `FileCreateTransaction:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
TRANSACTION_REGISTRY.set("fileCreate", FileCreateTransaction._fromProtobuf);
