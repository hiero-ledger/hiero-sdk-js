// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ResponseCodeEnum} HieroProto.proto.ResponseCodeEnum
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
            case Status.RevertedSuccess:
                return "REVERTED_SUCCESS";
            case Status.MaxStorageInPriceRegimeHasBeenUsed:
                return "MAX_STORAGE_IN_PRICE_REGIME_HAS_BEEN_USED";
            case Status.InvalidAliasKey:
                return "INVALID_ALIAS_KEY";
            case Status.UnexpectedTokenDecimals:
                return "UNEXPECTED_TOKEN_DECIMALS";
            case Status.InvalidProxyAccountId:
                return "INVALID_PROXY_ACCOUNT_ID";
            case Status.InvalidTransferAccountId:
                return "INVALID_TRANSFER_ACCOUNT_ID";
            case Status.InvalidFeeCollectorAccountId:
                return "INVALID_FEE_COLLECTOR_ACCOUNT_ID";
            case Status.AliasIsImmutable:
                return "ALIAS_IS_IMMUTABLE";
            case Status.SpenderAccountSameAsOwner:
                return "SPENDER_ACCOUNT_SAME_AS_OWNER";
            case Status.AmountExceedsTokenMaxSupply:
                return "AMOUNT_EXCEEDS_TOKEN_MAX_SUPPLY";
            case Status.NegativeAllowanceAmount:
                return "NEGATIVE_ALLOWANCE_AMOUNT";
            case Status.CannotApproveForAllFungibleCommon:
                return "CANNOT_APPROVE_FOR_ALL_FUNGIBLE_COMMON";
            case Status.SpenderDoesNotHaveAllowance:
                return "SPENDER_DOES_NOT_HAVE_ALLOWANCE";
            case Status.AmountExceedsAllowance:
                return "AMOUNT_EXCEEDS_ALLOWANCE";
            case Status.MaxAllowancesExceeded:
                return "MAX_ALLOWANCES_EXCEEDED";
            case Status.EmptyAllowances:
                return "EMPTY_ALLOWANCES";
            case Status.SpenderAccountRepeatedInAllowances:
                return "SPENDER_ACCOUNT_REPEATED_IN_ALLOWANCES";
            case Status.RepeatedSerialNumsInNftAllowances:
                return "REPEATED_SERIAL_NUMS_IN_NFT_ALLOWANCES";
            case Status.FungibleTokenInNftAllowances:
                return "FUNGIBLE_TOKEN_IN_NFT_ALLOWANCES";
            case Status.NftInFungibleTokenAllowances:
                return "NFT_IN_FUNGIBLE_TOKEN_ALLOWANCES";
            case Status.InvalidAllowanceOwnerId:
                return "INVALID_ALLOWANCE_OWNER_ID";
            case Status.InvalidAllowanceSpenderId:
                return "INVALID_ALLOWANCE_SPENDER_ID";
            case Status.RepeatedAllowancesToDelete:
                return "REPEATED_ALLOWANCES_TO_DELETE";
            case Status.InvalidDelegatingSpender:
                return "INVALID_DELEGATING_SPENDER";
            case Status.DelegatingSpenderCannotGrantApproveForAll:
                return "DELEGATING_SPENDER_CANNOT_GRANT_APPROVE_FOR_ALL";
            case Status.DelegatingSpenderDoesNotHaveApproveForAll:
                return "DELEGATING_SPENDER_DOES_NOT_HAVE_APPROVE_FOR_ALL";
            case Status.ScheduleExpirationTimeTooFarInFuture:
                return "SCHEDULE_EXPIRATION_TIME_TOO_FAR_IN_FUTURE";
            case Status.ScheduleExpirationTimeMustBeHigherThanConsensusTime:
                return "SCHEDULE_EXPIRATION_TIME_MUST_BE_HIGHER_THAN_CONSENSUS_TIME";
            case Status.ScheduleFutureThrottleExceeded:
                return "SCHEDULE_FUTURE_THROTTLE_EXCEEDED";
            case Status.ScheduleFutureGasLimitExceeded:
                return "SCHEDULE_FUTURE_GAS_LIMIT_EXCEEDED";
            case Status.InvalidEthereumTransaction:
                return "INVALID_ETHEREUM_TRANSACTION";
            case Status.WrongChainId:
                return "WRONG_CHAIN_ID";
            case Status.WrongNonce:
                return "WRONG_NONCE";
            case Status.AccessListUnsupported:
                return "ACCESS_LIST_UNSUPPORTED";
            case Status.SchedulePendingExpiration:
                return "SCHEDULE_PENDING_EXPIRATION";
            case Status.ContractIsTokenTreasury:
                return "CONTRACT_IS_TOKEN_TREASURY";
            case Status.ContractHasNonZeroTokenBalances:
                return "CONTRACT_HAS_NON_ZERO_TOKEN_BALANCES";
            case Status.ContractExpiredAndPendingRemoval:
                return "CONTRACT_EXPIRED_AND_PENDING_REMOVAL";
            case Status.ContractHasNoAutoRenewAccount:
                return "CONTRACT_HAS_NO_AUTO_RENEW_ACCOUNT";
            case Status.PermanentRemovalRequiresSystemInitiation:
                return "PERMANENT_REMOVAL_REQUIRES_SYSTEM_INITIATION";
            case Status.ProxyAccountIdFieldIsDeprecated:
                return "PROXY_ACCOUNT_ID_FIELD_IS_DEPRECATED";
            case Status.SelfStakingIsNotAllowed:
                return "SELF_STAKING_IS_NOT_ALLOWED";
            case Status.InvalidStakingId:
                return "INVALID_STAKING_ID";
            case Status.StakingNotEnabled:
                return "STAKING_NOT_ENABLED";
            case Status.InvalidPrngRange:
                return "INVALID_PRNG_RANGE";
            case Status.MaxEntitiesInPriceRegimeHaveBeenCreated:
                return "MAX_ENTITIES_IN_PRICE_REGIME_HAVE_BEEN_CREATED";
            case Status.InvalidFullPrefixSignatureForPrecompile:
                return "INVALID_FULL_PREFIX_SIGNATURE_FOR_PRECOMPILE";
            case Status.InsufficientBalancesForStorageRent:
                return "INSUFFICIENT_BALANCES_FOR_STORAGE_RENT";
            case Status.MaxChildRecordsExceeded:
                return "MAX_CHILD_RECORDS_EXCEEDED";
            case Status.InsufficientBalancesForRenewalFees:
                return "INSUFFICIENT_BALANCES_FOR_RENEWAL_FEES";
            case Status.TransactionHasUnknownFields:
                return "TRANSACTION_HAS_UNKNOWN_FIELDS";
            case Status.AccountIsImmutable:
                return "ACCOUNT_IS_IMMUTABLE";
            case Status.AliasAlreadyAssigned:
                return "ALIAS_ALREADY_ASSIGNED";
            case Status.InvalidMetadataKey:
                return "INVALID_METADATA_KEY";
            case Status.TokenHasNoMetadataKey:
                return "TOKEN_HAS_NO_METADATA_KEY";
            case Status.MissingTokenMetadata:
                return "MISSING_TOKEN_METADATA";
            case Status.MissingSerialNumbers:
                return "MISSING_SERIAL_NUMBERS";
            case Status.TokenHasNoAdminKey:
                return "TOKEN_HAS_NO_ADMIN_KEY";
            case Status.NodeDeleted:
                return "NODE_DELETED";
            case Status.InvalidNodeId:
                return "INVALID_NODE_ID";
            case Status.InvalidGossipEndpoint:
                return "INVALID_GOSSIP_ENDPOINT";
            case Status.InvalidNodeAccountId:
                return "INVALID_NODE_ACCOUNT_ID";
            case Status.InvalidNodeDescription:
                return "INVALID_NODE_DESCRIPTION";
            case Status.InvalidServiceEndpoint:
                return "INVALID_SERVICE_ENDPOINT";
            case Status.InvalidGossipCaCertificate:
                return "INVALID_GOSSIP_CA_CERTIFICATE";
            case Status.InvalidGrpcCertificate:
                return "INVALID_GRPC_CERTIFICATE";
            case Status.InvalidMaxAutoAssociations:
                return "INVALID_MAX_AUTO_ASSOCIATIONS";
            case Status.MaxNodesCreated:
                return "MAX_NODES_CREATED";
            case Status.IpFqdnCannotBeSetForSameEndpoint:
                return "IP_FQDN_CANNOT_BE_SET_FOR_SAME_ENDPOINT";
            case Status.GossipEndpointCannotHaveFqdn:
                return "GOSSIP_ENDPOINT_CANNOT_HAVE_FQDN";
            case Status.FqdnSizeTooLarge:
                return "FQDN_SIZE_TOO_LARGE";
            case Status.InvalidEndpoint:
                return "INVALID_ENDPOINT";
            case Status.GossipEndpointsExceededLimit:
                return "GOSSIP_ENDPOINTS_EXCEEDED_LIMIT";
            case Status.TokenReferenceRepeated:
                return "TOKEN_REFERENCE_REPEATED";
            case Status.InvalidOwnerId:
                return "INVALID_OWNER_ID";
            case Status.TokenReferenceListSizeLimitExceeded:
                return "TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED";
            case Status.ServiceEndpointsExceededLimit:
                return "SERVICE_ENDPOINTS_EXCEEDED_LIMIT";
            case Status.InvalidIpv4Address:
                return "INVALID_IPV4_ADDRESS";
            case Status.EmptyTokenReferenceList:
                return "EMPTY_TOKEN_REFERENCE_LIST";
            case Status.UpdateNodeAccountNotAllowed:
                return "UPDATE_NODE_ACCOUNT_NOT_ALLOWED";
            case Status.TokenHasNoMetadataOrSupplyKey:
                return "TOKEN_HAS_NO_METADATA_OR_SUPPLY_KEY";
            case Status.EmptyPendingAirdropIdList:
                return "EMPTY_PENDING_AIRDROP_ID_LIST";
            case Status.PendingAirdropIdRepeated:
                return "PENDING_AIRDROP_ID_REPEATED";
            case Status.PendingAirdropIdListTooLong:
                return "PENDING_AIRDROP_ID_LIST_TOO_LONG";
            case Status.PendingNftAirdropAlreadyExists:
                return "PENDING_NFT_AIRDROP_ALREADY_EXISTS";
            case Status.AccountHasPendingAirdrops:
                return "ACCOUNT_HAS_PENDING_AIRDROPS";
            case Status.ThrottledAtConsensus:
                return "THROTTLED_AT_CONSENSUS";
            case Status.InvalidPendingAirdropId:
                return "INVALID_PENDING_AIRDROP_ID";
            case Status.TokenAirdropWithFallbackRoyalty:
                return "TOKEN_AIRDROP_WITH_FALLBACK_ROYALTY";
            case Status.InvalidTokenInPendingAirdrop:
                return "INVALID_TOKEN_IN_PENDING_AIRDROP";
            case Status.ScheduleExpiryIsBusy:
                return "SCHEDULE_EXPIRY_IS_BUSY";
            case Status.InvalidGrpcCertificateHash:
                return "INVALID_GRPC_CERTIFICATE_HASH";
            case Status.MissingExpiryTime:
                return "MISSING_EXPIRY_TIME";
            case Status.NoSchedulingAllowedAfterScheduledRecursion:
                return "NO_SCHEDULING_ALLOWED_AFTER_SCHEDULED_RECURSION";
            case Status.RecursiveSchedulingLimitReached:
                return "RECURSIVE_SCHEDULING_LIMIT_REACHED";
            case Status.WaitingForLedgerId:
                return "WAITING_FOR_LEDGER_ID";
            case Status.MaxEntriesForFeeExemptKeyListExceeded:
                return "MAX_ENTRIES_FOR_FEE_EXEMPT_KEY_LIST_EXCEEDED";
            case Status.FeeExemptKeyListContainsDuplicatedKeys:
                return "FEE_EXEMPT_KEY_LIST_CONTAINS_DUPLICATED_KEYS";
            case Status.InvalidKeyInFeeExemptKeyList:
                return "INVALID_KEY_IN_FEE_EXEMPT_KEY_LIST";
            case Status.InvalidFeeScheduleKey:
                return "INVALID_FEE_SCHEDULE_KEY";
            case Status.FeeScheduleKeyCannotBeUpdated:
                return "FEE_SCHEDULE_KEY_CANNOT_BE_UPDATED";
            case Status.FeeScheduleKeyNotSet:
                return "FEE_SCHEDULE_KEY_NOT_SET";
            case Status.MaxCustomFeeLimitExceeded:
                return "MAX_CUSTOM_FEE_LIMIT_EXCEEDED";
            case Status.NoValidMaxCustomFee:
                return "NO_VALID_MAX_CUSTOM_FEE";
            case Status.InvalidMaxCustomFees:
                return "INVALID_MAX_CUSTOM_FEES";
            case Status.DuplicateDenominationInMaxCustomFeeList:
                return "DUPLICATE_DENOMINATION_IN_MAX_CUSTOM_FEE_LIST";
            case Status.DuplicateAccountIdInMaxCustomFeeList:
                return "DUPLICATE_ACCOUNT_ID_IN_MAX_CUSTOM_FEE_LIST";
            case Status.MaxCustomFeesIsNotSupported:
                return "MAX_CUSTOM_FEES_IS_NOT_SUPPORTED";
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
            case 280:
                return Status.RevertedSuccess;
            case 281:
                return Status.MaxStorageInPriceRegimeHasBeenUsed;
            case 282:
                return Status.InvalidAliasKey;
            case 283:
                return Status.UnexpectedTokenDecimals;
            case 284:
                return Status.InvalidProxyAccountId;
            case 285:
                return Status.InvalidTransferAccountId;
            case 286:
                return Status.InvalidFeeCollectorAccountId;
            case 287:
                return Status.AliasIsImmutable;
            case 288:
                return Status.SpenderAccountSameAsOwner;
            case 289:
                return Status.AmountExceedsTokenMaxSupply;
            case 290:
                return Status.NegativeAllowanceAmount;
            case 291:
                return Status.CannotApproveForAllFungibleCommon;
            case 292:
                return Status.SpenderDoesNotHaveAllowance;
            case 293:
                return Status.AmountExceedsAllowance;
            case 294:
                return Status.MaxAllowancesExceeded;
            case 295:
                return Status.EmptyAllowances;
            case 296:
                return Status.SpenderAccountRepeatedInAllowances;
            case 297:
                return Status.RepeatedSerialNumsInNftAllowances;
            case 298:
                return Status.FungibleTokenInNftAllowances;
            case 299:
                return Status.NftInFungibleTokenAllowances;
            case 300:
                return Status.InvalidAllowanceOwnerId;
            case 301:
                return Status.InvalidAllowanceSpenderId;
            case 302:
                return Status.RepeatedAllowancesToDelete;
            case 303:
                return Status.InvalidDelegatingSpender;
            case 304:
                return Status.DelegatingSpenderCannotGrantApproveForAll;
            case 305:
                return Status.DelegatingSpenderDoesNotHaveApproveForAll;
            case 306:
                return Status.ScheduleExpirationTimeTooFarInFuture;
            case 307:
                return Status.ScheduleExpirationTimeMustBeHigherThanConsensusTime;
            case 308:
                return Status.ScheduleFutureThrottleExceeded;
            case 309:
                return Status.ScheduleFutureGasLimitExceeded;
            case 310:
                return Status.InvalidEthereumTransaction;
            case 311:
                return Status.WrongChainId;
            case 312:
                return Status.WrongNonce;
            case 313:
                return Status.AccessListUnsupported;
            case 314:
                return Status.SchedulePendingExpiration;
            case 315:
                return Status.ContractIsTokenTreasury;
            case 316:
                return Status.ContractHasNonZeroTokenBalances;
            case 317:
                return Status.ContractExpiredAndPendingRemoval;
            case 318:
                return Status.ContractHasNoAutoRenewAccount;
            case 319:
                return Status.PermanentRemovalRequiresSystemInitiation;
            case 320:
                return Status.ProxyAccountIdFieldIsDeprecated;
            case 321:
                return Status.SelfStakingIsNotAllowed;
            case 322:
                return Status.InvalidStakingId;
            case 323:
                return Status.StakingNotEnabled;
            case 324:
                return Status.InvalidPrngRange;
            case 325:
                return Status.MaxEntitiesInPriceRegimeHaveBeenCreated;
            case 326:
                return Status.InvalidFullPrefixSignatureForPrecompile;
            case 327:
                return Status.InsufficientBalancesForStorageRent;
            case 328:
                return Status.MaxChildRecordsExceeded;
            case 329:
                return Status.InsufficientBalancesForRenewalFees;
            case 330:
                return Status.TransactionHasUnknownFields;
            case 331:
                return Status.AccountIsImmutable;
            case 332:
                return Status.AliasAlreadyAssigned;
            case 333:
                return Status.InvalidMetadataKey;
            case 334:
                return Status.TokenHasNoMetadataKey;
            case 335:
                return Status.MissingTokenMetadata;
            case 336:
                return Status.MissingSerialNumbers;
            case 337:
                return Status.TokenHasNoAdminKey;
            case 338:
                return Status.NodeDeleted;
            case 339:
                return Status.InvalidNodeId;
            case 340:
                return Status.InvalidGossipEndpoint;
            case 341:
                return Status.InvalidNodeAccountId;
            case 342:
                return Status.InvalidNodeDescription;
            case 343:
                return Status.InvalidServiceEndpoint;
            case 344:
                return Status.InvalidGossipCaCertificate;
            case 345:
                return Status.InvalidGrpcCertificate;
            case 346:
                return Status.InvalidMaxAutoAssociations;
            case 347:
                return Status.MaxNodesCreated;
            case 348:
                return Status.IpFqdnCannotBeSetForSameEndpoint;
            case 349:
                return Status.GossipEndpointCannotHaveFqdn;
            case 350:
                return Status.FqdnSizeTooLarge;
            case 351:
                return Status.InvalidEndpoint;
            case 352:
                return Status.GossipEndpointsExceededLimit;
            case 353:
                return Status.TokenReferenceRepeated;
            case 354:
                return Status.InvalidOwnerId;
            case 355:
                return Status.TokenReferenceListSizeLimitExceeded;
            case 356:
                return Status.ServiceEndpointsExceededLimit;
            case 357:
                return Status.InvalidIpv4Address;
            case 358:
                return Status.EmptyTokenReferenceList;
            case 359:
                return Status.UpdateNodeAccountNotAllowed;
            case 360:
                return Status.TokenHasNoMetadataOrSupplyKey;
            case 361:
                return Status.EmptyPendingAirdropIdList;
            case 362:
                return Status.PendingAirdropIdRepeated;
            case 363:
                return Status.PendingAirdropIdListTooLong;
            case 364:
                return Status.PendingNftAirdropAlreadyExists;
            case 365:
                return Status.AccountHasPendingAirdrops;
            case 366:
                return Status.ThrottledAtConsensus;
            case 367:
                return Status.InvalidPendingAirdropId;
            case 368:
                return Status.TokenAirdropWithFallbackRoyalty;
            case 369:
                return Status.InvalidTokenInPendingAirdrop;
            case 370:
                return Status.ScheduleExpiryIsBusy;
            case 371:
                return Status.InvalidGrpcCertificateHash;
            case 372:
                return Status.MissingExpiryTime;
            case 373:
                return Status.NoSchedulingAllowedAfterScheduledRecursion;
            case 374:
                return Status.RecursiveSchedulingLimitReached;
            case 375:
                return Status.WaitingForLedgerId;
            case 376:
                return Status.MaxEntriesForFeeExemptKeyListExceeded;
            case 377:
                return Status.FeeExemptKeyListContainsDuplicatedKeys;
            case 378:
                return Status.InvalidKeyInFeeExemptKeyList;
            case 379:
                return Status.InvalidFeeScheduleKey;
            case 380:
                return Status.FeeScheduleKeyCannotBeUpdated;
            case 381:
                return Status.FeeScheduleKeyNotSet;
            case 382:
                return Status.MaxCustomFeeLimitExceeded;
            case 383:
                return Status.NoValidMaxCustomFee;
            case 384:
                return Status.InvalidMaxCustomFees;
            case 385:
                return Status.DuplicateDenominationInMaxCustomFeeList;
            case 386:
                return Status.DuplicateAccountIdInMaxCustomFeeList;
            case 387:
                return Status.MaxCustomFeesIsNotSupported;
            default:
                throw new Error(
                    `(BUG) Status.fromCode() does not handle code: ${code}`,
                );
        }
    }

    /**
     * @returns {HieroProto.proto.ResponseCodeEnum}
     */
    valueOf() {
        return this._code;
    }
}

/* ok */
        Status.Ok = new Status(0);

/* invalid transaction */
        Status.InvalidTransaction = new Status(1);

/* payer account not found */
        Status.PayerAccountNotFound = new Status(2);

/* invalid node account */
        Status.InvalidNodeAccount = new Status(3);

/* transaction expired */
        Status.TransactionExpired = new Status(4);

/* invalid transaction start */
        Status.InvalidTransactionStart = new Status(5);

/* invalid transaction duration */
        Status.InvalidTransactionDuration = new Status(6);

/* invalid signature */
        Status.InvalidSignature = new Status(7);

/* memo too long */
        Status.MemoTooLong = new Status(8);

/* insufficient tx fee */
        Status.InsufficientTxFee = new Status(9);

/* insufficient payer balance */
        Status.InsufficientPayerBalance = new Status(10);

/* duplicate transaction */
        Status.DuplicateTransaction = new Status(11);

/* busy */
        Status.Busy = new Status(12);

/* not supported */
        Status.NotSupported = new Status(13);

/* invalid file id */
        Status.InvalidFileId = new Status(14);

/* invalid account id */
        Status.InvalidAccountId = new Status(15);

/* invalid contract id */
        Status.InvalidContractId = new Status(16);

/* invalid transaction id */
        Status.InvalidTransactionId = new Status(17);

/* receipt not found */
        Status.ReceiptNotFound = new Status(18);

/* record not found */
        Status.RecordNotFound = new Status(19);

/* invalid solidity id */
        Status.InvalidSolidityId = new Status(20);

/* unknown */
        Status.Unknown = new Status(21);

/* success */
        Status.Success = new Status(22);

/* fail invalid */
        Status.FailInvalid = new Status(23);

/* fail fee */
        Status.FailFee = new Status(24);

/* fail balance */
        Status.FailBalance = new Status(25);

/* key required */
        Status.KeyRequired = new Status(26);

/* bad encoding */
        Status.BadEncoding = new Status(27);

/* insufficient account balance */
        Status.InsufficientAccountBalance = new Status(28);

/* invalid solidity address */
        Status.InvalidSolidityAddress = new Status(29);

/* insufficient gas */
        Status.InsufficientGas = new Status(30);

/* contract size limit exceeded */
        Status.ContractSizeLimitExceeded = new Status(31);

/* local call modification exception */
        Status.LocalCallModificationException = new Status(32);

/* contract revert executed */
        Status.ContractRevertExecuted = new Status(33);

/* contract execution exception */
        Status.ContractExecutionException = new Status(34);

/* invalid receiving node account */
        Status.InvalidReceivingNodeAccount = new Status(35);

/* missing query header */
        Status.MissingQueryHeader = new Status(36);

/* account update failed */
        Status.AccountUpdateFailed = new Status(37);

/* invalid key encoding */
        Status.InvalidKeyEncoding = new Status(38);

/* null solidity address */
        Status.NullSolidityAddress = new Status(39);

/* contract update failed */
        Status.ContractUpdateFailed = new Status(40);

/* invalid query header */
        Status.InvalidQueryHeader = new Status(41);

/* invalid fee submitted */
        Status.InvalidFeeSubmitted = new Status(42);

/* invalid payer signature */
        Status.InvalidPayerSignature = new Status(43);

/* key not provided */
        Status.KeyNotProvided = new Status(44);

/* invalid expiration time */
        Status.InvalidExpirationTime = new Status(45);

/* no wacl key */
        Status.NoWaclKey = new Status(46);

/* file content empty */
        Status.FileContentEmpty = new Status(47);

/* invalid account amounts */
        Status.InvalidAccountAmounts = new Status(48);

/* empty transaction body */
        Status.EmptyTransactionBody = new Status(49);

/* invalid transaction body */
        Status.InvalidTransactionBody = new Status(50);

/* invalid signature type mismatching key */
        Status.InvalidSignatureTypeMismatchingKey = new Status(51);

/* invalid signature count mismatching key */
        Status.InvalidSignatureCountMismatchingKey = new Status(52);

/* empty live hash body */
        Status.EmptyLiveHashBody = new Status(53);

/* empty live hash */
        Status.EmptyLiveHash = new Status(54);

/* empty live hash keys */
        Status.EmptyLiveHashKeys = new Status(55);

/* invalid live hash size */
        Status.InvalidLiveHashSize = new Status(56);

/* empty query body */
        Status.EmptyQueryBody = new Status(57);

/* empty live hash query */
        Status.EmptyLiveHashQuery = new Status(58);

/* live hash not found */
        Status.LiveHashNotFound = new Status(59);

/* account id does not exist */
        Status.AccountIdDoesNotExist = new Status(60);

/* live hash already exists */
        Status.LiveHashAlreadyExists = new Status(61);

/* invalid file wacl */
        Status.InvalidFileWacl = new Status(62);

/* serialization failed */
        Status.SerializationFailed = new Status(63);

/* transaction oversize */
        Status.TransactionOversize = new Status(64);

/* transaction too many layers */
        Status.TransactionTooManyLayers = new Status(65);

/* contract deleted */
        Status.ContractDeleted = new Status(66);

/* platform not active */
        Status.PlatformNotActive = new Status(67);

/* key prefix mismatch */
        Status.KeyPrefixMismatch = new Status(68);

/* platform transaction not created */
        Status.PlatformTransactionNotCreated = new Status(69);

/* invalid renewal period */
        Status.InvalidRenewalPeriod = new Status(70);

/* invalid payer account id */
        Status.InvalidPayerAccountId = new Status(71);

/* account deleted */
        Status.AccountDeleted = new Status(72);

/* file deleted */
        Status.FileDeleted = new Status(73);

/* account repeated in account amounts */
        Status.AccountRepeatedInAccountAmounts = new Status(74);

/* setting negative account balance */
        Status.SettingNegativeAccountBalance = new Status(75);

/* obtainer required */
        Status.ObtainerRequired = new Status(76);

/* obtainer same contract id */
        Status.ObtainerSameContractId = new Status(77);

/* obtainer does not exist */
        Status.ObtainerDoesNotExist = new Status(78);

/* modifying immutable contract */
        Status.ModifyingImmutableContract = new Status(79);

/* file system exception */
        Status.FileSystemException = new Status(80);

/* autorenew duration not in range */
        Status.AutorenewDurationNotInRange = new Status(81);

/* error decoding bytestring */
        Status.ErrorDecodingBytestring = new Status(82);

/* contract file empty */
        Status.ContractFileEmpty = new Status(83);

/* contract bytecode empty */
        Status.ContractBytecodeEmpty = new Status(84);

/* invalid initial balance */
        Status.InvalidInitialBalance = new Status(85);

/* invalid receive record threshold */
        Status.InvalidReceiveRecordThreshold = new Status(86);

/* invalid send record threshold */
        Status.InvalidSendRecordThreshold = new Status(87);

/* account is not genesis account */
        Status.AccountIsNotGenesisAccount = new Status(88);

/* payer account unauthorized */
        Status.PayerAccountUnauthorized = new Status(89);

/* invalid freeze transaction body */
        Status.InvalidFreezeTransactionBody = new Status(90);

/* freeze transaction body not found */
        Status.FreezeTransactionBodyNotFound = new Status(91);

/* transfer list size limit exceeded */
        Status.TransferListSizeLimitExceeded = new Status(92);

/* result size limit exceeded */
        Status.ResultSizeLimitExceeded = new Status(93);

/* not special account */
        Status.NotSpecialAccount = new Status(94);

/* contract negative gas */
        Status.ContractNegativeGas = new Status(95);

/* contract negative value */
        Status.ContractNegativeValue = new Status(96);

/* invalid fee file */
        Status.InvalidFeeFile = new Status(97);

/* invalid exchange rate file */
        Status.InvalidExchangeRateFile = new Status(98);

/* insufficient local call gas */
        Status.InsufficientLocalCallGas = new Status(99);

/* entity not allowed to delete */
        Status.EntityNotAllowedToDelete = new Status(100);

/* authorization failed */
        Status.AuthorizationFailed = new Status(101);

/* file uploaded proto invalid */
        Status.FileUploadedProtoInvalid = new Status(102);

/* file uploaded proto not saved to disk */
        Status.FileUploadedProtoNotSavedToDisk = new Status(103);

/* fee schedule file part uploaded */
        Status.FeeScheduleFilePartUploaded = new Status(104);

/* exchange rate change limit exceeded */
        Status.ExchangeRateChangeLimitExceeded = new Status(105);

/* max contract storage exceeded */
        Status.MaxContractStorageExceeded = new Status(106);

/* transfer account same as delete account */
        Status.TransferAccountSameAsDeleteAccount = new Status(107);

/* total ledger balance invalid */
        Status.TotalLedgerBalanceInvalid = new Status(108);

/* expiration reduction not allowed */
        Status.ExpirationReductionNotAllowed = new Status(110);

/* max gas limit exceeded */
        Status.MaxGasLimitExceeded = new Status(111);

/* max file size exceeded */
        Status.MaxFileSizeExceeded = new Status(112);

/* receiver sig required */
        Status.ReceiverSigRequired = new Status(113);

/* invalid topic id */
        Status.InvalidTopicId = new Status(150);

/* invalid admin key */
        Status.InvalidAdminKey = new Status(155);

/* invalid submit key */
        Status.InvalidSubmitKey = new Status(156);

/* unauthorized */
        Status.Unauthorized = new Status(157);

/* invalid topic message */
        Status.InvalidTopicMessage = new Status(158);

/* invalid autorenew account */
        Status.InvalidAutorenewAccount = new Status(159);

/* autorenew account not allowed */
        Status.AutorenewAccountNotAllowed = new Status(160);

/* topic expired */
        Status.TopicExpired = new Status(162);

/* invalid chunk number */
        Status.InvalidChunkNumber = new Status(163);

/* invalid chunk transaction id */
        Status.InvalidChunkTransactionId = new Status(164);

/* account frozen for token */
        Status.AccountFrozenForToken = new Status(165);

/* tokens per account limit exceeded */
        Status.TokensPerAccountLimitExceeded = new Status(166);

/* invalid token id */
        Status.InvalidTokenId = new Status(167);

/* invalid token decimals */
        Status.InvalidTokenDecimals = new Status(168);

/* invalid token initial supply */
        Status.InvalidTokenInitialSupply = new Status(169);

/* invalid treasury account for token */
        Status.InvalidTreasuryAccountForToken = new Status(170);

/* invalid token symbol */
        Status.InvalidTokenSymbol = new Status(171);

/* token has no freeze key */
        Status.TokenHasNoFreezeKey = new Status(172);

/* transfers not zero sum for token */
        Status.TransfersNotZeroSumForToken = new Status(173);

/* missing token symbol */
        Status.MissingTokenSymbol = new Status(174);

/* token symbol too long */
        Status.TokenSymbolTooLong = new Status(175);

/* account kyc not granted for token */
        Status.AccountKycNotGrantedForToken = new Status(176);

/* token has no kyc key */
        Status.TokenHasNoKycKey = new Status(177);

/* insufficient token balance */
        Status.InsufficientTokenBalance = new Status(178);

/* token was deleted */
        Status.TokenWasDeleted = new Status(179);

/* token has no supply key */
        Status.TokenHasNoSupplyKey = new Status(180);

/* token has no wipe key */
        Status.TokenHasNoWipeKey = new Status(181);

/* invalid token mint amount */
        Status.InvalidTokenMintAmount = new Status(182);

/* invalid token burn amount */
        Status.InvalidTokenBurnAmount = new Status(183);

/* token not associated to account */
        Status.TokenNotAssociatedToAccount = new Status(184);

/* cannot wipe token treasury account */
        Status.CannotWipeTokenTreasuryAccount = new Status(185);

/* invalid kyc key */
        Status.InvalidKycKey = new Status(186);

/* invalid wipe key */
        Status.InvalidWipeKey = new Status(187);

/* invalid freeze key */
        Status.InvalidFreezeKey = new Status(188);

/* invalid supply key */
        Status.InvalidSupplyKey = new Status(189);

/* missing token name */
        Status.MissingTokenName = new Status(190);

/* token name too long */
        Status.TokenNameTooLong = new Status(191);

/* invalid wiping amount */
        Status.InvalidWipingAmount = new Status(192);

/* token is immutable */
        Status.TokenIsImmutable = new Status(193);

/* token already associated to account */
        Status.TokenAlreadyAssociatedToAccount = new Status(194);

/* transaction requires zero token balances */
        Status.TransactionRequiresZeroTokenBalances = new Status(195);

/* account is treasury */
        Status.AccountIsTreasury = new Status(196);

/* token id repeated in token list */
        Status.TokenIdRepeatedInTokenList = new Status(197);

/* token transfer list size limit exceeded */
        Status.TokenTransferListSizeLimitExceeded = new Status(198);

/* empty token transfer body */
        Status.EmptyTokenTransferBody = new Status(199);

/* empty token transfer account amounts */
        Status.EmptyTokenTransferAccountAmounts = new Status(200);

/* invalid schedule id */
        Status.InvalidScheduleId = new Status(201);

/* schedule is immutable */
        Status.ScheduleIsImmutable = new Status(202);

/* invalid schedule payer id */
        Status.InvalidSchedulePayerId = new Status(203);

/* invalid schedule account id */
        Status.InvalidScheduleAccountId = new Status(204);

/* no new valid signatures */
        Status.NoNewValidSignatures = new Status(205);

/* unresolvable required signers */
        Status.UnresolvableRequiredSigners = new Status(206);

/* scheduled transaction not in whitelist */
        Status.ScheduledTransactionNotInWhitelist = new Status(207);

/* some signatures were invalid */
        Status.SomeSignaturesWereInvalid = new Status(208);

/* transaction id field not allowed */
        Status.TransactionIdFieldNotAllowed = new Status(209);

/* identical schedule already created */
        Status.IdenticalScheduleAlreadyCreated = new Status(210);

/* invalid zero byte in string */
        Status.InvalidZeroByteInString = new Status(211);

/* schedule already deleted */
        Status.ScheduleAlreadyDeleted = new Status(212);

/* schedule already executed */
        Status.ScheduleAlreadyExecuted = new Status(213);

/* message size too large */
        Status.MessageSizeTooLarge = new Status(214);

/* operation repeated in bucket groups */
        Status.OperationRepeatedInBucketGroups = new Status(215);

/* bucket capacity overflow */
        Status.BucketCapacityOverflow = new Status(216);

/* node capacity not sufficient for operation */
        Status.NodeCapacityNotSufficientForOperation = new Status(217);

/* bucket has no throttle groups */
        Status.BucketHasNoThrottleGroups = new Status(218);

/* throttle group has zero ops per sec */
        Status.ThrottleGroupHasZeroOpsPerSec = new Status(219);

/* success but missing expected operation */
        Status.SuccessButMissingExpectedOperation = new Status(220);

/* unparseable throttle definitions */
        Status.UnparseableThrottleDefinitions = new Status(221);

/* invalid throttle definitions */
        Status.InvalidThrottleDefinitions = new Status(222);

/* account expired and pending removal */
        Status.AccountExpiredAndPendingRemoval = new Status(223);

/* invalid token max supply */
        Status.InvalidTokenMaxSupply = new Status(224);

/* invalid token nft serial number */
        Status.InvalidTokenNftSerialNumber = new Status(225);

/* invalid nft id */
        Status.InvalidNftId = new Status(226);

/* metadata too long */
        Status.MetadataTooLong = new Status(227);

/* batch size limit exceeded */
        Status.BatchSizeLimitExceeded = new Status(228);

/* invalid query range */
        Status.InvalidQueryRange = new Status(229);

/* fraction divides by zero */
        Status.FractionDividesByZero = new Status(230);

/* insufficient payer balance for custom fee */
        Status.InsufficientPayerBalanceForCustomFee = new Status(231);

/* custom fees list too long */
        Status.CustomFeesListTooLong = new Status(232);

/* invalid custom fee collector */
        Status.InvalidCustomFeeCollector = new Status(233);

/* invalid token id in custom fees */
        Status.InvalidTokenIdInCustomFees = new Status(234);

/* token not associated to fee collector */
        Status.TokenNotAssociatedToFeeCollector = new Status(235);

/* token max supply reached */
        Status.TokenMaxSupplyReached = new Status(236);

/* sender does not own nft serial no */
        Status.SenderDoesNotOwnNftSerialNo = new Status(237);

/* custom fee not fully specified */
        Status.CustomFeeNotFullySpecified = new Status(238);

/* custom fee must be positive */
        Status.CustomFeeMustBePositive = new Status(239);

/* token has no fee schedule key */
        Status.TokenHasNoFeeScheduleKey = new Status(240);

/* custom fee outside numeric range */
        Status.CustomFeeOutsideNumericRange = new Status(241);

/* royalty fraction cannot exceed one */
        Status.RoyaltyFractionCannotExceedOne = new Status(242);

/* fractional fee max amount less than min amount */
        Status.FractionalFeeMaxAmountLessThanMinAmount = new Status(243);

/* custom schedule already has no fees */
        Status.CustomScheduleAlreadyHasNoFees = new Status(244);

/* custom fee denomination must be fungible common */
        Status.CustomFeeDenominationMustBeFungibleCommon = new Status(245);

/* custom fractional fee only allowed for fungible common */
        Status.CustomFractionalFeeOnlyAllowedForFungibleCommon = new Status(246);

/* invalid custom fee schedule key */
        Status.InvalidCustomFeeScheduleKey = new Status(247);

/* invalid token mint metadata */
        Status.InvalidTokenMintMetadata = new Status(248);

/* invalid token burn metadata */
        Status.InvalidTokenBurnMetadata = new Status(249);

/* current treasury still owns nfts */
        Status.CurrentTreasuryStillOwnsNfts = new Status(250);

/* account still owns nfts */
        Status.AccountStillOwnsNfts = new Status(251);

/* treasury must own burned nft */
        Status.TreasuryMustOwnBurnedNft = new Status(252);

/* account does not own wiped nft */
        Status.AccountDoesNotOwnWipedNft = new Status(253);

/* account amount transfers only allowed for fungible common */
        Status.AccountAmountTransfersOnlyAllowedForFungibleCommon = new Status(254);

/* max nfts in price regime have been minted */
        Status.MaxNftsInPriceRegimeHaveBeenMinted = new Status(255);

/* payer account deleted */
        Status.PayerAccountDeleted = new Status(256);

/* custom fee charging exceeded max recursion depth */
        Status.CustomFeeChargingExceededMaxRecursionDepth = new Status(257);

/* custom fee charging exceeded max account amounts */
        Status.CustomFeeChargingExceededMaxAccountAmounts = new Status(258);

/* insufficient sender account balance for custom fee */
        Status.InsufficientSenderAccountBalanceForCustomFee = new Status(259);

/* serial number limit reached */
        Status.SerialNumberLimitReached = new Status(260);

/* custom royalty fee only allowed for non fungible unique */
        Status.CustomRoyaltyFeeOnlyAllowedForNonFungibleUnique = new Status(261);

/* no remaining automatic associations */
        Status.NoRemainingAutomaticAssociations = new Status(262);

/* existing automatic associations exceed given limit */
        Status.ExistingAutomaticAssociationsExceedGivenLimit = new Status(263);

/* requested num automatic associations exceeds association limit */
        Status.RequestedNumAutomaticAssociationsExceedsAssociationLimit = new Status(264);

/* token is paused */
        Status.TokenIsPaused = new Status(265);

/* token has no pause key */
        Status.TokenHasNoPauseKey = new Status(266);

/* invalid pause key */
        Status.InvalidPauseKey = new Status(267);

/* freeze update file does not exist */
        Status.FreezeUpdateFileDoesNotExist = new Status(268);

/* freeze update file hash does not match */
        Status.FreezeUpdateFileHashDoesNotMatch = new Status(269);

/* no upgrade has been prepared */
        Status.NoUpgradeHasBeenPrepared = new Status(270);

/* no freeze is scheduled */
        Status.NoFreezeIsScheduled = new Status(271);

/* update file hash changed since prepare upgrade */
        Status.UpdateFileHashChangedSincePrepareUpgrade = new Status(272);

/* freeze start time must be future */
        Status.FreezeStartTimeMustBeFuture = new Status(273);

/* prepared update file is immutable */
        Status.PreparedUpdateFileIsImmutable = new Status(274);

/* freeze already scheduled */
        Status.FreezeAlreadyScheduled = new Status(275);

/* freeze upgrade in progress */
        Status.FreezeUpgradeInProgress = new Status(276);

/* update file id does not match prepared */
        Status.UpdateFileIdDoesNotMatchPrepared = new Status(277);

/* update file hash does not match prepared */
        Status.UpdateFileHashDoesNotMatchPrepared = new Status(278);

/* consensus gas exhausted */
        Status.ConsensusGasExhausted = new Status(279);

/* reverted success */
        Status.RevertedSuccess = new Status(280);

/* max storage in price regime has been used */
        Status.MaxStorageInPriceRegimeHasBeenUsed = new Status(281);

/* invalid alias key */
        Status.InvalidAliasKey = new Status(282);

/* unexpected token decimals */
        Status.UnexpectedTokenDecimals = new Status(283);

/* invalid proxy account id */
        Status.InvalidProxyAccountId = new Status(284);

/* invalid transfer account id */
        Status.InvalidTransferAccountId = new Status(285);

/* invalid fee collector account id */
        Status.InvalidFeeCollectorAccountId = new Status(286);

/* alias is immutable */
        Status.AliasIsImmutable = new Status(287);

/* spender account same as owner */
        Status.SpenderAccountSameAsOwner = new Status(288);

/* amount exceeds token max supply */
        Status.AmountExceedsTokenMaxSupply = new Status(289);

/* negative allowance amount */
        Status.NegativeAllowanceAmount = new Status(290);

/* cannot approve for all fungible common */
        Status.CannotApproveForAllFungibleCommon = new Status(291);

/* spender does not have allowance */
        Status.SpenderDoesNotHaveAllowance = new Status(292);

/* amount exceeds allowance */
        Status.AmountExceedsAllowance = new Status(293);

/* max allowances exceeded */
        Status.MaxAllowancesExceeded = new Status(294);

/* empty allowances */
        Status.EmptyAllowances = new Status(295);

/* spender account repeated in allowances */
        Status.SpenderAccountRepeatedInAllowances = new Status(296);

/* repeated serial nums in nft allowances */
        Status.RepeatedSerialNumsInNftAllowances = new Status(297);

/* fungible token in nft allowances */
        Status.FungibleTokenInNftAllowances = new Status(298);

/* nft in fungible token allowances */
        Status.NftInFungibleTokenAllowances = new Status(299);

/* invalid allowance owner id */
        Status.InvalidAllowanceOwnerId = new Status(300);

/* invalid allowance spender id */
        Status.InvalidAllowanceSpenderId = new Status(301);

/* repeated allowances to delete */
        Status.RepeatedAllowancesToDelete = new Status(302);

/* invalid delegating spender */
        Status.InvalidDelegatingSpender = new Status(303);

/* delegating spender cannot grant approve for all */
        Status.DelegatingSpenderCannotGrantApproveForAll = new Status(304);

/* delegating spender does not have approve for all */
        Status.DelegatingSpenderDoesNotHaveApproveForAll = new Status(305);

/* schedule expiration time too far in future */
        Status.ScheduleExpirationTimeTooFarInFuture = new Status(306);

/* schedule expiration time must be higher than consensus time */
        Status.ScheduleExpirationTimeMustBeHigherThanConsensusTime = new Status(307);

/* schedule future throttle exceeded */
        Status.ScheduleFutureThrottleExceeded = new Status(308);

/* schedule future gas limit exceeded */
        Status.ScheduleFutureGasLimitExceeded = new Status(309);

/* invalid ethereum transaction */
        Status.InvalidEthereumTransaction = new Status(310);

/* wrong chain id */
        Status.WrongChainId = new Status(311);

/* wrong nonce */
        Status.WrongNonce = new Status(312);

/* access list unsupported */
        Status.AccessListUnsupported = new Status(313);

/* schedule pending expiration */
        Status.SchedulePendingExpiration = new Status(314);

/* contract is token treasury */
        Status.ContractIsTokenTreasury = new Status(315);

/* contract has non zero token balances */
        Status.ContractHasNonZeroTokenBalances = new Status(316);

/* contract expired and pending removal */
        Status.ContractExpiredAndPendingRemoval = new Status(317);

/* contract has no auto renew account */
        Status.ContractHasNoAutoRenewAccount = new Status(318);

/* permanent removal requires system initiation */
        Status.PermanentRemovalRequiresSystemInitiation = new Status(319);

/* proxy account id field is deprecated */
        Status.ProxyAccountIdFieldIsDeprecated = new Status(320);

/* self staking is not allowed */
        Status.SelfStakingIsNotAllowed = new Status(321);

/* invalid staking id */
        Status.InvalidStakingId = new Status(322);

/* staking not enabled */
        Status.StakingNotEnabled = new Status(323);

/* invalid prng range */
        Status.InvalidPrngRange = new Status(324);

/* max entities in price regime have been created */
        Status.MaxEntitiesInPriceRegimeHaveBeenCreated = new Status(325);

/* invalid full prefix signature for precompile */
        Status.InvalidFullPrefixSignatureForPrecompile = new Status(326);

/* insufficient balances for storage rent */
        Status.InsufficientBalancesForStorageRent = new Status(327);

/* max child records exceeded */
        Status.MaxChildRecordsExceeded = new Status(328);

/* insufficient balances for renewal fees */
        Status.InsufficientBalancesForRenewalFees = new Status(329);

/* transaction has unknown fields */
        Status.TransactionHasUnknownFields = new Status(330);

/* account is immutable */
        Status.AccountIsImmutable = new Status(331);

/* alias already assigned */
        Status.AliasAlreadyAssigned = new Status(332);

/* invalid metadata key */
        Status.InvalidMetadataKey = new Status(333);

/* token has no metadata key */
        Status.TokenHasNoMetadataKey = new Status(334);

/* missing token metadata */
        Status.MissingTokenMetadata = new Status(335);

/* missing serial numbers */
        Status.MissingSerialNumbers = new Status(336);

/* token has no admin key */
        Status.TokenHasNoAdminKey = new Status(337);

/* node deleted */
        Status.NodeDeleted = new Status(338);

/* invalid node id */
        Status.InvalidNodeId = new Status(339);

/* invalid gossip endpoint */
        Status.InvalidGossipEndpoint = new Status(340);

/* invalid node account id */
        Status.InvalidNodeAccountId = new Status(341);

/* invalid node description */
        Status.InvalidNodeDescription = new Status(342);

/* invalid service endpoint */
        Status.InvalidServiceEndpoint = new Status(343);

/* invalid gossip ca certificate */
        Status.InvalidGossipCaCertificate = new Status(344);

/* invalid grpc certificate */
        Status.InvalidGrpcCertificate = new Status(345);

/* invalid max auto associations */
        Status.InvalidMaxAutoAssociations = new Status(346);

/* max nodes created */
        Status.MaxNodesCreated = new Status(347);

/* ip fqdn cannot be set for same endpoint */
        Status.IpFqdnCannotBeSetForSameEndpoint = new Status(348);

/* gossip endpoint cannot have fqdn */
        Status.GossipEndpointCannotHaveFqdn = new Status(349);

/* fqdn size too large */
        Status.FqdnSizeTooLarge = new Status(350);

/* invalid endpoint */
        Status.InvalidEndpoint = new Status(351);

/* gossip endpoints exceeded limit */
        Status.GossipEndpointsExceededLimit = new Status(352);

/* token reference repeated */
        Status.TokenReferenceRepeated = new Status(353);

/* invalid owner id */
        Status.InvalidOwnerId = new Status(354);

/* token reference list size limit exceeded */
        Status.TokenReferenceListSizeLimitExceeded = new Status(355);

/* service endpoints exceeded limit */
        Status.ServiceEndpointsExceededLimit = new Status(356);

/* invalid ipv4 address */
        Status.InvalidIpv4Address = new Status(357);

/* empty token reference list */
        Status.EmptyTokenReferenceList = new Status(358);

/* update node account not allowed */
        Status.UpdateNodeAccountNotAllowed = new Status(359);

/* token has no metadata or supply key */
        Status.TokenHasNoMetadataOrSupplyKey = new Status(360);

/* empty pending airdrop id list */
        Status.EmptyPendingAirdropIdList = new Status(361);

/* pending airdrop id repeated */
        Status.PendingAirdropIdRepeated = new Status(362);

/* pending airdrop id list too long */
        Status.PendingAirdropIdListTooLong = new Status(363);

/* pending nft airdrop already exists */
        Status.PendingNftAirdropAlreadyExists = new Status(364);

/* account has pending airdrops */
        Status.AccountHasPendingAirdrops = new Status(365);

/* throttled at consensus */
        Status.ThrottledAtConsensus = new Status(366);

/* invalid pending airdrop id */
        Status.InvalidPendingAirdropId = new Status(367);

/* token airdrop with fallback royalty */
        Status.TokenAirdropWithFallbackRoyalty = new Status(368);

/* invalid token in pending airdrop */
        Status.InvalidTokenInPendingAirdrop = new Status(369);

/* schedule expiry is busy */
        Status.ScheduleExpiryIsBusy = new Status(370);

/* invalid grpc certificate hash */
        Status.InvalidGrpcCertificateHash = new Status(371);

/* missing expiry time */
        Status.MissingExpiryTime = new Status(372);

/* no scheduling allowed after scheduled recursion */
        Status.NoSchedulingAllowedAfterScheduledRecursion = new Status(373);

/* recursive scheduling limit reached */
        Status.RecursiveSchedulingLimitReached = new Status(374);

/* waiting for ledger id */
        Status.WaitingForLedgerId = new Status(375);

/* max entries for fee exempt key list exceeded */
        Status.MaxEntriesForFeeExemptKeyListExceeded = new Status(376);

/* fee exempt key list contains duplicated keys */
        Status.FeeExemptKeyListContainsDuplicatedKeys = new Status(377);

/* invalid key in fee exempt key list */
        Status.InvalidKeyInFeeExemptKeyList = new Status(378);

/* invalid fee schedule key */
        Status.InvalidFeeScheduleKey = new Status(379);

/* fee schedule key cannot be updated */
        Status.FeeScheduleKeyCannotBeUpdated = new Status(380);

/* fee schedule key not set */
        Status.FeeScheduleKeyNotSet = new Status(381);

/* max custom fee limit exceeded */
        Status.MaxCustomFeeLimitExceeded = new Status(382);

/* no valid max custom fee */
        Status.NoValidMaxCustomFee = new Status(383);

/* invalid max custom fees */
        Status.InvalidMaxCustomFees = new Status(384);

/* duplicate denomination in max custom fee list */
        Status.DuplicateDenominationInMaxCustomFeeList = new Status(385);

/* duplicate account id in max custom fee list */
        Status.DuplicateAccountIdInMaxCustomFeeList = new Status(386);

/* max custom fees is not supported */
        Status.MaxCustomFeesIsNotSupported = new Status(387);

