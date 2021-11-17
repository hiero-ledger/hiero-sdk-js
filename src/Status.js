/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ResponseCodeEnum} proto.ResponseCodeEnum
 */

export default class Status {
    /**
     * @hideconstructor
     * @internal
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case Status.Ok:
                return "OK";
            case Status.InvalidTransaction:
                return "INVALID_TRANSACTION";
            case Status.PayerAccountNotFound:
                return "PAYER_ACCOUNT_NOT_FOUND";
            case Status.InvalidNodeAccount:
                return "INVALID_NODE_ACCOUNT";
            case Status.TransactionExpired:
                return "TRANSACTION_EXPIRED";
            case Status.InvalidTransactionStart:
                return "INVALID_TRANSACTION_START";
            case Status.InvalidTransactionDuration:
                return "INVALID_TRANSACTION_DURATION";
            case Status.InvalidSignature:
                return "INVALID_SIGNATURE";
            case Status.MemoTooLong:
                return "MEMO_TOO_LONG";
            case Status.InsufficientTxFee:
                return "INSUFFICIENT_TX_FEE";
            case Status.InsufficientPayerBalance:
                return "INSUFFICIENT_PAYER_BALANCE";
            case Status.DuplicateTransaction:
                return "DUPLICATE_TRANSACTION";
            case Status.Busy:
                return "BUSY";
            case Status.NotSupported:
                return "NOT_SUPPORTED";
            case Status.InvalidFileId:
                return "INVALID_FILE_ID";
            case Status.InvalidAccountId:
                return "INVALID_ACCOUNT_ID";
            case Status.InvalidContractId:
                return "INVALID_CONTRACT_ID";
            case Status.InvalidTransactionId:
                return "INVALID_TRANSACTION_ID";
            case Status.ReceiptNotFound:
                return "RECEIPT_NOT_FOUND";
            case Status.RecordNotFound:
                return "RECORD_NOT_FOUND";
            case Status.InvalidSolidityId:
                return "INVALID_SOLIDITY_ID";
            case Status.Unknown:
                return "UNKNOWN";
            case Status.Success:
                return "SUCCESS";
            case Status.FailInvalid:
                return "FAIL_INVALID";
            case Status.FailFee:
                return "FAIL_FEE";
            case Status.FailBalance:
                return "FAIL_BALANCE";
            case Status.KeyRequired:
                return "KEY_REQUIRED";
            case Status.BadEncoding:
                return "BAD_ENCODING";
            case Status.InsufficientAccountBalance:
                return "INSUFFICIENT_ACCOUNT_BALANCE";
            case Status.InvalidSolidityAddress:
                return "INVALID_SOLIDITY_ADDRESS";
            case Status.InsufficientGas:
                return "INSUFFICIENT_GAS";
            case Status.ContractSizeLimitExceeded:
                return "CONTRACT_SIZE_LIMIT_EXCEEDED";
            case Status.LocalCallModificationException:
                return "LOCAL_CALL_MODIFICATION_EXCEPTION";
            case Status.ContractRevertExecuted:
                return "CONTRACT_REVERT_EXECUTED";
            case Status.ContractExecutionException:
                return "CONTRACT_EXECUTION_EXCEPTION";
            case Status.InvalidReceivingNodeAccount:
                return "INVALID_RECEIVING_NODE_ACCOUNT";
            case Status.MissingQueryHeader:
                return "MISSING_QUERY_HEADER";
            case Status.AccountUpdateFailed:
                return "ACCOUNT_UPDATE_FAILED";
            case Status.InvalidKeyEncoding:
                return "INVALID_KEY_ENCODING";
            case Status.NullSolidityAddress:
                return "NULL_SOLIDITY_ADDRESS";
            case Status.ContractUpdateFailed:
                return "CONTRACT_UPDATE_FAILED";
            case Status.InvalidQueryHeader:
                return "INVALID_QUERY_HEADER";
            case Status.InvalidFeeSubmitted:
                return "INVALID_FEE_SUBMITTED";
            case Status.InvalidPayerSignature:
                return "INVALID_PAYER_SIGNATURE";
            case Status.KeyNotProvided:
                return "KEY_NOT_PROVIDED";
            case Status.InvalidExpirationTime:
                return "INVALID_EXPIRATION_TIME";
            case Status.NoWaclKey:
                return "NO_WACL_KEY";
            case Status.FileContentEmpty:
                return "FILE_CONTENT_EMPTY";
            case Status.InvalidAccountAmounts:
                return "INVALID_ACCOUNT_AMOUNTS";
            case Status.EmptyTransactionBody:
                return "EMPTY_TRANSACTION_BODY";
            case Status.InvalidTransactionBody:
                return "INVALID_TRANSACTION_BODY";
            case Status.InvalidSignatureTypeMismatchingKey:
                return "INVALID_SIGNATURE_TYPE_MISMATCHING_KEY";
            case Status.InvalidSignatureCountMismatchingKey:
                return "INVALID_SIGNATURE_COUNT_MISMATCHING_KEY";
            case Status.EmptyLiveHashBody:
                return "EMPTY_LIVE_HASH_BODY";
            case Status.EmptyLiveHash:
                return "EMPTY_LIVE_HASH";
            case Status.EmptyLiveHashKeys:
                return "EMPTY_LIVE_HASH_KEYS";
            case Status.InvalidLiveHashSize:
                return "INVALID_LIVE_HASH_SIZE";
            case Status.EmptyQueryBody:
                return "EMPTY_QUERY_BODY";
            case Status.EmptyLiveHashQuery:
                return "EMPTY_LIVE_HASH_QUERY";
            case Status.LiveHashNotFound:
                return "LIVE_HASH_NOT_FOUND";
            case Status.AccountIdDoesNotExist:
                return "ACCOUNT_ID_DOES_NOT_EXIST";
            case Status.LiveHashAlreadyExists:
                return "LIVE_HASH_ALREADY_EXISTS";
            case Status.InvalidFileWacl:
                return "INVALID_FILE_WACL";
            case Status.SerializationFailed:
                return "SERIALIZATION_FAILED";
            case Status.TransactionOversize:
                return "TRANSACTION_OVERSIZE";
            case Status.TransactionTooManyLayers:
                return "TRANSACTION_TOO_MANY_LAYERS";
            case Status.ContractDeleted:
                return "CONTRACT_DELETED";
            case Status.PlatformNotActive:
                return "PLATFORM_NOT_ACTIVE";
            case Status.KeyPrefixMismatch:
                return "KEY_PREFIX_MISMATCH";
            case Status.PlatformTransactionNotCreated:
                return "PLATFORM_TRANSACTION_NOT_CREATED";
            case Status.InvalidRenewalPeriod:
                return "INVALID_RENEWAL_PERIOD";
            case Status.InvalidPayerAccountId:
                return "INVALID_PAYER_ACCOUNT_ID";
            case Status.AccountDeleted:
                return "ACCOUNT_DELETED";
            case Status.FileDeleted:
                return "FILE_DELETED";
            case Status.AccountRepeatedInAccountAmounts:
                return "ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS";
            case Status.SettingNegativeAccountBalance:
                return "SETTING_NEGATIVE_ACCOUNT_BALANCE";
            case Status.ObtainerRequired:
                return "OBTAINER_REQUIRED";
            case Status.ObtainerSameContractId:
                return "OBTAINER_SAME_CONTRACT_ID";
            case Status.ObtainerDoesNotExist:
                return "OBTAINER_DOES_NOT_EXIST";
            case Status.ModifyingImmutableContract:
                return "MODIFYING_IMMUTABLE_CONTRACT";
            case Status.FileSystemException:
                return "FILE_SYSTEM_EXCEPTION";
            case Status.AutorenewDurationNotInRange:
                return "AUTORENEW_DURATION_NOT_IN_RANGE";
            case Status.ErrorDecodingBytestring:
                return "ERROR_DECODING_BYTESTRING";
            case Status.ContractFileEmpty:
                return "CONTRACT_FILE_EMPTY";
            case Status.ContractBytecodeEmpty:
                return "CONTRACT_BYTECODE_EMPTY";
            case Status.InvalidInitialBalance:
                return "INVALID_INITIAL_BALANCE";
            case Status.InvalidReceiveRecordThreshold:
                return "INVALID_RECEIVE_RECORD_THRESHOLD";
            case Status.InvalidSendRecordThreshold:
                return "INVALID_SEND_RECORD_THRESHOLD";
            case Status.AccountIsNotGenesisAccount:
                return "ACCOUNT_IS_NOT_GENESIS_ACCOUNT";
            case Status.PayerAccountUnauthorized:
                return "PAYER_ACCOUNT_UNAUTHORIZED";
            case Status.InvalidFreezeTransactionBody:
                return "INVALID_FREEZE_TRANSACTION_BODY";
            case Status.FreezeTransactionBodyNotFound:
                return "FREEZE_TRANSACTION_BODY_NOT_FOUND";
            case Status.TransferListSizeLimitExceeded:
                return "TRANSFER_LIST_SIZE_LIMIT_EXCEEDED";
            case Status.ResultSizeLimitExceeded:
                return "RESULT_SIZE_LIMIT_EXCEEDED";
            case Status.NotSpecialAccount:
                return "NOT_SPECIAL_ACCOUNT";
            case Status.ContractNegativeGas:
                return "CONTRACT_NEGATIVE_GAS";
            case Status.ContractNegativeValue:
                return "CONTRACT_NEGATIVE_VALUE";
            case Status.InvalidFeeFile:
                return "INVALID_FEE_FILE";
            case Status.InvalidExchangeRateFile:
                return "INVALID_EXCHANGE_RATE_FILE";
            case Status.InsufficientLocalCallGas:
                return "INSUFFICIENT_LOCAL_CALL_GAS";
            case Status.EntityNotAllowedToDelete:
                return "ENTITY_NOT_ALLOWED_TO_DELETE";
            case Status.AuthorizationFailed:
                return "AUTHORIZATION_FAILED";
            case Status.FileUploadedProtoInvalid:
                return "FILE_UPLOADED_PROTO_INVALID";
            case Status.FileUploadedProtoNotSavedToDisk:
                return "FILE_UPLOADED_PROTO_NOT_SAVED_TO_DISK";
            case Status.FeeScheduleFilePartUploaded:
                return "FEE_SCHEDULE_FILE_PART_UPLOADED";
            case Status.ExchangeRateChangeLimitExceeded:
                return "EXCHANGE_RATE_CHANGE_LIMIT_EXCEEDED";
            case Status.MaxContractStorageExceeded:
                return "MAX_CONTRACT_STORAGE_EXCEEDED";
            case Status.TransferAccountSameAsDeleteAccount:
                return "TRANSFER_ACCOUNT_SAME_AS_DELETE_ACCOUNT";
            case Status.TotalLedgerBalanceInvalid:
                return "TOTAL_LEDGER_BALANCE_INVALID";
            case Status.ExpirationReductionNotAllowed:
                return "EXPIRATION_REDUCTION_NOT_ALLOWED";
            case Status.MaxGasLimitExceeded:
                return "MAX_GAS_LIMIT_EXCEEDED";
            case Status.MaxFileSizeExceeded:
                return "MAX_FILE_SIZE_EXCEEDED";
            case Status.ReceiverSigRequired:
                return "RECEIVER_SIG_REQUIRED";
            case Status.InvalidTopicId:
                return "INVALID_TOPIC_ID";
            case Status.InvalidAdminKey:
                return "INVALID_ADMIN_KEY";
            case Status.InvalidSubmitKey:
                return "INVALID_SUBMIT_KEY";
            case Status.Unauthorized:
                return "UNAUTHORIZED";
            case Status.InvalidTopicMessage:
                return "INVALID_TOPIC_MESSAGE";
            case Status.InvalidAutorenewAccount:
                return "INVALID_AUTORENEW_ACCOUNT";
            case Status.AutorenewAccountNotAllowed:
                return "AUTORENEW_ACCOUNT_NOT_ALLOWED";
            case Status.TopicExpired:
                return "TOPIC_EXPIRED";
            case Status.InvalidChunkNumber:
                return "INVALID_CHUNK_NUMBER";
            case Status.InvalidChunkTransactionId:
                return "INVALID_CHUNK_TRANSACTION_ID";
            case Status.AccountFrozenForToken:
                return "ACCOUNT_FROZEN_FOR_TOKEN";
            case Status.TokensPerAccountLimitExceeded:
                return "TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED";
            case Status.InvalidTokenId:
                return "INVALID_TOKEN_ID";
            case Status.InvalidTokenDecimals:
                return "INVALID_TOKEN_DECIMALS";
            case Status.InvalidTokenInitialSupply:
                return "INVALID_TOKEN_INITIAL_SUPPLY";
            case Status.InvalidTreasuryAccountForToken:
                return "INVALID_TREASURY_ACCOUNT_FOR_TOKEN";
            case Status.InvalidTokenSymbol:
                return "INVALID_TOKEN_SYMBOL";
            case Status.TokenHasNoFreezeKey:
                return "TOKEN_HAS_NO_FREEZE_KEY";
            case Status.TransfersNotZeroSumForToken:
                return "TRANSFERS_NOT_ZERO_SUM_FOR_TOKEN";
            case Status.MissingTokenSymbol:
                return "MISSING_TOKEN_SYMBOL";
            case Status.TokenSymbolTooLong:
                return "TOKEN_SYMBOL_TOO_LONG";
            case Status.AccountKycNotGrantedForToken:
                return "ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN";
            case Status.TokenHasNoKycKey:
                return "TOKEN_HAS_NO_KYC_KEY";
            case Status.InsufficientTokenBalance:
                return "INSUFFICIENT_TOKEN_BALANCE";
            case Status.TokenWasDeleted:
                return "TOKEN_WAS_DELETED";
            case Status.TokenHasNoSupplyKey:
                return "TOKEN_HAS_NO_SUPPLY_KEY";
            case Status.TokenHasNoWipeKey:
                return "TOKEN_HAS_NO_WIPE_KEY";
            case Status.InvalidTokenMintAmount:
                return "INVALID_TOKEN_MINT_AMOUNT";
            case Status.InvalidTokenBurnAmount:
                return "INVALID_TOKEN_BURN_AMOUNT";
            case Status.TokenNotAssociatedToAccount:
                return "TOKEN_NOT_ASSOCIATED_TO_ACCOUNT";
            case Status.CannotWipeTokenTreasuryAccount:
                return "CANNOT_WIPE_TOKEN_TREASURY_ACCOUNT";
            case Status.InvalidKycKey:
                return "INVALID_KYC_KEY";
            case Status.InvalidWipeKey:
                return "INVALID_WIPE_KEY";
            case Status.InvalidFreezeKey:
                return "INVALID_FREEZE_KEY";
            case Status.InvalidSupplyKey:
                return "INVALID_SUPPLY_KEY";
            case Status.MissingTokenName:
                return "MISSING_TOKEN_NAME";
            case Status.TokenNameTooLong:
                return "TOKEN_NAME_TOO_LONG";
            case Status.InvalidWipingAmount:
                return "INVALID_WIPING_AMOUNT";
            case Status.TokenIsImmutable:
                return "TOKEN_IS_IMMUTABLE";
            case Status.TokenAlreadyAssociatedToAccount:
                return "TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT";
            case Status.TransactionRequiresZeroTokenBalances:
                return "TRANSACTION_REQUIRES_ZERO_TOKEN_BALANCES";
            case Status.AccountIsTreasury:
                return "ACCOUNT_IS_TREASURY";
            case Status.TokenIdRepeatedInTokenList:
                return "TOKEN_ID_REPEATED_IN_TOKEN_LIST";
            case Status.TokenTransferListSizeLimitExceeded:
                return "TOKEN_TRANSFER_LIST_SIZE_LIMIT_EXCEEDED";
            case Status.EmptyTokenTransferBody:
                return "EMPTY_TOKEN_TRANSFER_BODY";
            case Status.EmptyTokenTransferAccountAmounts:
                return "EMPTY_TOKEN_TRANSFER_ACCOUNT_AMOUNTS";
            case Status.InvalidScheduleId:
                return "INVALID_SCHEDULE_ID";
            case Status.ScheduleIsImmutable:
                return "SCHEDULE_IS_IMMUTABLE";
            case Status.InvalidSchedulePayerId:
                return "INVALID_SCHEDULE_PAYER_ID";
            case Status.InvalidScheduleAccountId:
                return "INVALID_SCHEDULE_ACCOUNT_ID";
            case Status.NoNewValidSignatures:
                return "NO_NEW_VALID_SIGNATURES";
            case Status.UnresolvableRequiredSigners:
                return "UNRESOLVABLE_REQUIRED_SIGNERS";
            case Status.ScheduledTransactionNotInWhitelist:
                return "SCHEDULED_TRANSACTION_NOT_IN_WHITELIST";
            case Status.SomeSignaturesWereInvalid:
                return "SOME_SIGNATURES_WERE_INVALID";
            case Status.TransactionIdFieldNotAllowed:
                return "TRANSACTION_ID_FIELD_NOT_ALLOWED";
            case Status.IdenticalScheduleAlreadyCreated:
                return "IDENTICAL_SCHEDULE_ALREADY_CREATED";
            case Status.InvalidZeroByteInString:
                return "INVALID_ZERO_BYTE_IN_STRING";
            case Status.ScheduleAlreadyDeleted:
                return "SCHEDULE_ALREADY_DELETED";
            case Status.ScheduleAlreadyExecuted:
                return "SCHEDULE_ALREADY_EXECUTED";
            case Status.MessageSizeTooLarge:
                return "MESSAGE_SIZE_TOO_LARGE";
            case Status.OperationRepeatedInBucketGroups:
                return "OPERATION_REPEATED_IN_BUCKET_GROUPS";
            case Status.BucketCapacityOverflow:
                return "BUCKET_CAPACITY_OVERFLOW";
            case Status.NodeCapacityNotSufficientForOperation:
                return "NODE_CAPACITY_NOT_SUFFICIENT_FOR_OPERATION";
            case Status.BucketHasNoThrottleGroups:
                return "BUCKET_HAS_NO_THROTTLE_GROUPS";
            case Status.ThrottleGroupHasZeroOpsPerSec:
                return "THROTTLE_GROUP_HAS_ZERO_OPS_PER_SEC";
            case Status.SuccessButMissingExpectedOperation:
                return "SUCCESS_BUT_MISSING_EXPECTED_OPERATION";
            case Status.UnparseableThrottleDefinitions:
                return "UNPARSEABLE_THROTTLE_DEFINITIONS";
            case Status.InvalidThrottleDefinitions:
                return "INVALID_THROTTLE_DEFINITIONS";
            case Status.AccountExpiredAndPendingRemoval:
                return "ACCOUNT_EXPIRED_AND_PENDING_REMOVAL";
            case Status.InvalidTokenMaxSupply:
                return "INVALID_TOKEN_MAX_SUPPLY";
            case Status.InvalidTokenNftSerialNumber:
                return "INVALID_TOKEN_NFT_SERIAL_NUMBER";
            case Status.InvalidNftId:
                return "INVALID_NFT_ID";
            case Status.MetadataTooLong:
                return "METADATA_TOO_LONG";
            case Status.BatchSizeLimitExceeded:
                return "BATCH_SIZE_LIMIT_EXCEEDED";
            case Status.InvalidQueryRange:
                return "INVALID_QUERY_RANGE";
            case Status.FractionDividesByZero:
                return "FRACTION_DIVIDES_BY_ZERO";
            case Status.InsufficientPayerBalanceForCustomFee:
                return "INSUFFICIENT_PAYER_BALANCE_FOR_CUSTOM_FEE";
            case Status.CustomFeesListTooLong:
                return "CUSTOM_FEES_LIST_TOO_LONG";
            case Status.InvalidCustomFeeCollector:
                return "INVALID_CUSTOM_FEE_COLLECTOR";
            case Status.InvalidTokenIdInCustomFees:
                return "INVALID_TOKEN_ID_IN_CUSTOM_FEES";
            case Status.TokenNotAssociatedToFeeCollector:
                return "TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR";
            case Status.TokenMaxSupplyReached:
                return "TOKEN_MAX_SUPPLY_REACHED";
            case Status.SenderDoesNotOwnNftSerialNo:
                return "SENDER_DOES_NOT_OWN_NFT_SERIAL_NO";
            case Status.CustomFeeNotFullySpecified:
                return "CUSTOM_FEE_NOT_FULLY_SPECIFIED";
            case Status.CustomFeeMustBePositive:
                return "CUSTOM_FEE_MUST_BE_POSITIVE";
            case Status.TokenHasNoFeeScheduleKey:
                return "TOKEN_HAS_NO_FEE_SCHEDULE_KEY";
            case Status.CustomFeeOutsideNumericRange:
                return "CUSTOM_FEE_OUTSIDE_NUMERIC_RANGE";
            case Status.RoyaltyFractionCannotExceedOne:
                return "ROYALTY_FRACTION_CANNOT_EXCEED_ONE";
            case Status.FractionalFeeMaxAmountLessThanMinAmount:
                return "FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT";
            case Status.CustomScheduleAlreadyHasNoFees:
                return "CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES";
            case Status.CustomFeeDenominationMustBeFungibleCommon:
                return "CUSTOM_FEE_DENOMINATION_MUST_BE_FUNGIBLE_COMMON";
            case Status.CustomFractionalFeeOnlyAllowedForFungibleCommon:
                return "CUSTOM_FRACTIONAL_FEE_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON";
            case Status.InvalidCustomFeeScheduleKey:
                return "INVALID_CUSTOM_FEE_SCHEDULE_KEY";
            case Status.InvalidTokenMintMetadata:
                return "INVALID_TOKEN_MINT_METADATA";
            case Status.InvalidTokenBurnMetadata:
                return "INVALID_TOKEN_BURN_METADATA";
            case Status.CurrentTreasuryStillOwnsNfts:
                return "CURRENT_TREASURY_STILL_OWNS_NFTS";
            case Status.AccountStillOwnsNfts:
                return "ACCOUNT_STILL_OWNS_NFTS";
            case Status.TreasuryMustOwnBurnedNft:
                return "TREASURY_MUST_OWN_BURNED_NFT";
            case Status.AccountDoesNotOwnWipedNft:
                return "ACCOUNT_DOES_NOT_OWN_WIPED_NFT";
            case Status.AccountAmountTransfersOnlyAllowedForFungibleCommon:
                return "ACCOUNT_AMOUNT_TRANSFERS_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON";
            case Status.MaxNftsInPriceRegimeHaveBeenMinted:
                return "MAX_NFTS_IN_PRICE_REGIME_HAVE_BEEN_MINTED";
            case Status.PayerAccountDeleted:
                return "PAYER_ACCOUNT_DELETED";
            case Status.CustomFeeChargingExceededMaxRecursionDepth:
                return "CUSTOM_FEE_CHARGING_EXCEEDED_MAX_RECURSION_DEPTH";
            case Status.CustomFeeChargingExceededMaxAccountAmounts:
                return "CUSTOM_FEE_CHARGING_EXCEEDED_MAX_ACCOUNT_AMOUNTS";
            case Status.InsufficientSenderAccountBalanceForCustomFee:
                return "INSUFFICIENT_SENDER_ACCOUNT_BALANCE_FOR_CUSTOM_FEE";
            case Status.SerialNumberLimitReached:
                return "SERIAL_NUMBER_LIMIT_REACHED";
            case Status.CustomRoyaltyFeeOnlyAllowedForNonFungibleUnique:
                return "CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE";
            case Status.NoRemainingAutomaticAssociations:
                return "NO_REMAINING_AUTOMATIC_ASSOCIATIONS";
            case Status.ExistingAutomaticAssociationsExceedGivenLimit:
                return "EXISTING_AUTOMATIC_ASSOCIATIONS_EXCEED_GIVEN_LIMIT";
            case Status.RequestedNumAutomaticAssociationsExceedsAssociationLimit:
                return "REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT";
            case Status.TokenIsPaused:
                return "TOKEN_IS_PAUSED";
            case Status.TokenHasNoPauseKey:
                return "TOKEN_HAS_NO_PAUSE_KEY";
            case Status.InvalidPauseKey:
                return "INVALID_PAUSE_KEY";
            case Status.FreezeUpdateFileDoesNotExist:
                return "FREEZE_UPDATE_FILE_DOES_NOT_EXIST";
            case Status.FreezeUpdateFileHashDoesNotMatch:
                return "FREEZE_UPDATE_FILE_HASH_DOES_NOT_MATCH";
            case Status.NoUpgradeHasBeenPrepared:
                return "NO_UPGRADE_HAS_BEEN_PREPARED";
            case Status.NoFreezeIsScheduled:
                return "NO_FREEZE_IS_SCHEDULED";
            case Status.UpdateFileHashChangedSincePrepareUpgrade:
                return "UPDATE_FILE_HASH_CHANGED_SINCE_PREPARE_UPGRADE";
            case Status.FreezeStartTimeMustBeFuture:
                return "FREEZE_START_TIME_MUST_BE_FUTURE";
            case Status.PreparedUpdateFileIsImmutable:
                return "PREPARED_UPDATE_FILE_IS_IMMUTABLE";
            case Status.FreezeAlreadyScheduled:
                return "FREEZE_ALREADY_SCHEDULED";
            case Status.FreezeUpgradeInProgress:
                return "FREEZE_UPGRADE_IN_PROGRESS";
            case Status.UpdateFileIdDoesNotMatchPrepared:
                return "UPDATE_FILE_ID_DOES_NOT_MATCH_PREPARED";
            case Status.UpdateFileHashDoesNotMatchPrepared:
                return "UPDATE_FILE_HASH_DOES_NOT_MATCH_PREPARED";
            case Status.ConsensusGasExhausted:
                return "CONSENSUS_GAS_EXHAUSTED";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {Status}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return Status.Ok;
            case 1:
                return Status.InvalidTransaction;
            case 2:
                return Status.PayerAccountNotFound;
            case 3:
                return Status.InvalidNodeAccount;
            case 4:
                return Status.TransactionExpired;
            case 5:
                return Status.InvalidTransactionStart;
            case 6:
                return Status.InvalidTransactionDuration;
            case 7:
                return Status.InvalidSignature;
            case 8:
                return Status.MemoTooLong;
            case 9:
                return Status.InsufficientTxFee;
            case 10:
                return Status.InsufficientPayerBalance;
            case 11:
                return Status.DuplicateTransaction;
            case 12:
                return Status.Busy;
            case 13:
                return Status.NotSupported;
            case 14:
                return Status.InvalidFileId;
            case 15:
                return Status.InvalidAccountId;
            case 16:
                return Status.InvalidContractId;
            case 17:
                return Status.InvalidTransactionId;
            case 18:
                return Status.ReceiptNotFound;
            case 19:
                return Status.RecordNotFound;
            case 20:
                return Status.InvalidSolidityId;
            case 21:
                return Status.Unknown;
            case 22:
                return Status.Success;
            case 23:
                return Status.FailInvalid;
            case 24:
                return Status.FailFee;
            case 25:
                return Status.FailBalance;
            case 26:
                return Status.KeyRequired;
            case 27:
                return Status.BadEncoding;
            case 28:
                return Status.InsufficientAccountBalance;
            case 29:
                return Status.InvalidSolidityAddress;
            case 30:
                return Status.InsufficientGas;
            case 31:
                return Status.ContractSizeLimitExceeded;
            case 32:
                return Status.LocalCallModificationException;
            case 33:
                return Status.ContractRevertExecuted;
            case 34:
                return Status.ContractExecutionException;
            case 35:
                return Status.InvalidReceivingNodeAccount;
            case 36:
                return Status.MissingQueryHeader;
            case 37:
                return Status.AccountUpdateFailed;
            case 38:
                return Status.InvalidKeyEncoding;
            case 39:
                return Status.NullSolidityAddress;
            case 40:
                return Status.ContractUpdateFailed;
            case 41:
                return Status.InvalidQueryHeader;
            case 42:
                return Status.InvalidFeeSubmitted;
            case 43:
                return Status.InvalidPayerSignature;
            case 44:
                return Status.KeyNotProvided;
            case 45:
                return Status.InvalidExpirationTime;
            case 46:
                return Status.NoWaclKey;
            case 47:
                return Status.FileContentEmpty;
            case 48:
                return Status.InvalidAccountAmounts;
            case 49:
                return Status.EmptyTransactionBody;
            case 50:
                return Status.InvalidTransactionBody;
            case 51:
                return Status.InvalidSignatureTypeMismatchingKey;
            case 52:
                return Status.InvalidSignatureCountMismatchingKey;
            case 53:
                return Status.EmptyLiveHashBody;
            case 54:
                return Status.EmptyLiveHash;
            case 55:
                return Status.EmptyLiveHashKeys;
            case 56:
                return Status.InvalidLiveHashSize;
            case 57:
                return Status.EmptyQueryBody;
            case 58:
                return Status.EmptyLiveHashQuery;
            case 59:
                return Status.LiveHashNotFound;
            case 60:
                return Status.AccountIdDoesNotExist;
            case 61:
                return Status.LiveHashAlreadyExists;
            case 62:
                return Status.InvalidFileWacl;
            case 63:
                return Status.SerializationFailed;
            case 64:
                return Status.TransactionOversize;
            case 65:
                return Status.TransactionTooManyLayers;
            case 66:
                return Status.ContractDeleted;
            case 67:
                return Status.PlatformNotActive;
            case 68:
                return Status.KeyPrefixMismatch;
            case 69:
                return Status.PlatformTransactionNotCreated;
            case 70:
                return Status.InvalidRenewalPeriod;
            case 71:
                return Status.InvalidPayerAccountId;
            case 72:
                return Status.AccountDeleted;
            case 73:
                return Status.FileDeleted;
            case 74:
                return Status.AccountRepeatedInAccountAmounts;
            case 75:
                return Status.SettingNegativeAccountBalance;
            case 76:
                return Status.ObtainerRequired;
            case 77:
                return Status.ObtainerSameContractId;
            case 78:
                return Status.ObtainerDoesNotExist;
            case 79:
                return Status.ModifyingImmutableContract;
            case 80:
                return Status.FileSystemException;
            case 81:
                return Status.AutorenewDurationNotInRange;
            case 82:
                return Status.ErrorDecodingBytestring;
            case 83:
                return Status.ContractFileEmpty;
            case 84:
                return Status.ContractBytecodeEmpty;
            case 85:
                return Status.InvalidInitialBalance;
            case 86:
                return Status.InvalidReceiveRecordThreshold;
            case 87:
                return Status.InvalidSendRecordThreshold;
            case 88:
                return Status.AccountIsNotGenesisAccount;
            case 89:
                return Status.PayerAccountUnauthorized;
            case 90:
                return Status.InvalidFreezeTransactionBody;
            case 91:
                return Status.FreezeTransactionBodyNotFound;
            case 92:
                return Status.TransferListSizeLimitExceeded;
            case 93:
                return Status.ResultSizeLimitExceeded;
            case 94:
                return Status.NotSpecialAccount;
            case 95:
                return Status.ContractNegativeGas;
            case 96:
                return Status.ContractNegativeValue;
            case 97:
                return Status.InvalidFeeFile;
            case 98:
                return Status.InvalidExchangeRateFile;
            case 99:
                return Status.InsufficientLocalCallGas;
            case 100:
                return Status.EntityNotAllowedToDelete;
            case 101:
                return Status.AuthorizationFailed;
            case 102:
                return Status.FileUploadedProtoInvalid;
            case 103:
                return Status.FileUploadedProtoNotSavedToDisk;
            case 104:
                return Status.FeeScheduleFilePartUploaded;
            case 105:
                return Status.ExchangeRateChangeLimitExceeded;
            case 106:
                return Status.MaxContractStorageExceeded;
            case 107:
                return Status.TransferAccountSameAsDeleteAccount;
            case 108:
                return Status.TotalLedgerBalanceInvalid;
            case 110:
                return Status.ExpirationReductionNotAllowed;
            case 111:
                return Status.MaxGasLimitExceeded;
            case 112:
                return Status.MaxFileSizeExceeded;
            case 113:
                return Status.ReceiverSigRequired;
            case 150:
                return Status.InvalidTopicId;
            case 155:
                return Status.InvalidAdminKey;
            case 156:
                return Status.InvalidSubmitKey;
            case 157:
                return Status.Unauthorized;
            case 158:
                return Status.InvalidTopicMessage;
            case 159:
                return Status.InvalidAutorenewAccount;
            case 160:
                return Status.AutorenewAccountNotAllowed;
            case 162:
                return Status.TopicExpired;
            case 163:
                return Status.InvalidChunkNumber;
            case 164:
                return Status.InvalidChunkTransactionId;
            case 165:
                return Status.AccountFrozenForToken;
            case 166:
                return Status.TokensPerAccountLimitExceeded;
            case 167:
                return Status.InvalidTokenId;
            case 168:
                return Status.InvalidTokenDecimals;
            case 169:
                return Status.InvalidTokenInitialSupply;
            case 170:
                return Status.InvalidTreasuryAccountForToken;
            case 171:
                return Status.InvalidTokenSymbol;
            case 172:
                return Status.TokenHasNoFreezeKey;
            case 173:
                return Status.TransfersNotZeroSumForToken;
            case 174:
                return Status.MissingTokenSymbol;
            case 175:
                return Status.TokenSymbolTooLong;
            case 176:
                return Status.AccountKycNotGrantedForToken;
            case 177:
                return Status.TokenHasNoKycKey;
            case 178:
                return Status.InsufficientTokenBalance;
            case 179:
                return Status.TokenWasDeleted;
            case 180:
                return Status.TokenHasNoSupplyKey;
            case 181:
                return Status.TokenHasNoWipeKey;
            case 182:
                return Status.InvalidTokenMintAmount;
            case 183:
                return Status.InvalidTokenBurnAmount;
            case 184:
                return Status.TokenNotAssociatedToAccount;
            case 185:
                return Status.CannotWipeTokenTreasuryAccount;
            case 186:
                return Status.InvalidKycKey;
            case 187:
                return Status.InvalidWipeKey;
            case 188:
                return Status.InvalidFreezeKey;
            case 189:
                return Status.InvalidSupplyKey;
            case 190:
                return Status.MissingTokenName;
            case 191:
                return Status.TokenNameTooLong;
            case 192:
                return Status.InvalidWipingAmount;
            case 193:
                return Status.TokenIsImmutable;
            case 194:
                return Status.TokenAlreadyAssociatedToAccount;
            case 195:
                return Status.TransactionRequiresZeroTokenBalances;
            case 196:
                return Status.AccountIsTreasury;
            case 197:
                return Status.TokenIdRepeatedInTokenList;
            case 198:
                return Status.TokenTransferListSizeLimitExceeded;
            case 199:
                return Status.EmptyTokenTransferBody;
            case 200:
                return Status.EmptyTokenTransferAccountAmounts;
            case 201:
                return Status.InvalidScheduleId;
            case 202:
                return Status.ScheduleIsImmutable;
            case 203:
                return Status.InvalidSchedulePayerId;
            case 204:
                return Status.InvalidScheduleAccountId;
            case 205:
                return Status.NoNewValidSignatures;
            case 206:
                return Status.UnresolvableRequiredSigners;
            case 207:
                return Status.ScheduledTransactionNotInWhitelist;
            case 208:
                return Status.SomeSignaturesWereInvalid;
            case 209:
                return Status.TransactionIdFieldNotAllowed;
            case 210:
                return Status.IdenticalScheduleAlreadyCreated;
            case 211:
                return Status.InvalidZeroByteInString;
            case 212:
                return Status.ScheduleAlreadyDeleted;
            case 213:
                return Status.ScheduleAlreadyExecuted;
            case 214:
                return Status.MessageSizeTooLarge;
            case 215:
                return Status.OperationRepeatedInBucketGroups;
            case 216:
                return Status.BucketCapacityOverflow;
            case 217:
                return Status.NodeCapacityNotSufficientForOperation;
            case 218:
                return Status.BucketHasNoThrottleGroups;
            case 219:
                return Status.ThrottleGroupHasZeroOpsPerSec;
            case 220:
                return Status.SuccessButMissingExpectedOperation;
            case 221:
                return Status.UnparseableThrottleDefinitions;
            case 222:
                return Status.InvalidThrottleDefinitions;
            case 223:
                return Status.AccountExpiredAndPendingRemoval;
            case 224:
                return Status.InvalidTokenMaxSupply;
            case 225:
                return Status.InvalidTokenNftSerialNumber;
            case 226:
                return Status.InvalidNftId;
            case 227:
                return Status.MetadataTooLong;
            case 228:
                return Status.BatchSizeLimitExceeded;
            case 229:
                return Status.InvalidQueryRange;
            case 230:
                return Status.FractionDividesByZero;
            case 231:
                return Status.InsufficientPayerBalanceForCustomFee;
            case 232:
                return Status.CustomFeesListTooLong;
            case 233:
                return Status.InvalidCustomFeeCollector;
            case 234:
                return Status.InvalidTokenIdInCustomFees;
            case 235:
                return Status.TokenNotAssociatedToFeeCollector;
            case 236:
                return Status.TokenMaxSupplyReached;
            case 237:
                return Status.SenderDoesNotOwnNftSerialNo;
            case 238:
                return Status.CustomFeeNotFullySpecified;
            case 239:
                return Status.CustomFeeMustBePositive;
            case 240:
                return Status.TokenHasNoFeeScheduleKey;
            case 241:
                return Status.CustomFeeOutsideNumericRange;
            case 242:
                return Status.RoyaltyFractionCannotExceedOne;
            case 243:
                return Status.FractionalFeeMaxAmountLessThanMinAmount;
            case 244:
                return Status.CustomScheduleAlreadyHasNoFees;
            case 245:
                return Status.CustomFeeDenominationMustBeFungibleCommon;
            case 246:
                return Status.CustomFractionalFeeOnlyAllowedForFungibleCommon;
            case 247:
                return Status.InvalidCustomFeeScheduleKey;
            case 248:
                return Status.InvalidTokenMintMetadata;
            case 249:
                return Status.InvalidTokenBurnMetadata;
            case 250:
                return Status.CurrentTreasuryStillOwnsNfts;
            case 251:
                return Status.AccountStillOwnsNfts;
            case 252:
                return Status.TreasuryMustOwnBurnedNft;
            case 253:
                return Status.AccountDoesNotOwnWipedNft;
            case 254:
                return Status.AccountAmountTransfersOnlyAllowedForFungibleCommon;
            case 255:
                return Status.MaxNftsInPriceRegimeHaveBeenMinted;
            case 256:
                return Status.PayerAccountDeleted;
            case 257:
                return Status.CustomFeeChargingExceededMaxRecursionDepth;
            case 258:
                return Status.CustomFeeChargingExceededMaxAccountAmounts;
            case 259:
                return Status.InsufficientSenderAccountBalanceForCustomFee;
            case 260:
                return Status.SerialNumberLimitReached;
            case 261:
                return Status.CustomRoyaltyFeeOnlyAllowedForNonFungibleUnique;
            case 262:
                return Status.NoRemainingAutomaticAssociations;
            case 263:
                return Status.ExistingAutomaticAssociationsExceedGivenLimit;
            case 264:
                return Status.RequestedNumAutomaticAssociationsExceedsAssociationLimit;
            case 265:
                return Status.TokenIsPaused;
            case 266:
                return Status.TokenHasNoPauseKey;
            case 267:
                return Status.InvalidPauseKey;
            case 268:
                return Status.FreezeUpdateFileDoesNotExist;
            case 269:
                return Status.FreezeUpdateFileHashDoesNotMatch;
            case 270:
                return Status.NoUpgradeHasBeenPrepared;
            case 271:
                return Status.NoFreezeIsScheduled;
            case 272:
                return Status.UpdateFileHashChangedSincePrepareUpgrade;
            case 273:
                return Status.FreezeStartTimeMustBeFuture;
            case 274:
                return Status.PreparedUpdateFileIsImmutable;
            case 275:
                return Status.FreezeAlreadyScheduled;
            case 276:
                return Status.FreezeUpgradeInProgress;
            case 277:
                return Status.UpdateFileIdDoesNotMatchPrepared;
            case 278:
                return Status.UpdateFileHashDoesNotMatchPrepared;
            case 279:
                return Status.ConsensusGasExhausted;
            default:
                throw new Error(
                    `(BUG) Status.fromCode() does not handle code: ${code}`
                );
        }
    }

    /**
     * @returns {proto.ResponseCodeEnum}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * The transaction passed the precheck validations.
 */
Status.Ok = new Status(0);

/**
 * For any error not handled by specific error codes listed below.
 */
Status.InvalidTransaction = new Status(1);

/**
 * Payer account does not exist.
 */
Status.PayerAccountNotFound = new Status(2);

/**
 * Node Account provided does not match the node account of the node the transaction was submitted
 * to.
 */
Status.InvalidNodeAccount = new Status(3);

/**
 * Pre-Check error when TransactionValidStart + transactionValidDuration is less than current
 * consensus time.
 */
Status.TransactionExpired = new Status(4);

/**
 * Transaction start time is greater than current consensus time
 */
Status.InvalidTransactionStart = new Status(5);

/**
 * valid transaction duration is a positive non zero number that does not exceed 120 seconds
 */
Status.InvalidTransactionDuration = new Status(6);

/**
 * The transaction signature is not valid
 */
Status.InvalidSignature = new Status(7);

/**
 * Transaction memo size exceeded 100 bytes
 */
Status.MemoTooLong = new Status(8);

/**
 * The fee provided in the transaction is insufficient for this type of transaction
 */
Status.InsufficientTxFee = new Status(9);

/**
 * The payer account has insufficient cryptocurrency to pay the transaction fee
 */
Status.InsufficientPayerBalance = new Status(10);

/**
 * This transaction ID is a duplicate of one that was submitted to this node or reached consensus
 * in the last 180 seconds (receipt period)
 */
Status.DuplicateTransaction = new Status(11);

/**
 * If API is throttled out
 */
Status.Busy = new Status(12);

/**
 * The API is not currently supported
 */
Status.NotSupported = new Status(13);

/**
 * The file id is invalid or does not exist
 */
Status.InvalidFileId = new Status(14);

/**
 * The account id is invalid or does not exist
 */
Status.InvalidAccountId = new Status(15);

/**
 * The contract id is invalid or does not exist
 */
Status.InvalidContractId = new Status(16);

/**
 * Transaction id is not valid
 */
Status.InvalidTransactionId = new Status(17);

/**
 * Receipt for given transaction id does not exist
 */
Status.ReceiptNotFound = new Status(18);

/**
 * Record for given transaction id does not exist
 */
Status.RecordNotFound = new Status(19);

/**
 * The solidity id is invalid or entity with this solidity id does not exist
 */
Status.InvalidSolidityId = new Status(20);

/**
 * The responding node has submitted the transaction to the network. Its final status is still
 * unknown.
 */
Status.Unknown = new Status(21);

/**
 * The transaction succeeded
 */
Status.Success = new Status(22);

/**
 * There was a system error and the transaction failed because of invalid request parameters.
 */
Status.FailInvalid = new Status(23);

/**
 * There was a system error while performing fee calculation, reserved for future.
 */
Status.FailFee = new Status(24);

/**
 * There was a system error while performing balance checks, reserved for future.
 */
Status.FailBalance = new Status(25);

/**
 * Key not provided in the transaction body
 */
Status.KeyRequired = new Status(26);

/**
 * Unsupported algorithm/encoding used for keys in the transaction
 */
Status.BadEncoding = new Status(27);

/**
 * When the account balance is not sufficient for the transfer
 */
Status.InsufficientAccountBalance = new Status(28);

/**
 * During an update transaction when the system is not able to find the Users Solidity address
 */
Status.InvalidSolidityAddress = new Status(29);

/**
 * Not enough gas was supplied to execute transaction
 */
Status.InsufficientGas = new Status(30);

/**
 * contract byte code size is over the limit
 */
Status.ContractSizeLimitExceeded = new Status(31);

/**
 * local execution (query) is requested for a function which changes state
 */
Status.LocalCallModificationException = new Status(32);

/**
 * Contract REVERT OPCODE executed
 */
Status.ContractRevertExecuted = new Status(33);

/**
 * For any contract execution related error not handled by specific error codes listed above.
 */
Status.ContractExecutionException = new Status(34);

/**
 * In Query validation, account with +ve(amount) value should be Receiving node account, the
 * receiver account should be only one account in the list
 */
Status.InvalidReceivingNodeAccount = new Status(35);

/**
 * Header is missing in Query request
 */
Status.MissingQueryHeader = new Status(36);

/**
 * The update of the account failed
 */
Status.AccountUpdateFailed = new Status(37);

/**
 * Provided key encoding was not supported by the system
 */
Status.InvalidKeyEncoding = new Status(38);

/**
 * null solidity address
 */
Status.NullSolidityAddress = new Status(39);

/**
 * update of the contract failed
 */
Status.ContractUpdateFailed = new Status(40);

/**
 * the query header is invalid
 */
Status.InvalidQueryHeader = new Status(41);

/**
 * Invalid fee submitted
 */
Status.InvalidFeeSubmitted = new Status(42);

/**
 * Payer signature is invalid
 */
Status.InvalidPayerSignature = new Status(43);

/**
 * The keys were not provided in the request.
 */
Status.KeyNotProvided = new Status(44);

/**
 * Expiration time provided in the transaction was invalid.
 */
Status.InvalidExpirationTime = new Status(45);

/**
 * WriteAccess Control Keys are not provided for the file
 */
Status.NoWaclKey = new Status(46);

/**
 * The contents of file are provided as empty.
 */
Status.FileContentEmpty = new Status(47);

/**
 * The crypto transfer credit and debit do not sum equal to 0
 */
Status.InvalidAccountAmounts = new Status(48);

/**
 * Transaction body provided is empty
 */
Status.EmptyTransactionBody = new Status(49);

/**
 * Invalid transaction body provided
 */
Status.InvalidTransactionBody = new Status(50);

/**
 * the type of key (base ed25519 key, KeyList, or ThresholdKey) does not match the type of
 * signature (base ed25519 signature, SignatureList, or ThresholdKeySignature)
 */
Status.InvalidSignatureTypeMismatchingKey = new Status(51);

/**
 * the number of key (KeyList, or ThresholdKey) does not match that of signature (SignatureList,
 * or ThresholdKeySignature). e.g. if a keyList has 3 base keys, then the corresponding
 * signatureList should also have 3 base signatures.
 */
Status.InvalidSignatureCountMismatchingKey = new Status(52);

/**
 * the livehash body is empty
 */
Status.EmptyLiveHashBody = new Status(53);

/**
 * the livehash data is missing
 */
Status.EmptyLiveHash = new Status(54);

/**
 * the keys for a livehash are missing
 */
Status.EmptyLiveHashKeys = new Status(55);

/**
 * the livehash data is not the output of a SHA-384 digest
 */
Status.InvalidLiveHashSize = new Status(56);

/**
 * the query body is empty
 */
Status.EmptyQueryBody = new Status(57);

/**
 * the crypto livehash query is empty
 */
Status.EmptyLiveHashQuery = new Status(58);

/**
 * the livehash is not present
 */
Status.LiveHashNotFound = new Status(59);

/**
 * the account id passed has not yet been created.
 */
Status.AccountIdDoesNotExist = new Status(60);

/**
 * the livehash already exists for a given account
 */
Status.LiveHashAlreadyExists = new Status(61);

/**
 * File WACL keys are invalid
 */
Status.InvalidFileWacl = new Status(62);

/**
 * Serialization failure
 */
Status.SerializationFailed = new Status(63);

/**
 * The size of the Transaction is greater than transactionMaxBytes
 */
Status.TransactionOversize = new Status(64);

/**
 * The Transaction has more than 50 levels
 */
Status.TransactionTooManyLayers = new Status(65);

/**
 * Contract is marked as deleted
 */
Status.ContractDeleted = new Status(66);

/**
 * the platform node is either disconnected or lagging behind.
 */
Status.PlatformNotActive = new Status(67);

/**
 * one public key matches more than one prefixes on the signature map
 */
Status.KeyPrefixMismatch = new Status(68);

/**
 * transaction not created by platform due to large backlog
 */
Status.PlatformTransactionNotCreated = new Status(69);

/**
 * auto renewal period is not a positive number of seconds
 */
Status.InvalidRenewalPeriod = new Status(70);

/**
 * the response code when a smart contract id is passed for a crypto API request
 */
Status.InvalidPayerAccountId = new Status(71);

/**
 * the account has been marked as deleted
 */
Status.AccountDeleted = new Status(72);

/**
 * the file has been marked as deleted
 */
Status.FileDeleted = new Status(73);

/**
 * same accounts repeated in the transfer account list
 */
Status.AccountRepeatedInAccountAmounts = new Status(74);

/**
 * attempting to set negative balance value for crypto account
 */
Status.SettingNegativeAccountBalance = new Status(75);

/**
 * when deleting smart contract that has crypto balance either transfer account or transfer smart
 * contract is required
 */
Status.ObtainerRequired = new Status(76);

/**
 * when deleting smart contract that has crypto balance you can not use the same contract id as
 * transferContractId as the one being deleted
 */
Status.ObtainerSameContractId = new Status(77);

/**
 * transferAccountId or transferContractId specified for contract delete does not exist
 */
Status.ObtainerDoesNotExist = new Status(78);

/**
 * attempting to modify (update or delete a immutable smart contract, i.e. one created without a
 * admin key)
 */
Status.ModifyingImmutableContract = new Status(79);

/**
 * Unexpected exception thrown by file system functions
 */
Status.FileSystemException = new Status(80);

/**
 * the duration is not a subset of [MINIMUM_AUTORENEW_DURATION,MAXIMUM_AUTORENEW_DURATION]
 */
Status.AutorenewDurationNotInRange = new Status(81);

/**
 * Decoding the smart contract binary to a byte array failed. Check that the input is a valid hex
 * string.
 */
Status.ErrorDecodingBytestring = new Status(82);

/**
 * File to create a smart contract was of length zero
 */
Status.ContractFileEmpty = new Status(83);

/**
 * Bytecode for smart contract is of length zero
 */
Status.ContractBytecodeEmpty = new Status(84);

/**
 * Attempt to set negative initial balance
 */
Status.InvalidInitialBalance = new Status(85);

/**
 * [Deprecated]. attempt to set negative receive record threshold
 */
Status.InvalidReceiveRecordThreshold = new Status(86);

/**
 * [Deprecated]. attempt to set negative send record threshold
 */
Status.InvalidSendRecordThreshold = new Status(87);

/**
 * Special Account Operations should be performed by only Genesis account, return this code if it
 * is not Genesis Account
 */
Status.AccountIsNotGenesisAccount = new Status(88);

/**
 * The fee payer account doesn't have permission to submit such Transaction
 */
Status.PayerAccountUnauthorized = new Status(89);

/**
 * FreezeTransactionBody is invalid
 */
Status.InvalidFreezeTransactionBody = new Status(90);

/**
 * FreezeTransactionBody does not exist
 */
Status.FreezeTransactionBodyNotFound = new Status(91);

/**
 * Exceeded the number of accounts (both from and to) allowed for crypto transfer list
 */
Status.TransferListSizeLimitExceeded = new Status(92);

/**
 * Smart contract result size greater than specified maxResultSize
 */
Status.ResultSizeLimitExceeded = new Status(93);

/**
 * The payer account is not a special account(account 0.0.55)
 */
Status.NotSpecialAccount = new Status(94);

/**
 * Negative gas was offered in smart contract call
 */
Status.ContractNegativeGas = new Status(95);

/**
 * Negative value / initial balance was specified in a smart contract call / create
 */
Status.ContractNegativeValue = new Status(96);

/**
 * Failed to update fee file
 */
Status.InvalidFeeFile = new Status(97);

/**
 * Failed to update exchange rate file
 */
Status.InvalidExchangeRateFile = new Status(98);

/**
 * Payment tendered for contract local call cannot cover both the fee and the gas
 */
Status.InsufficientLocalCallGas = new Status(99);

/**
 * Entities with Entity ID below 1000 are not allowed to be deleted
 */
Status.EntityNotAllowedToDelete = new Status(100);

/**
 * Violating one of these rules: 1) treasury account can update all entities below 0.0.1000, 2)
 * account 0.0.50 can update all entities from 0.0.51 - 0.0.80, 3) Network Function Master Account
 * A/c 0.0.50 - Update all Network Function accounts & perform all the Network Functions listed
 * below, 4) Network Function Accounts: i) A/c 0.0.55 - Update Address Book files (0.0.101/102),
 * ii) A/c 0.0.56 - Update Fee schedule (0.0.111), iii) A/c 0.0.57 - Update Exchange Rate
 * (0.0.112).
 */
Status.AuthorizationFailed = new Status(101);

/**
 * Fee Schedule Proto uploaded but not valid (append or update is required)
 */
Status.FileUploadedProtoInvalid = new Status(102);

/**
 * Fee Schedule Proto uploaded but not valid (append or update is required)
 */
Status.FileUploadedProtoNotSavedToDisk = new Status(103);

/**
 * Fee Schedule Proto File Part uploaded
 */
Status.FeeScheduleFilePartUploaded = new Status(104);

/**
 * The change on Exchange Rate exceeds Exchange_Rate_Allowed_Percentage
 */
Status.ExchangeRateChangeLimitExceeded = new Status(105);

/**
 * Contract permanent storage exceeded the currently allowable limit
 */
Status.MaxContractStorageExceeded = new Status(106);

/**
 * Transfer Account should not be same as Account to be deleted
 */
Status.TransferAccountSameAsDeleteAccount = new Status(107);

Status.TotalLedgerBalanceInvalid = new Status(108);
/**
 * The expiration date/time on a smart contract may not be reduced
 */
Status.ExpirationReductionNotAllowed = new Status(110);

/**
 * Gas exceeded currently allowable gas limit per transaction
 */
Status.MaxGasLimitExceeded = new Status(111);

/**
 * File size exceeded the currently allowable limit
 */
Status.MaxFileSizeExceeded = new Status(112);

/**
 * When a valid signature is not provided for operations on account with receiverSigRequired=true
 */
Status.ReceiverSigRequired = new Status(113);

/**
 * The Topic ID specified is not in the system.
 */
Status.InvalidTopicId = new Status(150);

/**
 * A provided admin key was invalid.
 */
Status.InvalidAdminKey = new Status(155);

/**
 * A provided submit key was invalid.
 */
Status.InvalidSubmitKey = new Status(156);

/**
 * An attempted operation was not authorized (ie - a deleteTopic for a topic with no adminKey).
 */
Status.Unauthorized = new Status(157);

/**
 * A ConsensusService message is empty.
 */
Status.InvalidTopicMessage = new Status(158);

/**
 * The autoRenewAccount specified is not a valid, active account.
 */
Status.InvalidAutorenewAccount = new Status(159);

/**
 * An adminKey was not specified on the topic, so there must not be an autoRenewAccount.
 */
Status.AutorenewAccountNotAllowed = new Status(160);

/**
 * The topic has expired, was not automatically renewed, and is in a 7 day grace period before the
 * topic will be deleted unrecoverably. This error response code will not be returned until
 * autoRenew functionality is supported by HAPI.
 */
Status.TopicExpired = new Status(162);

/**
 * chunk number must be from 1 to total (chunks) inclusive.
 */
Status.InvalidChunkNumber = new Status(163);

/**
 * For every chunk, the payer account that is part of initialTransactionID must match the Payer
 * Account of this transaction. The entire initialTransactionID should match the transactionID of
 * the first chunk, but this is not checked or enforced by Hedera except when the chunk number is 1.
 */
Status.InvalidChunkTransactionId = new Status(164);

/**
 * Account is frozen and cannot transact with the token
 */
Status.AccountFrozenForToken = new Status(165);

/**
 * An involved account already has more than <tt>tokens.maxPerAccount</tt> associations with
 * non-deleted tokens.
 */
Status.TokensPerAccountLimitExceeded = new Status(166);

/**
 * The token is invalid or does not exist
 */
Status.InvalidTokenId = new Status(167);

/**
 * Invalid token decimals
 */
Status.InvalidTokenDecimals = new Status(168);

/**
 * Invalid token initial supply
 */
Status.InvalidTokenInitialSupply = new Status(169);

/**
 * Treasury Account does not exist or is deleted
 */
Status.InvalidTreasuryAccountForToken = new Status(170);

/**
 * Token Symbol is not UTF-8 capitalized alphabetical string
 */
Status.InvalidTokenSymbol = new Status(171);

/**
 * Freeze key is not set on token
 */
Status.TokenHasNoFreezeKey = new Status(172);

/**
 * Amounts in transfer list are not net zero
 */
Status.TransfersNotZeroSumForToken = new Status(173);

/**
 * A token symbol was not provided
 */
Status.MissingTokenSymbol = new Status(174);

/**
 * The provided token symbol was too long
 */
Status.TokenSymbolTooLong = new Status(175);

/**
 * KYC must be granted and account does not have KYC granted
 */
Status.AccountKycNotGrantedForToken = new Status(176);

/**
 * KYC key is not set on token
 */
Status.TokenHasNoKycKey = new Status(177);

/**
 * Token balance is not sufficient for the transaction
 */
Status.InsufficientTokenBalance = new Status(178);

/**
 * Token transactions cannot be executed on deleted token
 */
Status.TokenWasDeleted = new Status(179);

/**
 * Supply key is not set on token
 */
Status.TokenHasNoSupplyKey = new Status(180);

/**
 * Wipe key is not set on token
 */
Status.TokenHasNoWipeKey = new Status(181);

/**
 * The requested token mint amount would cause an invalid total supply
 */
Status.InvalidTokenMintAmount = new Status(182);

/**
 * The requested token burn amount would cause an invalid total supply
 */
Status.InvalidTokenBurnAmount = new Status(183);

/**
 * A required token-account relationship is missing
 */
Status.TokenNotAssociatedToAccount = new Status(184);

/**
 * The target of a wipe operation was the token treasury account
 */
Status.CannotWipeTokenTreasuryAccount = new Status(185);

/**
 * The provided KYC key was invalid.
 */
Status.InvalidKycKey = new Status(186);

/**
 * The provided wipe key was invalid.
 */
Status.InvalidWipeKey = new Status(187);

/**
 * The provided freeze key was invalid.
 */
Status.InvalidFreezeKey = new Status(188);

/**
 * The provided supply key was invalid.
 */
Status.InvalidSupplyKey = new Status(189);

/**
 * Token Name is not provided
 */
Status.MissingTokenName = new Status(190);

/**
 * Token Name is too long
 */
Status.TokenNameTooLong = new Status(191);

/**
 * The provided wipe amount must not be negative, zero or bigger than the token holder balance
 */
Status.InvalidWipingAmount = new Status(192);

/**
 * Token does not have Admin key set, thus update/delete transactions cannot be performed
 */
Status.TokenIsImmutable = new Status(193);

/**
 * An <tt>associateToken</tt> operation specified a token already associated to the account
 */
Status.TokenAlreadyAssociatedToAccount = new Status(194);

/**
 * An attempted operation is invalid until all token balances for the target account are zero
 */
Status.TransactionRequiresZeroTokenBalances = new Status(195);

/**
 * An attempted operation is invalid because the account is a treasury
 */
Status.AccountIsTreasury = new Status(196);

/**
 * Same TokenIDs present in the token list
 */
Status.TokenIdRepeatedInTokenList = new Status(197);

/**
 * Exceeded the number of token transfers (both from and to) allowed for token transfer list
 */
Status.TokenTransferListSizeLimitExceeded = new Status(198);

/**
 * TokenTransfersTransactionBody has no TokenTransferList
 */
Status.EmptyTokenTransferBody = new Status(199);

/**
 * TokenTransfersTransactionBody has a TokenTransferList with no AccountAmounts
 */
Status.EmptyTokenTransferAccountAmounts = new Status(200);

/**
 * The Scheduled entity does not exist; or has now expired, been deleted, or been executed
 */
Status.InvalidScheduleId = new Status(201);

/**
 * The Scheduled entity cannot be modified. Admin key not set
 */
Status.ScheduleIsImmutable = new Status(202);

/**
 * The provided Scheduled Payer does not exist
 */
Status.InvalidSchedulePayerId = new Status(203);

/**
 * The Schedule Create Transaction TransactionID account does not exist
 */
Status.InvalidScheduleAccountId = new Status(204);

/**
 * The provided sig map did not contain any new valid signatures from required signers of the
 * scheduled transaction
 */
Status.NoNewValidSignatures = new Status(205);

/**
 * The required signers for a scheduled transaction cannot be resolved, for example because they do
 * not exist or have been deleted
 */
Status.UnresolvableRequiredSigners = new Status(206);

/**
 * Only whitelisted transaction types may be scheduled
 */
Status.ScheduledTransactionNotInWhitelist = new Status(207);

/**
 * At least one of the signatures in the provided sig map did not represent a valid signature for
 * any required signer
 */
Status.SomeSignaturesWereInvalid = new Status(208);

/**
 * The scheduled field in the TransactionID may not be set to true
 */
Status.TransactionIdFieldNotAllowed = new Status(209);

/**
 * A schedule already exists with the same identifying fields of an attempted ScheduleCreate (that
 * is, all fields other than scheduledPayerAccountID)
 */
Status.IdenticalScheduleAlreadyCreated = new Status(210);

/**
 * A string field in the transaction has a UTF-8 encoding with the prohibited zero byte
 */
Status.InvalidZeroByteInString = new Status(211);

/**
 * A schedule being signed or deleted has already been deleted
 */
Status.ScheduleAlreadyDeleted = new Status(212);

/**
 * A schedule being signed or deleted has already been executed
 */
Status.ScheduleAlreadyExecuted = new Status(213);

/**
 * ConsensusSubmitMessage request's message size is larger than allowed.
 */
Status.MessageSizeTooLarge = new Status(214);

/**
 * An operation was assigned to more than one throttle group in a given bucket
 */
Status.OperationRepeatedInBucketGroups = new Status(215);

/**
 * The capacity needed to satisfy all opsPerSec groups in a bucket overflowed a signed 8-byte
 * integral type
 */
Status.BucketCapacityOverflow = new Status(216);

/**
 * Given the network size in the address book, the node-level capacity for an operation would never
 * be enough to accept a single request; usually means a bucket burstPeriod should be increased
 */
Status.NodeCapacityNotSufficientForOperation = new Status(217);

/**
 * A bucket was defined without any throttle groups
 */
Status.BucketHasNoThrottleGroups = new Status(218);

/**
 * A throttle group was granted zero opsPerSec
 */
Status.ThrottleGroupHasZeroOpsPerSec = new Status(219);

/**
 * The throttle definitions file was updated, but some supported operations were not assigned a
 * bucket
 */
Status.SuccessButMissingExpectedOperation = new Status(220);

/**
 * The new contents for the throttle definitions system file were not valid protobuf
 */
Status.UnparseableThrottleDefinitions = new Status(221);

/**
 * The new throttle definitions system file were invalid, and no more specific error could be
 * divined
 */
Status.InvalidThrottleDefinitions = new Status(222);

/**
 * The transaction references an account which has passed its expiration without renewal funds
 * available, and currently remains in the ledger only because of the grace period given to expired
 * entities
 */
Status.AccountExpiredAndPendingRemoval = new Status(223);

/**
 * Invalid token max supply
 */
Status.InvalidTokenMaxSupply = new Status(224);

/**
 * Invalid token nft serial number
 */
Status.InvalidTokenNftSerialNumber = new Status(225);

/**
 * Invalid nft id
 */
Status.InvalidNftId = new Status(226);

/**
 * Nft metadata is too long
 */
Status.MetadataTooLong = new Status(227);

/**
 * Repeated operations count exceeds the limit
 */
Status.BatchSizeLimitExceeded = new Status(228);

/**
 * The range of data to be gathered is out of the set boundaries
 */
Status.InvalidQueryRange = new Status(229);

/**
 * A custom fractional fee set a denominator of zero
 */
Status.FractionDividesByZero = new Status(230);

/**
 * The transaction payer could not afford a custom fee
 */
Status.InsufficientPayerBalanceForCustomFee = new Status(231);

/**
 * More than 10 custom fees were specified
 */
Status.CustomFeesListTooLong = new Status(232);

/**
 * Any of the feeCollector accounts for customFees is invalid
 */
Status.InvalidCustomFeeCollector = new Status(233);

/**
 * Any of the token Ids in customFees is invalid
 */
Status.InvalidTokenIdInCustomFees = new Status(234);

/**
 * Any of the token Ids in customFees are not associated to feeCollector
 */
Status.TokenNotAssociatedToFeeCollector = new Status(235);

/**
 * A token cannot have more units minted due to its configured supply ceiling
 */
Status.TokenMaxSupplyReached = new Status(236);

/**
 * The transaction attempted to move an NFT serial number from an account other than its owner
 */
Status.SenderDoesNotOwnNftSerialNo = new Status(237);

/**
 * A custom fee schedule entry did not specify either a fixed or fractional fee
 */
Status.CustomFeeNotFullySpecified = new Status(238);

/**
 * Only positive fees may be assessed at this time
 */
Status.CustomFeeMustBePositive = new Status(239);

/**
 * Fee schedule key is not set on token
 */
Status.TokenHasNoFeeScheduleKey = new Status(240);

/**
 * A fractional custom fee exceeded the range of a 64-bit signed integer
 */
Status.CustomFeeOutsideNumericRange = new Status(241);

/**
 * A royalty cannot exceed the total fungible value exchanged for an NFT
 */
Status.RoyaltyFractionCannotExceedOne = new Status(242);

/**
 * Each fractional custom fee must have its maximum_amount, if specified, at least its
 * minimum_amount
 */
Status.FractionalFeeMaxAmountLessThanMinAmount = new Status(243);

/**
 * A fee schedule update tried to clear the custom fees from a token whose fee schedule was already
 * empty
 */
Status.CustomScheduleAlreadyHasNoFees = new Status(244);

/**
 * Only tokens of type FUNGIBLE_COMMON can be used to as fee schedule denominations
 */
Status.CustomFeeDenominationMustBeFungibleCommon = new Status(245);

/**
 * Only tokens of type FUNGIBLE_COMMON can have fractional fees
 */
Status.CustomFractionalFeeOnlyAllowedForFungibleCommon = new Status(246);

/**
 * The provided custom fee schedule key was invalid
 */
Status.InvalidCustomFeeScheduleKey = new Status(247);

/**
 * The requested token mint metadata was invalid
 */
Status.InvalidTokenMintMetadata = new Status(248);

/**
 * The requested token burn metadata was invalid
 */
Status.InvalidTokenBurnMetadata = new Status(249);

/**
 * The treasury for a unique token cannot be changed until it owns no NFTs
 */
Status.CurrentTreasuryStillOwnsNfts = new Status(250);

/**
 * An account cannot be dissociated from a unique token if it owns NFTs for the token
 */
Status.AccountStillOwnsNfts = new Status(251);

/**
 * A NFT can only be burned when owned by the unique token's treasury
 */
Status.TreasuryMustOwnBurnedNft = new Status(252);

/**
 * An account did not own the NFT to be wiped
 */
Status.AccountDoesNotOwnWipedNft = new Status(253);

/**
 * An AccountAmount token transfers list referenced a token type other than FUNGIBLE_COMMON
 */
Status.AccountAmountTransfersOnlyAllowedForFungibleCommon = new Status(254);

/**
 * All the NFTs allowed in the current price regime have already been minted
 */
Status.MaxNftsInPriceRegimeHaveBeenMinted = new Status(255);

/**
 * The payer account has been marked as deleted
 */
Status.PayerAccountDeleted = new Status(256);

/**
 * The reference chain of custom fees for a transferred token exceeded the maximum length of 2
 */
Status.CustomFeeChargingExceededMaxRecursionDepth = new Status(257);

/**
 * More than 20 balance adjustments were to satisfy a CryptoTransfer and its implied custom fee
 * payments
 */
Status.CustomFeeChargingExceededMaxAccountAmounts = new Status(258);

/**
 * The sender account in the token transfer transaction could not afford a custom fee
 */
Status.InsufficientSenderAccountBalanceForCustomFee = new Status(259);

/**
 * Currently no more than 4,294,967,295 NFTs may be minted for a given unique token type
 */
Status.SerialNumberLimitReached = new Status(260);

/**
 * Only tokens of type NON_FUNGIBLE_UNIQUE can have royalty fees
 */
Status.CustomRoyaltyFeeOnlyAllowedForNonFungibleUnique = new Status(261);

/**
 * The account has reached the limit on the automatic associations count.
 */
Status.NoRemainingAutomaticAssociations = new Status(262);

/**
 * Already existing automatic associations are more than the new maximum automatic associations.
 */
Status.ExistingAutomaticAssociationsExceedGivenLimit = new Status(263);

/**
 * Cannot set the number of automatic associations for an account more than the
 * maximum allowed token associations <tt>tokens.maxPerAccount</tt>
 */
Status.RequestedNumAutomaticAssociationsExceedsAssociationLimit = new Status(
    264
);

/**
 * Token is paused. This Token cannot be a part of any kind of Transaction until unpaused.
 */
Status.TokenIsPaused = new Status(265);

/**
 * Pause key is not set on token
 */
Status.TokenHasNoPauseKey = new Status(266);

/**
 * The provided pause key was invalid
 */
Status.InvalidPauseKey = new Status(267);

/**
 * The update file in a freeze transaction body must exist.
 */
Status.FreezeUpdateFileDoesNotExist = new Status(268);

/**
 * The hash of the update file in a freeze transaction body must match the in-memory hash.
 */
Status.FreezeUpdateFileHashDoesNotMatch = new Status(269);

/**
 * A FREEZE_UPGRADE transaction was handled with no previous update prepared.
 */
Status.NoUpgradeHasBeenPrepared = new Status(270);

/**
 * A FREEZE_ABORT transaction was handled with no scheduled freeze.
 */
Status.NoFreezeIsScheduled = new Status(271);

/**
 * The update file hash when handling a FREEZE_UPGRADE transaction differs from the file
 * hash at the time of handling the PREPARE_UPGRADE transaction.
 */
Status.UpdateFileHashChangedSincePrepareUpgrade = new Status(272);

/**
 * The given freeze start time was in the (consensus) past.
 */
Status.FreezeStartTimeMustBeFuture = new Status(273);

/**
 * The prepared update file cannot be updated or appended until either the upgrade has
 * been completed, or a FREEZE_ABORT has been handled.
 */
Status.PreparedUpdateFileIsImmutable = new Status(274);

/**
 * Once a freeze is scheduled, it must be aborted before any other type of freeze can
 * can be performed.
 */
Status.FreezeAlreadyScheduled = new Status(275);

/**
 * If an NMT upgrade has been prepared, the following operation must be a FREEZE_UPGRADE.
 * (To issue a FREEZE_ONLY, submit a FREEZE_ABORT first.)
 */
Status.FreezeUpgradeInProgress = new Status(276);

/**
 * If an NMT upgrade has been prepared, the subsequent FREEZE_UPGRADE transaction must
 * confirm the id of the file to be used in the upgrade.
 */
Status.UpdateFileIdDoesNotMatchPrepared = new Status(277);

/**
 * If an NMT upgrade has been prepared, the subsequent FREEZE_UPGRADE transaction must
 * confirm the hash of the file to be used in the upgrade.
 */
Status.UpdateFileHashDoesNotMatchPrepared = new Status(278);

/**
 * Consensus throttle did not allow execution of this transaction. System is throttled at
 * consensus level.
 */
Status.ConsensusGasExhausted = new Status(279);
