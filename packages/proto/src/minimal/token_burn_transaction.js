/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots.hashgraph_token_burn_transaction || ($protobuf.roots.hashgraph_token_burn_transaction = {});

export const proto = $root.proto = (() => {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    const proto = {};

    proto.Transaction = (function() {

        /**
         * Properties of a Transaction.
         * @memberof proto
         * @interface ITransaction
         * @property {Uint8Array|null} [signedTransactionBytes] A valid, serialized, `SignedTransaction` message.
         */

        /**
         * Constructs a new Transaction.
         * @memberof proto
         * @classdesc A wrapper around signed transaction bytes for token burning.
         * @implements ITransaction
         * @constructor
         * @param {proto.ITransaction=} [p] Properties to set
         */
        function Transaction(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A valid, serialized, `SignedTransaction` message.
         * @member {Uint8Array} signedTransactionBytes
         * @memberof proto.Transaction
         * @instance
         */
        Transaction.prototype.signedTransactionBytes = $util.newBuffer([]);

        /**
         * Creates a new Transaction instance using the specified properties.
         * @function create
         * @memberof proto.Transaction
         * @static
         * @param {proto.ITransaction=} [properties] Properties to set
         * @returns {proto.Transaction} Transaction instance
         */
        Transaction.create = function create(properties) {
            return new Transaction(properties);
        };

        /**
         * Encodes the specified Transaction message. Does not implicitly {@link proto.Transaction.verify|verify} messages.
         * @function encode
         * @memberof proto.Transaction
         * @static
         * @param {proto.ITransaction} m Transaction message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Transaction.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.signedTransactionBytes != null && Object.hasOwnProperty.call(m, "signedTransactionBytes"))
                w.uint32(42).bytes(m.signedTransactionBytes);
            return w;
        };

        /**
         * Decodes a Transaction message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Transaction
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Transaction} Transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Transaction.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Transaction();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 5: {
                        m.signedTransactionBytes = r.bytes();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Transaction
         * @function getTypeUrl
         * @memberof proto.Transaction
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Transaction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Transaction";
        };

        return Transaction;
    })();

    proto.TransactionBody = (function() {

        /**
         * Properties of a TransactionBody.
         * @memberof proto
         * @interface ITransactionBody
         * @property {proto.ITransactionID|null} [transactionID] A transaction identifier.
         * @property {proto.IAccountID|null} [nodeAccountID] A node account identifier.
         * @property {Long|null} [transactionFee] A maximum transaction fee, in tinybar.
         * @property {proto.IDuration|null} [transactionValidDuration] A maximum duration in which to execute this transaction.
         * @property {string|null} [memo] A short description for this transaction.
         * @property {proto.IKey|null} [batchKey] The public key of the trusted batch assembler.
         * @property {proto.ITokenBurnTransactionBody|null} [tokenBurn] Burn tokens from the treasury account.
         * @property {Array.<proto.ICustomFeeLimit>|null} [maxCustomFees] A list of maximum custom fees that the users are willing to pay.
         */

        /**
         * Constructs a new TransactionBody.
         * @memberof proto
         * @classdesc A transaction body for token burning.
         * @implements ITransactionBody
         * @constructor
         * @param {proto.ITransactionBody=} [p] Properties to set
         */
        function TransactionBody(p) {
            this.maxCustomFees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A transaction identifier.
         * @member {proto.ITransactionID|null|undefined} transactionID
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.transactionID = null;

        /**
         * A node account identifier.
         * @member {proto.IAccountID|null|undefined} nodeAccountID
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.nodeAccountID = null;

        /**
         * A maximum transaction fee, in tinybar.
         * @member {Long} transactionFee
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.transactionFee = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * A maximum duration in which to execute this transaction.
         * @member {proto.IDuration|null|undefined} transactionValidDuration
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.transactionValidDuration = null;

        /**
         * A short description for this transaction.
         * @member {string} memo
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.memo = "";

        /**
         * The public key of the trusted batch assembler.
         * @member {proto.IKey|null|undefined} batchKey
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.batchKey = null;

        /**
         * Burn tokens from the treasury account.
         * @member {proto.ITokenBurnTransactionBody|null|undefined} tokenBurn
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.tokenBurn = null;

        /**
         * A list of maximum custom fees that the users are willing to pay.
         * @member {Array.<proto.ICustomFeeLimit>} maxCustomFees
         * @memberof proto.TransactionBody
         * @instance
         */
        TransactionBody.prototype.maxCustomFees = $util.emptyArray;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * TransactionBody data.
         * @member {"tokenBurn"|undefined} data
         * @memberof proto.TransactionBody
         * @instance
         */
        Object.defineProperty(TransactionBody.prototype, "data", {
            get: $util.oneOfGetter($oneOfFields = ["tokenBurn"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new TransactionBody instance using the specified properties.
         * @function create
         * @memberof proto.TransactionBody
         * @static
         * @param {proto.ITransactionBody=} [properties] Properties to set
         * @returns {proto.TransactionBody} TransactionBody instance
         */
        TransactionBody.create = function create(properties) {
            return new TransactionBody(properties);
        };

        /**
         * Encodes the specified TransactionBody message. Does not implicitly {@link proto.TransactionBody.verify|verify} messages.
         * @function encode
         * @memberof proto.TransactionBody
         * @static
         * @param {proto.ITransactionBody} m TransactionBody message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TransactionBody.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.transactionID != null && Object.hasOwnProperty.call(m, "transactionID"))
                $root.proto.TransactionID.encode(m.transactionID, w.uint32(10).fork()).ldelim();
            if (m.nodeAccountID != null && Object.hasOwnProperty.call(m, "nodeAccountID"))
                $root.proto.AccountID.encode(m.nodeAccountID, w.uint32(18).fork()).ldelim();
            if (m.transactionFee != null && Object.hasOwnProperty.call(m, "transactionFee"))
                w.uint32(24).uint64(m.transactionFee);
            if (m.transactionValidDuration != null && Object.hasOwnProperty.call(m, "transactionValidDuration"))
                $root.proto.Duration.encode(m.transactionValidDuration, w.uint32(34).fork()).ldelim();
            if (m.memo != null && Object.hasOwnProperty.call(m, "memo"))
                w.uint32(50).string(m.memo);
            if (m.tokenBurn != null && Object.hasOwnProperty.call(m, "tokenBurn"))
                $root.proto.TokenBurnTransactionBody.encode(m.tokenBurn, w.uint32(242).fork()).ldelim();
            if (m.batchKey != null && Object.hasOwnProperty.call(m, "batchKey"))
                $root.proto.Key.encode(m.batchKey, w.uint32(586).fork()).ldelim();
            if (m.maxCustomFees != null && m.maxCustomFees.length) {
                for (var i = 0; i < m.maxCustomFees.length; ++i)
                    $root.proto.CustomFeeLimit.encode(m.maxCustomFees[i], w.uint32(8010).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a TransactionBody message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TransactionBody
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TransactionBody} TransactionBody
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TransactionBody.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TransactionBody();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.transactionID = $root.proto.TransactionID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.nodeAccountID = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.transactionFee = r.uint64();
                        break;
                    }
                case 4: {
                        m.transactionValidDuration = $root.proto.Duration.decode(r, r.uint32());
                        break;
                    }
                case 6: {
                        m.memo = r.string();
                        break;
                    }
                case 73: {
                        m.batchKey = $root.proto.Key.decode(r, r.uint32());
                        break;
                    }
                case 30: {
                        m.tokenBurn = $root.proto.TokenBurnTransactionBody.decode(r, r.uint32());
                        break;
                    }
                case 1001: {
                        if (!(m.maxCustomFees && m.maxCustomFees.length))
                            m.maxCustomFees = [];
                        m.maxCustomFees.push($root.proto.CustomFeeLimit.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TransactionBody
         * @function getTypeUrl
         * @memberof proto.TransactionBody
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TransactionBody.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionBody";
        };

        return TransactionBody;
    })();

    proto.TransactionList = (function() {

        /**
         * Properties of a TransactionList.
         * @memberof proto
         * @interface ITransactionList
         * @property {Array.<proto.ITransaction>|null} [transactionList] TransactionList transactionList
         */

        /**
         * Constructs a new TransactionList.
         * @memberof proto
         * @classdesc Represents a TransactionList.
         * @implements ITransactionList
         * @constructor
         * @param {proto.ITransactionList=} [p] Properties to set
         */
        function TransactionList(p) {
            this.transactionList = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * TransactionList transactionList.
         * @member {Array.<proto.ITransaction>} transactionList
         * @memberof proto.TransactionList
         * @instance
         */
        TransactionList.prototype.transactionList = $util.emptyArray;

        /**
         * Creates a new TransactionList instance using the specified properties.
         * @function create
         * @memberof proto.TransactionList
         * @static
         * @param {proto.ITransactionList=} [properties] Properties to set
         * @returns {proto.TransactionList} TransactionList instance
         */
        TransactionList.create = function create(properties) {
            return new TransactionList(properties);
        };

        /**
         * Encodes the specified TransactionList message. Does not implicitly {@link proto.TransactionList.verify|verify} messages.
         * @function encode
         * @memberof proto.TransactionList
         * @static
         * @param {proto.ITransactionList} m TransactionList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TransactionList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.transactionList != null && m.transactionList.length) {
                for (var i = 0; i < m.transactionList.length; ++i)
                    $root.proto.Transaction.encode(m.transactionList[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a TransactionList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TransactionList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TransactionList} TransactionList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TransactionList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TransactionList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.transactionList && m.transactionList.length))
                            m.transactionList = [];
                        m.transactionList.push($root.proto.Transaction.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TransactionList
         * @function getTypeUrl
         * @memberof proto.TransactionList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TransactionList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionList";
        };

        return TransactionList;
    })();

    proto.TokenBurnTransactionBody = (function() {

        /**
         * Properties of a TokenBurnTransactionBody.
         * @memberof proto
         * @interface ITokenBurnTransactionBody
         * @property {proto.ITokenID|null} [token] The token for which to burn tokens.
         * @property {Long|null} [amount] Applicable to tokens of type FUNGIBLE_COMMON.
         * The amount to burn from the Treasury Account.
         * @property {Array.<Long>|null} [serialNumbers] Applicable to tokens of type NON_FUNGIBLE_UNIQUE.
         * The list of serial numbers to be burned.
         */

        /**
         * Constructs a new TokenBurnTransactionBody.
         * @memberof proto
         * @classdesc Burns tokens from the Token's treasury Account.
         * @implements ITokenBurnTransactionBody
         * @constructor
         * @param {proto.ITokenBurnTransactionBody=} [p] Properties to set
         */
        function TokenBurnTransactionBody(p) {
            this.serialNumbers = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * The token for which to burn tokens.
         * @member {proto.ITokenID|null|undefined} token
         * @memberof proto.TokenBurnTransactionBody
         * @instance
         */
        TokenBurnTransactionBody.prototype.token = null;

        /**
         * Applicable to tokens of type FUNGIBLE_COMMON.
         * The amount to burn from the Treasury Account.
         * @member {Long} amount
         * @memberof proto.TokenBurnTransactionBody
         * @instance
         */
        TokenBurnTransactionBody.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Applicable to tokens of type NON_FUNGIBLE_UNIQUE.
         * The list of serial numbers to be burned.
         * @member {Array.<Long>} serialNumbers
         * @memberof proto.TokenBurnTransactionBody
         * @instance
         */
        TokenBurnTransactionBody.prototype.serialNumbers = $util.emptyArray;

        /**
         * Creates a new TokenBurnTransactionBody instance using the specified properties.
         * @function create
         * @memberof proto.TokenBurnTransactionBody
         * @static
         * @param {proto.ITokenBurnTransactionBody=} [properties] Properties to set
         * @returns {proto.TokenBurnTransactionBody} TokenBurnTransactionBody instance
         */
        TokenBurnTransactionBody.create = function create(properties) {
            return new TokenBurnTransactionBody(properties);
        };

        /**
         * Encodes the specified TokenBurnTransactionBody message. Does not implicitly {@link proto.TokenBurnTransactionBody.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenBurnTransactionBody
         * @static
         * @param {proto.ITokenBurnTransactionBody} m TokenBurnTransactionBody message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenBurnTransactionBody.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.token != null && Object.hasOwnProperty.call(m, "token"))
                $root.proto.TokenID.encode(m.token, w.uint32(10).fork()).ldelim();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(16).uint64(m.amount);
            if (m.serialNumbers != null && m.serialNumbers.length) {
                w.uint32(26).fork();
                for (var i = 0; i < m.serialNumbers.length; ++i)
                    w.int64(m.serialNumbers[i]);
                w.ldelim();
            }
            return w;
        };

        /**
         * Decodes a TokenBurnTransactionBody message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenBurnTransactionBody
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenBurnTransactionBody} TokenBurnTransactionBody
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenBurnTransactionBody.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenBurnTransactionBody();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.token = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.amount = r.uint64();
                        break;
                    }
                case 3: {
                        if (!(m.serialNumbers && m.serialNumbers.length))
                            m.serialNumbers = [];
                        if ((t & 7) === 2) {
                            var c2 = r.uint32() + r.pos;
                            while (r.pos < c2)
                                m.serialNumbers.push(r.int64());
                        } else
                            m.serialNumbers.push(r.int64());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenBurnTransactionBody
         * @function getTypeUrl
         * @memberof proto.TokenBurnTransactionBody
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenBurnTransactionBody.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenBurnTransactionBody";
        };

        return TokenBurnTransactionBody;
    })();

    proto.ShardID = (function() {

        /**
         * Properties of a ShardID.
         * @memberof proto
         * @interface IShardID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         */

        /**
         * Constructs a new ShardID.
         * @memberof proto
         * @classdesc A shard identifier.<br/>
         * A shard is a partition of nodes running the network that processes
         * transactions separately from other shards. Each shard is effectively an
         * independent instance of the overall network that shares the same virtual
         * distributed ledger, and may gossip cross-shard transactions with other
         * shards to maintain overall correct processing of the ledger.
         * @implements IShardID
         * @constructor
         * @param {proto.IShardID=} [p] Properties to set
         */
        function ShardID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.ShardID
         * @instance
         */
        ShardID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new ShardID instance using the specified properties.
         * @function create
         * @memberof proto.ShardID
         * @static
         * @param {proto.IShardID=} [properties] Properties to set
         * @returns {proto.ShardID} ShardID instance
         */
        ShardID.create = function create(properties) {
            return new ShardID(properties);
        };

        /**
         * Encodes the specified ShardID message. Does not implicitly {@link proto.ShardID.verify|verify} messages.
         * @function encode
         * @memberof proto.ShardID
         * @static
         * @param {proto.IShardID} m ShardID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ShardID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            return w;
        };

        /**
         * Decodes a ShardID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ShardID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ShardID} ShardID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ShardID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ShardID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ShardID
         * @function getTypeUrl
         * @memberof proto.ShardID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ShardID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ShardID";
        };

        return ShardID;
    })();

    proto.RealmID = (function() {

        /**
         * Properties of a RealmID.
         * @memberof proto
         * @interface IRealmID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         * @property {Long|null} [realmNum] A whole number realm identifier.
         */

        /**
         * Constructs a new RealmID.
         * @memberof proto
         * @classdesc A realm identifier.<br/>
         * Within a given shard, every realm has a unique numeric identifier.
         * Each account, file, and contract instance belongs to exactly one realm.
         * @implements IRealmID
         * @constructor
         * @param {proto.IRealmID=} [p] Properties to set
         */
        function RealmID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.RealmID
         * @instance
         */
        RealmID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm identifier.
         * @member {Long} realmNum
         * @memberof proto.RealmID
         * @instance
         */
        RealmID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new RealmID instance using the specified properties.
         * @function create
         * @memberof proto.RealmID
         * @static
         * @param {proto.IRealmID=} [properties] Properties to set
         * @returns {proto.RealmID} RealmID instance
         */
        RealmID.create = function create(properties) {
            return new RealmID(properties);
        };

        /**
         * Encodes the specified RealmID message. Does not implicitly {@link proto.RealmID.verify|verify} messages.
         * @function encode
         * @memberof proto.RealmID
         * @static
         * @param {proto.IRealmID} m RealmID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RealmID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            return w;
        };

        /**
         * Decodes a RealmID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.RealmID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.RealmID} RealmID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RealmID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.RealmID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for RealmID
         * @function getTypeUrl
         * @memberof proto.RealmID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        RealmID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.RealmID";
        };

        return RealmID;
    })();

    proto.TokenID = (function() {

        /**
         * Properties of a TokenID.
         * @memberof proto
         * @interface ITokenID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         * @property {Long|null} [realmNum] A whole number realm identifier.
         * @property {Long|null} [tokenNum] A whole number token identifier.
         */

        /**
         * Constructs a new TokenID.
         * @memberof proto
         * @classdesc Unique identifier for a token.<br/>
         * As with all entity identifiers within the network, a token identifier
         * consists of a combination of shard number, realm number, and entity number.
         * Each of these numbers is unique within its scope (shard > realm > entity).
         * @implements ITokenID
         * @constructor
         * @param {proto.ITokenID=} [p] Properties to set
         */
        function TokenID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.TokenID
         * @instance
         */
        TokenID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm identifier.
         * @member {Long} realmNum
         * @memberof proto.TokenID
         * @instance
         */
        TokenID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number token identifier.
         * @member {Long} tokenNum
         * @memberof proto.TokenID
         * @instance
         */
        TokenID.prototype.tokenNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new TokenID instance using the specified properties.
         * @function create
         * @memberof proto.TokenID
         * @static
         * @param {proto.ITokenID=} [properties] Properties to set
         * @returns {proto.TokenID} TokenID instance
         */
        TokenID.create = function create(properties) {
            return new TokenID(properties);
        };

        /**
         * Encodes the specified TokenID message. Does not implicitly {@link proto.TokenID.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenID
         * @static
         * @param {proto.ITokenID} m TokenID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            if (m.tokenNum != null && Object.hasOwnProperty.call(m, "tokenNum"))
                w.uint32(24).int64(m.tokenNum);
            return w;
        };

        /**
         * Decodes a TokenID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenID} TokenID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                case 3: {
                        m.tokenNum = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenID
         * @function getTypeUrl
         * @memberof proto.TokenID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenID";
        };

        return TokenID;
    })();

    /**
     * A specific hash algorithm.
     * 
     * We did not reuse Record Stream `HashAlgorithm` here because in all cases,
     * currently, this will be `SHA2_384` and if that is the default value then
     * we can save space by not serializing it, whereas `HASH_ALGORITHM_UNKNOWN`
     * is the default for Record Stream `HashAlgorithm`.
     * 
     * Note that enum values here MUST NOT match the name of any other enum value
     * in the same `package`, as protobuf follows `C++` scope rules and all enum
     * _names_ are treated as global constants within the `package`.
     * @name proto.BlockHashAlgorithm
     * @enum {number}
     * @property {number} SHA2_384=0 A SHA2 algorithm SHA-384 hash.
     * <p>
     * This is the default value, if a field of this enumerated type is
     * not set, then this is the value that will be decoded when the
     * serialized message is read.
     */
    proto.BlockHashAlgorithm = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "SHA2_384"] = 0;
        return values;
    })();

    proto.AccountID = (function() {

        /**
         * Properties of an AccountID.
         * @memberof proto
         * @interface IAccountID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         * @property {Long|null} [realmNum] A whole number realm identifier.
         * @property {Long|null} [accountNum] A whole number account number, unique within its realm and shard.
         * <p>
         * For any AccountID fields in the query response, transaction records,
         * transaction receipts, or block stream `accountNum` MUST be used.
         * @property {Uint8Array|null} [alias] An alias value.<br/>
         * Alias is a value used in some contexts to refer to an account when
         * account number is not available, and may be an alias public key, or
         * an EVM address.
         */

        /**
         * Constructs a new AccountID.
         * @memberof proto
         * @classdesc A unique identifier for an Hedera account.
         * 
         * An account identifier is of the form `shard.realm.[number|alias]`.<br/>
         * The identifier MAY use the alias form when transferring HBAR to a public key
         * before the account for that key is created, when only the alias value is
         * known, or in some smart contracts that use the EVM address style alias to
         * refer to Accounts.<br/>
         * When the account entry is completed, the alias SHALL be stored separately in
         * the Account record, and the identifier in the Account SHALL use the
         * `accountNum` form.
         * 
         * ---
         * ### Additional Notes
         * 
         * #### Alias
         * There is considerable complexity with `alias` (aka `evm_address`) for
         * Accounts. Much of this comes from the existence of a "hidden" alias for
         * almost all accounts, and the reuse of the alias field for both EVM reference
         * and "automatic" account creation.<br/>
         * For the purposes of this specification, we will use the following terms for
         * clarity.
         * - `key_alias`<br/>
         * The account public key as a protobuf serialized message and used for
         * auto-creation and subsequent lookup. This is only valid if the account
         * key is a single `primitive` key, either Ed25519 or ECDSA_SECP256K1.
         * - `evm_address`<br/>
         * Exists for every account and is one of
         * - `contract_address`<br/>
         * The 20 byte EVM address prescribed by `CREATE` or `CREATE2`
         * - `evm_key_address`<br/>
         * An arbitrary 20 byte EVM address that, for a usable externally owned
         * account (EOA) SHALL be the rightmost 20 bytes of the Keccak-256 hash
         * of a ECDSA_SECP256K1 key.<br/>
         * Such accounts may be created in one of three ways:
         * - Sending hbar or fungible tokens to an unused
         * ECDSA_SECP256K1 key alias.
         * - Sending hbar or fungible tokens to an unassigned 20-byte
         * EVM address.
         * - Submitting a `CryptoCreate` signed with the corresponding
         * private key.
         * - `long_zero`<br/>
         * A synthetic 20 byte address inferred for "normally" created accounts.
         * It is constructed from the "standard" AccountID as follows.
         * 1. 4 byte big-endian shard number
         * 1. 8 byte big-endian realm number
         * 1. 8 byte big-endian entity number<br/>
         * 
         * The `alias` field in the `Account` message SHALL contain one of four values
         * for any given account.
         * - The `key_alias`, if the account was created by transferring HBAR to the
         * `key_alias` public key value.
         * - The `evm_key_address` if the account was created from an EVM public key
         * - The `contract_address` if the account belongs to an EVM contract
         * - Not-Set/null/Bytes.EMPTY (collectively `null`) if the account was
         * created normally
         * 
         * If the `alias` field of an `Account` is any form of `null`, then the account
         * MAY be referred to by `alias` in an `AccountID` by using the `long_zero`
         * address for the account.<br/>
         * This "hidden default" alias SHALL NOT be stored, but is synthesized by the
         * node software as needed, and may be synthesized by an EVM contract or client
         * software as well.
         * 
         * ---
         * 
         * #### Alias forms
         * An `AccountID` in a transaction MAY reference an `Account` with
         * `shard.realm.alias`.<br/>
         * If the account `alias` field is set for an Account, that value SHALL be the
         * account alias.<br/>
         * If the account `alias` field is not set for an Account, the `long_zero` alias
         * SHALL be the account alias.
         * @implements IAccountID
         * @constructor
         * @param {proto.IAccountID=} [p] Properties to set
         */
        function AccountID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.AccountID
         * @instance
         */
        AccountID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm identifier.
         * @member {Long} realmNum
         * @memberof proto.AccountID
         * @instance
         */
        AccountID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number account number, unique within its realm and shard.
         * <p>
         * For any AccountID fields in the query response, transaction records,
         * transaction receipts, or block stream `accountNum` MUST be used.
         * @member {Long|null|undefined} accountNum
         * @memberof proto.AccountID
         * @instance
         */
        AccountID.prototype.accountNum = null;

        /**
         * An alias value.<br/>
         * Alias is a value used in some contexts to refer to an account when
         * account number is not available, and may be an alias public key, or
         * an EVM address.
         * @member {Uint8Array|null|undefined} alias
         * @memberof proto.AccountID
         * @instance
         */
        AccountID.prototype.alias = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * AccountID account.
         * @member {"accountNum"|"alias"|undefined} account
         * @memberof proto.AccountID
         * @instance
         */
        Object.defineProperty(AccountID.prototype, "account", {
            get: $util.oneOfGetter($oneOfFields = ["accountNum", "alias"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new AccountID instance using the specified properties.
         * @function create
         * @memberof proto.AccountID
         * @static
         * @param {proto.IAccountID=} [properties] Properties to set
         * @returns {proto.AccountID} AccountID instance
         */
        AccountID.create = function create(properties) {
            return new AccountID(properties);
        };

        /**
         * Encodes the specified AccountID message. Does not implicitly {@link proto.AccountID.verify|verify} messages.
         * @function encode
         * @memberof proto.AccountID
         * @static
         * @param {proto.IAccountID} m AccountID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            if (m.accountNum != null && Object.hasOwnProperty.call(m, "accountNum"))
                w.uint32(24).int64(m.accountNum);
            if (m.alias != null && Object.hasOwnProperty.call(m, "alias"))
                w.uint32(34).bytes(m.alias);
            return w;
        };

        /**
         * Decodes an AccountID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.AccountID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.AccountID} AccountID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.AccountID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                case 3: {
                        m.accountNum = r.int64();
                        break;
                    }
                case 4: {
                        m.alias = r.bytes();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for AccountID
         * @function getTypeUrl
         * @memberof proto.AccountID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        AccountID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.AccountID";
        };

        return AccountID;
    })();

    proto.NftID = (function() {

        /**
         * Properties of a NftID.
         * @memberof proto
         * @interface INftID
         * @property {proto.ITokenID|null} [token_ID] A token identifier.<br/>
         * This token represents the collection containing this NFT.
         * @property {Long|null} [serialNumber] A unique serial number.<br/>
         * This serial number is unique within its token type.
         */

        /**
         * Constructs a new NftID.
         * @memberof proto
         * @classdesc An identifier for a unique token (or "NFT"), used by both contract
         * and token services.
         * @implements INftID
         * @constructor
         * @param {proto.INftID=} [p] Properties to set
         */
        function NftID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A token identifier.<br/>
         * This token represents the collection containing this NFT.
         * @member {proto.ITokenID|null|undefined} token_ID
         * @memberof proto.NftID
         * @instance
         */
        NftID.prototype.token_ID = null;

        /**
         * A unique serial number.<br/>
         * This serial number is unique within its token type.
         * @member {Long} serialNumber
         * @memberof proto.NftID
         * @instance
         */
        NftID.prototype.serialNumber = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new NftID instance using the specified properties.
         * @function create
         * @memberof proto.NftID
         * @static
         * @param {proto.INftID=} [properties] Properties to set
         * @returns {proto.NftID} NftID instance
         */
        NftID.create = function create(properties) {
            return new NftID(properties);
        };

        /**
         * Encodes the specified NftID message. Does not implicitly {@link proto.NftID.verify|verify} messages.
         * @function encode
         * @memberof proto.NftID
         * @static
         * @param {proto.INftID} m NftID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NftID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.token_ID != null && Object.hasOwnProperty.call(m, "token_ID"))
                $root.proto.TokenID.encode(m.token_ID, w.uint32(10).fork()).ldelim();
            if (m.serialNumber != null && Object.hasOwnProperty.call(m, "serialNumber"))
                w.uint32(16).int64(m.serialNumber);
            return w;
        };

        /**
         * Decodes a NftID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.NftID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.NftID} NftID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NftID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.NftID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.token_ID = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.serialNumber = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for NftID
         * @function getTypeUrl
         * @memberof proto.NftID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        NftID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NftID";
        };

        return NftID;
    })();

    proto.FileID = (function() {

        /**
         * Properties of a FileID.
         * @memberof proto
         * @interface IFileID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         * @property {Long|null} [realmNum] A whole number realm identifier.
         * @property {Long|null} [fileNum] A whole number file identifier, unique within its realm and shard.
         */

        /**
         * Constructs a new FileID.
         * @memberof proto
         * @classdesc An identifier for a File within the network.
         * @implements IFileID
         * @constructor
         * @param {proto.IFileID=} [p] Properties to set
         */
        function FileID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.FileID
         * @instance
         */
        FileID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm identifier.
         * @member {Long} realmNum
         * @memberof proto.FileID
         * @instance
         */
        FileID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number file identifier, unique within its realm and shard.
         * @member {Long} fileNum
         * @memberof proto.FileID
         * @instance
         */
        FileID.prototype.fileNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new FileID instance using the specified properties.
         * @function create
         * @memberof proto.FileID
         * @static
         * @param {proto.IFileID=} [properties] Properties to set
         * @returns {proto.FileID} FileID instance
         */
        FileID.create = function create(properties) {
            return new FileID(properties);
        };

        /**
         * Encodes the specified FileID message. Does not implicitly {@link proto.FileID.verify|verify} messages.
         * @function encode
         * @memberof proto.FileID
         * @static
         * @param {proto.IFileID} m FileID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FileID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            if (m.fileNum != null && Object.hasOwnProperty.call(m, "fileNum"))
                w.uint32(24).int64(m.fileNum);
            return w;
        };

        /**
         * Decodes a FileID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FileID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FileID} FileID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FileID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FileID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                case 3: {
                        m.fileNum = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FileID
         * @function getTypeUrl
         * @memberof proto.FileID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FileID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FileID";
        };

        return FileID;
    })();

    proto.ContractID = (function() {

        /**
         * Properties of a ContractID.
         * @memberof proto
         * @interface IContractID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         * @property {Long|null} [realmNum] A whole number realm identifier.
         * @property {Long|null} [contractNum] A whole number contract identifier, unique within its realm and shard.
         * @property {Uint8Array|null} [evmAddress] A 20-byte EVM address of the contract to call.
         * <p>
         * A contract created via a HAPI `ContractCreate` call SHALL have
         * an EVM address determined by its `shard.realm.num` identifier.<br/>
         * This address is as follows
         * <ol>
         * <li>4 byte big-endian shard number</li>
         * <li>8 byte big-endian realm number</li>
         * <li>8 byte big-endian contract number</li>
         * </ol>
         * This address is not stored in state, but is computed when needed.
         * <p>
         * Contracts created by any other means, including a HAPI
         * `EthereumTransaction` whose `to` address is the zero address,
         * SHALL have the EVM address prescribed by the `CREATE` or
         * `CREATE2` opcode, as applicable.
         */

        /**
         * Constructs a new ContractID.
         * @memberof proto
         * @classdesc An identifier for a smart contract within the network.
         * @implements IContractID
         * @constructor
         * @param {proto.IContractID=} [p] Properties to set
         */
        function ContractID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.ContractID
         * @instance
         */
        ContractID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm identifier.
         * @member {Long} realmNum
         * @memberof proto.ContractID
         * @instance
         */
        ContractID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number contract identifier, unique within its realm and shard.
         * @member {Long|null|undefined} contractNum
         * @memberof proto.ContractID
         * @instance
         */
        ContractID.prototype.contractNum = null;

        /**
         * A 20-byte EVM address of the contract to call.
         * <p>
         * A contract created via a HAPI `ContractCreate` call SHALL have
         * an EVM address determined by its `shard.realm.num` identifier.<br/>
         * This address is as follows
         * <ol>
         * <li>4 byte big-endian shard number</li>
         * <li>8 byte big-endian realm number</li>
         * <li>8 byte big-endian contract number</li>
         * </ol>
         * This address is not stored in state, but is computed when needed.
         * <p>
         * Contracts created by any other means, including a HAPI
         * `EthereumTransaction` whose `to` address is the zero address,
         * SHALL have the EVM address prescribed by the `CREATE` or
         * `CREATE2` opcode, as applicable.
         * @member {Uint8Array|null|undefined} evmAddress
         * @memberof proto.ContractID
         * @instance
         */
        ContractID.prototype.evmAddress = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * ContractID contract.
         * @member {"contractNum"|"evmAddress"|undefined} contract
         * @memberof proto.ContractID
         * @instance
         */
        Object.defineProperty(ContractID.prototype, "contract", {
            get: $util.oneOfGetter($oneOfFields = ["contractNum", "evmAddress"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ContractID instance using the specified properties.
         * @function create
         * @memberof proto.ContractID
         * @static
         * @param {proto.IContractID=} [properties] Properties to set
         * @returns {proto.ContractID} ContractID instance
         */
        ContractID.create = function create(properties) {
            return new ContractID(properties);
        };

        /**
         * Encodes the specified ContractID message. Does not implicitly {@link proto.ContractID.verify|verify} messages.
         * @function encode
         * @memberof proto.ContractID
         * @static
         * @param {proto.IContractID} m ContractID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ContractID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            if (m.contractNum != null && Object.hasOwnProperty.call(m, "contractNum"))
                w.uint32(24).int64(m.contractNum);
            if (m.evmAddress != null && Object.hasOwnProperty.call(m, "evmAddress"))
                w.uint32(34).bytes(m.evmAddress);
            return w;
        };

        /**
         * Decodes a ContractID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ContractID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ContractID} ContractID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ContractID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ContractID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                case 3: {
                        m.contractNum = r.int64();
                        break;
                    }
                case 4: {
                        m.evmAddress = r.bytes();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ContractID
         * @function getTypeUrl
         * @memberof proto.ContractID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ContractID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ContractID";
        };

        return ContractID;
    })();

    proto.TopicID = (function() {

        /**
         * Properties of a TopicID.
         * @memberof proto
         * @interface ITopicID
         * @property {Long|null} [shardNum] A whole number shard identifier.
         * @property {Long|null} [realmNum] A whole number realm identifier.
         * @property {Long|null} [topicNum] A whole number topic identifier, unique within its realm and shard.
         */

        /**
         * Constructs a new TopicID.
         * @memberof proto
         * @classdesc An unique identifier for a topic.<br/>
         * Topics are part of the consensus service, messages are published to a topic.
         * @implements ITopicID
         * @constructor
         * @param {proto.ITopicID=} [p] Properties to set
         */
        function TopicID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard identifier.
         * @member {Long} shardNum
         * @memberof proto.TopicID
         * @instance
         */
        TopicID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm identifier.
         * @member {Long} realmNum
         * @memberof proto.TopicID
         * @instance
         */
        TopicID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number topic identifier, unique within its realm and shard.
         * @member {Long} topicNum
         * @memberof proto.TopicID
         * @instance
         */
        TopicID.prototype.topicNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new TopicID instance using the specified properties.
         * @function create
         * @memberof proto.TopicID
         * @static
         * @param {proto.ITopicID=} [properties] Properties to set
         * @returns {proto.TopicID} TopicID instance
         */
        TopicID.create = function create(properties) {
            return new TopicID(properties);
        };

        /**
         * Encodes the specified TopicID message. Does not implicitly {@link proto.TopicID.verify|verify} messages.
         * @function encode
         * @memberof proto.TopicID
         * @static
         * @param {proto.ITopicID} m TopicID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TopicID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            if (m.topicNum != null && Object.hasOwnProperty.call(m, "topicNum"))
                w.uint32(24).int64(m.topicNum);
            return w;
        };

        /**
         * Decodes a TopicID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TopicID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TopicID} TopicID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TopicID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TopicID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                case 3: {
                        m.topicNum = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TopicID
         * @function getTypeUrl
         * @memberof proto.TopicID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TopicID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TopicID";
        };

        return TopicID;
    })();

    proto.ScheduleID = (function() {

        /**
         * Properties of a ScheduleID.
         * @memberof proto
         * @interface IScheduleID
         * @property {Long|null} [shardNum] A whole number shard
         * @property {Long|null} [realmNum] A whole number realm
         * @property {Long|null} [scheduleNum] A whole number schedule, unique within its realm and shard
         */

        /**
         * Constructs a new ScheduleID.
         * @memberof proto
         * @classdesc An unique identifier for a Schedule
         * @implements IScheduleID
         * @constructor
         * @param {proto.IScheduleID=} [p] Properties to set
         */
        function ScheduleID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A whole number shard
         * @member {Long} shardNum
         * @memberof proto.ScheduleID
         * @instance
         */
        ScheduleID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number realm
         * @member {Long} realmNum
         * @memberof proto.ScheduleID
         * @instance
         */
        ScheduleID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A whole number schedule, unique within its realm and shard
         * @member {Long} scheduleNum
         * @memberof proto.ScheduleID
         * @instance
         */
        ScheduleID.prototype.scheduleNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new ScheduleID instance using the specified properties.
         * @function create
         * @memberof proto.ScheduleID
         * @static
         * @param {proto.IScheduleID=} [properties] Properties to set
         * @returns {proto.ScheduleID} ScheduleID instance
         */
        ScheduleID.create = function create(properties) {
            return new ScheduleID(properties);
        };

        /**
         * Encodes the specified ScheduleID message. Does not implicitly {@link proto.ScheduleID.verify|verify} messages.
         * @function encode
         * @memberof proto.ScheduleID
         * @static
         * @param {proto.IScheduleID} m ScheduleID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScheduleID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            if (m.scheduleNum != null && Object.hasOwnProperty.call(m, "scheduleNum"))
                w.uint32(24).int64(m.scheduleNum);
            return w;
        };

        /**
         * Decodes a ScheduleID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ScheduleID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ScheduleID} ScheduleID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScheduleID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ScheduleID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.shardNum = r.int64();
                        break;
                    }
                case 2: {
                        m.realmNum = r.int64();
                        break;
                    }
                case 3: {
                        m.scheduleNum = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ScheduleID
         * @function getTypeUrl
         * @memberof proto.ScheduleID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ScheduleID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ScheduleID";
        };

        return ScheduleID;
    })();

    proto.TransactionID = (function() {

        /**
         * Properties of a TransactionID.
         * @memberof proto
         * @interface ITransactionID
         * @property {proto.ITimestamp|null} [transactionValidStart] A timestamp for the transaction start time.<br/>
         * This is the earliest expected start time for this transaction.
         * <p>
         * This value MUST be strictly less than `consensusTimestamp` when the
         * transaction is submitted.
         * @property {proto.IAccountID|null} [accountID] An Account identifier.
         * <p>
         * The identified account SHALL pay transaction fees for this transaction.
         * @property {boolean|null} [scheduled] A scheduled transaction flag.<br/>
         * If set, this transaction represents the execution of a Schedule after
         * all necessary signatures are gathered.
         * <p>
         * This flag MUST NOT be set in a user-submitted transaction.
         * @property {number|null} [nonce] An identifier for an internal transaction.<br/>
         * An internal transaction is one that was spawned as part of handling a
         * user transaction. These internal transactions share the
         * transactionValidStart and accountID of the user transaction, so a nonce
         * is necessary to give them a unique TransactionID.
         * <p>
         * An example is when a "parent" ContractCreate or ContractCall transaction
         * calls one or more HTS precompiled contracts; each of the "child"
         * transactions spawned for a precompile has a transaction id with a
         * different nonce.
         * <p>
         * This value MUST be unset for user-submitted transactions.
         */

        /**
         * Constructs a new TransactionID.
         * @memberof proto
         * @classdesc A transaction identifier.<br/>
         * This is used for retrieving receipts and records for a transaction
         * and internally by the network for detecting when duplicate transactions are
         * submitted.
         * 
         * A transaction may be processed more reliably by submitting it to
         * several nodes, each with a different node account, but all with the same
         * TransactionID. Then, the transaction will take effect when the first of all
         * those nodes submits the transaction and it reaches consensus. The other
         * transactions SHALL NOT be executed (and SHALL result in a
         * `DUPLICATE_TRANSACTION` response).<br/>
         * Multiple submission increase reliability on the assumption that an error in,
         * for example, network connectivity will not affect all nodes equally. Latency
         * might be slightly lower, if one node is handling intake significantly slower
         * than others, for example. The base transaction fee is required for each
         * submission, however, so the total fees charged are significantly higher when
         * using this approach.
         * 
         * ### Requirements
         * Each transaction identifier MUST be unique.<br/>
         * Multiple transactions MAY be submitted with the same transaction
         * identifier, but all except the first SHALL be rejected as duplicate
         * transactions.<br/>
         * An identifier MUST specify a `payer` account to be charged all fees
         * associated with the transaction.<br/>
         * The `payer` account MUST exist and MUST have sufficient HBAR to pay all
         * transaction fees.<br/>
         * An identifier MUST specify a "valid start time".<br/>
         * The "valid start time" MUST be strictly _earlier_ than the current
         * network consensus time when submitted.<br/>
         * The "valid start time" MUST NOT be more than `transaction.maxValidDuration`
         * seconds before the current network consensus time when submitted.<br/>
         * A client-submitted transaction MUST NOT set the `scheduled` flag.
         * 
         * ### Additional Notes
         * 
         * Additional items applicable to Scheduled Transactions:
         * 
         * - The ID of a Scheduled Transaction, once executed, SHALL inherit both
         * `transactionValidStart` and `accountID` from the `ScheduleCreate`
         * transaction that created the schedule.
         * - The `scheduled` property SHALL be set for Scheduled Transactions.
         * @implements ITransactionID
         * @constructor
         * @param {proto.ITransactionID=} [p] Properties to set
         */
        function TransactionID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A timestamp for the transaction start time.<br/>
         * This is the earliest expected start time for this transaction.
         * <p>
         * This value MUST be strictly less than `consensusTimestamp` when the
         * transaction is submitted.
         * @member {proto.ITimestamp|null|undefined} transactionValidStart
         * @memberof proto.TransactionID
         * @instance
         */
        TransactionID.prototype.transactionValidStart = null;

        /**
         * An Account identifier.
         * <p>
         * The identified account SHALL pay transaction fees for this transaction.
         * @member {proto.IAccountID|null|undefined} accountID
         * @memberof proto.TransactionID
         * @instance
         */
        TransactionID.prototype.accountID = null;

        /**
         * A scheduled transaction flag.<br/>
         * If set, this transaction represents the execution of a Schedule after
         * all necessary signatures are gathered.
         * <p>
         * This flag MUST NOT be set in a user-submitted transaction.
         * @member {boolean} scheduled
         * @memberof proto.TransactionID
         * @instance
         */
        TransactionID.prototype.scheduled = false;

        /**
         * An identifier for an internal transaction.<br/>
         * An internal transaction is one that was spawned as part of handling a
         * user transaction. These internal transactions share the
         * transactionValidStart and accountID of the user transaction, so a nonce
         * is necessary to give them a unique TransactionID.
         * <p>
         * An example is when a "parent" ContractCreate or ContractCall transaction
         * calls one or more HTS precompiled contracts; each of the "child"
         * transactions spawned for a precompile has a transaction id with a
         * different nonce.
         * <p>
         * This value MUST be unset for user-submitted transactions.
         * @member {number} nonce
         * @memberof proto.TransactionID
         * @instance
         */
        TransactionID.prototype.nonce = 0;

        /**
         * Creates a new TransactionID instance using the specified properties.
         * @function create
         * @memberof proto.TransactionID
         * @static
         * @param {proto.ITransactionID=} [properties] Properties to set
         * @returns {proto.TransactionID} TransactionID instance
         */
        TransactionID.create = function create(properties) {
            return new TransactionID(properties);
        };

        /**
         * Encodes the specified TransactionID message. Does not implicitly {@link proto.TransactionID.verify|verify} messages.
         * @function encode
         * @memberof proto.TransactionID
         * @static
         * @param {proto.ITransactionID} m TransactionID message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TransactionID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.transactionValidStart != null && Object.hasOwnProperty.call(m, "transactionValidStart"))
                $root.proto.Timestamp.encode(m.transactionValidStart, w.uint32(10).fork()).ldelim();
            if (m.accountID != null && Object.hasOwnProperty.call(m, "accountID"))
                $root.proto.AccountID.encode(m.accountID, w.uint32(18).fork()).ldelim();
            if (m.scheduled != null && Object.hasOwnProperty.call(m, "scheduled"))
                w.uint32(24).bool(m.scheduled);
            if (m.nonce != null && Object.hasOwnProperty.call(m, "nonce"))
                w.uint32(32).int32(m.nonce);
            return w;
        };

        /**
         * Decodes a TransactionID message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TransactionID
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TransactionID} TransactionID
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TransactionID.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TransactionID();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.transactionValidStart = $root.proto.Timestamp.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.accountID = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.scheduled = r.bool();
                        break;
                    }
                case 4: {
                        m.nonce = r.int32();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TransactionID
         * @function getTypeUrl
         * @memberof proto.TransactionID
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TransactionID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionID";
        };

        return TransactionID;
    })();

    proto.AccountAmount = (function() {

        /**
         * Properties of an AccountAmount.
         * @memberof proto
         * @interface IAccountAmount
         * @property {proto.IAccountID|null} [accountID] An account identifier that will send or receive token(s).
         * @property {Long|null} [amount] An amount to send (negative) or receive (positive).
         * <p>
         * This amount MUST be denominated in the smallest unit of the relevant
         * token.<br/>
         * For HBAR this SHALL be tinybar (10<sup>-8</sup> HBAR).<br/>
         * For other fungible/common tokens this SHALL depend on the value of
         * `decimals` for that token.
         * @property {boolean|null} [isApproval] An approved allowance flag.<br/>
         * If true then the transfer is expected to be an approved allowance.
         * <p>
         * If set, `accountID` SHALL be the owner that previously approved
         * the allowance.<br/>
         * The default value SHALL be false (unset).
         */

        /**
         * Constructs a new AccountAmount.
         * @memberof proto
         * @classdesc An account, and the amount that it sends or receives during a token transfer.
         * 
         * This message is only relevant to fungible/common token transfers.
         * Non-fungible/unique (NFT) token transfers MUST use the NftTransfer message.
         * @implements IAccountAmount
         * @constructor
         * @param {proto.IAccountAmount=} [p] Properties to set
         */
        function AccountAmount(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * An account identifier that will send or receive token(s).
         * @member {proto.IAccountID|null|undefined} accountID
         * @memberof proto.AccountAmount
         * @instance
         */
        AccountAmount.prototype.accountID = null;

        /**
         * An amount to send (negative) or receive (positive).
         * <p>
         * This amount MUST be denominated in the smallest unit of the relevant
         * token.<br/>
         * For HBAR this SHALL be tinybar (10<sup>-8</sup> HBAR).<br/>
         * For other fungible/common tokens this SHALL depend on the value of
         * `decimals` for that token.
         * @member {Long} amount
         * @memberof proto.AccountAmount
         * @instance
         */
        AccountAmount.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * An approved allowance flag.<br/>
         * If true then the transfer is expected to be an approved allowance.
         * <p>
         * If set, `accountID` SHALL be the owner that previously approved
         * the allowance.<br/>
         * The default value SHALL be false (unset).
         * @member {boolean} isApproval
         * @memberof proto.AccountAmount
         * @instance
         */
        AccountAmount.prototype.isApproval = false;

        /**
         * Creates a new AccountAmount instance using the specified properties.
         * @function create
         * @memberof proto.AccountAmount
         * @static
         * @param {proto.IAccountAmount=} [properties] Properties to set
         * @returns {proto.AccountAmount} AccountAmount instance
         */
        AccountAmount.create = function create(properties) {
            return new AccountAmount(properties);
        };

        /**
         * Encodes the specified AccountAmount message. Does not implicitly {@link proto.AccountAmount.verify|verify} messages.
         * @function encode
         * @memberof proto.AccountAmount
         * @static
         * @param {proto.IAccountAmount} m AccountAmount message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountAmount.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.accountID != null && Object.hasOwnProperty.call(m, "accountID"))
                $root.proto.AccountID.encode(m.accountID, w.uint32(10).fork()).ldelim();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(16).sint64(m.amount);
            if (m.isApproval != null && Object.hasOwnProperty.call(m, "isApproval"))
                w.uint32(24).bool(m.isApproval);
            return w;
        };

        /**
         * Decodes an AccountAmount message from the specified reader or buffer.
         * @function decode
         * @memberof proto.AccountAmount
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.AccountAmount} AccountAmount
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountAmount.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.AccountAmount();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.accountID = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.amount = r.sint64();
                        break;
                    }
                case 3: {
                        m.isApproval = r.bool();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for AccountAmount
         * @function getTypeUrl
         * @memberof proto.AccountAmount
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        AccountAmount.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.AccountAmount";
        };

        return AccountAmount;
    })();

    proto.TransferList = (function() {

        /**
         * Properties of a TransferList.
         * @memberof proto
         * @interface ITransferList
         * @property {Array.<proto.IAccountAmount>|null} [accountAmounts] A list of AccountAmount pairs.<br/>
         * Each entry in this list is an account and an amount to transfer
         * into it (positive) or out of it (negative)
         */

        /**
         * Constructs a new TransferList.
         * @memberof proto
         * @classdesc A list of accounts and amounts to transfer.
         * 
         * Each `AccountAmount` SHALL specify the account and the amount to
         * send(negative) or receive(positive).<br/>
         * Each `TransferList` SHALL be contained in another message that contains
         * other details required to complete a transfer. This is typically a
         * `CryptoTransferTransactionBody` or `TransactionRecord`.<br/>
         * The `TransferList` SHALL only be used for HBAR transfers. Other token types
         * MUST use the `TokenTransferList` message.
         * @implements ITransferList
         * @constructor
         * @param {proto.ITransferList=} [p] Properties to set
         */
        function TransferList(p) {
            this.accountAmounts = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A list of AccountAmount pairs.<br/>
         * Each entry in this list is an account and an amount to transfer
         * into it (positive) or out of it (negative)
         * @member {Array.<proto.IAccountAmount>} accountAmounts
         * @memberof proto.TransferList
         * @instance
         */
        TransferList.prototype.accountAmounts = $util.emptyArray;

        /**
         * Creates a new TransferList instance using the specified properties.
         * @function create
         * @memberof proto.TransferList
         * @static
         * @param {proto.ITransferList=} [properties] Properties to set
         * @returns {proto.TransferList} TransferList instance
         */
        TransferList.create = function create(properties) {
            return new TransferList(properties);
        };

        /**
         * Encodes the specified TransferList message. Does not implicitly {@link proto.TransferList.verify|verify} messages.
         * @function encode
         * @memberof proto.TransferList
         * @static
         * @param {proto.ITransferList} m TransferList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TransferList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.accountAmounts != null && m.accountAmounts.length) {
                for (var i = 0; i < m.accountAmounts.length; ++i)
                    $root.proto.AccountAmount.encode(m.accountAmounts[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a TransferList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TransferList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TransferList} TransferList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TransferList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TransferList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.accountAmounts && m.accountAmounts.length))
                            m.accountAmounts = [];
                        m.accountAmounts.push($root.proto.AccountAmount.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TransferList
         * @function getTypeUrl
         * @memberof proto.TransferList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TransferList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransferList";
        };

        return TransferList;
    })();

    proto.NftTransfer = (function() {

        /**
         * Properties of a NftTransfer.
         * @memberof proto
         * @interface INftTransfer
         * @property {proto.IAccountID|null} [senderAccountID] An Account identifier for the sender.
         * @property {proto.IAccountID|null} [receiverAccountID] An Account identifier for the receiver.
         * @property {Long|null} [serialNumber] A serial number for the NFT to transfer.
         * @property {boolean|null} [isApproval] An approved allowance flag.<br/>
         * If true then the transfer is expected to be an approved allowance.
         * <p>
         * If set, `senderAccountID` SHALL be the owner that previously approved
         * the allowance.<br/>
         * If set, the `senderAccountID` MUST be the "payer" account for
         * the transaction <br/>
         * The default value SHALL be false (unset).
         */

        /**
         * Constructs a new NftTransfer.
         * @memberof proto
         * @classdesc A NFT transfer.<br/>
         * This refers to a sender account, a receiver account, and the serial number
         * of an NFT to transfer from sender to receiver.
         * 
         * Each `NftTransfer` SHALL be contained in another message (typically
         * `TokenTransferList`) that details which `Token` type applies to this NFT
         * transfer.
         * @implements INftTransfer
         * @constructor
         * @param {proto.INftTransfer=} [p] Properties to set
         */
        function NftTransfer(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * An Account identifier for the sender.
         * @member {proto.IAccountID|null|undefined} senderAccountID
         * @memberof proto.NftTransfer
         * @instance
         */
        NftTransfer.prototype.senderAccountID = null;

        /**
         * An Account identifier for the receiver.
         * @member {proto.IAccountID|null|undefined} receiverAccountID
         * @memberof proto.NftTransfer
         * @instance
         */
        NftTransfer.prototype.receiverAccountID = null;

        /**
         * A serial number for the NFT to transfer.
         * @member {Long} serialNumber
         * @memberof proto.NftTransfer
         * @instance
         */
        NftTransfer.prototype.serialNumber = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * An approved allowance flag.<br/>
         * If true then the transfer is expected to be an approved allowance.
         * <p>
         * If set, `senderAccountID` SHALL be the owner that previously approved
         * the allowance.<br/>
         * If set, the `senderAccountID` MUST be the "payer" account for
         * the transaction <br/>
         * The default value SHALL be false (unset).
         * @member {boolean} isApproval
         * @memberof proto.NftTransfer
         * @instance
         */
        NftTransfer.prototype.isApproval = false;

        /**
         * Creates a new NftTransfer instance using the specified properties.
         * @function create
         * @memberof proto.NftTransfer
         * @static
         * @param {proto.INftTransfer=} [properties] Properties to set
         * @returns {proto.NftTransfer} NftTransfer instance
         */
        NftTransfer.create = function create(properties) {
            return new NftTransfer(properties);
        };

        /**
         * Encodes the specified NftTransfer message. Does not implicitly {@link proto.NftTransfer.verify|verify} messages.
         * @function encode
         * @memberof proto.NftTransfer
         * @static
         * @param {proto.INftTransfer} m NftTransfer message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NftTransfer.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.senderAccountID != null && Object.hasOwnProperty.call(m, "senderAccountID"))
                $root.proto.AccountID.encode(m.senderAccountID, w.uint32(10).fork()).ldelim();
            if (m.receiverAccountID != null && Object.hasOwnProperty.call(m, "receiverAccountID"))
                $root.proto.AccountID.encode(m.receiverAccountID, w.uint32(18).fork()).ldelim();
            if (m.serialNumber != null && Object.hasOwnProperty.call(m, "serialNumber"))
                w.uint32(24).int64(m.serialNumber);
            if (m.isApproval != null && Object.hasOwnProperty.call(m, "isApproval"))
                w.uint32(32).bool(m.isApproval);
            return w;
        };

        /**
         * Decodes a NftTransfer message from the specified reader or buffer.
         * @function decode
         * @memberof proto.NftTransfer
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.NftTransfer} NftTransfer
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NftTransfer.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.NftTransfer();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.senderAccountID = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.receiverAccountID = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.serialNumber = r.int64();
                        break;
                    }
                case 4: {
                        m.isApproval = r.bool();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for NftTransfer
         * @function getTypeUrl
         * @memberof proto.NftTransfer
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        NftTransfer.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NftTransfer";
        };

        return NftTransfer;
    })();

    proto.TokenTransferList = (function() {

        /**
         * Properties of a TokenTransferList.
         * @memberof proto
         * @interface ITokenTransferList
         * @property {proto.ITokenID|null} [token] A token identifier.<br/>
         * This is the token to be transferred.
         * @property {Array.<proto.IAccountAmount>|null} [transfers] A list of account amounts.
         * <p>
         * Each entry SHALL have an account and amount.<br/>
         * These transfers SHALL be "double-entry" style; the credits (positive
         * amount) and debits (negative amount) MUST sum to 0, unless this
         * transfer list is part of a `mint` or `burn` operation.<br/>
         * This SHALL be be set for fungible/common tokens and MUST be
         * empty otherwise.
         * @property {Array.<proto.INftTransfer>|null} [nftTransfers] A list of NftTransfers.
         * <p>
         * Each entry SHALL have a sender and receiver account, and the
         * serial number of the unique token to transfer.<br/>
         * This SHALL be be set for non-fungible/unique tokens and SHALL be
         * empty otherwise.
         * @property {google.protobuf.IUInt32Value|null} [expectedDecimals] An expected decimal precision.<br/>
         * This is the number of decimals a fungible/common token type is
         * _expected_ to have.
         * <p>
         * The transfer SHALL fail with response code `UNEXPECTED_TOKEN_DECIMALS`
         * if this is set and the actual decimals specified for the `Token` differ
         * from this value.<br/>
         * If `nftTransfers` is set, then this value SHOULD NOT be set.
         */

        /**
         * Constructs a new TokenTransferList.
         * @memberof proto
         * @classdesc A list of transfers for a particular (non-HBAR) token type.
         * 
         * A `TokenTransferList` applies to a single token type, but may contain many
         * individual transfers.<br/>
         * Each transfer of a fungible/common token MUST specify an `accountID` and
         * `amount`. Amount SHALL be positive when the account receives tokens, and
         * SHALL be negative when the account sends tokens. The amount SHOULD NOT be
         * `0`.<br/>
         * In a transfer list containing fungible/common tokens in the `transfers`
         * list, the sum of all such transfers MUST be zero (`0`).
         * Each transfer of a unique token SHALL specify both sender and receiver, as
         * well as the serial number transferred.<br/>
         * A single `TokenTransferList` MUST contain `transfers` or `nftTransfers`,
         * but MUST NOT contain both.
         * @implements ITokenTransferList
         * @constructor
         * @param {proto.ITokenTransferList=} [p] Properties to set
         */
        function TokenTransferList(p) {
            this.transfers = [];
            this.nftTransfers = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A token identifier.<br/>
         * This is the token to be transferred.
         * @member {proto.ITokenID|null|undefined} token
         * @memberof proto.TokenTransferList
         * @instance
         */
        TokenTransferList.prototype.token = null;

        /**
         * A list of account amounts.
         * <p>
         * Each entry SHALL have an account and amount.<br/>
         * These transfers SHALL be "double-entry" style; the credits (positive
         * amount) and debits (negative amount) MUST sum to 0, unless this
         * transfer list is part of a `mint` or `burn` operation.<br/>
         * This SHALL be be set for fungible/common tokens and MUST be
         * empty otherwise.
         * @member {Array.<proto.IAccountAmount>} transfers
         * @memberof proto.TokenTransferList
         * @instance
         */
        TokenTransferList.prototype.transfers = $util.emptyArray;

        /**
         * A list of NftTransfers.
         * <p>
         * Each entry SHALL have a sender and receiver account, and the
         * serial number of the unique token to transfer.<br/>
         * This SHALL be be set for non-fungible/unique tokens and SHALL be
         * empty otherwise.
         * @member {Array.<proto.INftTransfer>} nftTransfers
         * @memberof proto.TokenTransferList
         * @instance
         */
        TokenTransferList.prototype.nftTransfers = $util.emptyArray;

        /**
         * An expected decimal precision.<br/>
         * This is the number of decimals a fungible/common token type is
         * _expected_ to have.
         * <p>
         * The transfer SHALL fail with response code `UNEXPECTED_TOKEN_DECIMALS`
         * if this is set and the actual decimals specified for the `Token` differ
         * from this value.<br/>
         * If `nftTransfers` is set, then this value SHOULD NOT be set.
         * @member {google.protobuf.IUInt32Value|null|undefined} expectedDecimals
         * @memberof proto.TokenTransferList
         * @instance
         */
        TokenTransferList.prototype.expectedDecimals = null;

        /**
         * Creates a new TokenTransferList instance using the specified properties.
         * @function create
         * @memberof proto.TokenTransferList
         * @static
         * @param {proto.ITokenTransferList=} [properties] Properties to set
         * @returns {proto.TokenTransferList} TokenTransferList instance
         */
        TokenTransferList.create = function create(properties) {
            return new TokenTransferList(properties);
        };

        /**
         * Encodes the specified TokenTransferList message. Does not implicitly {@link proto.TokenTransferList.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenTransferList
         * @static
         * @param {proto.ITokenTransferList} m TokenTransferList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenTransferList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.token != null && Object.hasOwnProperty.call(m, "token"))
                $root.proto.TokenID.encode(m.token, w.uint32(10).fork()).ldelim();
            if (m.transfers != null && m.transfers.length) {
                for (var i = 0; i < m.transfers.length; ++i)
                    $root.proto.AccountAmount.encode(m.transfers[i], w.uint32(18).fork()).ldelim();
            }
            if (m.nftTransfers != null && m.nftTransfers.length) {
                for (var i = 0; i < m.nftTransfers.length; ++i)
                    $root.proto.NftTransfer.encode(m.nftTransfers[i], w.uint32(26).fork()).ldelim();
            }
            if (m.expectedDecimals != null && Object.hasOwnProperty.call(m, "expectedDecimals"))
                $root.google.protobuf.UInt32Value.encode(m.expectedDecimals, w.uint32(34).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a TokenTransferList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenTransferList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenTransferList} TokenTransferList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenTransferList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenTransferList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.token = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        if (!(m.transfers && m.transfers.length))
                            m.transfers = [];
                        m.transfers.push($root.proto.AccountAmount.decode(r, r.uint32()));
                        break;
                    }
                case 3: {
                        if (!(m.nftTransfers && m.nftTransfers.length))
                            m.nftTransfers = [];
                        m.nftTransfers.push($root.proto.NftTransfer.decode(r, r.uint32()));
                        break;
                    }
                case 4: {
                        m.expectedDecimals = $root.google.protobuf.UInt32Value.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenTransferList
         * @function getTypeUrl
         * @memberof proto.TokenTransferList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenTransferList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenTransferList";
        };

        return TokenTransferList;
    })();

    proto.Fraction = (function() {

        /**
         * Properties of a Fraction.
         * @memberof proto
         * @interface IFraction
         * @property {Long|null} [numerator] A fractional number's numerator.
         * @property {Long|null} [denominator] A fractional number's denominator.
         * <p>
         * A zero value SHALL fail with response code `FRACTION_DIVIDES_BY_ZERO`.
         */

        /**
         * Constructs a new Fraction.
         * @memberof proto
         * @classdesc A rational number.<br/>
         * A common use is to set the amount of a value transfer to collect as a
         * custom fee.
         * 
         * It is RECOMMENDED that both numerator and denominator be no larger than
         * necessary to express the required fraction. A very large numerator, in
         * particular, may not be reliable.
         * Both fields are REQUIRED and SHOULD be positive integers.
         * @implements IFraction
         * @constructor
         * @param {proto.IFraction=} [p] Properties to set
         */
        function Fraction(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A fractional number's numerator.
         * @member {Long} numerator
         * @memberof proto.Fraction
         * @instance
         */
        Fraction.prototype.numerator = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A fractional number's denominator.
         * <p>
         * A zero value SHALL fail with response code `FRACTION_DIVIDES_BY_ZERO`.
         * @member {Long} denominator
         * @memberof proto.Fraction
         * @instance
         */
        Fraction.prototype.denominator = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new Fraction instance using the specified properties.
         * @function create
         * @memberof proto.Fraction
         * @static
         * @param {proto.IFraction=} [properties] Properties to set
         * @returns {proto.Fraction} Fraction instance
         */
        Fraction.create = function create(properties) {
            return new Fraction(properties);
        };

        /**
         * Encodes the specified Fraction message. Does not implicitly {@link proto.Fraction.verify|verify} messages.
         * @function encode
         * @memberof proto.Fraction
         * @static
         * @param {proto.IFraction} m Fraction message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Fraction.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.numerator != null && Object.hasOwnProperty.call(m, "numerator"))
                w.uint32(8).int64(m.numerator);
            if (m.denominator != null && Object.hasOwnProperty.call(m, "denominator"))
                w.uint32(16).int64(m.denominator);
            return w;
        };

        /**
         * Decodes a Fraction message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Fraction
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Fraction} Fraction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Fraction.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Fraction();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.numerator = r.int64();
                        break;
                    }
                case 2: {
                        m.denominator = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Fraction
         * @function getTypeUrl
         * @memberof proto.Fraction
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Fraction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Fraction";
        };

        return Fraction;
    })();

    /**
     * Possible Token Types (IWA Compatibility).
     * 
     * Apart from fungible and non-fungible, Tokens can have either a common or
     * unique representation. Furthermore, tokens can have intrinsic or referential
     * value, and can be whole and indivisible or fractional.<br/>
     * These distinction might seem subtle, but it is important when considering
     * how tokens can be traced, used, transferred, and if they can have isolated
     * unique properties.
     * 
     * A few examples (these may not match enumerations below) using IWA taxonomy.
     * <dl>
     * <dt>fungible, whole, intrinsic, unique</dt>
     * <dd>Physical fiat currency</dd>
     * <dt>fungible, fractional, intrinsic, common</dt>
     * <dd>bank balance fiat currency</dd>
     * <dt>non-fungible, fractional, reference, unique</dt>
     * <dd>"mutual" collectible/art/property ownership</dd>
     * <dt>non-fungible, whole, intrinsic, unique</dt>
     * <dd>Physical work of fine art</dd>
     * <dt>non-fungible, whole, reference, unique</dt>
     * <dd>Registered property title</dd>
     * </dl>
     * @name proto.TokenType
     * @enum {number}
     * @property {number} FUNGIBLE_COMMON=0 A fungible/common token.<br/>
     * Tokens of this type are interchangeable with one another, where any
     * quantity of tokens has the same value as another equal quantity, if
     * they are in the same class. Tokens share a single set of properties,
     * and are not distinct from one another. Ownership is represented as a
     * balance or quantity associated to a given account. Tokens may be
     * divided into fractional tokens, within reasonable limits.
     * <p>
     * IWA taxonomy _fungible, fractional, intrinsic, common_
     * @property {number} NON_FUNGIBLE_UNIQUE=1 A non-fungible/unique token.<br/>
     * Tokens of this type are unique, and are not interchangeable with other
     * tokens of the same type. Each token carries a serial number which is
     * unique for that token, these tokens may have a different trade value
     * for each individual token. The tokens are individually accounted and
     * often carry additional unique properties. Tokens cannot be subdivided,
     * and value is related to what the individual token represents.
     * <p>
     * IWA taxonomy _non-fungible, whole, reference, unique_
     */
    proto.TokenType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FUNGIBLE_COMMON"] = 0;
        values[valuesById[1] = "NON_FUNGIBLE_UNIQUE"] = 1;
        return values;
    })();

    /**
     * A transaction sub type.<br/>
     * This enumeration enables a set of transaction base fees to be broadly
     * defined for a type of operation and also be modified, when necessary,
     * based on specifics of the operation.
     * 
     * ### Explanation
     * The resource cost for a TokenMint operation is different between minting
     * fungible/common and non-fungible/unique tokens. This `enum` is used to
     * "mark" a cost as applying to one or the other.<br/>
     * Similarly, the resource cost for a basic `tokenCreate` without a custom
     * fee schedule may yield a _base_ fee of $1. The resource cost for a
     * `tokenCreate` _with_ a custom fee schedule is different and may yield a
     * _base_ fee of $2 or more.
     * @name proto.SubType
     * @enum {number}
     * @property {number} DEFAULT=0 The resource cost for the transaction type has no additional attributes
     * @property {number} TOKEN_FUNGIBLE_COMMON=1 The resource cost for the transaction type includes an operation on a
     * fungible/common token
     * @property {number} TOKEN_NON_FUNGIBLE_UNIQUE=2 The resource cost for the transaction type includes an operation on
     * a non-fungible/unique token
     * @property {number} TOKEN_FUNGIBLE_COMMON_WITH_CUSTOM_FEES=3 The resource cost for the transaction type includes an operation on a
     * fungible/common token with a custom fee schedule
     * @property {number} TOKEN_NON_FUNGIBLE_UNIQUE_WITH_CUSTOM_FEES=4 The resource cost for the transaction type includes an operation on a
     * non-fungible/unique token with a custom fee schedule
     * @property {number} SCHEDULE_CREATE_CONTRACT_CALL=5 The resource cost for the transaction type includes a ScheduleCreate
     * containing a ContractCall.
     * @property {number} TOPIC_CREATE_WITH_CUSTOM_FEES=6 The resource cost for the transaction type includes a TopicCreate
     * with custom fees.
     * @property {number} SUBMIT_MESSAGE_WITH_CUSTOM_FEES=7 The resource cost for the transaction type includes a ConsensusSubmitMessage
     * for a topic with custom fees.
     */
    proto.SubType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "DEFAULT"] = 0;
        values[valuesById[1] = "TOKEN_FUNGIBLE_COMMON"] = 1;
        values[valuesById[2] = "TOKEN_NON_FUNGIBLE_UNIQUE"] = 2;
        values[valuesById[3] = "TOKEN_FUNGIBLE_COMMON_WITH_CUSTOM_FEES"] = 3;
        values[valuesById[4] = "TOKEN_NON_FUNGIBLE_UNIQUE_WITH_CUSTOM_FEES"] = 4;
        values[valuesById[5] = "SCHEDULE_CREATE_CONTRACT_CALL"] = 5;
        values[valuesById[6] = "TOPIC_CREATE_WITH_CUSTOM_FEES"] = 6;
        values[valuesById[7] = "SUBMIT_MESSAGE_WITH_CUSTOM_FEES"] = 7;
        return values;
    })();

    /**
     * Possible Token Supply Types (IWA Compatibility).
     * 
     * This `enum` indicates the limit of tokens that can exist during the
     * lifetime of a token definition. The "infinite" supply is only theoretically
     * infinite, as it is still limited to the magnitude of a 64-bit signed
     * integer. A "finite" supply is further limited to a value specified when
     * the token is created (or updated, if not immutable).
     * @name proto.TokenSupplyType
     * @enum {number}
     * @property {number} INFINITE=0 An unlimited supply.<br/>
     * This indicates that tokens of this type have an upper bound of
     * Long.MAX_VALUE.<br/>
     * The supply is accounted in the smallest units of the token
     * (i.e. 10<sup>-`decimals`</sup> whole tokens)
     * @property {number} FINITE=1 A limited supply.<br/>
     * This indicates that tokens of this type have an upper bound of
     * `maxSupply`.<br/>
     * The maximum supply SHALL be provided on token creation, but MAY be
     * changed thereafter if the token has an `admin_key` set.
     */
    proto.TokenSupplyType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "INFINITE"] = 0;
        values[valuesById[1] = "FINITE"] = 1;
        return values;
    })();

    /**
     * Types of validation strategies for token keys.
     * @name proto.TokenKeyValidation
     * @enum {number}
     * @property {number} FULL_VALIDATION=0 Perform all token key validations.<br/>
     * This is the default value and behavior.
     * @property {number} NO_VALIDATION=1 Perform no validations at all for all passed token keys.
     */
    proto.TokenKeyValidation = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FULL_VALIDATION"] = 0;
        values[valuesById[1] = "NO_VALIDATION"] = 1;
        return values;
    })();

    /**
     * Possible token freeze status values.
     * 
     * This is returned by `TokenGetInfoQuery` or `CryptoGetInfoResponse`
     * in `TokenRelationship`.
     * @name proto.TokenFreezeStatus
     * @enum {number}
     * @property {number} FreezeNotApplicable=0 The token does not support freeze or cannot be frozen for the designated
     * account.<br/>
     * Typically this indicates that the token does not have a `freeze_key` set.
     * @property {number} Frozen=1 The token is currently frozen for the designated account.
     * @property {number} Unfrozen=2 The token is not currently frozen for the designated account.
     */
    proto.TokenFreezeStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FreezeNotApplicable"] = 0;
        values[valuesById[1] = "Frozen"] = 1;
        values[valuesById[2] = "Unfrozen"] = 2;
        return values;
    })();

    /**
     * Possible token "KYC" status values.
     * 
     * This is returned by `TokenGetInfoQuery` or `CryptoGetInfoResponse`
     * in `TokenRelationship`.
     * @name proto.TokenKycStatus
     * @enum {number}
     * @property {number} KycNotApplicable=0 The token does not support KYC or cannot grant KYC for the
     * designated account.<br/>
     * Typically this indicates that the token does not have a `kyc_key` set.
     * @property {number} Granted=1 The designated account is currently granted KYC status for the
     * designated token.
     * @property {number} Revoked=2 The designated account is not currently granted KYC status for the
     * designated token.
     */
    proto.TokenKycStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "KycNotApplicable"] = 0;
        values[valuesById[1] = "Granted"] = 1;
        values[valuesById[2] = "Revoked"] = 2;
        return values;
    })();

    /**
     * Possible Pause status values.
     * 
     * This is returned by `TokenGetInfoQuery` in `TokenRelationship`.
     * @name proto.TokenPauseStatus
     * @enum {number}
     * @property {number} PauseNotApplicable=0 The token does not support pause or cannot be paused.<br/>
     * Typically this indicates that the token does not have a `pause_key` set.
     * @property {number} Paused=1 The token is currently paused.
     * @property {number} Unpaused=2 The token is not currently paused.
     */
    proto.TokenPauseStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "PauseNotApplicable"] = 0;
        values[valuesById[1] = "Paused"] = 1;
        values[valuesById[2] = "Unpaused"] = 2;
        return values;
    })();

    proto.Key = (function() {

        /**
         * Properties of a Key.
         * @memberof proto
         * @interface IKey
         * @property {proto.IContractID|null} [contractID] A smart contract instance that is authorized implicitly.
         * <p>
         * This key type SHALL require that the code in the active message frame
         * belong to the contract with the given id.
         * @property {Uint8Array|null} [ed25519] An array of Ed25519 public key bytes.
         * @property {Uint8Array|null} [RSA_3072] This option is not currently supported.<br/>
         * An array of RSA-3072 public key bytes.
         * @property {Uint8Array|null} [ECDSA_384] This option is not currently supported.<br/>
         * An array of ECDSA, using the p-384 curve, public key bytes.
         * @property {proto.IThresholdKey|null} [thresholdKey] A threshold, M, combined with a list of N keys, any M of which are
         * sufficient to form a valid signature.
         * @property {proto.IKeyList|null} [keyList] A list of keys. This may be treated like a "N-of-N" threshold key,
         * as a component of another key, or in some other manner as documented.
         * @property {Uint8Array|null} [ECDSASecp256k1] A set of compressed ECDSA(secp256k1) public key bytes.<br/>
         * This is an EVM compatibility format.
         * @property {proto.IContractID|null} [delegatableContractId] A smart contract that, if the recipient of the active message frame,
         * SHALL be imputed authorization.<br/>
         * Setting this key type is a more permissive version of setting a
         * contractID key.
         * <p>
         * This key form SHALL NOT strictly require that the code being executed
         * in the frame belong to the given contract. The code in frame MAY be
         * running another contract via a `delegatecall`.
         */

        /**
         * Constructs a new Key.
         * @memberof proto
         * @classdesc A Key is an entity representing one or more cryptographic public/private key
         * pairs and, optionally, the structure for how multiple signatures may be
         * composed to meet complex multiple-signature authorization requirements.
         * 
         * A Key can be a public key from either the Ed25519 or ECDSA(secp256k1)
         * signature schemes. In the ECDSA(secp256k1) case we require the 33-byte
         * compressed form of the public key. For simplicity, we call these
         * cryptographic public keys `primitive` keys.<br/>
         * If an entity has a primitive key associated to it, then the corresponding
         * private key must sign any transaction to send tokens or perform other
         * actions requiring authorization.
         * 
         * A Key can also be the ID of a smart contract, which SHALL authorize that
         * contract to execute any system contract with signing requirements that are
         * met by the key.<br/>
         * > Example
         * >> If account `0.0.A` has a threshold key whose threshold is satisfied
         * >> by a contract ID key for contract `0.0.C`, then when `0.0.C` is called,
         * >> it is authorized to use system contracts to manage any asset owned by
         * >> `0.0.A`. If the contract ID key is "delegatable", then `0.0.C` can even
         * >> perform these actions when running code accessed via `DELEGATECALL`.
         * 
         * A Key can be a "threshold key", which is a list of N keys, any M of which
         * may sign in order for the signature to be considered valid. The value of
         * M for a given threshold key MUST be less than or equal to N. A threshold
         * key is sometimes called a "M-of-N" key.
         * 
         * A Key can be a "key list" where all keys in the list must sign unless
         * specified otherwise in the documentation for a specific transaction
         * type (e.g. FileDeleteTransactionBody).<br/>
         * This implies that the use of a key list is dependent on context. For
         * example, an Hedera file that is created with a list of keys, SHALL require
         * that all of those keys must sign a transaction to create or modify the file,
         * but only one key from that list MUST sign a transaction to delete the file.
         * So it is a single list that sometimes acts as a N-of-N threshold key, and
         * sometimes acts as a 1-of-N threshold key.<br/>
         * To reduce confusion this may cause, a key list SHALL always be considered
         * N-of-N, unless specified otherwise in official documentation.<br/>
         * A key list MAY have repeated primitive public keys, but the signature
         * requirement for all keys in a repeated set SHALL be satisfied by a single
         * valid signature. There is no mechanism to require a single key to sign a
         * single transaction more than once.
         * 
         * Any list or threshold key MAY have nested key lists or threshold keys.
         * This allows, for example, the keys within a threshold signature to
         * themselves be threshold, list, contract, or primitive keys. This nesting
         * structure enables complex asymmetric multi-party signature requirements to
         * be met.
         * 
         * To ensure adequate performance and transaction security, key nesting is
         * limited to at most fifteen(15) levels.
         * @implements IKey
         * @constructor
         * @param {proto.IKey=} [p] Properties to set
         */
        function Key(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A smart contract instance that is authorized implicitly.
         * <p>
         * This key type SHALL require that the code in the active message frame
         * belong to the contract with the given id.
         * @member {proto.IContractID|null|undefined} contractID
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.contractID = null;

        /**
         * An array of Ed25519 public key bytes.
         * @member {Uint8Array|null|undefined} ed25519
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.ed25519 = null;

        /**
         * This option is not currently supported.<br/>
         * An array of RSA-3072 public key bytes.
         * @member {Uint8Array|null|undefined} RSA_3072
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.RSA_3072 = null;

        /**
         * This option is not currently supported.<br/>
         * An array of ECDSA, using the p-384 curve, public key bytes.
         * @member {Uint8Array|null|undefined} ECDSA_384
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.ECDSA_384 = null;

        /**
         * A threshold, M, combined with a list of N keys, any M of which are
         * sufficient to form a valid signature.
         * @member {proto.IThresholdKey|null|undefined} thresholdKey
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.thresholdKey = null;

        /**
         * A list of keys. This may be treated like a "N-of-N" threshold key,
         * as a component of another key, or in some other manner as documented.
         * @member {proto.IKeyList|null|undefined} keyList
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.keyList = null;

        /**
         * A set of compressed ECDSA(secp256k1) public key bytes.<br/>
         * This is an EVM compatibility format.
         * @member {Uint8Array|null|undefined} ECDSASecp256k1
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.ECDSASecp256k1 = null;

        /**
         * A smart contract that, if the recipient of the active message frame,
         * SHALL be imputed authorization.<br/>
         * Setting this key type is a more permissive version of setting a
         * contractID key.
         * <p>
         * This key form SHALL NOT strictly require that the code being executed
         * in the frame belong to the given contract. The code in frame MAY be
         * running another contract via a `delegatecall`.
         * @member {proto.IContractID|null|undefined} delegatableContractId
         * @memberof proto.Key
         * @instance
         */
        Key.prototype.delegatableContractId = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * Key key.
         * @member {"contractID"|"ed25519"|"RSA_3072"|"ECDSA_384"|"thresholdKey"|"keyList"|"ECDSASecp256k1"|"delegatableContractId"|undefined} key
         * @memberof proto.Key
         * @instance
         */
        Object.defineProperty(Key.prototype, "key", {
            get: $util.oneOfGetter($oneOfFields = ["contractID", "ed25519", "RSA_3072", "ECDSA_384", "thresholdKey", "keyList", "ECDSASecp256k1", "delegatableContractId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Key instance using the specified properties.
         * @function create
         * @memberof proto.Key
         * @static
         * @param {proto.IKey=} [properties] Properties to set
         * @returns {proto.Key} Key instance
         */
        Key.create = function create(properties) {
            return new Key(properties);
        };

        /**
         * Encodes the specified Key message. Does not implicitly {@link proto.Key.verify|verify} messages.
         * @function encode
         * @memberof proto.Key
         * @static
         * @param {proto.IKey} m Key message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Key.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.contractID != null && Object.hasOwnProperty.call(m, "contractID"))
                $root.proto.ContractID.encode(m.contractID, w.uint32(10).fork()).ldelim();
            if (m.ed25519 != null && Object.hasOwnProperty.call(m, "ed25519"))
                w.uint32(18).bytes(m.ed25519);
            if (m.RSA_3072 != null && Object.hasOwnProperty.call(m, "RSA_3072"))
                w.uint32(26).bytes(m.RSA_3072);
            if (m.ECDSA_384 != null && Object.hasOwnProperty.call(m, "ECDSA_384"))
                w.uint32(34).bytes(m.ECDSA_384);
            if (m.thresholdKey != null && Object.hasOwnProperty.call(m, "thresholdKey"))
                $root.proto.ThresholdKey.encode(m.thresholdKey, w.uint32(42).fork()).ldelim();
            if (m.keyList != null && Object.hasOwnProperty.call(m, "keyList"))
                $root.proto.KeyList.encode(m.keyList, w.uint32(50).fork()).ldelim();
            if (m.ECDSASecp256k1 != null && Object.hasOwnProperty.call(m, "ECDSASecp256k1"))
                w.uint32(58).bytes(m.ECDSASecp256k1);
            if (m.delegatableContractId != null && Object.hasOwnProperty.call(m, "delegatableContractId"))
                $root.proto.ContractID.encode(m.delegatableContractId, w.uint32(66).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a Key message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Key
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Key} Key
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Key.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Key();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.contractID = $root.proto.ContractID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.ed25519 = r.bytes();
                        break;
                    }
                case 3: {
                        m.RSA_3072 = r.bytes();
                        break;
                    }
                case 4: {
                        m.ECDSA_384 = r.bytes();
                        break;
                    }
                case 5: {
                        m.thresholdKey = $root.proto.ThresholdKey.decode(r, r.uint32());
                        break;
                    }
                case 6: {
                        m.keyList = $root.proto.KeyList.decode(r, r.uint32());
                        break;
                    }
                case 7: {
                        m.ECDSASecp256k1 = r.bytes();
                        break;
                    }
                case 8: {
                        m.delegatableContractId = $root.proto.ContractID.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Key
         * @function getTypeUrl
         * @memberof proto.Key
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Key.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Key";
        };

        return Key;
    })();

    proto.ThresholdKey = (function() {

        /**
         * Properties of a ThresholdKey.
         * @memberof proto
         * @interface IThresholdKey
         * @property {number|null} [threshold] A transaction MUST have valid signatures from at least this number of
         * separate keys, from the `keys` list to be authorized by this key.
         * @property {proto.IKeyList|null} [keys] A list of the keys that MAY satisfy signature requirements of this key.
         */

        /**
         * Constructs a new ThresholdKey.
         * @memberof proto
         * @classdesc A threshold value and a list of public keys that, together, form a threshold
         * signature requirement. Any subset of the keys in the list may satisfy the
         * signature requirements of this type of key, provided the number of keys meets
         * or exceeds the threshold. For example, if a particular key has a threshold of
         * three(3) and eight(8) keys in the list, then any three(3) signatures, from
         * the list of eight(8), is sufficient to authorize that key.
         * 
         * For threshold purposes, all signatures from a single `primitive` key are
         * considered a single signature, so that signature(s) from a single key SHALL
         * NOT _directly_ meet a threshold greater than one(1).
         * 
         * #### Note
         * > It is possible to construct a complex key structure that _would_ enable a
         * > single primitive key to successfully meet a threshold requirement. All
         * > threshold keys SHOULD be carefully audited to ensure no one `primitive`
         * > key, or smart contract, has disproportionate capability.
         * @implements IThresholdKey
         * @constructor
         * @param {proto.IThresholdKey=} [p] Properties to set
         */
        function ThresholdKey(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A transaction MUST have valid signatures from at least this number of
         * separate keys, from the `keys` list to be authorized by this key.
         * @member {number} threshold
         * @memberof proto.ThresholdKey
         * @instance
         */
        ThresholdKey.prototype.threshold = 0;

        /**
         * A list of the keys that MAY satisfy signature requirements of this key.
         * @member {proto.IKeyList|null|undefined} keys
         * @memberof proto.ThresholdKey
         * @instance
         */
        ThresholdKey.prototype.keys = null;

        /**
         * Creates a new ThresholdKey instance using the specified properties.
         * @function create
         * @memberof proto.ThresholdKey
         * @static
         * @param {proto.IThresholdKey=} [properties] Properties to set
         * @returns {proto.ThresholdKey} ThresholdKey instance
         */
        ThresholdKey.create = function create(properties) {
            return new ThresholdKey(properties);
        };

        /**
         * Encodes the specified ThresholdKey message. Does not implicitly {@link proto.ThresholdKey.verify|verify} messages.
         * @function encode
         * @memberof proto.ThresholdKey
         * @static
         * @param {proto.IThresholdKey} m ThresholdKey message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ThresholdKey.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.threshold != null && Object.hasOwnProperty.call(m, "threshold"))
                w.uint32(8).uint32(m.threshold);
            if (m.keys != null && Object.hasOwnProperty.call(m, "keys"))
                $root.proto.KeyList.encode(m.keys, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a ThresholdKey message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ThresholdKey
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ThresholdKey} ThresholdKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ThresholdKey.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ThresholdKey();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.threshold = r.uint32();
                        break;
                    }
                case 2: {
                        m.keys = $root.proto.KeyList.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ThresholdKey
         * @function getTypeUrl
         * @memberof proto.ThresholdKey
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ThresholdKey.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ThresholdKey";
        };

        return ThresholdKey;
    })();

    proto.KeyList = (function() {

        /**
         * Properties of a KeyList.
         * @memberof proto
         * @interface IKeyList
         * @property {Array.<proto.IKey>|null} [keys] A list of keys. All values in this list SHALL be non-null.
         * <p>
         */

        /**
         * Constructs a new KeyList.
         * @memberof proto
         * @classdesc A list of keys.<br/>
         * A `KeyList` requires all keys (N-of-N) to sign, unless otherwise
         * specified in official documentation. A KeyList may contain repeated keys,
         * but all such repeated keys are considered a single key when determining
         * signature authorization.
         * 
         * ### Additional Notes
         * 1. An empty key list is the "standard" mechanism to represent an
         * unassigned key. For example, if the `admin_key` of a token is set
         * to the empty key list, then that token has no admin key, and
         * functionality that requires an admin key to sign the
         * transaction is disabled.
         * @implements IKeyList
         * @constructor
         * @param {proto.IKeyList=} [p] Properties to set
         */
        function KeyList(p) {
            this.keys = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A list of keys. All values in this list SHALL be non-null.
         * <p>
         * @member {Array.<proto.IKey>} keys
         * @memberof proto.KeyList
         * @instance
         */
        KeyList.prototype.keys = $util.emptyArray;

        /**
         * Creates a new KeyList instance using the specified properties.
         * @function create
         * @memberof proto.KeyList
         * @static
         * @param {proto.IKeyList=} [properties] Properties to set
         * @returns {proto.KeyList} KeyList instance
         */
        KeyList.create = function create(properties) {
            return new KeyList(properties);
        };

        /**
         * Encodes the specified KeyList message. Does not implicitly {@link proto.KeyList.verify|verify} messages.
         * @function encode
         * @memberof proto.KeyList
         * @static
         * @param {proto.IKeyList} m KeyList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        KeyList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.keys != null && m.keys.length) {
                for (var i = 0; i < m.keys.length; ++i)
                    $root.proto.Key.encode(m.keys[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a KeyList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.KeyList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.KeyList} KeyList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        KeyList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.KeyList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.keys && m.keys.length))
                            m.keys = [];
                        m.keys.push($root.proto.Key.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for KeyList
         * @function getTypeUrl
         * @memberof proto.KeyList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        KeyList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.KeyList";
        };

        return KeyList;
    })();

    proto.Signature = (function() {

        /**
         * Properties of a Signature.
         * @memberof proto
         * @interface ISignature
         * @property {Uint8Array|null} [contract] Smart contract virtual signature (always length zero).
         * @property {Uint8Array|null} [ed25519] Ed25519 signature bytes.
         * @property {Uint8Array|null} [RSA_3072] RSA-3072 signature bytes.
         * @property {Uint8Array|null} [ECDSA_384] ECDSA p-384 signature bytes.
         * @property {proto.IThresholdSignature|null} [thresholdSignature] A list of signatures for a single N-of-M threshold Key. This must be
         * a list of exactly M signatures, at least N of which are non-null.
         * @property {proto.ISignatureList|null} [signatureList] A list of M signatures, each corresponding to a Key in a KeyList
         * of the same length.
         */

        /**
         * Constructs a new Signature.
         * @memberof proto
         * @classdesc This message is deprecated and MUST NOT be used to communicate with
         * network nodes. It is retained here only for historical reasons.
         * 
         * Client software MUST NOT include this message in any request. <br/>
         * Compliant nodes SHALL NOT accept any request containing this message.
         * 
         * Please use the `SignaturePair` and `SignatureMap` messages instead of
         * this message.
         * @implements ISignature
         * @constructor
         * @param {proto.ISignature=} [p] Properties to set
         */
        function Signature(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Smart contract virtual signature (always length zero).
         * @member {Uint8Array|null|undefined} contract
         * @memberof proto.Signature
         * @instance
         */
        Signature.prototype.contract = null;

        /**
         * Ed25519 signature bytes.
         * @member {Uint8Array|null|undefined} ed25519
         * @memberof proto.Signature
         * @instance
         */
        Signature.prototype.ed25519 = null;

        /**
         * RSA-3072 signature bytes.
         * @member {Uint8Array|null|undefined} RSA_3072
         * @memberof proto.Signature
         * @instance
         */
        Signature.prototype.RSA_3072 = null;

        /**
         * ECDSA p-384 signature bytes.
         * @member {Uint8Array|null|undefined} ECDSA_384
         * @memberof proto.Signature
         * @instance
         */
        Signature.prototype.ECDSA_384 = null;

        /**
         * A list of signatures for a single N-of-M threshold Key. This must be
         * a list of exactly M signatures, at least N of which are non-null.
         * @member {proto.IThresholdSignature|null|undefined} thresholdSignature
         * @memberof proto.Signature
         * @instance
         */
        Signature.prototype.thresholdSignature = null;

        /**
         * A list of M signatures, each corresponding to a Key in a KeyList
         * of the same length.
         * @member {proto.ISignatureList|null|undefined} signatureList
         * @memberof proto.Signature
         * @instance
         */
        Signature.prototype.signatureList = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * Signature signature.
         * @member {"contract"|"ed25519"|"RSA_3072"|"ECDSA_384"|"thresholdSignature"|"signatureList"|undefined} signature
         * @memberof proto.Signature
         * @instance
         */
        Object.defineProperty(Signature.prototype, "signature", {
            get: $util.oneOfGetter($oneOfFields = ["contract", "ed25519", "RSA_3072", "ECDSA_384", "thresholdSignature", "signatureList"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Signature instance using the specified properties.
         * @function create
         * @memberof proto.Signature
         * @static
         * @param {proto.ISignature=} [properties] Properties to set
         * @returns {proto.Signature} Signature instance
         */
        Signature.create = function create(properties) {
            return new Signature(properties);
        };

        /**
         * Encodes the specified Signature message. Does not implicitly {@link proto.Signature.verify|verify} messages.
         * @function encode
         * @memberof proto.Signature
         * @static
         * @param {proto.ISignature} m Signature message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Signature.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.contract != null && Object.hasOwnProperty.call(m, "contract"))
                w.uint32(10).bytes(m.contract);
            if (m.ed25519 != null && Object.hasOwnProperty.call(m, "ed25519"))
                w.uint32(18).bytes(m.ed25519);
            if (m.RSA_3072 != null && Object.hasOwnProperty.call(m, "RSA_3072"))
                w.uint32(26).bytes(m.RSA_3072);
            if (m.ECDSA_384 != null && Object.hasOwnProperty.call(m, "ECDSA_384"))
                w.uint32(34).bytes(m.ECDSA_384);
            if (m.thresholdSignature != null && Object.hasOwnProperty.call(m, "thresholdSignature"))
                $root.proto.ThresholdSignature.encode(m.thresholdSignature, w.uint32(42).fork()).ldelim();
            if (m.signatureList != null && Object.hasOwnProperty.call(m, "signatureList"))
                $root.proto.SignatureList.encode(m.signatureList, w.uint32(50).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a Signature message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Signature
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Signature} Signature
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Signature.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Signature();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.contract = r.bytes();
                        break;
                    }
                case 2: {
                        m.ed25519 = r.bytes();
                        break;
                    }
                case 3: {
                        m.RSA_3072 = r.bytes();
                        break;
                    }
                case 4: {
                        m.ECDSA_384 = r.bytes();
                        break;
                    }
                case 5: {
                        m.thresholdSignature = $root.proto.ThresholdSignature.decode(r, r.uint32());
                        break;
                    }
                case 6: {
                        m.signatureList = $root.proto.SignatureList.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Signature
         * @function getTypeUrl
         * @memberof proto.Signature
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Signature.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Signature";
        };

        return Signature;
    })();

    proto.ThresholdSignature = (function() {

        /**
         * Properties of a ThresholdSignature.
         * @memberof proto
         * @interface IThresholdSignature
         * @property {proto.ISignatureList|null} [sigs] For an N-of-M threshold key, this is a list of M signatures, at least N
         * of which must be non-null.
         */

        /**
         * Constructs a new ThresholdSignature.
         * @memberof proto
         * @classdesc This message is deprecated and MUST NOT be used to communicate with network
         * nodes. It is retained here only for historical reasons.
         * 
         * Client software MUST NOT include this message in any request. <br/>
         * Compliant nodes SHALL NOT accept any request containing this message.
         * 
         * Please use the `SignaturePair` and `SignatureMap` messages, in combination
         * with `ThresholdKey` keys, instead of this message.
         * @implements IThresholdSignature
         * @constructor
         * @param {proto.IThresholdSignature=} [p] Properties to set
         */
        function ThresholdSignature(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * For an N-of-M threshold key, this is a list of M signatures, at least N
         * of which must be non-null.
         * @member {proto.ISignatureList|null|undefined} sigs
         * @memberof proto.ThresholdSignature
         * @instance
         */
        ThresholdSignature.prototype.sigs = null;

        /**
         * Creates a new ThresholdSignature instance using the specified properties.
         * @function create
         * @memberof proto.ThresholdSignature
         * @static
         * @param {proto.IThresholdSignature=} [properties] Properties to set
         * @returns {proto.ThresholdSignature} ThresholdSignature instance
         */
        ThresholdSignature.create = function create(properties) {
            return new ThresholdSignature(properties);
        };

        /**
         * Encodes the specified ThresholdSignature message. Does not implicitly {@link proto.ThresholdSignature.verify|verify} messages.
         * @function encode
         * @memberof proto.ThresholdSignature
         * @static
         * @param {proto.IThresholdSignature} m ThresholdSignature message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ThresholdSignature.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.sigs != null && Object.hasOwnProperty.call(m, "sigs"))
                $root.proto.SignatureList.encode(m.sigs, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a ThresholdSignature message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ThresholdSignature
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ThresholdSignature} ThresholdSignature
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ThresholdSignature.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ThresholdSignature();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 2: {
                        m.sigs = $root.proto.SignatureList.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ThresholdSignature
         * @function getTypeUrl
         * @memberof proto.ThresholdSignature
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ThresholdSignature.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ThresholdSignature";
        };

        return ThresholdSignature;
    })();

    proto.SignatureList = (function() {

        /**
         * Properties of a SignatureList.
         * @memberof proto
         * @interface ISignatureList
         * @property {Array.<proto.ISignature>|null} [sigs] Each signature corresponds to a Key in the KeyList.
         */

        /**
         * Constructs a new SignatureList.
         * @memberof proto
         * @classdesc This message is deprecated and MUST NOT be used to communicate with network
         * nodes. It is retained here only for historical reasons.
         * 
         * Client software MUST NOT include this message in any request. <br/>
         * Compliant nodes SHALL NOT accept any request containing this message.
         * 
         * Please use the `SignaturePair` and `SignatureMap` messages instead of
         * this message.
         * @implements ISignatureList
         * @constructor
         * @param {proto.ISignatureList=} [p] Properties to set
         */
        function SignatureList(p) {
            this.sigs = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Each signature corresponds to a Key in the KeyList.
         * @member {Array.<proto.ISignature>} sigs
         * @memberof proto.SignatureList
         * @instance
         */
        SignatureList.prototype.sigs = $util.emptyArray;

        /**
         * Creates a new SignatureList instance using the specified properties.
         * @function create
         * @memberof proto.SignatureList
         * @static
         * @param {proto.ISignatureList=} [properties] Properties to set
         * @returns {proto.SignatureList} SignatureList instance
         */
        SignatureList.create = function create(properties) {
            return new SignatureList(properties);
        };

        /**
         * Encodes the specified SignatureList message. Does not implicitly {@link proto.SignatureList.verify|verify} messages.
         * @function encode
         * @memberof proto.SignatureList
         * @static
         * @param {proto.ISignatureList} m SignatureList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SignatureList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.sigs != null && m.sigs.length) {
                for (var i = 0; i < m.sigs.length; ++i)
                    $root.proto.Signature.encode(m.sigs[i], w.uint32(18).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a SignatureList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.SignatureList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.SignatureList} SignatureList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SignatureList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.SignatureList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 2: {
                        if (!(m.sigs && m.sigs.length))
                            m.sigs = [];
                        m.sigs.push($root.proto.Signature.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for SignatureList
         * @function getTypeUrl
         * @memberof proto.SignatureList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SignatureList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SignatureList";
        };

        return SignatureList;
    })();

    proto.SignaturePair = (function() {

        /**
         * Properties of a SignaturePair.
         * @memberof proto
         * @interface ISignaturePair
         * @property {Uint8Array|null} [pubKeyPrefix] Prefix bytes of the public key.
         * <p>
         * The client may use any number of bytes from zero to the whole length of
         * the public key for pubKeyPrefix. If zero bytes are used, then it MUST be
         * true that only one cryptographic key is required to sign the associated
         * transaction.<br/>
         * If the `pubKeyPrefix` is 0 bytes and more than a single cryptographic
         * key is required to sign the transaction, the request SHALL resolve to
         * `INVALID_SIGNATURE`.
         * <blockquote>Important Note<blockquote>
         * In the special case that a signature is provided to authorize a
         * precompiled contract, the `pubKeyPrefix` MUST contain the _entire public
         * key_.<br/>
         * That is, if the key is an Ed25519 key, the `pubKeyPrefix` MUST be
         * 32 bytes long and contain the full public key bytes.<br/>
         * If the key is an ECDSA(secp256k1) key, the `pubKeyPrefix` MUST be
         * 33 bytes long and contain the full _compressed_ form of the public key.
         * </blockquote></blockquote>
         * <p>
         * <dl><dt>Purpose</dt>
         * <dd>The `pubKeyPrefix` exists to save cost. A signed transaction with
         * shorter prefixes will have fewer bytes, and so will have a lower
         * transaction fee.
         * The prefixes, however, MUST be long enough to distinguish between all
         * of the public keys that might be signing the transaction. Therefore,
         * software signing a transaction SHOULD evaluate which keys might possibly
         * be required to sign a transaction, and ensure that the shortest prefix
         * that is sufficient to unambiguously identify the correct key is used.
         * </dd></dl>
         * @property {Uint8Array|null} [contract] A smart contract virtual signature.
         * <p>
         * This value MUST be length zero, if set.
         * @property {Uint8Array|null} [ed25519] An Ed25519 signature.
         * @property {Uint8Array|null} [RSA_3072] This option is not supported.<br/>
         * A RSA-3072 signature.
         * @property {Uint8Array|null} [ECDSA_384] This option is not supported.<br/>
         * ECDSA p-384 signature.
         * @property {Uint8Array|null} [ECDSASecp256k1] An ECDSA(secp256k1) signature.
         */

        /**
         * Constructs a new SignaturePair.
         * @memberof proto
         * @classdesc A public key and signature pair.<br/>
         * Only Ed25519 and ECDSA(secp256k1) keys and signatures are currently supported
         * as cryptographic (non-implied) signatures.
         * @implements ISignaturePair
         * @constructor
         * @param {proto.ISignaturePair=} [p] Properties to set
         */
        function SignaturePair(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Prefix bytes of the public key.
         * <p>
         * The client may use any number of bytes from zero to the whole length of
         * the public key for pubKeyPrefix. If zero bytes are used, then it MUST be
         * true that only one cryptographic key is required to sign the associated
         * transaction.<br/>
         * If the `pubKeyPrefix` is 0 bytes and more than a single cryptographic
         * key is required to sign the transaction, the request SHALL resolve to
         * `INVALID_SIGNATURE`.
         * <blockquote>Important Note<blockquote>
         * In the special case that a signature is provided to authorize a
         * precompiled contract, the `pubKeyPrefix` MUST contain the _entire public
         * key_.<br/>
         * That is, if the key is an Ed25519 key, the `pubKeyPrefix` MUST be
         * 32 bytes long and contain the full public key bytes.<br/>
         * If the key is an ECDSA(secp256k1) key, the `pubKeyPrefix` MUST be
         * 33 bytes long and contain the full _compressed_ form of the public key.
         * </blockquote></blockquote>
         * <p>
         * <dl><dt>Purpose</dt>
         * <dd>The `pubKeyPrefix` exists to save cost. A signed transaction with
         * shorter prefixes will have fewer bytes, and so will have a lower
         * transaction fee.
         * The prefixes, however, MUST be long enough to distinguish between all
         * of the public keys that might be signing the transaction. Therefore,
         * software signing a transaction SHOULD evaluate which keys might possibly
         * be required to sign a transaction, and ensure that the shortest prefix
         * that is sufficient to unambiguously identify the correct key is used.
         * </dd></dl>
         * @member {Uint8Array} pubKeyPrefix
         * @memberof proto.SignaturePair
         * @instance
         */
        SignaturePair.prototype.pubKeyPrefix = $util.newBuffer([]);

        /**
         * A smart contract virtual signature.
         * <p>
         * This value MUST be length zero, if set.
         * @member {Uint8Array|null|undefined} contract
         * @memberof proto.SignaturePair
         * @instance
         */
        SignaturePair.prototype.contract = null;

        /**
         * An Ed25519 signature.
         * @member {Uint8Array|null|undefined} ed25519
         * @memberof proto.SignaturePair
         * @instance
         */
        SignaturePair.prototype.ed25519 = null;

        /**
         * This option is not supported.<br/>
         * A RSA-3072 signature.
         * @member {Uint8Array|null|undefined} RSA_3072
         * @memberof proto.SignaturePair
         * @instance
         */
        SignaturePair.prototype.RSA_3072 = null;

        /**
         * This option is not supported.<br/>
         * ECDSA p-384 signature.
         * @member {Uint8Array|null|undefined} ECDSA_384
         * @memberof proto.SignaturePair
         * @instance
         */
        SignaturePair.prototype.ECDSA_384 = null;

        /**
         * An ECDSA(secp256k1) signature.
         * @member {Uint8Array|null|undefined} ECDSASecp256k1
         * @memberof proto.SignaturePair
         * @instance
         */
        SignaturePair.prototype.ECDSASecp256k1 = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * SignaturePair signature.
         * @member {"contract"|"ed25519"|"RSA_3072"|"ECDSA_384"|"ECDSASecp256k1"|undefined} signature
         * @memberof proto.SignaturePair
         * @instance
         */
        Object.defineProperty(SignaturePair.prototype, "signature", {
            get: $util.oneOfGetter($oneOfFields = ["contract", "ed25519", "RSA_3072", "ECDSA_384", "ECDSASecp256k1"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new SignaturePair instance using the specified properties.
         * @function create
         * @memberof proto.SignaturePair
         * @static
         * @param {proto.ISignaturePair=} [properties] Properties to set
         * @returns {proto.SignaturePair} SignaturePair instance
         */
        SignaturePair.create = function create(properties) {
            return new SignaturePair(properties);
        };

        /**
         * Encodes the specified SignaturePair message. Does not implicitly {@link proto.SignaturePair.verify|verify} messages.
         * @function encode
         * @memberof proto.SignaturePair
         * @static
         * @param {proto.ISignaturePair} m SignaturePair message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SignaturePair.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.pubKeyPrefix != null && Object.hasOwnProperty.call(m, "pubKeyPrefix"))
                w.uint32(10).bytes(m.pubKeyPrefix);
            if (m.contract != null && Object.hasOwnProperty.call(m, "contract"))
                w.uint32(18).bytes(m.contract);
            if (m.ed25519 != null && Object.hasOwnProperty.call(m, "ed25519"))
                w.uint32(26).bytes(m.ed25519);
            if (m.RSA_3072 != null && Object.hasOwnProperty.call(m, "RSA_3072"))
                w.uint32(34).bytes(m.RSA_3072);
            if (m.ECDSA_384 != null && Object.hasOwnProperty.call(m, "ECDSA_384"))
                w.uint32(42).bytes(m.ECDSA_384);
            if (m.ECDSASecp256k1 != null && Object.hasOwnProperty.call(m, "ECDSASecp256k1"))
                w.uint32(50).bytes(m.ECDSASecp256k1);
            return w;
        };

        /**
         * Decodes a SignaturePair message from the specified reader or buffer.
         * @function decode
         * @memberof proto.SignaturePair
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.SignaturePair} SignaturePair
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SignaturePair.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.SignaturePair();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.pubKeyPrefix = r.bytes();
                        break;
                    }
                case 2: {
                        m.contract = r.bytes();
                        break;
                    }
                case 3: {
                        m.ed25519 = r.bytes();
                        break;
                    }
                case 4: {
                        m.RSA_3072 = r.bytes();
                        break;
                    }
                case 5: {
                        m.ECDSA_384 = r.bytes();
                        break;
                    }
                case 6: {
                        m.ECDSASecp256k1 = r.bytes();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for SignaturePair
         * @function getTypeUrl
         * @memberof proto.SignaturePair
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SignaturePair.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SignaturePair";
        };

        return SignaturePair;
    })();

    proto.SignatureMap = (function() {

        /**
         * Properties of a SignatureMap.
         * @memberof proto
         * @interface ISignatureMap
         * @property {Array.<proto.ISignaturePair>|null} [sigPair] A list of signature pairs for a specific transaction.<br/>
         * Each signature pair represents a single cryptographic (`primitive`)
         * public key identified by a "prefix" value and the cryptographic
         * signature produced for that key.
         */

        /**
         * Constructs a new SignatureMap.
         * @memberof proto
         * @classdesc A set of signatures corresponding to every unique public key that
         * signed a given transaction.
         * 
         * If any public key matches more than one prefix in the signature map,
         * the transaction containing that map SHALL fail immediately with the
         * response code `KEY_PREFIX_MISMATCH`.
         * @implements ISignatureMap
         * @constructor
         * @param {proto.ISignatureMap=} [p] Properties to set
         */
        function SignatureMap(p) {
            this.sigPair = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A list of signature pairs for a specific transaction.<br/>
         * Each signature pair represents a single cryptographic (`primitive`)
         * public key identified by a "prefix" value and the cryptographic
         * signature produced for that key.
         * @member {Array.<proto.ISignaturePair>} sigPair
         * @memberof proto.SignatureMap
         * @instance
         */
        SignatureMap.prototype.sigPair = $util.emptyArray;

        /**
         * Creates a new SignatureMap instance using the specified properties.
         * @function create
         * @memberof proto.SignatureMap
         * @static
         * @param {proto.ISignatureMap=} [properties] Properties to set
         * @returns {proto.SignatureMap} SignatureMap instance
         */
        SignatureMap.create = function create(properties) {
            return new SignatureMap(properties);
        };

        /**
         * Encodes the specified SignatureMap message. Does not implicitly {@link proto.SignatureMap.verify|verify} messages.
         * @function encode
         * @memberof proto.SignatureMap
         * @static
         * @param {proto.ISignatureMap} m SignatureMap message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SignatureMap.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.sigPair != null && m.sigPair.length) {
                for (var i = 0; i < m.sigPair.length; ++i)
                    $root.proto.SignaturePair.encode(m.sigPair[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a SignatureMap message from the specified reader or buffer.
         * @function decode
         * @memberof proto.SignatureMap
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.SignatureMap} SignatureMap
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SignatureMap.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.SignatureMap();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.sigPair && m.sigPair.length))
                            m.sigPair = [];
                        m.sigPair.push($root.proto.SignaturePair.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for SignatureMap
         * @function getTypeUrl
         * @memberof proto.SignatureMap
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SignatureMap.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SignatureMap";
        };

        return SignatureMap;
    })();

    /**
     * The transactions and queries supported by Hedera Hashgraph.
     * @name proto.HederaFunctionality
     * @enum {number}
     * @property {number} NONE=0 Unused - The first value is unused because this default value is
     * ambiguous with an "unset" value and therefore should not be used.
     * @property {number} CryptoTransfer=1 Transfer tokens among accounts.
     * @property {number} CryptoUpdate=2 Update an account.
     * @property {number} CryptoDelete=3 Delete an account.
     * @property {number} CryptoAddLiveHash=4 Add a livehash to an account
     * @property {number} CryptoDeleteLiveHash=5 Delete a livehash from an account
     * @property {number} ContractCall=6 Execute a smart contract call.
     * @property {number} ContractCreate=7 Create a smart contract.
     * @property {number} ContractUpdate=8 Update a smart contract.
     * @property {number} FileCreate=9 Create a "file" stored in the ledger.
     * @property {number} FileAppend=10 Append data to a "file" stored in the ledger.
     * @property {number} FileUpdate=11 Update a "file" stored in the ledger.
     * @property {number} FileDelete=12 Delete a "file" stored in the ledger.
     * @property {number} CryptoGetAccountBalance=13 Get the balance for an account.
     * @property {number} CryptoGetAccountRecords=14 Get a full account record.
     * @property {number} CryptoGetInfo=15 Get information about a token.
     * @property {number} ContractCallLocal=16 Execute a local smart contract call.<br/>
     * Used by contracts to call other contracts.
     * @property {number} ContractGetInfo=17 Get information about a smart contract.
     * @property {number} ContractGetBytecode=18 Get the compiled bytecode that implements a smart contract.
     * @property {number} GetBySolidityID=19 Get a smart contract record by reference to the solidity ID.
     * @property {number} GetByKey=20 Get a smart contract by reference to the contract key.
     * @property {number} CryptoGetLiveHash=21 Get the live hash for an account
     * @property {number} CryptoGetStakers=22 Get the accounts proxy staking to a given account.
     * @property {number} FileGetContents=23 Get the contents of a "file" stored in the ledger.
     * @property {number} FileGetInfo=24 Get the metadata for a "file" stored in the ledger.
     * @property {number} TransactionGetRecord=25 Get transaction record(s) for a specified transaction ID.
     * @property {number} ContractGetRecords=26 Get all transaction records for a specified contract ID in
     * the past 24 hours.<br/>
     * deprecated since version 0.9.0
     * @property {number} CryptoCreate=27 Create a new account
     * @property {number} SystemDelete=28 Delete a "system" "file" stored in the ledger.<br/>
     * "System" files are files with special purpose and ID values within a
     * specific range.<br/>
     * These files require additional controls and can only be deleted when
     * authorized by accounts with elevated privilege.
     * @property {number} SystemUndelete=29 Undo the delete of a "system" "file" stored in the ledger.<br/>
     * "System" files are files with special purpose and ID values within a
     * specific range.<br/>
     * These files require additional controls and can only be deleted when
     * authorized by accounts with elevated privilege. This operation allows
     * such files to be restored, within a reasonable timeframe, if
     * deleted improperly.
     * @property {number} ContractDelete=30 Delete a smart contract
     * @property {number} Freeze=31 Stop all processing and "freeze" the entire network.<br/>
     * This is generally sent immediately prior to upgrading the network.<br/>
     * After processing this transactions all nodes enter a quiescent state.
     * @property {number} CreateTransactionRecord=32 Create a Transaction Record.<br/>
     * This appears to be purely internal and unused.
     * @property {number} CryptoAccountAutoRenew=33 Auto-renew an account.<br/>
     * This is used for internal fee calculations.
     * @property {number} ContractAutoRenew=34 Auto-renew a smart contract.<br/>
     * This is used for internal fee calculations.
     * @property {number} GetVersionInfo=35 Get version information for the ledger.<br/>
     * This returns a the version of the software currently running the network
     * for both the protocol buffers and the network services (node).
     * @property {number} TransactionGetReceipt=36 Get a receipt for a specified transaction ID.
     * @property {number} ConsensusCreateTopic=50 Create a topic for the Hedera Consensus Service (HCS).
     * @property {number} ConsensusUpdateTopic=51 Update an HCS topic.
     * @property {number} ConsensusDeleteTopic=52 Delete an HCS topic.
     * @property {number} ConsensusGetTopicInfo=53 Get metadata (information) for an HCS topic.
     * @property {number} ConsensusSubmitMessage=54 Publish a message to an HCS topic.
     * @property {number} UncheckedSubmit=55 Submit a transaction, bypassing intake checking.
     * Only enabled in local-mode.
     * @property {number} TokenCreate=56 Create a token for the Hedera Token Service (HTS).
     * @property {number} TokenGetInfo=58 Get metadata (information) for an HTS token.
     * @property {number} TokenFreezeAccount=59 Freeze a specific account with respect to a specific HTS token.
     * <p>
     * Once this transaction completes that account CANNOT send or receive
     * the specified token.
     * @property {number} TokenUnfreezeAccount=60 Remove a "freeze" from an account with respect to a specific HTS token.
     * @property {number} TokenGrantKycToAccount=61 Grant KYC status to an account for a specific HTS token.
     * @property {number} TokenRevokeKycFromAccount=62 Revoke KYC status from an account for a specific HTS token.
     * @property {number} TokenDelete=63 Delete a specific HTS token.
     * @property {number} TokenUpdate=64 Update a specific HTS token.
     * @property {number} TokenMint=65 Mint HTS token amounts to the treasury account for that token.
     * @property {number} TokenBurn=66 Burn HTS token amounts from the treasury account for that token.
     * @property {number} TokenAccountWipe=67 Wipe all amounts for a specific HTS token from a specified account.
     * @property {number} TokenAssociateToAccount=68 Associate a specific HTS token to an account.
     * @property {number} TokenDissociateFromAccount=69 Dissociate a specific HTS token from an account.
     * @property {number} ScheduleCreate=70 Create a scheduled transaction
     * @property {number} ScheduleDelete=71 Delete a scheduled transaction
     * @property {number} ScheduleSign=72 Sign a scheduled transaction
     * @property {number} ScheduleGetInfo=73 Get metadata (information) for a scheduled transaction
     * @property {number} TokenGetAccountNftInfos=74 Get NFT metadata (information) for a range of NFTs associated to a
     * specific non-fungible/unique HTS token and owned by a specific account.
     * @property {number} TokenGetNftInfo=75 Get metadata (information) for a specific NFT identified by token and
     * serial number.
     * @property {number} TokenGetNftInfos=76 Get NFT metadata (information) for a range of NFTs associated to a
     * specific non-fungible/unique HTS token.
     * @property {number} TokenFeeScheduleUpdate=77 Update a token's custom fee schedule.
     * <p>
     * If a transaction of this type is not signed by the token
     * `fee_schedule_key` it SHALL fail with INVALID_SIGNATURE, or
     * TOKEN_HAS_NO_FEE_SCHEDULE_KEY if there is no `fee_schedule_key` set.
     * @property {number} NetworkGetExecutionTime=78 Get execution time(s) for one or more "recent" TransactionIDs.
     * @property {number} TokenPause=79 Pause a specific HTS token
     * @property {number} TokenUnpause=80 Unpause a paused HTS token.
     * @property {number} CryptoApproveAllowance=81 Approve an allowance for a spender relative to the owner account, which
     * MUST sign the transaction.
     * @property {number} CryptoDeleteAllowance=82 Delete (unapprove) an allowance previously approved
     * for the owner account.
     * @property {number} GetAccountDetails=83 Get all the information about an account, including balance
     * and allowances.<br/>
     * This does not get a list of account records.
     * @property {number} EthereumTransaction=84 Perform an Ethereum (EVM) transaction.<br/>
     * CallData may be inline if small, or in a "file" if large.
     * @property {number} NodeStakeUpdate=85 Used to indicate when the network has updated the staking information
     * at the end of a staking period and to indicate a new staking period
     * has started.
     * @property {number} UtilPrng=86 Generate and return a pseudorandom number based on network state.
     * @property {number} TransactionGetFastRecord=87 Get a record for a "recent" transaction.
     * @property {number} TokenUpdateNfts=88 Update the metadata of one or more NFT's of a specific token type.
     * @property {number} NodeCreate=89 Create a node
     * @property {number} NodeUpdate=90 Update a node
     * @property {number} NodeDelete=91 Delete a node
     * @property {number} TokenReject=92 Transfer one or more token balances held by the requesting account
     * to the treasury for each token type.
     * @property {number} TokenAirdrop=93 Airdrop one or more tokens to one or more accounts.
     * @property {number} TokenCancelAirdrop=94 Remove one or more pending airdrops from state on behalf of
     * the sender(s) for each airdrop.
     * @property {number} TokenClaimAirdrop=95 Claim one or more pending airdrops
     * @property {number} StateSignatureTransaction=100 Submit a signature of a state root hash gossiped to other nodes
     * @property {number} HintsKeyPublication=101 Publish a hinTS key to the network.
     * @property {number} HintsPreprocessingVote=102 Vote for a particular preprocessing output of a hinTS construction.
     * @property {number} HintsPartialSignature=103 Sign a partial signature for the active hinTS construction.
     * @property {number} HistoryAssemblySignature=104 Sign a particular history assembly.
     * @property {number} HistoryProofKeyPublication=105 Publish a roster history proof key to the network.
     * @property {number} HistoryProofVote=106 Vote for a particular history proof.
     * @property {number} CrsPublication=107 Publish a random CRS to the network.
     * @property {number} AtomicBatch=108 Submit a batch of transactions to run atomically
     */
    proto.HederaFunctionality = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "NONE"] = 0;
        values[valuesById[1] = "CryptoTransfer"] = 1;
        values[valuesById[2] = "CryptoUpdate"] = 2;
        values[valuesById[3] = "CryptoDelete"] = 3;
        values[valuesById[4] = "CryptoAddLiveHash"] = 4;
        values[valuesById[5] = "CryptoDeleteLiveHash"] = 5;
        values[valuesById[6] = "ContractCall"] = 6;
        values[valuesById[7] = "ContractCreate"] = 7;
        values[valuesById[8] = "ContractUpdate"] = 8;
        values[valuesById[9] = "FileCreate"] = 9;
        values[valuesById[10] = "FileAppend"] = 10;
        values[valuesById[11] = "FileUpdate"] = 11;
        values[valuesById[12] = "FileDelete"] = 12;
        values[valuesById[13] = "CryptoGetAccountBalance"] = 13;
        values[valuesById[14] = "CryptoGetAccountRecords"] = 14;
        values[valuesById[15] = "CryptoGetInfo"] = 15;
        values[valuesById[16] = "ContractCallLocal"] = 16;
        values[valuesById[17] = "ContractGetInfo"] = 17;
        values[valuesById[18] = "ContractGetBytecode"] = 18;
        values[valuesById[19] = "GetBySolidityID"] = 19;
        values[valuesById[20] = "GetByKey"] = 20;
        values[valuesById[21] = "CryptoGetLiveHash"] = 21;
        values[valuesById[22] = "CryptoGetStakers"] = 22;
        values[valuesById[23] = "FileGetContents"] = 23;
        values[valuesById[24] = "FileGetInfo"] = 24;
        values[valuesById[25] = "TransactionGetRecord"] = 25;
        values[valuesById[26] = "ContractGetRecords"] = 26;
        values[valuesById[27] = "CryptoCreate"] = 27;
        values[valuesById[28] = "SystemDelete"] = 28;
        values[valuesById[29] = "SystemUndelete"] = 29;
        values[valuesById[30] = "ContractDelete"] = 30;
        values[valuesById[31] = "Freeze"] = 31;
        values[valuesById[32] = "CreateTransactionRecord"] = 32;
        values[valuesById[33] = "CryptoAccountAutoRenew"] = 33;
        values[valuesById[34] = "ContractAutoRenew"] = 34;
        values[valuesById[35] = "GetVersionInfo"] = 35;
        values[valuesById[36] = "TransactionGetReceipt"] = 36;
        values[valuesById[50] = "ConsensusCreateTopic"] = 50;
        values[valuesById[51] = "ConsensusUpdateTopic"] = 51;
        values[valuesById[52] = "ConsensusDeleteTopic"] = 52;
        values[valuesById[53] = "ConsensusGetTopicInfo"] = 53;
        values[valuesById[54] = "ConsensusSubmitMessage"] = 54;
        values[valuesById[55] = "UncheckedSubmit"] = 55;
        values[valuesById[56] = "TokenCreate"] = 56;
        values[valuesById[58] = "TokenGetInfo"] = 58;
        values[valuesById[59] = "TokenFreezeAccount"] = 59;
        values[valuesById[60] = "TokenUnfreezeAccount"] = 60;
        values[valuesById[61] = "TokenGrantKycToAccount"] = 61;
        values[valuesById[62] = "TokenRevokeKycFromAccount"] = 62;
        values[valuesById[63] = "TokenDelete"] = 63;
        values[valuesById[64] = "TokenUpdate"] = 64;
        values[valuesById[65] = "TokenMint"] = 65;
        values[valuesById[66] = "TokenBurn"] = 66;
        values[valuesById[67] = "TokenAccountWipe"] = 67;
        values[valuesById[68] = "TokenAssociateToAccount"] = 68;
        values[valuesById[69] = "TokenDissociateFromAccount"] = 69;
        values[valuesById[70] = "ScheduleCreate"] = 70;
        values[valuesById[71] = "ScheduleDelete"] = 71;
        values[valuesById[72] = "ScheduleSign"] = 72;
        values[valuesById[73] = "ScheduleGetInfo"] = 73;
        values[valuesById[74] = "TokenGetAccountNftInfos"] = 74;
        values[valuesById[75] = "TokenGetNftInfo"] = 75;
        values[valuesById[76] = "TokenGetNftInfos"] = 76;
        values[valuesById[77] = "TokenFeeScheduleUpdate"] = 77;
        values[valuesById[78] = "NetworkGetExecutionTime"] = 78;
        values[valuesById[79] = "TokenPause"] = 79;
        values[valuesById[80] = "TokenUnpause"] = 80;
        values[valuesById[81] = "CryptoApproveAllowance"] = 81;
        values[valuesById[82] = "CryptoDeleteAllowance"] = 82;
        values[valuesById[83] = "GetAccountDetails"] = 83;
        values[valuesById[84] = "EthereumTransaction"] = 84;
        values[valuesById[85] = "NodeStakeUpdate"] = 85;
        values[valuesById[86] = "UtilPrng"] = 86;
        values[valuesById[87] = "TransactionGetFastRecord"] = 87;
        values[valuesById[88] = "TokenUpdateNfts"] = 88;
        values[valuesById[89] = "NodeCreate"] = 89;
        values[valuesById[90] = "NodeUpdate"] = 90;
        values[valuesById[91] = "NodeDelete"] = 91;
        values[valuesById[92] = "TokenReject"] = 92;
        values[valuesById[93] = "TokenAirdrop"] = 93;
        values[valuesById[94] = "TokenCancelAirdrop"] = 94;
        values[valuesById[95] = "TokenClaimAirdrop"] = 95;
        values[valuesById[100] = "StateSignatureTransaction"] = 100;
        values[valuesById[101] = "HintsKeyPublication"] = 101;
        values[valuesById[102] = "HintsPreprocessingVote"] = 102;
        values[valuesById[103] = "HintsPartialSignature"] = 103;
        values[valuesById[104] = "HistoryAssemblySignature"] = 104;
        values[valuesById[105] = "HistoryProofKeyPublication"] = 105;
        values[valuesById[106] = "HistoryProofVote"] = 106;
        values[valuesById[107] = "CrsPublication"] = 107;
        values[valuesById[108] = "AtomicBatch"] = 108;
        return values;
    })();

    proto.FeeComponents = (function() {

        /**
         * Properties of a FeeComponents.
         * @memberof proto
         * @interface IFeeComponents
         * @property {Long|null} [min] Base: "minimum total fee".
         * <p>
         * The calculated fee MUST be greater than this value.
         * @property {Long|null} [max] Base: "maximum total fee".
         * <p>
         * The calculated fee MUST be less than this value.
         * @property {Long|null} [constant] Base: "constant fee".<br/>
         * A baseline constant contribution to total fee.
         * @property {Long|null} [bpt] Bandwidth: "bytes per transaction".<br/>
         * The fee for bandwidth consumed by a transaction, measured in bytes
         * @property {Long|null} [vpt] Signatures: "validations per transaction".<br/>
         * The fee for signature verifications required by a transaction
         * @property {Long|null} [rbh] Memory: "RAM byte-hours".<br/>
         * The fee for RAM required to process a transaction,
         * measured in byte-hours
         * @property {Long|null} [sbh] Disk: "storage byte-hours".<br/>
         * The fee for storage required by a transaction, measured in byte-hours
         * @property {Long|null} [gas] Compute: Ethereum term for a derivative EVM compute resource.<br/>
         * The fee of computation for a smart contract transaction. The value of
         * gas is set by a conversion rate, and is regularly updated to reflect
         * reasonable and customary costs.
         * @property {Long|null} [tv] Ad valorem: "transferred value".<br/>
         * The fee for HBAR transferred by a transaction.
         * @property {Long|null} [bpr] Response memory: "bytes per response".<br/>
         * The fee for data retrieved from memory to deliver a response,
         * measured in bytes
         * @property {Long|null} [sbpr] Response disk: "storage bytes per response".<br/>
         * The fee for data retrieved from disk to deliver a response,
         * measured in bytes
         */

        /**
         * Constructs a new FeeComponents.
         * @memberof proto
         * @classdesc A set of values the nodes use in determining transaction and query fees, and
         * constants involved in fee calculations.
         * 
         * Nodes SHALL multiply the amount of "resources" allocated to a transaction or
         * query by the corresponding price to calculate the appropriate fee. Units are
         * one-thousandth of a `tinyCent`. The "resource" allocations SHALL be estimated
         * based on transaction characteristics and current network state, and MAY be
         * further adjusted based on network load and congestion.
         * 
         * This SHALL be used, in different contexts, for the cost _factors_ used to
         * calculate charged amounts, for the resource accumulation, and for actual
         * amounts to be charged.<br/>
         * Amounts recorded here MUST be converted to tinybar according to the
         * current active `ExchangeRate` for the network.
         * @implements IFeeComponents
         * @constructor
         * @param {proto.IFeeComponents=} [p] Properties to set
         */
        function FeeComponents(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Base: "minimum total fee".
         * <p>
         * The calculated fee MUST be greater than this value.
         * @member {Long} min
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.min = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Base: "maximum total fee".
         * <p>
         * The calculated fee MUST be less than this value.
         * @member {Long} max
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.max = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Base: "constant fee".<br/>
         * A baseline constant contribution to total fee.
         * @member {Long} constant
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.constant = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Bandwidth: "bytes per transaction".<br/>
         * The fee for bandwidth consumed by a transaction, measured in bytes
         * @member {Long} bpt
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.bpt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Signatures: "validations per transaction".<br/>
         * The fee for signature verifications required by a transaction
         * @member {Long} vpt
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.vpt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Memory: "RAM byte-hours".<br/>
         * The fee for RAM required to process a transaction,
         * measured in byte-hours
         * @member {Long} rbh
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.rbh = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Disk: "storage byte-hours".<br/>
         * The fee for storage required by a transaction, measured in byte-hours
         * @member {Long} sbh
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.sbh = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Compute: Ethereum term for a derivative EVM compute resource.<br/>
         * The fee of computation for a smart contract transaction. The value of
         * gas is set by a conversion rate, and is regularly updated to reflect
         * reasonable and customary costs.
         * @member {Long} gas
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.gas = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Ad valorem: "transferred value".<br/>
         * The fee for HBAR transferred by a transaction.
         * @member {Long} tv
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.tv = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Response memory: "bytes per response".<br/>
         * The fee for data retrieved from memory to deliver a response,
         * measured in bytes
         * @member {Long} bpr
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.bpr = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Response disk: "storage bytes per response".<br/>
         * The fee for data retrieved from disk to deliver a response,
         * measured in bytes
         * @member {Long} sbpr
         * @memberof proto.FeeComponents
         * @instance
         */
        FeeComponents.prototype.sbpr = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new FeeComponents instance using the specified properties.
         * @function create
         * @memberof proto.FeeComponents
         * @static
         * @param {proto.IFeeComponents=} [properties] Properties to set
         * @returns {proto.FeeComponents} FeeComponents instance
         */
        FeeComponents.create = function create(properties) {
            return new FeeComponents(properties);
        };

        /**
         * Encodes the specified FeeComponents message. Does not implicitly {@link proto.FeeComponents.verify|verify} messages.
         * @function encode
         * @memberof proto.FeeComponents
         * @static
         * @param {proto.IFeeComponents} m FeeComponents message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FeeComponents.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.min != null && Object.hasOwnProperty.call(m, "min"))
                w.uint32(8).int64(m.min);
            if (m.max != null && Object.hasOwnProperty.call(m, "max"))
                w.uint32(16).int64(m.max);
            if (m.constant != null && Object.hasOwnProperty.call(m, "constant"))
                w.uint32(24).int64(m.constant);
            if (m.bpt != null && Object.hasOwnProperty.call(m, "bpt"))
                w.uint32(32).int64(m.bpt);
            if (m.vpt != null && Object.hasOwnProperty.call(m, "vpt"))
                w.uint32(40).int64(m.vpt);
            if (m.rbh != null && Object.hasOwnProperty.call(m, "rbh"))
                w.uint32(48).int64(m.rbh);
            if (m.sbh != null && Object.hasOwnProperty.call(m, "sbh"))
                w.uint32(56).int64(m.sbh);
            if (m.gas != null && Object.hasOwnProperty.call(m, "gas"))
                w.uint32(64).int64(m.gas);
            if (m.tv != null && Object.hasOwnProperty.call(m, "tv"))
                w.uint32(72).int64(m.tv);
            if (m.bpr != null && Object.hasOwnProperty.call(m, "bpr"))
                w.uint32(80).int64(m.bpr);
            if (m.sbpr != null && Object.hasOwnProperty.call(m, "sbpr"))
                w.uint32(88).int64(m.sbpr);
            return w;
        };

        /**
         * Decodes a FeeComponents message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FeeComponents
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FeeComponents} FeeComponents
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FeeComponents.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FeeComponents();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.min = r.int64();
                        break;
                    }
                case 2: {
                        m.max = r.int64();
                        break;
                    }
                case 3: {
                        m.constant = r.int64();
                        break;
                    }
                case 4: {
                        m.bpt = r.int64();
                        break;
                    }
                case 5: {
                        m.vpt = r.int64();
                        break;
                    }
                case 6: {
                        m.rbh = r.int64();
                        break;
                    }
                case 7: {
                        m.sbh = r.int64();
                        break;
                    }
                case 8: {
                        m.gas = r.int64();
                        break;
                    }
                case 9: {
                        m.tv = r.int64();
                        break;
                    }
                case 10: {
                        m.bpr = r.int64();
                        break;
                    }
                case 11: {
                        m.sbpr = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FeeComponents
         * @function getTypeUrl
         * @memberof proto.FeeComponents
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FeeComponents.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeComponents";
        };

        return FeeComponents;
    })();

    proto.TransactionFeeSchedule = (function() {

        /**
         * Properties of a TransactionFeeSchedule.
         * @memberof proto
         * @interface ITransactionFeeSchedule
         * @property {proto.HederaFunctionality|null} [hederaFunctionality] An enumeration for a particular transaction or query.<br/>
         * The functionality type determines the base cost parameters.
         * @property {proto.IFeeData|null} [feeData] Use `fees` instead of this field.<br/>
         * Resource price coefficients.
         * @property {Array.<proto.IFeeData>|null} [fees] The resource price coefficients for transaction type and any applicable
         * subtypes.<br/>
         * The multiple entries enable support for subtype price definitions.
         */

        /**
         * Constructs a new TransactionFeeSchedule.
         * @memberof proto
         * @classdesc The fee schedule for a specific transaction or query based on the fee data.
         * @implements ITransactionFeeSchedule
         * @constructor
         * @param {proto.ITransactionFeeSchedule=} [p] Properties to set
         */
        function TransactionFeeSchedule(p) {
            this.fees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * An enumeration for a particular transaction or query.<br/>
         * The functionality type determines the base cost parameters.
         * @member {proto.HederaFunctionality} hederaFunctionality
         * @memberof proto.TransactionFeeSchedule
         * @instance
         */
        TransactionFeeSchedule.prototype.hederaFunctionality = 0;

        /**
         * Use `fees` instead of this field.<br/>
         * Resource price coefficients.
         * @member {proto.IFeeData|null|undefined} feeData
         * @memberof proto.TransactionFeeSchedule
         * @instance
         */
        TransactionFeeSchedule.prototype.feeData = null;

        /**
         * The resource price coefficients for transaction type and any applicable
         * subtypes.<br/>
         * The multiple entries enable support for subtype price definitions.
         * @member {Array.<proto.IFeeData>} fees
         * @memberof proto.TransactionFeeSchedule
         * @instance
         */
        TransactionFeeSchedule.prototype.fees = $util.emptyArray;

        /**
         * Creates a new TransactionFeeSchedule instance using the specified properties.
         * @function create
         * @memberof proto.TransactionFeeSchedule
         * @static
         * @param {proto.ITransactionFeeSchedule=} [properties] Properties to set
         * @returns {proto.TransactionFeeSchedule} TransactionFeeSchedule instance
         */
        TransactionFeeSchedule.create = function create(properties) {
            return new TransactionFeeSchedule(properties);
        };

        /**
         * Encodes the specified TransactionFeeSchedule message. Does not implicitly {@link proto.TransactionFeeSchedule.verify|verify} messages.
         * @function encode
         * @memberof proto.TransactionFeeSchedule
         * @static
         * @param {proto.ITransactionFeeSchedule} m TransactionFeeSchedule message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TransactionFeeSchedule.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.hederaFunctionality != null && Object.hasOwnProperty.call(m, "hederaFunctionality"))
                w.uint32(8).int32(m.hederaFunctionality);
            if (m.feeData != null && Object.hasOwnProperty.call(m, "feeData"))
                $root.proto.FeeData.encode(m.feeData, w.uint32(18).fork()).ldelim();
            if (m.fees != null && m.fees.length) {
                for (var i = 0; i < m.fees.length; ++i)
                    $root.proto.FeeData.encode(m.fees[i], w.uint32(26).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a TransactionFeeSchedule message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TransactionFeeSchedule
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TransactionFeeSchedule} TransactionFeeSchedule
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TransactionFeeSchedule.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TransactionFeeSchedule();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.hederaFunctionality = r.int32();
                        break;
                    }
                case 2: {
                        m.feeData = $root.proto.FeeData.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        if (!(m.fees && m.fees.length))
                            m.fees = [];
                        m.fees.push($root.proto.FeeData.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TransactionFeeSchedule
         * @function getTypeUrl
         * @memberof proto.TransactionFeeSchedule
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TransactionFeeSchedule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionFeeSchedule";
        };

        return TransactionFeeSchedule;
    })();

    proto.FeeData = (function() {

        /**
         * Properties of a FeeData.
         * @memberof proto
         * @interface IFeeData
         * @property {proto.IFeeComponents|null} [nodedata] Fee components to be paid to the submitting node.
         * @property {proto.IFeeComponents|null} [networkdata] Fee components to be paid to the network for bringing a
         * transaction to consensus.
         * @property {proto.IFeeComponents|null} [servicedata] Fee components to be paid to the network for providing the immediate and
         * ongoing services associated with executing the transaction, maintaining
         * the network, and developing the network software.
         * @property {proto.SubType|null} [subType] A sub-type distinguishing between different types of `FeeData` that may
         * apply to the same base transaction type (associated with
         * an `HederaFunctionality`).
         */

        /**
         * Constructs a new FeeData.
         * @memberof proto
         * @classdesc A total fee, in component amounts charged for a transaction.
         * 
         * Total fees are composed of three sets of components.
         * - Node data, components that compensate the specific node that submitted
         * the transaction.
         * - Network data, components that compensate the Hedera network for gossiping
         * the transaction and determining the consensus timestamp.
         * - Service data, components that compensate the Hedera network for the ongoing
         * maintenance and operation of the network, as well as ongoing development
         * of network services.
         * 
         * Fee components are recorded in thousandths of a tiny cent, and the network
         * exchange rate converts these to tinybar amounts, which are what the network
         * charges for transactions and what the network reports in the record stream.
         * @implements IFeeData
         * @constructor
         * @param {proto.IFeeData=} [p] Properties to set
         */
        function FeeData(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Fee components to be paid to the submitting node.
         * @member {proto.IFeeComponents|null|undefined} nodedata
         * @memberof proto.FeeData
         * @instance
         */
        FeeData.prototype.nodedata = null;

        /**
         * Fee components to be paid to the network for bringing a
         * transaction to consensus.
         * @member {proto.IFeeComponents|null|undefined} networkdata
         * @memberof proto.FeeData
         * @instance
         */
        FeeData.prototype.networkdata = null;

        /**
         * Fee components to be paid to the network for providing the immediate and
         * ongoing services associated with executing the transaction, maintaining
         * the network, and developing the network software.
         * @member {proto.IFeeComponents|null|undefined} servicedata
         * @memberof proto.FeeData
         * @instance
         */
        FeeData.prototype.servicedata = null;

        /**
         * A sub-type distinguishing between different types of `FeeData` that may
         * apply to the same base transaction type (associated with
         * an `HederaFunctionality`).
         * @member {proto.SubType} subType
         * @memberof proto.FeeData
         * @instance
         */
        FeeData.prototype.subType = 0;

        /**
         * Creates a new FeeData instance using the specified properties.
         * @function create
         * @memberof proto.FeeData
         * @static
         * @param {proto.IFeeData=} [properties] Properties to set
         * @returns {proto.FeeData} FeeData instance
         */
        FeeData.create = function create(properties) {
            return new FeeData(properties);
        };

        /**
         * Encodes the specified FeeData message. Does not implicitly {@link proto.FeeData.verify|verify} messages.
         * @function encode
         * @memberof proto.FeeData
         * @static
         * @param {proto.IFeeData} m FeeData message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FeeData.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.nodedata != null && Object.hasOwnProperty.call(m, "nodedata"))
                $root.proto.FeeComponents.encode(m.nodedata, w.uint32(10).fork()).ldelim();
            if (m.networkdata != null && Object.hasOwnProperty.call(m, "networkdata"))
                $root.proto.FeeComponents.encode(m.networkdata, w.uint32(18).fork()).ldelim();
            if (m.servicedata != null && Object.hasOwnProperty.call(m, "servicedata"))
                $root.proto.FeeComponents.encode(m.servicedata, w.uint32(26).fork()).ldelim();
            if (m.subType != null && Object.hasOwnProperty.call(m, "subType"))
                w.uint32(32).int32(m.subType);
            return w;
        };

        /**
         * Decodes a FeeData message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FeeData
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FeeData} FeeData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FeeData.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FeeData();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.nodedata = $root.proto.FeeComponents.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.networkdata = $root.proto.FeeComponents.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.servicedata = $root.proto.FeeComponents.decode(r, r.uint32());
                        break;
                    }
                case 4: {
                        m.subType = r.int32();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FeeData
         * @function getTypeUrl
         * @memberof proto.FeeData
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FeeData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeData";
        };

        return FeeData;
    })();

    proto.FeeSchedule = (function() {

        /**
         * Properties of a FeeSchedule.
         * @memberof proto
         * @interface IFeeSchedule
         * @property {Array.<proto.ITransactionFeeSchedule>|null} [transactionFeeSchedule] Sets of fee coefficients for various transaction or query types.
         * @property {proto.ITimestampSeconds|null} [expiryTime] A time, in seconds since the `epoch`, when this fee schedule
         * will expire.
         * <p>
         * For this purpose, `epoch` SHALL be the UNIX epoch
         * with 0 at `1970-01-01T00:00:00.000Z`.
         */

        /**
         * Constructs a new FeeSchedule.
         * @memberof proto
         * @classdesc A set of fee schedules covering all transaction types and query types, along
         * with a specific time at which this fee schedule will expire.
         * 
         * Nodes SHALL use the most recent unexpired fee schedule to determine the fees
         * for all transactions based on various resource components imputed to each
         * transaction.
         * @implements IFeeSchedule
         * @constructor
         * @param {proto.IFeeSchedule=} [p] Properties to set
         */
        function FeeSchedule(p) {
            this.transactionFeeSchedule = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Sets of fee coefficients for various transaction or query types.
         * @member {Array.<proto.ITransactionFeeSchedule>} transactionFeeSchedule
         * @memberof proto.FeeSchedule
         * @instance
         */
        FeeSchedule.prototype.transactionFeeSchedule = $util.emptyArray;

        /**
         * A time, in seconds since the `epoch`, when this fee schedule
         * will expire.
         * <p>
         * For this purpose, `epoch` SHALL be the UNIX epoch
         * with 0 at `1970-01-01T00:00:00.000Z`.
         * @member {proto.ITimestampSeconds|null|undefined} expiryTime
         * @memberof proto.FeeSchedule
         * @instance
         */
        FeeSchedule.prototype.expiryTime = null;

        /**
         * Creates a new FeeSchedule instance using the specified properties.
         * @function create
         * @memberof proto.FeeSchedule
         * @static
         * @param {proto.IFeeSchedule=} [properties] Properties to set
         * @returns {proto.FeeSchedule} FeeSchedule instance
         */
        FeeSchedule.create = function create(properties) {
            return new FeeSchedule(properties);
        };

        /**
         * Encodes the specified FeeSchedule message. Does not implicitly {@link proto.FeeSchedule.verify|verify} messages.
         * @function encode
         * @memberof proto.FeeSchedule
         * @static
         * @param {proto.IFeeSchedule} m FeeSchedule message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FeeSchedule.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.transactionFeeSchedule != null && m.transactionFeeSchedule.length) {
                for (var i = 0; i < m.transactionFeeSchedule.length; ++i)
                    $root.proto.TransactionFeeSchedule.encode(m.transactionFeeSchedule[i], w.uint32(10).fork()).ldelim();
            }
            if (m.expiryTime != null && Object.hasOwnProperty.call(m, "expiryTime"))
                $root.proto.TimestampSeconds.encode(m.expiryTime, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a FeeSchedule message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FeeSchedule
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FeeSchedule} FeeSchedule
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FeeSchedule.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FeeSchedule();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.transactionFeeSchedule && m.transactionFeeSchedule.length))
                            m.transactionFeeSchedule = [];
                        m.transactionFeeSchedule.push($root.proto.TransactionFeeSchedule.decode(r, r.uint32()));
                        break;
                    }
                case 2: {
                        m.expiryTime = $root.proto.TimestampSeconds.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FeeSchedule
         * @function getTypeUrl
         * @memberof proto.FeeSchedule
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FeeSchedule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeSchedule";
        };

        return FeeSchedule;
    })();

    proto.CurrentAndNextFeeSchedule = (function() {

        /**
         * Properties of a CurrentAndNextFeeSchedule.
         * @memberof proto
         * @interface ICurrentAndNextFeeSchedule
         * @property {proto.IFeeSchedule|null} [currentFeeSchedule] A current, unexpired, fee schedule.
         * @property {proto.IFeeSchedule|null} [nextFeeSchedule] A future fee schedule to use when the current schedule expires.
         */

        /**
         * Constructs a new CurrentAndNextFeeSchedule.
         * @memberof proto
         * @classdesc The "current" fee schedule and the "next" fee schedule.
         * 
         * The current fee schedule is the schedule that SHALL apply to the current
         * transaction.<br/>
         * The next fee schedule is the schedule that SHALL apply after the current
         * schedule expires.<br/>
         * We store both to avoid a condition where transactions are processed very
         * near the time when a fee schedule expires and it might be indeterminate
         * which fees to apply. With both current and next fee schedule the network
         * can deterministically apply the correct fee schedule based on consensus
         * timestamp for each transaction.
         * @implements ICurrentAndNextFeeSchedule
         * @constructor
         * @param {proto.ICurrentAndNextFeeSchedule=} [p] Properties to set
         */
        function CurrentAndNextFeeSchedule(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A current, unexpired, fee schedule.
         * @member {proto.IFeeSchedule|null|undefined} currentFeeSchedule
         * @memberof proto.CurrentAndNextFeeSchedule
         * @instance
         */
        CurrentAndNextFeeSchedule.prototype.currentFeeSchedule = null;

        /**
         * A future fee schedule to use when the current schedule expires.
         * @member {proto.IFeeSchedule|null|undefined} nextFeeSchedule
         * @memberof proto.CurrentAndNextFeeSchedule
         * @instance
         */
        CurrentAndNextFeeSchedule.prototype.nextFeeSchedule = null;

        /**
         * Creates a new CurrentAndNextFeeSchedule instance using the specified properties.
         * @function create
         * @memberof proto.CurrentAndNextFeeSchedule
         * @static
         * @param {proto.ICurrentAndNextFeeSchedule=} [properties] Properties to set
         * @returns {proto.CurrentAndNextFeeSchedule} CurrentAndNextFeeSchedule instance
         */
        CurrentAndNextFeeSchedule.create = function create(properties) {
            return new CurrentAndNextFeeSchedule(properties);
        };

        /**
         * Encodes the specified CurrentAndNextFeeSchedule message. Does not implicitly {@link proto.CurrentAndNextFeeSchedule.verify|verify} messages.
         * @function encode
         * @memberof proto.CurrentAndNextFeeSchedule
         * @static
         * @param {proto.ICurrentAndNextFeeSchedule} m CurrentAndNextFeeSchedule message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CurrentAndNextFeeSchedule.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.currentFeeSchedule != null && Object.hasOwnProperty.call(m, "currentFeeSchedule"))
                $root.proto.FeeSchedule.encode(m.currentFeeSchedule, w.uint32(10).fork()).ldelim();
            if (m.nextFeeSchedule != null && Object.hasOwnProperty.call(m, "nextFeeSchedule"))
                $root.proto.FeeSchedule.encode(m.nextFeeSchedule, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a CurrentAndNextFeeSchedule message from the specified reader or buffer.
         * @function decode
         * @memberof proto.CurrentAndNextFeeSchedule
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.CurrentAndNextFeeSchedule} CurrentAndNextFeeSchedule
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CurrentAndNextFeeSchedule.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.CurrentAndNextFeeSchedule();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.currentFeeSchedule = $root.proto.FeeSchedule.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.nextFeeSchedule = $root.proto.FeeSchedule.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for CurrentAndNextFeeSchedule
         * @function getTypeUrl
         * @memberof proto.CurrentAndNextFeeSchedule
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        CurrentAndNextFeeSchedule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.CurrentAndNextFeeSchedule";
        };

        return CurrentAndNextFeeSchedule;
    })();

    proto.ServiceEndpoint = (function() {

        /**
         * Properties of a ServiceEndpoint.
         * @memberof proto
         * @interface IServiceEndpoint
         * @property {Uint8Array|null} [ipAddressV4] A 32-bit IPv4 address.<br/>
         * This is the address of the endpoint, encoded in pure "big-endian"
         * (i.e. left to right) order (e.g. `127.0.0.1` has hex bytes in the
         * order `7F`, `00`, `00`, `01`).
         * @property {number|null} [port] A TCP port to use.
         * <p>
         * This value MUST be between 0 and 65535, inclusive.
         * @property {string|null} [domainName] A node domain name.
         * <p>
         * This MUST be the fully qualified domain name of the node.<br/>
         * This value MUST NOT exceed 253 characters.<br/>
         * When the `domain_name` field is set, the `ipAddressV4`
         * field MUST NOT be set.<br/>
         * When the `ipAddressV4` field is set, the `domain_name`
         * field MUST NOT be set.
         */

        /**
         * Constructs a new ServiceEndpoint.
         * @memberof proto
         * @classdesc A network node endpoint.<br/>
         * Each network node in the global address book publishes one or more endpoints
         * which enable the nodes to communicate both with other nodes, for gossip, and
         * with clients to receive transaction requests.
         * 
         * This message supports IPv4 with address and TCP port,
         * and MAY include a FQDN instead of an IP address.<br/>
         * IPv6 is not currently supported.
         * 
         * When the `domain_name` field is set, the `ipAddressV4` field
         * MUST NOT be set.<br/>
         * When the `ipAddressV4` field is set, the `domain_name` field
         * MUST NOT be set.
         * @implements IServiceEndpoint
         * @constructor
         * @param {proto.IServiceEndpoint=} [p] Properties to set
         */
        function ServiceEndpoint(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A 32-bit IPv4 address.<br/>
         * This is the address of the endpoint, encoded in pure "big-endian"
         * (i.e. left to right) order (e.g. `127.0.0.1` has hex bytes in the
         * order `7F`, `00`, `00`, `01`).
         * @member {Uint8Array} ipAddressV4
         * @memberof proto.ServiceEndpoint
         * @instance
         */
        ServiceEndpoint.prototype.ipAddressV4 = $util.newBuffer([]);

        /**
         * A TCP port to use.
         * <p>
         * This value MUST be between 0 and 65535, inclusive.
         * @member {number} port
         * @memberof proto.ServiceEndpoint
         * @instance
         */
        ServiceEndpoint.prototype.port = 0;

        /**
         * A node domain name.
         * <p>
         * This MUST be the fully qualified domain name of the node.<br/>
         * This value MUST NOT exceed 253 characters.<br/>
         * When the `domain_name` field is set, the `ipAddressV4`
         * field MUST NOT be set.<br/>
         * When the `ipAddressV4` field is set, the `domain_name`
         * field MUST NOT be set.
         * @member {string} domainName
         * @memberof proto.ServiceEndpoint
         * @instance
         */
        ServiceEndpoint.prototype.domainName = "";

        /**
         * Creates a new ServiceEndpoint instance using the specified properties.
         * @function create
         * @memberof proto.ServiceEndpoint
         * @static
         * @param {proto.IServiceEndpoint=} [properties] Properties to set
         * @returns {proto.ServiceEndpoint} ServiceEndpoint instance
         */
        ServiceEndpoint.create = function create(properties) {
            return new ServiceEndpoint(properties);
        };

        /**
         * Encodes the specified ServiceEndpoint message. Does not implicitly {@link proto.ServiceEndpoint.verify|verify} messages.
         * @function encode
         * @memberof proto.ServiceEndpoint
         * @static
         * @param {proto.IServiceEndpoint} m ServiceEndpoint message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ServiceEndpoint.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.ipAddressV4 != null && Object.hasOwnProperty.call(m, "ipAddressV4"))
                w.uint32(10).bytes(m.ipAddressV4);
            if (m.port != null && Object.hasOwnProperty.call(m, "port"))
                w.uint32(16).int32(m.port);
            if (m.domainName != null && Object.hasOwnProperty.call(m, "domainName"))
                w.uint32(26).string(m.domainName);
            return w;
        };

        /**
         * Decodes a ServiceEndpoint message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ServiceEndpoint
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ServiceEndpoint} ServiceEndpoint
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ServiceEndpoint.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ServiceEndpoint();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.ipAddressV4 = r.bytes();
                        break;
                    }
                case 2: {
                        m.port = r.int32();
                        break;
                    }
                case 3: {
                        m.domainName = r.string();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ServiceEndpoint
         * @function getTypeUrl
         * @memberof proto.ServiceEndpoint
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ServiceEndpoint.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ServiceEndpoint";
        };

        return ServiceEndpoint;
    })();

    proto.NodeAddress = (function() {

        /**
         * Properties of a NodeAddress.
         * @memberof proto
         * @interface INodeAddress
         * @property {Uint8Array|null} [ipAddress] ServiceEndpoint is now used to retrieve a node's list of IP
         * addresses and ports.<br/>
         * The IP address of the Node, as a string, encoded in UTF-8.<br/>
         * This value SHALL NOT be populated.
         * @property {number|null} [portno] ServiceEndpoint is now used to retrieve a node's list of IP
         * addresses and ports.<br/>
         * The port number of the grpc server for the node.<br/>
         * This value SHALL NOT be populated.
         * @property {Uint8Array|null} [memo] Description provides short text functionality.<br/>
         * A short description of the node.
         * <p>
         * This field SHALL NOT be populated.
         * @property {string|null} [RSA_PubKey] A hexadecimal String encoding of an X509 public key.
         * <p>
         * This X509 RSA _public_ key SHALL be used to verify record stream files
         * (e.g., record stream files).<br/>
         * This field SHALL be a string of hexadecimal characters, encoded UTF-8,
         * which, translated to binary, form the public key DER encoding.
         * @property {Long|null} [nodeId] A numeric identifier for the node.
         * <p>
         * This value SHALL NOT be sequential.
         * <p>
         * A `0.0.101` field
         * @property {proto.IAccountID|null} [nodeAccountId] An account to be paid the "node" portion of transaction fees.<br/>
         * The "node" fees are paid to the node that submitted the transaction.
         * <p>
         * A `0.0.101` field
         * @property {Uint8Array|null} [nodeCertHash] A hash of the node's TLS certificate.
         * <p>
         * This field SHALL be a string of hexadecimal characters, encoded UTF-8,
         * which, translated to binary, form a SHA-384 hash of the node's TLS
         * certificate in PEM format.
         * This TLS certificate MUST be encoded UTF-8 and normalized according to
         * the NFKD form prior to computing the hash value.<br/>
         * The value of this field SHALL be used to verify the node TLS
         * certificate when presented during protocol negotiation.
         * <p>
         * A `0.0.101` field
         * @property {Array.<proto.IServiceEndpoint>|null} [serviceEndpoint] A node's service IP addresses and TCP ports.<br/>
         * Nodes require multiple endpoints to ensure that inter-node communication
         * (e.g. gossip) is properly separated from client communication to
         * API endpoints.
         * <p>
         * A `0.0.101` field
         * @property {string|null} [description] A short description of the node.
         * <p>
         * This value, if set, MUST NOT exceed `transaction.maxMemoUtf8Bytes`
         * (default 100) bytes when encoded as UTF-8.
         * @property {Long|null} [stake] This is replaced by per-account stake tracking and dynamic
         * calculation.<br/>
         * The amount of tinybar staked to the node.<br/>
         * This value SHOULD NOT be populated, and SHALL be ignored.
         */

        /**
         * Constructs a new NodeAddress.
         * @memberof proto
         * @classdesc The data about a node, including its service endpoints and the Hedera account
         * to be paid for services provided by the node (that is, queries answered and
         * transactions submitted).
         * 
         * All active fields are populated in the `0.0.102` address book file.<br/>
         * Only fields documented with "`0.0.101` field" are populated in the 0.0.101
         * address book file.
         * 
         * This message MAY be superseded by messages in state/addressbook/node.proto
         * and node_get_info.proto.
         * @implements INodeAddress
         * @constructor
         * @param {proto.INodeAddress=} [p] Properties to set
         */
        function NodeAddress(p) {
            this.serviceEndpoint = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * ServiceEndpoint is now used to retrieve a node's list of IP
         * addresses and ports.<br/>
         * The IP address of the Node, as a string, encoded in UTF-8.<br/>
         * This value SHALL NOT be populated.
         * @member {Uint8Array} ipAddress
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.ipAddress = $util.newBuffer([]);

        /**
         * ServiceEndpoint is now used to retrieve a node's list of IP
         * addresses and ports.<br/>
         * The port number of the grpc server for the node.<br/>
         * This value SHALL NOT be populated.
         * @member {number} portno
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.portno = 0;

        /**
         * Description provides short text functionality.<br/>
         * A short description of the node.
         * <p>
         * This field SHALL NOT be populated.
         * @member {Uint8Array} memo
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.memo = $util.newBuffer([]);

        /**
         * A hexadecimal String encoding of an X509 public key.
         * <p>
         * This X509 RSA _public_ key SHALL be used to verify record stream files
         * (e.g., record stream files).<br/>
         * This field SHALL be a string of hexadecimal characters, encoded UTF-8,
         * which, translated to binary, form the public key DER encoding.
         * @member {string} RSA_PubKey
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.RSA_PubKey = "";

        /**
         * A numeric identifier for the node.
         * <p>
         * This value SHALL NOT be sequential.
         * <p>
         * A `0.0.101` field
         * @member {Long} nodeId
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.nodeId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * An account to be paid the "node" portion of transaction fees.<br/>
         * The "node" fees are paid to the node that submitted the transaction.
         * <p>
         * A `0.0.101` field
         * @member {proto.IAccountID|null|undefined} nodeAccountId
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.nodeAccountId = null;

        /**
         * A hash of the node's TLS certificate.
         * <p>
         * This field SHALL be a string of hexadecimal characters, encoded UTF-8,
         * which, translated to binary, form a SHA-384 hash of the node's TLS
         * certificate in PEM format.
         * This TLS certificate MUST be encoded UTF-8 and normalized according to
         * the NFKD form prior to computing the hash value.<br/>
         * The value of this field SHALL be used to verify the node TLS
         * certificate when presented during protocol negotiation.
         * <p>
         * A `0.0.101` field
         * @member {Uint8Array} nodeCertHash
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.nodeCertHash = $util.newBuffer([]);

        /**
         * A node's service IP addresses and TCP ports.<br/>
         * Nodes require multiple endpoints to ensure that inter-node communication
         * (e.g. gossip) is properly separated from client communication to
         * API endpoints.
         * <p>
         * A `0.0.101` field
         * @member {Array.<proto.IServiceEndpoint>} serviceEndpoint
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.serviceEndpoint = $util.emptyArray;

        /**
         * A short description of the node.
         * <p>
         * This value, if set, MUST NOT exceed `transaction.maxMemoUtf8Bytes`
         * (default 100) bytes when encoded as UTF-8.
         * @member {string} description
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.description = "";

        /**
         * This is replaced by per-account stake tracking and dynamic
         * calculation.<br/>
         * The amount of tinybar staked to the node.<br/>
         * This value SHOULD NOT be populated, and SHALL be ignored.
         * @member {Long} stake
         * @memberof proto.NodeAddress
         * @instance
         */
        NodeAddress.prototype.stake = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new NodeAddress instance using the specified properties.
         * @function create
         * @memberof proto.NodeAddress
         * @static
         * @param {proto.INodeAddress=} [properties] Properties to set
         * @returns {proto.NodeAddress} NodeAddress instance
         */
        NodeAddress.create = function create(properties) {
            return new NodeAddress(properties);
        };

        /**
         * Encodes the specified NodeAddress message. Does not implicitly {@link proto.NodeAddress.verify|verify} messages.
         * @function encode
         * @memberof proto.NodeAddress
         * @static
         * @param {proto.INodeAddress} m NodeAddress message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NodeAddress.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.ipAddress != null && Object.hasOwnProperty.call(m, "ipAddress"))
                w.uint32(10).bytes(m.ipAddress);
            if (m.portno != null && Object.hasOwnProperty.call(m, "portno"))
                w.uint32(16).int32(m.portno);
            if (m.memo != null && Object.hasOwnProperty.call(m, "memo"))
                w.uint32(26).bytes(m.memo);
            if (m.RSA_PubKey != null && Object.hasOwnProperty.call(m, "RSA_PubKey"))
                w.uint32(34).string(m.RSA_PubKey);
            if (m.nodeId != null && Object.hasOwnProperty.call(m, "nodeId"))
                w.uint32(40).int64(m.nodeId);
            if (m.nodeAccountId != null && Object.hasOwnProperty.call(m, "nodeAccountId"))
                $root.proto.AccountID.encode(m.nodeAccountId, w.uint32(50).fork()).ldelim();
            if (m.nodeCertHash != null && Object.hasOwnProperty.call(m, "nodeCertHash"))
                w.uint32(58).bytes(m.nodeCertHash);
            if (m.serviceEndpoint != null && m.serviceEndpoint.length) {
                for (var i = 0; i < m.serviceEndpoint.length; ++i)
                    $root.proto.ServiceEndpoint.encode(m.serviceEndpoint[i], w.uint32(66).fork()).ldelim();
            }
            if (m.description != null && Object.hasOwnProperty.call(m, "description"))
                w.uint32(74).string(m.description);
            if (m.stake != null && Object.hasOwnProperty.call(m, "stake"))
                w.uint32(80).int64(m.stake);
            return w;
        };

        /**
         * Decodes a NodeAddress message from the specified reader or buffer.
         * @function decode
         * @memberof proto.NodeAddress
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.NodeAddress} NodeAddress
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NodeAddress.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.NodeAddress();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.ipAddress = r.bytes();
                        break;
                    }
                case 2: {
                        m.portno = r.int32();
                        break;
                    }
                case 3: {
                        m.memo = r.bytes();
                        break;
                    }
                case 4: {
                        m.RSA_PubKey = r.string();
                        break;
                    }
                case 5: {
                        m.nodeId = r.int64();
                        break;
                    }
                case 6: {
                        m.nodeAccountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 7: {
                        m.nodeCertHash = r.bytes();
                        break;
                    }
                case 8: {
                        if (!(m.serviceEndpoint && m.serviceEndpoint.length))
                            m.serviceEndpoint = [];
                        m.serviceEndpoint.push($root.proto.ServiceEndpoint.decode(r, r.uint32()));
                        break;
                    }
                case 9: {
                        m.description = r.string();
                        break;
                    }
                case 10: {
                        m.stake = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for NodeAddress
         * @function getTypeUrl
         * @memberof proto.NodeAddress
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        NodeAddress.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NodeAddress";
        };

        return NodeAddress;
    })();

    proto.NodeAddressBook = (function() {

        /**
         * Properties of a NodeAddressBook.
         * @memberof proto
         * @interface INodeAddressBook
         * @property {Array.<proto.INodeAddress>|null} [nodeAddress] Published data for all nodes in the network
         */

        /**
         * Constructs a new NodeAddressBook.
         * @memberof proto
         * @classdesc A list of nodes and their metadata that contains details of the nodes
         * running the network.
         * 
         * Used to parse the contents of system files `0.0.101` and `0.0.102`.
         * @implements INodeAddressBook
         * @constructor
         * @param {proto.INodeAddressBook=} [p] Properties to set
         */
        function NodeAddressBook(p) {
            this.nodeAddress = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * Published data for all nodes in the network
         * @member {Array.<proto.INodeAddress>} nodeAddress
         * @memberof proto.NodeAddressBook
         * @instance
         */
        NodeAddressBook.prototype.nodeAddress = $util.emptyArray;

        /**
         * Creates a new NodeAddressBook instance using the specified properties.
         * @function create
         * @memberof proto.NodeAddressBook
         * @static
         * @param {proto.INodeAddressBook=} [properties] Properties to set
         * @returns {proto.NodeAddressBook} NodeAddressBook instance
         */
        NodeAddressBook.create = function create(properties) {
            return new NodeAddressBook(properties);
        };

        /**
         * Encodes the specified NodeAddressBook message. Does not implicitly {@link proto.NodeAddressBook.verify|verify} messages.
         * @function encode
         * @memberof proto.NodeAddressBook
         * @static
         * @param {proto.INodeAddressBook} m NodeAddressBook message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NodeAddressBook.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.nodeAddress != null && m.nodeAddress.length) {
                for (var i = 0; i < m.nodeAddress.length; ++i)
                    $root.proto.NodeAddress.encode(m.nodeAddress[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a NodeAddressBook message from the specified reader or buffer.
         * @function decode
         * @memberof proto.NodeAddressBook
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.NodeAddressBook} NodeAddressBook
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NodeAddressBook.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.NodeAddressBook();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.nodeAddress && m.nodeAddress.length))
                            m.nodeAddress = [];
                        m.nodeAddress.push($root.proto.NodeAddress.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for NodeAddressBook
         * @function getTypeUrl
         * @memberof proto.NodeAddressBook
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        NodeAddressBook.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NodeAddressBook";
        };

        return NodeAddressBook;
    })();

    proto.SemanticVersion = (function() {

        /**
         * Properties of a SemanticVersion.
         * @memberof proto
         * @interface ISemanticVersion
         * @property {number|null} [major] A major version.<br/>
         * Hedera does not increment this value and retains a `0` value to
         * indicate that API may change for any release.
         * <p>
         * This value SHALL increment for an incompatible API change.<br/>
         * @property {number|null} [minor] A minor version.<br/>
         * Hedera increments this value with each release.<br/>
         * There may be incompatible API changes in any Hedera Services release.
         * <p>
         * This value SHALL increment for backwards-compatible new
         * functionality.
         * @property {number|null} [patch] A patch version.
         * <p>
         * This value SHALL increment for backwards-compatible bug fixes.
         * @property {string|null} [pre] A pre-release version.
         * <p>
         * This MAY be denoted by appending a hyphen and a series of dot separated
         * identifiers per [Semver Specification](https://semver.org/#spec-item-9);
         * given a string `0.14.0-alpha.1+21AF26D3`, this field would contain
         * 'alpha.1'
         * @property {string|null} [build] A build version.
         * <p>
         * Build version MAY be denoted by appending a plus sign and a series of
         * dot separated identifiers immediately following the patch or pre-release
         * version per [Semver Specification](https://semver.org/#spec-item-10); so
         * given a string `0.14.0-alpha.1+21AF26D3`, this field
         * would contain '21AF26D3'
         */

        /**
         * Constructs a new SemanticVersion.
         * @memberof proto
         * @classdesc A software version according to "[semantic versioning](https://semver.org/)"
         * or "date versioning".
         * 
         * Hedera currently modifies the "typical" semantic versioning somewhat, the
         * `major` version is always `0`, and each release increments the `minor`
         * version. The `patch` and `pre` components are used in the typical manner.
         * The `build` component is not generally used.
         * @implements ISemanticVersion
         * @constructor
         * @param {proto.ISemanticVersion=} [p] Properties to set
         */
        function SemanticVersion(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A major version.<br/>
         * Hedera does not increment this value and retains a `0` value to
         * indicate that API may change for any release.
         * <p>
         * This value SHALL increment for an incompatible API change.<br/>
         * @member {number} major
         * @memberof proto.SemanticVersion
         * @instance
         */
        SemanticVersion.prototype.major = 0;

        /**
         * A minor version.<br/>
         * Hedera increments this value with each release.<br/>
         * There may be incompatible API changes in any Hedera Services release.
         * <p>
         * This value SHALL increment for backwards-compatible new
         * functionality.
         * @member {number} minor
         * @memberof proto.SemanticVersion
         * @instance
         */
        SemanticVersion.prototype.minor = 0;

        /**
         * A patch version.
         * <p>
         * This value SHALL increment for backwards-compatible bug fixes.
         * @member {number} patch
         * @memberof proto.SemanticVersion
         * @instance
         */
        SemanticVersion.prototype.patch = 0;

        /**
         * A pre-release version.
         * <p>
         * This MAY be denoted by appending a hyphen and a series of dot separated
         * identifiers per [Semver Specification](https://semver.org/#spec-item-9);
         * given a string `0.14.0-alpha.1+21AF26D3`, this field would contain
         * 'alpha.1'
         * @member {string} pre
         * @memberof proto.SemanticVersion
         * @instance
         */
        SemanticVersion.prototype.pre = "";

        /**
         * A build version.
         * <p>
         * Build version MAY be denoted by appending a plus sign and a series of
         * dot separated identifiers immediately following the patch or pre-release
         * version per [Semver Specification](https://semver.org/#spec-item-10); so
         * given a string `0.14.0-alpha.1+21AF26D3`, this field
         * would contain '21AF26D3'
         * @member {string} build
         * @memberof proto.SemanticVersion
         * @instance
         */
        SemanticVersion.prototype.build = "";

        /**
         * Creates a new SemanticVersion instance using the specified properties.
         * @function create
         * @memberof proto.SemanticVersion
         * @static
         * @param {proto.ISemanticVersion=} [properties] Properties to set
         * @returns {proto.SemanticVersion} SemanticVersion instance
         */
        SemanticVersion.create = function create(properties) {
            return new SemanticVersion(properties);
        };

        /**
         * Encodes the specified SemanticVersion message. Does not implicitly {@link proto.SemanticVersion.verify|verify} messages.
         * @function encode
         * @memberof proto.SemanticVersion
         * @static
         * @param {proto.ISemanticVersion} m SemanticVersion message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SemanticVersion.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.major != null && Object.hasOwnProperty.call(m, "major"))
                w.uint32(8).int32(m.major);
            if (m.minor != null && Object.hasOwnProperty.call(m, "minor"))
                w.uint32(16).int32(m.minor);
            if (m.patch != null && Object.hasOwnProperty.call(m, "patch"))
                w.uint32(24).int32(m.patch);
            if (m.pre != null && Object.hasOwnProperty.call(m, "pre"))
                w.uint32(34).string(m.pre);
            if (m.build != null && Object.hasOwnProperty.call(m, "build"))
                w.uint32(42).string(m.build);
            return w;
        };

        /**
         * Decodes a SemanticVersion message from the specified reader or buffer.
         * @function decode
         * @memberof proto.SemanticVersion
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.SemanticVersion} SemanticVersion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SemanticVersion.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.SemanticVersion();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.major = r.int32();
                        break;
                    }
                case 2: {
                        m.minor = r.int32();
                        break;
                    }
                case 3: {
                        m.patch = r.int32();
                        break;
                    }
                case 4: {
                        m.pre = r.string();
                        break;
                    }
                case 5: {
                        m.build = r.string();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for SemanticVersion
         * @function getTypeUrl
         * @memberof proto.SemanticVersion
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SemanticVersion.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SemanticVersion";
        };

        return SemanticVersion;
    })();

    proto.Setting = (function() {

        /**
         * Properties of a Setting.
         * @memberof proto
         * @interface ISetting
         * @property {string|null} [name] A name for this setting property.
         * @property {string|null} [value] A value for this setting property.
         * @property {Uint8Array|null} [data] A small quantity of data associated with this setting.
         * <p>
         * This SHOULD be less than 100 bytes.<br/>
         * If the value is a string, it MUST be encoded UTF-8.
         */

        /**
         * Constructs a new Setting.
         * @memberof proto
         * @classdesc A single runtime configuration setting.
         * 
         * Typically a name-value pair, this may also contain a small amount of
         * associated data.
         * @implements ISetting
         * @constructor
         * @param {proto.ISetting=} [p] Properties to set
         */
        function Setting(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A name for this setting property.
         * @member {string} name
         * @memberof proto.Setting
         * @instance
         */
        Setting.prototype.name = "";

        /**
         * A value for this setting property.
         * @member {string} value
         * @memberof proto.Setting
         * @instance
         */
        Setting.prototype.value = "";

        /**
         * A small quantity of data associated with this setting.
         * <p>
         * This SHOULD be less than 100 bytes.<br/>
         * If the value is a string, it MUST be encoded UTF-8.
         * @member {Uint8Array} data
         * @memberof proto.Setting
         * @instance
         */
        Setting.prototype.data = $util.newBuffer([]);

        /**
         * Creates a new Setting instance using the specified properties.
         * @function create
         * @memberof proto.Setting
         * @static
         * @param {proto.ISetting=} [properties] Properties to set
         * @returns {proto.Setting} Setting instance
         */
        Setting.create = function create(properties) {
            return new Setting(properties);
        };

        /**
         * Encodes the specified Setting message. Does not implicitly {@link proto.Setting.verify|verify} messages.
         * @function encode
         * @memberof proto.Setting
         * @static
         * @param {proto.ISetting} m Setting message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Setting.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                w.uint32(10).string(m.name);
            if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                w.uint32(18).string(m.value);
            if (m.data != null && Object.hasOwnProperty.call(m, "data"))
                w.uint32(26).bytes(m.data);
            return w;
        };

        /**
         * Decodes a Setting message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Setting
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Setting} Setting
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Setting.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Setting();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.name = r.string();
                        break;
                    }
                case 2: {
                        m.value = r.string();
                        break;
                    }
                case 3: {
                        m.data = r.bytes();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Setting
         * @function getTypeUrl
         * @memberof proto.Setting
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Setting.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Setting";
        };

        return Setting;
    })();

    proto.ServicesConfigurationList = (function() {

        /**
         * Properties of a ServicesConfigurationList.
         * @memberof proto
         * @interface IServicesConfigurationList
         * @property {Array.<proto.ISetting>|null} [nameValue] A List of `Setting` values, typically read from application properties.
         */

        /**
         * Constructs a new ServicesConfigurationList.
         * @memberof proto
         * @classdesc Setting values representing a source of runtime configuration information.
         * @implements IServicesConfigurationList
         * @constructor
         * @param {proto.IServicesConfigurationList=} [p] Properties to set
         */
        function ServicesConfigurationList(p) {
            this.nameValue = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A List of `Setting` values, typically read from application properties.
         * @member {Array.<proto.ISetting>} nameValue
         * @memberof proto.ServicesConfigurationList
         * @instance
         */
        ServicesConfigurationList.prototype.nameValue = $util.emptyArray;

        /**
         * Creates a new ServicesConfigurationList instance using the specified properties.
         * @function create
         * @memberof proto.ServicesConfigurationList
         * @static
         * @param {proto.IServicesConfigurationList=} [properties] Properties to set
         * @returns {proto.ServicesConfigurationList} ServicesConfigurationList instance
         */
        ServicesConfigurationList.create = function create(properties) {
            return new ServicesConfigurationList(properties);
        };

        /**
         * Encodes the specified ServicesConfigurationList message. Does not implicitly {@link proto.ServicesConfigurationList.verify|verify} messages.
         * @function encode
         * @memberof proto.ServicesConfigurationList
         * @static
         * @param {proto.IServicesConfigurationList} m ServicesConfigurationList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ServicesConfigurationList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.nameValue != null && m.nameValue.length) {
                for (var i = 0; i < m.nameValue.length; ++i)
                    $root.proto.Setting.encode(m.nameValue[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a ServicesConfigurationList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ServicesConfigurationList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.ServicesConfigurationList} ServicesConfigurationList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ServicesConfigurationList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ServicesConfigurationList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.nameValue && m.nameValue.length))
                            m.nameValue = [];
                        m.nameValue.push($root.proto.Setting.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for ServicesConfigurationList
         * @function getTypeUrl
         * @memberof proto.ServicesConfigurationList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ServicesConfigurationList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ServicesConfigurationList";
        };

        return ServicesConfigurationList;
    })();

    proto.TokenRelationship = (function() {

        /**
         * Properties of a TokenRelationship.
         * @memberof proto
         * @interface ITokenRelationship
         * @property {proto.ITokenID|null} [tokenId] A token identifier.
         * <p>
         * This MUST match an existing token that is not deleted.
         * @property {string|null} [symbol] A token symbol.
         * <p>
         * This MUST match an existing token that is not deleted.<br/>
         * This MUST match the value for the token identified in `tokenId`.
         * @property {Long|null} [balance] An account balance for this token.
         * <p>
         * For fungible/common tokens this SHALL be the balance that the
         * account holds of that token. The value is provided as an integer amount
         * of the smallest unit of the token (i.e. 10<sup>`-decimals`</sup> whole
         * tokens).<br/>
         * For non-fungible/unique tokens this SHALL be the whole number of
         * unique tokens held by the account for this token type.
         * @property {proto.TokenKycStatus|null} [kycStatus] A KYC status for the account with respect to this token.
         * <p>
         * This may be `KycNotApplicable`, `Granted` or `Revoked` and, if KYC is
         * not supported for this token (e.g. the `kyc_key` of the token is not
         * set), this SHALL be `KycNotApplicable`.
         * @property {proto.TokenFreezeStatus|null} [freezeStatus] A Freeze status for the account with respect to this token.
         * <p>
         * This value SHALL be one of `FreezeNotApplicable`, `Frozen`
         * or `Unfrozen`.<br/>
         * If the token cannot freeze account assets (e.g. the `freeze_key` of the
         * token is not set), this SHALL be `FreezeNotApplicable`.
         * @property {number|null} [decimals] A maximum "precision" for this token.
         * <p>
         * This value MUST match the `decimals` field of the token identified in
         * the `tokenId` field.<br/>
         * A single whole token SHALL be divided into at most
         * 10<sup>`decimals`</sup> sub-units.
         * @property {boolean|null} [automaticAssociation] An automatic association flag.
         * <p>
         * This SHALL be set if the relationship was created implicitly
         * (automatically).<br/>
         * This SHALL be unset if the relationship was created explicitly
         * (manually) via a `TokenAssociate` transaction.
         */

        /**
         * Constructs a new TokenRelationship.
         * @memberof proto
         * @classdesc An Hedera Token Service token relationship. A token relationship describes
         * the connection between an Account and a Token type, including the current
         * account balance in that token.
         * 
         * A `TokenRelationship` SHALL contain, for the designated token and enclosing
         * account, The account's current balance, whether the account has KYC granted,
         * whether the assets are frozen and whether the association was automatic.<br/>
         * A `TokenRelationship` MAY also contain the `symbol` and `decimals` values
         * copied from the token.<br/>
         * `TokenRelationship` entries SHALL be valid only within the context of a
         * `GetAccountDetails` query response, or other enclosing message, which
         * specifies the account side of the relationship.
         * @implements ITokenRelationship
         * @constructor
         * @param {proto.ITokenRelationship=} [p] Properties to set
         */
        function TokenRelationship(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A token identifier.
         * <p>
         * This MUST match an existing token that is not deleted.
         * @member {proto.ITokenID|null|undefined} tokenId
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.tokenId = null;

        /**
         * A token symbol.
         * <p>
         * This MUST match an existing token that is not deleted.<br/>
         * This MUST match the value for the token identified in `tokenId`.
         * @member {string} symbol
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.symbol = "";

        /**
         * An account balance for this token.
         * <p>
         * For fungible/common tokens this SHALL be the balance that the
         * account holds of that token. The value is provided as an integer amount
         * of the smallest unit of the token (i.e. 10<sup>`-decimals`</sup> whole
         * tokens).<br/>
         * For non-fungible/unique tokens this SHALL be the whole number of
         * unique tokens held by the account for this token type.
         * @member {Long} balance
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.balance = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * A KYC status for the account with respect to this token.
         * <p>
         * This may be `KycNotApplicable`, `Granted` or `Revoked` and, if KYC is
         * not supported for this token (e.g. the `kyc_key` of the token is not
         * set), this SHALL be `KycNotApplicable`.
         * @member {proto.TokenKycStatus} kycStatus
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.kycStatus = 0;

        /**
         * A Freeze status for the account with respect to this token.
         * <p>
         * This value SHALL be one of `FreezeNotApplicable`, `Frozen`
         * or `Unfrozen`.<br/>
         * If the token cannot freeze account assets (e.g. the `freeze_key` of the
         * token is not set), this SHALL be `FreezeNotApplicable`.
         * @member {proto.TokenFreezeStatus} freezeStatus
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.freezeStatus = 0;

        /**
         * A maximum "precision" for this token.
         * <p>
         * This value MUST match the `decimals` field of the token identified in
         * the `tokenId` field.<br/>
         * A single whole token SHALL be divided into at most
         * 10<sup>`decimals`</sup> sub-units.
         * @member {number} decimals
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.decimals = 0;

        /**
         * An automatic association flag.
         * <p>
         * This SHALL be set if the relationship was created implicitly
         * (automatically).<br/>
         * This SHALL be unset if the relationship was created explicitly
         * (manually) via a `TokenAssociate` transaction.
         * @member {boolean} automaticAssociation
         * @memberof proto.TokenRelationship
         * @instance
         */
        TokenRelationship.prototype.automaticAssociation = false;

        /**
         * Creates a new TokenRelationship instance using the specified properties.
         * @function create
         * @memberof proto.TokenRelationship
         * @static
         * @param {proto.ITokenRelationship=} [properties] Properties to set
         * @returns {proto.TokenRelationship} TokenRelationship instance
         */
        TokenRelationship.create = function create(properties) {
            return new TokenRelationship(properties);
        };

        /**
         * Encodes the specified TokenRelationship message. Does not implicitly {@link proto.TokenRelationship.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenRelationship
         * @static
         * @param {proto.ITokenRelationship} m TokenRelationship message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenRelationship.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.tokenId != null && Object.hasOwnProperty.call(m, "tokenId"))
                $root.proto.TokenID.encode(m.tokenId, w.uint32(10).fork()).ldelim();
            if (m.symbol != null && Object.hasOwnProperty.call(m, "symbol"))
                w.uint32(18).string(m.symbol);
            if (m.balance != null && Object.hasOwnProperty.call(m, "balance"))
                w.uint32(24).uint64(m.balance);
            if (m.kycStatus != null && Object.hasOwnProperty.call(m, "kycStatus"))
                w.uint32(32).int32(m.kycStatus);
            if (m.freezeStatus != null && Object.hasOwnProperty.call(m, "freezeStatus"))
                w.uint32(40).int32(m.freezeStatus);
            if (m.decimals != null && Object.hasOwnProperty.call(m, "decimals"))
                w.uint32(48).uint32(m.decimals);
            if (m.automaticAssociation != null && Object.hasOwnProperty.call(m, "automaticAssociation"))
                w.uint32(56).bool(m.automaticAssociation);
            return w;
        };

        /**
         * Decodes a TokenRelationship message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenRelationship
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenRelationship} TokenRelationship
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenRelationship.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenRelationship();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.tokenId = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.symbol = r.string();
                        break;
                    }
                case 3: {
                        m.balance = r.uint64();
                        break;
                    }
                case 4: {
                        m.kycStatus = r.int32();
                        break;
                    }
                case 5: {
                        m.freezeStatus = r.int32();
                        break;
                    }
                case 6: {
                        m.decimals = r.uint32();
                        break;
                    }
                case 7: {
                        m.automaticAssociation = r.bool();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenRelationship
         * @function getTypeUrl
         * @memberof proto.TokenRelationship
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenRelationship.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenRelationship";
        };

        return TokenRelationship;
    })();

    proto.TokenBalance = (function() {

        /**
         * Properties of a TokenBalance.
         * @memberof proto
         * @interface ITokenBalance
         * @property {proto.ITokenID|null} [tokenId] A token identifier.
         * @property {Long|null} [balance] A number of transferable units of the identified token.
         * <p>
         * For fungible/common tokens this SHALL be the balance, in units of
         * 10<sup>`-decimals`</sup> whole tokens.<br/>
         * For non-fungible/unique tokens, this SHALL be the number of
         * individual unique tokens in this balance.
         * @property {number|null} [decimals] A number of "decimals" precision.
         * <p>
         * This MUST match the `decimals` value for the token identified by the
         * `tokenId` field.
         */

        /**
         * Constructs a new TokenBalance.
         * @memberof proto
         * @classdesc A number of _transferable units_ of a specified token.
         * 
         * The transferable unit of a token is its smallest denomination, as given by
         * the token's `decimals` property. Each minted token contains
         * 10<sup>`decimals`</sup> transferable units. For example, we could think of
         * the cent as the transferable unit of the US dollar (`decimals=2`); and the
         * tinybar as the transferable unit of HBAR (`decimals=8`).
         * 
         * Transferable units are not directly comparable across different tokens.
         * @implements ITokenBalance
         * @constructor
         * @param {proto.ITokenBalance=} [p] Properties to set
         */
        function TokenBalance(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A token identifier.
         * @member {proto.ITokenID|null|undefined} tokenId
         * @memberof proto.TokenBalance
         * @instance
         */
        TokenBalance.prototype.tokenId = null;

        /**
         * A number of transferable units of the identified token.
         * <p>
         * For fungible/common tokens this SHALL be the balance, in units of
         * 10<sup>`-decimals`</sup> whole tokens.<br/>
         * For non-fungible/unique tokens, this SHALL be the number of
         * individual unique tokens in this balance.
         * @member {Long} balance
         * @memberof proto.TokenBalance
         * @instance
         */
        TokenBalance.prototype.balance = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * A number of "decimals" precision.
         * <p>
         * This MUST match the `decimals` value for the token identified by the
         * `tokenId` field.
         * @member {number} decimals
         * @memberof proto.TokenBalance
         * @instance
         */
        TokenBalance.prototype.decimals = 0;

        /**
         * Creates a new TokenBalance instance using the specified properties.
         * @function create
         * @memberof proto.TokenBalance
         * @static
         * @param {proto.ITokenBalance=} [properties] Properties to set
         * @returns {proto.TokenBalance} TokenBalance instance
         */
        TokenBalance.create = function create(properties) {
            return new TokenBalance(properties);
        };

        /**
         * Encodes the specified TokenBalance message. Does not implicitly {@link proto.TokenBalance.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenBalance
         * @static
         * @param {proto.ITokenBalance} m TokenBalance message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenBalance.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.tokenId != null && Object.hasOwnProperty.call(m, "tokenId"))
                $root.proto.TokenID.encode(m.tokenId, w.uint32(10).fork()).ldelim();
            if (m.balance != null && Object.hasOwnProperty.call(m, "balance"))
                w.uint32(16).uint64(m.balance);
            if (m.decimals != null && Object.hasOwnProperty.call(m, "decimals"))
                w.uint32(24).uint32(m.decimals);
            return w;
        };

        /**
         * Decodes a TokenBalance message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenBalance
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenBalance} TokenBalance
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenBalance.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenBalance();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.tokenId = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.balance = r.uint64();
                        break;
                    }
                case 3: {
                        m.decimals = r.uint32();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenBalance
         * @function getTypeUrl
         * @memberof proto.TokenBalance
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenBalance.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenBalance";
        };

        return TokenBalance;
    })();

    proto.TokenBalances = (function() {

        /**
         * Properties of a TokenBalances.
         * @memberof proto
         * @interface ITokenBalances
         * @property {Array.<proto.ITokenBalance>|null} [tokenBalances] A list of token balance values.<br/>
         * Each entry represents a single account balance for a single token.
         */

        /**
         * Constructs a new TokenBalances.
         * @memberof proto
         * @classdesc A set of token balance values.
         * 
         * Each entry describes the balance the enclosing account holds for a specific
         * token. The balance is an amount for a fungible/common token or a count for
         * a non-fungible/unique token.
         * @implements ITokenBalances
         * @constructor
         * @param {proto.ITokenBalances=} [p] Properties to set
         */
        function TokenBalances(p) {
            this.tokenBalances = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A list of token balance values.<br/>
         * Each entry represents a single account balance for a single token.
         * @member {Array.<proto.ITokenBalance>} tokenBalances
         * @memberof proto.TokenBalances
         * @instance
         */
        TokenBalances.prototype.tokenBalances = $util.emptyArray;

        /**
         * Creates a new TokenBalances instance using the specified properties.
         * @function create
         * @memberof proto.TokenBalances
         * @static
         * @param {proto.ITokenBalances=} [properties] Properties to set
         * @returns {proto.TokenBalances} TokenBalances instance
         */
        TokenBalances.create = function create(properties) {
            return new TokenBalances(properties);
        };

        /**
         * Encodes the specified TokenBalances message. Does not implicitly {@link proto.TokenBalances.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenBalances
         * @static
         * @param {proto.ITokenBalances} m TokenBalances message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenBalances.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.tokenBalances != null && m.tokenBalances.length) {
                for (var i = 0; i < m.tokenBalances.length; ++i)
                    $root.proto.TokenBalance.encode(m.tokenBalances[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a TokenBalances message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenBalances
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenBalances} TokenBalances
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenBalances.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenBalances();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.tokenBalances && m.tokenBalances.length))
                            m.tokenBalances = [];
                        m.tokenBalances.push($root.proto.TokenBalance.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenBalances
         * @function getTypeUrl
         * @memberof proto.TokenBalances
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenBalances.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenBalances";
        };

        return TokenBalances;
    })();

    proto.TokenAssociation = (function() {

        /**
         * Properties of a TokenAssociation.
         * @memberof proto
         * @interface ITokenAssociation
         * @property {proto.ITokenID|null} [tokenId] A token identifier for the associated token.
         * @property {proto.IAccountID|null} [accountId] An account identifier for the associated account.
         */

        /**
         * Constructs a new TokenAssociation.
         * @memberof proto
         * @classdesc An association between a token and an account.
         * 
         * An account must be associated with a token before that account can transact
         * in (send or receive) that token.
         * @implements ITokenAssociation
         * @constructor
         * @param {proto.ITokenAssociation=} [p] Properties to set
         */
        function TokenAssociation(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A token identifier for the associated token.
         * @member {proto.ITokenID|null|undefined} tokenId
         * @memberof proto.TokenAssociation
         * @instance
         */
        TokenAssociation.prototype.tokenId = null;

        /**
         * An account identifier for the associated account.
         * @member {proto.IAccountID|null|undefined} accountId
         * @memberof proto.TokenAssociation
         * @instance
         */
        TokenAssociation.prototype.accountId = null;

        /**
         * Creates a new TokenAssociation instance using the specified properties.
         * @function create
         * @memberof proto.TokenAssociation
         * @static
         * @param {proto.ITokenAssociation=} [properties] Properties to set
         * @returns {proto.TokenAssociation} TokenAssociation instance
         */
        TokenAssociation.create = function create(properties) {
            return new TokenAssociation(properties);
        };

        /**
         * Encodes the specified TokenAssociation message. Does not implicitly {@link proto.TokenAssociation.verify|verify} messages.
         * @function encode
         * @memberof proto.TokenAssociation
         * @static
         * @param {proto.ITokenAssociation} m TokenAssociation message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TokenAssociation.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.tokenId != null && Object.hasOwnProperty.call(m, "tokenId"))
                $root.proto.TokenID.encode(m.tokenId, w.uint32(10).fork()).ldelim();
            if (m.accountId != null && Object.hasOwnProperty.call(m, "accountId"))
                $root.proto.AccountID.encode(m.accountId, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a TokenAssociation message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TokenAssociation
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TokenAssociation} TokenAssociation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TokenAssociation.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TokenAssociation();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.tokenId = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.accountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TokenAssociation
         * @function getTypeUrl
         * @memberof proto.TokenAssociation
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TokenAssociation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenAssociation";
        };

        return TokenAssociation;
    })();

    proto.StakingInfo = (function() {

        /**
         * Properties of a StakingInfo.
         * @memberof proto
         * @interface IStakingInfo
         * @property {boolean|null} [declineReward] A flag indicating that the holder of this account has chosen to decline
         * staking rewards.
         * @property {proto.ITimestamp|null} [stakePeriodStart] A `Timestamp` of the start time for the latest active staking period.
         * <p>
         * This MUST be a period during which either the staking settings for this
         * account or contract changed or the account or contract received staking
         * rewards, whichever is later. Examples of a change in staking settings
         * include starting staking or changing the staked_node_id.<br/>
         * If this account or contract is not currently staked to a node, then this
         * field SHALL NOT be set.
         * @property {Long|null} [pendingReward] An amount, in tinybar, to be received in the next reward payout.<br/>
         * Rewards are not paid out immediately; for efficiency reasons rewards are
         * only paid out as part of another transaction involving that account.
         * @property {Long|null} [stakedToMe] A proxy-staked balance.<br/>
         * The total HBAR balance of all accounts that delegate staking to this
         * account or contract.
         * @property {proto.IAccountID|null} [stakedAccountId] A delegated stake.
         * <p>
         * This account delegates to the indicated account for staking purposes.
         * @property {Long|null} [stakedNodeId] A direct stake.
         * <p>
         * This accounts stakes its balance to the designated node.
         */

        /**
         * Constructs a new StakingInfo.
         * @memberof proto
         * @classdesc Staking information for an account or a contract.
         * 
         * This is used for responses returned from `CryptoGetInfo` or
         * `ContractGetInfo` queries.
         * @implements IStakingInfo
         * @constructor
         * @param {proto.IStakingInfo=} [p] Properties to set
         */
        function StakingInfo(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A flag indicating that the holder of this account has chosen to decline
         * staking rewards.
         * @member {boolean} declineReward
         * @memberof proto.StakingInfo
         * @instance
         */
        StakingInfo.prototype.declineReward = false;

        /**
         * A `Timestamp` of the start time for the latest active staking period.
         * <p>
         * This MUST be a period during which either the staking settings for this
         * account or contract changed or the account or contract received staking
         * rewards, whichever is later. Examples of a change in staking settings
         * include starting staking or changing the staked_node_id.<br/>
         * If this account or contract is not currently staked to a node, then this
         * field SHALL NOT be set.
         * @member {proto.ITimestamp|null|undefined} stakePeriodStart
         * @memberof proto.StakingInfo
         * @instance
         */
        StakingInfo.prototype.stakePeriodStart = null;

        /**
         * An amount, in tinybar, to be received in the next reward payout.<br/>
         * Rewards are not paid out immediately; for efficiency reasons rewards are
         * only paid out as part of another transaction involving that account.
         * @member {Long} pendingReward
         * @memberof proto.StakingInfo
         * @instance
         */
        StakingInfo.prototype.pendingReward = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A proxy-staked balance.<br/>
         * The total HBAR balance of all accounts that delegate staking to this
         * account or contract.
         * @member {Long} stakedToMe
         * @memberof proto.StakingInfo
         * @instance
         */
        StakingInfo.prototype.stakedToMe = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A delegated stake.
         * <p>
         * This account delegates to the indicated account for staking purposes.
         * @member {proto.IAccountID|null|undefined} stakedAccountId
         * @memberof proto.StakingInfo
         * @instance
         */
        StakingInfo.prototype.stakedAccountId = null;

        /**
         * A direct stake.
         * <p>
         * This accounts stakes its balance to the designated node.
         * @member {Long|null|undefined} stakedNodeId
         * @memberof proto.StakingInfo
         * @instance
         */
        StakingInfo.prototype.stakedNodeId = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * StakingInfo stakedId.
         * @member {"stakedAccountId"|"stakedNodeId"|undefined} stakedId
         * @memberof proto.StakingInfo
         * @instance
         */
        Object.defineProperty(StakingInfo.prototype, "stakedId", {
            get: $util.oneOfGetter($oneOfFields = ["stakedAccountId", "stakedNodeId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new StakingInfo instance using the specified properties.
         * @function create
         * @memberof proto.StakingInfo
         * @static
         * @param {proto.IStakingInfo=} [properties] Properties to set
         * @returns {proto.StakingInfo} StakingInfo instance
         */
        StakingInfo.create = function create(properties) {
            return new StakingInfo(properties);
        };

        /**
         * Encodes the specified StakingInfo message. Does not implicitly {@link proto.StakingInfo.verify|verify} messages.
         * @function encode
         * @memberof proto.StakingInfo
         * @static
         * @param {proto.IStakingInfo} m StakingInfo message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StakingInfo.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.declineReward != null && Object.hasOwnProperty.call(m, "declineReward"))
                w.uint32(8).bool(m.declineReward);
            if (m.stakePeriodStart != null && Object.hasOwnProperty.call(m, "stakePeriodStart"))
                $root.proto.Timestamp.encode(m.stakePeriodStart, w.uint32(18).fork()).ldelim();
            if (m.pendingReward != null && Object.hasOwnProperty.call(m, "pendingReward"))
                w.uint32(24).int64(m.pendingReward);
            if (m.stakedToMe != null && Object.hasOwnProperty.call(m, "stakedToMe"))
                w.uint32(32).int64(m.stakedToMe);
            if (m.stakedAccountId != null && Object.hasOwnProperty.call(m, "stakedAccountId"))
                $root.proto.AccountID.encode(m.stakedAccountId, w.uint32(42).fork()).ldelim();
            if (m.stakedNodeId != null && Object.hasOwnProperty.call(m, "stakedNodeId"))
                w.uint32(48).int64(m.stakedNodeId);
            return w;
        };

        /**
         * Decodes a StakingInfo message from the specified reader or buffer.
         * @function decode
         * @memberof proto.StakingInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.StakingInfo} StakingInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StakingInfo.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.StakingInfo();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.declineReward = r.bool();
                        break;
                    }
                case 2: {
                        m.stakePeriodStart = $root.proto.Timestamp.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.pendingReward = r.int64();
                        break;
                    }
                case 4: {
                        m.stakedToMe = r.int64();
                        break;
                    }
                case 5: {
                        m.stakedAccountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 6: {
                        m.stakedNodeId = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for StakingInfo
         * @function getTypeUrl
         * @memberof proto.StakingInfo
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        StakingInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.StakingInfo";
        };

        return StakingInfo;
    })();

    proto.PendingAirdropId = (function() {

        /**
         * Properties of a PendingAirdropId.
         * @memberof proto
         * @interface IPendingAirdropId
         * @property {proto.IAccountID|null} [senderId] A sending account.
         * <p>
         * This is the account that initiated, and SHALL fund,
         * this pending airdrop.<br/>
         * This field is REQUIRED.
         * @property {proto.IAccountID|null} [receiverId] A receiving account.
         * <p>
         * This is the ID of the account that SHALL receive the airdrop.<br/>
         * This field is REQUIRED.
         * @property {proto.ITokenID|null} [fungibleTokenType] A token identifier.<br/>
         * This is the type of token for a fungible/common token airdrop.
         * <p>
         * This field is REQUIRED for a fungible/common token and MUST NOT
         * be used for a non-fungible/unique token.
         * @property {proto.INftID|null} [nonFungibleToken] The id of a single NFT<br/>
         * This is the type of token for a non-fungible/unique token airdrop
         * and consists of a Token ID and serial number.
         * <p>
         * This field is REQUIRED for a non-fungible/unique token and
         * MUST NOT be used for a fungible/common token.
         */

        /**
         * Constructs a new PendingAirdropId.
         * @memberof proto
         * @classdesc A unique, composite, identifier for a pending airdrop.
         * 
         * Each pending airdrop SHALL be uniquely identified by
         * a `PendingAirdropId`.<br/>
         * A `PendingAirdropId` SHALL be recorded when created and MUST be provided in
         * any transaction that would modify that pending airdrop
         * (such as a `claimAirdrop` or `cancelAirdrop`).
         * @implements IPendingAirdropId
         * @constructor
         * @param {proto.IPendingAirdropId=} [p] Properties to set
         */
        function PendingAirdropId(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A sending account.
         * <p>
         * This is the account that initiated, and SHALL fund,
         * this pending airdrop.<br/>
         * This field is REQUIRED.
         * @member {proto.IAccountID|null|undefined} senderId
         * @memberof proto.PendingAirdropId
         * @instance
         */
        PendingAirdropId.prototype.senderId = null;

        /**
         * A receiving account.
         * <p>
         * This is the ID of the account that SHALL receive the airdrop.<br/>
         * This field is REQUIRED.
         * @member {proto.IAccountID|null|undefined} receiverId
         * @memberof proto.PendingAirdropId
         * @instance
         */
        PendingAirdropId.prototype.receiverId = null;

        /**
         * A token identifier.<br/>
         * This is the type of token for a fungible/common token airdrop.
         * <p>
         * This field is REQUIRED for a fungible/common token and MUST NOT
         * be used for a non-fungible/unique token.
         * @member {proto.ITokenID|null|undefined} fungibleTokenType
         * @memberof proto.PendingAirdropId
         * @instance
         */
        PendingAirdropId.prototype.fungibleTokenType = null;

        /**
         * The id of a single NFT<br/>
         * This is the type of token for a non-fungible/unique token airdrop
         * and consists of a Token ID and serial number.
         * <p>
         * This field is REQUIRED for a non-fungible/unique token and
         * MUST NOT be used for a fungible/common token.
         * @member {proto.INftID|null|undefined} nonFungibleToken
         * @memberof proto.PendingAirdropId
         * @instance
         */
        PendingAirdropId.prototype.nonFungibleToken = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * PendingAirdropId tokenReference.
         * @member {"fungibleTokenType"|"nonFungibleToken"|undefined} tokenReference
         * @memberof proto.PendingAirdropId
         * @instance
         */
        Object.defineProperty(PendingAirdropId.prototype, "tokenReference", {
            get: $util.oneOfGetter($oneOfFields = ["fungibleTokenType", "nonFungibleToken"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new PendingAirdropId instance using the specified properties.
         * @function create
         * @memberof proto.PendingAirdropId
         * @static
         * @param {proto.IPendingAirdropId=} [properties] Properties to set
         * @returns {proto.PendingAirdropId} PendingAirdropId instance
         */
        PendingAirdropId.create = function create(properties) {
            return new PendingAirdropId(properties);
        };

        /**
         * Encodes the specified PendingAirdropId message. Does not implicitly {@link proto.PendingAirdropId.verify|verify} messages.
         * @function encode
         * @memberof proto.PendingAirdropId
         * @static
         * @param {proto.IPendingAirdropId} m PendingAirdropId message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PendingAirdropId.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.senderId != null && Object.hasOwnProperty.call(m, "senderId"))
                $root.proto.AccountID.encode(m.senderId, w.uint32(10).fork()).ldelim();
            if (m.receiverId != null && Object.hasOwnProperty.call(m, "receiverId"))
                $root.proto.AccountID.encode(m.receiverId, w.uint32(18).fork()).ldelim();
            if (m.fungibleTokenType != null && Object.hasOwnProperty.call(m, "fungibleTokenType"))
                $root.proto.TokenID.encode(m.fungibleTokenType, w.uint32(26).fork()).ldelim();
            if (m.nonFungibleToken != null && Object.hasOwnProperty.call(m, "nonFungibleToken"))
                $root.proto.NftID.encode(m.nonFungibleToken, w.uint32(34).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a PendingAirdropId message from the specified reader or buffer.
         * @function decode
         * @memberof proto.PendingAirdropId
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.PendingAirdropId} PendingAirdropId
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PendingAirdropId.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.PendingAirdropId();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.senderId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.receiverId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.fungibleTokenType = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 4: {
                        m.nonFungibleToken = $root.proto.NftID.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for PendingAirdropId
         * @function getTypeUrl
         * @memberof proto.PendingAirdropId
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PendingAirdropId.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.PendingAirdropId";
        };

        return PendingAirdropId;
    })();

    proto.PendingAirdropValue = (function() {

        /**
         * Properties of a PendingAirdropValue.
         * @memberof proto
         * @interface IPendingAirdropValue
         * @property {Long|null} [amount] An amount to transfer for fungible/common tokens.<br/>
         * This is expressed in the smallest available units for that token
         * (i.e. 10<sup>-`decimals`</sup> whole tokens).
         * <p>
         * This amount SHALL be transferred from the sender to the receiver,
         * if claimed.<br/>
         * If the token is a fungible/common token, this value MUST be strictly
         * greater than `0`.<br/>
         * If the token is a non-fungible/unique token, this message SHOULD NOT
         * be set, and if set, this field MUST be `0`.
         */

        /**
         * Constructs a new PendingAirdropValue.
         * @memberof proto
         * @classdesc A single pending airdrop value.
         * 
         * This message SHALL record the airdrop amount for a
         * fungible/common token.<br/>
         * This message SHOULD be null for a non-fungible/unique token.<br/>
         * If a non-null `PendingAirdropValue` is set for a non-fungible/unique
         * token, the amount field MUST be `0`.
         * 
         * It is RECOMMENDED that implementations store pending airdrop information
         * as a key-value map from `PendingAirdropId` to `PendingAirdropValue`, with
         * a `null` value used for non-fungible pending airdrops.
         * @implements IPendingAirdropValue
         * @constructor
         * @param {proto.IPendingAirdropValue=} [p] Properties to set
         */
        function PendingAirdropValue(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * An amount to transfer for fungible/common tokens.<br/>
         * This is expressed in the smallest available units for that token
         * (i.e. 10<sup>-`decimals`</sup> whole tokens).
         * <p>
         * This amount SHALL be transferred from the sender to the receiver,
         * if claimed.<br/>
         * If the token is a fungible/common token, this value MUST be strictly
         * greater than `0`.<br/>
         * If the token is a non-fungible/unique token, this message SHOULD NOT
         * be set, and if set, this field MUST be `0`.
         * @member {Long} amount
         * @memberof proto.PendingAirdropValue
         * @instance
         */
        PendingAirdropValue.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new PendingAirdropValue instance using the specified properties.
         * @function create
         * @memberof proto.PendingAirdropValue
         * @static
         * @param {proto.IPendingAirdropValue=} [properties] Properties to set
         * @returns {proto.PendingAirdropValue} PendingAirdropValue instance
         */
        PendingAirdropValue.create = function create(properties) {
            return new PendingAirdropValue(properties);
        };

        /**
         * Encodes the specified PendingAirdropValue message. Does not implicitly {@link proto.PendingAirdropValue.verify|verify} messages.
         * @function encode
         * @memberof proto.PendingAirdropValue
         * @static
         * @param {proto.IPendingAirdropValue} m PendingAirdropValue message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PendingAirdropValue.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(8).uint64(m.amount);
            return w;
        };

        /**
         * Decodes a PendingAirdropValue message from the specified reader or buffer.
         * @function decode
         * @memberof proto.PendingAirdropValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.PendingAirdropValue} PendingAirdropValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PendingAirdropValue.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.PendingAirdropValue();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.amount = r.uint64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for PendingAirdropValue
         * @function getTypeUrl
         * @memberof proto.PendingAirdropValue
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PendingAirdropValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.PendingAirdropValue";
        };

        return PendingAirdropValue;
    })();

    proto.Duration = (function() {

        /**
         * Properties of a Duration.
         * @memberof proto
         * @interface IDuration
         * @property {Long|null} [seconds] The number of seconds for this duration.
         */

        /**
         * Constructs a new Duration.
         * @memberof proto
         * @classdesc A length of time in seconds.
         * 
         * It is RECOMMENDED that this message be used whenever an amount of time,
         * rather than a specific point in time, is needed.
         * @implements IDuration
         * @constructor
         * @param {proto.IDuration=} [p] Properties to set
         */
        function Duration(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * The number of seconds for this duration.
         * @member {Long} seconds
         * @memberof proto.Duration
         * @instance
         */
        Duration.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new Duration instance using the specified properties.
         * @function create
         * @memberof proto.Duration
         * @static
         * @param {proto.IDuration=} [properties] Properties to set
         * @returns {proto.Duration} Duration instance
         */
        Duration.create = function create(properties) {
            return new Duration(properties);
        };

        /**
         * Encodes the specified Duration message. Does not implicitly {@link proto.Duration.verify|verify} messages.
         * @function encode
         * @memberof proto.Duration
         * @static
         * @param {proto.IDuration} m Duration message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Duration.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.seconds != null && Object.hasOwnProperty.call(m, "seconds"))
                w.uint32(8).int64(m.seconds);
            return w;
        };

        /**
         * Decodes a Duration message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Duration
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Duration} Duration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Duration.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Duration();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.seconds = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Duration
         * @function getTypeUrl
         * @memberof proto.Duration
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Duration.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Duration";
        };

        return Duration;
    })();

    proto.FractionalFee = (function() {

        /**
         * Properties of a FractionalFee.
         * @memberof proto
         * @interface IFractionalFee
         * @property {proto.IFraction|null} [fractionalAmount] A Fraction of the transferred tokens to assess as a fee.<br/>
         * This value MUST be less than or equal to one.<br/>
         * This value MUST be greater than zero.
         * @property {Long|null} [minimumAmount] A minimum fee to charge, in units of 10<sup>-decimals</sup> tokens.
         * <p>
         * This value is OPTIONAL, with a default of `0` indicating no minimum.<br/>
         * If set, this value MUST be greater than zero.<br/>
         * If set, all transfers SHALL pay at least this amount.
         * @property {Long|null} [maximumAmount] A maximum fee to charge, in units of 10<sup>-decimals</sup> tokens.
         * <p>
         * This value is OPTIONAL, with a default of `0` indicating no maximum.<br/>
         * If set, this value MUST be greater than zero.<br/>
         * If set, any fee charged SHALL NOT exceed this value.<br/>
         * This value SHOULD be strictly greater than `minimum_amount`.
         * If this amount is less than or equal to `minimum_amount`, then
         * the fee charged SHALL always be equal to this value and
         * `fractional_amount` SHALL NOT have any effect.
         * @property {boolean|null} [netOfTransfers] Flag requesting to assess the calculated fee against the sender,
         * without reducing the amount transferred.<br/>
         * #### Effects of this flag
         * <ol>
         * <li>If this value is true
         * <ul>
         * <li>The receiver of a transfer SHALL receive the entire
         * amount sent.</li>
         * <li>The fee SHALL be charged to the sender as an additional
         * amount, increasing the token transfer debit.</li>
         * </ul>
         * </li>
         * <li>If this value is false
         * <ul>
         * <li>The receiver of a transfer SHALL receive the amount sent
         * _after_ deduction of the calculated fee.</li>
         * </ul>
         * </li>
         * </ol>
         */

        /**
         * Constructs a new FractionalFee.
         * @memberof proto
         * @classdesc A descriptor for a fee based on a portion of the tokens transferred.
         * 
         * This fee option describes fees as a fraction of the amount of
         * fungible/common token(s) transferred.  The fee also describes a minimum
         * and maximum amount, both of which are OPTIONAL.
         * 
         * This type of fee SHALL be assessed only for fungible/common tokens.<br/>
         * This type of fee MUST NOT be defined for a non-fungible/unique
         * token type.<br/>
         * This fee SHALL be paid with the same type of tokens as those
         * transferred.<br/>
         * The fee MAY be subtracted from the transferred tokens, or MAY be assessed
         * to the sender in addition to the tokens actually transferred, based on
         * the `net_of_transfers` field.
         * 
         * When a single transaction sends tokens from one sender to multiple
         * recipients, and the `net_of_transfers` flag is false, the network
         * SHALL attempt to evenly assess the total fee across all recipients
         * proportionally. This may be inexact and, particularly when there are
         * large differences between recipients, MAY result in small deviations
         * from an ideal "fair" distribution.<br/>
         * If the sender lacks sufficient tokens to pay fees, or the assessment
         * of custom fees reduces the net amount transferred to or below zero,
         * the transaction MAY fail due to insufficient funds to pay all fees.
         * @implements IFractionalFee
         * @constructor
         * @param {proto.IFractionalFee=} [p] Properties to set
         */
        function FractionalFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A Fraction of the transferred tokens to assess as a fee.<br/>
         * This value MUST be less than or equal to one.<br/>
         * This value MUST be greater than zero.
         * @member {proto.IFraction|null|undefined} fractionalAmount
         * @memberof proto.FractionalFee
         * @instance
         */
        FractionalFee.prototype.fractionalAmount = null;

        /**
         * A minimum fee to charge, in units of 10<sup>-decimals</sup> tokens.
         * <p>
         * This value is OPTIONAL, with a default of `0` indicating no minimum.<br/>
         * If set, this value MUST be greater than zero.<br/>
         * If set, all transfers SHALL pay at least this amount.
         * @member {Long} minimumAmount
         * @memberof proto.FractionalFee
         * @instance
         */
        FractionalFee.prototype.minimumAmount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * A maximum fee to charge, in units of 10<sup>-decimals</sup> tokens.
         * <p>
         * This value is OPTIONAL, with a default of `0` indicating no maximum.<br/>
         * If set, this value MUST be greater than zero.<br/>
         * If set, any fee charged SHALL NOT exceed this value.<br/>
         * This value SHOULD be strictly greater than `minimum_amount`.
         * If this amount is less than or equal to `minimum_amount`, then
         * the fee charged SHALL always be equal to this value and
         * `fractional_amount` SHALL NOT have any effect.
         * @member {Long} maximumAmount
         * @memberof proto.FractionalFee
         * @instance
         */
        FractionalFee.prototype.maximumAmount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Flag requesting to assess the calculated fee against the sender,
         * without reducing the amount transferred.<br/>
         * #### Effects of this flag
         * <ol>
         * <li>If this value is true
         * <ul>
         * <li>The receiver of a transfer SHALL receive the entire
         * amount sent.</li>
         * <li>The fee SHALL be charged to the sender as an additional
         * amount, increasing the token transfer debit.</li>
         * </ul>
         * </li>
         * <li>If this value is false
         * <ul>
         * <li>The receiver of a transfer SHALL receive the amount sent
         * _after_ deduction of the calculated fee.</li>
         * </ul>
         * </li>
         * </ol>
         * @member {boolean} netOfTransfers
         * @memberof proto.FractionalFee
         * @instance
         */
        FractionalFee.prototype.netOfTransfers = false;

        /**
         * Creates a new FractionalFee instance using the specified properties.
         * @function create
         * @memberof proto.FractionalFee
         * @static
         * @param {proto.IFractionalFee=} [properties] Properties to set
         * @returns {proto.FractionalFee} FractionalFee instance
         */
        FractionalFee.create = function create(properties) {
            return new FractionalFee(properties);
        };

        /**
         * Encodes the specified FractionalFee message. Does not implicitly {@link proto.FractionalFee.verify|verify} messages.
         * @function encode
         * @memberof proto.FractionalFee
         * @static
         * @param {proto.IFractionalFee} m FractionalFee message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FractionalFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.fractionalAmount != null && Object.hasOwnProperty.call(m, "fractionalAmount"))
                $root.proto.Fraction.encode(m.fractionalAmount, w.uint32(10).fork()).ldelim();
            if (m.minimumAmount != null && Object.hasOwnProperty.call(m, "minimumAmount"))
                w.uint32(16).int64(m.minimumAmount);
            if (m.maximumAmount != null && Object.hasOwnProperty.call(m, "maximumAmount"))
                w.uint32(24).int64(m.maximumAmount);
            if (m.netOfTransfers != null && Object.hasOwnProperty.call(m, "netOfTransfers"))
                w.uint32(32).bool(m.netOfTransfers);
            return w;
        };

        /**
         * Decodes a FractionalFee message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FractionalFee
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FractionalFee} FractionalFee
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FractionalFee.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FractionalFee();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.fractionalAmount = $root.proto.Fraction.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.minimumAmount = r.int64();
                        break;
                    }
                case 3: {
                        m.maximumAmount = r.int64();
                        break;
                    }
                case 4: {
                        m.netOfTransfers = r.bool();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FractionalFee
         * @function getTypeUrl
         * @memberof proto.FractionalFee
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FractionalFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FractionalFee";
        };

        return FractionalFee;
    })();

    proto.FixedFee = (function() {

        /**
         * Properties of a FixedFee.
         * @memberof proto
         * @interface IFixedFee
         * @property {Long|null} [amount] The amount to assess for each transfer.
         * <p>
         * This value MUST be greater than `0`.<br/>
         * This amount is expressed in units of 10<sup>-decimals</sup> tokens.
         * @property {proto.ITokenID|null} [denominatingTokenId] The token type used to pay the assessed fee.
         * <p>
         * If this is unset, the fee SHALL be assessed in HBAR.<br/>
         * If this is set, the fee SHALL be assessed in the token identified.
         * This MAY be any token type. Custom fees assessed in other token types
         * are more likely to fail, however, and it is RECOMMENDED that token
         * creators denominate custom fees in the transferred token, HBAR, or
         * well documented and closely related token types.<br/>
         * If this value is set to `0.0.0` in the `tokenCreate` transaction, it
         * SHALL be replaced with the `TokenID` of the newly created token.
         */

        /**
         * Constructs a new FixedFee.
         * @memberof proto
         * @classdesc A fixed fee to assess for each token transfer, regardless of the
         * amount transferred.<br/>
         * This fee type describes a fixed fee for each transfer of a token type.
         * 
         * The fee SHALL be charged to the `sender` for the token transfer
         * transaction.<br/>
         * This fee MAY be assessed in HBAR, the token type transferred, or any
         * other token type, as determined by the `denominating_token_id` field.
         * @implements IFixedFee
         * @constructor
         * @param {proto.IFixedFee=} [p] Properties to set
         */
        function FixedFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * The amount to assess for each transfer.
         * <p>
         * This value MUST be greater than `0`.<br/>
         * This amount is expressed in units of 10<sup>-decimals</sup> tokens.
         * @member {Long} amount
         * @memberof proto.FixedFee
         * @instance
         */
        FixedFee.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * The token type used to pay the assessed fee.
         * <p>
         * If this is unset, the fee SHALL be assessed in HBAR.<br/>
         * If this is set, the fee SHALL be assessed in the token identified.
         * This MAY be any token type. Custom fees assessed in other token types
         * are more likely to fail, however, and it is RECOMMENDED that token
         * creators denominate custom fees in the transferred token, HBAR, or
         * well documented and closely related token types.<br/>
         * If this value is set to `0.0.0` in the `tokenCreate` transaction, it
         * SHALL be replaced with the `TokenID` of the newly created token.
         * @member {proto.ITokenID|null|undefined} denominatingTokenId
         * @memberof proto.FixedFee
         * @instance
         */
        FixedFee.prototype.denominatingTokenId = null;

        /**
         * Creates a new FixedFee instance using the specified properties.
         * @function create
         * @memberof proto.FixedFee
         * @static
         * @param {proto.IFixedFee=} [properties] Properties to set
         * @returns {proto.FixedFee} FixedFee instance
         */
        FixedFee.create = function create(properties) {
            return new FixedFee(properties);
        };

        /**
         * Encodes the specified FixedFee message. Does not implicitly {@link proto.FixedFee.verify|verify} messages.
         * @function encode
         * @memberof proto.FixedFee
         * @static
         * @param {proto.IFixedFee} m FixedFee message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FixedFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(8).int64(m.amount);
            if (m.denominatingTokenId != null && Object.hasOwnProperty.call(m, "denominatingTokenId"))
                $root.proto.TokenID.encode(m.denominatingTokenId, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a FixedFee message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FixedFee
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FixedFee} FixedFee
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FixedFee.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FixedFee();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.amount = r.int64();
                        break;
                    }
                case 2: {
                        m.denominatingTokenId = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FixedFee
         * @function getTypeUrl
         * @memberof proto.FixedFee
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FixedFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FixedFee";
        };

        return FixedFee;
    })();

    proto.RoyaltyFee = (function() {

        /**
         * Properties of a RoyaltyFee.
         * @memberof proto
         * @interface IRoyaltyFee
         * @property {proto.IFraction|null} [exchangeValueFraction] The fraction of fungible value exchanged for an NFT to collect
         * as royalty.
         * <p>
         * This SHALL be applied once to the total fungible value transferred
         * for the transaction.<br/>
         * There SHALL NOT be any adjustment based on multiple transfers
         * involving the NFT sender as part of a single transaction.
         * @property {proto.IFixedFee|null} [fallbackFee] A fixed fee to assess if no fungible value is known to be traded
         * for the NFT.
         * <p>
         * If an NFT is transferred without a corresponding transfer of
         * _fungible_ value returned in the same transaction, the network
         * SHALL charge this fee as a fallback.<br/>
         * Fallback fees MAY have unexpected effects when interacting with
         * escrow, market transfers, and smart contracts.
         * It is RECOMMENDED that developers carefully consider possible
         * effects from fallback fees when designing systems that facilitate
         * the transfer of NFTs.
         */

        /**
         * Constructs a new RoyaltyFee.
         * @memberof proto
         * @classdesc A fee to assess during a CryptoTransfer that changes ownership of a
         * non-fungible/unique (NFT) token.<br/>
         * This message defines the fraction of the fungible value exchanged for an
         * NFT that the ledger should collect as a royalty.
         * "Fungible value" includes both HBAR (ℏ) and units of fungible HTS tokens.
         * When the NFT sender does not receive any fungible value, the ledger will
         * assess the fallback fee, if present, to the new NFT owner. Royalty fees
         * can only be added to non-fungible/unique tokens.
         * 
         * #### Important Note
         * > Users should be aware that native royalty fees are _strictly_ a
         * > convenience feature, SHALL NOT be guaranteed, and the network SHALL NOT
         * > enforce _inescapable_ royalties on the exchange of a unique NFT.<br/>
         * > For _one_ example, if the counterparties agree to split their value
         * > transfer and NFT exchange into separate transactions, the network cannot
         * > possibly determine the value exchanged. Even trustless transactions,
         * > using a smart contract or other form of escrow, can arrange such split
         * > transactions as a single _logical_ transfer.
         * 
         * Counterparties that wish to _respect_ creator royalties MUST follow the
         * pattern the network recognizes.
         * <div style="margin-left: 2em; margin-top: -0.8em">
         * A single transaction MUST contain all three elements, transfer of the NFT,
         * debit of fungible value from the receiver, and credit of fungible value to
         * the sender, in order for the network to accurately assess royalty fees.
         * </div>
         * <div style="margin-left: 1em; margin-top: -0.8em">
         * Two examples are presented here.
         * <div style="margin-left: 1em">
         * The NFT sender and receiver MUST both sign a single `cryptoTransfer` that
         * transfers the NFT from sender to receiver, debits the fungible value from
         * the receiver, and credits the sender with the fungible value the receiver
         * is exchanging for the NFT.<br/>
         * A marketplace using an approved spender account for an escrow transaction
         * MUST credit the account selling the NFT in the same `cryptoTransfer`
         * transaction that transfers the NFT to, and deducts fungible value from,
         * the buying account.
         * </div></div>
         * This type of fee MAY NOT produce accurate results if multiple transfers
         * are executed in a single transaction. It is RECOMMENDED that each
         * NFT subject to royalty fees be transferred separately and without
         * unrelated fungible token transfers.
         * 
         * The network SHALL NOT consider third-party transfers, including
         * "approved spender" accounts, in collecting royalty fees. An honest
         * broker MUST ensure that transfer of an NFT and payment delivered to
         * the sender are present in the same transaction.
         * There is an
         * [open suggestion](https://github.com/hashgraph/hedera-improvement-proposal/discussions/578)
         * that proposes to broaden the scope of transfers from which the network
         * automatically collects royalties to cover related third parties. If this
         * interests or concerns you, please add your voice to that discussion.
         * @implements IRoyaltyFee
         * @constructor
         * @param {proto.IRoyaltyFee=} [p] Properties to set
         */
        function RoyaltyFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * The fraction of fungible value exchanged for an NFT to collect
         * as royalty.
         * <p>
         * This SHALL be applied once to the total fungible value transferred
         * for the transaction.<br/>
         * There SHALL NOT be any adjustment based on multiple transfers
         * involving the NFT sender as part of a single transaction.
         * @member {proto.IFraction|null|undefined} exchangeValueFraction
         * @memberof proto.RoyaltyFee
         * @instance
         */
        RoyaltyFee.prototype.exchangeValueFraction = null;

        /**
         * A fixed fee to assess if no fungible value is known to be traded
         * for the NFT.
         * <p>
         * If an NFT is transferred without a corresponding transfer of
         * _fungible_ value returned in the same transaction, the network
         * SHALL charge this fee as a fallback.<br/>
         * Fallback fees MAY have unexpected effects when interacting with
         * escrow, market transfers, and smart contracts.
         * It is RECOMMENDED that developers carefully consider possible
         * effects from fallback fees when designing systems that facilitate
         * the transfer of NFTs.
         * @member {proto.IFixedFee|null|undefined} fallbackFee
         * @memberof proto.RoyaltyFee
         * @instance
         */
        RoyaltyFee.prototype.fallbackFee = null;

        /**
         * Creates a new RoyaltyFee instance using the specified properties.
         * @function create
         * @memberof proto.RoyaltyFee
         * @static
         * @param {proto.IRoyaltyFee=} [properties] Properties to set
         * @returns {proto.RoyaltyFee} RoyaltyFee instance
         */
        RoyaltyFee.create = function create(properties) {
            return new RoyaltyFee(properties);
        };

        /**
         * Encodes the specified RoyaltyFee message. Does not implicitly {@link proto.RoyaltyFee.verify|verify} messages.
         * @function encode
         * @memberof proto.RoyaltyFee
         * @static
         * @param {proto.IRoyaltyFee} m RoyaltyFee message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RoyaltyFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.exchangeValueFraction != null && Object.hasOwnProperty.call(m, "exchangeValueFraction"))
                $root.proto.Fraction.encode(m.exchangeValueFraction, w.uint32(10).fork()).ldelim();
            if (m.fallbackFee != null && Object.hasOwnProperty.call(m, "fallbackFee"))
                $root.proto.FixedFee.encode(m.fallbackFee, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a RoyaltyFee message from the specified reader or buffer.
         * @function decode
         * @memberof proto.RoyaltyFee
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.RoyaltyFee} RoyaltyFee
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RoyaltyFee.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.RoyaltyFee();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.exchangeValueFraction = $root.proto.Fraction.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.fallbackFee = $root.proto.FixedFee.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for RoyaltyFee
         * @function getTypeUrl
         * @memberof proto.RoyaltyFee
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        RoyaltyFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.RoyaltyFee";
        };

        return RoyaltyFee;
    })();

    proto.CustomFee = (function() {

        /**
         * Properties of a CustomFee.
         * @memberof proto
         * @interface ICustomFee
         * @property {proto.IFixedFee|null} [fixedFee] A fixed fee to be charged to the `sender` for every token transfer.
         * <p>
         * This type of fee MAY be defined for any token type.<br/>
         * This type of fee MAY be more consistent and reliable than
         * other types.
         * @property {proto.IFractionalFee|null} [fractionalFee] A fee defined as a fraction of the tokens transferred.
         * <p>
         * This type of fee MUST NOT be defined for a non-fungible/unique
         * token type.<br/>
         * This fee MAY be charged to either sender, as an increase to the
         * amount sent, or receiver, as a reduction to the amount received.
         * @property {proto.IRoyaltyFee|null} [royaltyFee] A fee charged as royalty for any transfer of a
         * non-fungible/unique token.
         * <p>
         * This type of fee MUST NOT be defined for a
         * fungible/common token type.
         * @property {proto.IAccountID|null} [feeCollectorAccountId] The account to receive the custom fee.
         * @property {boolean|null} [allCollectorsAreExempt] Flag indicating to exempt all custom fee collector accounts for this
         * token type from paying this custom fee when sending tokens.
         * <p>
         * The treasury account for a token, and the account identified by the
         * `fee_collector_account_id` field of this `CustomFee` are always exempt
         * from this custom fee to avoid redundant and unnecessary transfers.
         * If this value is `true` then the account(s) identified in
         * `fee_collector_account_id` for _all_ custom fee definitions for this
         * token type SHALL also be exempt from this custom fee.
         * This behavior is specified in HIP-573.
         */

        /**
         * Constructs a new CustomFee.
         * @memberof proto
         * @classdesc A transfer fee to assess during a CryptoTransfer.<br/>
         * This fee applies to transactions that transfer units of the token to
         * which the fee is attached. A custom fee may be either fixed or fractional,
         * and must specify a fee collector account to receive the assessed fees.
         * 
         * Custom fees MUST be greater than zero (0).
         * @implements ICustomFee
         * @constructor
         * @param {proto.ICustomFee=} [p] Properties to set
         */
        function CustomFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A fixed fee to be charged to the `sender` for every token transfer.
         * <p>
         * This type of fee MAY be defined for any token type.<br/>
         * This type of fee MAY be more consistent and reliable than
         * other types.
         * @member {proto.IFixedFee|null|undefined} fixedFee
         * @memberof proto.CustomFee
         * @instance
         */
        CustomFee.prototype.fixedFee = null;

        /**
         * A fee defined as a fraction of the tokens transferred.
         * <p>
         * This type of fee MUST NOT be defined for a non-fungible/unique
         * token type.<br/>
         * This fee MAY be charged to either sender, as an increase to the
         * amount sent, or receiver, as a reduction to the amount received.
         * @member {proto.IFractionalFee|null|undefined} fractionalFee
         * @memberof proto.CustomFee
         * @instance
         */
        CustomFee.prototype.fractionalFee = null;

        /**
         * A fee charged as royalty for any transfer of a
         * non-fungible/unique token.
         * <p>
         * This type of fee MUST NOT be defined for a
         * fungible/common token type.
         * @member {proto.IRoyaltyFee|null|undefined} royaltyFee
         * @memberof proto.CustomFee
         * @instance
         */
        CustomFee.prototype.royaltyFee = null;

        /**
         * The account to receive the custom fee.
         * @member {proto.IAccountID|null|undefined} feeCollectorAccountId
         * @memberof proto.CustomFee
         * @instance
         */
        CustomFee.prototype.feeCollectorAccountId = null;

        /**
         * Flag indicating to exempt all custom fee collector accounts for this
         * token type from paying this custom fee when sending tokens.
         * <p>
         * The treasury account for a token, and the account identified by the
         * `fee_collector_account_id` field of this `CustomFee` are always exempt
         * from this custom fee to avoid redundant and unnecessary transfers.
         * If this value is `true` then the account(s) identified in
         * `fee_collector_account_id` for _all_ custom fee definitions for this
         * token type SHALL also be exempt from this custom fee.
         * This behavior is specified in HIP-573.
         * @member {boolean} allCollectorsAreExempt
         * @memberof proto.CustomFee
         * @instance
         */
        CustomFee.prototype.allCollectorsAreExempt = false;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * CustomFee fee.
         * @member {"fixedFee"|"fractionalFee"|"royaltyFee"|undefined} fee
         * @memberof proto.CustomFee
         * @instance
         */
        Object.defineProperty(CustomFee.prototype, "fee", {
            get: $util.oneOfGetter($oneOfFields = ["fixedFee", "fractionalFee", "royaltyFee"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new CustomFee instance using the specified properties.
         * @function create
         * @memberof proto.CustomFee
         * @static
         * @param {proto.ICustomFee=} [properties] Properties to set
         * @returns {proto.CustomFee} CustomFee instance
         */
        CustomFee.create = function create(properties) {
            return new CustomFee(properties);
        };

        /**
         * Encodes the specified CustomFee message. Does not implicitly {@link proto.CustomFee.verify|verify} messages.
         * @function encode
         * @memberof proto.CustomFee
         * @static
         * @param {proto.ICustomFee} m CustomFee message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CustomFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.fixedFee != null && Object.hasOwnProperty.call(m, "fixedFee"))
                $root.proto.FixedFee.encode(m.fixedFee, w.uint32(10).fork()).ldelim();
            if (m.fractionalFee != null && Object.hasOwnProperty.call(m, "fractionalFee"))
                $root.proto.FractionalFee.encode(m.fractionalFee, w.uint32(18).fork()).ldelim();
            if (m.feeCollectorAccountId != null && Object.hasOwnProperty.call(m, "feeCollectorAccountId"))
                $root.proto.AccountID.encode(m.feeCollectorAccountId, w.uint32(26).fork()).ldelim();
            if (m.royaltyFee != null && Object.hasOwnProperty.call(m, "royaltyFee"))
                $root.proto.RoyaltyFee.encode(m.royaltyFee, w.uint32(34).fork()).ldelim();
            if (m.allCollectorsAreExempt != null && Object.hasOwnProperty.call(m, "allCollectorsAreExempt"))
                w.uint32(40).bool(m.allCollectorsAreExempt);
            return w;
        };

        /**
         * Decodes a CustomFee message from the specified reader or buffer.
         * @function decode
         * @memberof proto.CustomFee
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.CustomFee} CustomFee
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CustomFee.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.CustomFee();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.fixedFee = $root.proto.FixedFee.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.fractionalFee = $root.proto.FractionalFee.decode(r, r.uint32());
                        break;
                    }
                case 4: {
                        m.royaltyFee = $root.proto.RoyaltyFee.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.feeCollectorAccountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 5: {
                        m.allCollectorsAreExempt = r.bool();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for CustomFee
         * @function getTypeUrl
         * @memberof proto.CustomFee
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        CustomFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.CustomFee";
        };

        return CustomFee;
    })();

    proto.AssessedCustomFee = (function() {

        /**
         * Properties of an AssessedCustomFee.
         * @memberof proto
         * @interface IAssessedCustomFee
         * @property {Long|null} [amount] An amount of tokens assessed for this custom fee.
         * <p>
         * This shall be expressed in units of 10<sup>-decimals</sup> tokens.
         * @property {proto.ITokenID|null} [tokenId] The token transferred to satisfy this fee.
         * <p>
         * If the token transferred is HBAR, this field SHALL NOT be set.
         * @property {proto.IAccountID|null} [feeCollectorAccountId] An account that received the fee assessed.
         * <p>
         * This SHALL NOT be the sender or receiver of the original
         * cryptoTransfer transaction.
         * @property {Array.<proto.IAccountID>|null} [effectivePayerAccountId] An account that provided the tokens assessed as a fee.
         * <p>
         * This SHALL be the account that _would have_ had a higher balance
         * absent the fee. In most cases this SHALL be the `sender`, but
         * some _fractional_ fees reduce the amount transferred, and in those
         * cases the `receiver` SHALL be the effective payer for the fee.<br/>
         * There are currently no situations where a third party pays a custom
         * fee. This MAY change in a future release.
         */

        /**
         * Constructs a new AssessedCustomFee.
         * @memberof proto
         * @classdesc Description of a transfer added to a `cryptoTransfer` transaction that
         * satisfies custom fee requirements.
         * 
         * It is important to note that this is not the actual transfer. The transfer
         * of value SHALL be merged into the original transaction to minimize the
         * number of actual transfers. This descriptor presents the fee assessed
         * separately in the record stream so that the details of the fee assessed
         * are not hidden in this process.
         * @implements IAssessedCustomFee
         * @constructor
         * @param {proto.IAssessedCustomFee=} [p] Properties to set
         */
        function AssessedCustomFee(p) {
            this.effectivePayerAccountId = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * An amount of tokens assessed for this custom fee.
         * <p>
         * This shall be expressed in units of 10<sup>-decimals</sup> tokens.
         * @member {Long} amount
         * @memberof proto.AssessedCustomFee
         * @instance
         */
        AssessedCustomFee.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * The token transferred to satisfy this fee.
         * <p>
         * If the token transferred is HBAR, this field SHALL NOT be set.
         * @member {proto.ITokenID|null|undefined} tokenId
         * @memberof proto.AssessedCustomFee
         * @instance
         */
        AssessedCustomFee.prototype.tokenId = null;

        /**
         * An account that received the fee assessed.
         * <p>
         * This SHALL NOT be the sender or receiver of the original
         * cryptoTransfer transaction.
         * @member {proto.IAccountID|null|undefined} feeCollectorAccountId
         * @memberof proto.AssessedCustomFee
         * @instance
         */
        AssessedCustomFee.prototype.feeCollectorAccountId = null;

        /**
         * An account that provided the tokens assessed as a fee.
         * <p>
         * This SHALL be the account that _would have_ had a higher balance
         * absent the fee. In most cases this SHALL be the `sender`, but
         * some _fractional_ fees reduce the amount transferred, and in those
         * cases the `receiver` SHALL be the effective payer for the fee.<br/>
         * There are currently no situations where a third party pays a custom
         * fee. This MAY change in a future release.
         * @member {Array.<proto.IAccountID>} effectivePayerAccountId
         * @memberof proto.AssessedCustomFee
         * @instance
         */
        AssessedCustomFee.prototype.effectivePayerAccountId = $util.emptyArray;

        /**
         * Creates a new AssessedCustomFee instance using the specified properties.
         * @function create
         * @memberof proto.AssessedCustomFee
         * @static
         * @param {proto.IAssessedCustomFee=} [properties] Properties to set
         * @returns {proto.AssessedCustomFee} AssessedCustomFee instance
         */
        AssessedCustomFee.create = function create(properties) {
            return new AssessedCustomFee(properties);
        };

        /**
         * Encodes the specified AssessedCustomFee message. Does not implicitly {@link proto.AssessedCustomFee.verify|verify} messages.
         * @function encode
         * @memberof proto.AssessedCustomFee
         * @static
         * @param {proto.IAssessedCustomFee} m AssessedCustomFee message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AssessedCustomFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(8).int64(m.amount);
            if (m.tokenId != null && Object.hasOwnProperty.call(m, "tokenId"))
                $root.proto.TokenID.encode(m.tokenId, w.uint32(18).fork()).ldelim();
            if (m.feeCollectorAccountId != null && Object.hasOwnProperty.call(m, "feeCollectorAccountId"))
                $root.proto.AccountID.encode(m.feeCollectorAccountId, w.uint32(26).fork()).ldelim();
            if (m.effectivePayerAccountId != null && m.effectivePayerAccountId.length) {
                for (var i = 0; i < m.effectivePayerAccountId.length; ++i)
                    $root.proto.AccountID.encode(m.effectivePayerAccountId[i], w.uint32(34).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes an AssessedCustomFee message from the specified reader or buffer.
         * @function decode
         * @memberof proto.AssessedCustomFee
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.AssessedCustomFee} AssessedCustomFee
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AssessedCustomFee.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.AssessedCustomFee();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.amount = r.int64();
                        break;
                    }
                case 2: {
                        m.tokenId = $root.proto.TokenID.decode(r, r.uint32());
                        break;
                    }
                case 3: {
                        m.feeCollectorAccountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 4: {
                        if (!(m.effectivePayerAccountId && m.effectivePayerAccountId.length))
                            m.effectivePayerAccountId = [];
                        m.effectivePayerAccountId.push($root.proto.AccountID.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for AssessedCustomFee
         * @function getTypeUrl
         * @memberof proto.AssessedCustomFee
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        AssessedCustomFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.AssessedCustomFee";
        };

        return AssessedCustomFee;
    })();

    proto.FixedCustomFee = (function() {

        /**
         * Properties of a FixedCustomFee.
         * @memberof proto
         * @interface IFixedCustomFee
         * @property {proto.IFixedFee|null} [fixedFee] A fixed custom fee.
         * <p>
         * The amount of HBAR or other token described by this `FixedFee` SHALL
         * be charged to the transction payer for each message submitted to a
         * topic that assigns this consensus custom fee.
         * @property {proto.IAccountID|null} [feeCollectorAccountId] A collection account identifier.
         * <p>
         * All amounts collected for this consensus custom fee SHALL be transferred
         * to the account identified by this field.
         */

        /**
         * Constructs a new FixedCustomFee.
         * @memberof proto
         * @classdesc A custom fee definition for a consensus topic.
         * <p>
         * This fee definition is specific to an Hedera Consensus Service (HCS) topic
         * and SHOULD NOT be used in any other context.<br/>
         * All fields for this message are REQUIRED.<br/>
         * Only "fixed" fee definitions are supported because there is no basis for
         * a fractional fee on a consensus submit transaction.
         * @implements IFixedCustomFee
         * @constructor
         * @param {proto.IFixedCustomFee=} [p] Properties to set
         */
        function FixedCustomFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A fixed custom fee.
         * <p>
         * The amount of HBAR or other token described by this `FixedFee` SHALL
         * be charged to the transction payer for each message submitted to a
         * topic that assigns this consensus custom fee.
         * @member {proto.IFixedFee|null|undefined} fixedFee
         * @memberof proto.FixedCustomFee
         * @instance
         */
        FixedCustomFee.prototype.fixedFee = null;

        /**
         * A collection account identifier.
         * <p>
         * All amounts collected for this consensus custom fee SHALL be transferred
         * to the account identified by this field.
         * @member {proto.IAccountID|null|undefined} feeCollectorAccountId
         * @memberof proto.FixedCustomFee
         * @instance
         */
        FixedCustomFee.prototype.feeCollectorAccountId = null;

        /**
         * Creates a new FixedCustomFee instance using the specified properties.
         * @function create
         * @memberof proto.FixedCustomFee
         * @static
         * @param {proto.IFixedCustomFee=} [properties] Properties to set
         * @returns {proto.FixedCustomFee} FixedCustomFee instance
         */
        FixedCustomFee.create = function create(properties) {
            return new FixedCustomFee(properties);
        };

        /**
         * Encodes the specified FixedCustomFee message. Does not implicitly {@link proto.FixedCustomFee.verify|verify} messages.
         * @function encode
         * @memberof proto.FixedCustomFee
         * @static
         * @param {proto.IFixedCustomFee} m FixedCustomFee message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FixedCustomFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.fixedFee != null && Object.hasOwnProperty.call(m, "fixedFee"))
                $root.proto.FixedFee.encode(m.fixedFee, w.uint32(10).fork()).ldelim();
            if (m.feeCollectorAccountId != null && Object.hasOwnProperty.call(m, "feeCollectorAccountId"))
                $root.proto.AccountID.encode(m.feeCollectorAccountId, w.uint32(18).fork()).ldelim();
            return w;
        };

        /**
         * Decodes a FixedCustomFee message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FixedCustomFee
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FixedCustomFee} FixedCustomFee
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FixedCustomFee.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FixedCustomFee();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.fixedFee = $root.proto.FixedFee.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        m.feeCollectorAccountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FixedCustomFee
         * @function getTypeUrl
         * @memberof proto.FixedCustomFee
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FixedCustomFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FixedCustomFee";
        };

        return FixedCustomFee;
    })();

    proto.FixedCustomFeeList = (function() {

        /**
         * Properties of a FixedCustomFeeList.
         * @memberof proto
         * @interface IFixedCustomFeeList
         * @property {Array.<proto.IFixedCustomFee>|null} [fees] A set of custom fee definitions.<br/>
         * These are fees to be assessed for each submit to a topic.
         */

        /**
         * Constructs a new FixedCustomFeeList.
         * @memberof proto
         * @classdesc A wrapper around a consensus custom fee list.<br/>
         * This wrapper exists to enable an update transaction to differentiate between
         * a field that is not set and an empty list of custom fees.
         * <p>
         * An _unset_ field of this type SHALL NOT modify existing values.<br/>
         * A _set_ field of this type with an empty `fees` list SHALL remove any
         * existing values.
         * @implements IFixedCustomFeeList
         * @constructor
         * @param {proto.IFixedCustomFeeList=} [p] Properties to set
         */
        function FixedCustomFeeList(p) {
            this.fees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A set of custom fee definitions.<br/>
         * These are fees to be assessed for each submit to a topic.
         * @member {Array.<proto.IFixedCustomFee>} fees
         * @memberof proto.FixedCustomFeeList
         * @instance
         */
        FixedCustomFeeList.prototype.fees = $util.emptyArray;

        /**
         * Creates a new FixedCustomFeeList instance using the specified properties.
         * @function create
         * @memberof proto.FixedCustomFeeList
         * @static
         * @param {proto.IFixedCustomFeeList=} [properties] Properties to set
         * @returns {proto.FixedCustomFeeList} FixedCustomFeeList instance
         */
        FixedCustomFeeList.create = function create(properties) {
            return new FixedCustomFeeList(properties);
        };

        /**
         * Encodes the specified FixedCustomFeeList message. Does not implicitly {@link proto.FixedCustomFeeList.verify|verify} messages.
         * @function encode
         * @memberof proto.FixedCustomFeeList
         * @static
         * @param {proto.IFixedCustomFeeList} m FixedCustomFeeList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FixedCustomFeeList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.fees != null && m.fees.length) {
                for (var i = 0; i < m.fees.length; ++i)
                    $root.proto.FixedCustomFee.encode(m.fees[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a FixedCustomFeeList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FixedCustomFeeList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FixedCustomFeeList} FixedCustomFeeList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FixedCustomFeeList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FixedCustomFeeList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.fees && m.fees.length))
                            m.fees = [];
                        m.fees.push($root.proto.FixedCustomFee.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FixedCustomFeeList
         * @function getTypeUrl
         * @memberof proto.FixedCustomFeeList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FixedCustomFeeList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FixedCustomFeeList";
        };

        return FixedCustomFeeList;
    })();

    proto.FeeExemptKeyList = (function() {

        /**
         * Properties of a FeeExemptKeyList.
         * @memberof proto
         * @interface IFeeExemptKeyList
         * @property {Array.<proto.IKey>|null} [keys] A set of keys.<br/>
         * The keys in this list are permitted to submit messages to the
         * topic without paying the topic's custom fees.
         * <p>
         * If a submit transaction is signed by _any_ key included in this set,
         * custom fees SHALL NOT be charged for that transaction.
         */

        /**
         * Constructs a new FeeExemptKeyList.
         * @memberof proto
         * @classdesc A wrapper for fee exempt key list.<br/>
         * This wrapper exists to enable an update transaction to differentiate between
         * a field that is not set and an empty list of keys.
         * <p>
         * An _unset_ field of this type SHALL NOT modify existing values.<br/>
         * A _set_ field of this type with an empty `keys` list SHALL remove any
         * existing values.
         * @implements IFeeExemptKeyList
         * @constructor
         * @param {proto.IFeeExemptKeyList=} [p] Properties to set
         */
        function FeeExemptKeyList(p) {
            this.keys = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A set of keys.<br/>
         * The keys in this list are permitted to submit messages to the
         * topic without paying the topic's custom fees.
         * <p>
         * If a submit transaction is signed by _any_ key included in this set,
         * custom fees SHALL NOT be charged for that transaction.
         * @member {Array.<proto.IKey>} keys
         * @memberof proto.FeeExemptKeyList
         * @instance
         */
        FeeExemptKeyList.prototype.keys = $util.emptyArray;

        /**
         * Creates a new FeeExemptKeyList instance using the specified properties.
         * @function create
         * @memberof proto.FeeExemptKeyList
         * @static
         * @param {proto.IFeeExemptKeyList=} [properties] Properties to set
         * @returns {proto.FeeExemptKeyList} FeeExemptKeyList instance
         */
        FeeExemptKeyList.create = function create(properties) {
            return new FeeExemptKeyList(properties);
        };

        /**
         * Encodes the specified FeeExemptKeyList message. Does not implicitly {@link proto.FeeExemptKeyList.verify|verify} messages.
         * @function encode
         * @memberof proto.FeeExemptKeyList
         * @static
         * @param {proto.IFeeExemptKeyList} m FeeExemptKeyList message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FeeExemptKeyList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.keys != null && m.keys.length) {
                for (var i = 0; i < m.keys.length; ++i)
                    $root.proto.Key.encode(m.keys[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a FeeExemptKeyList message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FeeExemptKeyList
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.FeeExemptKeyList} FeeExemptKeyList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FeeExemptKeyList.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.FeeExemptKeyList();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        if (!(m.keys && m.keys.length))
                            m.keys = [];
                        m.keys.push($root.proto.Key.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for FeeExemptKeyList
         * @function getTypeUrl
         * @memberof proto.FeeExemptKeyList
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FeeExemptKeyList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeExemptKeyList";
        };

        return FeeExemptKeyList;
    })();

    proto.CustomFeeLimit = (function() {

        /**
         * Properties of a CustomFeeLimit.
         * @memberof proto
         * @interface ICustomFeeLimit
         * @property {proto.IAccountID|null} [accountId] A payer account identifier.
         * @property {Array.<proto.IFixedFee>|null} [fees] The maximum fees that the user is willing to pay for the message.
         */

        /**
         * Constructs a new CustomFeeLimit.
         * @memberof proto
         * @classdesc A maximum custom fee that the user is willing to pay.
         * <p>
         * This message is used to specify the maximum custom fee that given user is
         * willing to pay.
         * @implements ICustomFeeLimit
         * @constructor
         * @param {proto.ICustomFeeLimit=} [p] Properties to set
         */
        function CustomFeeLimit(p) {
            this.fees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A payer account identifier.
         * @member {proto.IAccountID|null|undefined} accountId
         * @memberof proto.CustomFeeLimit
         * @instance
         */
        CustomFeeLimit.prototype.accountId = null;

        /**
         * The maximum fees that the user is willing to pay for the message.
         * @member {Array.<proto.IFixedFee>} fees
         * @memberof proto.CustomFeeLimit
         * @instance
         */
        CustomFeeLimit.prototype.fees = $util.emptyArray;

        /**
         * Creates a new CustomFeeLimit instance using the specified properties.
         * @function create
         * @memberof proto.CustomFeeLimit
         * @static
         * @param {proto.ICustomFeeLimit=} [properties] Properties to set
         * @returns {proto.CustomFeeLimit} CustomFeeLimit instance
         */
        CustomFeeLimit.create = function create(properties) {
            return new CustomFeeLimit(properties);
        };

        /**
         * Encodes the specified CustomFeeLimit message. Does not implicitly {@link proto.CustomFeeLimit.verify|verify} messages.
         * @function encode
         * @memberof proto.CustomFeeLimit
         * @static
         * @param {proto.ICustomFeeLimit} m CustomFeeLimit message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CustomFeeLimit.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.accountId != null && Object.hasOwnProperty.call(m, "accountId"))
                $root.proto.AccountID.encode(m.accountId, w.uint32(10).fork()).ldelim();
            if (m.fees != null && m.fees.length) {
                for (var i = 0; i < m.fees.length; ++i)
                    $root.proto.FixedFee.encode(m.fees[i], w.uint32(18).fork()).ldelim();
            }
            return w;
        };

        /**
         * Decodes a CustomFeeLimit message from the specified reader or buffer.
         * @function decode
         * @memberof proto.CustomFeeLimit
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.CustomFeeLimit} CustomFeeLimit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CustomFeeLimit.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.CustomFeeLimit();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.accountId = $root.proto.AccountID.decode(r, r.uint32());
                        break;
                    }
                case 2: {
                        if (!(m.fees && m.fees.length))
                            m.fees = [];
                        m.fees.push($root.proto.FixedFee.decode(r, r.uint32()));
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for CustomFeeLimit
         * @function getTypeUrl
         * @memberof proto.CustomFeeLimit
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        CustomFeeLimit.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.CustomFeeLimit";
        };

        return CustomFeeLimit;
    })();

    proto.Timestamp = (function() {

        /**
         * Properties of a Timestamp.
         * @memberof proto
         * @interface ITimestamp
         * @property {Long|null} [seconds] The number of complete seconds since the start of the epoch.
         * <p>
         * For this purpose, `epoch` SHALL be the UNIX epoch with 0
         * at `1970-01-01T00:00:00.000Z`.<br/>
         * This value MUST be greater than 0.<br/>
         * This value SHOULD be strictly greater than `946684800`.
         * @property {number|null} [nanos] The number of nanoseconds after the start of the second referenced
         * in `seconds`.
         * <p>
         * This value MUST be greater than or equal to 0.<br/>
         * This value MUST be strictly less than 1,000,000,000.
         */

        /**
         * Constructs a new Timestamp.
         * @memberof proto
         * @classdesc An exact date and time.<br/>
         * This is the same data structure as the Google protobuf Timestamp.proto.
         * 
         * #### Additional Notes
         * Useful information is present in comments on the
         * [Google version](https://github.com/google/protobuf/blob/master/src/google/protobuf/timestamp.proto).
         * @implements ITimestamp
         * @constructor
         * @param {proto.ITimestamp=} [p] Properties to set
         */
        function Timestamp(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * The number of complete seconds since the start of the epoch.
         * <p>
         * For this purpose, `epoch` SHALL be the UNIX epoch with 0
         * at `1970-01-01T00:00:00.000Z`.<br/>
         * This value MUST be greater than 0.<br/>
         * This value SHOULD be strictly greater than `946684800`.
         * @member {Long} seconds
         * @memberof proto.Timestamp
         * @instance
         */
        Timestamp.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * The number of nanoseconds after the start of the second referenced
         * in `seconds`.
         * <p>
         * This value MUST be greater than or equal to 0.<br/>
         * This value MUST be strictly less than 1,000,000,000.
         * @member {number} nanos
         * @memberof proto.Timestamp
         * @instance
         */
        Timestamp.prototype.nanos = 0;

        /**
         * Creates a new Timestamp instance using the specified properties.
         * @function create
         * @memberof proto.Timestamp
         * @static
         * @param {proto.ITimestamp=} [properties] Properties to set
         * @returns {proto.Timestamp} Timestamp instance
         */
        Timestamp.create = function create(properties) {
            return new Timestamp(properties);
        };

        /**
         * Encodes the specified Timestamp message. Does not implicitly {@link proto.Timestamp.verify|verify} messages.
         * @function encode
         * @memberof proto.Timestamp
         * @static
         * @param {proto.ITimestamp} m Timestamp message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Timestamp.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.seconds != null && Object.hasOwnProperty.call(m, "seconds"))
                w.uint32(8).int64(m.seconds);
            if (m.nanos != null && Object.hasOwnProperty.call(m, "nanos"))
                w.uint32(16).int32(m.nanos);
            return w;
        };

        /**
         * Decodes a Timestamp message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Timestamp
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.Timestamp} Timestamp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Timestamp.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.Timestamp();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.seconds = r.int64();
                        break;
                    }
                case 2: {
                        m.nanos = r.int32();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for Timestamp
         * @function getTypeUrl
         * @memberof proto.Timestamp
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Timestamp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Timestamp";
        };

        return Timestamp;
    })();

    proto.TimestampSeconds = (function() {

        /**
         * Properties of a TimestampSeconds.
         * @memberof proto
         * @interface ITimestampSeconds
         * @property {Long|null} [seconds] The number of complete seconds since the start of the epoch.
         * <p>
         * For this purpose, `epoch` SHALL be the UNIX epoch with 0
         * at `1970-01-01T00:00:00.000Z`.<br/>
         * This value MUST be greater than 0.<br/>
         * This value SHOULD be strictly greater than `946684800`.
         */

        /**
         * Constructs a new TimestampSeconds.
         * @memberof proto
         * @classdesc An exact date and time, with a resolution of one second.
         * @implements ITimestampSeconds
         * @constructor
         * @param {proto.ITimestampSeconds=} [p] Properties to set
         */
        function TimestampSeconds(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * The number of complete seconds since the start of the epoch.
         * <p>
         * For this purpose, `epoch` SHALL be the UNIX epoch with 0
         * at `1970-01-01T00:00:00.000Z`.<br/>
         * This value MUST be greater than 0.<br/>
         * This value SHOULD be strictly greater than `946684800`.
         * @member {Long} seconds
         * @memberof proto.TimestampSeconds
         * @instance
         */
        TimestampSeconds.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new TimestampSeconds instance using the specified properties.
         * @function create
         * @memberof proto.TimestampSeconds
         * @static
         * @param {proto.ITimestampSeconds=} [properties] Properties to set
         * @returns {proto.TimestampSeconds} TimestampSeconds instance
         */
        TimestampSeconds.create = function create(properties) {
            return new TimestampSeconds(properties);
        };

        /**
         * Encodes the specified TimestampSeconds message. Does not implicitly {@link proto.TimestampSeconds.verify|verify} messages.
         * @function encode
         * @memberof proto.TimestampSeconds
         * @static
         * @param {proto.ITimestampSeconds} m TimestampSeconds message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TimestampSeconds.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.seconds != null && Object.hasOwnProperty.call(m, "seconds"))
                w.uint32(8).int64(m.seconds);
            return w;
        };

        /**
         * Decodes a TimestampSeconds message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TimestampSeconds
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TimestampSeconds} TimestampSeconds
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TimestampSeconds.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TimestampSeconds();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.seconds = r.int64();
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        /**
         * Gets the default type url for TimestampSeconds
         * @function getTypeUrl
         * @memberof proto.TimestampSeconds
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TimestampSeconds.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TimestampSeconds";
        };

        return TimestampSeconds;
    })();

    return proto;
})();

export const google = $root.google = (() => {

    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    const google = {};

    google.protobuf = (function() {

        /**
         * Namespace protobuf.
         * @memberof google
         * @namespace
         */
        const protobuf = {};

        protobuf.UInt32Value = (function() {

            /**
             * Properties of a UInt32Value.
             * @memberof google.protobuf
             * @interface IUInt32Value
             * @property {number|null} [value] The uint32 value.
             */

            /**
             * Constructs a new UInt32Value.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `uint32`.
             * @implements IUInt32Value
             * @constructor
             * @param {google.protobuf.IUInt32Value=} [p] Properties to set
             */
            function UInt32Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The uint32 value.
             * @member {number} value
             * @memberof google.protobuf.UInt32Value
             * @instance
             */
            UInt32Value.prototype.value = 0;

            /**
             * Creates a new UInt32Value instance using the specified properties.
             * @function create
             * @memberof google.protobuf.UInt32Value
             * @static
             * @param {google.protobuf.IUInt32Value=} [properties] Properties to set
             * @returns {google.protobuf.UInt32Value} UInt32Value instance
             */
            UInt32Value.create = function create(properties) {
                return new UInt32Value(properties);
            };

            /**
             * Encodes the specified UInt32Value message. Does not implicitly {@link google.protobuf.UInt32Value.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.UInt32Value
             * @static
             * @param {google.protobuf.IUInt32Value} m UInt32Value message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UInt32Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).uint32(m.value);
                return w;
            };

            /**
             * Decodes a UInt32Value message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.UInt32Value
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.UInt32Value} UInt32Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UInt32Value.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.UInt32Value();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.uint32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for UInt32Value
             * @function getTypeUrl
             * @memberof google.protobuf.UInt32Value
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UInt32Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.UInt32Value";
            };

            return UInt32Value;
        })();

        protobuf.StringValue = (function() {

            /**
             * Properties of a StringValue.
             * @memberof google.protobuf
             * @interface IStringValue
             * @property {string|null} [value] The string value.
             */

            /**
             * Constructs a new StringValue.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `string`.
             * @implements IStringValue
             * @constructor
             * @param {google.protobuf.IStringValue=} [p] Properties to set
             */
            function StringValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The string value.
             * @member {string} value
             * @memberof google.protobuf.StringValue
             * @instance
             */
            StringValue.prototype.value = "";

            /**
             * Creates a new StringValue instance using the specified properties.
             * @function create
             * @memberof google.protobuf.StringValue
             * @static
             * @param {google.protobuf.IStringValue=} [properties] Properties to set
             * @returns {google.protobuf.StringValue} StringValue instance
             */
            StringValue.create = function create(properties) {
                return new StringValue(properties);
            };

            /**
             * Encodes the specified StringValue message. Does not implicitly {@link google.protobuf.StringValue.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.StringValue
             * @static
             * @param {google.protobuf.IStringValue} m StringValue message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StringValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(10).string(m.value);
                return w;
            };

            /**
             * Decodes a StringValue message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.StringValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.StringValue} StringValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StringValue.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.StringValue();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for StringValue
             * @function getTypeUrl
             * @memberof google.protobuf.StringValue
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            StringValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.StringValue";
            };

            return StringValue;
        })();

        protobuf.BoolValue = (function() {

            /**
             * Properties of a BoolValue.
             * @memberof google.protobuf
             * @interface IBoolValue
             * @property {boolean|null} [value] The bool value.
             */

            /**
             * Constructs a new BoolValue.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `bool`.
             * @implements IBoolValue
             * @constructor
             * @param {google.protobuf.IBoolValue=} [p] Properties to set
             */
            function BoolValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The bool value.
             * @member {boolean} value
             * @memberof google.protobuf.BoolValue
             * @instance
             */
            BoolValue.prototype.value = false;

            /**
             * Creates a new BoolValue instance using the specified properties.
             * @function create
             * @memberof google.protobuf.BoolValue
             * @static
             * @param {google.protobuf.IBoolValue=} [properties] Properties to set
             * @returns {google.protobuf.BoolValue} BoolValue instance
             */
            BoolValue.create = function create(properties) {
                return new BoolValue(properties);
            };

            /**
             * Encodes the specified BoolValue message. Does not implicitly {@link google.protobuf.BoolValue.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.BoolValue
             * @static
             * @param {google.protobuf.IBoolValue} m BoolValue message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BoolValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).bool(m.value);
                return w;
            };

            /**
             * Decodes a BoolValue message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.BoolValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.BoolValue} BoolValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BoolValue.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.BoolValue();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.bool();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for BoolValue
             * @function getTypeUrl
             * @memberof google.protobuf.BoolValue
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            BoolValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.BoolValue";
            };

            return BoolValue;
        })();

        protobuf.BytesValue = (function() {

            /**
             * Properties of a BytesValue.
             * @memberof google.protobuf
             * @interface IBytesValue
             * @property {Uint8Array|null} [value] The bytes value.
             */

            /**
             * Constructs a new BytesValue.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `bytes`.
             * @implements IBytesValue
             * @constructor
             * @param {google.protobuf.IBytesValue=} [p] Properties to set
             */
            function BytesValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The bytes value.
             * @member {Uint8Array} value
             * @memberof google.protobuf.BytesValue
             * @instance
             */
            BytesValue.prototype.value = $util.newBuffer([]);

            /**
             * Creates a new BytesValue instance using the specified properties.
             * @function create
             * @memberof google.protobuf.BytesValue
             * @static
             * @param {google.protobuf.IBytesValue=} [properties] Properties to set
             * @returns {google.protobuf.BytesValue} BytesValue instance
             */
            BytesValue.create = function create(properties) {
                return new BytesValue(properties);
            };

            /**
             * Encodes the specified BytesValue message. Does not implicitly {@link google.protobuf.BytesValue.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.BytesValue
             * @static
             * @param {google.protobuf.IBytesValue} m BytesValue message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BytesValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(10).bytes(m.value);
                return w;
            };

            /**
             * Decodes a BytesValue message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.BytesValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.BytesValue} BytesValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BytesValue.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.BytesValue();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.bytes();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for BytesValue
             * @function getTypeUrl
             * @memberof google.protobuf.BytesValue
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            BytesValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.BytesValue";
            };

            return BytesValue;
        })();

        protobuf.UInt64Value = (function() {

            /**
             * Properties of a UInt64Value.
             * @memberof google.protobuf
             * @interface IUInt64Value
             * @property {Long|null} [value] The uint64 value.
             */

            /**
             * Constructs a new UInt64Value.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `uint64`.
             * @implements IUInt64Value
             * @constructor
             * @param {google.protobuf.IUInt64Value=} [p] Properties to set
             */
            function UInt64Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The uint64 value.
             * @member {Long} value
             * @memberof google.protobuf.UInt64Value
             * @instance
             */
            UInt64Value.prototype.value = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new UInt64Value instance using the specified properties.
             * @function create
             * @memberof google.protobuf.UInt64Value
             * @static
             * @param {google.protobuf.IUInt64Value=} [properties] Properties to set
             * @returns {google.protobuf.UInt64Value} UInt64Value instance
             */
            UInt64Value.create = function create(properties) {
                return new UInt64Value(properties);
            };

            /**
             * Encodes the specified UInt64Value message. Does not implicitly {@link google.protobuf.UInt64Value.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.UInt64Value
             * @static
             * @param {google.protobuf.IUInt64Value} m UInt64Value message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UInt64Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).uint64(m.value);
                return w;
            };

            /**
             * Decodes a UInt64Value message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.UInt64Value
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.UInt64Value} UInt64Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UInt64Value.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.UInt64Value();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.uint64();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for UInt64Value
             * @function getTypeUrl
             * @memberof google.protobuf.UInt64Value
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UInt64Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.UInt64Value";
            };

            return UInt64Value;
        })();

        protobuf.Int32Value = (function() {

            /**
             * Properties of an Int32Value.
             * @memberof google.protobuf
             * @interface IInt32Value
             * @property {number|null} [value] The int32 value.
             */

            /**
             * Constructs a new Int32Value.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `int32`.
             * @implements IInt32Value
             * @constructor
             * @param {google.protobuf.IInt32Value=} [p] Properties to set
             */
            function Int32Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The int32 value.
             * @member {number} value
             * @memberof google.protobuf.Int32Value
             * @instance
             */
            Int32Value.prototype.value = 0;

            /**
             * Creates a new Int32Value instance using the specified properties.
             * @function create
             * @memberof google.protobuf.Int32Value
             * @static
             * @param {google.protobuf.IInt32Value=} [properties] Properties to set
             * @returns {google.protobuf.Int32Value} Int32Value instance
             */
            Int32Value.create = function create(properties) {
                return new Int32Value(properties);
            };

            /**
             * Encodes the specified Int32Value message. Does not implicitly {@link google.protobuf.Int32Value.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.Int32Value
             * @static
             * @param {google.protobuf.IInt32Value} m Int32Value message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Int32Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).int32(m.value);
                return w;
            };

            /**
             * Decodes an Int32Value message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.Int32Value
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.Int32Value} Int32Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Int32Value.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.Int32Value();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.int32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for Int32Value
             * @function getTypeUrl
             * @memberof google.protobuf.Int32Value
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Int32Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.Int32Value";
            };

            return Int32Value;
        })();

        protobuf.Int64Value = (function() {

            /**
             * Properties of an Int64Value.
             * @memberof google.protobuf
             * @interface IInt64Value
             * @property {Long|null} [value] The int64 value.
             */

            /**
             * Constructs a new Int64Value.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `int64`.
             * @implements IInt64Value
             * @constructor
             * @param {google.protobuf.IInt64Value=} [p] Properties to set
             */
            function Int64Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The int64 value.
             * @member {Long} value
             * @memberof google.protobuf.Int64Value
             * @instance
             */
            Int64Value.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new Int64Value instance using the specified properties.
             * @function create
             * @memberof google.protobuf.Int64Value
             * @static
             * @param {google.protobuf.IInt64Value=} [properties] Properties to set
             * @returns {google.protobuf.Int64Value} Int64Value instance
             */
            Int64Value.create = function create(properties) {
                return new Int64Value(properties);
            };

            /**
             * Encodes the specified Int64Value message. Does not implicitly {@link google.protobuf.Int64Value.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.Int64Value
             * @static
             * @param {google.protobuf.IInt64Value} m Int64Value message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Int64Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).int64(m.value);
                return w;
            };

            /**
             * Decodes an Int64Value message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.Int64Value
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.Int64Value} Int64Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Int64Value.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.Int64Value();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.int64();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for Int64Value
             * @function getTypeUrl
             * @memberof google.protobuf.Int64Value
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Int64Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.Int64Value";
            };

            return Int64Value;
        })();

        protobuf.FloatValue = (function() {

            /**
             * Properties of a FloatValue.
             * @memberof google.protobuf
             * @interface IFloatValue
             * @property {number|null} [value] The float value.
             */

            /**
             * Constructs a new FloatValue.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `float`.
             * @implements IFloatValue
             * @constructor
             * @param {google.protobuf.IFloatValue=} [p] Properties to set
             */
            function FloatValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The float value.
             * @member {number} value
             * @memberof google.protobuf.FloatValue
             * @instance
             */
            FloatValue.prototype.value = 0;

            /**
             * Creates a new FloatValue instance using the specified properties.
             * @function create
             * @memberof google.protobuf.FloatValue
             * @static
             * @param {google.protobuf.IFloatValue=} [properties] Properties to set
             * @returns {google.protobuf.FloatValue} FloatValue instance
             */
            FloatValue.create = function create(properties) {
                return new FloatValue(properties);
            };

            /**
             * Encodes the specified FloatValue message. Does not implicitly {@link google.protobuf.FloatValue.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.FloatValue
             * @static
             * @param {google.protobuf.IFloatValue} m FloatValue message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FloatValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(13).float(m.value);
                return w;
            };

            /**
             * Decodes a FloatValue message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.FloatValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.FloatValue} FloatValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FloatValue.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.FloatValue();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.float();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for FloatValue
             * @function getTypeUrl
             * @memberof google.protobuf.FloatValue
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FloatValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.FloatValue";
            };

            return FloatValue;
        })();

        protobuf.DoubleValue = (function() {

            /**
             * Properties of a DoubleValue.
             * @memberof google.protobuf
             * @interface IDoubleValue
             * @property {number|null} [value] The double value.
             */

            /**
             * Constructs a new DoubleValue.
             * @memberof google.protobuf
             * @classdesc Wrapper message for `double`.
             * @implements IDoubleValue
             * @constructor
             * @param {google.protobuf.IDoubleValue=} [p] Properties to set
             */
            function DoubleValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * The double value.
             * @member {number} value
             * @memberof google.protobuf.DoubleValue
             * @instance
             */
            DoubleValue.prototype.value = 0;

            /**
             * Creates a new DoubleValue instance using the specified properties.
             * @function create
             * @memberof google.protobuf.DoubleValue
             * @static
             * @param {google.protobuf.IDoubleValue=} [properties] Properties to set
             * @returns {google.protobuf.DoubleValue} DoubleValue instance
             */
            DoubleValue.create = function create(properties) {
                return new DoubleValue(properties);
            };

            /**
             * Encodes the specified DoubleValue message. Does not implicitly {@link google.protobuf.DoubleValue.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.DoubleValue
             * @static
             * @param {google.protobuf.IDoubleValue} m DoubleValue message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DoubleValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(9).double(m.value);
                return w;
            };

            /**
             * Decodes a DoubleValue message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.DoubleValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {google.protobuf.DoubleValue} DoubleValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DoubleValue.decode = function decode(r, l) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.google.protobuf.DoubleValue();
                while (r.pos < c) {
                    var t = r.uint32();
                    switch (t >>> 3) {
                    case 1: {
                            m.value = r.double();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Gets the default type url for DoubleValue
             * @function getTypeUrl
             * @memberof google.protobuf.DoubleValue
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DoubleValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.DoubleValue";
            };

            return DoubleValue;
        })();

        return protobuf;
    })();

    return google;
})();

export { $root as default };
