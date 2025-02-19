/*-
 * ‌
 * Hedera JavaScript SDK
 * ​
 * Copyright (C) 2020 - 2023 Hedera Hashgraph, LLC
 * ​
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ‍
 */

import Hbar from "../Hbar.js";
import TransactionResponse from "./TransactionResponse.js";
import TransactionId from "./TransactionId.js";
import TransactionHashMap from "./TransactionHashMap.js";
import SignatureMap from "./SignatureMap.js";
import Executable, { ExecutionState } from "../Executable.js";
import Status from "../Status.js";
import Long from "long";
import * as sha384 from "../cryptography/sha384.js";
import * as hex from "../encoding/hex.js";
import * as HashgraphProto from "@hashgraph/proto";
import PrecheckStatusError from "../PrecheckStatusError.js";
import AccountId from "../account/AccountId.js";
import PublicKey from "../PublicKey.js";
import List from "./List.js";
import Timestamp from "../Timestamp.js";
import * as util from "../util.js";
import CustomFeeLimit from "./CustomFeeLimit.js";

/**
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * @typedef {import("../schedule/ScheduleCreateTransaction.js").default} ScheduleCreateTransaction
 * @typedef {import("../PrivateKey.js").default} PrivateKey
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Signer.js").Signer} Signer
 */

// 90 days (in seconds)
export const DEFAULT_AUTO_RENEW_PERIOD = Long.fromValue(7776000);

// maximum value of i64 (so there is never a record generated)
export const DEFAULT_RECORD_THRESHOLD = Hbar.fromTinybars(
    Long.fromString("9223372036854775807"),
);

// 120 seconds
const DEFAULT_TRANSACTION_VALID_DURATION = 120;

// The default message chunk size in bytes when splitting a given message.
// This value can be overriden using `setChunkSize` when preparing to submit a messsage via `TopicMessageSubmitTransaction`.
export const CHUNK_SIZE = 1024;

/**
 * @type {Map<NonNullable<HashgraphProto.proto.TransactionBody["data"]>, (transactions: HashgraphProto.proto.ITransaction[], signedTransactions: HashgraphProto.proto.ISignedTransaction[], transactionIds: TransactionId[], nodeIds: AccountId[], bodies: HashgraphProto.proto.TransactionBody[]) => Transaction>}
 */
export const TRANSACTION_REGISTRY = new Map();

/**
 * Base class for all transactions that may be submitted to Hedera.
 *
 * @abstract
 * @augments {Executable<HashgraphProto.proto.ITransaction, HashgraphProto.proto.ITransactionResponse, TransactionResponse>}
 */
export default class Transaction extends Executable {
    // A SDK transaction is composed of multiple, raw protobuf transactions.
    // These should be functionally identical, with the exception of pointing to
    // different nodes.

    // When retrying a transaction after a network error or retry-able
    // status response, we try a different transaction and thus a different node.

    constructor() {
        super();

        /**
         * List of proto transactions that have been built from this SDK
         * transaction.
         *
         * This is a 2-D array built into one, meaning to
         * get to the next row you'd index into this array `row * rowLength + column`
         * where `rowLength` is `nodeAccountIds.length`
         *
         * @internal
         * @type {List<HashgraphProto.proto.ITransaction | null>}
         */
        this._transactions = new List();

        /**
         * List of proto transactions that have been built from this SDK
         * transaction.
         *
         * This is a 2-D array built into one, meaning to
         * get to the next row you'd index into this array `row * rowLength + column`
         * where `rowLength` is `nodeAccountIds.length`
         *
         * @internal
         * @type {List<HashgraphProto.proto.ISignedTransaction>}
         */
        this._signedTransactions = new List();

        /**
         * Set of public keys (as string) who have signed this transaction so
         * we do not allow them to sign it again.
         *
         * @internal
         * @type {Set<string>}
         */
        this._signerPublicKeys = new Set();

        /**
         * The transaction valid duration
         *
         * @private
         * @type {number}
         */
        this._transactionValidDuration = DEFAULT_TRANSACTION_VALID_DURATION;

        /**
         * The default max transaction fee for this particular transaction type.
         * Most transactions use the default of 2 Hbars, but some requests such
         * as `TokenCreateTransaction` need to use a different default value.
         *
         * @protected
         * @type {Hbar}
         */
        this._defaultMaxTransactionFee = new Hbar(2);

        /**
         * The maximum custom fee that the user is willing to pay for the message. If left empty, the user is willing to pay any custom fee.
         * If used with a transaction type that does not support custom fee limits, the transaction will fail.
         * @type {CustomFeeLimit[]}
         */
        this._customFeeLimits = [];

        /**
         * The max transaction fee on the request. This field is what users are able
         * to set, not the `defaultMaxTransactionFee`. The purpose of this field is
         * to allow us to determine if the user set the field explicitly, or if we're
         * using the default max transation fee for the request.
         *
         * @private
         * @type {Hbar | null}
         */
        this._maxTransactionFee = null;

        /**
         * The transaction's memo
         *
         * @private
         * @type {string}
         */
        this._transactionMemo = "";

        /**
         * The list of transaction IDs. This list will almost always be of length 1.
         * The only time this list will be a different length is for chunked transactions.
         * The only two chunked transactions supported right now are `FileAppendTransaction`
         * and `TopicMessageSubmitTransaction`
         *
         * @protected
         * @type {List<TransactionId>}
         */
        this._transactionIds = new List();

        /**
         * A list of public keys that will be added to the requests signatures
         *
         * @private
         * @type {PublicKey[]}
         */
        this._publicKeys = [];

        /**
         * The list of signing function 1-1 with `_publicKeys` which sign the request.
         * The reason this list allows `null` is because if we go from bytes into
         * a transaction, then we know the public key, but we don't have the signing function.
         *
         * @private
         * @type {(((message: Uint8Array) => Promise<Uint8Array>) | null)[]}
         */
        this._transactionSigners = [];

        /**
         * Determine if we should regenerate transaction IDs when we receive `TRANSACITON_EXPIRED`
         *
         * @private
         * @type {?boolean}
         */
        this._regenerateTransactionId = null;
    }

    /**
     * Deserialize a transaction from bytes. The bytes can either be a `proto.Transaction` or
     * `proto.TransactionList`.
     *
     * @param {Uint8Array} bytes
     * @returns {Transaction}
     */
    static fromBytes(bytes) {
        /** @type {HashgraphProto.proto.ISignedTransaction[]} */
        const signedTransactions = [];

        /** @type {TransactionId[]} */
        const transactionIds = [];

        /** @type {AccountId[]} */
        const nodeIds = [];

        /** @type {string[]} */
        const transactionIdStrings = [];

        /** @type {string[]} */
        const nodeIdStrings = [];

        /** @type {HashgraphProto.proto.TransactionBody[]} */
        const bodies = [];

        const list =
            HashgraphProto.proto.TransactionList.decode(bytes).transactionList;

        // If the list is of length 0, then teh bytes provided were not a
        // `proto.TransactionList`
        //
        // FIXME: We should also check to make sure the bytes length is greater than
        // 0 otherwise this check is wrong?
        if (list.length === 0) {
            const transaction = HashgraphProto.proto.Transaction.decode(bytes);

            // We support `Transaction.signedTransactionBytes` and
            // `Transaction.bodyBytes` + `Transaction.sigMap`. If the bytes represent the
            // latter, convert them into `signedTransactionBytes`
            if (transaction.signedTransactionBytes.length !== 0) {
                list.push(transaction);
            } else {
                list.push({
                    signedTransactionBytes:
                        HashgraphProto.proto.SignedTransaction.encode({
                            sigMap: transaction.sigMap,
                            bodyBytes: transaction.bodyBytes,
                        }).finish(),
                });
            }
        }

        // This loop is responsible for fill out the `signedTransactions`, `transactionIds`,
        // `nodeIds`, and `bodies` variables.
        for (const transaction of list) {
            // The `bodyBytes` or `signedTransactionBytes` should not be null
            if (
                transaction.bodyBytes == null &&
                transaction.signedTransactionBytes == null
            ) {
                throw new Error(
                    "bodyBytes and signedTransactionBytes are null",
                );
            }

            if (transaction.bodyBytes && transaction.bodyBytes.length != 0) {
                // Decode a transaction
                const body = HashgraphProto.proto.TransactionBody.decode(
                    transaction.bodyBytes,
                );

                // Make sure the transaction ID within the body is set
                if (body.transactionID != null) {
                    const transactionId = TransactionId._fromProtobuf(
                        /** @type {HashgraphProto.proto.ITransactionID} */ (
                            body.transactionID
                        ),
                    );

                    // If we haven't already seen this transaction ID in the list, add it
                    if (
                        !transactionIdStrings.includes(transactionId.toString())
                    ) {
                        transactionIds.push(transactionId);
                        transactionIdStrings.push(transactionId.toString());
                    }
                }

                // Make sure the node account ID within the body is set
                if (body.nodeAccountID != null) {
                    const nodeAccountId = AccountId._fromProtobuf(
                        /** @type {HashgraphProto.proto.IAccountID} */ (
                            body.nodeAccountID
                        ),
                    );

                    // If we haven't already seen this node account ID in the list, add it
                    if (!nodeIdStrings.includes(nodeAccountId.toString())) {
                        nodeIds.push(nodeAccountId);
                        nodeIdStrings.push(nodeAccountId.toString());
                    }
                }

                // Make sure the body is set
                if (body.data == null) {
                    throw new Error(
                        "(BUG) body.data was not set in the protobuf",
                    );
                }

                bodies.push(body);
            }

            if (
                transaction.signedTransactionBytes &&
                transaction.signedTransactionBytes.length != 0
            ) {
                // Decode a signed transaction
                const signedTransaction =
                    HashgraphProto.proto.SignedTransaction.decode(
                        transaction.signedTransactionBytes,
                    );

                signedTransactions.push(signedTransaction);

                // Decode a transaction body
                const body = HashgraphProto.proto.TransactionBody.decode(
                    signedTransaction.bodyBytes,
                );

                // Make sure the transaction ID within the body is set
                if (body.transactionID != null) {
                    const transactionId = TransactionId._fromProtobuf(
                        /** @type {HashgraphProto.proto.ITransactionID} */ (
                            body.transactionID
                        ),
                    );

                    // If we haven't already seen this transaction ID in the list, add it
                    if (
                        !transactionIdStrings.includes(transactionId.toString())
                    ) {
                        transactionIds.push(transactionId);
                        transactionIdStrings.push(transactionId.toString());
                    }
                }

                // Make sure the node account ID within the body is set
                if (body.nodeAccountID != null) {
                    const nodeAccountId = AccountId._fromProtobuf(
                        /** @type {HashgraphProto.proto.IAccountID} */ (
                            body.nodeAccountID
                        ),
                    );

                    // If we haven't already seen this node account ID in the list, add it
                    if (!nodeIdStrings.includes(nodeAccountId.toString())) {
                        nodeIds.push(nodeAccountId);
                        nodeIdStrings.push(nodeAccountId.toString());
                    }
                }

                // Make sure the body is set
                if (body.data == null) {
                    throw new Error(
                        "(BUG) body.data was not set in the protobuf",
                    );
                }

                bodies.push(body);
            }
        }

        // FIXME: We should have a length check before we access `0` since that would error
        const body = bodies[0];

        // We should have at least more than one body
        if (body == null || body.data == null) {
            throw new Error(
                "No transaction found in bytes or failed to decode TransactionBody",
            );
        }

        // Use the registry to call the right transaction's `fromProtobuf` method based
        // on the `body.data` string
        const fromProtobuf = TRANSACTION_REGISTRY.get(body.data); //NOSONAR

        // If we forgot to update the registry we should error
        if (fromProtobuf == null) {
            throw new Error(
                `(BUG) Transaction.fromBytes() not implemented for type ${body.data}`,
            );
        }

        // That the specific transaction type from protobuf implementation and pass in all the
        // information we've gathered.
        return fromProtobuf(
            list,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * Convert this transaction a `ScheduleCreateTransaction`
     *
     * @returns {ScheduleCreateTransaction}
     */
    schedule() {
        this._requireNotFrozen();

        if (SCHEDULE_CREATE_TRANSACTION.length != 1) {
            throw new Error(
                "ScheduleCreateTransaction has not been loaded yet",
            );
        }

        return SCHEDULE_CREATE_TRANSACTION[0]()._setScheduledTransaction(this);
    }

    /**
     * This method is called by each `*Transaction._fromProtobuf()` method. It does
     * all the finalization before the user gets hold of a complete `Transaction`
     *
     * @template {Transaction} TransactionT
     * @param {TransactionT} transaction
     * @param {HashgraphProto.proto.ITransaction[]} transactions
     * @param {HashgraphProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HashgraphProto.proto.ITransactionBody[]} bodies
     * @returns {TransactionT}
     */
    static _fromProtobufTransactions(
        transaction,
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];

        // "row" of the 2-D `bodies` array has all the same contents except for `nodeAccountID`
        for (let i = 0; i < transactionIds.length; i++) {
            for (let j = 0; j < nodeIds.length - 1; j++) {
                if (
                    !util.compare(
                        bodies[i * nodeIds.length + j],
                        bodies[i * nodeIds.length + j + 1],
                        // eslint-disable-next-line ie11/no-collection-args
                        new Set(["nodeAccountID"]),
                    )
                ) {
                    throw new Error("failed to validate transaction bodies");
                }
            }
        }

        // Remove node account IDs of 0
        // _IIRC_ this was initial due to some funny behavior with `ScheduleCreateTransaction`
        // We may be able to remove this.
        const zero = new AccountId(0);
        for (let i = 0; i < nodeIds.length; i++) {
            if (nodeIds[i].equals(zero)) {
                nodeIds.splice(i--, 1);
            }
        }

        // Set the transactions accordingly, but don't lock the list because transactions can
        // be regenerated if more signatures are added
        transaction._transactions.setList(transactions);

        // Set the signed transactions accordingly. Although, they
        // can be manipulated if for instance more signatures are added
        transaction._signedTransactions.setList(signedTransactions);

        // Set the transaction IDs accordingly
        transaction._transactionIds.setList(transactionIds);

        // Set the node account IDs accordingly
        transaction._nodeAccountIds.setList(nodeIds);

        // Make sure to update the rest of the fields
        transaction._transactionValidDuration =
            body.transactionValidDuration != null &&
            body.transactionValidDuration.seconds != null
                ? Long.fromValue(body.transactionValidDuration.seconds).toInt()
                : DEFAULT_TRANSACTION_VALID_DURATION;
        transaction._maxTransactionFee =
            body.transactionFee != null &&
            body.transactionFee > new Long(0, 0, true)
                ? Hbar.fromTinybars(body.transactionFee)
                : null;
        transaction._customFeeLimits =
            body.maxCustomFees != null
                ? body.maxCustomFees?.map((fee) =>
                      CustomFeeLimit._fromProtobuf(fee),
                  )
                : [];
        transaction._transactionMemo = body.memo != null ? body.memo : "";

        // Loop over a single row of `signedTransactions` and add all the public
        // keys to the `signerPublicKeys` set, and `publicKeys` list with
        // `null` in the `transactionSigners` at the same index.
        for (let i = 0; i < nodeIds.length; i++) {
            const tx = signedTransactions[i] || transactions[i];
            if (tx.sigMap != null && tx.sigMap.sigPair != null) {
                for (const sigPair of tx.sigMap.sigPair) {
                    transaction._signerPublicKeys.add(
                        hex.encode(
                            /** @type {Uint8Array} */ (sigPair.pubKeyPrefix),
                        ),
                    );

                    transaction._publicKeys.push(
                        PublicKey.fromBytes(
                            /** @type {Uint8Array} */ (sigPair.pubKeyPrefix),
                        ),
                    );
                    transaction._transactionSigners.push(null);
                }
            }
        }

        return transaction;
    }

    /**
     * Set the node account IDs
     *
     * @override
     * @param {AccountId[]} nodeIds
     * @returns {this}
     */
    setNodeAccountIds(nodeIds) {
        // The reason we overwrite this method is simply because we need to call `requireNotFrozen()`
        // Now that I think of it, we could just add an abstract method `setterPrerequiest()` which
        // by default does nothing, and `Executable` can call. Then we'd only need to overwrite that
        // method once.
        this._requireNotFrozen();
        super.setNodeAccountIds(nodeIds);
        return this;
    }

    /**
     * Get the transaction valid duration
     *
     * @returns {number}
     */
    get transactionValidDuration() {
        return this._transactionValidDuration;
    }

    /**
     * Sets the duration (in seconds) that this transaction is valid for.
     *
     * This is defaulted to 120 seconds (from the time its executed).
     *
     * @param {number} validDuration
     * @returns {this}
     */
    setTransactionValidDuration(validDuration) {
        this._requireNotFrozen();
        this._transactionValidDuration = validDuration;

        return this;
    }

    /**
     * Get the max transaction fee
     *
     * @returns {?Hbar}
     */
    get maxTransactionFee() {
        return this._maxTransactionFee;
    }

    /**
     * Set the maximum transaction fee the operator (paying account)
     * is willing to pay.
     *
     * @param {number | string | Long | BigNumber | Hbar} maxTransactionFee
     * @returns {this}
     */
    setMaxTransactionFee(maxTransactionFee) {
        this._requireNotFrozen();
        this._maxTransactionFee =
            maxTransactionFee instanceof Hbar
                ? maxTransactionFee
                : new Hbar(maxTransactionFee);

        return this;
    }

    /**
     * Is transaction ID regeneration enabled
     *
     * @returns {?boolean}
     */
    get regenerateTransactionId() {
        return this._regenerateTransactionId;
    }

    /**
     * Set the maximum transaction fee the operator (paying account)
     * is willing to pay.
     *
     * @param {boolean} regenerateTransactionId
     * @returns {this}
     */
    setRegenerateTransactionId(regenerateTransactionId) {
        this._requireNotFrozen();
        this._regenerateTransactionId = regenerateTransactionId;

        return this;
    }

    /**
     * Get the transaction memo
     *
     * @returns {string}
     */
    get transactionMemo() {
        return this._transactionMemo;
    }

    /**
     * Set a note or description to be recorded in the transaction
     * record (maximum length of 100 bytes).
     *
     * @param {string} transactionMemo
     * @returns {this}
     */
    setTransactionMemo(transactionMemo) {
        this._requireNotFrozen();
        this._transactionMemo = transactionMemo;

        return this;
    }

    /**
     * Get the curent transaction ID
     *
     * @returns {?TransactionId}
     */
    get transactionId() {
        if (this._transactionIds.isEmpty) {
            return null;
        }

        // If a user calls `.transactionId` that means we need to use that transaction ID
        // and **not** regenerate it. To do this, we simply lock the transaction ID list.
        //
        // This may be a little conffusing since a user can enable transaction ID regenration
        // explicity, but if they call `.transactionId` then we will not regenerate transaction
        // IDs.
        this._transactionIds.setLocked();

        return this._transactionIds.current;
    }

    /**
     * Set the ID for this transaction.
     *
     * The transaction ID includes the operator's account ( the account paying the transaction
     * fee). If two transactions have the same transaction ID, they won't both have an effect. One
     * will complete normally and the other will fail with a duplicate transaction status.
     *
     * Normally, you should not use this method. Just before a transaction is executed, a
     * transaction ID will be generated from the operator on the client.
     *
     * @param {TransactionId} transactionId
     * @returns {this}
     */
    setTransactionId(transactionId) {
        this._requireNotFrozen();
        this._transactionIds.setList([transactionId]).setLocked();

        return this;
    }

    /**
     * How many chunk sizes are expected
     * @abstract
     * @internal
     * @returns {number}
     */
    getRequiredChunks() {
        return 1;
    }

    /**
     * Sign the transaction with the private key
     * **NOTE**: This is a thin wrapper around `.signWith()`
     *
     * @param {PrivateKey} privateKey
     * @returns {Promise<this>}
     */
    sign(privateKey) {
        return this.signWith(privateKey.publicKey, (message) =>
            Promise.resolve(privateKey.sign(message)),
        );
    }

    /**
     * Sign the transaction with the public key and signer function
     *
     * If sign on demand is enabled no signing will be done immediately, instead
     * the private key signing function and public key are saved to be used when
     * a user calls an exit condition method (not sure what a better name for this is)
     * such as `toBytes[Async]()`, `getTransactionHash[PerNode]()` or `execute()`.
     *
     * @param {PublicKey} publicKey
     * @param {(message: Uint8Array) => Promise<Uint8Array>} transactionSigner
     * @returns {Promise<this>}
     */
    async signWith(publicKey, transactionSigner) {
        // If signing on demand is disabled, we need to make sure
        // the request is frozen
        if (!this._signOnDemand) {
            this._requireFrozen();
        }
        const publicKeyData = publicKey.toBytesRaw();

        // note: this omits the DER prefix on purpose because Hedera doesn't
        // support that in the protobuf. this means that we would fail
        // to re-inflate [this._signerPublicKeys] during [fromBytes] if we used DER
        // prefixes here
        const publicKeyHex = hex.encode(publicKeyData);

        if (this._signerPublicKeys.has(publicKeyHex)) {
            // this public key has already signed this transaction
            return this;
        }

        // If we add a new signer, then we need to re-create all transactions
        this._transactions.clear();

        // Save the current public key so we don't attempt to sign twice
        this._signerPublicKeys.add(publicKeyHex);

        // If signing on demand is enabled we will save the public key and signer and return
        if (this._signOnDemand) {
            this._publicKeys.push(publicKey);
            this._transactionSigners.push(transactionSigner);

            return this;
        }

        // If we get here, signing on demand is disabled, this means the transaction
        // is frozen and we need to sign all the transactions immediately. If we're
        // signing all the transactions immediately, we need to lock the node account IDs
        // and transaction IDs.
        // Now that I think of it, this code should likely exist in `freezeWith()`?
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();

        // Sign each signed transatcion
        for (const signedTransaction of this._signedTransactions.list) {
            const bodyBytes = /** @type {Uint8Array} */ (
                signedTransaction.bodyBytes
            );
            const signature = await transactionSigner(bodyBytes);

            if (signedTransaction.sigMap == null) {
                signedTransaction.sigMap = {};
            }

            if (signedTransaction.sigMap.sigPair == null) {
                signedTransaction.sigMap.sigPair = [];
            }

            signedTransaction.sigMap.sigPair.push(
                publicKey._toProtobufSignature(signature),
            );
        }

        return this;
    }

    /**
     * Sign the transaction with the client operator. This is a thin wrapper
     * around `.signWith()`
     *
     * **NOTE**: If client does not have an operator set, this method will throw
     *
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<this>}
     */
    signWithOperator(client) {
        const operator = client._operator;

        if (operator == null) {
            throw new Error(
                "`client` must have an operator to sign with the operator",
            );
        }

        if (!this._isFrozen()) {
            this.freezeWith(client);
        }

        return this.signWith(operator.publicKey, operator.transactionSigner);
    }

    /**
     * Add a signature explicitly
     *
     * @param {PublicKey} publicKey
     * @param {SignatureMap} signatureMap
     * @returns {this}
     */
    addSignature(publicKey, signatureMap) {
        // If the transaction isn't frozen, freeze it.
        if (!this.isFrozen()) {
            this.freeze();
        }

        const publicKeyData = publicKey.toBytesRaw();
        const publicKeyHex = hex.encode(publicKeyData);

        if (this._signerPublicKeys.has(publicKeyHex)) {
            // this public key has already signed this transaction
            return this;
        }

        // If we add a new signer, then we need to re-create all transactions
        this._transactions.clear();

        // Locking the transaction IDs and node account IDs is necessary for consistency
        // between before and after execution
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();
        this._signedTransactions.setLocked();

        // Add the signature to the signed transaction list
        for (let index = 0; index < this._signedTransactions.length; index++) {
            const signedTransaction = this._signedTransactions.get(index);
            if (signedTransaction.sigMap == null) {
                signedTransaction.sigMap = {};
            }

            if (signedTransaction.sigMap.sigPair == null) {
                signedTransaction.sigMap.sigPair = [];
            }

            if (signedTransaction.bodyBytes) {
                const { transactionID, nodeAccountID } =
                    HashgraphProto.proto.TransactionBody.decode(
                        signedTransaction.bodyBytes,
                    );

                if (!transactionID || !nodeAccountID) {
                    throw new Error(
                        "Transaction ID or Node Account ID not found in the signed transaction",
                    );
                }

                const transactionId =
                    TransactionId._fromProtobuf(transactionID);
                const nodeAccountId = AccountId._fromProtobuf(nodeAccountID);

                const nodeSignatures = signatureMap.get(nodeAccountId);
                const transactionSignatures =
                    nodeSignatures?.get(transactionId);
                const signature = transactionSignatures?.get(publicKey);

                if (!signature) {
                    throw new Error(
                        "Signature not found for the transaction and public key",
                    );
                }
                const sigPair = publicKey._toProtobufSignature(signature);
                signedTransaction.sigMap?.sigPair?.push(sigPair);
            }
        }

        this._signerPublicKeys.add(publicKeyHex);
        this._publicKeys.push(publicKey);
        this._transactionSigners.push(null);

        return this;
    }

    /**
     * This method removes all signatures from the transaction based on the public key provided.
     *
     * @param {PublicKey} publicKey - The public key associated with the signature to remove.
     * @returns {Uint8Array[]} The removed signatures.
     */
    removeSignature(publicKey) {
        if (!this.isFrozen()) {
            this.freeze();
        }

        const publicKeyData = publicKey.toBytesRaw();
        const publicKeyHex = hex.encode(publicKeyData);

        if (!this._signerPublicKeys.has(publicKeyHex)) {
            throw new Error("The public key has not signed this transaction");
        }

        /** @type {Uint8Array[]} */
        const removedSignatures = [];

        // Iterate over the signed transactions and remove matching signatures
        for (const transaction of this._signedTransactions.list) {
            const removedSignaturesFromTransaction =
                this._removeSignaturesFromTransaction(
                    transaction,
                    publicKeyHex,
                );

            removedSignatures.push(...removedSignaturesFromTransaction);
        }

        // Remove the public key from internal tracking if no signatures remain
        this._signerPublicKeys.delete(publicKeyHex);
        this._publicKeys = this._publicKeys.filter(
            (key) => !key.equals(publicKey),
        );

        // Update transaction signers array
        this._transactionSigners.pop();

        return removedSignatures;
    }

    /**
     * This method clears all signatures from the transaction and returns them in a specific format.
     *
     * It will call collectSignatures to get the removed signatures, then clear all signatures
     * from the internal tracking.
     *
     * @returns { Map<PublicKey, Uint8Array[] | Uint8Array> } The removed signatures in the specified format.
     */
    removeAllSignatures() {
        if (!this.isFrozen()) {
            this.freeze();
        }

        const removedSignatures = this._collectSignaturesByPublicKey();

        // Iterate over the signed transactions and clear all signatures
        for (const transaction of this._signedTransactions.list) {
            if (transaction.sigMap && transaction.sigMap.sigPair) {
                // Clear all signature pairs from the transaction's signature map
                transaction.sigMap.sigPair = [];
            }
        }

        // Clear the internal tracking of signer public keys and other relevant arrays
        this._signerPublicKeys.clear();
        this._publicKeys = [];
        this._transactionSigners = [];

        return removedSignatures;
    }

    /**
     * Get the current signatures on the request
     *
     * **NOTE**: Does NOT support sign on demand
     *
     * @returns {SignatureMap}
     */
    getSignatures() {
        // If a user is attempting to get signatures for a transaction, then the
        // transaction must be frozen.
        this._requireFrozen();

        // Sign on demand must be disabled because this is the non-async version and
        // signing requires awaiting callbacks.
        this._requireNotSignOnDemand();

        // Build all the transactions
        this._buildAllTransactions();

        // Lock transaction IDs, and node account IDs
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();

        // Construct a signature map from this transaction
        return SignatureMap._fromTransaction(this);
    }

    /**
     * Get the current signatures on the request
     *
     * **NOTE**: Supports sign on demand
     *
     * @returns {Promise<SignatureMap>}
     */
    async getSignaturesAsync() {
        // If sign on demand is enabled, we don't need to care about being frozen
        // since we can just regenerate and resign later if some field of the transaction
        // changes.

        // Locking the transaction IDs and node account IDs is necessary for consistency
        // between before and after execution
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();

        // Build all transactions, and sign them
        await this._buildAllTransactionsAsync();

        // Lock transaction IDs, and node account IDs
        this._transactions.setLocked();
        this._signedTransactions.setLocked();

        // Construct a signature map from this transaction
        return SignatureMap._fromTransaction(this);
    }

    /**
     * Not sure why this is called `setTransactionId()` when it doesn't set anything...
     * FIXME: Remove this?
     */
    _setTransactionId() {
        if (this._operatorAccountId == null && this._transactionIds.isEmpty) {
            throw new Error(
                "`transactionId` must be set or `client` must be provided with `freezeWith`",
            );
        }
    }

    /**
     * Set the node account IDs using the client
     *
     * @param {?import("../client/Client.js").default<Channel, *>} client
     */
    _setNodeAccountIds(client) {
        if (!this._nodeAccountIds.isEmpty) {
            return;
        }

        if (client == null) {
            throw new Error(
                "`nodeAccountId` must be set or `client` must be provided with `freezeWith`",
            );
        }

        this._nodeAccountIds.setList(
            client._network.getNodeAccountIdsForExecute(),
        );
    }

    /**
     * Build all the signed transactions from the node account IDs
     *
     * @private
     */
    _buildSignedTransactions() {
        if (this._signedTransactions.locked) {
            return;
        }

        this._signedTransactions.setList(
            this._nodeAccountIds.list.map((nodeId) =>
                this._makeSignedTransaction(nodeId),
            ),
        );
    }

    /**
     * Build all the signed transactions from the node account IDs
     *
     * @internal
     */
    _buildIncompleteTransactions() {
        if (this._nodeAccountIds.length == 0) {
            this._transactions.setList([this._makeSignedTransaction(null)]);
        } else {
            // In case the node account ids are set
            this._transactions.setList(
                this._nodeAccountIds.list.map((nodeId) =>
                    this._makeSignedTransaction(nodeId),
                ),
            );
        }
    }

    /**
     * Freeze this transaction from future modification to prepare for
     * signing or serialization.
     *
     * @returns {this}
     */
    freeze() {
        return this.freezeWith(null);
    }

    /**
     * @param {?AccountId} accountId
     */
    _freezeWithAccountId(accountId) {
        if (this._operatorAccountId == null) {
            this._operatorAccountId = accountId;
        }
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
        // Set sign on demand based on client
        this._signOnDemand = client != null ? client.signOnDemand : false;

        // Save the operator
        this._operator = client != null ? client._operator : null;
        this._freezeWithAccountId(
            client != null ? client.operatorAccountId : null,
        );

        // Set max transaction fee to either `this._maxTransactionFee`,
        // `client._defaultMaxTransactionFee`, or `this._defaultMaxTransactionFee`
        // in that priority order depending on if `this._maxTransactionFee` has
        // been set or if `client._defaultMaxTransactionFee` has been set.
        this._maxTransactionFee =
            this._maxTransactionFee == null
                ? client != null && client.defaultMaxTransactionFee != null
                    ? client.defaultMaxTransactionFee
                    : this._defaultMaxTransactionFee
                : this._maxTransactionFee;

        // Determine if transaction ID generation should be enabled.
        this._regenerateTransactionId =
            client != null && this._regenerateTransactionId == null
                ? client.defaultRegenerateTransactionId
                : this._regenerateTransactionId;

        // Set the node account IDs via client
        this._setNodeAccountIds(client);

        // Make sure a transaction ID or operator is set.
        this._setTransactionId();

        // If a client was not provided, we need to make sure the transaction ID already set
        // validates aginst the client.
        if (client != null) {
            for (const transactionId of this._transactionIds.list) {
                if (transactionId.accountId != null) {
                    transactionId.accountId.validateChecksum(client);
                }
            }
        }

        // Build a list of transaction IDs so that if a user calls `.transactionId` they'll
        // get a value, but if they dont' we'll just regenerate transaction IDs during execution
        this._buildNewTransactionIdList();

        // If sign on demand is disabled we need to build out all the signed transactions
        if (!this._signOnDemand) {
            this._buildSignedTransactions();
        }

        return this;
    }

    /**
     * Sign the transaction using a signer
     *
     * This is part of the signature provider feature
     *
     * @param {Signer} signer
     * @returns {Promise<this>}
     */
    async signWithSigner(signer) {
        await signer.signTransaction(this);
        return this;
    }

    /**
     * Freeze the transaction using a signer
     *
     * This is part of the signature provider feature.
     *
     * @param {Signer} signer
     * @returns {Promise<this>}
     */
    async freezeWithSigner(signer) {
        await signer.populateTransaction(this);
        this.freeze();
        return this;
    }

    /**
     * Serialize the request into bytes. This will encode all the transactions
     * into a `proto.TransactionList` and return the encoded protobuf.
     *
     * **NOTE**: Does not support sign on demand
     *
     * @returns {Uint8Array}
     */
    toBytes() {
        // Sign on demand must be disabled because this is the non-async version and
        // signing requires awaiting callbacks.
        this._requireNotSignOnDemand();

        if (this._isFrozen()) {
            // Locking the transaction IDs and node account IDs is necessary for consistency
            // between before and after execution
            this._transactionIds.setLocked();
            this._nodeAccountIds.setLocked();

            // Build all the transactions without signing
            this._buildAllTransactions();
        } else {
            this._buildIncompleteTransactions();
        }

        // Construct and encode the transaction list
        return HashgraphProto.proto.TransactionList.encode({
            transactionList:
                /** @type {HashgraphProto.proto.ITransaction[]} */ (
                    this._transactions.list
                ),
        }).finish();
    }

    /**
     * Serialize the transaction into bytes
     *
     * **NOTE**: Supports sign on demand
     *
     * @returns {Promise<Uint8Array>}
     */
    async toBytesAsync() {
        // If sign on demand is enabled, we don't need to care about being frozen
        // since we can just regenerate and resign later if some field of the transaction
        // changes.

        // Locking the transaction IDs and node account IDs is necessary for consistency
        // between before and after execution
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();

        // Build all transactions, and sign them
        await this._buildAllTransactionsAsync();

        // Lock transaction IDs, and node account IDs
        this._transactions.setLocked();
        this._signedTransactions.setLocked();

        // Construct and encode the transaction list
        return HashgraphProto.proto.TransactionList.encode({
            transactionList:
                /** @type {HashgraphProto.proto.ITransaction[]} */ (
                    this._transactions.list
                ),
        }).finish();
    }

    /**
     * Get the transaction hash
     *
     * @returns {Promise<Uint8Array>}
     */
    async getTransactionHash() {
        this._requireFrozen();

        // Locking the transaction IDs and node account IDs is necessary for consistency
        // between before and after execution
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();

        await this._buildAllTransactionsAsync();

        this._transactions.setLocked();
        this._signedTransactions.setLocked();

        return sha384.digest(
            /** @type {Uint8Array} */ (
                /** @type {HashgraphProto.proto.ITransaction} */ (
                    this._transactions.get(0)
                ).signedTransactionBytes
            ),
        );
    }

    /**
     * Get all the transaction hashes
     *
     * @returns {Promise<TransactionHashMap>}
     */
    async getTransactionHashPerNode() {
        this._requireFrozen();

        // Locking the transaction IDs and node account IDs is necessary for consistency
        // between before and after execution
        this._transactionIds.setLocked();
        this._nodeAccountIds.setLocked();

        await this._buildAllTransactionsAsync();

        return await TransactionHashMap._fromTransaction(this);
    }

    /**
     * Is transaction frozen
     *
     * @returns {boolean}
     */
    isFrozen() {
        return this._signedTransactions.length > 0;
    }

    /**
     * Get the current transaction ID, and make sure it's not null
     *
     * @protected
     * @returns {TransactionId}
     */
    _getTransactionId() {
        const transactionId = this.transactionId;
        if (transactionId == null) {
            throw new Error(
                "transaction must have been frozen before getting the transaction ID, try calling `freeze`",
            );
        }
        return transactionId;
    }

    /**
     * @param {Client} client
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    _validateChecksums(client) {
        // Do nothing
    }

    /**
     * Before we proceed execution, we need to do a couple checks
     *
     * @override
     * @protected
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<void>}
     */
    async _beforeExecute(client) {
        // Assign the account IDs to which the transaction should be sent.
        this.transactionNodeIds = Object.values(client.network).map(
            (accountNodeId) => accountNodeId.toString(),
        );

        if (this._logger) {
            this._logger.info(
                `Network used: ${client._network.networkName}`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
            );
        }

        // Make sure we're frozen
        if (!this._isFrozen()) {
            this.freezeWith(client);
        }

        // Valid checksums if the option is enabled
        if (client.isAutoValidateChecksumsEnabled()) {
            this._validateChecksums(client);
        }

        // Set the operator if the client has one and the current operator is nullish
        if (this._operator == null || this._operator == undefined) {
            this._operator = client != null ? client._operator : null;
        }

        if (
            this._operatorAccountId == null ||
            this._operatorAccountId == undefined
        ) {
            this._operatorAccountId =
                client != null && client._operator != null
                    ? client._operator.accountId
                    : null;
        }

        // If the client has an operator, sign this request with the operator
        if (this._operator != null) {
            await this.signWith(
                this._operator.publicKey,
                this._operator.transactionSigner,
            );
        }
    }

    /**
     * Construct a protobuf transaction
     *
     * @override
     * @internal
     * @returns {Promise<HashgraphProto.proto.ITransaction>}
     */
    async _makeRequestAsync() {
        // The index for the transaction
        const index =
            this._transactionIds.index * this._nodeAccountIds.length +
            this._nodeAccountIds.index;

        // If sign on demand is disabled we need to simply build that transaction
        // and return the result, without signing
        if (!this._signOnDemand) {
            this._buildTransaction(index);
            return /** @type {HashgraphProto.proto.ITransaction} */ (
                this._transactions.get(index)
            );
        }

        // Build and sign a transaction
        return await this._buildTransactionAsync();
    }

    /**
     * Sign a `proto.SignedTransaction` with all the keys
     *
     * @private
     * @returns {Promise<HashgraphProto.proto.ISignedTransaction>}
     */
    async _signTransaction() {
        const signedTransaction = this._makeSignedTransaction(
            this._nodeAccountIds.next,
        );

        const bodyBytes = /** @type {Uint8Array} */ (
            signedTransaction.bodyBytes
        );

        for (let j = 0; j < this._publicKeys.length; j++) {
            const publicKey = this._publicKeys[j];
            const transactionSigner = this._transactionSigners[j];

            if (transactionSigner == null) {
                continue;
            }

            const signature = await transactionSigner(bodyBytes);

            if (signedTransaction.sigMap == null) {
                signedTransaction.sigMap = {};
            }

            if (signedTransaction.sigMap.sigPair == null) {
                signedTransaction.sigMap.sigPair = [];
            }

            signedTransaction.sigMap.sigPair.push(
                publicKey._toProtobufSignature(signature),
            );
        }

        return signedTransaction;
    }

    /**
     * Construct a new transaction ID at the current index
     *
     * @private
     */
    _buildNewTransactionIdList() {
        if (this._transactionIds.locked || this._operatorAccountId == null) {
            return;
        }

        const transactionId = TransactionId.withValidStart(
            this._operatorAccountId,
            Timestamp.generate(),
        );

        this._transactionIds.set(this._transactionIds.index, transactionId);
    }

    /**
     * Build each signed transaction in a loop
     *
     * @internal
     */
    _buildAllTransactions() {
        for (let i = 0; i < this._signedTransactions.length; i++) {
            this._buildTransaction(i);
        }
    }

    /**
     * Build and and sign each transaction in a loop
     *
     * This method is primary used in the exist condition methods
     * which are not `execute()`, e.g. `toBytesAsync()` and `getSignaturesAsync()`
     *
     * @private
     */
    async _buildAllTransactionsAsync() {
        if (!this._signOnDemand) {
            this._buildAllTransactions();
            return;
        }

        this._buildSignedTransactions();

        if (this._transactions.locked) {
            return;
        }

        for (let i = 0; i < this._signedTransactions.length; i++) {
            this._transactions.push(await this._buildTransactionAsync());
        }
    }

    /**
     * Build a transaction at a particular index
     *
     * @internal
     * @param {number} index
     */
    _buildTransaction(index) {
        if (this._transactions.length < index) {
            for (let i = this._transactions.length; i < index; i++) {
                this._transactions.push(null);
            }
        }

        // In case when an incomplete transaction is created, serialized and
        // deserialized,and then the transaction being frozen, the copy of the
        // incomplete transaction must be updated in order to be prepared for execution
        if (this._transactions.list[index] != null) {
            this._transactions.set(index, {
                signedTransactionBytes:
                    HashgraphProto.proto.SignedTransaction.encode(
                        this._signedTransactions.get(index),
                    ).finish(),
            });
        }

        this._transactions.setIfAbsent(index, () => {
            return {
                signedTransactionBytes:
                    HashgraphProto.proto.SignedTransaction.encode(
                        this._signedTransactions.get(index),
                    ).finish(),
            };
        });
    }

    /**
     * Build a trransaction using the current index, where the current
     * index is determined by `this._nodeAccountIds.index` and
     * `this._transactionIds.index`
     *
     * @private
     * @returns {Promise<HashgraphProto.proto.ITransaction>}
     */
    async _buildTransactionAsync() {
        return {
            signedTransactionBytes:
                HashgraphProto.proto.SignedTransaction.encode(
                    await this._signTransaction(),
                ).finish(),
        };
    }

    /**
     * Determine what execution state we're in.
     *
     * @override
     * @internal
     * @param {HashgraphProto.proto.ITransaction} request
     * @param {HashgraphProto.proto.ITransactionResponse} response
     * @returns {[Status, ExecutionState]}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        const { nodeTransactionPrecheckCode } = response;

        // Get the node precheck code, and convert it into an SDK `Status`
        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : HashgraphProto.proto.ResponseCodeEnum.OK,
        );

        if (this._logger) {
            this._logger.debug(
                `[${this._getLogId()}] received status ${status.toString()}`,
            );
            this._logger.info(
                `SDK Transaction Status Response: ${status.toString()}`,
            );
        }

        // Based on the status what execution state are we in
        switch (status) {
            case Status.Busy:
            case Status.Unknown:
            case Status.PlatformTransactionNotCreated:
            case Status.PlatformNotActive:
                return [status, ExecutionState.Retry];
            case Status.Ok:
                return [status, ExecutionState.Finished];
            case Status.TransactionExpired:
                if (
                    this._transactionIds.locked ||
                    (this._regenerateTransactionId != null &&
                        !this._regenerateTransactionId)
                ) {
                    return [status, ExecutionState.Error];
                } else {
                    this._buildNewTransactionIdList();
                    return [status, ExecutionState.Retry];
                }
            default:
                return [status, ExecutionState.Error];
        }
    }

    /**
     * Map the request and response into a precheck status error
     *
     * @override
     * @internal
     * @param {HashgraphProto.proto.ITransaction} request
     * @param {HashgraphProto.proto.ITransactionResponse} response
     * @param {AccountId} nodeId
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response, nodeId) {
        const { nodeTransactionPrecheckCode } = response;

        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : HashgraphProto.proto.ResponseCodeEnum.OK,
        );
        if (this._logger) {
            this._logger.info(
                // @ts-ignore
                `Transaction Error Info: ${status.toString()}, ${this.transactionId.toString()}`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
            );
        }

        return new PrecheckStatusError({
            nodeId,
            status,
            transactionId: this._getTransactionId(),
            contractFunctionResult: null,
        });
    }

    /**
     * Map the request, response, and node account ID into a `TransactionResponse`
     *
     * @override
     * @protected
     * @param {HashgraphProto.proto.ITransactionResponse} response
     * @param {AccountId} nodeId
     * @param {HashgraphProto.proto.ITransaction} request
     * @returns {Promise<TransactionResponse>}
     */
    async _mapResponse(response, nodeId, request) {
        const transactionHash = await sha384.digest(
            /** @type {Uint8Array} */ (request.signedTransactionBytes),
        );
        const transactionId = this._getTransactionId();

        this._transactionIds.advance();
        if (this._logger) {
            this._logger.info(
                `Transaction Info: ${JSON.stringify(
                    new TransactionResponse({
                        nodeId,
                        transactionHash,
                        transactionId,
                    }).toJSON(),
                )}`,
            );
        }

        return new TransactionResponse({
            nodeId,
            transactionHash,
            transactionId,
        });
    }

    /**
     * Make a signed transaction given a node account ID
     *
     * @internal
     * @param {?AccountId} nodeId
     * @returns {HashgraphProto.proto.ISignedTransaction}
     */
    _makeSignedTransaction(nodeId) {
        const body = this._makeTransactionBody(nodeId);
        if (this._logger) {
            this._logger.info(`Transaction Body: ${JSON.stringify(body)}`);
        }
        const bodyBytes =
            HashgraphProto.proto.TransactionBody.encode(body).finish();

        return {
            sigMap: {
                sigPair: [],
            },
            bodyBytes,
        };
    }

    /**
     * Make a protobuf transaction body
     *
     * @private
     * @param {?AccountId} nodeId
     * @returns {HashgraphProto.proto.ITransactionBody}
     */
    _makeTransactionBody(nodeId) {
        return {
            [this._getTransactionDataCase()]: this._makeTransactionData(),
            transactionFee:
                this._maxTransactionFee != null
                    ? this._maxTransactionFee.toTinybars()
                    : null,
            memo: this._transactionMemo,
            transactionID:
                this._transactionIds.current != null
                    ? this._transactionIds.current._toProtobuf()
                    : null,
            nodeAccountID: nodeId != null ? nodeId._toProtobuf() : null,
            transactionValidDuration: {
                seconds: Long.fromNumber(this._transactionValidDuration),
            },
            maxCustomFees:
                this._customFeeLimits != null
                    ? this._customFeeLimits.map((maxCustomFee) =>
                          maxCustomFee._toProtobuf(),
                      )
                    : null,
        };
    }

    /**
     * This method returns a key for the `data` field in a transaction body.
     * Each transaction overwrite this to make sure when we build the transaction body
     * we set the right data field.
     *
     * @abstract
     * @protected
     * @returns {NonNullable<HashgraphProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        throw new Error("not implemented");
    }

    /**
     * Make a scheduled transaction body
     * FIXME: Should really call this `makeScheduledTransactionBody` to be consistent
     *
     * @internal
     * @returns {HashgraphProto.proto.ISchedulableTransactionBody}
     */
    _getScheduledTransactionBody() {
        return {
            memo: this.transactionMemo,
            transactionFee:
                this._maxTransactionFee == null
                    ? this._defaultMaxTransactionFee.toTinybars()
                    : this._maxTransactionFee.toTinybars(),
            [this._getTransactionDataCase()]: this._makeTransactionData(),
        };
    }

    /**
     * Make the transaction body data.
     *
     * @abstract
     * @protected
     * @returns {object}
     */
    _makeTransactionData() {
        throw new Error("not implemented");
    }

    /**
     * FIXME: Why do we have `isFrozen` and `_isFrozen()`?
     *
     * @protected
     * @returns {boolean}
     */
    _isFrozen() {
        return this._signOnDemand || this._signedTransactions.length > 0;
    }

    /**
     * Require the transaction to NOT be frozen
     *
     * @internal
     */
    _requireNotFrozen() {
        if (this._isFrozen()) {
            throw new Error(
                "transaction is immutable; it has at least one signature or has been explicitly frozen",
            );
        }
    }

    /**
     * Require the transaction to have sign on demand disabled
     *
     * @internal
     */
    _requireNotSignOnDemand() {
        if (this._signOnDemand) {
            throw new Error(
                "Please use `toBytesAsync()` if `signOnDemand` is enabled",
            );
        }
    }

    /**
     * Require the transaction to be frozen
     *
     * @internal
     */
    _requireFrozen() {
        if (!this._isFrozen()) {
            throw new Error(
                "transaction must have been frozen before calculating the hash will be stable, try calling `freeze`",
            );
        }
    }

    /**
     * Require the transaction to have a single node account ID set
     *
     * @internal
     * @protected
     */
    _requireOneNodeAccountId() {
        if (this._nodeAccountIds.length != 1) {
            throw "transaction did not have exactly one node ID set";
        }
    }

    /**
     * @param {HashgraphProto.proto.Transaction} request
     * @returns {Uint8Array}
     */
    _requestToBytes(request) {
        return HashgraphProto.proto.Transaction.encode(request).finish();
    }

    /**
     * @param {HashgraphProto.proto.TransactionResponse} response
     * @returns {Uint8Array}
     */
    _responseToBytes(response) {
        return HashgraphProto.proto.TransactionResponse.encode(
            response,
        ).finish();
    }

    /**
     * Removes all signatures from a transaction and collects the removed signatures.
     *
     * @param {HashgraphProto.proto.ISignedTransaction} transaction - The transaction object to process.
     * @param {string} publicKeyHex - The hexadecimal representation of the public key.
     * @returns {Uint8Array[]} An array of removed signatures.
     */
    _removeSignaturesFromTransaction(transaction, publicKeyHex) {
        /** @type {Uint8Array[]} */
        const removedSignatures = [];

        if (!transaction.sigMap || !transaction.sigMap.sigPair) {
            return [];
        }

        transaction.sigMap.sigPair = transaction.sigMap.sigPair.filter(
            (sigPair) => {
                const shouldRemove = this._shouldRemoveSignature(
                    sigPair,
                    publicKeyHex,
                );
                const signature = sigPair.ed25519 ?? sigPair.ECDSASecp256k1;

                if (shouldRemove && signature) {
                    removedSignatures.push(signature);
                }

                return !shouldRemove;
            },
        );

        return removedSignatures;
    }

    /**
     * Determines whether a signature should be removed based on the provided public key.
     *
     * @param {HashgraphProto.proto.ISignaturePair} sigPair - The signature pair object that contains
     *        the public key prefix and signature to be evaluated.
     * @param {string} publicKeyHex - The hexadecimal representation of the public key to compare against.
     * @returns {boolean} `true` if the public key prefix in the signature pair matches the provided public key,
     *          indicating that the signature should be removed; otherwise, `false`.
     */
    _shouldRemoveSignature = (sigPair, publicKeyHex) => {
        const sigPairPublicKeyHex = hex.encode(
            sigPair?.pubKeyPrefix || new Uint8Array(),
        );

        const matchesPublicKey = sigPairPublicKeyHex === publicKeyHex;

        return matchesPublicKey;
    };

    /**
     * Collects all signatures from signed transactions and returns them in a format keyed by PublicKey.
     *
     * @returns { Map<PublicKey, Uint8Array[]> } The collected signatures keyed by PublicKey.
     */
    _collectSignaturesByPublicKey() {
        /** @type {  Map<PublicKey, Uint8Array[]>} */
        const collectedSignatures = new Map();
        /** @type { Record<string, PublicKey> } */
        const publicKeyMap = {}; // Map to hold string representation of the PublicKey object

        // Iterate over the signed transactions and collect signatures
        for (const transaction of this._signedTransactions.list) {
            if (!(transaction.sigMap && transaction.sigMap.sigPair)) {
                return new Map();
            }

            // Collect the signatures
            for (const sigPair of transaction.sigMap.sigPair) {
                const signature = sigPair.ed25519 ?? sigPair.ECDSASecp256k1;

                if (!signature || !sigPair.pubKeyPrefix) {
                    return new Map();
                }

                const publicKeyStr = hex.encode(sigPair.pubKeyPrefix);
                let publicKeyObj = publicKeyMap[publicKeyStr];

                // If the PublicKey instance for this string representation doesn't exist, create and store it
                if (!publicKeyObj) {
                    publicKeyObj = PublicKey.fromString(publicKeyStr);
                    publicKeyMap[publicKeyStr] = publicKeyObj;
                }

                // Initialize the structure for this publicKey if it doesn't exist
                if (!collectedSignatures.has(publicKeyObj)) {
                    collectedSignatures.set(publicKeyObj, []);
                }

                const existingSignatures =
                    collectedSignatures.get(publicKeyObj);

                // Add the signature to the corresponding public key
                if (existingSignatures) {
                    existingSignatures.push(signature);
                }
            }
        }

        return collectedSignatures;
    }
}

/**
 * This is essentially a registry/cache for a callback that creates a `ScheduleCreateTransaction`
 *
 * @type {(() => ScheduleCreateTransaction)[]}
 */
export const SCHEDULE_CREATE_TRANSACTION = [];
