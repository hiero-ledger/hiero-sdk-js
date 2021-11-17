import Hbar from "../Hbar.js";
import Transaction, {
    TRANSACTION_REGISTRY,
    CHUNK_SIZE,
} from "../transaction/Transaction.js";
import * as utf8 from "../encoding/utf8.js";
import FileId from "./FileId.js";
import TransactionId from "../transaction/TransactionId.js";
import Timestamp from "../Timestamp.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IFileAppendTransactionBody} proto.IFileAppendTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IFileID} proto.IFileID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
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

        this.setMaxTransactionFee(new Hbar(5));

        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }

        if (props.contents != null) {
            this.setContents(props.contents);
        }

        if (props.maxChunks != null) {
            this.setMaxChunks(props.maxChunks);
        }

        /** @type {number} */
        this._startIndex = 0;

        /** @type {TransactionId[]} */
        this._transactionIds = [];
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {FileAppendTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const append = /** @type {proto.IFileAppendTransactionBody} */ (
            body.fileAppend
        );

        let contents;
        for (let i = 0; i < bodies.length; i += nodeIds.length) {
            const fileAppend = /** @type {proto.IFileAppendTransactionBody} */ (
                bodies[i].fileAppend
            );
            if (fileAppend.contents == null) {
                break;
            }

            if (contents == null) {
                contents = new Uint8Array(
                    /** @type {Uint8Array} */ (fileAppend.contents)
                );
                continue;
            }

            /** @type {Uint8Array} */
            const concat = new Uint8Array(
                contents.length +
                    /** @type {Uint8Array} */ (fileAppend.contents).length
            );
            concat.set(contents, 0);
            concat.set(
                /** @type {Uint8Array} */ (fileAppend.contents),
                contents.length
            );
            contents = concat;
        }

        return Transaction._fromProtobufTransactions(
            new FileAppendTransaction({
                fileId:
                    append.fileID != null
                        ? FileId._fromProtobuf(
                              /** @type {proto.IFileID} */ (append.fileID)
                          )
                        : undefined,
                contents: contents,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @param {TransactionId} transactionId
     * @returns {this}
     */
    setTransactionId(transactionId) {
        this._requireNotFrozen();

        if (
            transactionId.accountId == null ||
            transactionId.validStart == null
        ) {
            throw new Error(
                "`FileAppendTransaction` does not support `TransactionId` built from `nonce`"
            );
        }

        this._transactionIds = [transactionId];

        return this;
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
        this._requireNotFrozen();
        this._maxChunks = maxChunks;
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

        const chunks = Math.floor(
            (this._contents.length + (CHUNK_SIZE - 1)) / CHUNK_SIZE
        );

        if (chunks > this._maxChunks) {
            throw new Error(
                `Contents with size ${this._contents.length} too long for ${this._maxChunks} chunks`
            );
        }

        let nextTransactionId = this.transactionId;

        super._transactions = [];
        super._transactionIds = [];
        super._signedTransactions = [];
        super._nextTransactionIndex = 0;

        for (let chunk = 0; chunk < chunks; chunk++) {
            this._startIndex = chunk * CHUNK_SIZE;

            this._transactionIds.push(nextTransactionId);

            for (const nodeAccountId of this._nodeIds) {
                this._signedTransactions.push(
                    this._makeSignedTransaction(nodeAccountId)
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
                    ).nanos.add(1)
                )
            );

            super._nextTransactionIndex = this._nextTransactionIndex + 1;
        }

        this._startIndex = 0;
        super._nextTransactionIndex = 0;

        return this;
    }

    /**
     * @returns {ScheduleCreateTransaction}
     */
    schedule() {
        this._requireNotFrozen();

        if (this._contents != null && this._contents.length > CHUNK_SIZE) {
            throw new Error(
                `cannot scheduled \`FileAppendTransaction\` with message over ${CHUNK_SIZE} bytes`
            );
        }

        return super.schedule();
    }

    /**
     * @param {import("../client/Client.js").default<*, *>} client
     * @returns {Promise<TransactionResponse>}
     */
    async execute(client) {
        return (await this.executeAll(client))[0];
    }

    /**
     * @param {import("../client/Client.js").default<*, *>} client
     * @returns {Promise<TransactionResponse[]>}
     */
    async executeAll(client) {
        if (!super._isFrozen()) {
            this.freezeWith(client);
        }

        // on execute, sign each transaction with the operator, if present
        // and we are signing a transaction that used the default transaction ID

        const transactionId = this.transactionId;
        const operatorAccountId = client.operatorAccountId;

        if (
            operatorAccountId != null &&
            operatorAccountId.equals(
                /** @type {AccountId} */ (transactionId.accountId)
            )
        ) {
            await super.signWithOperator(client);
        }

        const responses = [];
        for (let i = 0; i < this._transactionIds.length; i++) {
            const response = await super.execute(client);
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
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.file.appendContent(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "fileAppend";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IFileAppendTransactionBody}
     */
    _makeTransactionData() {
        const length = this._contents != null ? this._contents.length : 0;
        let endIndex = this._startIndex + CHUNK_SIZE;
        if (endIndex > length) {
            endIndex = length;
        }

        return {
            fileID: this._fileId != null ? this._fileId._toProtobuf() : null,
            contents:
                this._contents != null
                    ? this._contents.slice(this._startIndex, endIndex)
                    : null,
        };
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
TRANSACTION_REGISTRY.set("fileAppend", FileAppendTransaction._fromProtobuf);
