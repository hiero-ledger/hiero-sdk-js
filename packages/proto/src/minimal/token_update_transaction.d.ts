import * as $protobuf from "protobufjs";
import Long = require("long");
export = hashgraph;

declare namespace hashgraph {


    /** Namespace proto. */
    namespace proto {

        /** Properties of a Transaction. */
        interface ITransaction {

            /** A valid, serialized, `SignedTransaction` message. */
            signedTransactionBytes?: (Uint8Array|null);
        }

        /** A wrapper around signed transaction bytes for token updates. */
        class Transaction implements ITransaction {

            /**
             * Constructs a new Transaction.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITransaction);

            /** A valid, serialized, `SignedTransaction` message. */
            public signedTransactionBytes: Uint8Array;

            /**
             * Creates a new Transaction instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Transaction instance
             */
            public static create(properties?: proto.ITransaction): proto.Transaction;

            /**
             * Encodes the specified Transaction message. Does not implicitly {@link proto.Transaction.verify|verify} messages.
             * @param m Transaction message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITransaction, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Transaction message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Transaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Transaction;

            /**
             * Gets the default type url for Transaction
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TransactionBody. */
        interface ITransactionBody {

            /** A transaction identifier. */
            transactionID?: (proto.ITransactionID|null);

            /** A node account identifier. */
            nodeAccountID?: (proto.IAccountID|null);

            /** A maximum transaction fee, in tinybar. */
            transactionFee?: (Long|null);

            /** A maximum duration in which to execute this transaction. */
            transactionValidDuration?: (proto.IDuration|null);

            /** A short description for this transaction. */
            memo?: (string|null);

            /** The public key of the trusted batch assembler. */
            batchKey?: (proto.IKey|null);

            /** Update an Hedera token. */
            tokenUpdate?: (proto.ITokenUpdateTransactionBody|null);

            /** A list of maximum custom fees that the users are willing to pay. */
            maxCustomFees?: (proto.ICustomFeeLimit[]|null);
        }

        /** A transaction body for token updates. */
        class TransactionBody implements ITransactionBody {

            /**
             * Constructs a new TransactionBody.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITransactionBody);

            /** A transaction identifier. */
            public transactionID?: (proto.ITransactionID|null);

            /** A node account identifier. */
            public nodeAccountID?: (proto.IAccountID|null);

            /** A maximum transaction fee, in tinybar. */
            public transactionFee: Long;

            /** A maximum duration in which to execute this transaction. */
            public transactionValidDuration?: (proto.IDuration|null);

            /** A short description for this transaction. */
            public memo: string;

            /** The public key of the trusted batch assembler. */
            public batchKey?: (proto.IKey|null);

            /** Update an Hedera token. */
            public tokenUpdate?: (proto.ITokenUpdateTransactionBody|null);

            /** A list of maximum custom fees that the users are willing to pay. */
            public maxCustomFees: proto.ICustomFeeLimit[];

            /** TransactionBody data. */
            public data?: "tokenUpdate";

            /**
             * Creates a new TransactionBody instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransactionBody instance
             */
            public static create(properties?: proto.ITransactionBody): proto.TransactionBody;

            /**
             * Encodes the specified TransactionBody message. Does not implicitly {@link proto.TransactionBody.verify|verify} messages.
             * @param m TransactionBody message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITransactionBody, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransactionBody message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TransactionBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TransactionBody;

            /**
             * Gets the default type url for TransactionBody
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenUpdateTransactionBody. */
        interface ITokenUpdateTransactionBody {

            /** The Token to be updated. */
            token?: (proto.ITokenID|null);

            /** The new publicly visible token symbol. */
            symbol?: (string|null);

            /** The new publicly visible name of the token. */
            name?: (string|null);

            /** The new Treasury account of the Token. */
            treasury?: (proto.IAccountID|null);

            /** The new admin key of the Token. */
            adminKey?: (proto.IKey|null);

            /** The new KYC key of the Token. */
            kycKey?: (proto.IKey|null);

            /** The new Freeze key of the Token. */
            freezeKey?: (proto.IKey|null);

            /** The new Wipe key of the Token. */
            wipeKey?: (proto.IKey|null);

            /** The new Supply key of the Token. */
            supplyKey?: (proto.IKey|null);

            /** The new account which will be automatically charged to renew the token's expiration. */
            autoRenewAccount?: (proto.IAccountID|null);

            /** The new interval at which the auto-renew account will be charged to extend the token's expiry. */
            autoRenewPeriod?: (proto.IDuration|null);

            /** The new expiry time of the token. */
            expiry?: (proto.ITimestamp|null);

            /** If set, the new memo to be associated with the token. */
            memo?: (string|null);

            /** If set, the new key to use to update the token's custom fee schedule. */
            feeScheduleKey?: (proto.IKey|null);

            /** If set, the new key that can pause and unpause the Token. */
            pauseKey?: (proto.IKey|null);

            /** The new metadata of the token. */
            metadata?: (Uint8Array|null);

            /** The new key which can update the metadata of a token. */
            metadataKey?: (proto.IKey|null);
        }

        /** At consensus, updates an already created token to the given values. */
        class TokenUpdateTransactionBody implements ITokenUpdateTransactionBody {

            /**
             * Constructs a new TokenUpdateTransactionBody.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenUpdateTransactionBody);

            /** The Token to be updated. */
            public token?: (proto.ITokenID|null);

            /** The new publicly visible token symbol. */
            public symbol: string;

            /** The new publicly visible name of the token. */
            public name: string;

            /** The new Treasury account of the Token. */
            public treasury?: (proto.IAccountID|null);

            /** The new admin key of the Token. */
            public adminKey?: (proto.IKey|null);

            /** The new KYC key of the Token. */
            public kycKey?: (proto.IKey|null);

            /** The new Freeze key of the Token. */
            public freezeKey?: (proto.IKey|null);

            /** The new Wipe key of the Token. */
            public wipeKey?: (proto.IKey|null);

            /** The new Supply key of the Token. */
            public supplyKey?: (proto.IKey|null);

            /** The new account which will be automatically charged to renew the token's expiration. */
            public autoRenewAccount?: (proto.IAccountID|null);

            /** The new interval at which the auto-renew account will be charged to extend the token's expiry. */
            public autoRenewPeriod?: (proto.IDuration|null);

            /** The new expiry time of the token. */
            public expiry?: (proto.ITimestamp|null);

            /** If set, the new memo to be associated with the token. */
            public memo: string;

            /** If set, the new key to use to update the token's custom fee schedule. */
            public feeScheduleKey?: (proto.IKey|null);

            /** If set, the new key that can pause and unpause the Token. */
            public pauseKey?: (proto.IKey|null);

            /** The new metadata of the token. */
            public metadata: Uint8Array;

            /** The new key which can update the metadata of a token. */
            public metadataKey?: (proto.IKey|null);

            /**
             * Creates a new TokenUpdateTransactionBody instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenUpdateTransactionBody instance
             */
            public static create(properties?: proto.ITokenUpdateTransactionBody): proto.TokenUpdateTransactionBody;

            /**
             * Encodes the specified TokenUpdateTransactionBody message. Does not implicitly {@link proto.TokenUpdateTransactionBody.verify|verify} messages.
             * @param m TokenUpdateTransactionBody message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenUpdateTransactionBody, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenUpdateTransactionBody message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenUpdateTransactionBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenUpdateTransactionBody;

            /**
             * Gets the default type url for TokenUpdateTransactionBody
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ShardID. */
        interface IShardID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);
        }

        /**
         * A shard identifier.<br/>
         * A shard is a partition of nodes running the network that processes
         * transactions separately from other shards. Each shard is effectively an
         * independent instance of the overall network that shares the same virtual
         * distributed ledger, and may gossip cross-shard transactions with other
         * shards to maintain overall correct processing of the ledger.
         */
        class ShardID implements IShardID {

            /**
             * Constructs a new ShardID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IShardID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /**
             * Creates a new ShardID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ShardID instance
             */
            public static create(properties?: proto.IShardID): proto.ShardID;

            /**
             * Encodes the specified ShardID message. Does not implicitly {@link proto.ShardID.verify|verify} messages.
             * @param m ShardID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IShardID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ShardID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ShardID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ShardID;

            /**
             * Gets the default type url for ShardID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RealmID. */
        interface IRealmID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);

            /** A whole number realm identifier. */
            realmNum?: (Long|null);
        }

        /**
         * A realm identifier.<br/>
         * Within a given shard, every realm has a unique numeric identifier.
         * Each account, file, and contract instance belongs to exactly one realm.
         */
        class RealmID implements IRealmID {

            /**
             * Constructs a new RealmID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IRealmID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /** A whole number realm identifier. */
            public realmNum: Long;

            /**
             * Creates a new RealmID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RealmID instance
             */
            public static create(properties?: proto.IRealmID): proto.RealmID;

            /**
             * Encodes the specified RealmID message. Does not implicitly {@link proto.RealmID.verify|verify} messages.
             * @param m RealmID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IRealmID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RealmID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns RealmID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.RealmID;

            /**
             * Gets the default type url for RealmID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenID. */
        interface ITokenID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);

            /** A whole number realm identifier. */
            realmNum?: (Long|null);

            /** A whole number token identifier. */
            tokenNum?: (Long|null);
        }

        /**
         * Unique identifier for a token.<br/>
         * As with all entity identifiers within the network, a token identifier
         * consists of a combination of shard number, realm number, and entity number.
         * Each of these numbers is unique within its scope (shard > realm > entity).
         */
        class TokenID implements ITokenID {

            /**
             * Constructs a new TokenID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /** A whole number realm identifier. */
            public realmNum: Long;

            /** A whole number token identifier. */
            public tokenNum: Long;

            /**
             * Creates a new TokenID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenID instance
             */
            public static create(properties?: proto.ITokenID): proto.TokenID;

            /**
             * Encodes the specified TokenID message. Does not implicitly {@link proto.TokenID.verify|verify} messages.
             * @param m TokenID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenID;

            /**
             * Gets the default type url for TokenID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

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
         */
        enum BlockHashAlgorithm {
            SHA2_384 = 0
        }

        /** Properties of an AccountID. */
        interface IAccountID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);

            /** A whole number realm identifier. */
            realmNum?: (Long|null);

            /**
             * A whole number account number, unique within its realm and shard.
             * <p>
             * For any AccountID fields in the query response, transaction records,
             * transaction receipts, or block stream `accountNum` MUST be used.
             */
            accountNum?: (Long|null);

            /**
             * An alias value.<br/>
             * Alias is a value used in some contexts to refer to an account when
             * account number is not available, and may be an alias public key, or
             * an EVM address.
             */
            alias?: (Uint8Array|null);
        }

        /**
         * A unique identifier for an Hedera account.
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
         */
        class AccountID implements IAccountID {

            /**
             * Constructs a new AccountID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IAccountID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /** A whole number realm identifier. */
            public realmNum: Long;

            /**
             * A whole number account number, unique within its realm and shard.
             * <p>
             * For any AccountID fields in the query response, transaction records,
             * transaction receipts, or block stream `accountNum` MUST be used.
             */
            public accountNum?: (Long|null);

            /**
             * An alias value.<br/>
             * Alias is a value used in some contexts to refer to an account when
             * account number is not available, and may be an alias public key, or
             * an EVM address.
             */
            public alias?: (Uint8Array|null);

            /** AccountID account. */
            public account?: ("accountNum"|"alias");

            /**
             * Creates a new AccountID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AccountID instance
             */
            public static create(properties?: proto.IAccountID): proto.AccountID;

            /**
             * Encodes the specified AccountID message. Does not implicitly {@link proto.AccountID.verify|verify} messages.
             * @param m AccountID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IAccountID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AccountID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns AccountID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AccountID;

            /**
             * Gets the default type url for AccountID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a NftID. */
        interface INftID {

            /**
             * A token identifier.<br/>
             * This token represents the collection containing this NFT.
             */
            token_ID?: (proto.ITokenID|null);

            /**
             * A unique serial number.<br/>
             * This serial number is unique within its token type.
             */
            serialNumber?: (Long|null);
        }

        /**
         * An identifier for a unique token (or "NFT"), used by both contract
         * and token services.
         */
        class NftID implements INftID {

            /**
             * Constructs a new NftID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.INftID);

            /**
             * A token identifier.<br/>
             * This token represents the collection containing this NFT.
             */
            public token_ID?: (proto.ITokenID|null);

            /**
             * A unique serial number.<br/>
             * This serial number is unique within its token type.
             */
            public serialNumber: Long;

            /**
             * Creates a new NftID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NftID instance
             */
            public static create(properties?: proto.INftID): proto.NftID;

            /**
             * Encodes the specified NftID message. Does not implicitly {@link proto.NftID.verify|verify} messages.
             * @param m NftID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.INftID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NftID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns NftID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.NftID;

            /**
             * Gets the default type url for NftID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FileID. */
        interface IFileID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);

            /** A whole number realm identifier. */
            realmNum?: (Long|null);

            /** A whole number file identifier, unique within its realm and shard. */
            fileNum?: (Long|null);
        }

        /** An identifier for a File within the network. */
        class FileID implements IFileID {

            /**
             * Constructs a new FileID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFileID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /** A whole number realm identifier. */
            public realmNum: Long;

            /** A whole number file identifier, unique within its realm and shard. */
            public fileNum: Long;

            /**
             * Creates a new FileID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileID instance
             */
            public static create(properties?: proto.IFileID): proto.FileID;

            /**
             * Encodes the specified FileID message. Does not implicitly {@link proto.FileID.verify|verify} messages.
             * @param m FileID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFileID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FileID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FileID;

            /**
             * Gets the default type url for FileID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ContractID. */
        interface IContractID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);

            /** A whole number realm identifier. */
            realmNum?: (Long|null);

            /** A whole number contract identifier, unique within its realm and shard. */
            contractNum?: (Long|null);

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
             */
            evmAddress?: (Uint8Array|null);
        }

        /** An identifier for a smart contract within the network. */
        class ContractID implements IContractID {

            /**
             * Constructs a new ContractID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IContractID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /** A whole number realm identifier. */
            public realmNum: Long;

            /** A whole number contract identifier, unique within its realm and shard. */
            public contractNum?: (Long|null);

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
             */
            public evmAddress?: (Uint8Array|null);

            /** ContractID contract. */
            public contract?: ("contractNum"|"evmAddress");

            /**
             * Creates a new ContractID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ContractID instance
             */
            public static create(properties?: proto.IContractID): proto.ContractID;

            /**
             * Encodes the specified ContractID message. Does not implicitly {@link proto.ContractID.verify|verify} messages.
             * @param m ContractID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IContractID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ContractID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ContractID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ContractID;

            /**
             * Gets the default type url for ContractID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TopicID. */
        interface ITopicID {

            /** A whole number shard identifier. */
            shardNum?: (Long|null);

            /** A whole number realm identifier. */
            realmNum?: (Long|null);

            /** A whole number topic identifier, unique within its realm and shard. */
            topicNum?: (Long|null);
        }

        /**
         * An unique identifier for a topic.<br/>
         * Topics are part of the consensus service, messages are published to a topic.
         */
        class TopicID implements ITopicID {

            /**
             * Constructs a new TopicID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITopicID);

            /** A whole number shard identifier. */
            public shardNum: Long;

            /** A whole number realm identifier. */
            public realmNum: Long;

            /** A whole number topic identifier, unique within its realm and shard. */
            public topicNum: Long;

            /**
             * Creates a new TopicID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TopicID instance
             */
            public static create(properties?: proto.ITopicID): proto.TopicID;

            /**
             * Encodes the specified TopicID message. Does not implicitly {@link proto.TopicID.verify|verify} messages.
             * @param m TopicID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITopicID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TopicID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TopicID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TopicID;

            /**
             * Gets the default type url for TopicID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ScheduleID. */
        interface IScheduleID {

            /** A whole number shard */
            shardNum?: (Long|null);

            /** A whole number realm */
            realmNum?: (Long|null);

            /** A whole number schedule, unique within its realm and shard */
            scheduleNum?: (Long|null);
        }

        /** An unique identifier for a Schedule */
        class ScheduleID implements IScheduleID {

            /**
             * Constructs a new ScheduleID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IScheduleID);

            /** A whole number shard */
            public shardNum: Long;

            /** A whole number realm */
            public realmNum: Long;

            /** A whole number schedule, unique within its realm and shard */
            public scheduleNum: Long;

            /**
             * Creates a new ScheduleID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ScheduleID instance
             */
            public static create(properties?: proto.IScheduleID): proto.ScheduleID;

            /**
             * Encodes the specified ScheduleID message. Does not implicitly {@link proto.ScheduleID.verify|verify} messages.
             * @param m ScheduleID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IScheduleID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ScheduleID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ScheduleID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ScheduleID;

            /**
             * Gets the default type url for ScheduleID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TransactionID. */
        interface ITransactionID {

            /**
             * A timestamp for the transaction start time.<br/>
             * This is the earliest expected start time for this transaction.
             * <p>
             * This value MUST be strictly less than `consensusTimestamp` when the
             * transaction is submitted.
             */
            transactionValidStart?: (proto.ITimestamp|null);

            /**
             * An Account identifier.
             * <p>
             * The identified account SHALL pay transaction fees for this transaction.
             */
            accountID?: (proto.IAccountID|null);

            /**
             * A scheduled transaction flag.<br/>
             * If set, this transaction represents the execution of a Schedule after
             * all necessary signatures are gathered.
             * <p>
             * This flag MUST NOT be set in a user-submitted transaction.
             */
            scheduled?: (boolean|null);

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
             */
            nonce?: (number|null);
        }

        /**
         * A transaction identifier.<br/>
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
         */
        class TransactionID implements ITransactionID {

            /**
             * Constructs a new TransactionID.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITransactionID);

            /**
             * A timestamp for the transaction start time.<br/>
             * This is the earliest expected start time for this transaction.
             * <p>
             * This value MUST be strictly less than `consensusTimestamp` when the
             * transaction is submitted.
             */
            public transactionValidStart?: (proto.ITimestamp|null);

            /**
             * An Account identifier.
             * <p>
             * The identified account SHALL pay transaction fees for this transaction.
             */
            public accountID?: (proto.IAccountID|null);

            /**
             * A scheduled transaction flag.<br/>
             * If set, this transaction represents the execution of a Schedule after
             * all necessary signatures are gathered.
             * <p>
             * This flag MUST NOT be set in a user-submitted transaction.
             */
            public scheduled: boolean;

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
             */
            public nonce: number;

            /**
             * Creates a new TransactionID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransactionID instance
             */
            public static create(properties?: proto.ITransactionID): proto.TransactionID;

            /**
             * Encodes the specified TransactionID message. Does not implicitly {@link proto.TransactionID.verify|verify} messages.
             * @param m TransactionID message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITransactionID, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransactionID message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TransactionID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TransactionID;

            /**
             * Gets the default type url for TransactionID
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an AccountAmount. */
        interface IAccountAmount {

            /** An account identifier that will send or receive token(s). */
            accountID?: (proto.IAccountID|null);

            /**
             * An amount to send (negative) or receive (positive).
             * <p>
             * This amount MUST be denominated in the smallest unit of the relevant
             * token.<br/>
             * For HBAR this SHALL be tinybar (10<sup>-8</sup> HBAR).<br/>
             * For other fungible/common tokens this SHALL depend on the value of
             * `decimals` for that token.
             */
            amount?: (Long|null);

            /**
             * An approved allowance flag.<br/>
             * If true then the transfer is expected to be an approved allowance.
             * <p>
             * If set, `accountID` SHALL be the owner that previously approved
             * the allowance.<br/>
             * The default value SHALL be false (unset).
             */
            isApproval?: (boolean|null);
        }

        /**
         * An account, and the amount that it sends or receives during a token transfer.
         *
         * This message is only relevant to fungible/common token transfers.
         * Non-fungible/unique (NFT) token transfers MUST use the NftTransfer message.
         */
        class AccountAmount implements IAccountAmount {

            /**
             * Constructs a new AccountAmount.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IAccountAmount);

            /** An account identifier that will send or receive token(s). */
            public accountID?: (proto.IAccountID|null);

            /**
             * An amount to send (negative) or receive (positive).
             * <p>
             * This amount MUST be denominated in the smallest unit of the relevant
             * token.<br/>
             * For HBAR this SHALL be tinybar (10<sup>-8</sup> HBAR).<br/>
             * For other fungible/common tokens this SHALL depend on the value of
             * `decimals` for that token.
             */
            public amount: Long;

            /**
             * An approved allowance flag.<br/>
             * If true then the transfer is expected to be an approved allowance.
             * <p>
             * If set, `accountID` SHALL be the owner that previously approved
             * the allowance.<br/>
             * The default value SHALL be false (unset).
             */
            public isApproval: boolean;

            /**
             * Creates a new AccountAmount instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AccountAmount instance
             */
            public static create(properties?: proto.IAccountAmount): proto.AccountAmount;

            /**
             * Encodes the specified AccountAmount message. Does not implicitly {@link proto.AccountAmount.verify|verify} messages.
             * @param m AccountAmount message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IAccountAmount, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AccountAmount message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns AccountAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AccountAmount;

            /**
             * Gets the default type url for AccountAmount
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TransferList. */
        interface ITransferList {

            /**
             * A list of AccountAmount pairs.<br/>
             * Each entry in this list is an account and an amount to transfer
             * into it (positive) or out of it (negative)
             */
            accountAmounts?: (proto.IAccountAmount[]|null);
        }

        /**
         * A list of accounts and amounts to transfer.
         *
         * Each `AccountAmount` SHALL specify the account and the amount to
         * send(negative) or receive(positive).<br/>
         * Each `TransferList` SHALL be contained in another message that contains
         * other details required to complete a transfer. This is typically a
         * `CryptoTransferTransactionBody` or `TransactionRecord`.<br/>
         * The `TransferList` SHALL only be used for HBAR transfers. Other token types
         * MUST use the `TokenTransferList` message.
         */
        class TransferList implements ITransferList {

            /**
             * Constructs a new TransferList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITransferList);

            /**
             * A list of AccountAmount pairs.<br/>
             * Each entry in this list is an account and an amount to transfer
             * into it (positive) or out of it (negative)
             */
            public accountAmounts: proto.IAccountAmount[];

            /**
             * Creates a new TransferList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransferList instance
             */
            public static create(properties?: proto.ITransferList): proto.TransferList;

            /**
             * Encodes the specified TransferList message. Does not implicitly {@link proto.TransferList.verify|verify} messages.
             * @param m TransferList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITransferList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransferList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TransferList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TransferList;

            /**
             * Gets the default type url for TransferList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a NftTransfer. */
        interface INftTransfer {

            /** An Account identifier for the sender. */
            senderAccountID?: (proto.IAccountID|null);

            /** An Account identifier for the receiver. */
            receiverAccountID?: (proto.IAccountID|null);

            /** A serial number for the NFT to transfer. */
            serialNumber?: (Long|null);

            /**
             * An approved allowance flag.<br/>
             * If true then the transfer is expected to be an approved allowance.
             * <p>
             * If set, `senderAccountID` SHALL be the owner that previously approved
             * the allowance.<br/>
             * If set, the `senderAccountID` MUST be the "payer" account for
             * the transaction <br/>
             * The default value SHALL be false (unset).
             */
            isApproval?: (boolean|null);
        }

        /**
         * A NFT transfer.<br/>
         * This refers to a sender account, a receiver account, and the serial number
         * of an NFT to transfer from sender to receiver.
         *
         * Each `NftTransfer` SHALL be contained in another message (typically
         * `TokenTransferList`) that details which `Token` type applies to this NFT
         * transfer.
         */
        class NftTransfer implements INftTransfer {

            /**
             * Constructs a new NftTransfer.
             * @param [p] Properties to set
             */
            constructor(p?: proto.INftTransfer);

            /** An Account identifier for the sender. */
            public senderAccountID?: (proto.IAccountID|null);

            /** An Account identifier for the receiver. */
            public receiverAccountID?: (proto.IAccountID|null);

            /** A serial number for the NFT to transfer. */
            public serialNumber: Long;

            /**
             * An approved allowance flag.<br/>
             * If true then the transfer is expected to be an approved allowance.
             * <p>
             * If set, `senderAccountID` SHALL be the owner that previously approved
             * the allowance.<br/>
             * If set, the `senderAccountID` MUST be the "payer" account for
             * the transaction <br/>
             * The default value SHALL be false (unset).
             */
            public isApproval: boolean;

            /**
             * Creates a new NftTransfer instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NftTransfer instance
             */
            public static create(properties?: proto.INftTransfer): proto.NftTransfer;

            /**
             * Encodes the specified NftTransfer message. Does not implicitly {@link proto.NftTransfer.verify|verify} messages.
             * @param m NftTransfer message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.INftTransfer, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NftTransfer message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns NftTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.NftTransfer;

            /**
             * Gets the default type url for NftTransfer
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenTransferList. */
        interface ITokenTransferList {

            /**
             * A token identifier.<br/>
             * This is the token to be transferred.
             */
            token?: (proto.ITokenID|null);

            /**
             * A list of account amounts.
             * <p>
             * Each entry SHALL have an account and amount.<br/>
             * These transfers SHALL be "double-entry" style; the credits (positive
             * amount) and debits (negative amount) MUST sum to 0, unless this
             * transfer list is part of a `mint` or `burn` operation.<br/>
             * This SHALL be be set for fungible/common tokens and MUST be
             * empty otherwise.
             */
            transfers?: (proto.IAccountAmount[]|null);

            /**
             * A list of NftTransfers.
             * <p>
             * Each entry SHALL have a sender and receiver account, and the
             * serial number of the unique token to transfer.<br/>
             * This SHALL be be set for non-fungible/unique tokens and SHALL be
             * empty otherwise.
             */
            nftTransfers?: (proto.INftTransfer[]|null);

            /**
             * An expected decimal precision.<br/>
             * This is the number of decimals a fungible/common token type is
             * _expected_ to have.
             * <p>
             * The transfer SHALL fail with response code `UNEXPECTED_TOKEN_DECIMALS`
             * if this is set and the actual decimals specified for the `Token` differ
             * from this value.<br/>
             * If `nftTransfers` is set, then this value SHOULD NOT be set.
             */
            expectedDecimals?: (google.protobuf.IUInt32Value|null);
        }

        /**
         * A list of transfers for a particular (non-HBAR) token type.
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
         */
        class TokenTransferList implements ITokenTransferList {

            /**
             * Constructs a new TokenTransferList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenTransferList);

            /**
             * A token identifier.<br/>
             * This is the token to be transferred.
             */
            public token?: (proto.ITokenID|null);

            /**
             * A list of account amounts.
             * <p>
             * Each entry SHALL have an account and amount.<br/>
             * These transfers SHALL be "double-entry" style; the credits (positive
             * amount) and debits (negative amount) MUST sum to 0, unless this
             * transfer list is part of a `mint` or `burn` operation.<br/>
             * This SHALL be be set for fungible/common tokens and MUST be
             * empty otherwise.
             */
            public transfers: proto.IAccountAmount[];

            /**
             * A list of NftTransfers.
             * <p>
             * Each entry SHALL have a sender and receiver account, and the
             * serial number of the unique token to transfer.<br/>
             * This SHALL be be set for non-fungible/unique tokens and SHALL be
             * empty otherwise.
             */
            public nftTransfers: proto.INftTransfer[];

            /**
             * An expected decimal precision.<br/>
             * This is the number of decimals a fungible/common token type is
             * _expected_ to have.
             * <p>
             * The transfer SHALL fail with response code `UNEXPECTED_TOKEN_DECIMALS`
             * if this is set and the actual decimals specified for the `Token` differ
             * from this value.<br/>
             * If `nftTransfers` is set, then this value SHOULD NOT be set.
             */
            public expectedDecimals?: (google.protobuf.IUInt32Value|null);

            /**
             * Creates a new TokenTransferList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenTransferList instance
             */
            public static create(properties?: proto.ITokenTransferList): proto.TokenTransferList;

            /**
             * Encodes the specified TokenTransferList message. Does not implicitly {@link proto.TokenTransferList.verify|verify} messages.
             * @param m TokenTransferList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenTransferList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenTransferList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenTransferList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenTransferList;

            /**
             * Gets the default type url for TokenTransferList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Fraction. */
        interface IFraction {

            /** A fractional number's numerator. */
            numerator?: (Long|null);

            /**
             * A fractional number's denominator.
             * <p>
             * A zero value SHALL fail with response code `FRACTION_DIVIDES_BY_ZERO`.
             */
            denominator?: (Long|null);
        }

        /**
         * A rational number.<br/>
         * A common use is to set the amount of a value transfer to collect as a
         * custom fee.
         *
         * It is RECOMMENDED that both numerator and denominator be no larger than
         * necessary to express the required fraction. A very large numerator, in
         * particular, may not be reliable.
         * Both fields are REQUIRED and SHOULD be positive integers.
         */
        class Fraction implements IFraction {

            /**
             * Constructs a new Fraction.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFraction);

            /** A fractional number's numerator. */
            public numerator: Long;

            /**
             * A fractional number's denominator.
             * <p>
             * A zero value SHALL fail with response code `FRACTION_DIVIDES_BY_ZERO`.
             */
            public denominator: Long;

            /**
             * Creates a new Fraction instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Fraction instance
             */
            public static create(properties?: proto.IFraction): proto.Fraction;

            /**
             * Encodes the specified Fraction message. Does not implicitly {@link proto.Fraction.verify|verify} messages.
             * @param m Fraction message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFraction, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Fraction message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Fraction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Fraction;

            /**
             * Gets the default type url for Fraction
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

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
         */
        enum TokenType {
            FUNGIBLE_COMMON = 0,
            NON_FUNGIBLE_UNIQUE = 1
        }

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
         */
        enum SubType {
            DEFAULT = 0,
            TOKEN_FUNGIBLE_COMMON = 1,
            TOKEN_NON_FUNGIBLE_UNIQUE = 2,
            TOKEN_FUNGIBLE_COMMON_WITH_CUSTOM_FEES = 3,
            TOKEN_NON_FUNGIBLE_UNIQUE_WITH_CUSTOM_FEES = 4,
            SCHEDULE_CREATE_CONTRACT_CALL = 5,
            TOPIC_CREATE_WITH_CUSTOM_FEES = 6,
            SUBMIT_MESSAGE_WITH_CUSTOM_FEES = 7
        }

        /**
         * Possible Token Supply Types (IWA Compatibility).
         *
         * This `enum` indicates the limit of tokens that can exist during the
         * lifetime of a token definition. The "infinite" supply is only theoretically
         * infinite, as it is still limited to the magnitude of a 64-bit signed
         * integer. A "finite" supply is further limited to a value specified when
         * the token is created (or updated, if not immutable).
         */
        enum TokenSupplyType {
            INFINITE = 0,
            FINITE = 1
        }

        /** Types of validation strategies for token keys. */
        enum TokenKeyValidation {
            FULL_VALIDATION = 0,
            NO_VALIDATION = 1
        }

        /**
         * Possible token freeze status values.
         *
         * This is returned by `TokenGetInfoQuery` or `CryptoGetInfoResponse`
         * in `TokenRelationship`.
         */
        enum TokenFreezeStatus {
            FreezeNotApplicable = 0,
            Frozen = 1,
            Unfrozen = 2
        }

        /**
         * Possible token "KYC" status values.
         *
         * This is returned by `TokenGetInfoQuery` or `CryptoGetInfoResponse`
         * in `TokenRelationship`.
         */
        enum TokenKycStatus {
            KycNotApplicable = 0,
            Granted = 1,
            Revoked = 2
        }

        /**
         * Possible Pause status values.
         *
         * This is returned by `TokenGetInfoQuery` in `TokenRelationship`.
         */
        enum TokenPauseStatus {
            PauseNotApplicable = 0,
            Paused = 1,
            Unpaused = 2
        }

        /** Properties of a Key. */
        interface IKey {

            /**
             * A smart contract instance that is authorized implicitly.
             * <p>
             * This key type SHALL require that the code in the active message frame
             * belong to the contract with the given id.
             */
            contractID?: (proto.IContractID|null);

            /** An array of Ed25519 public key bytes. */
            ed25519?: (Uint8Array|null);

            /**
             * This option is not currently supported.<br/>
             * An array of RSA-3072 public key bytes.
             */
            RSA_3072?: (Uint8Array|null);

            /**
             * This option is not currently supported.<br/>
             * An array of ECDSA, using the p-384 curve, public key bytes.
             */
            ECDSA_384?: (Uint8Array|null);

            /**
             * A threshold, M, combined with a list of N keys, any M of which are
             * sufficient to form a valid signature.
             */
            thresholdKey?: (proto.IThresholdKey|null);

            /**
             * A list of keys. This may be treated like a "N-of-N" threshold key,
             * as a component of another key, or in some other manner as documented.
             */
            keyList?: (proto.IKeyList|null);

            /**
             * A set of compressed ECDSA(secp256k1) public key bytes.<br/>
             * This is an EVM compatibility format.
             */
            ECDSASecp256k1?: (Uint8Array|null);

            /**
             * A smart contract that, if the recipient of the active message frame,
             * SHALL be imputed authorization.<br/>
             * Setting this key type is a more permissive version of setting a
             * contractID key.
             * <p>
             * This key form SHALL NOT strictly require that the code being executed
             * in the frame belong to the given contract. The code in frame MAY be
             * running another contract via a `delegatecall`.
             */
            delegatableContractId?: (proto.IContractID|null);
        }

        /**
         * A Key is an entity representing one or more cryptographic public/private key
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
         */
        class Key implements IKey {

            /**
             * Constructs a new Key.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IKey);

            /**
             * A smart contract instance that is authorized implicitly.
             * <p>
             * This key type SHALL require that the code in the active message frame
             * belong to the contract with the given id.
             */
            public contractID?: (proto.IContractID|null);

            /** An array of Ed25519 public key bytes. */
            public ed25519?: (Uint8Array|null);

            /**
             * This option is not currently supported.<br/>
             * An array of RSA-3072 public key bytes.
             */
            public RSA_3072?: (Uint8Array|null);

            /**
             * This option is not currently supported.<br/>
             * An array of ECDSA, using the p-384 curve, public key bytes.
             */
            public ECDSA_384?: (Uint8Array|null);

            /**
             * A threshold, M, combined with a list of N keys, any M of which are
             * sufficient to form a valid signature.
             */
            public thresholdKey?: (proto.IThresholdKey|null);

            /**
             * A list of keys. This may be treated like a "N-of-N" threshold key,
             * as a component of another key, or in some other manner as documented.
             */
            public keyList?: (proto.IKeyList|null);

            /**
             * A set of compressed ECDSA(secp256k1) public key bytes.<br/>
             * This is an EVM compatibility format.
             */
            public ECDSASecp256k1?: (Uint8Array|null);

            /**
             * A smart contract that, if the recipient of the active message frame,
             * SHALL be imputed authorization.<br/>
             * Setting this key type is a more permissive version of setting a
             * contractID key.
             * <p>
             * This key form SHALL NOT strictly require that the code being executed
             * in the frame belong to the given contract. The code in frame MAY be
             * running another contract via a `delegatecall`.
             */
            public delegatableContractId?: (proto.IContractID|null);

            /** Key key. */
            public key?: ("contractID"|"ed25519"|"RSA_3072"|"ECDSA_384"|"thresholdKey"|"keyList"|"ECDSASecp256k1"|"delegatableContractId");

            /**
             * Creates a new Key instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Key instance
             */
            public static create(properties?: proto.IKey): proto.Key;

            /**
             * Encodes the specified Key message. Does not implicitly {@link proto.Key.verify|verify} messages.
             * @param m Key message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IKey, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Key message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Key
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Key;

            /**
             * Gets the default type url for Key
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ThresholdKey. */
        interface IThresholdKey {

            /**
             * A transaction MUST have valid signatures from at least this number of
             * separate keys, from the `keys` list to be authorized by this key.
             */
            threshold?: (number|null);

            /** A list of the keys that MAY satisfy signature requirements of this key. */
            keys?: (proto.IKeyList|null);
        }

        /**
         * A threshold value and a list of public keys that, together, form a threshold
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
         */
        class ThresholdKey implements IThresholdKey {

            /**
             * Constructs a new ThresholdKey.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IThresholdKey);

            /**
             * A transaction MUST have valid signatures from at least this number of
             * separate keys, from the `keys` list to be authorized by this key.
             */
            public threshold: number;

            /** A list of the keys that MAY satisfy signature requirements of this key. */
            public keys?: (proto.IKeyList|null);

            /**
             * Creates a new ThresholdKey instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ThresholdKey instance
             */
            public static create(properties?: proto.IThresholdKey): proto.ThresholdKey;

            /**
             * Encodes the specified ThresholdKey message. Does not implicitly {@link proto.ThresholdKey.verify|verify} messages.
             * @param m ThresholdKey message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IThresholdKey, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ThresholdKey message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ThresholdKey
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ThresholdKey;

            /**
             * Gets the default type url for ThresholdKey
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a KeyList. */
        interface IKeyList {

            /**
             * A list of keys. All values in this list SHALL be non-null.
             * <p>
             */
            keys?: (proto.IKey[]|null);
        }

        /**
         * A list of keys.<br/>
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
         */
        class KeyList implements IKeyList {

            /**
             * Constructs a new KeyList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IKeyList);

            /**
             * A list of keys. All values in this list SHALL be non-null.
             * <p>
             */
            public keys: proto.IKey[];

            /**
             * Creates a new KeyList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns KeyList instance
             */
            public static create(properties?: proto.IKeyList): proto.KeyList;

            /**
             * Encodes the specified KeyList message. Does not implicitly {@link proto.KeyList.verify|verify} messages.
             * @param m KeyList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IKeyList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a KeyList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns KeyList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.KeyList;

            /**
             * Gets the default type url for KeyList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Signature. */
        interface ISignature {

            /** Smart contract virtual signature (always length zero). */
            contract?: (Uint8Array|null);

            /** Ed25519 signature bytes. */
            ed25519?: (Uint8Array|null);

            /** RSA-3072 signature bytes. */
            RSA_3072?: (Uint8Array|null);

            /** ECDSA p-384 signature bytes. */
            ECDSA_384?: (Uint8Array|null);

            /**
             * A list of signatures for a single N-of-M threshold Key. This must be
             * a list of exactly M signatures, at least N of which are non-null.
             */
            thresholdSignature?: (proto.IThresholdSignature|null);

            /**
             * A list of M signatures, each corresponding to a Key in a KeyList
             * of the same length.
             */
            signatureList?: (proto.ISignatureList|null);
        }

        /**
         * This message is deprecated and MUST NOT be used to communicate with
         * network nodes. It is retained here only for historical reasons.
         *
         * Client software MUST NOT include this message in any request. <br/>
         * Compliant nodes SHALL NOT accept any request containing this message.
         *
         * Please use the `SignaturePair` and `SignatureMap` messages instead of
         * this message.
         */
        class Signature implements ISignature {

            /**
             * Constructs a new Signature.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ISignature);

            /** Smart contract virtual signature (always length zero). */
            public contract?: (Uint8Array|null);

            /** Ed25519 signature bytes. */
            public ed25519?: (Uint8Array|null);

            /** RSA-3072 signature bytes. */
            public RSA_3072?: (Uint8Array|null);

            /** ECDSA p-384 signature bytes. */
            public ECDSA_384?: (Uint8Array|null);

            /**
             * A list of signatures for a single N-of-M threshold Key. This must be
             * a list of exactly M signatures, at least N of which are non-null.
             */
            public thresholdSignature?: (proto.IThresholdSignature|null);

            /**
             * A list of M signatures, each corresponding to a Key in a KeyList
             * of the same length.
             */
            public signatureList?: (proto.ISignatureList|null);

            /** Signature signature. */
            public signature?: ("contract"|"ed25519"|"RSA_3072"|"ECDSA_384"|"thresholdSignature"|"signatureList");

            /**
             * Creates a new Signature instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Signature instance
             */
            public static create(properties?: proto.ISignature): proto.Signature;

            /**
             * Encodes the specified Signature message. Does not implicitly {@link proto.Signature.verify|verify} messages.
             * @param m Signature message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ISignature, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Signature message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Signature
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Signature;

            /**
             * Gets the default type url for Signature
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ThresholdSignature. */
        interface IThresholdSignature {

            /**
             * For an N-of-M threshold key, this is a list of M signatures, at least N
             * of which must be non-null.
             */
            sigs?: (proto.ISignatureList|null);
        }

        /**
         * This message is deprecated and MUST NOT be used to communicate with network
         * nodes. It is retained here only for historical reasons.
         *
         * Client software MUST NOT include this message in any request. <br/>
         * Compliant nodes SHALL NOT accept any request containing this message.
         *
         * Please use the `SignaturePair` and `SignatureMap` messages, in combination
         * with `ThresholdKey` keys, instead of this message.
         */
        class ThresholdSignature implements IThresholdSignature {

            /**
             * Constructs a new ThresholdSignature.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IThresholdSignature);

            /**
             * For an N-of-M threshold key, this is a list of M signatures, at least N
             * of which must be non-null.
             */
            public sigs?: (proto.ISignatureList|null);

            /**
             * Creates a new ThresholdSignature instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ThresholdSignature instance
             */
            public static create(properties?: proto.IThresholdSignature): proto.ThresholdSignature;

            /**
             * Encodes the specified ThresholdSignature message. Does not implicitly {@link proto.ThresholdSignature.verify|verify} messages.
             * @param m ThresholdSignature message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IThresholdSignature, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ThresholdSignature message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ThresholdSignature
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ThresholdSignature;

            /**
             * Gets the default type url for ThresholdSignature
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SignatureList. */
        interface ISignatureList {

            /** Each signature corresponds to a Key in the KeyList. */
            sigs?: (proto.ISignature[]|null);
        }

        /**
         * This message is deprecated and MUST NOT be used to communicate with network
         * nodes. It is retained here only for historical reasons.
         *
         * Client software MUST NOT include this message in any request. <br/>
         * Compliant nodes SHALL NOT accept any request containing this message.
         *
         * Please use the `SignaturePair` and `SignatureMap` messages instead of
         * this message.
         */
        class SignatureList implements ISignatureList {

            /**
             * Constructs a new SignatureList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ISignatureList);

            /** Each signature corresponds to a Key in the KeyList. */
            public sigs: proto.ISignature[];

            /**
             * Creates a new SignatureList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SignatureList instance
             */
            public static create(properties?: proto.ISignatureList): proto.SignatureList;

            /**
             * Encodes the specified SignatureList message. Does not implicitly {@link proto.SignatureList.verify|verify} messages.
             * @param m SignatureList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ISignatureList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SignatureList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns SignatureList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.SignatureList;

            /**
             * Gets the default type url for SignatureList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SignaturePair. */
        interface ISignaturePair {

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
             */
            pubKeyPrefix?: (Uint8Array|null);

            /**
             * A smart contract virtual signature.
             * <p>
             * This value MUST be length zero, if set.
             */
            contract?: (Uint8Array|null);

            /** An Ed25519 signature. */
            ed25519?: (Uint8Array|null);

            /**
             * This option is not supported.<br/>
             * A RSA-3072 signature.
             */
            RSA_3072?: (Uint8Array|null);

            /**
             * This option is not supported.<br/>
             * ECDSA p-384 signature.
             */
            ECDSA_384?: (Uint8Array|null);

            /** An ECDSA(secp256k1) signature. */
            ECDSASecp256k1?: (Uint8Array|null);
        }

        /**
         * A public key and signature pair.<br/>
         * Only Ed25519 and ECDSA(secp256k1) keys and signatures are currently supported
         * as cryptographic (non-implied) signatures.
         */
        class SignaturePair implements ISignaturePair {

            /**
             * Constructs a new SignaturePair.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ISignaturePair);

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
             */
            public pubKeyPrefix: Uint8Array;

            /**
             * A smart contract virtual signature.
             * <p>
             * This value MUST be length zero, if set.
             */
            public contract?: (Uint8Array|null);

            /** An Ed25519 signature. */
            public ed25519?: (Uint8Array|null);

            /**
             * This option is not supported.<br/>
             * A RSA-3072 signature.
             */
            public RSA_3072?: (Uint8Array|null);

            /**
             * This option is not supported.<br/>
             * ECDSA p-384 signature.
             */
            public ECDSA_384?: (Uint8Array|null);

            /** An ECDSA(secp256k1) signature. */
            public ECDSASecp256k1?: (Uint8Array|null);

            /** SignaturePair signature. */
            public signature?: ("contract"|"ed25519"|"RSA_3072"|"ECDSA_384"|"ECDSASecp256k1");

            /**
             * Creates a new SignaturePair instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SignaturePair instance
             */
            public static create(properties?: proto.ISignaturePair): proto.SignaturePair;

            /**
             * Encodes the specified SignaturePair message. Does not implicitly {@link proto.SignaturePair.verify|verify} messages.
             * @param m SignaturePair message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ISignaturePair, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SignaturePair message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns SignaturePair
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.SignaturePair;

            /**
             * Gets the default type url for SignaturePair
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SignatureMap. */
        interface ISignatureMap {

            /**
             * A list of signature pairs for a specific transaction.<br/>
             * Each signature pair represents a single cryptographic (`primitive`)
             * public key identified by a "prefix" value and the cryptographic
             * signature produced for that key.
             */
            sigPair?: (proto.ISignaturePair[]|null);
        }

        /**
         * A set of signatures corresponding to every unique public key that
         * signed a given transaction.
         *
         * If any public key matches more than one prefix in the signature map,
         * the transaction containing that map SHALL fail immediately with the
         * response code `KEY_PREFIX_MISMATCH`.
         */
        class SignatureMap implements ISignatureMap {

            /**
             * Constructs a new SignatureMap.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ISignatureMap);

            /**
             * A list of signature pairs for a specific transaction.<br/>
             * Each signature pair represents a single cryptographic (`primitive`)
             * public key identified by a "prefix" value and the cryptographic
             * signature produced for that key.
             */
            public sigPair: proto.ISignaturePair[];

            /**
             * Creates a new SignatureMap instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SignatureMap instance
             */
            public static create(properties?: proto.ISignatureMap): proto.SignatureMap;

            /**
             * Encodes the specified SignatureMap message. Does not implicitly {@link proto.SignatureMap.verify|verify} messages.
             * @param m SignatureMap message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ISignatureMap, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SignatureMap message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns SignatureMap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.SignatureMap;

            /**
             * Gets the default type url for SignatureMap
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** The transactions and queries supported by Hedera Hashgraph. */
        enum HederaFunctionality {
            NONE = 0,
            CryptoTransfer = 1,
            CryptoUpdate = 2,
            CryptoDelete = 3,
            CryptoAddLiveHash = 4,
            CryptoDeleteLiveHash = 5,
            ContractCall = 6,
            ContractCreate = 7,
            ContractUpdate = 8,
            FileCreate = 9,
            FileAppend = 10,
            FileUpdate = 11,
            FileDelete = 12,
            CryptoGetAccountBalance = 13,
            CryptoGetAccountRecords = 14,
            CryptoGetInfo = 15,
            ContractCallLocal = 16,
            ContractGetInfo = 17,
            ContractGetBytecode = 18,
            GetBySolidityID = 19,
            GetByKey = 20,
            CryptoGetLiveHash = 21,
            CryptoGetStakers = 22,
            FileGetContents = 23,
            FileGetInfo = 24,
            TransactionGetRecord = 25,
            ContractGetRecords = 26,
            CryptoCreate = 27,
            SystemDelete = 28,
            SystemUndelete = 29,
            ContractDelete = 30,
            Freeze = 31,
            CreateTransactionRecord = 32,
            CryptoAccountAutoRenew = 33,
            ContractAutoRenew = 34,
            GetVersionInfo = 35,
            TransactionGetReceipt = 36,
            ConsensusCreateTopic = 50,
            ConsensusUpdateTopic = 51,
            ConsensusDeleteTopic = 52,
            ConsensusGetTopicInfo = 53,
            ConsensusSubmitMessage = 54,
            UncheckedSubmit = 55,
            TokenCreate = 56,
            TokenGetInfo = 58,
            TokenFreezeAccount = 59,
            TokenUnfreezeAccount = 60,
            TokenGrantKycToAccount = 61,
            TokenRevokeKycFromAccount = 62,
            TokenDelete = 63,
            TokenUpdate = 64,
            TokenMint = 65,
            TokenBurn = 66,
            TokenAccountWipe = 67,
            TokenAssociateToAccount = 68,
            TokenDissociateFromAccount = 69,
            ScheduleCreate = 70,
            ScheduleDelete = 71,
            ScheduleSign = 72,
            ScheduleGetInfo = 73,
            TokenGetAccountNftInfos = 74,
            TokenGetNftInfo = 75,
            TokenGetNftInfos = 76,
            TokenFeeScheduleUpdate = 77,
            NetworkGetExecutionTime = 78,
            TokenPause = 79,
            TokenUnpause = 80,
            CryptoApproveAllowance = 81,
            CryptoDeleteAllowance = 82,
            GetAccountDetails = 83,
            EthereumTransaction = 84,
            NodeStakeUpdate = 85,
            UtilPrng = 86,
            TransactionGetFastRecord = 87,
            TokenUpdateNfts = 88,
            NodeCreate = 89,
            NodeUpdate = 90,
            NodeDelete = 91,
            TokenReject = 92,
            TokenAirdrop = 93,
            TokenCancelAirdrop = 94,
            TokenClaimAirdrop = 95,
            StateSignatureTransaction = 100,
            HintsKeyPublication = 101,
            HintsPreprocessingVote = 102,
            HintsPartialSignature = 103,
            HistoryAssemblySignature = 104,
            HistoryProofKeyPublication = 105,
            HistoryProofVote = 106,
            CrsPublication = 107,
            AtomicBatch = 108
        }

        /** Properties of a FeeComponents. */
        interface IFeeComponents {

            /**
             * Base: "minimum total fee".
             * <p>
             * The calculated fee MUST be greater than this value.
             */
            min?: (Long|null);

            /**
             * Base: "maximum total fee".
             * <p>
             * The calculated fee MUST be less than this value.
             */
            max?: (Long|null);

            /**
             * Base: "constant fee".<br/>
             * A baseline constant contribution to total fee.
             */
            constant?: (Long|null);

            /**
             * Bandwidth: "bytes per transaction".<br/>
             * The fee for bandwidth consumed by a transaction, measured in bytes
             */
            bpt?: (Long|null);

            /**
             * Signatures: "validations per transaction".<br/>
             * The fee for signature verifications required by a transaction
             */
            vpt?: (Long|null);

            /**
             * Memory: "RAM byte-hours".<br/>
             * The fee for RAM required to process a transaction,
             * measured in byte-hours
             */
            rbh?: (Long|null);

            /**
             * Disk: "storage byte-hours".<br/>
             * The fee for storage required by a transaction, measured in byte-hours
             */
            sbh?: (Long|null);

            /**
             * Compute: Ethereum term for a derivative EVM compute resource.<br/>
             * The fee of computation for a smart contract transaction. The value of
             * gas is set by a conversion rate, and is regularly updated to reflect
             * reasonable and customary costs.
             */
            gas?: (Long|null);

            /**
             * Ad valorem: "transferred value".<br/>
             * The fee for HBAR transferred by a transaction.
             */
            tv?: (Long|null);

            /**
             * Response memory: "bytes per response".<br/>
             * The fee for data retrieved from memory to deliver a response,
             * measured in bytes
             */
            bpr?: (Long|null);

            /**
             * Response disk: "storage bytes per response".<br/>
             * The fee for data retrieved from disk to deliver a response,
             * measured in bytes
             */
            sbpr?: (Long|null);
        }

        /**
         * A set of values the nodes use in determining transaction and query fees, and
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
         */
        class FeeComponents implements IFeeComponents {

            /**
             * Constructs a new FeeComponents.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFeeComponents);

            /**
             * Base: "minimum total fee".
             * <p>
             * The calculated fee MUST be greater than this value.
             */
            public min: Long;

            /**
             * Base: "maximum total fee".
             * <p>
             * The calculated fee MUST be less than this value.
             */
            public max: Long;

            /**
             * Base: "constant fee".<br/>
             * A baseline constant contribution to total fee.
             */
            public constant: Long;

            /**
             * Bandwidth: "bytes per transaction".<br/>
             * The fee for bandwidth consumed by a transaction, measured in bytes
             */
            public bpt: Long;

            /**
             * Signatures: "validations per transaction".<br/>
             * The fee for signature verifications required by a transaction
             */
            public vpt: Long;

            /**
             * Memory: "RAM byte-hours".<br/>
             * The fee for RAM required to process a transaction,
             * measured in byte-hours
             */
            public rbh: Long;

            /**
             * Disk: "storage byte-hours".<br/>
             * The fee for storage required by a transaction, measured in byte-hours
             */
            public sbh: Long;

            /**
             * Compute: Ethereum term for a derivative EVM compute resource.<br/>
             * The fee of computation for a smart contract transaction. The value of
             * gas is set by a conversion rate, and is regularly updated to reflect
             * reasonable and customary costs.
             */
            public gas: Long;

            /**
             * Ad valorem: "transferred value".<br/>
             * The fee for HBAR transferred by a transaction.
             */
            public tv: Long;

            /**
             * Response memory: "bytes per response".<br/>
             * The fee for data retrieved from memory to deliver a response,
             * measured in bytes
             */
            public bpr: Long;

            /**
             * Response disk: "storage bytes per response".<br/>
             * The fee for data retrieved from disk to deliver a response,
             * measured in bytes
             */
            public sbpr: Long;

            /**
             * Creates a new FeeComponents instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FeeComponents instance
             */
            public static create(properties?: proto.IFeeComponents): proto.FeeComponents;

            /**
             * Encodes the specified FeeComponents message. Does not implicitly {@link proto.FeeComponents.verify|verify} messages.
             * @param m FeeComponents message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFeeComponents, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeComponents message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FeeComponents
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FeeComponents;

            /**
             * Gets the default type url for FeeComponents
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TransactionFeeSchedule. */
        interface ITransactionFeeSchedule {

            /**
             * An enumeration for a particular transaction or query.<br/>
             * The functionality type determines the base cost parameters.
             */
            hederaFunctionality?: (proto.HederaFunctionality|null);

            /**
             * Use `fees` instead of this field.<br/>
             * Resource price coefficients.
             */
            feeData?: (proto.IFeeData|null);

            /**
             * The resource price coefficients for transaction type and any applicable
             * subtypes.<br/>
             * The multiple entries enable support for subtype price definitions.
             */
            fees?: (proto.IFeeData[]|null);
        }

        /** The fee schedule for a specific transaction or query based on the fee data. */
        class TransactionFeeSchedule implements ITransactionFeeSchedule {

            /**
             * Constructs a new TransactionFeeSchedule.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITransactionFeeSchedule);

            /**
             * An enumeration for a particular transaction or query.<br/>
             * The functionality type determines the base cost parameters.
             */
            public hederaFunctionality: proto.HederaFunctionality;

            /**
             * Use `fees` instead of this field.<br/>
             * Resource price coefficients.
             */
            public feeData?: (proto.IFeeData|null);

            /**
             * The resource price coefficients for transaction type and any applicable
             * subtypes.<br/>
             * The multiple entries enable support for subtype price definitions.
             */
            public fees: proto.IFeeData[];

            /**
             * Creates a new TransactionFeeSchedule instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransactionFeeSchedule instance
             */
            public static create(properties?: proto.ITransactionFeeSchedule): proto.TransactionFeeSchedule;

            /**
             * Encodes the specified TransactionFeeSchedule message. Does not implicitly {@link proto.TransactionFeeSchedule.verify|verify} messages.
             * @param m TransactionFeeSchedule message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITransactionFeeSchedule, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransactionFeeSchedule message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TransactionFeeSchedule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TransactionFeeSchedule;

            /**
             * Gets the default type url for TransactionFeeSchedule
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FeeData. */
        interface IFeeData {

            /** Fee components to be paid to the submitting node. */
            nodedata?: (proto.IFeeComponents|null);

            /**
             * Fee components to be paid to the network for bringing a
             * transaction to consensus.
             */
            networkdata?: (proto.IFeeComponents|null);

            /**
             * Fee components to be paid to the network for providing the immediate and
             * ongoing services associated with executing the transaction, maintaining
             * the network, and developing the network software.
             */
            servicedata?: (proto.IFeeComponents|null);

            /**
             * A sub-type distinguishing between different types of `FeeData` that may
             * apply to the same base transaction type (associated with
             * an `HederaFunctionality`).
             */
            subType?: (proto.SubType|null);
        }

        /**
         * A total fee, in component amounts charged for a transaction.
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
         */
        class FeeData implements IFeeData {

            /**
             * Constructs a new FeeData.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFeeData);

            /** Fee components to be paid to the submitting node. */
            public nodedata?: (proto.IFeeComponents|null);

            /**
             * Fee components to be paid to the network for bringing a
             * transaction to consensus.
             */
            public networkdata?: (proto.IFeeComponents|null);

            /**
             * Fee components to be paid to the network for providing the immediate and
             * ongoing services associated with executing the transaction, maintaining
             * the network, and developing the network software.
             */
            public servicedata?: (proto.IFeeComponents|null);

            /**
             * A sub-type distinguishing between different types of `FeeData` that may
             * apply to the same base transaction type (associated with
             * an `HederaFunctionality`).
             */
            public subType: proto.SubType;

            /**
             * Creates a new FeeData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FeeData instance
             */
            public static create(properties?: proto.IFeeData): proto.FeeData;

            /**
             * Encodes the specified FeeData message. Does not implicitly {@link proto.FeeData.verify|verify} messages.
             * @param m FeeData message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFeeData, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeData message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FeeData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FeeData;

            /**
             * Gets the default type url for FeeData
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FeeSchedule. */
        interface IFeeSchedule {

            /** Sets of fee coefficients for various transaction or query types. */
            transactionFeeSchedule?: (proto.ITransactionFeeSchedule[]|null);

            /**
             * A time, in seconds since the `epoch`, when this fee schedule
             * will expire.
             * <p>
             * For this purpose, `epoch` SHALL be the UNIX epoch
             * with 0 at `1970-01-01T00:00:00.000Z`.
             */
            expiryTime?: (proto.ITimestampSeconds|null);
        }

        /**
         * A set of fee schedules covering all transaction types and query types, along
         * with a specific time at which this fee schedule will expire.
         *
         * Nodes SHALL use the most recent unexpired fee schedule to determine the fees
         * for all transactions based on various resource components imputed to each
         * transaction.
         */
        class FeeSchedule implements IFeeSchedule {

            /**
             * Constructs a new FeeSchedule.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFeeSchedule);

            /** Sets of fee coefficients for various transaction or query types. */
            public transactionFeeSchedule: proto.ITransactionFeeSchedule[];

            /**
             * A time, in seconds since the `epoch`, when this fee schedule
             * will expire.
             * <p>
             * For this purpose, `epoch` SHALL be the UNIX epoch
             * with 0 at `1970-01-01T00:00:00.000Z`.
             */
            public expiryTime?: (proto.ITimestampSeconds|null);

            /**
             * Creates a new FeeSchedule instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FeeSchedule instance
             */
            public static create(properties?: proto.IFeeSchedule): proto.FeeSchedule;

            /**
             * Encodes the specified FeeSchedule message. Does not implicitly {@link proto.FeeSchedule.verify|verify} messages.
             * @param m FeeSchedule message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFeeSchedule, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeSchedule message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FeeSchedule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FeeSchedule;

            /**
             * Gets the default type url for FeeSchedule
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CurrentAndNextFeeSchedule. */
        interface ICurrentAndNextFeeSchedule {

            /** A current, unexpired, fee schedule. */
            currentFeeSchedule?: (proto.IFeeSchedule|null);

            /** A future fee schedule to use when the current schedule expires. */
            nextFeeSchedule?: (proto.IFeeSchedule|null);
        }

        /**
         * The "current" fee schedule and the "next" fee schedule.
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
         */
        class CurrentAndNextFeeSchedule implements ICurrentAndNextFeeSchedule {

            /**
             * Constructs a new CurrentAndNextFeeSchedule.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ICurrentAndNextFeeSchedule);

            /** A current, unexpired, fee schedule. */
            public currentFeeSchedule?: (proto.IFeeSchedule|null);

            /** A future fee schedule to use when the current schedule expires. */
            public nextFeeSchedule?: (proto.IFeeSchedule|null);

            /**
             * Creates a new CurrentAndNextFeeSchedule instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CurrentAndNextFeeSchedule instance
             */
            public static create(properties?: proto.ICurrentAndNextFeeSchedule): proto.CurrentAndNextFeeSchedule;

            /**
             * Encodes the specified CurrentAndNextFeeSchedule message. Does not implicitly {@link proto.CurrentAndNextFeeSchedule.verify|verify} messages.
             * @param m CurrentAndNextFeeSchedule message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ICurrentAndNextFeeSchedule, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CurrentAndNextFeeSchedule message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns CurrentAndNextFeeSchedule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.CurrentAndNextFeeSchedule;

            /**
             * Gets the default type url for CurrentAndNextFeeSchedule
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServiceEndpoint. */
        interface IServiceEndpoint {

            /**
             * A 32-bit IPv4 address.<br/>
             * This is the address of the endpoint, encoded in pure "big-endian"
             * (i.e. left to right) order (e.g. `127.0.0.1` has hex bytes in the
             * order `7F`, `00`, `00`, `01`).
             */
            ipAddressV4?: (Uint8Array|null);

            /**
             * A TCP port to use.
             * <p>
             * This value MUST be between 0 and 65535, inclusive.
             */
            port?: (number|null);

            /**
             * A node domain name.
             * <p>
             * This MUST be the fully qualified domain name of the node.<br/>
             * This value MUST NOT exceed 253 characters.<br/>
             * When the `domain_name` field is set, the `ipAddressV4`
             * field MUST NOT be set.<br/>
             * When the `ipAddressV4` field is set, the `domain_name`
             * field MUST NOT be set.
             */
            domainName?: (string|null);
        }

        /**
         * A network node endpoint.<br/>
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
         */
        class ServiceEndpoint implements IServiceEndpoint {

            /**
             * Constructs a new ServiceEndpoint.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IServiceEndpoint);

            /**
             * A 32-bit IPv4 address.<br/>
             * This is the address of the endpoint, encoded in pure "big-endian"
             * (i.e. left to right) order (e.g. `127.0.0.1` has hex bytes in the
             * order `7F`, `00`, `00`, `01`).
             */
            public ipAddressV4: Uint8Array;

            /**
             * A TCP port to use.
             * <p>
             * This value MUST be between 0 and 65535, inclusive.
             */
            public port: number;

            /**
             * A node domain name.
             * <p>
             * This MUST be the fully qualified domain name of the node.<br/>
             * This value MUST NOT exceed 253 characters.<br/>
             * When the `domain_name` field is set, the `ipAddressV4`
             * field MUST NOT be set.<br/>
             * When the `ipAddressV4` field is set, the `domain_name`
             * field MUST NOT be set.
             */
            public domainName: string;

            /**
             * Creates a new ServiceEndpoint instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServiceEndpoint instance
             */
            public static create(properties?: proto.IServiceEndpoint): proto.ServiceEndpoint;

            /**
             * Encodes the specified ServiceEndpoint message. Does not implicitly {@link proto.ServiceEndpoint.verify|verify} messages.
             * @param m ServiceEndpoint message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IServiceEndpoint, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceEndpoint message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ServiceEndpoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ServiceEndpoint;

            /**
             * Gets the default type url for ServiceEndpoint
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a NodeAddress. */
        interface INodeAddress {

            /**
             * ServiceEndpoint is now used to retrieve a node's list of IP
             * addresses and ports.<br/>
             * The IP address of the Node, as a string, encoded in UTF-8.<br/>
             * This value SHALL NOT be populated.
             */
            ipAddress?: (Uint8Array|null);

            /**
             * ServiceEndpoint is now used to retrieve a node's list of IP
             * addresses and ports.<br/>
             * The port number of the grpc server for the node.<br/>
             * This value SHALL NOT be populated.
             */
            portno?: (number|null);

            /**
             * Description provides short text functionality.<br/>
             * A short description of the node.
             * <p>
             * This field SHALL NOT be populated.
             */
            memo?: (Uint8Array|null);

            /**
             * A hexadecimal String encoding of an X509 public key.
             * <p>
             * This X509 RSA _public_ key SHALL be used to verify record stream files
             * (e.g., record stream files).<br/>
             * This field SHALL be a string of hexadecimal characters, encoded UTF-8,
             * which, translated to binary, form the public key DER encoding.
             */
            RSA_PubKey?: (string|null);

            /**
             * A numeric identifier for the node.
             * <p>
             * This value SHALL NOT be sequential.
             * <p>
             * A `0.0.101` field
             */
            nodeId?: (Long|null);

            /**
             * An account to be paid the "node" portion of transaction fees.<br/>
             * The "node" fees are paid to the node that submitted the transaction.
             * <p>
             * A `0.0.101` field
             */
            nodeAccountId?: (proto.IAccountID|null);

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
             */
            nodeCertHash?: (Uint8Array|null);

            /**
             * A node's service IP addresses and TCP ports.<br/>
             * Nodes require multiple endpoints to ensure that inter-node communication
             * (e.g. gossip) is properly separated from client communication to
             * API endpoints.
             * <p>
             * A `0.0.101` field
             */
            serviceEndpoint?: (proto.IServiceEndpoint[]|null);

            /**
             * A short description of the node.
             * <p>
             * This value, if set, MUST NOT exceed `transaction.maxMemoUtf8Bytes`
             * (default 100) bytes when encoded as UTF-8.
             */
            description?: (string|null);

            /**
             * This is replaced by per-account stake tracking and dynamic
             * calculation.<br/>
             * The amount of tinybar staked to the node.<br/>
             * This value SHOULD NOT be populated, and SHALL be ignored.
             */
            stake?: (Long|null);
        }

        /**
         * The data about a node, including its service endpoints and the Hedera account
         * to be paid for services provided by the node (that is, queries answered and
         * transactions submitted).
         *
         * All active fields are populated in the `0.0.102` address book file.<br/>
         * Only fields documented with "`0.0.101` field" are populated in the 0.0.101
         * address book file.
         *
         * This message MAY be superseded by messages in state/addressbook/node.proto
         * and node_get_info.proto.
         */
        class NodeAddress implements INodeAddress {

            /**
             * Constructs a new NodeAddress.
             * @param [p] Properties to set
             */
            constructor(p?: proto.INodeAddress);

            /**
             * ServiceEndpoint is now used to retrieve a node's list of IP
             * addresses and ports.<br/>
             * The IP address of the Node, as a string, encoded in UTF-8.<br/>
             * This value SHALL NOT be populated.
             */
            public ipAddress: Uint8Array;

            /**
             * ServiceEndpoint is now used to retrieve a node's list of IP
             * addresses and ports.<br/>
             * The port number of the grpc server for the node.<br/>
             * This value SHALL NOT be populated.
             */
            public portno: number;

            /**
             * Description provides short text functionality.<br/>
             * A short description of the node.
             * <p>
             * This field SHALL NOT be populated.
             */
            public memo: Uint8Array;

            /**
             * A hexadecimal String encoding of an X509 public key.
             * <p>
             * This X509 RSA _public_ key SHALL be used to verify record stream files
             * (e.g., record stream files).<br/>
             * This field SHALL be a string of hexadecimal characters, encoded UTF-8,
             * which, translated to binary, form the public key DER encoding.
             */
            public RSA_PubKey: string;

            /**
             * A numeric identifier for the node.
             * <p>
             * This value SHALL NOT be sequential.
             * <p>
             * A `0.0.101` field
             */
            public nodeId: Long;

            /**
             * An account to be paid the "node" portion of transaction fees.<br/>
             * The "node" fees are paid to the node that submitted the transaction.
             * <p>
             * A `0.0.101` field
             */
            public nodeAccountId?: (proto.IAccountID|null);

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
             */
            public nodeCertHash: Uint8Array;

            /**
             * A node's service IP addresses and TCP ports.<br/>
             * Nodes require multiple endpoints to ensure that inter-node communication
             * (e.g. gossip) is properly separated from client communication to
             * API endpoints.
             * <p>
             * A `0.0.101` field
             */
            public serviceEndpoint: proto.IServiceEndpoint[];

            /**
             * A short description of the node.
             * <p>
             * This value, if set, MUST NOT exceed `transaction.maxMemoUtf8Bytes`
             * (default 100) bytes when encoded as UTF-8.
             */
            public description: string;

            /**
             * This is replaced by per-account stake tracking and dynamic
             * calculation.<br/>
             * The amount of tinybar staked to the node.<br/>
             * This value SHOULD NOT be populated, and SHALL be ignored.
             */
            public stake: Long;

            /**
             * Creates a new NodeAddress instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NodeAddress instance
             */
            public static create(properties?: proto.INodeAddress): proto.NodeAddress;

            /**
             * Encodes the specified NodeAddress message. Does not implicitly {@link proto.NodeAddress.verify|verify} messages.
             * @param m NodeAddress message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.INodeAddress, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NodeAddress message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns NodeAddress
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.NodeAddress;

            /**
             * Gets the default type url for NodeAddress
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a NodeAddressBook. */
        interface INodeAddressBook {

            /** Published data for all nodes in the network */
            nodeAddress?: (proto.INodeAddress[]|null);
        }

        /**
         * A list of nodes and their metadata that contains details of the nodes
         * running the network.
         *
         * Used to parse the contents of system files `0.0.101` and `0.0.102`.
         */
        class NodeAddressBook implements INodeAddressBook {

            /**
             * Constructs a new NodeAddressBook.
             * @param [p] Properties to set
             */
            constructor(p?: proto.INodeAddressBook);

            /** Published data for all nodes in the network */
            public nodeAddress: proto.INodeAddress[];

            /**
             * Creates a new NodeAddressBook instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NodeAddressBook instance
             */
            public static create(properties?: proto.INodeAddressBook): proto.NodeAddressBook;

            /**
             * Encodes the specified NodeAddressBook message. Does not implicitly {@link proto.NodeAddressBook.verify|verify} messages.
             * @param m NodeAddressBook message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.INodeAddressBook, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NodeAddressBook message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns NodeAddressBook
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.NodeAddressBook;

            /**
             * Gets the default type url for NodeAddressBook
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SemanticVersion. */
        interface ISemanticVersion {

            /**
             * A major version.<br/>
             * Hedera does not increment this value and retains a `0` value to
             * indicate that API may change for any release.
             * <p>
             * This value SHALL increment for an incompatible API change.<br/>
             */
            major?: (number|null);

            /**
             * A minor version.<br/>
             * Hedera increments this value with each release.<br/>
             * There may be incompatible API changes in any Hedera Services release.
             * <p>
             * This value SHALL increment for backwards-compatible new
             * functionality.
             */
            minor?: (number|null);

            /**
             * A patch version.
             * <p>
             * This value SHALL increment for backwards-compatible bug fixes.
             */
            patch?: (number|null);

            /**
             * A pre-release version.
             * <p>
             * This MAY be denoted by appending a hyphen and a series of dot separated
             * identifiers per [Semver Specification](https://semver.org/#spec-item-9);
             * given a string `0.14.0-alpha.1+21AF26D3`, this field would contain
             * 'alpha.1'
             */
            pre?: (string|null);

            /**
             * A build version.
             * <p>
             * Build version MAY be denoted by appending a plus sign and a series of
             * dot separated identifiers immediately following the patch or pre-release
             * version per [Semver Specification](https://semver.org/#spec-item-10); so
             * given a string `0.14.0-alpha.1+21AF26D3`, this field
             * would contain '21AF26D3'
             */
            build?: (string|null);
        }

        /**
         * A software version according to "[semantic versioning](https://semver.org/)"
         * or "date versioning".
         *
         * Hedera currently modifies the "typical" semantic versioning somewhat, the
         * `major` version is always `0`, and each release increments the `minor`
         * version. The `patch` and `pre` components are used in the typical manner.
         * The `build` component is not generally used.
         */
        class SemanticVersion implements ISemanticVersion {

            /**
             * Constructs a new SemanticVersion.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ISemanticVersion);

            /**
             * A major version.<br/>
             * Hedera does not increment this value and retains a `0` value to
             * indicate that API may change for any release.
             * <p>
             * This value SHALL increment for an incompatible API change.<br/>
             */
            public major: number;

            /**
             * A minor version.<br/>
             * Hedera increments this value with each release.<br/>
             * There may be incompatible API changes in any Hedera Services release.
             * <p>
             * This value SHALL increment for backwards-compatible new
             * functionality.
             */
            public minor: number;

            /**
             * A patch version.
             * <p>
             * This value SHALL increment for backwards-compatible bug fixes.
             */
            public patch: number;

            /**
             * A pre-release version.
             * <p>
             * This MAY be denoted by appending a hyphen and a series of dot separated
             * identifiers per [Semver Specification](https://semver.org/#spec-item-9);
             * given a string `0.14.0-alpha.1+21AF26D3`, this field would contain
             * 'alpha.1'
             */
            public pre: string;

            /**
             * A build version.
             * <p>
             * Build version MAY be denoted by appending a plus sign and a series of
             * dot separated identifiers immediately following the patch or pre-release
             * version per [Semver Specification](https://semver.org/#spec-item-10); so
             * given a string `0.14.0-alpha.1+21AF26D3`, this field
             * would contain '21AF26D3'
             */
            public build: string;

            /**
             * Creates a new SemanticVersion instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SemanticVersion instance
             */
            public static create(properties?: proto.ISemanticVersion): proto.SemanticVersion;

            /**
             * Encodes the specified SemanticVersion message. Does not implicitly {@link proto.SemanticVersion.verify|verify} messages.
             * @param m SemanticVersion message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ISemanticVersion, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SemanticVersion message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns SemanticVersion
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.SemanticVersion;

            /**
             * Gets the default type url for SemanticVersion
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Setting. */
        interface ISetting {

            /** A name for this setting property. */
            name?: (string|null);

            /** A value for this setting property. */
            value?: (string|null);

            /**
             * A small quantity of data associated with this setting.
             * <p>
             * This SHOULD be less than 100 bytes.<br/>
             * If the value is a string, it MUST be encoded UTF-8.
             */
            data?: (Uint8Array|null);
        }

        /**
         * A single runtime configuration setting.
         *
         * Typically a name-value pair, this may also contain a small amount of
         * associated data.
         */
        class Setting implements ISetting {

            /**
             * Constructs a new Setting.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ISetting);

            /** A name for this setting property. */
            public name: string;

            /** A value for this setting property. */
            public value: string;

            /**
             * A small quantity of data associated with this setting.
             * <p>
             * This SHOULD be less than 100 bytes.<br/>
             * If the value is a string, it MUST be encoded UTF-8.
             */
            public data: Uint8Array;

            /**
             * Creates a new Setting instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Setting instance
             */
            public static create(properties?: proto.ISetting): proto.Setting;

            /**
             * Encodes the specified Setting message. Does not implicitly {@link proto.Setting.verify|verify} messages.
             * @param m Setting message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ISetting, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Setting message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Setting
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Setting;

            /**
             * Gets the default type url for Setting
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServicesConfigurationList. */
        interface IServicesConfigurationList {

            /** A List of `Setting` values, typically read from application properties. */
            nameValue?: (proto.ISetting[]|null);
        }

        /** Setting values representing a source of runtime configuration information. */
        class ServicesConfigurationList implements IServicesConfigurationList {

            /**
             * Constructs a new ServicesConfigurationList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IServicesConfigurationList);

            /** A List of `Setting` values, typically read from application properties. */
            public nameValue: proto.ISetting[];

            /**
             * Creates a new ServicesConfigurationList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServicesConfigurationList instance
             */
            public static create(properties?: proto.IServicesConfigurationList): proto.ServicesConfigurationList;

            /**
             * Encodes the specified ServicesConfigurationList message. Does not implicitly {@link proto.ServicesConfigurationList.verify|verify} messages.
             * @param m ServicesConfigurationList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IServicesConfigurationList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServicesConfigurationList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns ServicesConfigurationList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.ServicesConfigurationList;

            /**
             * Gets the default type url for ServicesConfigurationList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenRelationship. */
        interface ITokenRelationship {

            /**
             * A token identifier.
             * <p>
             * This MUST match an existing token that is not deleted.
             */
            tokenId?: (proto.ITokenID|null);

            /**
             * A token symbol.
             * <p>
             * This MUST match an existing token that is not deleted.<br/>
             * This MUST match the value for the token identified in `tokenId`.
             */
            symbol?: (string|null);

            /**
             * An account balance for this token.
             * <p>
             * For fungible/common tokens this SHALL be the balance that the
             * account holds of that token. The value is provided as an integer amount
             * of the smallest unit of the token (i.e. 10<sup>`-decimals`</sup> whole
             * tokens).<br/>
             * For non-fungible/unique tokens this SHALL be the whole number of
             * unique tokens held by the account for this token type.
             */
            balance?: (Long|null);

            /**
             * A KYC status for the account with respect to this token.
             * <p>
             * This may be `KycNotApplicable`, `Granted` or `Revoked` and, if KYC is
             * not supported for this token (e.g. the `kyc_key` of the token is not
             * set), this SHALL be `KycNotApplicable`.
             */
            kycStatus?: (proto.TokenKycStatus|null);

            /**
             * A Freeze status for the account with respect to this token.
             * <p>
             * This value SHALL be one of `FreezeNotApplicable`, `Frozen`
             * or `Unfrozen`.<br/>
             * If the token cannot freeze account assets (e.g. the `freeze_key` of the
             * token is not set), this SHALL be `FreezeNotApplicable`.
             */
            freezeStatus?: (proto.TokenFreezeStatus|null);

            /**
             * A maximum "precision" for this token.
             * <p>
             * This value MUST match the `decimals` field of the token identified in
             * the `tokenId` field.<br/>
             * A single whole token SHALL be divided into at most
             * 10<sup>`decimals`</sup> sub-units.
             */
            decimals?: (number|null);

            /**
             * An automatic association flag.
             * <p>
             * This SHALL be set if the relationship was created implicitly
             * (automatically).<br/>
             * This SHALL be unset if the relationship was created explicitly
             * (manually) via a `TokenAssociate` transaction.
             */
            automaticAssociation?: (boolean|null);
        }

        /**
         * An Hedera Token Service token relationship. A token relationship describes
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
         */
        class TokenRelationship implements ITokenRelationship {

            /**
             * Constructs a new TokenRelationship.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenRelationship);

            /**
             * A token identifier.
             * <p>
             * This MUST match an existing token that is not deleted.
             */
            public tokenId?: (proto.ITokenID|null);

            /**
             * A token symbol.
             * <p>
             * This MUST match an existing token that is not deleted.<br/>
             * This MUST match the value for the token identified in `tokenId`.
             */
            public symbol: string;

            /**
             * An account balance for this token.
             * <p>
             * For fungible/common tokens this SHALL be the balance that the
             * account holds of that token. The value is provided as an integer amount
             * of the smallest unit of the token (i.e. 10<sup>`-decimals`</sup> whole
             * tokens).<br/>
             * For non-fungible/unique tokens this SHALL be the whole number of
             * unique tokens held by the account for this token type.
             */
            public balance: Long;

            /**
             * A KYC status for the account with respect to this token.
             * <p>
             * This may be `KycNotApplicable`, `Granted` or `Revoked` and, if KYC is
             * not supported for this token (e.g. the `kyc_key` of the token is not
             * set), this SHALL be `KycNotApplicable`.
             */
            public kycStatus: proto.TokenKycStatus;

            /**
             * A Freeze status for the account with respect to this token.
             * <p>
             * This value SHALL be one of `FreezeNotApplicable`, `Frozen`
             * or `Unfrozen`.<br/>
             * If the token cannot freeze account assets (e.g. the `freeze_key` of the
             * token is not set), this SHALL be `FreezeNotApplicable`.
             */
            public freezeStatus: proto.TokenFreezeStatus;

            /**
             * A maximum "precision" for this token.
             * <p>
             * This value MUST match the `decimals` field of the token identified in
             * the `tokenId` field.<br/>
             * A single whole token SHALL be divided into at most
             * 10<sup>`decimals`</sup> sub-units.
             */
            public decimals: number;

            /**
             * An automatic association flag.
             * <p>
             * This SHALL be set if the relationship was created implicitly
             * (automatically).<br/>
             * This SHALL be unset if the relationship was created explicitly
             * (manually) via a `TokenAssociate` transaction.
             */
            public automaticAssociation: boolean;

            /**
             * Creates a new TokenRelationship instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenRelationship instance
             */
            public static create(properties?: proto.ITokenRelationship): proto.TokenRelationship;

            /**
             * Encodes the specified TokenRelationship message. Does not implicitly {@link proto.TokenRelationship.verify|verify} messages.
             * @param m TokenRelationship message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenRelationship, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenRelationship message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenRelationship
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenRelationship;

            /**
             * Gets the default type url for TokenRelationship
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenBalance. */
        interface ITokenBalance {

            /** A token identifier. */
            tokenId?: (proto.ITokenID|null);

            /**
             * A number of transferable units of the identified token.
             * <p>
             * For fungible/common tokens this SHALL be the balance, in units of
             * 10<sup>`-decimals`</sup> whole tokens.<br/>
             * For non-fungible/unique tokens, this SHALL be the number of
             * individual unique tokens in this balance.
             */
            balance?: (Long|null);

            /**
             * A number of "decimals" precision.
             * <p>
             * This MUST match the `decimals` value for the token identified by the
             * `tokenId` field.
             */
            decimals?: (number|null);
        }

        /**
         * A number of _transferable units_ of a specified token.
         *
         * The transferable unit of a token is its smallest denomination, as given by
         * the token's `decimals` property. Each minted token contains
         * 10<sup>`decimals`</sup> transferable units. For example, we could think of
         * the cent as the transferable unit of the US dollar (`decimals=2`); and the
         * tinybar as the transferable unit of HBAR (`decimals=8`).
         *
         * Transferable units are not directly comparable across different tokens.
         */
        class TokenBalance implements ITokenBalance {

            /**
             * Constructs a new TokenBalance.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenBalance);

            /** A token identifier. */
            public tokenId?: (proto.ITokenID|null);

            /**
             * A number of transferable units of the identified token.
             * <p>
             * For fungible/common tokens this SHALL be the balance, in units of
             * 10<sup>`-decimals`</sup> whole tokens.<br/>
             * For non-fungible/unique tokens, this SHALL be the number of
             * individual unique tokens in this balance.
             */
            public balance: Long;

            /**
             * A number of "decimals" precision.
             * <p>
             * This MUST match the `decimals` value for the token identified by the
             * `tokenId` field.
             */
            public decimals: number;

            /**
             * Creates a new TokenBalance instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenBalance instance
             */
            public static create(properties?: proto.ITokenBalance): proto.TokenBalance;

            /**
             * Encodes the specified TokenBalance message. Does not implicitly {@link proto.TokenBalance.verify|verify} messages.
             * @param m TokenBalance message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenBalance, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenBalance message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenBalance
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenBalance;

            /**
             * Gets the default type url for TokenBalance
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenBalances. */
        interface ITokenBalances {

            /**
             * A list of token balance values.<br/>
             * Each entry represents a single account balance for a single token.
             */
            tokenBalances?: (proto.ITokenBalance[]|null);
        }

        /**
         * A set of token balance values.
         *
         * Each entry describes the balance the enclosing account holds for a specific
         * token. The balance is an amount for a fungible/common token or a count for
         * a non-fungible/unique token.
         */
        class TokenBalances implements ITokenBalances {

            /**
             * Constructs a new TokenBalances.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenBalances);

            /**
             * A list of token balance values.<br/>
             * Each entry represents a single account balance for a single token.
             */
            public tokenBalances: proto.ITokenBalance[];

            /**
             * Creates a new TokenBalances instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenBalances instance
             */
            public static create(properties?: proto.ITokenBalances): proto.TokenBalances;

            /**
             * Encodes the specified TokenBalances message. Does not implicitly {@link proto.TokenBalances.verify|verify} messages.
             * @param m TokenBalances message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenBalances, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenBalances message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenBalances
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenBalances;

            /**
             * Gets the default type url for TokenBalances
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TokenAssociation. */
        interface ITokenAssociation {

            /** A token identifier for the associated token. */
            tokenId?: (proto.ITokenID|null);

            /** An account identifier for the associated account. */
            accountId?: (proto.IAccountID|null);
        }

        /**
         * An association between a token and an account.
         *
         * An account must be associated with a token before that account can transact
         * in (send or receive) that token.
         */
        class TokenAssociation implements ITokenAssociation {

            /**
             * Constructs a new TokenAssociation.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITokenAssociation);

            /** A token identifier for the associated token. */
            public tokenId?: (proto.ITokenID|null);

            /** An account identifier for the associated account. */
            public accountId?: (proto.IAccountID|null);

            /**
             * Creates a new TokenAssociation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TokenAssociation instance
             */
            public static create(properties?: proto.ITokenAssociation): proto.TokenAssociation;

            /**
             * Encodes the specified TokenAssociation message. Does not implicitly {@link proto.TokenAssociation.verify|verify} messages.
             * @param m TokenAssociation message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITokenAssociation, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TokenAssociation message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TokenAssociation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TokenAssociation;

            /**
             * Gets the default type url for TokenAssociation
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a StakingInfo. */
        interface IStakingInfo {

            /**
             * A flag indicating that the holder of this account has chosen to decline
             * staking rewards.
             */
            declineReward?: (boolean|null);

            /**
             * A `Timestamp` of the start time for the latest active staking period.
             * <p>
             * This MUST be a period during which either the staking settings for this
             * account or contract changed or the account or contract received staking
             * rewards, whichever is later. Examples of a change in staking settings
             * include starting staking or changing the staked_node_id.<br/>
             * If this account or contract is not currently staked to a node, then this
             * field SHALL NOT be set.
             */
            stakePeriodStart?: (proto.ITimestamp|null);

            /**
             * An amount, in tinybar, to be received in the next reward payout.<br/>
             * Rewards are not paid out immediately; for efficiency reasons rewards are
             * only paid out as part of another transaction involving that account.
             */
            pendingReward?: (Long|null);

            /**
             * A proxy-staked balance.<br/>
             * The total HBAR balance of all accounts that delegate staking to this
             * account or contract.
             */
            stakedToMe?: (Long|null);

            /**
             * A delegated stake.
             * <p>
             * This account delegates to the indicated account for staking purposes.
             */
            stakedAccountId?: (proto.IAccountID|null);

            /**
             * A direct stake.
             * <p>
             * This accounts stakes its balance to the designated node.
             */
            stakedNodeId?: (Long|null);
        }

        /**
         * Staking information for an account or a contract.
         *
         * This is used for responses returned from `CryptoGetInfo` or
         * `ContractGetInfo` queries.
         */
        class StakingInfo implements IStakingInfo {

            /**
             * Constructs a new StakingInfo.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IStakingInfo);

            /**
             * A flag indicating that the holder of this account has chosen to decline
             * staking rewards.
             */
            public declineReward: boolean;

            /**
             * A `Timestamp` of the start time for the latest active staking period.
             * <p>
             * This MUST be a period during which either the staking settings for this
             * account or contract changed or the account or contract received staking
             * rewards, whichever is later. Examples of a change in staking settings
             * include starting staking or changing the staked_node_id.<br/>
             * If this account or contract is not currently staked to a node, then this
             * field SHALL NOT be set.
             */
            public stakePeriodStart?: (proto.ITimestamp|null);

            /**
             * An amount, in tinybar, to be received in the next reward payout.<br/>
             * Rewards are not paid out immediately; for efficiency reasons rewards are
             * only paid out as part of another transaction involving that account.
             */
            public pendingReward: Long;

            /**
             * A proxy-staked balance.<br/>
             * The total HBAR balance of all accounts that delegate staking to this
             * account or contract.
             */
            public stakedToMe: Long;

            /**
             * A delegated stake.
             * <p>
             * This account delegates to the indicated account for staking purposes.
             */
            public stakedAccountId?: (proto.IAccountID|null);

            /**
             * A direct stake.
             * <p>
             * This accounts stakes its balance to the designated node.
             */
            public stakedNodeId?: (Long|null);

            /** StakingInfo stakedId. */
            public stakedId?: ("stakedAccountId"|"stakedNodeId");

            /**
             * Creates a new StakingInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns StakingInfo instance
             */
            public static create(properties?: proto.IStakingInfo): proto.StakingInfo;

            /**
             * Encodes the specified StakingInfo message. Does not implicitly {@link proto.StakingInfo.verify|verify} messages.
             * @param m StakingInfo message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IStakingInfo, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StakingInfo message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns StakingInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.StakingInfo;

            /**
             * Gets the default type url for StakingInfo
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PendingAirdropId. */
        interface IPendingAirdropId {

            /**
             * A sending account.
             * <p>
             * This is the account that initiated, and SHALL fund,
             * this pending airdrop.<br/>
             * This field is REQUIRED.
             */
            senderId?: (proto.IAccountID|null);

            /**
             * A receiving account.
             * <p>
             * This is the ID of the account that SHALL receive the airdrop.<br/>
             * This field is REQUIRED.
             */
            receiverId?: (proto.IAccountID|null);

            /**
             * A token identifier.<br/>
             * This is the type of token for a fungible/common token airdrop.
             * <p>
             * This field is REQUIRED for a fungible/common token and MUST NOT
             * be used for a non-fungible/unique token.
             */
            fungibleTokenType?: (proto.ITokenID|null);

            /**
             * The id of a single NFT<br/>
             * This is the type of token for a non-fungible/unique token airdrop
             * and consists of a Token ID and serial number.
             * <p>
             * This field is REQUIRED for a non-fungible/unique token and
             * MUST NOT be used for a fungible/common token.
             */
            nonFungibleToken?: (proto.INftID|null);
        }

        /**
         * A unique, composite, identifier for a pending airdrop.
         *
         * Each pending airdrop SHALL be uniquely identified by
         * a `PendingAirdropId`.<br/>
         * A `PendingAirdropId` SHALL be recorded when created and MUST be provided in
         * any transaction that would modify that pending airdrop
         * (such as a `claimAirdrop` or `cancelAirdrop`).
         */
        class PendingAirdropId implements IPendingAirdropId {

            /**
             * Constructs a new PendingAirdropId.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IPendingAirdropId);

            /**
             * A sending account.
             * <p>
             * This is the account that initiated, and SHALL fund,
             * this pending airdrop.<br/>
             * This field is REQUIRED.
             */
            public senderId?: (proto.IAccountID|null);

            /**
             * A receiving account.
             * <p>
             * This is the ID of the account that SHALL receive the airdrop.<br/>
             * This field is REQUIRED.
             */
            public receiverId?: (proto.IAccountID|null);

            /**
             * A token identifier.<br/>
             * This is the type of token for a fungible/common token airdrop.
             * <p>
             * This field is REQUIRED for a fungible/common token and MUST NOT
             * be used for a non-fungible/unique token.
             */
            public fungibleTokenType?: (proto.ITokenID|null);

            /**
             * The id of a single NFT<br/>
             * This is the type of token for a non-fungible/unique token airdrop
             * and consists of a Token ID and serial number.
             * <p>
             * This field is REQUIRED for a non-fungible/unique token and
             * MUST NOT be used for a fungible/common token.
             */
            public nonFungibleToken?: (proto.INftID|null);

            /** PendingAirdropId tokenReference. */
            public tokenReference?: ("fungibleTokenType"|"nonFungibleToken");

            /**
             * Creates a new PendingAirdropId instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PendingAirdropId instance
             */
            public static create(properties?: proto.IPendingAirdropId): proto.PendingAirdropId;

            /**
             * Encodes the specified PendingAirdropId message. Does not implicitly {@link proto.PendingAirdropId.verify|verify} messages.
             * @param m PendingAirdropId message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IPendingAirdropId, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PendingAirdropId message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns PendingAirdropId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.PendingAirdropId;

            /**
             * Gets the default type url for PendingAirdropId
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PendingAirdropValue. */
        interface IPendingAirdropValue {

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
             */
            amount?: (Long|null);
        }

        /**
         * A single pending airdrop value.
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
         */
        class PendingAirdropValue implements IPendingAirdropValue {

            /**
             * Constructs a new PendingAirdropValue.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IPendingAirdropValue);

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
             */
            public amount: Long;

            /**
             * Creates a new PendingAirdropValue instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PendingAirdropValue instance
             */
            public static create(properties?: proto.IPendingAirdropValue): proto.PendingAirdropValue;

            /**
             * Encodes the specified PendingAirdropValue message. Does not implicitly {@link proto.PendingAirdropValue.verify|verify} messages.
             * @param m PendingAirdropValue message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IPendingAirdropValue, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PendingAirdropValue message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns PendingAirdropValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.PendingAirdropValue;

            /**
             * Gets the default type url for PendingAirdropValue
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Duration. */
        interface IDuration {

            /** The number of seconds for this duration. */
            seconds?: (Long|null);
        }

        /**
         * A length of time in seconds.
         *
         * It is RECOMMENDED that this message be used whenever an amount of time,
         * rather than a specific point in time, is needed.
         */
        class Duration implements IDuration {

            /**
             * Constructs a new Duration.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IDuration);

            /** The number of seconds for this duration. */
            public seconds: Long;

            /**
             * Creates a new Duration instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Duration instance
             */
            public static create(properties?: proto.IDuration): proto.Duration;

            /**
             * Encodes the specified Duration message. Does not implicitly {@link proto.Duration.verify|verify} messages.
             * @param m Duration message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IDuration, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Duration message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Duration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Duration;

            /**
             * Gets the default type url for Duration
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FractionalFee. */
        interface IFractionalFee {

            /**
             * A Fraction of the transferred tokens to assess as a fee.<br/>
             * This value MUST be less than or equal to one.<br/>
             * This value MUST be greater than zero.
             */
            fractionalAmount?: (proto.IFraction|null);

            /**
             * A minimum fee to charge, in units of 10<sup>-decimals</sup> tokens.
             * <p>
             * This value is OPTIONAL, with a default of `0` indicating no minimum.<br/>
             * If set, this value MUST be greater than zero.<br/>
             * If set, all transfers SHALL pay at least this amount.
             */
            minimumAmount?: (Long|null);

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
             */
            maximumAmount?: (Long|null);

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
             */
            netOfTransfers?: (boolean|null);
        }

        /**
         * A descriptor for a fee based on a portion of the tokens transferred.
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
         */
        class FractionalFee implements IFractionalFee {

            /**
             * Constructs a new FractionalFee.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFractionalFee);

            /**
             * A Fraction of the transferred tokens to assess as a fee.<br/>
             * This value MUST be less than or equal to one.<br/>
             * This value MUST be greater than zero.
             */
            public fractionalAmount?: (proto.IFraction|null);

            /**
             * A minimum fee to charge, in units of 10<sup>-decimals</sup> tokens.
             * <p>
             * This value is OPTIONAL, with a default of `0` indicating no minimum.<br/>
             * If set, this value MUST be greater than zero.<br/>
             * If set, all transfers SHALL pay at least this amount.
             */
            public minimumAmount: Long;

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
             */
            public maximumAmount: Long;

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
             */
            public netOfTransfers: boolean;

            /**
             * Creates a new FractionalFee instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FractionalFee instance
             */
            public static create(properties?: proto.IFractionalFee): proto.FractionalFee;

            /**
             * Encodes the specified FractionalFee message. Does not implicitly {@link proto.FractionalFee.verify|verify} messages.
             * @param m FractionalFee message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFractionalFee, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FractionalFee message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FractionalFee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FractionalFee;

            /**
             * Gets the default type url for FractionalFee
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FixedFee. */
        interface IFixedFee {

            /**
             * The amount to assess for each transfer.
             * <p>
             * This value MUST be greater than `0`.<br/>
             * This amount is expressed in units of 10<sup>-decimals</sup> tokens.
             */
            amount?: (Long|null);

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
             */
            denominatingTokenId?: (proto.ITokenID|null);
        }

        /**
         * A fixed fee to assess for each token transfer, regardless of the
         * amount transferred.<br/>
         * This fee type describes a fixed fee for each transfer of a token type.
         *
         * The fee SHALL be charged to the `sender` for the token transfer
         * transaction.<br/>
         * This fee MAY be assessed in HBAR, the token type transferred, or any
         * other token type, as determined by the `denominating_token_id` field.
         */
        class FixedFee implements IFixedFee {

            /**
             * Constructs a new FixedFee.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFixedFee);

            /**
             * The amount to assess for each transfer.
             * <p>
             * This value MUST be greater than `0`.<br/>
             * This amount is expressed in units of 10<sup>-decimals</sup> tokens.
             */
            public amount: Long;

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
             */
            public denominatingTokenId?: (proto.ITokenID|null);

            /**
             * Creates a new FixedFee instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FixedFee instance
             */
            public static create(properties?: proto.IFixedFee): proto.FixedFee;

            /**
             * Encodes the specified FixedFee message. Does not implicitly {@link proto.FixedFee.verify|verify} messages.
             * @param m FixedFee message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFixedFee, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FixedFee message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FixedFee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FixedFee;

            /**
             * Gets the default type url for FixedFee
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RoyaltyFee. */
        interface IRoyaltyFee {

            /**
             * The fraction of fungible value exchanged for an NFT to collect
             * as royalty.
             * <p>
             * This SHALL be applied once to the total fungible value transferred
             * for the transaction.<br/>
             * There SHALL NOT be any adjustment based on multiple transfers
             * involving the NFT sender as part of a single transaction.
             */
            exchangeValueFraction?: (proto.IFraction|null);

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
             */
            fallbackFee?: (proto.IFixedFee|null);
        }

        /**
         * A fee to assess during a CryptoTransfer that changes ownership of a
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
         */
        class RoyaltyFee implements IRoyaltyFee {

            /**
             * Constructs a new RoyaltyFee.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IRoyaltyFee);

            /**
             * The fraction of fungible value exchanged for an NFT to collect
             * as royalty.
             * <p>
             * This SHALL be applied once to the total fungible value transferred
             * for the transaction.<br/>
             * There SHALL NOT be any adjustment based on multiple transfers
             * involving the NFT sender as part of a single transaction.
             */
            public exchangeValueFraction?: (proto.IFraction|null);

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
             */
            public fallbackFee?: (proto.IFixedFee|null);

            /**
             * Creates a new RoyaltyFee instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RoyaltyFee instance
             */
            public static create(properties?: proto.IRoyaltyFee): proto.RoyaltyFee;

            /**
             * Encodes the specified RoyaltyFee message. Does not implicitly {@link proto.RoyaltyFee.verify|verify} messages.
             * @param m RoyaltyFee message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IRoyaltyFee, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RoyaltyFee message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns RoyaltyFee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.RoyaltyFee;

            /**
             * Gets the default type url for RoyaltyFee
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CustomFee. */
        interface ICustomFee {

            /**
             * A fixed fee to be charged to the `sender` for every token transfer.
             * <p>
             * This type of fee MAY be defined for any token type.<br/>
             * This type of fee MAY be more consistent and reliable than
             * other types.
             */
            fixedFee?: (proto.IFixedFee|null);

            /**
             * A fee defined as a fraction of the tokens transferred.
             * <p>
             * This type of fee MUST NOT be defined for a non-fungible/unique
             * token type.<br/>
             * This fee MAY be charged to either sender, as an increase to the
             * amount sent, or receiver, as a reduction to the amount received.
             */
            fractionalFee?: (proto.IFractionalFee|null);

            /**
             * A fee charged as royalty for any transfer of a
             * non-fungible/unique token.
             * <p>
             * This type of fee MUST NOT be defined for a
             * fungible/common token type.
             */
            royaltyFee?: (proto.IRoyaltyFee|null);

            /** The account to receive the custom fee. */
            feeCollectorAccountId?: (proto.IAccountID|null);

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
             */
            allCollectorsAreExempt?: (boolean|null);
        }

        /**
         * A transfer fee to assess during a CryptoTransfer.<br/>
         * This fee applies to transactions that transfer units of the token to
         * which the fee is attached. A custom fee may be either fixed or fractional,
         * and must specify a fee collector account to receive the assessed fees.
         *
         * Custom fees MUST be greater than zero (0).
         */
        class CustomFee implements ICustomFee {

            /**
             * Constructs a new CustomFee.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ICustomFee);

            /**
             * A fixed fee to be charged to the `sender` for every token transfer.
             * <p>
             * This type of fee MAY be defined for any token type.<br/>
             * This type of fee MAY be more consistent and reliable than
             * other types.
             */
            public fixedFee?: (proto.IFixedFee|null);

            /**
             * A fee defined as a fraction of the tokens transferred.
             * <p>
             * This type of fee MUST NOT be defined for a non-fungible/unique
             * token type.<br/>
             * This fee MAY be charged to either sender, as an increase to the
             * amount sent, or receiver, as a reduction to the amount received.
             */
            public fractionalFee?: (proto.IFractionalFee|null);

            /**
             * A fee charged as royalty for any transfer of a
             * non-fungible/unique token.
             * <p>
             * This type of fee MUST NOT be defined for a
             * fungible/common token type.
             */
            public royaltyFee?: (proto.IRoyaltyFee|null);

            /** The account to receive the custom fee. */
            public feeCollectorAccountId?: (proto.IAccountID|null);

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
             */
            public allCollectorsAreExempt: boolean;

            /** CustomFee fee. */
            public fee?: ("fixedFee"|"fractionalFee"|"royaltyFee");

            /**
             * Creates a new CustomFee instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomFee instance
             */
            public static create(properties?: proto.ICustomFee): proto.CustomFee;

            /**
             * Encodes the specified CustomFee message. Does not implicitly {@link proto.CustomFee.verify|verify} messages.
             * @param m CustomFee message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ICustomFee, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomFee message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns CustomFee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.CustomFee;

            /**
             * Gets the default type url for CustomFee
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an AssessedCustomFee. */
        interface IAssessedCustomFee {

            /**
             * An amount of tokens assessed for this custom fee.
             * <p>
             * This shall be expressed in units of 10<sup>-decimals</sup> tokens.
             */
            amount?: (Long|null);

            /**
             * The token transferred to satisfy this fee.
             * <p>
             * If the token transferred is HBAR, this field SHALL NOT be set.
             */
            tokenId?: (proto.ITokenID|null);

            /**
             * An account that received the fee assessed.
             * <p>
             * This SHALL NOT be the sender or receiver of the original
             * cryptoTransfer transaction.
             */
            feeCollectorAccountId?: (proto.IAccountID|null);

            /**
             * An account that provided the tokens assessed as a fee.
             * <p>
             * This SHALL be the account that _would have_ had a higher balance
             * absent the fee. In most cases this SHALL be the `sender`, but
             * some _fractional_ fees reduce the amount transferred, and in those
             * cases the `receiver` SHALL be the effective payer for the fee.<br/>
             * There are currently no situations where a third party pays a custom
             * fee. This MAY change in a future release.
             */
            effectivePayerAccountId?: (proto.IAccountID[]|null);
        }

        /**
         * Description of a transfer added to a `cryptoTransfer` transaction that
         * satisfies custom fee requirements.
         *
         * It is important to note that this is not the actual transfer. The transfer
         * of value SHALL be merged into the original transaction to minimize the
         * number of actual transfers. This descriptor presents the fee assessed
         * separately in the record stream so that the details of the fee assessed
         * are not hidden in this process.
         */
        class AssessedCustomFee implements IAssessedCustomFee {

            /**
             * Constructs a new AssessedCustomFee.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IAssessedCustomFee);

            /**
             * An amount of tokens assessed for this custom fee.
             * <p>
             * This shall be expressed in units of 10<sup>-decimals</sup> tokens.
             */
            public amount: Long;

            /**
             * The token transferred to satisfy this fee.
             * <p>
             * If the token transferred is HBAR, this field SHALL NOT be set.
             */
            public tokenId?: (proto.ITokenID|null);

            /**
             * An account that received the fee assessed.
             * <p>
             * This SHALL NOT be the sender or receiver of the original
             * cryptoTransfer transaction.
             */
            public feeCollectorAccountId?: (proto.IAccountID|null);

            /**
             * An account that provided the tokens assessed as a fee.
             * <p>
             * This SHALL be the account that _would have_ had a higher balance
             * absent the fee. In most cases this SHALL be the `sender`, but
             * some _fractional_ fees reduce the amount transferred, and in those
             * cases the `receiver` SHALL be the effective payer for the fee.<br/>
             * There are currently no situations where a third party pays a custom
             * fee. This MAY change in a future release.
             */
            public effectivePayerAccountId: proto.IAccountID[];

            /**
             * Creates a new AssessedCustomFee instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AssessedCustomFee instance
             */
            public static create(properties?: proto.IAssessedCustomFee): proto.AssessedCustomFee;

            /**
             * Encodes the specified AssessedCustomFee message. Does not implicitly {@link proto.AssessedCustomFee.verify|verify} messages.
             * @param m AssessedCustomFee message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IAssessedCustomFee, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AssessedCustomFee message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns AssessedCustomFee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.AssessedCustomFee;

            /**
             * Gets the default type url for AssessedCustomFee
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FixedCustomFee. */
        interface IFixedCustomFee {

            /**
             * A fixed custom fee.
             * <p>
             * The amount of HBAR or other token described by this `FixedFee` SHALL
             * be charged to the transction payer for each message submitted to a
             * topic that assigns this consensus custom fee.
             */
            fixedFee?: (proto.IFixedFee|null);

            /**
             * A collection account identifier.
             * <p>
             * All amounts collected for this consensus custom fee SHALL be transferred
             * to the account identified by this field.
             */
            feeCollectorAccountId?: (proto.IAccountID|null);
        }

        /**
         * A custom fee definition for a consensus topic.
         * <p>
         * This fee definition is specific to an Hedera Consensus Service (HCS) topic
         * and SHOULD NOT be used in any other context.<br/>
         * All fields for this message are REQUIRED.<br/>
         * Only "fixed" fee definitions are supported because there is no basis for
         * a fractional fee on a consensus submit transaction.
         */
        class FixedCustomFee implements IFixedCustomFee {

            /**
             * Constructs a new FixedCustomFee.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFixedCustomFee);

            /**
             * A fixed custom fee.
             * <p>
             * The amount of HBAR or other token described by this `FixedFee` SHALL
             * be charged to the transction payer for each message submitted to a
             * topic that assigns this consensus custom fee.
             */
            public fixedFee?: (proto.IFixedFee|null);

            /**
             * A collection account identifier.
             * <p>
             * All amounts collected for this consensus custom fee SHALL be transferred
             * to the account identified by this field.
             */
            public feeCollectorAccountId?: (proto.IAccountID|null);

            /**
             * Creates a new FixedCustomFee instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FixedCustomFee instance
             */
            public static create(properties?: proto.IFixedCustomFee): proto.FixedCustomFee;

            /**
             * Encodes the specified FixedCustomFee message. Does not implicitly {@link proto.FixedCustomFee.verify|verify} messages.
             * @param m FixedCustomFee message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFixedCustomFee, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FixedCustomFee message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FixedCustomFee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FixedCustomFee;

            /**
             * Gets the default type url for FixedCustomFee
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FixedCustomFeeList. */
        interface IFixedCustomFeeList {

            /**
             * A set of custom fee definitions.<br/>
             * These are fees to be assessed for each submit to a topic.
             */
            fees?: (proto.IFixedCustomFee[]|null);
        }

        /**
         * A wrapper around a consensus custom fee list.<br/>
         * This wrapper exists to enable an update transaction to differentiate between
         * a field that is not set and an empty list of custom fees.
         * <p>
         * An _unset_ field of this type SHALL NOT modify existing values.<br/>
         * A _set_ field of this type with an empty `fees` list SHALL remove any
         * existing values.
         */
        class FixedCustomFeeList implements IFixedCustomFeeList {

            /**
             * Constructs a new FixedCustomFeeList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFixedCustomFeeList);

            /**
             * A set of custom fee definitions.<br/>
             * These are fees to be assessed for each submit to a topic.
             */
            public fees: proto.IFixedCustomFee[];

            /**
             * Creates a new FixedCustomFeeList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FixedCustomFeeList instance
             */
            public static create(properties?: proto.IFixedCustomFeeList): proto.FixedCustomFeeList;

            /**
             * Encodes the specified FixedCustomFeeList message. Does not implicitly {@link proto.FixedCustomFeeList.verify|verify} messages.
             * @param m FixedCustomFeeList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFixedCustomFeeList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FixedCustomFeeList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FixedCustomFeeList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FixedCustomFeeList;

            /**
             * Gets the default type url for FixedCustomFeeList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FeeExemptKeyList. */
        interface IFeeExemptKeyList {

            /**
             * A set of keys.<br/>
             * The keys in this list are permitted to submit messages to the
             * topic without paying the topic's custom fees.
             * <p>
             * If a submit transaction is signed by _any_ key included in this set,
             * custom fees SHALL NOT be charged for that transaction.
             */
            keys?: (proto.IKey[]|null);
        }

        /**
         * A wrapper for fee exempt key list.<br/>
         * This wrapper exists to enable an update transaction to differentiate between
         * a field that is not set and an empty list of keys.
         * <p>
         * An _unset_ field of this type SHALL NOT modify existing values.<br/>
         * A _set_ field of this type with an empty `keys` list SHALL remove any
         * existing values.
         */
        class FeeExemptKeyList implements IFeeExemptKeyList {

            /**
             * Constructs a new FeeExemptKeyList.
             * @param [p] Properties to set
             */
            constructor(p?: proto.IFeeExemptKeyList);

            /**
             * A set of keys.<br/>
             * The keys in this list are permitted to submit messages to the
             * topic without paying the topic's custom fees.
             * <p>
             * If a submit transaction is signed by _any_ key included in this set,
             * custom fees SHALL NOT be charged for that transaction.
             */
            public keys: proto.IKey[];

            /**
             * Creates a new FeeExemptKeyList instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FeeExemptKeyList instance
             */
            public static create(properties?: proto.IFeeExemptKeyList): proto.FeeExemptKeyList;

            /**
             * Encodes the specified FeeExemptKeyList message. Does not implicitly {@link proto.FeeExemptKeyList.verify|verify} messages.
             * @param m FeeExemptKeyList message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.IFeeExemptKeyList, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeExemptKeyList message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns FeeExemptKeyList
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.FeeExemptKeyList;

            /**
             * Gets the default type url for FeeExemptKeyList
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CustomFeeLimit. */
        interface ICustomFeeLimit {

            /** A payer account identifier. */
            accountId?: (proto.IAccountID|null);

            /** The maximum fees that the user is willing to pay for the message. */
            fees?: (proto.IFixedFee[]|null);
        }

        /**
         * A maximum custom fee that the user is willing to pay.
         * <p>
         * This message is used to specify the maximum custom fee that given user is
         * willing to pay.
         */
        class CustomFeeLimit implements ICustomFeeLimit {

            /**
             * Constructs a new CustomFeeLimit.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ICustomFeeLimit);

            /** A payer account identifier. */
            public accountId?: (proto.IAccountID|null);

            /** The maximum fees that the user is willing to pay for the message. */
            public fees: proto.IFixedFee[];

            /**
             * Creates a new CustomFeeLimit instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomFeeLimit instance
             */
            public static create(properties?: proto.ICustomFeeLimit): proto.CustomFeeLimit;

            /**
             * Encodes the specified CustomFeeLimit message. Does not implicitly {@link proto.CustomFeeLimit.verify|verify} messages.
             * @param m CustomFeeLimit message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ICustomFeeLimit, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomFeeLimit message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns CustomFeeLimit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.CustomFeeLimit;

            /**
             * Gets the default type url for CustomFeeLimit
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Timestamp. */
        interface ITimestamp {

            /**
             * The number of complete seconds since the start of the epoch.
             * <p>
             * For this purpose, `epoch` SHALL be the UNIX epoch with 0
             * at `1970-01-01T00:00:00.000Z`.<br/>
             * This value MUST be greater than 0.<br/>
             * This value SHOULD be strictly greater than `946684800`.
             */
            seconds?: (Long|null);

            /**
             * The number of nanoseconds after the start of the second referenced
             * in `seconds`.
             * <p>
             * This value MUST be greater than or equal to 0.<br/>
             * This value MUST be strictly less than 1,000,000,000.
             */
            nanos?: (number|null);
        }

        /**
         * An exact date and time.<br/>
         * This is the same data structure as the Google protobuf Timestamp.proto.
         *
         * #### Additional Notes
         * Useful information is present in comments on the
         * [Google version](https://github.com/google/protobuf/blob/master/src/google/protobuf/timestamp.proto).
         */
        class Timestamp implements ITimestamp {

            /**
             * Constructs a new Timestamp.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITimestamp);

            /**
             * The number of complete seconds since the start of the epoch.
             * <p>
             * For this purpose, `epoch` SHALL be the UNIX epoch with 0
             * at `1970-01-01T00:00:00.000Z`.<br/>
             * This value MUST be greater than 0.<br/>
             * This value SHOULD be strictly greater than `946684800`.
             */
            public seconds: Long;

            /**
             * The number of nanoseconds after the start of the second referenced
             * in `seconds`.
             * <p>
             * This value MUST be greater than or equal to 0.<br/>
             * This value MUST be strictly less than 1,000,000,000.
             */
            public nanos: number;

            /**
             * Creates a new Timestamp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Timestamp instance
             */
            public static create(properties?: proto.ITimestamp): proto.Timestamp;

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link proto.Timestamp.verify|verify} messages.
             * @param m Timestamp message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITimestamp, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.Timestamp;

            /**
             * Gets the default type url for Timestamp
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TimestampSeconds. */
        interface ITimestampSeconds {

            /**
             * The number of complete seconds since the start of the epoch.
             * <p>
             * For this purpose, `epoch` SHALL be the UNIX epoch with 0
             * at `1970-01-01T00:00:00.000Z`.<br/>
             * This value MUST be greater than 0.<br/>
             * This value SHOULD be strictly greater than `946684800`.
             */
            seconds?: (Long|null);
        }

        /** An exact date and time, with a resolution of one second. */
        class TimestampSeconds implements ITimestampSeconds {

            /**
             * Constructs a new TimestampSeconds.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITimestampSeconds);

            /**
             * The number of complete seconds since the start of the epoch.
             * <p>
             * For this purpose, `epoch` SHALL be the UNIX epoch with 0
             * at `1970-01-01T00:00:00.000Z`.<br/>
             * This value MUST be greater than 0.<br/>
             * This value SHOULD be strictly greater than `946684800`.
             */
            public seconds: Long;

            /**
             * Creates a new TimestampSeconds instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TimestampSeconds instance
             */
            public static create(properties?: proto.ITimestampSeconds): proto.TimestampSeconds;

            /**
             * Encodes the specified TimestampSeconds message. Does not implicitly {@link proto.TimestampSeconds.verify|verify} messages.
             * @param m TimestampSeconds message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITimestampSeconds, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TimestampSeconds message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TimestampSeconds
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TimestampSeconds;

            /**
             * Gets the default type url for TimestampSeconds
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }

    /** Namespace google. */
    namespace google {

        /** Namespace protobuf. */
        namespace protobuf {

            /** Properties of a UInt32Value. */
            interface IUInt32Value {

                /** The uint32 value. */
                value?: (number|null);
            }

            /** Wrapper message for `uint32`. */
            class UInt32Value implements IUInt32Value {

                /**
                 * Constructs a new UInt32Value.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IUInt32Value);

                /** The uint32 value. */
                public value: number;

                /**
                 * Creates a new UInt32Value instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UInt32Value instance
                 */
                public static create(properties?: google.protobuf.IUInt32Value): google.protobuf.UInt32Value;

                /**
                 * Encodes the specified UInt32Value message. Does not implicitly {@link google.protobuf.UInt32Value.verify|verify} messages.
                 * @param m UInt32Value message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IUInt32Value, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a UInt32Value message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns UInt32Value
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.UInt32Value;

                /**
                 * Gets the default type url for UInt32Value
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a StringValue. */
            interface IStringValue {

                /** The string value. */
                value?: (string|null);
            }

            /** Wrapper message for `string`. */
            class StringValue implements IStringValue {

                /**
                 * Constructs a new StringValue.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IStringValue);

                /** The string value. */
                public value: string;

                /**
                 * Creates a new StringValue instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns StringValue instance
                 */
                public static create(properties?: google.protobuf.IStringValue): google.protobuf.StringValue;

                /**
                 * Encodes the specified StringValue message. Does not implicitly {@link google.protobuf.StringValue.verify|verify} messages.
                 * @param m StringValue message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IStringValue, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a StringValue message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns StringValue
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.StringValue;

                /**
                 * Gets the default type url for StringValue
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a BoolValue. */
            interface IBoolValue {

                /** The bool value. */
                value?: (boolean|null);
            }

            /** Wrapper message for `bool`. */
            class BoolValue implements IBoolValue {

                /**
                 * Constructs a new BoolValue.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IBoolValue);

                /** The bool value. */
                public value: boolean;

                /**
                 * Creates a new BoolValue instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BoolValue instance
                 */
                public static create(properties?: google.protobuf.IBoolValue): google.protobuf.BoolValue;

                /**
                 * Encodes the specified BoolValue message. Does not implicitly {@link google.protobuf.BoolValue.verify|verify} messages.
                 * @param m BoolValue message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IBoolValue, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BoolValue message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns BoolValue
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.BoolValue;

                /**
                 * Gets the default type url for BoolValue
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a BytesValue. */
            interface IBytesValue {

                /** The bytes value. */
                value?: (Uint8Array|null);
            }

            /** Wrapper message for `bytes`. */
            class BytesValue implements IBytesValue {

                /**
                 * Constructs a new BytesValue.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IBytesValue);

                /** The bytes value. */
                public value: Uint8Array;

                /**
                 * Creates a new BytesValue instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BytesValue instance
                 */
                public static create(properties?: google.protobuf.IBytesValue): google.protobuf.BytesValue;

                /**
                 * Encodes the specified BytesValue message. Does not implicitly {@link google.protobuf.BytesValue.verify|verify} messages.
                 * @param m BytesValue message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IBytesValue, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BytesValue message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns BytesValue
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.BytesValue;

                /**
                 * Gets the default type url for BytesValue
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a UInt64Value. */
            interface IUInt64Value {

                /** The uint64 value. */
                value?: (Long|null);
            }

            /** Wrapper message for `uint64`. */
            class UInt64Value implements IUInt64Value {

                /**
                 * Constructs a new UInt64Value.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IUInt64Value);

                /** The uint64 value. */
                public value: Long;

                /**
                 * Creates a new UInt64Value instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UInt64Value instance
                 */
                public static create(properties?: google.protobuf.IUInt64Value): google.protobuf.UInt64Value;

                /**
                 * Encodes the specified UInt64Value message. Does not implicitly {@link google.protobuf.UInt64Value.verify|verify} messages.
                 * @param m UInt64Value message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IUInt64Value, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a UInt64Value message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns UInt64Value
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.UInt64Value;

                /**
                 * Gets the default type url for UInt64Value
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of an Int32Value. */
            interface IInt32Value {

                /** The int32 value. */
                value?: (number|null);
            }

            /** Wrapper message for `int32`. */
            class Int32Value implements IInt32Value {

                /**
                 * Constructs a new Int32Value.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IInt32Value);

                /** The int32 value. */
                public value: number;

                /**
                 * Creates a new Int32Value instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Int32Value instance
                 */
                public static create(properties?: google.protobuf.IInt32Value): google.protobuf.Int32Value;

                /**
                 * Encodes the specified Int32Value message. Does not implicitly {@link google.protobuf.Int32Value.verify|verify} messages.
                 * @param m Int32Value message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IInt32Value, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Int32Value message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns Int32Value
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.Int32Value;

                /**
                 * Gets the default type url for Int32Value
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of an Int64Value. */
            interface IInt64Value {

                /** The int64 value. */
                value?: (Long|null);
            }

            /** Wrapper message for `int64`. */
            class Int64Value implements IInt64Value {

                /**
                 * Constructs a new Int64Value.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IInt64Value);

                /** The int64 value. */
                public value: Long;

                /**
                 * Creates a new Int64Value instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Int64Value instance
                 */
                public static create(properties?: google.protobuf.IInt64Value): google.protobuf.Int64Value;

                /**
                 * Encodes the specified Int64Value message. Does not implicitly {@link google.protobuf.Int64Value.verify|verify} messages.
                 * @param m Int64Value message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IInt64Value, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Int64Value message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns Int64Value
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.Int64Value;

                /**
                 * Gets the default type url for Int64Value
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a FloatValue. */
            interface IFloatValue {

                /** The float value. */
                value?: (number|null);
            }

            /** Wrapper message for `float`. */
            class FloatValue implements IFloatValue {

                /**
                 * Constructs a new FloatValue.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IFloatValue);

                /** The float value. */
                public value: number;

                /**
                 * Creates a new FloatValue instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns FloatValue instance
                 */
                public static create(properties?: google.protobuf.IFloatValue): google.protobuf.FloatValue;

                /**
                 * Encodes the specified FloatValue message. Does not implicitly {@link google.protobuf.FloatValue.verify|verify} messages.
                 * @param m FloatValue message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IFloatValue, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a FloatValue message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns FloatValue
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.FloatValue;

                /**
                 * Gets the default type url for FloatValue
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a DoubleValue. */
            interface IDoubleValue {

                /** The double value. */
                value?: (number|null);
            }

            /** Wrapper message for `double`. */
            class DoubleValue implements IDoubleValue {

                /**
                 * Constructs a new DoubleValue.
                 * @param [p] Properties to set
                 */
                constructor(p?: google.protobuf.IDoubleValue);

                /** The double value. */
                public value: number;

                /**
                 * Creates a new DoubleValue instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns DoubleValue instance
                 */
                public static create(properties?: google.protobuf.IDoubleValue): google.protobuf.DoubleValue;

                /**
                 * Encodes the specified DoubleValue message. Does not implicitly {@link google.protobuf.DoubleValue.verify|verify} messages.
                 * @param m DoubleValue message or plain object to encode
                 * @param [w] Writer to encode to
                 * @returns Writer
                 */
                public static encode(m: google.protobuf.IDoubleValue, w?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DoubleValue message from the specified reader or buffer.
                 * @param r Reader or buffer to decode from
                 * @param [l] Message length if known beforehand
                 * @returns DoubleValue
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): google.protobuf.DoubleValue;

                /**
                 * Gets the default type url for DoubleValue
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }
}
