/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots.hashgraph_consensus_delete_topic_transaction || ($protobuf.roots.hashgraph_consensus_delete_topic_transaction = {});

export const proto = $root.proto = (() => {

    const proto = {};

    proto.Transaction = (function() {

        function Transaction(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Transaction.prototype.signedTransactionBytes = $util.newBuffer([]);

        Transaction.create = function create(properties) {
            return new Transaction(properties);
        };

        Transaction.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.signedTransactionBytes != null && Object.hasOwnProperty.call(m, "signedTransactionBytes"))
                w.uint32(42).bytes(m.signedTransactionBytes);
            return w;
        };

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

        Transaction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Transaction";
        };

        return Transaction;
    })();

    proto.TransactionBody = (function() {

        function TransactionBody(p) {
            this.maxCustomFees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TransactionBody.prototype.transactionID = null;
        TransactionBody.prototype.nodeAccountID = null;
        TransactionBody.prototype.transactionFee = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
        TransactionBody.prototype.transactionValidDuration = null;
        TransactionBody.prototype.memo = "";
        TransactionBody.prototype.batchKey = null;
        TransactionBody.prototype.consensusDeleteTopic = null;
        TransactionBody.prototype.maxCustomFees = $util.emptyArray;

        let $oneOfFields;

        Object.defineProperty(TransactionBody.prototype, "data", {
            get: $util.oneOfGetter($oneOfFields = ["consensusDeleteTopic"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        TransactionBody.create = function create(properties) {
            return new TransactionBody(properties);
        };

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
            if (m.consensusDeleteTopic != null && Object.hasOwnProperty.call(m, "consensusDeleteTopic"))
                $root.proto.ConsensusDeleteTopicTransactionBody.encode(m.consensusDeleteTopic, w.uint32(210).fork()).ldelim();
            if (m.batchKey != null && Object.hasOwnProperty.call(m, "batchKey"))
                $root.proto.Key.encode(m.batchKey, w.uint32(586).fork()).ldelim();
            if (m.maxCustomFees != null && m.maxCustomFees.length) {
                for (var i = 0; i < m.maxCustomFees.length; ++i)
                    $root.proto.CustomFeeLimit.encode(m.maxCustomFees[i], w.uint32(8010).fork()).ldelim();
            }
            return w;
        };

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
                case 26: {
                        m.consensusDeleteTopic = $root.proto.ConsensusDeleteTopicTransactionBody.decode(r, r.uint32());
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

        TransactionBody.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionBody";
        };

        return TransactionBody;
    })();

    proto.TransactionList = (function() {

        function TransactionList(p) {
            this.transactionList = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TransactionList.prototype.transactionList = $util.emptyArray;

        TransactionList.create = function create(properties) {
            return new TransactionList(properties);
        };

        TransactionList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.transactionList != null && m.transactionList.length) {
                for (var i = 0; i < m.transactionList.length; ++i)
                    $root.proto.Transaction.encode(m.transactionList[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        TransactionList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionList";
        };

        return TransactionList;
    })();

    proto.ConsensusDeleteTopicTransactionBody = (function() {

        function ConsensusDeleteTopicTransactionBody(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ConsensusDeleteTopicTransactionBody.prototype.topicID = null;

        ConsensusDeleteTopicTransactionBody.create = function create(properties) {
            return new ConsensusDeleteTopicTransactionBody(properties);
        };

        ConsensusDeleteTopicTransactionBody.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.topicID != null && Object.hasOwnProperty.call(m, "topicID"))
                $root.proto.TopicID.encode(m.topicID, w.uint32(10).fork()).ldelim();
            return w;
        };

        ConsensusDeleteTopicTransactionBody.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.ConsensusDeleteTopicTransactionBody();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.topicID = $root.proto.TopicID.decode(r, r.uint32());
                        break;
                    }
                default:
                    r.skipType(t & 7);
                    break;
                }
            }
            return m;
        };

        ConsensusDeleteTopicTransactionBody.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ConsensusDeleteTopicTransactionBody";
        };

        return ConsensusDeleteTopicTransactionBody;
    })();

    proto.ShardID = (function() {

        function ShardID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ShardID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        ShardID.create = function create(properties) {
            return new ShardID(properties);
        };

        ShardID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            return w;
        };

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

        ShardID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ShardID";
        };

        return ShardID;
    })();

    proto.RealmID = (function() {

        function RealmID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        RealmID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        RealmID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        RealmID.create = function create(properties) {
            return new RealmID(properties);
        };

        RealmID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.shardNum != null && Object.hasOwnProperty.call(m, "shardNum"))
                w.uint32(8).int64(m.shardNum);
            if (m.realmNum != null && Object.hasOwnProperty.call(m, "realmNum"))
                w.uint32(16).int64(m.realmNum);
            return w;
        };

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

        RealmID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.RealmID";
        };

        return RealmID;
    })();

    proto.TokenID = (function() {

        function TokenID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TokenID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        TokenID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        TokenID.prototype.tokenNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        TokenID.create = function create(properties) {
            return new TokenID(properties);
        };

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

        TokenID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenID";
        };

        return TokenID;
    })();

    proto.BlockHashAlgorithm = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "SHA2_384"] = 0;
        return values;
    })();

    proto.AccountID = (function() {

        function AccountID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        AccountID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        AccountID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        AccountID.prototype.accountNum = null;
        AccountID.prototype.alias = null;

        let $oneOfFields;

        Object.defineProperty(AccountID.prototype, "account", {
            get: $util.oneOfGetter($oneOfFields = ["accountNum", "alias"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        AccountID.create = function create(properties) {
            return new AccountID(properties);
        };

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

        AccountID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.AccountID";
        };

        return AccountID;
    })();

    proto.NftID = (function() {

        function NftID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        NftID.prototype.token_ID = null;
        NftID.prototype.serialNumber = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        NftID.create = function create(properties) {
            return new NftID(properties);
        };

        NftID.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.token_ID != null && Object.hasOwnProperty.call(m, "token_ID"))
                $root.proto.TokenID.encode(m.token_ID, w.uint32(10).fork()).ldelim();
            if (m.serialNumber != null && Object.hasOwnProperty.call(m, "serialNumber"))
                w.uint32(16).int64(m.serialNumber);
            return w;
        };

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

        NftID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NftID";
        };

        return NftID;
    })();

    proto.FileID = (function() {

        function FileID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FileID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FileID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FileID.prototype.fileNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        FileID.create = function create(properties) {
            return new FileID(properties);
        };

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

        FileID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FileID";
        };

        return FileID;
    })();

    proto.ContractID = (function() {

        function ContractID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ContractID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        ContractID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        ContractID.prototype.contractNum = null;
        ContractID.prototype.evmAddress = null;

        let $oneOfFields;

        Object.defineProperty(ContractID.prototype, "contract", {
            get: $util.oneOfGetter($oneOfFields = ["contractNum", "evmAddress"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        ContractID.create = function create(properties) {
            return new ContractID(properties);
        };

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

        ContractID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ContractID";
        };

        return ContractID;
    })();

    proto.TopicID = (function() {

        function TopicID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TopicID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        TopicID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        TopicID.prototype.topicNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        TopicID.create = function create(properties) {
            return new TopicID(properties);
        };

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

        TopicID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TopicID";
        };

        return TopicID;
    })();

    proto.ScheduleID = (function() {

        function ScheduleID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ScheduleID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        ScheduleID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        ScheduleID.prototype.scheduleNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        ScheduleID.create = function create(properties) {
            return new ScheduleID(properties);
        };

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

        ScheduleID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ScheduleID";
        };

        return ScheduleID;
    })();

    proto.TransactionID = (function() {

        function TransactionID(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TransactionID.prototype.transactionValidStart = null;
        TransactionID.prototype.accountID = null;
        TransactionID.prototype.scheduled = false;
        TransactionID.prototype.nonce = 0;

        TransactionID.create = function create(properties) {
            return new TransactionID(properties);
        };

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

        TransactionID.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionID";
        };

        return TransactionID;
    })();

    proto.AccountAmount = (function() {

        function AccountAmount(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        AccountAmount.prototype.accountID = null;
        AccountAmount.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        AccountAmount.prototype.isApproval = false;

        AccountAmount.create = function create(properties) {
            return new AccountAmount(properties);
        };

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

        AccountAmount.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.AccountAmount";
        };

        return AccountAmount;
    })();

    proto.TransferList = (function() {

        function TransferList(p) {
            this.accountAmounts = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TransferList.prototype.accountAmounts = $util.emptyArray;

        TransferList.create = function create(properties) {
            return new TransferList(properties);
        };

        TransferList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.accountAmounts != null && m.accountAmounts.length) {
                for (var i = 0; i < m.accountAmounts.length; ++i)
                    $root.proto.AccountAmount.encode(m.accountAmounts[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        TransferList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransferList";
        };

        return TransferList;
    })();

    proto.NftTransfer = (function() {

        function NftTransfer(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        NftTransfer.prototype.senderAccountID = null;
        NftTransfer.prototype.receiverAccountID = null;
        NftTransfer.prototype.serialNumber = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        NftTransfer.prototype.isApproval = false;

        NftTransfer.create = function create(properties) {
            return new NftTransfer(properties);
        };

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

        NftTransfer.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NftTransfer";
        };

        return NftTransfer;
    })();

    proto.TokenTransferList = (function() {

        function TokenTransferList(p) {
            this.transfers = [];
            this.nftTransfers = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TokenTransferList.prototype.token = null;
        TokenTransferList.prototype.transfers = $util.emptyArray;
        TokenTransferList.prototype.nftTransfers = $util.emptyArray;
        TokenTransferList.prototype.expectedDecimals = null;

        TokenTransferList.create = function create(properties) {
            return new TokenTransferList(properties);
        };

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

        TokenTransferList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenTransferList";
        };

        return TokenTransferList;
    })();

    proto.Fraction = (function() {

        function Fraction(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Fraction.prototype.numerator = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        Fraction.prototype.denominator = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        Fraction.create = function create(properties) {
            return new Fraction(properties);
        };

        Fraction.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.numerator != null && Object.hasOwnProperty.call(m, "numerator"))
                w.uint32(8).int64(m.numerator);
            if (m.denominator != null && Object.hasOwnProperty.call(m, "denominator"))
                w.uint32(16).int64(m.denominator);
            return w;
        };

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

        Fraction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Fraction";
        };

        return Fraction;
    })();

    proto.TokenType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FUNGIBLE_COMMON"] = 0;
        values[valuesById[1] = "NON_FUNGIBLE_UNIQUE"] = 1;
        return values;
    })();

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

    proto.TokenSupplyType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "INFINITE"] = 0;
        values[valuesById[1] = "FINITE"] = 1;
        return values;
    })();

    proto.TokenKeyValidation = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FULL_VALIDATION"] = 0;
        values[valuesById[1] = "NO_VALIDATION"] = 1;
        return values;
    })();

    proto.TokenFreezeStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FreezeNotApplicable"] = 0;
        values[valuesById[1] = "Frozen"] = 1;
        values[valuesById[2] = "Unfrozen"] = 2;
        return values;
    })();

    proto.TokenKycStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "KycNotApplicable"] = 0;
        values[valuesById[1] = "Granted"] = 1;
        values[valuesById[2] = "Revoked"] = 2;
        return values;
    })();

    proto.TokenPauseStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "PauseNotApplicable"] = 0;
        values[valuesById[1] = "Paused"] = 1;
        values[valuesById[2] = "Unpaused"] = 2;
        return values;
    })();

    proto.Key = (function() {

        function Key(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Key.prototype.contractID = null;
        Key.prototype.ed25519 = null;
        Key.prototype.RSA_3072 = null;
        Key.prototype.ECDSA_384 = null;
        Key.prototype.thresholdKey = null;
        Key.prototype.keyList = null;
        Key.prototype.ECDSASecp256k1 = null;
        Key.prototype.delegatableContractId = null;

        let $oneOfFields;

        Object.defineProperty(Key.prototype, "key", {
            get: $util.oneOfGetter($oneOfFields = ["contractID", "ed25519", "RSA_3072", "ECDSA_384", "thresholdKey", "keyList", "ECDSASecp256k1", "delegatableContractId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Key.create = function create(properties) {
            return new Key(properties);
        };

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

        Key.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Key";
        };

        return Key;
    })();

    proto.ThresholdKey = (function() {

        function ThresholdKey(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ThresholdKey.prototype.threshold = 0;
        ThresholdKey.prototype.keys = null;

        ThresholdKey.create = function create(properties) {
            return new ThresholdKey(properties);
        };

        ThresholdKey.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.threshold != null && Object.hasOwnProperty.call(m, "threshold"))
                w.uint32(8).uint32(m.threshold);
            if (m.keys != null && Object.hasOwnProperty.call(m, "keys"))
                $root.proto.KeyList.encode(m.keys, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        ThresholdKey.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ThresholdKey";
        };

        return ThresholdKey;
    })();

    proto.KeyList = (function() {

        function KeyList(p) {
            this.keys = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        KeyList.prototype.keys = $util.emptyArray;

        KeyList.create = function create(properties) {
            return new KeyList(properties);
        };

        KeyList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.keys != null && m.keys.length) {
                for (var i = 0; i < m.keys.length; ++i)
                    $root.proto.Key.encode(m.keys[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        KeyList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.KeyList";
        };

        return KeyList;
    })();

    proto.Signature = (function() {

        function Signature(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Signature.prototype.contract = null;
        Signature.prototype.ed25519 = null;
        Signature.prototype.RSA_3072 = null;
        Signature.prototype.ECDSA_384 = null;
        Signature.prototype.thresholdSignature = null;
        Signature.prototype.signatureList = null;

        let $oneOfFields;

        Object.defineProperty(Signature.prototype, "signature", {
            get: $util.oneOfGetter($oneOfFields = ["contract", "ed25519", "RSA_3072", "ECDSA_384", "thresholdSignature", "signatureList"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        Signature.create = function create(properties) {
            return new Signature(properties);
        };

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

        Signature.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Signature";
        };

        return Signature;
    })();

    proto.ThresholdSignature = (function() {

        function ThresholdSignature(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ThresholdSignature.prototype.sigs = null;

        ThresholdSignature.create = function create(properties) {
            return new ThresholdSignature(properties);
        };

        ThresholdSignature.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.sigs != null && Object.hasOwnProperty.call(m, "sigs"))
                $root.proto.SignatureList.encode(m.sigs, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        ThresholdSignature.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ThresholdSignature";
        };

        return ThresholdSignature;
    })();

    proto.SignatureList = (function() {

        function SignatureList(p) {
            this.sigs = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        SignatureList.prototype.sigs = $util.emptyArray;

        SignatureList.create = function create(properties) {
            return new SignatureList(properties);
        };

        SignatureList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.sigs != null && m.sigs.length) {
                for (var i = 0; i < m.sigs.length; ++i)
                    $root.proto.Signature.encode(m.sigs[i], w.uint32(18).fork()).ldelim();
            }
            return w;
        };

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

        SignatureList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SignatureList";
        };

        return SignatureList;
    })();

    proto.SignaturePair = (function() {

        function SignaturePair(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        SignaturePair.prototype.pubKeyPrefix = $util.newBuffer([]);
        SignaturePair.prototype.contract = null;
        SignaturePair.prototype.ed25519 = null;
        SignaturePair.prototype.RSA_3072 = null;
        SignaturePair.prototype.ECDSA_384 = null;
        SignaturePair.prototype.ECDSASecp256k1 = null;

        let $oneOfFields;

        Object.defineProperty(SignaturePair.prototype, "signature", {
            get: $util.oneOfGetter($oneOfFields = ["contract", "ed25519", "RSA_3072", "ECDSA_384", "ECDSASecp256k1"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        SignaturePair.create = function create(properties) {
            return new SignaturePair(properties);
        };

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

        SignaturePair.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SignaturePair";
        };

        return SignaturePair;
    })();

    proto.SignatureMap = (function() {

        function SignatureMap(p) {
            this.sigPair = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        SignatureMap.prototype.sigPair = $util.emptyArray;

        SignatureMap.create = function create(properties) {
            return new SignatureMap(properties);
        };

        SignatureMap.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.sigPair != null && m.sigPair.length) {
                for (var i = 0; i < m.sigPair.length; ++i)
                    $root.proto.SignaturePair.encode(m.sigPair[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        SignatureMap.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SignatureMap";
        };

        return SignatureMap;
    })();

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

        function FeeComponents(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FeeComponents.prototype.min = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.max = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.constant = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.bpt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.vpt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.rbh = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.sbh = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.gas = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.tv = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.bpr = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FeeComponents.prototype.sbpr = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        FeeComponents.create = function create(properties) {
            return new FeeComponents(properties);
        };

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

        FeeComponents.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeComponents";
        };

        return FeeComponents;
    })();

    proto.TransactionFeeSchedule = (function() {

        function TransactionFeeSchedule(p) {
            this.fees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TransactionFeeSchedule.prototype.hederaFunctionality = 0;
        TransactionFeeSchedule.prototype.feeData = null;
        TransactionFeeSchedule.prototype.fees = $util.emptyArray;

        TransactionFeeSchedule.create = function create(properties) {
            return new TransactionFeeSchedule(properties);
        };

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

        TransactionFeeSchedule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionFeeSchedule";
        };

        return TransactionFeeSchedule;
    })();

    proto.FeeData = (function() {

        function FeeData(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FeeData.prototype.nodedata = null;
        FeeData.prototype.networkdata = null;
        FeeData.prototype.servicedata = null;
        FeeData.prototype.subType = 0;

        FeeData.create = function create(properties) {
            return new FeeData(properties);
        };

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

        FeeData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeData";
        };

        return FeeData;
    })();

    proto.FeeSchedule = (function() {

        function FeeSchedule(p) {
            this.transactionFeeSchedule = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FeeSchedule.prototype.transactionFeeSchedule = $util.emptyArray;
        FeeSchedule.prototype.expiryTime = null;

        FeeSchedule.create = function create(properties) {
            return new FeeSchedule(properties);
        };

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

        FeeSchedule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeSchedule";
        };

        return FeeSchedule;
    })();

    proto.CurrentAndNextFeeSchedule = (function() {

        function CurrentAndNextFeeSchedule(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        CurrentAndNextFeeSchedule.prototype.currentFeeSchedule = null;
        CurrentAndNextFeeSchedule.prototype.nextFeeSchedule = null;

        CurrentAndNextFeeSchedule.create = function create(properties) {
            return new CurrentAndNextFeeSchedule(properties);
        };

        CurrentAndNextFeeSchedule.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.currentFeeSchedule != null && Object.hasOwnProperty.call(m, "currentFeeSchedule"))
                $root.proto.FeeSchedule.encode(m.currentFeeSchedule, w.uint32(10).fork()).ldelim();
            if (m.nextFeeSchedule != null && Object.hasOwnProperty.call(m, "nextFeeSchedule"))
                $root.proto.FeeSchedule.encode(m.nextFeeSchedule, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        CurrentAndNextFeeSchedule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.CurrentAndNextFeeSchedule";
        };

        return CurrentAndNextFeeSchedule;
    })();

    proto.ServiceEndpoint = (function() {

        function ServiceEndpoint(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ServiceEndpoint.prototype.ipAddressV4 = $util.newBuffer([]);
        ServiceEndpoint.prototype.port = 0;
        ServiceEndpoint.prototype.domainName = "";

        ServiceEndpoint.create = function create(properties) {
            return new ServiceEndpoint(properties);
        };

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

        ServiceEndpoint.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ServiceEndpoint";
        };

        return ServiceEndpoint;
    })();

    proto.NodeAddress = (function() {

        function NodeAddress(p) {
            this.serviceEndpoint = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        NodeAddress.prototype.ipAddress = $util.newBuffer([]);
        NodeAddress.prototype.portno = 0;
        NodeAddress.prototype.memo = $util.newBuffer([]);
        NodeAddress.prototype.RSA_PubKey = "";
        NodeAddress.prototype.nodeId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        NodeAddress.prototype.nodeAccountId = null;
        NodeAddress.prototype.nodeCertHash = $util.newBuffer([]);
        NodeAddress.prototype.serviceEndpoint = $util.emptyArray;
        NodeAddress.prototype.description = "";
        NodeAddress.prototype.stake = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        NodeAddress.create = function create(properties) {
            return new NodeAddress(properties);
        };

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

        NodeAddress.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NodeAddress";
        };

        return NodeAddress;
    })();

    proto.NodeAddressBook = (function() {

        function NodeAddressBook(p) {
            this.nodeAddress = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        NodeAddressBook.prototype.nodeAddress = $util.emptyArray;

        NodeAddressBook.create = function create(properties) {
            return new NodeAddressBook(properties);
        };

        NodeAddressBook.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.nodeAddress != null && m.nodeAddress.length) {
                for (var i = 0; i < m.nodeAddress.length; ++i)
                    $root.proto.NodeAddress.encode(m.nodeAddress[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        NodeAddressBook.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.NodeAddressBook";
        };

        return NodeAddressBook;
    })();

    proto.SemanticVersion = (function() {

        function SemanticVersion(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        SemanticVersion.prototype.major = 0;
        SemanticVersion.prototype.minor = 0;
        SemanticVersion.prototype.patch = 0;
        SemanticVersion.prototype.pre = "";
        SemanticVersion.prototype.build = "";

        SemanticVersion.create = function create(properties) {
            return new SemanticVersion(properties);
        };

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

        SemanticVersion.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.SemanticVersion";
        };

        return SemanticVersion;
    })();

    proto.Setting = (function() {

        function Setting(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Setting.prototype.name = "";
        Setting.prototype.value = "";
        Setting.prototype.data = $util.newBuffer([]);

        Setting.create = function create(properties) {
            return new Setting(properties);
        };

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

        Setting.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Setting";
        };

        return Setting;
    })();

    proto.ServicesConfigurationList = (function() {

        function ServicesConfigurationList(p) {
            this.nameValue = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        ServicesConfigurationList.prototype.nameValue = $util.emptyArray;

        ServicesConfigurationList.create = function create(properties) {
            return new ServicesConfigurationList(properties);
        };

        ServicesConfigurationList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.nameValue != null && m.nameValue.length) {
                for (var i = 0; i < m.nameValue.length; ++i)
                    $root.proto.Setting.encode(m.nameValue[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        ServicesConfigurationList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ServicesConfigurationList";
        };

        return ServicesConfigurationList;
    })();

    proto.TokenRelationship = (function() {

        function TokenRelationship(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TokenRelationship.prototype.tokenId = null;
        TokenRelationship.prototype.symbol = "";
        TokenRelationship.prototype.balance = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
        TokenRelationship.prototype.kycStatus = 0;
        TokenRelationship.prototype.freezeStatus = 0;
        TokenRelationship.prototype.decimals = 0;
        TokenRelationship.prototype.automaticAssociation = false;

        TokenRelationship.create = function create(properties) {
            return new TokenRelationship(properties);
        };

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

        TokenRelationship.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenRelationship";
        };

        return TokenRelationship;
    })();

    proto.TokenBalance = (function() {

        function TokenBalance(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TokenBalance.prototype.tokenId = null;
        TokenBalance.prototype.balance = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
        TokenBalance.prototype.decimals = 0;

        TokenBalance.create = function create(properties) {
            return new TokenBalance(properties);
        };

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

        TokenBalance.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenBalance";
        };

        return TokenBalance;
    })();

    proto.TokenBalances = (function() {

        function TokenBalances(p) {
            this.tokenBalances = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TokenBalances.prototype.tokenBalances = $util.emptyArray;

        TokenBalances.create = function create(properties) {
            return new TokenBalances(properties);
        };

        TokenBalances.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.tokenBalances != null && m.tokenBalances.length) {
                for (var i = 0; i < m.tokenBalances.length; ++i)
                    $root.proto.TokenBalance.encode(m.tokenBalances[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        TokenBalances.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenBalances";
        };

        return TokenBalances;
    })();

    proto.TokenAssociation = (function() {

        function TokenAssociation(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TokenAssociation.prototype.tokenId = null;
        TokenAssociation.prototype.accountId = null;

        TokenAssociation.create = function create(properties) {
            return new TokenAssociation(properties);
        };

        TokenAssociation.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.tokenId != null && Object.hasOwnProperty.call(m, "tokenId"))
                $root.proto.TokenID.encode(m.tokenId, w.uint32(10).fork()).ldelim();
            if (m.accountId != null && Object.hasOwnProperty.call(m, "accountId"))
                $root.proto.AccountID.encode(m.accountId, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        TokenAssociation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TokenAssociation";
        };

        return TokenAssociation;
    })();

    proto.StakingInfo = (function() {

        function StakingInfo(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        StakingInfo.prototype.declineReward = false;
        StakingInfo.prototype.stakePeriodStart = null;
        StakingInfo.prototype.pendingReward = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        StakingInfo.prototype.stakedToMe = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        StakingInfo.prototype.stakedAccountId = null;
        StakingInfo.prototype.stakedNodeId = null;

        let $oneOfFields;

        Object.defineProperty(StakingInfo.prototype, "stakedId", {
            get: $util.oneOfGetter($oneOfFields = ["stakedAccountId", "stakedNodeId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        StakingInfo.create = function create(properties) {
            return new StakingInfo(properties);
        };

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

        StakingInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.StakingInfo";
        };

        return StakingInfo;
    })();

    proto.PendingAirdropId = (function() {

        function PendingAirdropId(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        PendingAirdropId.prototype.senderId = null;
        PendingAirdropId.prototype.receiverId = null;
        PendingAirdropId.prototype.fungibleTokenType = null;
        PendingAirdropId.prototype.nonFungibleToken = null;

        let $oneOfFields;

        Object.defineProperty(PendingAirdropId.prototype, "tokenReference", {
            get: $util.oneOfGetter($oneOfFields = ["fungibleTokenType", "nonFungibleToken"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        PendingAirdropId.create = function create(properties) {
            return new PendingAirdropId(properties);
        };

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

        PendingAirdropId.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.PendingAirdropId";
        };

        return PendingAirdropId;
    })();

    proto.PendingAirdropValue = (function() {

        function PendingAirdropValue(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        PendingAirdropValue.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        PendingAirdropValue.create = function create(properties) {
            return new PendingAirdropValue(properties);
        };

        PendingAirdropValue.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(8).uint64(m.amount);
            return w;
        };

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

        PendingAirdropValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.PendingAirdropValue";
        };

        return PendingAirdropValue;
    })();

    proto.Duration = (function() {

        function Duration(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Duration.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        Duration.create = function create(properties) {
            return new Duration(properties);
        };

        Duration.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.seconds != null && Object.hasOwnProperty.call(m, "seconds"))
                w.uint32(8).int64(m.seconds);
            return w;
        };

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

        Duration.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Duration";
        };

        return Duration;
    })();

    proto.FractionalFee = (function() {

        function FractionalFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FractionalFee.prototype.fractionalAmount = null;
        FractionalFee.prototype.minimumAmount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FractionalFee.prototype.maximumAmount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FractionalFee.prototype.netOfTransfers = false;

        FractionalFee.create = function create(properties) {
            return new FractionalFee(properties);
        };

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

        FractionalFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FractionalFee";
        };

        return FractionalFee;
    })();

    proto.FixedFee = (function() {

        function FixedFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FixedFee.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        FixedFee.prototype.denominatingTokenId = null;

        FixedFee.create = function create(properties) {
            return new FixedFee(properties);
        };

        FixedFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.amount != null && Object.hasOwnProperty.call(m, "amount"))
                w.uint32(8).int64(m.amount);
            if (m.denominatingTokenId != null && Object.hasOwnProperty.call(m, "denominatingTokenId"))
                $root.proto.TokenID.encode(m.denominatingTokenId, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        FixedFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FixedFee";
        };

        return FixedFee;
    })();

    proto.RoyaltyFee = (function() {

        function RoyaltyFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        RoyaltyFee.prototype.exchangeValueFraction = null;
        RoyaltyFee.prototype.fallbackFee = null;

        RoyaltyFee.create = function create(properties) {
            return new RoyaltyFee(properties);
        };

        RoyaltyFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.exchangeValueFraction != null && Object.hasOwnProperty.call(m, "exchangeValueFraction"))
                $root.proto.Fraction.encode(m.exchangeValueFraction, w.uint32(10).fork()).ldelim();
            if (m.fallbackFee != null && Object.hasOwnProperty.call(m, "fallbackFee"))
                $root.proto.FixedFee.encode(m.fallbackFee, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        RoyaltyFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.RoyaltyFee";
        };

        return RoyaltyFee;
    })();

    proto.CustomFee = (function() {

        function CustomFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        CustomFee.prototype.fixedFee = null;
        CustomFee.prototype.fractionalFee = null;
        CustomFee.prototype.royaltyFee = null;
        CustomFee.prototype.feeCollectorAccountId = null;
        CustomFee.prototype.allCollectorsAreExempt = false;

        let $oneOfFields;

        Object.defineProperty(CustomFee.prototype, "fee", {
            get: $util.oneOfGetter($oneOfFields = ["fixedFee", "fractionalFee", "royaltyFee"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        CustomFee.create = function create(properties) {
            return new CustomFee(properties);
        };

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

        CustomFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.CustomFee";
        };

        return CustomFee;
    })();

    proto.AssessedCustomFee = (function() {

        function AssessedCustomFee(p) {
            this.effectivePayerAccountId = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        AssessedCustomFee.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        AssessedCustomFee.prototype.tokenId = null;
        AssessedCustomFee.prototype.feeCollectorAccountId = null;
        AssessedCustomFee.prototype.effectivePayerAccountId = $util.emptyArray;

        AssessedCustomFee.create = function create(properties) {
            return new AssessedCustomFee(properties);
        };

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

        AssessedCustomFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.AssessedCustomFee";
        };

        return AssessedCustomFee;
    })();

    proto.FixedCustomFee = (function() {

        function FixedCustomFee(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FixedCustomFee.prototype.fixedFee = null;
        FixedCustomFee.prototype.feeCollectorAccountId = null;

        FixedCustomFee.create = function create(properties) {
            return new FixedCustomFee(properties);
        };

        FixedCustomFee.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.fixedFee != null && Object.hasOwnProperty.call(m, "fixedFee"))
                $root.proto.FixedFee.encode(m.fixedFee, w.uint32(10).fork()).ldelim();
            if (m.feeCollectorAccountId != null && Object.hasOwnProperty.call(m, "feeCollectorAccountId"))
                $root.proto.AccountID.encode(m.feeCollectorAccountId, w.uint32(18).fork()).ldelim();
            return w;
        };

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

        FixedCustomFee.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FixedCustomFee";
        };

        return FixedCustomFee;
    })();

    proto.FixedCustomFeeList = (function() {

        function FixedCustomFeeList(p) {
            this.fees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FixedCustomFeeList.prototype.fees = $util.emptyArray;

        FixedCustomFeeList.create = function create(properties) {
            return new FixedCustomFeeList(properties);
        };

        FixedCustomFeeList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.fees != null && m.fees.length) {
                for (var i = 0; i < m.fees.length; ++i)
                    $root.proto.FixedCustomFee.encode(m.fees[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        FixedCustomFeeList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FixedCustomFeeList";
        };

        return FixedCustomFeeList;
    })();

    proto.FeeExemptKeyList = (function() {

        function FeeExemptKeyList(p) {
            this.keys = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        FeeExemptKeyList.prototype.keys = $util.emptyArray;

        FeeExemptKeyList.create = function create(properties) {
            return new FeeExemptKeyList(properties);
        };

        FeeExemptKeyList.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.keys != null && m.keys.length) {
                for (var i = 0; i < m.keys.length; ++i)
                    $root.proto.Key.encode(m.keys[i], w.uint32(10).fork()).ldelim();
            }
            return w;
        };

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

        FeeExemptKeyList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.FeeExemptKeyList";
        };

        return FeeExemptKeyList;
    })();

    proto.CustomFeeLimit = (function() {

        function CustomFeeLimit(p) {
            this.fees = [];
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        CustomFeeLimit.prototype.accountId = null;
        CustomFeeLimit.prototype.fees = $util.emptyArray;

        CustomFeeLimit.create = function create(properties) {
            return new CustomFeeLimit(properties);
        };

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

        CustomFeeLimit.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.CustomFeeLimit";
        };

        return CustomFeeLimit;
    })();

    proto.Timestamp = (function() {

        function Timestamp(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Timestamp.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
        Timestamp.prototype.nanos = 0;

        Timestamp.create = function create(properties) {
            return new Timestamp(properties);
        };

        Timestamp.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.seconds != null && Object.hasOwnProperty.call(m, "seconds"))
                w.uint32(8).int64(m.seconds);
            if (m.nanos != null && Object.hasOwnProperty.call(m, "nanos"))
                w.uint32(16).int32(m.nanos);
            return w;
        };

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

        Timestamp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Timestamp";
        };

        return Timestamp;
    })();

    proto.TimestampSeconds = (function() {

        function TimestampSeconds(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        TimestampSeconds.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        TimestampSeconds.create = function create(properties) {
            return new TimestampSeconds(properties);
        };

        TimestampSeconds.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.seconds != null && Object.hasOwnProperty.call(m, "seconds"))
                w.uint32(8).int64(m.seconds);
            return w;
        };

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

    const google = {};

    google.protobuf = (function() {

        const protobuf = {};

        protobuf.UInt32Value = (function() {

            function UInt32Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            UInt32Value.prototype.value = 0;

            UInt32Value.create = function create(properties) {
                return new UInt32Value(properties);
            };

            UInt32Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).uint32(m.value);
                return w;
            };

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

            UInt32Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.UInt32Value";
            };

            return UInt32Value;
        })();

        protobuf.StringValue = (function() {

            function StringValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            StringValue.prototype.value = "";

            StringValue.create = function create(properties) {
                return new StringValue(properties);
            };

            StringValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(10).string(m.value);
                return w;
            };

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

            StringValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.StringValue";
            };

            return StringValue;
        })();

        protobuf.BoolValue = (function() {

            function BoolValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            BoolValue.prototype.value = false;

            BoolValue.create = function create(properties) {
                return new BoolValue(properties);
            };

            BoolValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).bool(m.value);
                return w;
            };

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

            BoolValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.BoolValue";
            };

            return BoolValue;
        })();

        protobuf.BytesValue = (function() {

            function BytesValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            BytesValue.prototype.value = $util.newBuffer([]);

            BytesValue.create = function create(properties) {
                return new BytesValue(properties);
            };

            BytesValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(10).bytes(m.value);
                return w;
            };

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

            BytesValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.BytesValue";
            };

            return BytesValue;
        })();

        protobuf.UInt64Value = (function() {

            function UInt64Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            UInt64Value.prototype.value = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            UInt64Value.create = function create(properties) {
                return new UInt64Value(properties);
            };

            UInt64Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).uint64(m.value);
                return w;
            };

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

            UInt64Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.UInt64Value";
            };

            return UInt64Value;
        })();

        protobuf.Int32Value = (function() {

            function Int32Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            Int32Value.prototype.value = 0;

            Int32Value.create = function create(properties) {
                return new Int32Value(properties);
            };

            Int32Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).int32(m.value);
                return w;
            };

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

            Int32Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.Int32Value";
            };

            return Int32Value;
        })();

        protobuf.Int64Value = (function() {

            function Int64Value(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            Int64Value.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            Int64Value.create = function create(properties) {
                return new Int64Value(properties);
            };

            Int64Value.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(8).int64(m.value);
                return w;
            };

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

            Int64Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.Int64Value";
            };

            return Int64Value;
        })();

        protobuf.FloatValue = (function() {

            function FloatValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            FloatValue.prototype.value = 0;

            FloatValue.create = function create(properties) {
                return new FloatValue(properties);
            };

            FloatValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(13).float(m.value);
                return w;
            };

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

            FloatValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/google.protobuf.FloatValue";
            };

            return FloatValue;
        })();

        protobuf.DoubleValue = (function() {

            function DoubleValue(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            DoubleValue.prototype.value = 0;

            DoubleValue.create = function create(properties) {
                return new DoubleValue(properties);
            };

            DoubleValue.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.value != null && Object.hasOwnProperty.call(m, "value"))
                    w.uint32(9).double(m.value);
                return w;
            };

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
