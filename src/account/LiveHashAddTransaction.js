import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "./AccountId.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import Duration from "../Duration.js";
import { KeyList } from "@exodus/hashgraph-cryptography";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ICryptoAddLiveHashTransactionBody} proto.ICryptoAddLiveHashTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ILiveHash} proto.ILiveHash
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

export default class LiveHashAddTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.hash]
     * @param {Key[]} [props.keys]
     * @param {Duration | Long | number} [props.duration]
     * @param {AccountId | string} [props.accountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._hash = null;

        /**
         * @private
         * @type {?Key[]}
         */
        this._keys = null;

        /**
         * @private
         * @type {?Duration}
         */
        this._duration = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        if (props.hash != null) {
            this.setHash(props.hash);
        }

        if (props.keys != null) {
            this.setKeys(props.keys);
        }

        if (props.duration != null) {
            this.setDuration(props.duration);
        }

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {LiveHashAddTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const hashes = /** @type {proto.ICryptoAddLiveHashTransactionBody} */ (
            body.cryptoAddLiveHash
        );
        const liveHash_ = /** @type {proto.ILiveHash} */ (hashes.liveHash);

        return Transaction._fromProtobufTransactions(
            new LiveHashAddTransaction({
                hash: liveHash_.hash != null ? liveHash_.hash : undefined,
                keys:
                    liveHash_.keys != null
                        ? liveHash_.keys.keys != null
                            ? liveHash_.keys.keys.map((key) =>
                                  keyFromProtobuf(key)
                              )
                            : undefined
                        : undefined,
                duration:
                    liveHash_.duration != null
                        ? liveHash_.duration.seconds != null
                            ? liveHash_.duration.seconds
                            : undefined
                        : undefined,
                accountId:
                    liveHash_.accountId != null
                        ? AccountId._fromProtobuf(liveHash_.accountId)
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
     * @returns {?Uint8Array}
     */
    get hash() {
        return this._hash;
    }

    /**
     * @param {Uint8Array} hash
     * @returns {LiveHashAddTransaction}
     */
    setHash(hash) {
        this._requireNotFrozen();
        this._hash = hash;

        return this;
    }

    /**
     * @returns {?Key[]}
     */
    get keys() {
        return this._keys;
    }

    /**
     * @param {Key[] | KeyList} keys
     * @returns {LiveHashAddTransaction}
     */
    setKeys(keys) {
        this._requireNotFrozen();
        this._keys = keys instanceof KeyList ? keys.toArray() : keys;

        return this;
    }

    /**
     * @returns {?Duration}
     */
    get duration() {
        return this._duration;
    }

    /**
     * @param {Duration | Long | number} duration
     * @returns {LiveHashAddTransaction}
     */
    setDuration(duration) {
        this._requireNotFrozen();
        this._duration =
            duration instanceof Duration ? duration : new Duration(duration);

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {LiveHashAddTransaction}
     */
    setAccountId(accountId) {
        this._requireNotFrozen();
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
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
        return channel.crypto.addLiveHash(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoAddLiveHash";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ICryptoAddLiveHashTransactionBody}
     */
    _makeTransactionData() {
        return {
            liveHash: {
                hash: this._hash,
                keys:
                    this._keys != null
                        ? {
                              keys: this._keys.map((key) => keyToProtobuf(key)),
                          }
                        : undefined,
                duration:
                    this._duration != null
                        ? this._duration._toProtobuf()
                        : null,
                accountId:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
            },
        };
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoAddLiveHash",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    LiveHashAddTransaction._fromProtobuf
);
