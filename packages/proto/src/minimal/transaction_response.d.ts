import * as $protobuf from "protobufjs";
import Long = require("long");
export = transaction_response;

declare namespace transaction_response {


    /** Namespace proto. */
    namespace proto {

        /** Properties of a TransactionResponse. */
        interface ITransactionResponse {

            /**
             * A pre-consensus response code.
             * <p>
             * This response SHALL represent the response of the individual node, and
             * SHALL NOT represent the consensus of the network.
             */
            nodeTransactionPrecheckCode?: (proto.ResponseCodeEnum|null);

            /**
             * An approximate transaction fee.
             * <p>
             * This value SHALL be `0` unless the `nodeTransactionPrecheckCode` is
             * `INSUFFICIENT_TX_FEE`.<br/>
             * This value SHOULD be an amount, in tinybar, that _would have_ succeeded
             * at the time the transaction was submitted.<br/>
             * Note that this amount is not guaranteed to succeed in a future
             * transaction due to uncontrolled variables, such as network congestion,
             * but should be considered a close approximation.
             */
            cost?: (Long|null);
        }

        /**
         * A message sent by a node in response to a transaction submission.<br/>
         * This message only acknowledges that the individual node has checked
         * the transaction, completed pre-check, and checked the fee offered.
         *
         * If the transaction fee is not sufficient, the `nodeTransactionPrecheckCode`
         * value SHALL be `INSUFFICIENT_TX_FEE` and the `cost` field SHALL be the
         * actual transaction fee, in tinybar, required.<br/>
         * If the client requires acknowledgement of the network consensus result
         * for a transaction, the client SHOULD request a transaction receipt or
         * detailed transaction record. A client MAY also obtain network consensus
         * results from a mirror node.
         */
        class TransactionResponse implements ITransactionResponse {

            /**
             * Constructs a new TransactionResponse.
             * @param [p] Properties to set
             */
            constructor(p?: proto.ITransactionResponse);

            /**
             * A pre-consensus response code.
             * <p>
             * This response SHALL represent the response of the individual node, and
             * SHALL NOT represent the consensus of the network.
             */
            public nodeTransactionPrecheckCode: proto.ResponseCodeEnum;

            /**
             * An approximate transaction fee.
             * <p>
             * This value SHALL be `0` unless the `nodeTransactionPrecheckCode` is
             * `INSUFFICIENT_TX_FEE`.<br/>
             * This value SHOULD be an amount, in tinybar, that _would have_ succeeded
             * at the time the transaction was submitted.<br/>
             * Note that this amount is not guaranteed to succeed in a future
             * transaction due to uncontrolled variables, such as network congestion,
             * but should be considered a close approximation.
             */
            public cost: Long;

            /**
             * Creates a new TransactionResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransactionResponse instance
             */
            public static create(properties?: proto.ITransactionResponse): proto.TransactionResponse;

            /**
             * Encodes the specified TransactionResponse message. Does not implicitly {@link proto.TransactionResponse.verify|verify} messages.
             * @param m TransactionResponse message or plain object to encode
             * @param [w] Writer to encode to
             * @returns Writer
             */
            public static encode(m: proto.ITransactionResponse, w?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransactionResponse message from the specified reader or buffer.
             * @param r Reader or buffer to decode from
             * @param [l] Message length if known beforehand
             * @returns TransactionResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.TransactionResponse;

            /**
             * Gets the default type url for TransactionResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** An enumeration of possible response codes. */
        enum ResponseCodeEnum {
            OK = 0,
            INVALID_TRANSACTION = 1,
            PAYER_ACCOUNT_NOT_FOUND = 2,
            INVALID_NODE_ACCOUNT = 3,
            TRANSACTION_EXPIRED = 4,
            INVALID_TRANSACTION_START = 5,
            INVALID_TRANSACTION_DURATION = 6,
            INVALID_SIGNATURE = 7,
            MEMO_TOO_LONG = 8,
            INSUFFICIENT_TX_FEE = 9,
            INSUFFICIENT_PAYER_BALANCE = 10,
            DUPLICATE_TRANSACTION = 11,
            BUSY = 12,
            NOT_SUPPORTED = 13,
            INVALID_FILE_ID = 14,
            INVALID_ACCOUNT_ID = 15,
            INVALID_CONTRACT_ID = 16,
            INVALID_TRANSACTION_ID = 17,
            RECEIPT_NOT_FOUND = 18,
            RECORD_NOT_FOUND = 19,
            INVALID_SOLIDITY_ID = 20,
            UNKNOWN = 21,
            SUCCESS = 22,
            FAIL_INVALID = 23,
            FAIL_FEE = 24,
            FAIL_BALANCE = 25,
            KEY_REQUIRED = 26,
            BAD_ENCODING = 27,
            INSUFFICIENT_ACCOUNT_BALANCE = 28,
            INVALID_SOLIDITY_ADDRESS = 29,
            INSUFFICIENT_GAS = 30,
            CONTRACT_SIZE_LIMIT_EXCEEDED = 31,
            LOCAL_CALL_MODIFICATION_EXCEPTION = 32,
            CONTRACT_REVERT_EXECUTED = 33,
            CONTRACT_EXECUTION_EXCEPTION = 34,
            INVALID_RECEIVING_NODE_ACCOUNT = 35,
            MISSING_QUERY_HEADER = 36,
            ACCOUNT_UPDATE_FAILED = 37,
            INVALID_KEY_ENCODING = 38,
            NULL_SOLIDITY_ADDRESS = 39,
            CONTRACT_UPDATE_FAILED = 40,
            INVALID_QUERY_HEADER = 41,
            INVALID_FEE_SUBMITTED = 42,
            INVALID_PAYER_SIGNATURE = 43,
            KEY_NOT_PROVIDED = 44,
            INVALID_EXPIRATION_TIME = 45,
            NO_WACL_KEY = 46,
            FILE_CONTENT_EMPTY = 47,
            INVALID_ACCOUNT_AMOUNTS = 48,
            EMPTY_TRANSACTION_BODY = 49,
            INVALID_TRANSACTION_BODY = 50,
            INVALID_SIGNATURE_TYPE_MISMATCHING_KEY = 51,
            INVALID_SIGNATURE_COUNT_MISMATCHING_KEY = 52,
            EMPTY_LIVE_HASH_BODY = 53,
            EMPTY_LIVE_HASH = 54,
            EMPTY_LIVE_HASH_KEYS = 55,
            INVALID_LIVE_HASH_SIZE = 56,
            EMPTY_QUERY_BODY = 57,
            EMPTY_LIVE_HASH_QUERY = 58,
            LIVE_HASH_NOT_FOUND = 59,
            ACCOUNT_ID_DOES_NOT_EXIST = 60,
            LIVE_HASH_ALREADY_EXISTS = 61,
            INVALID_FILE_WACL = 62,
            SERIALIZATION_FAILED = 63,
            TRANSACTION_OVERSIZE = 64,
            TRANSACTION_TOO_MANY_LAYERS = 65,
            CONTRACT_DELETED = 66,
            PLATFORM_NOT_ACTIVE = 67,
            KEY_PREFIX_MISMATCH = 68,
            PLATFORM_TRANSACTION_NOT_CREATED = 69,
            INVALID_RENEWAL_PERIOD = 70,
            INVALID_PAYER_ACCOUNT_ID = 71,
            ACCOUNT_DELETED = 72,
            FILE_DELETED = 73,
            ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS = 74,
            SETTING_NEGATIVE_ACCOUNT_BALANCE = 75,
            OBTAINER_REQUIRED = 76,
            OBTAINER_SAME_CONTRACT_ID = 77,
            OBTAINER_DOES_NOT_EXIST = 78,
            MODIFYING_IMMUTABLE_CONTRACT = 79,
            FILE_SYSTEM_EXCEPTION = 80,
            AUTORENEW_DURATION_NOT_IN_RANGE = 81,
            ERROR_DECODING_BYTESTRING = 82,
            CONTRACT_FILE_EMPTY = 83,
            CONTRACT_BYTECODE_EMPTY = 84,
            INVALID_INITIAL_BALANCE = 85,
            INVALID_RECEIVE_RECORD_THRESHOLD = 86,
            INVALID_SEND_RECORD_THRESHOLD = 87,
            ACCOUNT_IS_NOT_GENESIS_ACCOUNT = 88,
            PAYER_ACCOUNT_UNAUTHORIZED = 89,
            INVALID_FREEZE_TRANSACTION_BODY = 90,
            FREEZE_TRANSACTION_BODY_NOT_FOUND = 91,
            TRANSFER_LIST_SIZE_LIMIT_EXCEEDED = 92,
            RESULT_SIZE_LIMIT_EXCEEDED = 93,
            NOT_SPECIAL_ACCOUNT = 94,
            CONTRACT_NEGATIVE_GAS = 95,
            CONTRACT_NEGATIVE_VALUE = 96,
            INVALID_FEE_FILE = 97,
            INVALID_EXCHANGE_RATE_FILE = 98,
            INSUFFICIENT_LOCAL_CALL_GAS = 99,
            ENTITY_NOT_ALLOWED_TO_DELETE = 100,
            AUTHORIZATION_FAILED = 101,
            FILE_UPLOADED_PROTO_INVALID = 102,
            FILE_UPLOADED_PROTO_NOT_SAVED_TO_DISK = 103,
            FEE_SCHEDULE_FILE_PART_UPLOADED = 104,
            EXCHANGE_RATE_CHANGE_LIMIT_EXCEEDED = 105,
            MAX_CONTRACT_STORAGE_EXCEEDED = 106,
            TRANSFER_ACCOUNT_SAME_AS_DELETE_ACCOUNT = 107,
            TOTAL_LEDGER_BALANCE_INVALID = 108,
            EXPIRATION_REDUCTION_NOT_ALLOWED = 110,
            MAX_GAS_LIMIT_EXCEEDED = 111,
            MAX_FILE_SIZE_EXCEEDED = 112,
            RECEIVER_SIG_REQUIRED = 113,
            INVALID_TOPIC_ID = 150,
            INVALID_ADMIN_KEY = 155,
            INVALID_SUBMIT_KEY = 156,
            UNAUTHORIZED = 157,
            INVALID_TOPIC_MESSAGE = 158,
            INVALID_AUTORENEW_ACCOUNT = 159,
            AUTORENEW_ACCOUNT_NOT_ALLOWED = 160,
            TOPIC_EXPIRED = 162,
            INVALID_CHUNK_NUMBER = 163,
            INVALID_CHUNK_TRANSACTION_ID = 164,
            ACCOUNT_FROZEN_FOR_TOKEN = 165,
            TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED = 166,
            INVALID_TOKEN_ID = 167,
            INVALID_TOKEN_DECIMALS = 168,
            INVALID_TOKEN_INITIAL_SUPPLY = 169,
            INVALID_TREASURY_ACCOUNT_FOR_TOKEN = 170,
            INVALID_TOKEN_SYMBOL = 171,
            TOKEN_HAS_NO_FREEZE_KEY = 172,
            TRANSFERS_NOT_ZERO_SUM_FOR_TOKEN = 173,
            MISSING_TOKEN_SYMBOL = 174,
            TOKEN_SYMBOL_TOO_LONG = 175,
            ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN = 176,
            TOKEN_HAS_NO_KYC_KEY = 177,
            INSUFFICIENT_TOKEN_BALANCE = 178,
            TOKEN_WAS_DELETED = 179,
            TOKEN_HAS_NO_SUPPLY_KEY = 180,
            TOKEN_HAS_NO_WIPE_KEY = 181,
            INVALID_TOKEN_MINT_AMOUNT = 182,
            INVALID_TOKEN_BURN_AMOUNT = 183,
            TOKEN_NOT_ASSOCIATED_TO_ACCOUNT = 184,
            CANNOT_WIPE_TOKEN_TREASURY_ACCOUNT = 185,
            INVALID_KYC_KEY = 186,
            INVALID_WIPE_KEY = 187,
            INVALID_FREEZE_KEY = 188,
            INVALID_SUPPLY_KEY = 189,
            MISSING_TOKEN_NAME = 190,
            TOKEN_NAME_TOO_LONG = 191,
            INVALID_WIPING_AMOUNT = 192,
            TOKEN_IS_IMMUTABLE = 193,
            TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT = 194,
            TRANSACTION_REQUIRES_ZERO_TOKEN_BALANCES = 195,
            ACCOUNT_IS_TREASURY = 196,
            TOKEN_ID_REPEATED_IN_TOKEN_LIST = 197,
            TOKEN_TRANSFER_LIST_SIZE_LIMIT_EXCEEDED = 198,
            EMPTY_TOKEN_TRANSFER_BODY = 199,
            EMPTY_TOKEN_TRANSFER_ACCOUNT_AMOUNTS = 200,
            INVALID_SCHEDULE_ID = 201,
            SCHEDULE_IS_IMMUTABLE = 202,
            INVALID_SCHEDULE_PAYER_ID = 203,
            INVALID_SCHEDULE_ACCOUNT_ID = 204,
            NO_NEW_VALID_SIGNATURES = 205,
            UNRESOLVABLE_REQUIRED_SIGNERS = 206,
            SCHEDULED_TRANSACTION_NOT_IN_WHITELIST = 207,
            SOME_SIGNATURES_WERE_INVALID = 208,
            TRANSACTION_ID_FIELD_NOT_ALLOWED = 209,
            IDENTICAL_SCHEDULE_ALREADY_CREATED = 210,
            INVALID_ZERO_BYTE_IN_STRING = 211,
            SCHEDULE_ALREADY_DELETED = 212,
            SCHEDULE_ALREADY_EXECUTED = 213,
            MESSAGE_SIZE_TOO_LARGE = 214,
            OPERATION_REPEATED_IN_BUCKET_GROUPS = 215,
            BUCKET_CAPACITY_OVERFLOW = 216,
            NODE_CAPACITY_NOT_SUFFICIENT_FOR_OPERATION = 217,
            BUCKET_HAS_NO_THROTTLE_GROUPS = 218,
            THROTTLE_GROUP_HAS_ZERO_OPS_PER_SEC = 219,
            SUCCESS_BUT_MISSING_EXPECTED_OPERATION = 220,
            UNPARSEABLE_THROTTLE_DEFINITIONS = 221,
            INVALID_THROTTLE_DEFINITIONS = 222,
            ACCOUNT_EXPIRED_AND_PENDING_REMOVAL = 223,
            INVALID_TOKEN_MAX_SUPPLY = 224,
            INVALID_TOKEN_NFT_SERIAL_NUMBER = 225,
            INVALID_NFT_ID = 226,
            METADATA_TOO_LONG = 227,
            BATCH_SIZE_LIMIT_EXCEEDED = 228,
            INVALID_QUERY_RANGE = 229,
            FRACTION_DIVIDES_BY_ZERO = 230,
            INSUFFICIENT_PAYER_BALANCE_FOR_CUSTOM_FEE = 231,
            CUSTOM_FEES_LIST_TOO_LONG = 232,
            INVALID_CUSTOM_FEE_COLLECTOR = 233,
            INVALID_TOKEN_ID_IN_CUSTOM_FEES = 234,
            TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR = 235,
            TOKEN_MAX_SUPPLY_REACHED = 236,
            SENDER_DOES_NOT_OWN_NFT_SERIAL_NO = 237,
            CUSTOM_FEE_NOT_FULLY_SPECIFIED = 238,
            CUSTOM_FEE_MUST_BE_POSITIVE = 239,
            TOKEN_HAS_NO_FEE_SCHEDULE_KEY = 240,
            CUSTOM_FEE_OUTSIDE_NUMERIC_RANGE = 241,
            ROYALTY_FRACTION_CANNOT_EXCEED_ONE = 242,
            FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT = 243,
            CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES = 244,
            CUSTOM_FEE_DENOMINATION_MUST_BE_FUNGIBLE_COMMON = 245,
            CUSTOM_FRACTIONAL_FEE_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON = 246,
            INVALID_CUSTOM_FEE_SCHEDULE_KEY = 247,
            INVALID_TOKEN_MINT_METADATA = 248,
            INVALID_TOKEN_BURN_METADATA = 249,
            CURRENT_TREASURY_STILL_OWNS_NFTS = 250,
            ACCOUNT_STILL_OWNS_NFTS = 251,
            TREASURY_MUST_OWN_BURNED_NFT = 252,
            ACCOUNT_DOES_NOT_OWN_WIPED_NFT = 253,
            ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON = 254,
            MAX_NFTS_IN_PRICE_REGIME_HAVE_BEEN_MINTED = 255,
            PAYER_ACCOUNT_DELETED = 256,
            CUSTOM_FEE_CHARGING_EXCEEDED_MAX_RECURSION_DEPTH = 257,
            CUSTOM_FEE_CHARGING_EXCEEDED_MAX_ACCOUNT_AMOUNTS = 258,
            INSUFFICIENT_SENDER_ACCOUNT_BALANCE_FOR_CUSTOM_FEE = 259,
            SERIAL_NUMBER_LIMIT_REACHED = 260,
            CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE = 261,
            NO_REMAINING_AUTOMATIC_ASSOCIATIONS = 262,
            EXISTING_AUTOMATIC_ASSOCIATIONS_EXCEED_GIVEN_LIMIT = 263,
            REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT = 264,
            TOKEN_IS_PAUSED = 265,
            TOKEN_HAS_NO_PAUSE_KEY = 266,
            INVALID_PAUSE_KEY = 267,
            FREEZE_UPDATE_FILE_DOES_NOT_EXIST = 268,
            FREEZE_UPDATE_FILE_HASH_DOES_NOT_MATCH = 269,
            NO_UPGRADE_HAS_BEEN_PREPARED = 270,
            NO_FREEZE_IS_SCHEDULED = 271,
            UPDATE_FILE_HASH_CHANGED_SINCE_PREPARE_UPGRADE = 272,
            FREEZE_START_TIME_MUST_BE_FUTURE = 273,
            PREPARED_UPDATE_FILE_IS_IMMUTABLE = 274,
            FREEZE_ALREADY_SCHEDULED = 275,
            FREEZE_UPGRADE_IN_PROGRESS = 276,
            UPDATE_FILE_ID_DOES_NOT_MATCH_PREPARED = 277,
            UPDATE_FILE_HASH_DOES_NOT_MATCH_PREPARED = 278,
            CONSENSUS_GAS_EXHAUSTED = 279,
            REVERTED_SUCCESS = 280,
            MAX_STORAGE_IN_PRICE_REGIME_HAS_BEEN_USED = 281,
            INVALID_ALIAS_KEY = 282,
            UNEXPECTED_TOKEN_DECIMALS = 283,
            INVALID_PROXY_ACCOUNT_ID = 284,
            INVALID_TRANSFER_ACCOUNT_ID = 285,
            INVALID_FEE_COLLECTOR_ACCOUNT_ID = 286,
            ALIAS_IS_IMMUTABLE = 287,
            SPENDER_ACCOUNT_SAME_AS_OWNER = 288,
            AMOUNT_EXCEEDS_TOKEN_MAX_SUPPLY = 289,
            NEGATIVE_ALLOWANCE_AMOUNT = 290,
            CANNOT_APPROVE_FOR_ALL_FUNGIBLE_COMMON = 291,
            SPENDER_DOES_NOT_HAVE_ALLOWANCE = 292,
            AMOUNT_EXCEEDS_ALLOWANCE = 293,
            MAX_ALLOWANCES_EXCEEDED = 294,
            EMPTY_ALLOWANCES = 295,
            SPENDER_ACCOUNT_REPEATED_IN_ALLOWANCES = 296,
            REPEATED_SERIAL_NUMS_IN_NFT_ALLOWANCES = 297,
            FUNGIBLE_TOKEN_IN_NFT_ALLOWANCES = 298,
            NFT_IN_FUNGIBLE_TOKEN_ALLOWANCES = 299,
            INVALID_ALLOWANCE_OWNER_ID = 300,
            INVALID_ALLOWANCE_SPENDER_ID = 301,
            REPEATED_ALLOWANCES_TO_DELETE = 302,
            INVALID_DELEGATING_SPENDER = 303,
            DELEGATING_SPENDER_CANNOT_GRANT_APPROVE_FOR_ALL = 304,
            DELEGATING_SPENDER_DOES_NOT_HAVE_APPROVE_FOR_ALL = 305,
            SCHEDULE_EXPIRATION_TIME_TOO_FAR_IN_FUTURE = 306,
            SCHEDULE_EXPIRATION_TIME_MUST_BE_HIGHER_THAN_CONSENSUS_TIME = 307,
            SCHEDULE_FUTURE_THROTTLE_EXCEEDED = 308,
            SCHEDULE_FUTURE_GAS_LIMIT_EXCEEDED = 309,
            INVALID_ETHEREUM_TRANSACTION = 310,
            WRONG_CHAIN_ID = 311,
            WRONG_NONCE = 312,
            ACCESS_LIST_UNSUPPORTED = 313,
            SCHEDULE_PENDING_EXPIRATION = 314,
            CONTRACT_IS_TOKEN_TREASURY = 315,
            CONTRACT_HAS_NON_ZERO_TOKEN_BALANCES = 316,
            CONTRACT_EXPIRED_AND_PENDING_REMOVAL = 317,
            CONTRACT_HAS_NO_AUTO_RENEW_ACCOUNT = 318,
            PERMANENT_REMOVAL_REQUIRES_SYSTEM_INITIATION = 319,
            PROXY_ACCOUNT_ID_FIELD_IS_DEPRECATED = 320,
            SELF_STAKING_IS_NOT_ALLOWED = 321,
            INVALID_STAKING_ID = 322,
            STAKING_NOT_ENABLED = 323,
            INVALID_PRNG_RANGE = 324,
            MAX_ENTITIES_IN_PRICE_REGIME_HAVE_BEEN_CREATED = 325,
            INVALID_FULL_PREFIX_SIGNATURE_FOR_PRECOMPILE = 326,
            INSUFFICIENT_BALANCES_FOR_STORAGE_RENT = 327,
            MAX_CHILD_RECORDS_EXCEEDED = 328,
            INSUFFICIENT_BALANCES_FOR_RENEWAL_FEES = 329,
            TRANSACTION_HAS_UNKNOWN_FIELDS = 330,
            ACCOUNT_IS_IMMUTABLE = 331,
            ALIAS_ALREADY_ASSIGNED = 332,
            INVALID_METADATA_KEY = 333,
            TOKEN_HAS_NO_METADATA_KEY = 334,
            MISSING_TOKEN_METADATA = 335,
            MISSING_SERIAL_NUMBERS = 336,
            TOKEN_HAS_NO_ADMIN_KEY = 337,
            NODE_DELETED = 338,
            INVALID_NODE_ID = 339,
            INVALID_GOSSIP_ENDPOINT = 340,
            INVALID_NODE_ACCOUNT_ID = 341,
            INVALID_NODE_DESCRIPTION = 342,
            INVALID_SERVICE_ENDPOINT = 343,
            INVALID_GOSSIP_CA_CERTIFICATE = 344,
            INVALID_GRPC_CERTIFICATE = 345,
            INVALID_MAX_AUTO_ASSOCIATIONS = 346,
            MAX_NODES_CREATED = 347,
            IP_FQDN_CANNOT_BE_SET_FOR_SAME_ENDPOINT = 348,
            GOSSIP_ENDPOINT_CANNOT_HAVE_FQDN = 349,
            FQDN_SIZE_TOO_LARGE = 350,
            INVALID_ENDPOINT = 351,
            GOSSIP_ENDPOINTS_EXCEEDED_LIMIT = 352,
            TOKEN_REFERENCE_REPEATED = 353,
            INVALID_OWNER_ID = 354,
            TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED = 355,
            SERVICE_ENDPOINTS_EXCEEDED_LIMIT = 356,
            INVALID_IPV4_ADDRESS = 357,
            EMPTY_TOKEN_REFERENCE_LIST = 358,
            UPDATE_NODE_ACCOUNT_NOT_ALLOWED = 359,
            TOKEN_HAS_NO_METADATA_OR_SUPPLY_KEY = 360,
            EMPTY_PENDING_AIRDROP_ID_LIST = 361,
            PENDING_AIRDROP_ID_REPEATED = 362,
            PENDING_AIRDROP_ID_LIST_TOO_LONG = 363,
            PENDING_NFT_AIRDROP_ALREADY_EXISTS = 364,
            ACCOUNT_HAS_PENDING_AIRDROPS = 365,
            THROTTLED_AT_CONSENSUS = 366,
            INVALID_PENDING_AIRDROP_ID = 367,
            TOKEN_AIRDROP_WITH_FALLBACK_ROYALTY = 368,
            INVALID_TOKEN_IN_PENDING_AIRDROP = 369,
            SCHEDULE_EXPIRY_IS_BUSY = 370,
            INVALID_GRPC_CERTIFICATE_HASH = 371,
            MISSING_EXPIRY_TIME = 372,
            NO_SCHEDULING_ALLOWED_AFTER_SCHEDULED_RECURSION = 373,
            RECURSIVE_SCHEDULING_LIMIT_REACHED = 374,
            WAITING_FOR_LEDGER_ID = 375,
            MAX_ENTRIES_FOR_FEE_EXEMPT_KEY_LIST_EXCEEDED = 376,
            FEE_EXEMPT_KEY_LIST_CONTAINS_DUPLICATED_KEYS = 377,
            INVALID_KEY_IN_FEE_EXEMPT_KEY_LIST = 378,
            INVALID_FEE_SCHEDULE_KEY = 379,
            FEE_SCHEDULE_KEY_CANNOT_BE_UPDATED = 380,
            FEE_SCHEDULE_KEY_NOT_SET = 381,
            MAX_CUSTOM_FEE_LIMIT_EXCEEDED = 382,
            NO_VALID_MAX_CUSTOM_FEE = 383,
            INVALID_MAX_CUSTOM_FEES = 384,
            DUPLICATE_DENOMINATION_IN_MAX_CUSTOM_FEE_LIST = 385,
            DUPLICATE_ACCOUNT_ID_IN_MAX_CUSTOM_FEE_LIST = 386,
            MAX_CUSTOM_FEES_IS_NOT_SUPPORTED = 387,
            BATCH_LIST_EMPTY = 388,
            BATCH_LIST_CONTAINS_DUPLICATES = 389,
            BATCH_TRANSACTION_IN_BLACKLIST = 390,
            INNER_TRANSACTION_FAILED = 391,
            MISSING_BATCH_KEY = 392,
            BATCH_KEY_SET_ON_NON_INNER_TRANSACTION = 393,
            INVALID_BATCH_KEY = 394,
            SCHEDULE_EXPIRY_NOT_CONFIGURABLE = 395,
            CREATING_SYSTEM_ENTITIES = 396,
            THROTTLE_GROUP_LCM_OVERFLOW = 397,
            AIRDROP_CONTAINS_MULTIPLE_SENDERS_FOR_A_TOKEN = 398,
            GRPC_WEB_PROXY_NOT_SUPPORTED = 399,
            NFT_TRANSFERS_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE = 400
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
