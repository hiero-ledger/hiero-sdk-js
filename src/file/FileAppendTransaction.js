// SPDX-License-Identifier: Apache-2.0

import Hbar from "../Hbar.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import * as utf8 from "../encoding/utf8.js";
import FileId from "./FileId.js";
import TransactionId from "../transaction/TransactionId.js";
import Timestamp from "../Timestamp.js";
import List from "../transaction/List.js";
import AccountId from "../account/AccountId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IFileAppendTransactionBody} HieroProto.proto.IFileAppendTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IFileID} HieroProto.proto.IFileID
 */

/**
 * @typedef {import("../PublicKey.js").default} PublicKey
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<Channel, *>} Client
 * @typedef {import("../transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("../schedule/ScheduleCreateTransaction.js").default} ScheduleCreateTransaction
 */

/**
 * A transaction specifically to append data to a file on the network.
 *
 * If a file has multiple keys, all keys must sign to modify its contents.
 */
export default class FileAppendTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {FileId | string} [props.fileId]
     * @param {Uint8Array | string} [props.contents]
     * @param {number} [props.maxChunks]
     * @param {number} [props.chunkSize]
     * @param {number} [props.chunkInterval]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?FileId}
         */
        this._fileId = null;

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._contents = null;

        /**
         * @private
         * @type {number}
         */
        this._maxChunks = 20;

        /**
         * @private
         * @type {number}
         */
        this._chunkSize = 4096;

        /**
         * @private
         * @type {number}
         */
        this._chunkInterval = 10;

        this._defaultMaxTransactionFee = new Hbar(5);

        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }

        if (props.contents != null) {
            this.setContents(props.contents);
        }

        if (props.maxChunks != null) {
            this.setMaxChunks(props.maxChunks);
        }

        if (props.chunkSize != null) {
            this.setChunkSize(props.chunkSize);
        }

        if (props.chunkInterval != null) {
            this.setChunkInterval(props.chunkInterval);
        }

        /** @type {List<TransactionId>} */
        this._transactionIds = new List();
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {FileAppendTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const append =
            /** @type {HieroProto.proto.IFileAppendTransactionBody} */ (
                body.fileAppend
            );

        let contents;

        // The increment value depends on whether the node IDs list is empty or not.
        // The node IDs list is not empty if the transaction has been frozen
        // before serialization and deserialization, otherwise, it's empty.
        const incrementValue = nodeIds.length > 0 ? nodeIds.length : 1;

        for (let i = 0; i < bodies.length; i += incrementValue) {
            const fileAppend =
                /** @type {HieroProto.proto.IFileAppendTransactionBody} */ (
                    bodies[i].fileAppend
                );
            if (fileAppend.contents == null) {
                break;
            }

            if (contents == null) {
                contents = new Uint8Array(
                    /** @type {Uint8Array} */ (fileAppend.contents),
                );
                continue;
            }

            /** @type {Uint8Array} */
            const concat = new Uint8Array(
                contents.length +
                    /** @type {Uint8Array} */ (fileAppend.contents).length,
            );
            concat.set(contents, 0);
            concat.set(
                /** @type {Uint8Array} */ (fileAppend.contents),
                contents.length,
            );
            contents = concat;
        }
        const chunkSize = append.contents?.length || undefined;
        const maxChunks = bodies.length
            ? bodies.length / incrementValue
            : undefined;
        let chunkInterval;
        if (transactionIds.length > 1) {
            const firstValidStart = transactionIds[0].validStart;
            const secondValidStart = transactionIds[1].validStart;
            if (firstValidStart && secondValidStart) {
                chunkInterval = secondValidStart.nanos
                    .sub(firstValidStart.nanos)
                    .toNumber();
            }
        }

        return Transaction._fromProtobufTransactions(
            new FileAppendTransaction({
                fileId:
                    append.fileID != null
                        ? FileId._fromProtobuf(
                              /** @type {HieroProto.proto.IFileID} */ (
                                  append.fileID
                              ),
                          )
                        : undefined,
                contents,
                chunkSize,
                maxChunks,
                chunkInterval,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {?FileId}
     */
    get fileId() {
        return this._fileId;
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
     * @param {FileId | string} fileId
     * @returns {this}
     */
    setFileId(fileId) {
        this._requireNotFrozen();
        this._fileId =
            typeof fileId === "string"
                ? FileId.fromString(fileId)
                : fileId.clone();

        return this;
    }

    /**
     * @override
     * @returns {number}
     */
    getRequiredChunks() {
        if (this._contents == null) {
            return 1;
        }

        const result = Math.ceil(this._contents.length / this._chunkSize);

        return result;
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
     * This may be omitted to append an empty file.
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
     * @returns {?number}
     */
    get maxChunks() {
        return this._maxChunks;
    }

    /**
     * @param {number} maxChunks
     * @returns {this}
     */
    setMaxChunks(maxChunks) {
        if (maxChunks <= 0) {
            throw new Error("Max chunks must be greater than 0");
        }
        this._requireNotFrozen();
        this._maxChunks = maxChunks;
        return this;
    }

    /**
     * @returns {?number}
     */
    get chunkSize() {
        return this._chunkSize;
    }

    /**
     * @param {number} chunkSize
     * @returns {this}
     */
    setChunkSize(chunkSize) {
        if (chunkSize <= 0) {
            throw new Error("Chunk size must be greater than 0");
        }
        this._chunkSize = chunkSize;
        return this;
    }

    /**
     * @returns {number}
     */
    get chunkInterval() {
        return this._chunkInterval;
    }

    /**
     * @param {number} chunkInterval The valid start interval between chunks in nanoseconds
     * @returns {this}
     */
    setChunkInterval(chunkInterval) {
        this._chunkInterval = chunkInterval;
        return this;
    }

    /**
     * Freeze this transaction from further modification to prepare for
     * signing or serialization.
     *
     * Will use the `Client`, if available, to generate a default Transaction ID and select 1/3
     * nodes to prepare this transaction for.
     *
     * @param {?import("../client/Client.js").default<Channel, *>} client
     * @returns {this}
     */
    freezeWith(client) {
        super.freezeWith(client);

        if (this._contents == null) {
            return this;
        }

        let nextTransactionId = this._getTransactionId();

        // Hack around the locked list. Should refactor a bit to remove such code
        this._transactionIds.locked = false;

        this._transactions.clear();
        this._transactionIds.clear();
        this._signedTransactions.clear();

        for (let chunk = 0; chunk < this.getRequiredChunks(); chunk++) {
            this._transactionIds.push(nextTransactionId);
            this._transactionIds.advance();

            for (const nodeAccountId of this._nodeAccountIds.list) {
                this._signedTransactions.push(
                    this._makeSignedTransaction(nodeAccountId),
                );
            }

            nextTransactionId = new TransactionId(
                /** @type {AccountId} */ (nextTransactionId.accountId),
                new Timestamp(
                    /** @type {Timestamp} */ (
                        nextTransactionId.validStart
                    ).seconds,
                    /** @type {Timestamp} */ (
                        nextTransactionId.validStart
                    ).nanos.add(this._chunkInterval),
                ),
            );
        }

        this._transactionIds.advance();
        this._transactionIds.setLocked();

        return this;
    }

    /**
     * @returns {ScheduleCreateTransaction}
     */
    schedule() {
        this._requireNotFrozen();

        if (this._contents != null && this._contents.length > this._chunkSize) {
            throw new Error(
                `cannot schedule \`FileAppendTransaction\` with message over ${this._chunkSize} bytes`,
            );
        }

        return super.schedule();
    }

    /**
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @param {number=} requestTimeout
     * @returns {Promise<TransactionResponse>}
     */
    async execute(client, requestTimeout) {
        return (await this.executeAll(client, requestTimeout))[0];
    }

    /**
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @param {number=} requestTimeout
     * @returns {Promise<TransactionResponse[]>}
     */
    async executeAll(client, requestTimeout) {
        if (this.maxChunks && this.getRequiredChunks() > this.maxChunks) {
            throw new Error(
                `cannot execute \`FileAppendTransaction\` with more than ${this.maxChunks} chunks`,
            );
        }

        if (!super._isFrozen()) {
            this.freezeWith(client);
        }

        // on execute, sign each transaction with the operator, if present
        // and we are signing a transaction that used the default transaction ID

        const transactionId = this._getTransactionId();
        const operatorAccountId = client.operatorAccountId;

        if (
            operatorAccountId != null &&
            operatorAccountId.equals(
                /** @type {AccountId} */ (transactionId.accountId),
            )
        ) {
            await super.signWithOperator(client);
        }

        const responses = [];
        let remainingTimeout = requestTimeout;

        for (let i = 0; i < this._transactionIds.length; i++) {
            const startTimestamp = Date.now();
            const response = await super.execute(client, remainingTimeout);

            if (remainingTimeout != null) {
                remainingTimeout = Date.now() - startTimestamp;
            }

            await response.getReceipt(client);
            responses.push(response);
        }

        return responses;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._fileId != null) {
            this._fileId.validateChecksum(client);
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
        return channel.file.appendContent(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "fileAppend";
    }

    /**
     * Build all the transactions
     * when transactions are not complete.
     * @override
     * @internal
     */
    _buildIncompleteTransactions() {
        const dummyAccountId = AccountId.fromString("0.0.0");
        const accountId = this.transactionId?.accountId || dummyAccountId;
        const validStart =
            this.transactionId?.validStart || Timestamp.fromDate(new Date());

        if (this.maxChunks && this.getRequiredChunks() > this.maxChunks) {
            throw new Error(
                `cannot build \`FileAppendTransaction\` with more than ${this.maxChunks} chunks`,
            );
        }

        // Hack around the locked list. Should refactor a bit to remove such code
        this._transactionIds.locked = false;

        this._transactions.clear();
        this._transactionIds.clear();
        this._signedTransactions.clear();

        for (let chunk = 0; chunk < this.getRequiredChunks(); chunk++) {
            let nextTransactionId = TransactionId.withValidStart(
                accountId,
                validStart.plusNanos(this._chunkInterval * chunk),
            );
            this._transactionIds.push(nextTransactionId);
            this._transactionIds.advance();

            if (this._nodeAccountIds.list.length === 0) {
                this._transactions.push(this._makeSignedTransaction(null));
            } else {
                for (const nodeAccountId of this._nodeAccountIds.list) {
                    this._transactions.push(
                        this._makeSignedTransaction(nodeAccountId),
                    );
                }
            }
        }

        this._transactionIds.advance();
        this._transactionIds.setLocked();
    }

    /**
     * Build all the signed transactions
     * @override
     * @internal
     */
    _buildAllTransactions() {
        if (this.maxChunks && this.getRequiredChunks() > this.maxChunks) {
            throw new Error(
                `cannot build \`FileAppendTransaction\` with more than ${this.maxChunks} chunks`,
            );
        }
        for (let i = 0; i < this._signedTransactions.length; i++) {
            this._buildTransaction(i);
        }
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `FileAppendTransaction:${timestamp.toString()}`;
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IFileAppendTransactionBody}
     */
    _makeTransactionData() {
        const length = this._contents != null ? this._contents.length : 0;
        const startIndex = this._transactionIds.index * this._chunkSize;
        const endIndex = Math.min(startIndex + this._chunkSize, length);

        return {
            fileID: this._fileId != null ? this._fileId._toProtobuf() : null,
            contents:
                this._contents != null
                    ? this._contents.slice(startIndex, endIndex)
                    : null,
        };
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
TRANSACTION_REGISTRY.set("fileAppend", FileAppendTransaction._fromProtobuf);
