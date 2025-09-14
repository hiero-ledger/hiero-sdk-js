/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const proto = $root.proto = (() => {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    const proto = {};

    proto.TransactionResponse = (function() {

        /**
         * Properties of a TransactionResponse.
         * @memberof proto
         * @interface ITransactionResponse
         * @property {proto.ResponseCodeEnum|null} [nodeTransactionPrecheckCode] A pre-consensus response code.
         * <p>
         * This response SHALL represent the response of the individual node, and
         * SHALL NOT represent the consensus of the network.
         * @property {Long|null} [cost] An approximate transaction fee.
         * <p>
         * This value SHALL be `0` unless the `nodeTransactionPrecheckCode` is
         * `INSUFFICIENT_TX_FEE`.<br/>
         * This value SHOULD be an amount, in tinybar, that _would have_ succeeded
         * at the time the transaction was submitted.<br/>
         * Note that this amount is not guaranteed to succeed in a future
         * transaction due to uncontrolled variables, such as network congestion,
         * but should be considered a close approximation.
         */

        /**
         * Constructs a new TransactionResponse.
         * @memberof proto
         * @classdesc A message sent by a node in response to a transaction submission.<br/>
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
         * @implements ITransactionResponse
         * @constructor
         * @param {proto.ITransactionResponse=} [p] Properties to set
         */
        function TransactionResponse(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        /**
         * A pre-consensus response code.
         * <p>
         * This response SHALL represent the response of the individual node, and
         * SHALL NOT represent the consensus of the network.
         * @member {proto.ResponseCodeEnum} nodeTransactionPrecheckCode
         * @memberof proto.TransactionResponse
         * @instance
         */
        TransactionResponse.prototype.nodeTransactionPrecheckCode = 0;

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
         * @member {Long} cost
         * @memberof proto.TransactionResponse
         * @instance
         */
        TransactionResponse.prototype.cost = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new TransactionResponse instance using the specified properties.
         * @function create
         * @memberof proto.TransactionResponse
         * @static
         * @param {proto.ITransactionResponse=} [properties] Properties to set
         * @returns {proto.TransactionResponse} TransactionResponse instance
         */
        TransactionResponse.create = function create(properties) {
            return new TransactionResponse(properties);
        };

        /**
         * Encodes the specified TransactionResponse message. Does not implicitly {@link proto.TransactionResponse.verify|verify} messages.
         * @function encode
         * @memberof proto.TransactionResponse
         * @static
         * @param {proto.ITransactionResponse} m TransactionResponse message or plain object to encode
         * @param {$protobuf.Writer} [w] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TransactionResponse.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.nodeTransactionPrecheckCode != null && Object.hasOwnProperty.call(m, "nodeTransactionPrecheckCode"))
                w.uint32(8).int32(m.nodeTransactionPrecheckCode);
            if (m.cost != null && Object.hasOwnProperty.call(m, "cost"))
                w.uint32(16).uint64(m.cost);
            return w;
        };

        /**
         * Decodes a TransactionResponse message from the specified reader or buffer.
         * @function decode
         * @memberof proto.TransactionResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
         * @param {number} [l] Message length if known beforehand
         * @returns {proto.TransactionResponse} TransactionResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TransactionResponse.decode = function decode(r, l) {
            if (!(r instanceof $Reader))
                r = $Reader.create(r);
            var c = l === undefined ? r.len : r.pos + l, m = new $root.proto.TransactionResponse();
            while (r.pos < c) {
                var t = r.uint32();
                switch (t >>> 3) {
                case 1: {
                        m.nodeTransactionPrecheckCode = r.int32();
                        break;
                    }
                case 2: {
                        m.cost = r.uint64();
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
         * Gets the default type url for TransactionResponse
         * @function getTypeUrl
         * @memberof proto.TransactionResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TransactionResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.TransactionResponse";
        };

        return TransactionResponse;
    })();

    /**
     * An enumeration of possible response codes.
     * @name proto.ResponseCodeEnum
     * @enum {number}
     * @property {number} OK=0 The transaction passed the precheck validations.
     * @property {number} INVALID_TRANSACTION=1 For any error not handled by specific error codes listed below.
     * @property {number} PAYER_ACCOUNT_NOT_FOUND=2 Payer account does not exist.
     * @property {number} INVALID_NODE_ACCOUNT=3 Node Account provided does not match the node account of the node the transaction was submitted
     * to.
     * @property {number} TRANSACTION_EXPIRED=4 Pre-Check error when TransactionValidStart + transactionValidDuration is less than current
     * consensus time.
     * @property {number} INVALID_TRANSACTION_START=5 Transaction start time is greater than current consensus time
     * @property {number} INVALID_TRANSACTION_DURATION=6 The given transactionValidDuration was either non-positive, or greater than the maximum
     * valid duration of 180 secs.
     * @property {number} INVALID_SIGNATURE=7 The transaction signature is not valid
     * @property {number} MEMO_TOO_LONG=8 Transaction memo size exceeded 100 bytes
     * @property {number} INSUFFICIENT_TX_FEE=9 The fee provided in the transaction is insufficient for this type of transaction
     * @property {number} INSUFFICIENT_PAYER_BALANCE=10 The payer account has insufficient cryptocurrency to pay the transaction fee
     * @property {number} DUPLICATE_TRANSACTION=11 This transaction ID is a duplicate of one that was submitted to this node or reached consensus
     * in the last 180 seconds (receipt period)
     * @property {number} BUSY=12 If API is throttled out
     * @property {number} NOT_SUPPORTED=13 The API is not currently supported
     * @property {number} INVALID_FILE_ID=14 The file id is invalid or does not exist
     * @property {number} INVALID_ACCOUNT_ID=15 The account id is invalid or does not exist
     * @property {number} INVALID_CONTRACT_ID=16 The contract id is invalid or does not exist
     * @property {number} INVALID_TRANSACTION_ID=17 Transaction id is not valid
     * @property {number} RECEIPT_NOT_FOUND=18 Receipt for given transaction id does not exist
     * @property {number} RECORD_NOT_FOUND=19 Record for given transaction id does not exist
     * @property {number} INVALID_SOLIDITY_ID=20 The solidity id is invalid or entity with this solidity id does not exist
     * @property {number} UNKNOWN=21 The responding node has submitted the transaction to the network. Its final status is still
     * unknown.
     * @property {number} SUCCESS=22 The transaction succeeded
     * @property {number} FAIL_INVALID=23 There was a system error and the transaction failed because of invalid request parameters.
     * @property {number} FAIL_FEE=24 There was a system error while performing fee calculation, reserved for future.
     * @property {number} FAIL_BALANCE=25 There was a system error while performing balance checks, reserved for future.
     * @property {number} KEY_REQUIRED=26 Key not provided in the transaction body
     * @property {number} BAD_ENCODING=27 Unsupported algorithm/encoding used for keys in the transaction
     * @property {number} INSUFFICIENT_ACCOUNT_BALANCE=28 When the account balance is not sufficient for the transfer
     * @property {number} INVALID_SOLIDITY_ADDRESS=29 During an update transaction when the system is not able to find the Users Solidity address
     * @property {number} INSUFFICIENT_GAS=30 Not enough gas was supplied to execute transaction
     * @property {number} CONTRACT_SIZE_LIMIT_EXCEEDED=31 contract byte code size is over the limit
     * @property {number} LOCAL_CALL_MODIFICATION_EXCEPTION=32 local execution (query) is requested for a function which changes state
     * @property {number} CONTRACT_REVERT_EXECUTED=33 Contract REVERT OPCODE executed
     * @property {number} CONTRACT_EXECUTION_EXCEPTION=34 For any contract execution related error not handled by specific error codes listed above.
     * @property {number} INVALID_RECEIVING_NODE_ACCOUNT=35 In Query validation, account with +ve(amount) value should be Receiving node account, the
     * receiver account should be only one account in the list
     * @property {number} MISSING_QUERY_HEADER=36 Header is missing in Query request
     * @property {number} ACCOUNT_UPDATE_FAILED=37 The update of the account failed
     * @property {number} INVALID_KEY_ENCODING=38 Provided key encoding was not supported by the system
     * @property {number} NULL_SOLIDITY_ADDRESS=39 null solidity address
     * @property {number} CONTRACT_UPDATE_FAILED=40 update of the contract failed
     * @property {number} INVALID_QUERY_HEADER=41 the query header is invalid
     * @property {number} INVALID_FEE_SUBMITTED=42 Invalid fee submitted
     * @property {number} INVALID_PAYER_SIGNATURE=43 Payer signature is invalid
     * @property {number} KEY_NOT_PROVIDED=44 The keys were not provided in the request.
     * @property {number} INVALID_EXPIRATION_TIME=45 Expiration time provided in the transaction was invalid.
     * @property {number} NO_WACL_KEY=46 WriteAccess Control Keys are not provided for the file
     * @property {number} FILE_CONTENT_EMPTY=47 The contents of file are provided as empty.
     * @property {number} INVALID_ACCOUNT_AMOUNTS=48 The crypto transfer credit and debit do not sum equal to 0
     * @property {number} EMPTY_TRANSACTION_BODY=49 Transaction body provided is empty
     * @property {number} INVALID_TRANSACTION_BODY=50 Invalid transaction body provided
     * @property {number} INVALID_SIGNATURE_TYPE_MISMATCHING_KEY=51 the type of key (base ed25519 key, KeyList, or ThresholdKey) does not match the type of
     * signature (base ed25519 signature, SignatureList, or ThresholdKeySignature)
     * @property {number} INVALID_SIGNATURE_COUNT_MISMATCHING_KEY=52 the number of key (KeyList, or ThresholdKey) does not match that of signature (SignatureList,
     * or ThresholdKeySignature). e.g. if a keyList has 3 base keys, then the corresponding
     * signatureList should also have 3 base signatures.
     * @property {number} EMPTY_LIVE_HASH_BODY=53 the livehash body is empty
     * @property {number} EMPTY_LIVE_HASH=54 the livehash data is missing
     * @property {number} EMPTY_LIVE_HASH_KEYS=55 the keys for a livehash are missing
     * @property {number} INVALID_LIVE_HASH_SIZE=56 the livehash data is not the output of a SHA-384 digest
     * @property {number} EMPTY_QUERY_BODY=57 the query body is empty
     * @property {number} EMPTY_LIVE_HASH_QUERY=58 the crypto livehash query is empty
     * @property {number} LIVE_HASH_NOT_FOUND=59 the livehash is not present
     * @property {number} ACCOUNT_ID_DOES_NOT_EXIST=60 the account id passed has not yet been created.
     * @property {number} LIVE_HASH_ALREADY_EXISTS=61 the livehash already exists for a given account
     * @property {number} INVALID_FILE_WACL=62 File WACL keys are invalid
     * @property {number} SERIALIZATION_FAILED=63 Serialization failure
     * @property {number} TRANSACTION_OVERSIZE=64 The size of the Transaction is greater than transactionMaxBytes
     * @property {number} TRANSACTION_TOO_MANY_LAYERS=65 The Transaction has more than 50 levels
     * @property {number} CONTRACT_DELETED=66 Contract is marked as deleted
     * @property {number} PLATFORM_NOT_ACTIVE=67 the platform node is either disconnected or lagging behind.
     * @property {number} KEY_PREFIX_MISMATCH=68 one public key matches more than one prefixes on the signature map
     * @property {number} PLATFORM_TRANSACTION_NOT_CREATED=69 transaction not created by platform due to large backlog
     * @property {number} INVALID_RENEWAL_PERIOD=70 auto renewal period is not a positive number of seconds
     * @property {number} INVALID_PAYER_ACCOUNT_ID=71 the response code when a smart contract id is passed for a crypto API request
     * @property {number} ACCOUNT_DELETED=72 the account has been marked as deleted
     * @property {number} FILE_DELETED=73 the file has been marked as deleted
     * @property {number} ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS=74 same accounts repeated in the transfer account list
     * @property {number} SETTING_NEGATIVE_ACCOUNT_BALANCE=75 attempting to set negative balance value for crypto account
     * @property {number} OBTAINER_REQUIRED=76 when deleting smart contract that has crypto balance either transfer account or transfer smart
     * contract is required
     * @property {number} OBTAINER_SAME_CONTRACT_ID=77 when deleting smart contract that has crypto balance you can not use the same contract id as
     * transferContractId as the one being deleted
     * @property {number} OBTAINER_DOES_NOT_EXIST=78 transferAccountId or transferContractId specified for contract delete does not exist
     * @property {number} MODIFYING_IMMUTABLE_CONTRACT=79 attempting to modify (update or delete a immutable smart contract, i.e. one created without a
     * admin key)
     * @property {number} FILE_SYSTEM_EXCEPTION=80 Unexpected exception thrown by file system functions
     * @property {number} AUTORENEW_DURATION_NOT_IN_RANGE=81 the duration is not a subset of [MINIMUM_AUTORENEW_DURATION,MAXIMUM_AUTORENEW_DURATION]
     * @property {number} ERROR_DECODING_BYTESTRING=82 Decoding the smart contract binary to a byte array failed. Check that the input is a valid hex
     * string.
     * @property {number} CONTRACT_FILE_EMPTY=83 File to create a smart contract was of length zero
     * @property {number} CONTRACT_BYTECODE_EMPTY=84 Bytecode for smart contract is of length zero
     * @property {number} INVALID_INITIAL_BALANCE=85 Attempt to set negative initial balance
     * @property {number} INVALID_RECEIVE_RECORD_THRESHOLD=86 Attempt to set negative receive record threshold
     * @property {number} INVALID_SEND_RECORD_THRESHOLD=87 Attempt to set negative send record threshold
     * @property {number} ACCOUNT_IS_NOT_GENESIS_ACCOUNT=88 Special Account Operations should be performed by only Genesis account, return this code if it
     * is not Genesis Account
     * @property {number} PAYER_ACCOUNT_UNAUTHORIZED=89 The fee payer account doesn't have permission to submit such Transaction
     * @property {number} INVALID_FREEZE_TRANSACTION_BODY=90 FreezeTransactionBody is invalid
     * @property {number} FREEZE_TRANSACTION_BODY_NOT_FOUND=91 FreezeTransactionBody does not exist
     * @property {number} TRANSFER_LIST_SIZE_LIMIT_EXCEEDED=92 Exceeded the number of accounts (both from and to) allowed for crypto transfer list
     * @property {number} RESULT_SIZE_LIMIT_EXCEEDED=93 Smart contract result size greater than specified maxResultSize
     * @property {number} NOT_SPECIAL_ACCOUNT=94 The payer account is not a special account(account 0.0.55)
     * @property {number} CONTRACT_NEGATIVE_GAS=95 Negative gas was offered in smart contract call
     * @property {number} CONTRACT_NEGATIVE_VALUE=96 Negative value / initial balance was specified in a smart contract call / create
     * @property {number} INVALID_FEE_FILE=97 Failed to update fee file
     * @property {number} INVALID_EXCHANGE_RATE_FILE=98 Failed to update exchange rate file
     * @property {number} INSUFFICIENT_LOCAL_CALL_GAS=99 Payment tendered for contract local call cannot cover both the fee and the gas
     * @property {number} ENTITY_NOT_ALLOWED_TO_DELETE=100 Entities with Entity ID below 1000 are not allowed to be deleted
     * @property {number} AUTHORIZATION_FAILED=101 Violating one of these rules: 1) treasury account can update all entities below 0.0.1000, 2)
     * account 0.0.50 can update all entities from 0.0.51 - 0.0.80, 3) Network Function Master Account
     * A/c 0.0.50 - Update all Network Function accounts & perform all the Network Functions listed
     * below, 4) Network Function Accounts: i) A/c 0.0.55 - Update Address Book files (0.0.101/102),
     * ii) A/c 0.0.56 - Update Fee schedule (0.0.111), iii) A/c 0.0.57 - Update Exchange Rate
     * (0.0.112).
     * @property {number} FILE_UPLOADED_PROTO_INVALID=102 Fee Schedule Proto uploaded but not valid (append or update is required)
     * @property {number} FILE_UPLOADED_PROTO_NOT_SAVED_TO_DISK=103 Fee Schedule Proto uploaded but not valid (append or update is required)
     * @property {number} FEE_SCHEDULE_FILE_PART_UPLOADED=104 Fee Schedule Proto File Part uploaded
     * @property {number} EXCHANGE_RATE_CHANGE_LIMIT_EXCEEDED=105 The change on Exchange Rate exceeds Exchange_Rate_Allowed_Percentage
     * @property {number} MAX_CONTRACT_STORAGE_EXCEEDED=106 Contract permanent storage exceeded the currently allowable limit
     * @property {number} TRANSFER_ACCOUNT_SAME_AS_DELETE_ACCOUNT=107 Transfer Account should not be same as Account to be deleted
     * @property {number} TOTAL_LEDGER_BALANCE_INVALID=108 TOTAL_LEDGER_BALANCE_INVALID value
     * @property {number} EXPIRATION_REDUCTION_NOT_ALLOWED=110 The expiration date/time on a smart contract may not be reduced
     * @property {number} MAX_GAS_LIMIT_EXCEEDED=111 Gas exceeded currently allowable gas limit per transaction
     * @property {number} MAX_FILE_SIZE_EXCEEDED=112 File size exceeded the currently allowable limit
     * @property {number} RECEIVER_SIG_REQUIRED=113 When a valid signature is not provided for operations on account with receiverSigRequired=true
     * @property {number} INVALID_TOPIC_ID=150 The Topic ID specified is not in the system.
     * @property {number} INVALID_ADMIN_KEY=155 A provided admin key was invalid. Verify the bytes for an Ed25519 public key are exactly 32 bytes; and the bytes for a compressed ECDSA(secp256k1) key are exactly 33 bytes, with the first byte either 0x02 or 0x03..
     * @property {number} INVALID_SUBMIT_KEY=156 A provided submit key was invalid.
     * @property {number} UNAUTHORIZED=157 An attempted operation was not authorized (ie - a deleteTopic for a topic with no adminKey).
     * @property {number} INVALID_TOPIC_MESSAGE=158 A ConsensusService message is empty.
     * @property {number} INVALID_AUTORENEW_ACCOUNT=159 The autoRenewAccount specified is not a valid, active account.
     * @property {number} AUTORENEW_ACCOUNT_NOT_ALLOWED=160 An adminKey was not specified on the topic, so there must not be an autoRenewAccount.
     * @property {number} TOPIC_EXPIRED=162 The topic has expired, was not automatically renewed, and is in a 7 day grace period before the
     * topic will be deleted unrecoverably. This error response code will not be returned until
     * autoRenew functionality is supported by HAPI.
     * @property {number} INVALID_CHUNK_NUMBER=163 INVALID_CHUNK_NUMBER value
     * @property {number} INVALID_CHUNK_TRANSACTION_ID=164 INVALID_CHUNK_TRANSACTION_ID value
     * @property {number} ACCOUNT_FROZEN_FOR_TOKEN=165 ACCOUNT_FROZEN_FOR_TOKEN value
     * @property {number} TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED=166 TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED value
     * @property {number} INVALID_TOKEN_ID=167 INVALID_TOKEN_ID value
     * @property {number} INVALID_TOKEN_DECIMALS=168 INVALID_TOKEN_DECIMALS value
     * @property {number} INVALID_TOKEN_INITIAL_SUPPLY=169 INVALID_TOKEN_INITIAL_SUPPLY value
     * @property {number} INVALID_TREASURY_ACCOUNT_FOR_TOKEN=170 INVALID_TREASURY_ACCOUNT_FOR_TOKEN value
     * @property {number} INVALID_TOKEN_SYMBOL=171 INVALID_TOKEN_SYMBOL value
     * @property {number} TOKEN_HAS_NO_FREEZE_KEY=172 TOKEN_HAS_NO_FREEZE_KEY value
     * @property {number} TRANSFERS_NOT_ZERO_SUM_FOR_TOKEN=173 TRANSFERS_NOT_ZERO_SUM_FOR_TOKEN value
     * @property {number} MISSING_TOKEN_SYMBOL=174 MISSING_TOKEN_SYMBOL value
     * @property {number} TOKEN_SYMBOL_TOO_LONG=175 TOKEN_SYMBOL_TOO_LONG value
     * @property {number} ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN=176 ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN value
     * @property {number} TOKEN_HAS_NO_KYC_KEY=177 TOKEN_HAS_NO_KYC_KEY value
     * @property {number} INSUFFICIENT_TOKEN_BALANCE=178 INSUFFICIENT_TOKEN_BALANCE value
     * @property {number} TOKEN_WAS_DELETED=179 TOKEN_WAS_DELETED value
     * @property {number} TOKEN_HAS_NO_SUPPLY_KEY=180 TOKEN_HAS_NO_SUPPLY_KEY value
     * @property {number} TOKEN_HAS_NO_WIPE_KEY=181 TOKEN_HAS_NO_WIPE_KEY value
     * @property {number} INVALID_TOKEN_MINT_AMOUNT=182 INVALID_TOKEN_MINT_AMOUNT value
     * @property {number} INVALID_TOKEN_BURN_AMOUNT=183 INVALID_TOKEN_BURN_AMOUNT value
     * @property {number} TOKEN_NOT_ASSOCIATED_TO_ACCOUNT=184 TOKEN_NOT_ASSOCIATED_TO_ACCOUNT value
     * @property {number} CANNOT_WIPE_TOKEN_TREASURY_ACCOUNT=185 CANNOT_WIPE_TOKEN_TREASURY_ACCOUNT value
     * @property {number} INVALID_KYC_KEY=186 INVALID_KYC_KEY value
     * @property {number} INVALID_WIPE_KEY=187 INVALID_WIPE_KEY value
     * @property {number} INVALID_FREEZE_KEY=188 INVALID_FREEZE_KEY value
     * @property {number} INVALID_SUPPLY_KEY=189 INVALID_SUPPLY_KEY value
     * @property {number} MISSING_TOKEN_NAME=190 MISSING_TOKEN_NAME value
     * @property {number} TOKEN_NAME_TOO_LONG=191 TOKEN_NAME_TOO_LONG value
     * @property {number} INVALID_WIPING_AMOUNT=192 INVALID_WIPING_AMOUNT value
     * @property {number} TOKEN_IS_IMMUTABLE=193 TOKEN_IS_IMMUTABLE value
     * @property {number} TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT=194 TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT value
     * @property {number} TRANSACTION_REQUIRES_ZERO_TOKEN_BALANCES=195 TRANSACTION_REQUIRES_ZERO_TOKEN_BALANCES value
     * @property {number} ACCOUNT_IS_TREASURY=196 ACCOUNT_IS_TREASURY value
     * @property {number} TOKEN_ID_REPEATED_IN_TOKEN_LIST=197 TOKEN_ID_REPEATED_IN_TOKEN_LIST value
     * @property {number} TOKEN_TRANSFER_LIST_SIZE_LIMIT_EXCEEDED=198 TOKEN_TRANSFER_LIST_SIZE_LIMIT_EXCEEDED value
     * @property {number} EMPTY_TOKEN_TRANSFER_BODY=199 EMPTY_TOKEN_TRANSFER_BODY value
     * @property {number} EMPTY_TOKEN_TRANSFER_ACCOUNT_AMOUNTS=200 EMPTY_TOKEN_TRANSFER_ACCOUNT_AMOUNTS value
     * @property {number} INVALID_SCHEDULE_ID=201 The Scheduled entity does not exist; or has now expired, been deleted, or been executed
     * @property {number} SCHEDULE_IS_IMMUTABLE=202 The Scheduled entity cannot be modified. Admin key not set
     * @property {number} INVALID_SCHEDULE_PAYER_ID=203 The provided Scheduled Payer does not exist
     * @property {number} INVALID_SCHEDULE_ACCOUNT_ID=204 The Schedule Create Transaction TransactionID account does not exist
     * @property {number} NO_NEW_VALID_SIGNATURES=205 The provided sig map did not contain any new valid signatures from required signers of the scheduled transaction
     * @property {number} UNRESOLVABLE_REQUIRED_SIGNERS=206 The required signers for a scheduled transaction cannot be resolved, for example because they do not exist or have been deleted
     * @property {number} SCHEDULED_TRANSACTION_NOT_IN_WHITELIST=207 Only whitelisted transaction types may be scheduled
     * @property {number} SOME_SIGNATURES_WERE_INVALID=208 At least one of the signatures in the provided sig map did not represent a valid signature for any required signer
     * @property {number} TRANSACTION_ID_FIELD_NOT_ALLOWED=209 The scheduled field in the TransactionID may not be set to true
     * @property {number} IDENTICAL_SCHEDULE_ALREADY_CREATED=210 A schedule already exists with the same identifying fields of an attempted ScheduleCreate (that is, all fields other than scheduledPayerAccountID)
     * @property {number} INVALID_ZERO_BYTE_IN_STRING=211 A string field in the transaction has a UTF-8 encoding with the prohibited zero byte
     * @property {number} SCHEDULE_ALREADY_DELETED=212 A schedule being signed or deleted has already been deleted
     * @property {number} SCHEDULE_ALREADY_EXECUTED=213 A schedule being signed or deleted has already been executed
     * @property {number} MESSAGE_SIZE_TOO_LARGE=214 ConsensusSubmitMessage request's message size is larger than allowed.
     * @property {number} OPERATION_REPEATED_IN_BUCKET_GROUPS=215 An operation was assigned to more than one throttle group in a given bucket
     * @property {number} BUCKET_CAPACITY_OVERFLOW=216 The capacity needed to satisfy all opsPerSec groups in a bucket overflowed a signed 8-byte integral type
     * @property {number} NODE_CAPACITY_NOT_SUFFICIENT_FOR_OPERATION=217 Given the network size in the address book, the node-level capacity for an operation would never be enough to accept a single request; usually means a bucket burstPeriod should be increased
     * @property {number} BUCKET_HAS_NO_THROTTLE_GROUPS=218 A bucket was defined without any throttle groups
     * @property {number} THROTTLE_GROUP_HAS_ZERO_OPS_PER_SEC=219 A throttle group was granted zero opsPerSec
     * @property {number} SUCCESS_BUT_MISSING_EXPECTED_OPERATION=220 The throttle definitions file was updated, but some supported operations were not assigned a bucket
     * @property {number} UNPARSEABLE_THROTTLE_DEFINITIONS=221 The new contents for the throttle definitions system file were not valid protobuf
     * @property {number} INVALID_THROTTLE_DEFINITIONS=222 The new throttle definitions system file were invalid, and no more specific error could be divined
     * @property {number} ACCOUNT_EXPIRED_AND_PENDING_REMOVAL=223 The transaction references an account which has passed its expiration without renewal funds available, and currently remains in the ledger only because of the grace period given to expired entities
     * @property {number} INVALID_TOKEN_MAX_SUPPLY=224 Invalid token max supply
     * @property {number} INVALID_TOKEN_NFT_SERIAL_NUMBER=225 Invalid token nft serial number
     * @property {number} INVALID_NFT_ID=226 Invalid nft id
     * @property {number} METADATA_TOO_LONG=227 Nft metadata is too long
     * @property {number} BATCH_SIZE_LIMIT_EXCEEDED=228 Repeated operations count exceeds the limit
     * @property {number} INVALID_QUERY_RANGE=229 The range of data to be gathered is out of the set boundaries
     * @property {number} FRACTION_DIVIDES_BY_ZERO=230 A custom fractional fee set a denominator of zero
     * @property {number} INSUFFICIENT_PAYER_BALANCE_FOR_CUSTOM_FEE=231 The transaction payer could not afford a custom fee
     * @property {number} CUSTOM_FEES_LIST_TOO_LONG=232 More than 10 custom fees were specified
     * @property {number} INVALID_CUSTOM_FEE_COLLECTOR=233 Any of the feeCollector accounts for customFees is invalid
     * @property {number} INVALID_TOKEN_ID_IN_CUSTOM_FEES=234 Any of the token Ids in customFees is invalid
     * @property {number} TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR=235 Any of the token Ids in customFees are not associated to feeCollector
     * @property {number} TOKEN_MAX_SUPPLY_REACHED=236 A token cannot have more units minted due to its configured supply ceiling
     * @property {number} SENDER_DOES_NOT_OWN_NFT_SERIAL_NO=237 The transaction attempted to move an NFT serial number from an account other than its owner
     * @property {number} CUSTOM_FEE_NOT_FULLY_SPECIFIED=238 A custom fee schedule entry did not specify either a fixed or fractional fee
     * @property {number} CUSTOM_FEE_MUST_BE_POSITIVE=239 Only positive fees may be assessed at this time
     * @property {number} TOKEN_HAS_NO_FEE_SCHEDULE_KEY=240 Fee schedule key is not set on token
     * @property {number} CUSTOM_FEE_OUTSIDE_NUMERIC_RANGE=241 A fractional custom fee exceeded the range of a 64-bit signed integer
     * @property {number} ROYALTY_FRACTION_CANNOT_EXCEED_ONE=242 A royalty cannot exceed the total fungible value exchanged for an NFT
     * @property {number} FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT=243 Each fractional custom fee must have its maximum_amount, if specified, at least its minimum_amount
     * @property {number} CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES=244 A fee schedule update tried to clear the custom fees from a token whose fee schedule was already empty
     * @property {number} CUSTOM_FEE_DENOMINATION_MUST_BE_FUNGIBLE_COMMON=245 Only tokens of type FUNGIBLE_COMMON can be used to as fee schedule denominations
     * @property {number} CUSTOM_FRACTIONAL_FEE_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON=246 Only tokens of type FUNGIBLE_COMMON can have fractional fees
     * @property {number} INVALID_CUSTOM_FEE_SCHEDULE_KEY=247 The provided custom fee schedule key was invalid
     * @property {number} INVALID_TOKEN_MINT_METADATA=248 The requested token mint metadata was invalid
     * @property {number} INVALID_TOKEN_BURN_METADATA=249 The requested token burn metadata was invalid
     * @property {number} CURRENT_TREASURY_STILL_OWNS_NFTS=250 The treasury for a unique token cannot be changed until it owns no NFTs
     * @property {number} ACCOUNT_STILL_OWNS_NFTS=251 An account cannot be dissociated from a unique token if it owns NFTs for the token
     * @property {number} TREASURY_MUST_OWN_BURNED_NFT=252 A NFT can only be burned when owned by the unique token's treasury
     * @property {number} ACCOUNT_DOES_NOT_OWN_WIPED_NFT=253 An account did not own the NFT to be wiped
     * @property {number} ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON=254 An AccountAmount token transfers list referenced a token type other than FUNGIBLE_COMMON
     * @property {number} MAX_NFTS_IN_PRICE_REGIME_HAVE_BEEN_MINTED=255 All the NFTs allowed in the current price regime have already been minted
     * @property {number} PAYER_ACCOUNT_DELETED=256 The payer account has been marked as deleted
     * @property {number} CUSTOM_FEE_CHARGING_EXCEEDED_MAX_RECURSION_DEPTH=257 The reference chain of custom fees for a transferred token exceeded the maximum length of 2
     * @property {number} CUSTOM_FEE_CHARGING_EXCEEDED_MAX_ACCOUNT_AMOUNTS=258 More than 20 balance adjustments were to satisfy a CryptoTransfer and its implied custom fee payments
     * @property {number} INSUFFICIENT_SENDER_ACCOUNT_BALANCE_FOR_CUSTOM_FEE=259 The sender account in the token transfer transaction could not afford a custom fee
     * @property {number} SERIAL_NUMBER_LIMIT_REACHED=260 Currently no more than 4,294,967,295 NFTs may be minted for a given unique token type
     * @property {number} CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE=261 Only tokens of type NON_FUNGIBLE_UNIQUE can have royalty fees
     * @property {number} NO_REMAINING_AUTOMATIC_ASSOCIATIONS=262 The account has reached the limit on the automatic associations count.
     * @property {number} EXISTING_AUTOMATIC_ASSOCIATIONS_EXCEED_GIVEN_LIMIT=263 Already existing automatic associations are more than the new maximum automatic associations.
     * @property {number} REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT=264 Cannot set the number of automatic associations for an account more than the maximum allowed
     * token associations <tt>tokens.maxPerAccount</tt>.
     * @property {number} TOKEN_IS_PAUSED=265 Token is paused. This Token cannot be a part of any kind of Transaction until unpaused.
     * @property {number} TOKEN_HAS_NO_PAUSE_KEY=266 Pause key is not set on token
     * @property {number} INVALID_PAUSE_KEY=267 The provided pause key was invalid
     * @property {number} FREEZE_UPDATE_FILE_DOES_NOT_EXIST=268 The update file in a freeze transaction body must exist.
     * @property {number} FREEZE_UPDATE_FILE_HASH_DOES_NOT_MATCH=269 The hash of the update file in a freeze transaction body must match the in-memory hash.
     * @property {number} NO_UPGRADE_HAS_BEEN_PREPARED=270 A FREEZE_UPGRADE transaction was handled with no previous update prepared.
     * @property {number} NO_FREEZE_IS_SCHEDULED=271 A FREEZE_ABORT transaction was handled with no scheduled freeze.
     * @property {number} UPDATE_FILE_HASH_CHANGED_SINCE_PREPARE_UPGRADE=272 The update file hash when handling a FREEZE_UPGRADE transaction differs from the file
     * hash at the time of handling the PREPARE_UPGRADE transaction.
     * @property {number} FREEZE_START_TIME_MUST_BE_FUTURE=273 The given freeze start time was in the (consensus) past.
     * @property {number} PREPARED_UPDATE_FILE_IS_IMMUTABLE=274 The prepared update file cannot be updated or appended until either the upgrade has
     * been completed, or a FREEZE_ABORT has been handled.
     * @property {number} FREEZE_ALREADY_SCHEDULED=275 Once a freeze is scheduled, it must be aborted before any other type of freeze can
     * can be performed.
     * @property {number} FREEZE_UPGRADE_IN_PROGRESS=276 If an NMT upgrade has been prepared, the following operation must be a FREEZE_UPGRADE.
     * (To issue a FREEZE_ONLY, submit a FREEZE_ABORT first.)
     * @property {number} UPDATE_FILE_ID_DOES_NOT_MATCH_PREPARED=277 If an NMT upgrade has been prepared, the subsequent FREEZE_UPGRADE transaction must
     * confirm the id of the file to be used in the upgrade.
     * @property {number} UPDATE_FILE_HASH_DOES_NOT_MATCH_PREPARED=278 If an NMT upgrade has been prepared, the subsequent FREEZE_UPGRADE transaction must
     * confirm the hash of the file to be used in the upgrade.
     * @property {number} CONSENSUS_GAS_EXHAUSTED=279 Consensus throttle did not allow execution of this transaction. System is throttled at
     * consensus level.
     * @property {number} REVERTED_SUCCESS=280 A precompiled contract succeeded, but was later reverted.
     * @property {number} MAX_STORAGE_IN_PRICE_REGIME_HAS_BEEN_USED=281 All contract storage allocated to the current price regime has been consumed.
     * @property {number} INVALID_ALIAS_KEY=282 An alias used in a CryptoTransfer transaction is not the serialization of a primitive Key
     * message--that is, a Key with a single Ed25519 or ECDSA(secp256k1) public key and no
     * unknown protobuf fields.
     * @property {number} UNEXPECTED_TOKEN_DECIMALS=283 A fungible token transfer expected a different number of decimals than the involved
     * type actually has.
     * @property {number} INVALID_PROXY_ACCOUNT_ID=284 The proxy account id is invalid or does not exist.
     * @property {number} INVALID_TRANSFER_ACCOUNT_ID=285 The transfer account id in CryptoDelete transaction is invalid or does not exist.
     * @property {number} INVALID_FEE_COLLECTOR_ACCOUNT_ID=286 The fee collector account id in TokenFeeScheduleUpdate is invalid or does not exist.
     * @property {number} ALIAS_IS_IMMUTABLE=287 The alias already set on an account cannot be updated using CryptoUpdate transaction.
     * @property {number} SPENDER_ACCOUNT_SAME_AS_OWNER=288 An approved allowance specifies a spender account that is the same as the hbar/token
     * owner account.
     * @property {number} AMOUNT_EXCEEDS_TOKEN_MAX_SUPPLY=289 The establishment or adjustment of an approved allowance cause the token allowance
     * to exceed the token maximum supply.
     * @property {number} NEGATIVE_ALLOWANCE_AMOUNT=290 The specified amount for an approved allowance cannot be negative.
     * @property {number} CANNOT_APPROVE_FOR_ALL_FUNGIBLE_COMMON=291 The approveForAll flag cannot be set for a fungible token.
     * @property {number} SPENDER_DOES_NOT_HAVE_ALLOWANCE=292 The spender does not have an existing approved allowance with the hbar/token owner.
     * @property {number} AMOUNT_EXCEEDS_ALLOWANCE=293 The transfer amount exceeds the current approved allowance for the spender account.
     * @property {number} MAX_ALLOWANCES_EXCEEDED=294 The payer account of an approveAllowances or adjustAllowance transaction is attempting
     * to go beyond the maximum allowed number of allowances.
     * @property {number} EMPTY_ALLOWANCES=295 No allowances have been specified in the approval transaction.
     * @property {number} SPENDER_ACCOUNT_REPEATED_IN_ALLOWANCES=296 Spender is repeated more than once in Crypto or Token or NFT allowance lists in a single
     * CryptoApproveAllowance transaction.
     * @property {number} REPEATED_SERIAL_NUMS_IN_NFT_ALLOWANCES=297 Serial numbers are repeated in nft allowance for a single spender account
     * @property {number} FUNGIBLE_TOKEN_IN_NFT_ALLOWANCES=298 Fungible common token used in NFT allowances
     * @property {number} NFT_IN_FUNGIBLE_TOKEN_ALLOWANCES=299 Non fungible token used in fungible token allowances
     * @property {number} INVALID_ALLOWANCE_OWNER_ID=300 The account id specified as the owner is invalid or does not exist.
     * @property {number} INVALID_ALLOWANCE_SPENDER_ID=301 The account id specified as the spender is invalid or does not exist.
     * @property {number} REPEATED_ALLOWANCES_TO_DELETE=302 [Deprecated] If the CryptoDeleteAllowance transaction has repeated crypto or token or Nft allowances to delete.
     * @property {number} INVALID_DELEGATING_SPENDER=303 If the account Id specified as the delegating spender is invalid or does not exist.
     * @property {number} DELEGATING_SPENDER_CANNOT_GRANT_APPROVE_FOR_ALL=304 The delegating Spender cannot grant approveForAll allowance on a NFT token type for another spender.
     * @property {number} DELEGATING_SPENDER_DOES_NOT_HAVE_APPROVE_FOR_ALL=305 The delegating Spender cannot grant allowance on a NFT serial for another spender as it doesnt not have approveForAll
     * granted on token-owner.
     * @property {number} SCHEDULE_EXPIRATION_TIME_TOO_FAR_IN_FUTURE=306 The scheduled transaction could not be created because it's expiration_time was too far in the future.
     * @property {number} SCHEDULE_EXPIRATION_TIME_MUST_BE_HIGHER_THAN_CONSENSUS_TIME=307 The scheduled transaction could not be created because it's expiration_time was less than or equal to the consensus time.
     * @property {number} SCHEDULE_FUTURE_THROTTLE_EXCEEDED=308 The scheduled transaction could not be created because it would cause throttles to be violated on the specified expiration_time.
     * @property {number} SCHEDULE_FUTURE_GAS_LIMIT_EXCEEDED=309 The scheduled transaction could not be created because it would cause the gas limit to be violated on the specified expiration_time.
     * @property {number} INVALID_ETHEREUM_TRANSACTION=310 The ethereum transaction either failed parsing or failed signature validation, or some other EthereumTransaction error not covered by another response code.
     * @property {number} WRONG_CHAIN_ID=311 EthereumTransaction was signed against a chainId that this network does not support.
     * @property {number} WRONG_NONCE=312 This transaction specified an ethereumNonce that is not the current ethereumNonce of the account.
     * @property {number} ACCESS_LIST_UNSUPPORTED=313 The ethereum transaction specified an access list, which the network does not support.
     * @property {number} SCHEDULE_PENDING_EXPIRATION=314 A schedule being signed or deleted has passed it's expiration date and is pending execution if needed and then expiration.
     * @property {number} CONTRACT_IS_TOKEN_TREASURY=315 A selfdestruct or ContractDelete targeted a contract that is a token treasury.
     * @property {number} CONTRACT_HAS_NON_ZERO_TOKEN_BALANCES=316 A selfdestruct or ContractDelete targeted a contract with non-zero token balances.
     * @property {number} CONTRACT_EXPIRED_AND_PENDING_REMOVAL=317 A contract referenced by a transaction is "detached"; that is, expired and lacking any
     * hbar funds for auto-renewal payment---but still within its post-expiry grace period.
     * @property {number} CONTRACT_HAS_NO_AUTO_RENEW_ACCOUNT=318 A ContractUpdate requested removal of a contract's auto-renew account, but that contract has
     * no auto-renew account.
     * @property {number} PERMANENT_REMOVAL_REQUIRES_SYSTEM_INITIATION=319 A delete transaction submitted via HAPI set permanent_removal=true
     * @property {number} PROXY_ACCOUNT_ID_FIELD_IS_DEPRECATED=320 PROXY_ACCOUNT_ID_FIELD_IS_DEPRECATED value
     * @property {number} SELF_STAKING_IS_NOT_ALLOWED=321 An account set the staked_account_id to itself in CryptoUpdate or ContractUpdate transactions.
     * @property {number} INVALID_STAKING_ID=322 The staking account id or staking node id given is invalid or does not exist.
     * @property {number} STAKING_NOT_ENABLED=323 Native staking, while implemented, has not yet enabled by the council.
     * @property {number} INVALID_PRNG_RANGE=324 The range provided in UtilPrng transaction is negative.
     * @property {number} MAX_ENTITIES_IN_PRICE_REGIME_HAVE_BEEN_CREATED=325 The maximum number of entities allowed in the current price regime have been created.
     * @property {number} INVALID_FULL_PREFIX_SIGNATURE_FOR_PRECOMPILE=326 The full prefix signature for precompile is not valid
     * @property {number} INSUFFICIENT_BALANCES_FOR_STORAGE_RENT=327 The combined balances of a contract and its auto-renew account (if any) did not cover
     * the rent charged for net new storage used in a transaction.
     * @property {number} MAX_CHILD_RECORDS_EXCEEDED=328 A contract transaction tried to use more than the allowed number of child records, via
     * either system contract records or internal contract creations.
     * @property {number} INSUFFICIENT_BALANCES_FOR_RENEWAL_FEES=329 The combined balances of a contract and its auto-renew account (if any) or balance of an account did not cover
     * the auto-renewal fees in a transaction.
     * @property {number} TRANSACTION_HAS_UNKNOWN_FIELDS=330 A transaction's protobuf message includes unknown fields; could mean that a client
     * expects not-yet-released functionality to be available.
     * @property {number} ACCOUNT_IS_IMMUTABLE=331 The account cannot be modified. Account's key is not set
     * @property {number} ALIAS_ALREADY_ASSIGNED=332 An alias that is assigned to an account or contract cannot be assigned to another account or contract.
     * @property {number} INVALID_METADATA_KEY=333 A provided metadata key was invalid. Verification includes, for example, checking the size of Ed25519 and ECDSA(secp256k1) public keys.
     * @property {number} TOKEN_HAS_NO_METADATA_KEY=334 Metadata key is not set on token
     * @property {number} MISSING_TOKEN_METADATA=335 Token Metadata is not provided
     * @property {number} MISSING_SERIAL_NUMBERS=336 NFT serial numbers are missing in the TokenUpdateNftsTransactionBody
     * @property {number} TOKEN_HAS_NO_ADMIN_KEY=337 Admin key is not set on token
     * @property {number} NODE_DELETED=338 A transaction failed because the consensus node identified is
     * deleted from the address book.
     * @property {number} INVALID_NODE_ID=339 A transaction failed because the consensus node identified is not valid or
     * does not exist in state.
     * @property {number} INVALID_GOSSIP_ENDPOINT=340 A transaction failed because one or more entries in the list of
     * service endpoints for the `gossip_endpoint` field is invalid.<br/>
     * The most common cause for this response is a service endpoint that has
     * the domain name (DNS) set rather than address and port.
     * @property {number} INVALID_NODE_ACCOUNT_ID=341 A transaction failed because the node account identifier provided
     * does not exist or is not valid.<br/>
     * One common source of this error is providing a node account identifier
     * using the "alias" form rather than "numeric" form.
     * It is also used for atomic batch transaction for child transaction if the node account id is not 0.0.0.
     * @property {number} INVALID_NODE_DESCRIPTION=342 A transaction failed because the description field cannot be encoded
     * as UTF-8 or is more than 100 bytes when encoded.
     * @property {number} INVALID_SERVICE_ENDPOINT=343 A transaction failed because one or more entries in the list of
     * service endpoints for the `service_endpoint` field is invalid.<br/>
     * The most common cause for this response is a service endpoint that has
     * the domain name (DNS) set rather than address and port.
     * @property {number} INVALID_GOSSIP_CA_CERTIFICATE=344 A transaction failed because the TLS certificate provided for the
     * node is missing or invalid.
     * <p>
     * #### Probable Causes
     * The certificate MUST be a TLS certificate of a type permitted for gossip
     * signatures.<br/>
     * The value presented MUST be a UTF-8 NFKD encoding of the TLS
     * certificate.<br/>
     * The certificate encoded MUST be in PEM format.<br/>
     * The `gossip_ca_certificate` field is REQUIRED and MUST NOT be empty.
     * @property {number} INVALID_GRPC_CERTIFICATE=345 A transaction failed because the hash provided for the gRPC certificate
     * is present but invalid.
     * <p>
     * #### Probable Causes
     * The `grpc_certificate_hash` MUST be a SHA-384 hash.<br/>
     * The input hashed MUST be a UTF-8 NFKD encoding of the actual TLS
     * certificate.<br/>
     * The certificate to be encoded MUST be in PEM format.
     * @property {number} INVALID_MAX_AUTO_ASSOCIATIONS=346 The maximum automatic associations value is not valid.<br/>
     * The most common cause for this error is a value less than `-1`.
     * @property {number} MAX_NODES_CREATED=347 The maximum number of nodes allowed in the address book have been created.
     * @property {number} IP_FQDN_CANNOT_BE_SET_FOR_SAME_ENDPOINT=348 In ServiceEndpoint, domain_name and ipAddressV4 are mutually exclusive
     * @property {number} GOSSIP_ENDPOINT_CANNOT_HAVE_FQDN=349 Fully qualified domain name is not allowed in gossip_endpoint
     * @property {number} FQDN_SIZE_TOO_LARGE=350 In ServiceEndpoint, domain_name size too large
     * @property {number} INVALID_ENDPOINT=351 ServiceEndpoint is invalid
     * @property {number} GOSSIP_ENDPOINTS_EXCEEDED_LIMIT=352 The number of gossip endpoints exceeds the limit
     * @property {number} TOKEN_REFERENCE_REPEATED=353 The transaction attempted to use duplicate `TokenReference`.<br/>
     * This affects `TokenReject` attempting to reject same token reference more than once.
     * @property {number} INVALID_OWNER_ID=354 The account id specified as the owner in `TokenReject` is invalid or does not exist.
     * @property {number} TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED=355 The transaction attempted to use more than the allowed number of `TokenReference`.
     * @property {number} SERVICE_ENDPOINTS_EXCEEDED_LIMIT=356 The number of service endpoints exceeds the limit
     * @property {number} INVALID_IPV4_ADDRESS=357 INVALID_IPV4_ADDRESS value
     * @property {number} EMPTY_TOKEN_REFERENCE_LIST=358 The transaction attempted to use empty `TokenReference` list.
     * @property {number} UPDATE_NODE_ACCOUNT_NOT_ALLOWED=359 UPDATE_NODE_ACCOUNT_NOT_ALLOWED value
     * @property {number} TOKEN_HAS_NO_METADATA_OR_SUPPLY_KEY=360 TOKEN_HAS_NO_METADATA_OR_SUPPLY_KEY value
     * @property {number} EMPTY_PENDING_AIRDROP_ID_LIST=361 The list of `PendingAirdropId`s is empty and MUST NOT be empty.
     * @property {number} PENDING_AIRDROP_ID_REPEATED=362 A `PendingAirdropId` is repeated in a `claim` or `cancel` transaction.
     * @property {number} PENDING_AIRDROP_ID_LIST_TOO_LONG=363 The number of `PendingAirdropId` values in the list exceeds the maximum
     * allowable number.
     * @property {number} PENDING_NFT_AIRDROP_ALREADY_EXISTS=364 PENDING_NFT_AIRDROP_ALREADY_EXISTS value
     * @property {number} ACCOUNT_HAS_PENDING_AIRDROPS=365 ACCOUNT_HAS_PENDING_AIRDROPS value
     * @property {number} THROTTLED_AT_CONSENSUS=366 Consensus throttle did not allow execution of this transaction.<br/>
     * The transaction should be retried after a modest delay.
     * @property {number} INVALID_PENDING_AIRDROP_ID=367 The provided pending airdrop id is invalid.<br/>
     * This pending airdrop MAY already be claimed or cancelled.
     * <p>
     * The client SHOULD query a mirror node to determine the current status of
     * the pending airdrop.
     * @property {number} TOKEN_AIRDROP_WITH_FALLBACK_ROYALTY=368 The token to be airdropped has a fallback royalty fee and cannot be
     * sent or claimed via an airdrop transaction.
     * @property {number} INVALID_TOKEN_IN_PENDING_AIRDROP=369 This airdrop claim is for a pending airdrop with an invalid token.<br/>
     * The token might be deleted, or the sender may not have enough tokens
     * to fulfill the offer.
     * <p>
     * The client SHOULD query mirror node to determine the status of the
     * pending airdrop and whether the sender can fulfill the offer.
     * @property {number} SCHEDULE_EXPIRY_IS_BUSY=370 A scheduled transaction configured to wait for expiry to execute was given
     * an expiry time at which there is already too many transactions scheduled to
     * expire; its creation must be retried with a different expiry.
     * @property {number} INVALID_GRPC_CERTIFICATE_HASH=371 The provided gRPC certificate hash is invalid.
     * @property {number} MISSING_EXPIRY_TIME=372 A scheduled transaction configured to wait for expiry to execute was not
     * given an explicit expiration time.
     * @property {number} NO_SCHEDULING_ALLOWED_AFTER_SCHEDULED_RECURSION=373 A contract operation attempted to schedule another transaction after it
     * had already scheduled a recursive contract call.
     * @property {number} RECURSIVE_SCHEDULING_LIMIT_REACHED=374 A contract can schedule recursive calls a finite number of times (this is
     * approximately four million times with typical network configuration.)
     * @property {number} WAITING_FOR_LEDGER_ID=375 The target network is waiting for the ledger ID to be set, which is a
     * side effect of finishing the network's TSS construction.
     * @property {number} MAX_ENTRIES_FOR_FEE_EXEMPT_KEY_LIST_EXCEEDED=376 The provided fee exempt key list size exceeded the limit.
     * @property {number} FEE_EXEMPT_KEY_LIST_CONTAINS_DUPLICATED_KEYS=377 The provided fee exempt key list contains duplicated keys.
     * @property {number} INVALID_KEY_IN_FEE_EXEMPT_KEY_LIST=378 The provided fee exempt key list contains an invalid key.
     * @property {number} INVALID_FEE_SCHEDULE_KEY=379 The provided fee schedule key contains an invalid key.
     * @property {number} FEE_SCHEDULE_KEY_CANNOT_BE_UPDATED=380 If a fee schedule key is not set when we create a topic
     * we cannot add it on update.
     * @property {number} FEE_SCHEDULE_KEY_NOT_SET=381 If the topic's custom fees are updated the topic SHOULD have a
     * fee schedule key
     * @property {number} MAX_CUSTOM_FEE_LIMIT_EXCEEDED=382 The fee amount is exceeding the amount that the payer
     * is willing to pay.
     * @property {number} NO_VALID_MAX_CUSTOM_FEE=383 There are no corresponding custom fees.
     * @property {number} INVALID_MAX_CUSTOM_FEES=384 The provided list contains invalid max custom fee.
     * @property {number} DUPLICATE_DENOMINATION_IN_MAX_CUSTOM_FEE_LIST=385 The provided max custom fee list contains fees with
     * duplicate denominations.
     * @property {number} DUPLICATE_ACCOUNT_ID_IN_MAX_CUSTOM_FEE_LIST=386 The provided max custom fee list contains fees with
     * duplicate account id.
     * @property {number} MAX_CUSTOM_FEES_IS_NOT_SUPPORTED=387 Max custom fees list is not supported for this operation.
     * @property {number} BATCH_LIST_EMPTY=388 The list of batch transactions is empty
     * @property {number} BATCH_LIST_CONTAINS_DUPLICATES=389 The list of batch transactions contains duplicated transactions
     * @property {number} BATCH_TRANSACTION_IN_BLACKLIST=390 The list of batch transactions contains a transaction type that is
     * in the AtomicBatch blacklist as configured in the network.
     * @property {number} INNER_TRANSACTION_FAILED=391 The inner transaction of a batch transaction failed
     * @property {number} MISSING_BATCH_KEY=392 The inner transaction of a batch transaction is missing a batch key
     * @property {number} BATCH_KEY_SET_ON_NON_INNER_TRANSACTION=393 The batch key is set for a non batch transaction
     * @property {number} INVALID_BATCH_KEY=394 The batch key is not valid
     * @property {number} SCHEDULE_EXPIRY_NOT_CONFIGURABLE=395 The provided schedule expiry time is not configurable.
     * @property {number} CREATING_SYSTEM_ENTITIES=396 The network just started at genesis and is creating system entities.
     * @property {number} THROTTLE_GROUP_LCM_OVERFLOW=397 The least common multiple of the throttle group's milliOpsPerSec is
     * too large and it's overflowing.
     * @property {number} AIRDROP_CONTAINS_MULTIPLE_SENDERS_FOR_A_TOKEN=398 Token airdrop transactions can not contain multiple senders for a single token.
     * @property {number} GRPC_WEB_PROXY_NOT_SUPPORTED=399 The GRPC proxy endpoint is set in the NodeCreate or NodeUpdate transaction,
     * which the network does not support.
     * @property {number} NFT_TRANSFERS_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE=400 An NFT transfers list referenced a token type other than NON_FUNGIBLE_UNIQUE.
     */
    proto.ResponseCodeEnum = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "OK"] = 0;
        values[valuesById[1] = "INVALID_TRANSACTION"] = 1;
        values[valuesById[2] = "PAYER_ACCOUNT_NOT_FOUND"] = 2;
        values[valuesById[3] = "INVALID_NODE_ACCOUNT"] = 3;
        values[valuesById[4] = "TRANSACTION_EXPIRED"] = 4;
        values[valuesById[5] = "INVALID_TRANSACTION_START"] = 5;
        values[valuesById[6] = "INVALID_TRANSACTION_DURATION"] = 6;
        values[valuesById[7] = "INVALID_SIGNATURE"] = 7;
        values[valuesById[8] = "MEMO_TOO_LONG"] = 8;
        values[valuesById[9] = "INSUFFICIENT_TX_FEE"] = 9;
        values[valuesById[10] = "INSUFFICIENT_PAYER_BALANCE"] = 10;
        values[valuesById[11] = "DUPLICATE_TRANSACTION"] = 11;
        values[valuesById[12] = "BUSY"] = 12;
        values[valuesById[13] = "NOT_SUPPORTED"] = 13;
        values[valuesById[14] = "INVALID_FILE_ID"] = 14;
        values[valuesById[15] = "INVALID_ACCOUNT_ID"] = 15;
        values[valuesById[16] = "INVALID_CONTRACT_ID"] = 16;
        values[valuesById[17] = "INVALID_TRANSACTION_ID"] = 17;
        values[valuesById[18] = "RECEIPT_NOT_FOUND"] = 18;
        values[valuesById[19] = "RECORD_NOT_FOUND"] = 19;
        values[valuesById[20] = "INVALID_SOLIDITY_ID"] = 20;
        values[valuesById[21] = "UNKNOWN"] = 21;
        values[valuesById[22] = "SUCCESS"] = 22;
        values[valuesById[23] = "FAIL_INVALID"] = 23;
        values[valuesById[24] = "FAIL_FEE"] = 24;
        values[valuesById[25] = "FAIL_BALANCE"] = 25;
        values[valuesById[26] = "KEY_REQUIRED"] = 26;
        values[valuesById[27] = "BAD_ENCODING"] = 27;
        values[valuesById[28] = "INSUFFICIENT_ACCOUNT_BALANCE"] = 28;
        values[valuesById[29] = "INVALID_SOLIDITY_ADDRESS"] = 29;
        values[valuesById[30] = "INSUFFICIENT_GAS"] = 30;
        values[valuesById[31] = "CONTRACT_SIZE_LIMIT_EXCEEDED"] = 31;
        values[valuesById[32] = "LOCAL_CALL_MODIFICATION_EXCEPTION"] = 32;
        values[valuesById[33] = "CONTRACT_REVERT_EXECUTED"] = 33;
        values[valuesById[34] = "CONTRACT_EXECUTION_EXCEPTION"] = 34;
        values[valuesById[35] = "INVALID_RECEIVING_NODE_ACCOUNT"] = 35;
        values[valuesById[36] = "MISSING_QUERY_HEADER"] = 36;
        values[valuesById[37] = "ACCOUNT_UPDATE_FAILED"] = 37;
        values[valuesById[38] = "INVALID_KEY_ENCODING"] = 38;
        values[valuesById[39] = "NULL_SOLIDITY_ADDRESS"] = 39;
        values[valuesById[40] = "CONTRACT_UPDATE_FAILED"] = 40;
        values[valuesById[41] = "INVALID_QUERY_HEADER"] = 41;
        values[valuesById[42] = "INVALID_FEE_SUBMITTED"] = 42;
        values[valuesById[43] = "INVALID_PAYER_SIGNATURE"] = 43;
        values[valuesById[44] = "KEY_NOT_PROVIDED"] = 44;
        values[valuesById[45] = "INVALID_EXPIRATION_TIME"] = 45;
        values[valuesById[46] = "NO_WACL_KEY"] = 46;
        values[valuesById[47] = "FILE_CONTENT_EMPTY"] = 47;
        values[valuesById[48] = "INVALID_ACCOUNT_AMOUNTS"] = 48;
        values[valuesById[49] = "EMPTY_TRANSACTION_BODY"] = 49;
        values[valuesById[50] = "INVALID_TRANSACTION_BODY"] = 50;
        values[valuesById[51] = "INVALID_SIGNATURE_TYPE_MISMATCHING_KEY"] = 51;
        values[valuesById[52] = "INVALID_SIGNATURE_COUNT_MISMATCHING_KEY"] = 52;
        values[valuesById[53] = "EMPTY_LIVE_HASH_BODY"] = 53;
        values[valuesById[54] = "EMPTY_LIVE_HASH"] = 54;
        values[valuesById[55] = "EMPTY_LIVE_HASH_KEYS"] = 55;
        values[valuesById[56] = "INVALID_LIVE_HASH_SIZE"] = 56;
        values[valuesById[57] = "EMPTY_QUERY_BODY"] = 57;
        values[valuesById[58] = "EMPTY_LIVE_HASH_QUERY"] = 58;
        values[valuesById[59] = "LIVE_HASH_NOT_FOUND"] = 59;
        values[valuesById[60] = "ACCOUNT_ID_DOES_NOT_EXIST"] = 60;
        values[valuesById[61] = "LIVE_HASH_ALREADY_EXISTS"] = 61;
        values[valuesById[62] = "INVALID_FILE_WACL"] = 62;
        values[valuesById[63] = "SERIALIZATION_FAILED"] = 63;
        values[valuesById[64] = "TRANSACTION_OVERSIZE"] = 64;
        values[valuesById[65] = "TRANSACTION_TOO_MANY_LAYERS"] = 65;
        values[valuesById[66] = "CONTRACT_DELETED"] = 66;
        values[valuesById[67] = "PLATFORM_NOT_ACTIVE"] = 67;
        values[valuesById[68] = "KEY_PREFIX_MISMATCH"] = 68;
        values[valuesById[69] = "PLATFORM_TRANSACTION_NOT_CREATED"] = 69;
        values[valuesById[70] = "INVALID_RENEWAL_PERIOD"] = 70;
        values[valuesById[71] = "INVALID_PAYER_ACCOUNT_ID"] = 71;
        values[valuesById[72] = "ACCOUNT_DELETED"] = 72;
        values[valuesById[73] = "FILE_DELETED"] = 73;
        values[valuesById[74] = "ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS"] = 74;
        values[valuesById[75] = "SETTING_NEGATIVE_ACCOUNT_BALANCE"] = 75;
        values[valuesById[76] = "OBTAINER_REQUIRED"] = 76;
        values[valuesById[77] = "OBTAINER_SAME_CONTRACT_ID"] = 77;
        values[valuesById[78] = "OBTAINER_DOES_NOT_EXIST"] = 78;
        values[valuesById[79] = "MODIFYING_IMMUTABLE_CONTRACT"] = 79;
        values[valuesById[80] = "FILE_SYSTEM_EXCEPTION"] = 80;
        values[valuesById[81] = "AUTORENEW_DURATION_NOT_IN_RANGE"] = 81;
        values[valuesById[82] = "ERROR_DECODING_BYTESTRING"] = 82;
        values[valuesById[83] = "CONTRACT_FILE_EMPTY"] = 83;
        values[valuesById[84] = "CONTRACT_BYTECODE_EMPTY"] = 84;
        values[valuesById[85] = "INVALID_INITIAL_BALANCE"] = 85;
        values[valuesById[86] = "INVALID_RECEIVE_RECORD_THRESHOLD"] = 86;
        values[valuesById[87] = "INVALID_SEND_RECORD_THRESHOLD"] = 87;
        values[valuesById[88] = "ACCOUNT_IS_NOT_GENESIS_ACCOUNT"] = 88;
        values[valuesById[89] = "PAYER_ACCOUNT_UNAUTHORIZED"] = 89;
        values[valuesById[90] = "INVALID_FREEZE_TRANSACTION_BODY"] = 90;
        values[valuesById[91] = "FREEZE_TRANSACTION_BODY_NOT_FOUND"] = 91;
        values[valuesById[92] = "TRANSFER_LIST_SIZE_LIMIT_EXCEEDED"] = 92;
        values[valuesById[93] = "RESULT_SIZE_LIMIT_EXCEEDED"] = 93;
        values[valuesById[94] = "NOT_SPECIAL_ACCOUNT"] = 94;
        values[valuesById[95] = "CONTRACT_NEGATIVE_GAS"] = 95;
        values[valuesById[96] = "CONTRACT_NEGATIVE_VALUE"] = 96;
        values[valuesById[97] = "INVALID_FEE_FILE"] = 97;
        values[valuesById[98] = "INVALID_EXCHANGE_RATE_FILE"] = 98;
        values[valuesById[99] = "INSUFFICIENT_LOCAL_CALL_GAS"] = 99;
        values[valuesById[100] = "ENTITY_NOT_ALLOWED_TO_DELETE"] = 100;
        values[valuesById[101] = "AUTHORIZATION_FAILED"] = 101;
        values[valuesById[102] = "FILE_UPLOADED_PROTO_INVALID"] = 102;
        values[valuesById[103] = "FILE_UPLOADED_PROTO_NOT_SAVED_TO_DISK"] = 103;
        values[valuesById[104] = "FEE_SCHEDULE_FILE_PART_UPLOADED"] = 104;
        values[valuesById[105] = "EXCHANGE_RATE_CHANGE_LIMIT_EXCEEDED"] = 105;
        values[valuesById[106] = "MAX_CONTRACT_STORAGE_EXCEEDED"] = 106;
        values[valuesById[107] = "TRANSFER_ACCOUNT_SAME_AS_DELETE_ACCOUNT"] = 107;
        values[valuesById[108] = "TOTAL_LEDGER_BALANCE_INVALID"] = 108;
        values[valuesById[110] = "EXPIRATION_REDUCTION_NOT_ALLOWED"] = 110;
        values[valuesById[111] = "MAX_GAS_LIMIT_EXCEEDED"] = 111;
        values[valuesById[112] = "MAX_FILE_SIZE_EXCEEDED"] = 112;
        values[valuesById[113] = "RECEIVER_SIG_REQUIRED"] = 113;
        values[valuesById[150] = "INVALID_TOPIC_ID"] = 150;
        values[valuesById[155] = "INVALID_ADMIN_KEY"] = 155;
        values[valuesById[156] = "INVALID_SUBMIT_KEY"] = 156;
        values[valuesById[157] = "UNAUTHORIZED"] = 157;
        values[valuesById[158] = "INVALID_TOPIC_MESSAGE"] = 158;
        values[valuesById[159] = "INVALID_AUTORENEW_ACCOUNT"] = 159;
        values[valuesById[160] = "AUTORENEW_ACCOUNT_NOT_ALLOWED"] = 160;
        values[valuesById[162] = "TOPIC_EXPIRED"] = 162;
        values[valuesById[163] = "INVALID_CHUNK_NUMBER"] = 163;
        values[valuesById[164] = "INVALID_CHUNK_TRANSACTION_ID"] = 164;
        values[valuesById[165] = "ACCOUNT_FROZEN_FOR_TOKEN"] = 165;
        values[valuesById[166] = "TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED"] = 166;
        values[valuesById[167] = "INVALID_TOKEN_ID"] = 167;
        values[valuesById[168] = "INVALID_TOKEN_DECIMALS"] = 168;
        values[valuesById[169] = "INVALID_TOKEN_INITIAL_SUPPLY"] = 169;
        values[valuesById[170] = "INVALID_TREASURY_ACCOUNT_FOR_TOKEN"] = 170;
        values[valuesById[171] = "INVALID_TOKEN_SYMBOL"] = 171;
        values[valuesById[172] = "TOKEN_HAS_NO_FREEZE_KEY"] = 172;
        values[valuesById[173] = "TRANSFERS_NOT_ZERO_SUM_FOR_TOKEN"] = 173;
        values[valuesById[174] = "MISSING_TOKEN_SYMBOL"] = 174;
        values[valuesById[175] = "TOKEN_SYMBOL_TOO_LONG"] = 175;
        values[valuesById[176] = "ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN"] = 176;
        values[valuesById[177] = "TOKEN_HAS_NO_KYC_KEY"] = 177;
        values[valuesById[178] = "INSUFFICIENT_TOKEN_BALANCE"] = 178;
        values[valuesById[179] = "TOKEN_WAS_DELETED"] = 179;
        values[valuesById[180] = "TOKEN_HAS_NO_SUPPLY_KEY"] = 180;
        values[valuesById[181] = "TOKEN_HAS_NO_WIPE_KEY"] = 181;
        values[valuesById[182] = "INVALID_TOKEN_MINT_AMOUNT"] = 182;
        values[valuesById[183] = "INVALID_TOKEN_BURN_AMOUNT"] = 183;
        values[valuesById[184] = "TOKEN_NOT_ASSOCIATED_TO_ACCOUNT"] = 184;
        values[valuesById[185] = "CANNOT_WIPE_TOKEN_TREASURY_ACCOUNT"] = 185;
        values[valuesById[186] = "INVALID_KYC_KEY"] = 186;
        values[valuesById[187] = "INVALID_WIPE_KEY"] = 187;
        values[valuesById[188] = "INVALID_FREEZE_KEY"] = 188;
        values[valuesById[189] = "INVALID_SUPPLY_KEY"] = 189;
        values[valuesById[190] = "MISSING_TOKEN_NAME"] = 190;
        values[valuesById[191] = "TOKEN_NAME_TOO_LONG"] = 191;
        values[valuesById[192] = "INVALID_WIPING_AMOUNT"] = 192;
        values[valuesById[193] = "TOKEN_IS_IMMUTABLE"] = 193;
        values[valuesById[194] = "TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT"] = 194;
        values[valuesById[195] = "TRANSACTION_REQUIRES_ZERO_TOKEN_BALANCES"] = 195;
        values[valuesById[196] = "ACCOUNT_IS_TREASURY"] = 196;
        values[valuesById[197] = "TOKEN_ID_REPEATED_IN_TOKEN_LIST"] = 197;
        values[valuesById[198] = "TOKEN_TRANSFER_LIST_SIZE_LIMIT_EXCEEDED"] = 198;
        values[valuesById[199] = "EMPTY_TOKEN_TRANSFER_BODY"] = 199;
        values[valuesById[200] = "EMPTY_TOKEN_TRANSFER_ACCOUNT_AMOUNTS"] = 200;
        values[valuesById[201] = "INVALID_SCHEDULE_ID"] = 201;
        values[valuesById[202] = "SCHEDULE_IS_IMMUTABLE"] = 202;
        values[valuesById[203] = "INVALID_SCHEDULE_PAYER_ID"] = 203;
        values[valuesById[204] = "INVALID_SCHEDULE_ACCOUNT_ID"] = 204;
        values[valuesById[205] = "NO_NEW_VALID_SIGNATURES"] = 205;
        values[valuesById[206] = "UNRESOLVABLE_REQUIRED_SIGNERS"] = 206;
        values[valuesById[207] = "SCHEDULED_TRANSACTION_NOT_IN_WHITELIST"] = 207;
        values[valuesById[208] = "SOME_SIGNATURES_WERE_INVALID"] = 208;
        values[valuesById[209] = "TRANSACTION_ID_FIELD_NOT_ALLOWED"] = 209;
        values[valuesById[210] = "IDENTICAL_SCHEDULE_ALREADY_CREATED"] = 210;
        values[valuesById[211] = "INVALID_ZERO_BYTE_IN_STRING"] = 211;
        values[valuesById[212] = "SCHEDULE_ALREADY_DELETED"] = 212;
        values[valuesById[213] = "SCHEDULE_ALREADY_EXECUTED"] = 213;
        values[valuesById[214] = "MESSAGE_SIZE_TOO_LARGE"] = 214;
        values[valuesById[215] = "OPERATION_REPEATED_IN_BUCKET_GROUPS"] = 215;
        values[valuesById[216] = "BUCKET_CAPACITY_OVERFLOW"] = 216;
        values[valuesById[217] = "NODE_CAPACITY_NOT_SUFFICIENT_FOR_OPERATION"] = 217;
        values[valuesById[218] = "BUCKET_HAS_NO_THROTTLE_GROUPS"] = 218;
        values[valuesById[219] = "THROTTLE_GROUP_HAS_ZERO_OPS_PER_SEC"] = 219;
        values[valuesById[220] = "SUCCESS_BUT_MISSING_EXPECTED_OPERATION"] = 220;
        values[valuesById[221] = "UNPARSEABLE_THROTTLE_DEFINITIONS"] = 221;
        values[valuesById[222] = "INVALID_THROTTLE_DEFINITIONS"] = 222;
        values[valuesById[223] = "ACCOUNT_EXPIRED_AND_PENDING_REMOVAL"] = 223;
        values[valuesById[224] = "INVALID_TOKEN_MAX_SUPPLY"] = 224;
        values[valuesById[225] = "INVALID_TOKEN_NFT_SERIAL_NUMBER"] = 225;
        values[valuesById[226] = "INVALID_NFT_ID"] = 226;
        values[valuesById[227] = "METADATA_TOO_LONG"] = 227;
        values[valuesById[228] = "BATCH_SIZE_LIMIT_EXCEEDED"] = 228;
        values[valuesById[229] = "INVALID_QUERY_RANGE"] = 229;
        values[valuesById[230] = "FRACTION_DIVIDES_BY_ZERO"] = 230;
        values[valuesById[231] = "INSUFFICIENT_PAYER_BALANCE_FOR_CUSTOM_FEE"] = 231;
        values[valuesById[232] = "CUSTOM_FEES_LIST_TOO_LONG"] = 232;
        values[valuesById[233] = "INVALID_CUSTOM_FEE_COLLECTOR"] = 233;
        values[valuesById[234] = "INVALID_TOKEN_ID_IN_CUSTOM_FEES"] = 234;
        values[valuesById[235] = "TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR"] = 235;
        values[valuesById[236] = "TOKEN_MAX_SUPPLY_REACHED"] = 236;
        values[valuesById[237] = "SENDER_DOES_NOT_OWN_NFT_SERIAL_NO"] = 237;
        values[valuesById[238] = "CUSTOM_FEE_NOT_FULLY_SPECIFIED"] = 238;
        values[valuesById[239] = "CUSTOM_FEE_MUST_BE_POSITIVE"] = 239;
        values[valuesById[240] = "TOKEN_HAS_NO_FEE_SCHEDULE_KEY"] = 240;
        values[valuesById[241] = "CUSTOM_FEE_OUTSIDE_NUMERIC_RANGE"] = 241;
        values[valuesById[242] = "ROYALTY_FRACTION_CANNOT_EXCEED_ONE"] = 242;
        values[valuesById[243] = "FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT"] = 243;
        values[valuesById[244] = "CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES"] = 244;
        values[valuesById[245] = "CUSTOM_FEE_DENOMINATION_MUST_BE_FUNGIBLE_COMMON"] = 245;
        values[valuesById[246] = "CUSTOM_FRACTIONAL_FEE_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON"] = 246;
        values[valuesById[247] = "INVALID_CUSTOM_FEE_SCHEDULE_KEY"] = 247;
        values[valuesById[248] = "INVALID_TOKEN_MINT_METADATA"] = 248;
        values[valuesById[249] = "INVALID_TOKEN_BURN_METADATA"] = 249;
        values[valuesById[250] = "CURRENT_TREASURY_STILL_OWNS_NFTS"] = 250;
        values[valuesById[251] = "ACCOUNT_STILL_OWNS_NFTS"] = 251;
        values[valuesById[252] = "TREASURY_MUST_OWN_BURNED_NFT"] = 252;
        values[valuesById[253] = "ACCOUNT_DOES_NOT_OWN_WIPED_NFT"] = 253;
        values[valuesById[254] = "ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON"] = 254;
        values[valuesById[255] = "MAX_NFTS_IN_PRICE_REGIME_HAVE_BEEN_MINTED"] = 255;
        values[valuesById[256] = "PAYER_ACCOUNT_DELETED"] = 256;
        values[valuesById[257] = "CUSTOM_FEE_CHARGING_EXCEEDED_MAX_RECURSION_DEPTH"] = 257;
        values[valuesById[258] = "CUSTOM_FEE_CHARGING_EXCEEDED_MAX_ACCOUNT_AMOUNTS"] = 258;
        values[valuesById[259] = "INSUFFICIENT_SENDER_ACCOUNT_BALANCE_FOR_CUSTOM_FEE"] = 259;
        values[valuesById[260] = "SERIAL_NUMBER_LIMIT_REACHED"] = 260;
        values[valuesById[261] = "CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE"] = 261;
        values[valuesById[262] = "NO_REMAINING_AUTOMATIC_ASSOCIATIONS"] = 262;
        values[valuesById[263] = "EXISTING_AUTOMATIC_ASSOCIATIONS_EXCEED_GIVEN_LIMIT"] = 263;
        values[valuesById[264] = "REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT"] = 264;
        values[valuesById[265] = "TOKEN_IS_PAUSED"] = 265;
        values[valuesById[266] = "TOKEN_HAS_NO_PAUSE_KEY"] = 266;
        values[valuesById[267] = "INVALID_PAUSE_KEY"] = 267;
        values[valuesById[268] = "FREEZE_UPDATE_FILE_DOES_NOT_EXIST"] = 268;
        values[valuesById[269] = "FREEZE_UPDATE_FILE_HASH_DOES_NOT_MATCH"] = 269;
        values[valuesById[270] = "NO_UPGRADE_HAS_BEEN_PREPARED"] = 270;
        values[valuesById[271] = "NO_FREEZE_IS_SCHEDULED"] = 271;
        values[valuesById[272] = "UPDATE_FILE_HASH_CHANGED_SINCE_PREPARE_UPGRADE"] = 272;
        values[valuesById[273] = "FREEZE_START_TIME_MUST_BE_FUTURE"] = 273;
        values[valuesById[274] = "PREPARED_UPDATE_FILE_IS_IMMUTABLE"] = 274;
        values[valuesById[275] = "FREEZE_ALREADY_SCHEDULED"] = 275;
        values[valuesById[276] = "FREEZE_UPGRADE_IN_PROGRESS"] = 276;
        values[valuesById[277] = "UPDATE_FILE_ID_DOES_NOT_MATCH_PREPARED"] = 277;
        values[valuesById[278] = "UPDATE_FILE_HASH_DOES_NOT_MATCH_PREPARED"] = 278;
        values[valuesById[279] = "CONSENSUS_GAS_EXHAUSTED"] = 279;
        values[valuesById[280] = "REVERTED_SUCCESS"] = 280;
        values[valuesById[281] = "MAX_STORAGE_IN_PRICE_REGIME_HAS_BEEN_USED"] = 281;
        values[valuesById[282] = "INVALID_ALIAS_KEY"] = 282;
        values[valuesById[283] = "UNEXPECTED_TOKEN_DECIMALS"] = 283;
        values[valuesById[284] = "INVALID_PROXY_ACCOUNT_ID"] = 284;
        values[valuesById[285] = "INVALID_TRANSFER_ACCOUNT_ID"] = 285;
        values[valuesById[286] = "INVALID_FEE_COLLECTOR_ACCOUNT_ID"] = 286;
        values[valuesById[287] = "ALIAS_IS_IMMUTABLE"] = 287;
        values[valuesById[288] = "SPENDER_ACCOUNT_SAME_AS_OWNER"] = 288;
        values[valuesById[289] = "AMOUNT_EXCEEDS_TOKEN_MAX_SUPPLY"] = 289;
        values[valuesById[290] = "NEGATIVE_ALLOWANCE_AMOUNT"] = 290;
        values[valuesById[291] = "CANNOT_APPROVE_FOR_ALL_FUNGIBLE_COMMON"] = 291;
        values[valuesById[292] = "SPENDER_DOES_NOT_HAVE_ALLOWANCE"] = 292;
        values[valuesById[293] = "AMOUNT_EXCEEDS_ALLOWANCE"] = 293;
        values[valuesById[294] = "MAX_ALLOWANCES_EXCEEDED"] = 294;
        values[valuesById[295] = "EMPTY_ALLOWANCES"] = 295;
        values[valuesById[296] = "SPENDER_ACCOUNT_REPEATED_IN_ALLOWANCES"] = 296;
        values[valuesById[297] = "REPEATED_SERIAL_NUMS_IN_NFT_ALLOWANCES"] = 297;
        values[valuesById[298] = "FUNGIBLE_TOKEN_IN_NFT_ALLOWANCES"] = 298;
        values[valuesById[299] = "NFT_IN_FUNGIBLE_TOKEN_ALLOWANCES"] = 299;
        values[valuesById[300] = "INVALID_ALLOWANCE_OWNER_ID"] = 300;
        values[valuesById[301] = "INVALID_ALLOWANCE_SPENDER_ID"] = 301;
        values[valuesById[302] = "REPEATED_ALLOWANCES_TO_DELETE"] = 302;
        values[valuesById[303] = "INVALID_DELEGATING_SPENDER"] = 303;
        values[valuesById[304] = "DELEGATING_SPENDER_CANNOT_GRANT_APPROVE_FOR_ALL"] = 304;
        values[valuesById[305] = "DELEGATING_SPENDER_DOES_NOT_HAVE_APPROVE_FOR_ALL"] = 305;
        values[valuesById[306] = "SCHEDULE_EXPIRATION_TIME_TOO_FAR_IN_FUTURE"] = 306;
        values[valuesById[307] = "SCHEDULE_EXPIRATION_TIME_MUST_BE_HIGHER_THAN_CONSENSUS_TIME"] = 307;
        values[valuesById[308] = "SCHEDULE_FUTURE_THROTTLE_EXCEEDED"] = 308;
        values[valuesById[309] = "SCHEDULE_FUTURE_GAS_LIMIT_EXCEEDED"] = 309;
        values[valuesById[310] = "INVALID_ETHEREUM_TRANSACTION"] = 310;
        values[valuesById[311] = "WRONG_CHAIN_ID"] = 311;
        values[valuesById[312] = "WRONG_NONCE"] = 312;
        values[valuesById[313] = "ACCESS_LIST_UNSUPPORTED"] = 313;
        values[valuesById[314] = "SCHEDULE_PENDING_EXPIRATION"] = 314;
        values[valuesById[315] = "CONTRACT_IS_TOKEN_TREASURY"] = 315;
        values[valuesById[316] = "CONTRACT_HAS_NON_ZERO_TOKEN_BALANCES"] = 316;
        values[valuesById[317] = "CONTRACT_EXPIRED_AND_PENDING_REMOVAL"] = 317;
        values[valuesById[318] = "CONTRACT_HAS_NO_AUTO_RENEW_ACCOUNT"] = 318;
        values[valuesById[319] = "PERMANENT_REMOVAL_REQUIRES_SYSTEM_INITIATION"] = 319;
        values[valuesById[320] = "PROXY_ACCOUNT_ID_FIELD_IS_DEPRECATED"] = 320;
        values[valuesById[321] = "SELF_STAKING_IS_NOT_ALLOWED"] = 321;
        values[valuesById[322] = "INVALID_STAKING_ID"] = 322;
        values[valuesById[323] = "STAKING_NOT_ENABLED"] = 323;
        values[valuesById[324] = "INVALID_PRNG_RANGE"] = 324;
        values[valuesById[325] = "MAX_ENTITIES_IN_PRICE_REGIME_HAVE_BEEN_CREATED"] = 325;
        values[valuesById[326] = "INVALID_FULL_PREFIX_SIGNATURE_FOR_PRECOMPILE"] = 326;
        values[valuesById[327] = "INSUFFICIENT_BALANCES_FOR_STORAGE_RENT"] = 327;
        values[valuesById[328] = "MAX_CHILD_RECORDS_EXCEEDED"] = 328;
        values[valuesById[329] = "INSUFFICIENT_BALANCES_FOR_RENEWAL_FEES"] = 329;
        values[valuesById[330] = "TRANSACTION_HAS_UNKNOWN_FIELDS"] = 330;
        values[valuesById[331] = "ACCOUNT_IS_IMMUTABLE"] = 331;
        values[valuesById[332] = "ALIAS_ALREADY_ASSIGNED"] = 332;
        values[valuesById[333] = "INVALID_METADATA_KEY"] = 333;
        values[valuesById[334] = "TOKEN_HAS_NO_METADATA_KEY"] = 334;
        values[valuesById[335] = "MISSING_TOKEN_METADATA"] = 335;
        values[valuesById[336] = "MISSING_SERIAL_NUMBERS"] = 336;
        values[valuesById[337] = "TOKEN_HAS_NO_ADMIN_KEY"] = 337;
        values[valuesById[338] = "NODE_DELETED"] = 338;
        values[valuesById[339] = "INVALID_NODE_ID"] = 339;
        values[valuesById[340] = "INVALID_GOSSIP_ENDPOINT"] = 340;
        values[valuesById[341] = "INVALID_NODE_ACCOUNT_ID"] = 341;
        values[valuesById[342] = "INVALID_NODE_DESCRIPTION"] = 342;
        values[valuesById[343] = "INVALID_SERVICE_ENDPOINT"] = 343;
        values[valuesById[344] = "INVALID_GOSSIP_CA_CERTIFICATE"] = 344;
        values[valuesById[345] = "INVALID_GRPC_CERTIFICATE"] = 345;
        values[valuesById[346] = "INVALID_MAX_AUTO_ASSOCIATIONS"] = 346;
        values[valuesById[347] = "MAX_NODES_CREATED"] = 347;
        values[valuesById[348] = "IP_FQDN_CANNOT_BE_SET_FOR_SAME_ENDPOINT"] = 348;
        values[valuesById[349] = "GOSSIP_ENDPOINT_CANNOT_HAVE_FQDN"] = 349;
        values[valuesById[350] = "FQDN_SIZE_TOO_LARGE"] = 350;
        values[valuesById[351] = "INVALID_ENDPOINT"] = 351;
        values[valuesById[352] = "GOSSIP_ENDPOINTS_EXCEEDED_LIMIT"] = 352;
        values[valuesById[353] = "TOKEN_REFERENCE_REPEATED"] = 353;
        values[valuesById[354] = "INVALID_OWNER_ID"] = 354;
        values[valuesById[355] = "TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED"] = 355;
        values[valuesById[356] = "SERVICE_ENDPOINTS_EXCEEDED_LIMIT"] = 356;
        values[valuesById[357] = "INVALID_IPV4_ADDRESS"] = 357;
        values[valuesById[358] = "EMPTY_TOKEN_REFERENCE_LIST"] = 358;
        values[valuesById[359] = "UPDATE_NODE_ACCOUNT_NOT_ALLOWED"] = 359;
        values[valuesById[360] = "TOKEN_HAS_NO_METADATA_OR_SUPPLY_KEY"] = 360;
        values[valuesById[361] = "EMPTY_PENDING_AIRDROP_ID_LIST"] = 361;
        values[valuesById[362] = "PENDING_AIRDROP_ID_REPEATED"] = 362;
        values[valuesById[363] = "PENDING_AIRDROP_ID_LIST_TOO_LONG"] = 363;
        values[valuesById[364] = "PENDING_NFT_AIRDROP_ALREADY_EXISTS"] = 364;
        values[valuesById[365] = "ACCOUNT_HAS_PENDING_AIRDROPS"] = 365;
        values[valuesById[366] = "THROTTLED_AT_CONSENSUS"] = 366;
        values[valuesById[367] = "INVALID_PENDING_AIRDROP_ID"] = 367;
        values[valuesById[368] = "TOKEN_AIRDROP_WITH_FALLBACK_ROYALTY"] = 368;
        values[valuesById[369] = "INVALID_TOKEN_IN_PENDING_AIRDROP"] = 369;
        values[valuesById[370] = "SCHEDULE_EXPIRY_IS_BUSY"] = 370;
        values[valuesById[371] = "INVALID_GRPC_CERTIFICATE_HASH"] = 371;
        values[valuesById[372] = "MISSING_EXPIRY_TIME"] = 372;
        values[valuesById[373] = "NO_SCHEDULING_ALLOWED_AFTER_SCHEDULED_RECURSION"] = 373;
        values[valuesById[374] = "RECURSIVE_SCHEDULING_LIMIT_REACHED"] = 374;
        values[valuesById[375] = "WAITING_FOR_LEDGER_ID"] = 375;
        values[valuesById[376] = "MAX_ENTRIES_FOR_FEE_EXEMPT_KEY_LIST_EXCEEDED"] = 376;
        values[valuesById[377] = "FEE_EXEMPT_KEY_LIST_CONTAINS_DUPLICATED_KEYS"] = 377;
        values[valuesById[378] = "INVALID_KEY_IN_FEE_EXEMPT_KEY_LIST"] = 378;
        values[valuesById[379] = "INVALID_FEE_SCHEDULE_KEY"] = 379;
        values[valuesById[380] = "FEE_SCHEDULE_KEY_CANNOT_BE_UPDATED"] = 380;
        values[valuesById[381] = "FEE_SCHEDULE_KEY_NOT_SET"] = 381;
        values[valuesById[382] = "MAX_CUSTOM_FEE_LIMIT_EXCEEDED"] = 382;
        values[valuesById[383] = "NO_VALID_MAX_CUSTOM_FEE"] = 383;
        values[valuesById[384] = "INVALID_MAX_CUSTOM_FEES"] = 384;
        values[valuesById[385] = "DUPLICATE_DENOMINATION_IN_MAX_CUSTOM_FEE_LIST"] = 385;
        values[valuesById[386] = "DUPLICATE_ACCOUNT_ID_IN_MAX_CUSTOM_FEE_LIST"] = 386;
        values[valuesById[387] = "MAX_CUSTOM_FEES_IS_NOT_SUPPORTED"] = 387;
        values[valuesById[388] = "BATCH_LIST_EMPTY"] = 388;
        values[valuesById[389] = "BATCH_LIST_CONTAINS_DUPLICATES"] = 389;
        values[valuesById[390] = "BATCH_TRANSACTION_IN_BLACKLIST"] = 390;
        values[valuesById[391] = "INNER_TRANSACTION_FAILED"] = 391;
        values[valuesById[392] = "MISSING_BATCH_KEY"] = 392;
        values[valuesById[393] = "BATCH_KEY_SET_ON_NON_INNER_TRANSACTION"] = 393;
        values[valuesById[394] = "INVALID_BATCH_KEY"] = 394;
        values[valuesById[395] = "SCHEDULE_EXPIRY_NOT_CONFIGURABLE"] = 395;
        values[valuesById[396] = "CREATING_SYSTEM_ENTITIES"] = 396;
        values[valuesById[397] = "THROTTLE_GROUP_LCM_OVERFLOW"] = 397;
        values[valuesById[398] = "AIRDROP_CONTAINS_MULTIPLE_SENDERS_FOR_A_TOKEN"] = 398;
        values[valuesById[399] = "GRPC_WEB_PROXY_NOT_SUPPORTED"] = 399;
        values[valuesById[400] = "NFT_TRANSFERS_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE"] = 400;
        return values;
    })();

    return proto;
})();

export { $root as default };
