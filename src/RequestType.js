/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").HederaFunctionality} proto.HederaFunctionality
 */

export default class RequestType {
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
            case RequestType.None:
                return "NONE";
            case RequestType.CryptoTransfer:
                return "CRYPTO_TRANSFER";
            case RequestType.CryptoUpdate:
                return "CRYPTO_UPDATE";
            case RequestType.CryptoDelete:
                return "CRYPTO_DELETE";
            case RequestType.CryptoAddLiveHash:
                return "CRYPTO_ADD_LIVE_HASH";
            case RequestType.CryptoDeleteLiveHash:
                return "CRYPTO_DELETE_LIVE_HASH";
            case RequestType.ContractCall:
                return "CONTRACT_CALL";
            case RequestType.ContractCreate:
                return "CONTRACT_CREATE";
            case RequestType.ContractUpdate:
                return "CONTRACT_UPDATE";
            case RequestType.FileCreate:
                return "FILE_CREATE";
            case RequestType.FileAppend:
                return "FILE_APPEND";
            case RequestType.FileUpdate:
                return "FILE_UPDATE";
            case RequestType.FileDelete:
                return "FILE_DELETE";
            case RequestType.CryptoGetAccountBalance:
                return "CRYPTO_GET_ACCOUNT_BALANCE";
            case RequestType.CryptoGetAccountRecords:
                return "CRYPTO_GET_ACCOUNT_RECORDS";
            case RequestType.CryptoGetInfo:
                return "CRYPTO_GET_INFO";
            case RequestType.ContractCallLocal:
                return "CONTRACT_CALL_LOCAL";
            case RequestType.ContractGetInfo:
                return "CONTRACT_GET_INFO";
            case RequestType.ContractGetBytecode:
                return "CONTRACT_GET_BYTECODE";
            case RequestType.GetBySolidityID:
                return "GET_BY_SOLIDITY_ID";
            case RequestType.GetByKey:
                return "GET_BY_KEY";
            case RequestType.CryptoGetLiveHash:
                return "CRYPTO_GET_LIVE_HASH";
            case RequestType.CryptoGetStakers:
                return "CRYPTO_GET_STAKERS";
            case RequestType.FileGetContents:
                return "FILE_GET_CONTENTS";
            case RequestType.FileGetInfo:
                return "FILE_GET_INFO";
            case RequestType.TransactionGetRecord:
                return "TRANSACTION_GET_RECORD";
            case RequestType.ContractGetRecords:
                return "CONTRACT_GET_RECORDS";
            case RequestType.CryptoCreate:
                return "CRYPTO_CREATE";
            case RequestType.SystemDelete:
                return "SYSTEM_DELETE";
            case RequestType.SystemUndelete:
                return "SYSTEM_UNDELETE";
            case RequestType.ContractDelete:
                return "CONTRACT_DELETE";
            case RequestType.Freeze:
                return "FREEZE";
            case RequestType.CreateTransactionRecord:
                return "CREATE_TRANSACTION_RECORD";
            case RequestType.CryptoAccountAutoRenew:
                return "CRYPTO_ACCOUNT_AUTO_RENEW";
            case RequestType.ContractAutoRenew:
                return "CONTRACT_AUTO_RENEW";
            case RequestType.GetVersionInfo:
                return "GET_VERSION_INFO";
            case RequestType.TransactionGetReceipt:
                return "TRANSACTION_GET_RECEIPT";
            case RequestType.ConsensusCreateTopic:
                return "CONSENSUS_CREATE_TOPIC";
            case RequestType.ConsensusUpdateTopic:
                return "CONSENSUS_UPDATE_TOPIC";
            case RequestType.ConsensusDeleteTopic:
                return "CONSENSUS_DELETE_TOPIC";
            case RequestType.ConsensusGetTopicInfo:
                return "CONSENSUS_GET_TOPIC_INFO";
            case RequestType.ConsensusSubmitMessage:
                return "CONSENSUS_SUBMIT_MESSAGE";
            case RequestType.UncheckedSubmit:
                return "UNCHECKED_SUBMIT";
            case RequestType.TokenCreate:
                return "TOKEN_CREATE";
            case RequestType.TokenGetInfo:
                return "TOKEN_GET_INFO";
            case RequestType.TokenFreezeAccount:
                return "TOKEN_FREEZE_ACCOUNT";
            case RequestType.TokenUnfreezeAccount:
                return "TOKEN_UNFREEZE_ACCOUNT";
            case RequestType.TokenGrantKycToAccount:
                return "TOKEN_GRANT_KYC_TO_ACCOUNT";
            case RequestType.TokenRevokeKycFromAccount:
                return "TOKEN_REVOKE_KYC_FROM_ACCOUNT";
            case RequestType.TokenDelete:
                return "TOKEN_DELETE";
            case RequestType.TokenUpdate:
                return "TOKEN_UPDATE";
            case RequestType.TokenMint:
                return "TOKEN_MINT";
            case RequestType.TokenBurn:
                return "TOKEN_BURN";
            case RequestType.TokenAccountWipe:
                return "TOKEN_ACCOUNT_WIPE";
            case RequestType.TokenAssociateToAccount:
                return "TOKEN_ASSOCIATE_TO_ACCOUNT";
            case RequestType.TokenDissociateFromAccount:
                return "TOKEN_DISSOCIATE_FROM_ACCOUNT";
            case RequestType.ScheduleCreate:
                return "SCHEDULE_CREATE";
            case RequestType.ScheduleDelete:
                return "SCHEDULE_DELETE";
            case RequestType.ScheduleSign:
                return "SCHEDULE_SIGN";
            case RequestType.ScheduleGetInfo:
                return "SCHEDULE_GET_INFO";
            case RequestType.TokenPause:
                return "TOKEN_PAUSE";
            case RequestType.TokenUnpause:
                return "TOKEN_UNPAUSE";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {RequestType}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return RequestType.None;
            case 1:
                return RequestType.CryptoTransfer;
            case 2:
                return RequestType.CryptoUpdate;
            case 3:
                return RequestType.CryptoDelete;
            case 4:
                return RequestType.CryptoAddLiveHash;
            case 5:
                return RequestType.CryptoDeleteLiveHash;
            case 6:
                return RequestType.ContractCall;
            case 7:
                return RequestType.ContractCreate;
            case 8:
                return RequestType.ContractUpdate;
            case 9:
                return RequestType.FileCreate;
            case 10:
                return RequestType.FileAppend;
            case 11:
                return RequestType.FileUpdate;
            case 12:
                return RequestType.FileDelete;
            case 13:
                return RequestType.CryptoGetAccountBalance;
            case 14:
                return RequestType.CryptoGetAccountRecords;
            case 15:
                return RequestType.CryptoGetInfo;
            case 16:
                return RequestType.ContractCallLocal;
            case 17:
                return RequestType.ContractGetInfo;
            case 18:
                return RequestType.ContractGetBytecode;
            case 19:
                return RequestType.GetBySolidityID;
            case 20:
                return RequestType.GetByKey;
            case 21:
                return RequestType.CryptoGetLiveHash;
            case 22:
                return RequestType.CryptoGetStakers;
            case 23:
                return RequestType.FileGetContents;
            case 24:
                return RequestType.FileGetInfo;
            case 25:
                return RequestType.TransactionGetRecord;
            case 26:
                return RequestType.ContractGetRecords;
            case 27:
                return RequestType.CryptoCreate;
            case 28:
                return RequestType.SystemDelete;
            case 29:
                return RequestType.SystemUndelete;
            case 30:
                return RequestType.ContractDelete;
            case 31:
                return RequestType.Freeze;
            case 32:
                return RequestType.CreateTransactionRecord;
            case 33:
                return RequestType.CryptoAccountAutoRenew;
            case 34:
                return RequestType.ContractAutoRenew;
            case 35:
                return RequestType.GetVersionInfo;
            case 36:
                return RequestType.TransactionGetReceipt;
            case 50:
                return RequestType.ConsensusCreateTopic;
            case 51:
                return RequestType.ConsensusUpdateTopic;
            case 52:
                return RequestType.ConsensusDeleteTopic;
            case 53:
                return RequestType.ConsensusGetTopicInfo;
            case 54:
                return RequestType.ConsensusSubmitMessage;
            case 55:
                return RequestType.UncheckedSubmit;
            case 56:
                return RequestType.TokenCreate;
            case 58:
                return RequestType.TokenGetInfo;
            case 59:
                return RequestType.TokenFreezeAccount;
            case 60:
                return RequestType.TokenUnfreezeAccount;
            case 61:
                return RequestType.TokenGrantKycToAccount;
            case 62:
                return RequestType.TokenRevokeKycFromAccount;
            case 63:
                return RequestType.TokenDelete;
            case 64:
                return RequestType.TokenUpdate;
            case 65:
                return RequestType.TokenMint;
            case 66:
                return RequestType.TokenBurn;
            case 67:
                return RequestType.TokenAccountWipe;
            case 68:
                return RequestType.TokenAssociateToAccount;
            case 69:
                return RequestType.TokenDissociateFromAccount;
            case 70:
                return RequestType.ScheduleCreate;
            case 71:
                return RequestType.ScheduleDelete;
            case 72:
                return RequestType.ScheduleSign;
            case 73:
                return RequestType.ScheduleGetInfo;
            case 79:
                return RequestType.TokenPause;
            case 80:
                return RequestType.TokenUnpause;
        }

        throw new Error(
            `(BUG) RequestType.fromCode() does not handle code: ${code}`
        );
    }

    /**
     * @returns {proto.HederaFunctionality}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * UNSPECIFIED - RESERVED
 */
RequestType.None = new RequestType(0);

/**
 * Crypto transfer
 */
RequestType.CryptoTransfer = new RequestType(1);

/**
 * Crypto update account
 */
RequestType.CryptoUpdate = new RequestType(2);

/**
 * Crypto delete account
 */
RequestType.CryptoDelete = new RequestType(3);

/**
 * Add a livehash to a crypto account
 */
RequestType.CryptoAddLiveHash = new RequestType(4);

/**
 * Delete a livehash from a crypto account
 */
RequestType.CryptoDeleteLiveHash = new RequestType(5);

/**
 * Smart Contract Call
 */
RequestType.ContractCall = new RequestType(6);

/**
 * Smart Contract Create Contract
 */
RequestType.ContractCreate = new RequestType(7);

/**
 * Smart Contract update contract
 */
RequestType.ContractUpdate = new RequestType(8);

/**
 * File Operation create file
 */
RequestType.FileCreate = new RequestType(9);

/**
 * File Operation append file
 */
RequestType.FileAppend = new RequestType(10);

/**
 * File Operation update file
 */
RequestType.FileUpdate = new RequestType(11);

/**
 * File Operation delete file
 */
RequestType.FileDelete = new RequestType(12);

/**
 * Crypto get account balance
 */
RequestType.CryptoGetAccountBalance = new RequestType(13);

/**
 * Crypto get account record
 */
RequestType.CryptoGetAccountRecords = new RequestType(14);

/**
 * Crypto get info
 */
RequestType.CryptoGetInfo = new RequestType(15);

/**
 * Smart Contract Call
 */
RequestType.ContractCallLocal = new RequestType(16);

/**
 * Smart Contract get info
 */
RequestType.ContractGetInfo = new RequestType(17);

/**
 * Smart Contract, get the byte code
 */
RequestType.ContractGetBytecode = new RequestType(18);

/**
 * Smart Contract, get by solidity ID
 */
RequestType.GetBySolidityID = new RequestType(19);

/**
 * Smart Contract, get by key
 */
RequestType.GetByKey = new RequestType(20);

/**
 * Get a live hash from a crypto account
 */
RequestType.CryptoGetLiveHash = new RequestType(21);

/**
 * Crypto, get the stakers for the node
 */
RequestType.CryptoGetStakers = new RequestType(22);

/**
 * File Operations get file contents
 */
RequestType.FileGetContents = new RequestType(23);

/**
 * File Operations get the info of the file
 */
RequestType.FileGetInfo = new RequestType(24);

/**
 * Crypto get the transaction records
 */
RequestType.TransactionGetRecord = new RequestType(25);

/**
 * Contract get the transaction records
 */
RequestType.ContractGetRecords = new RequestType(26);

/**
 * Crypto create account
 */
RequestType.CryptoCreate = new RequestType(27);

/**
 * System delete file
 */
RequestType.SystemDelete = new RequestType(28);

/**
 * System undelete file
 */
RequestType.SystemUndelete = new RequestType(29);

/**
 * Delete contract
 */
RequestType.ContractDelete = new RequestType(30);

/**
 * Freeze
 */
RequestType.Freeze = new RequestType(31);

/**
 * Create Tx Record
 */
RequestType.CreateTransactionRecord = new RequestType(32);

/**
 * Crypto Auto Renew
 */
RequestType.CryptoAccountAutoRenew = new RequestType(33);

/**
 * Contract Auto Renew
 */
RequestType.ContractAutoRenew = new RequestType(34);

/**
 * Get Version
 */
RequestType.GetVersionInfo = new RequestType(35);

/**
 * Transaction Get Receipt
 */
RequestType.TransactionGetReceipt = new RequestType(36);

/**
 * Create Topic
 */
RequestType.ConsensusCreateTopic = new RequestType(50);

/**
 * Update Topic
 */
RequestType.ConsensusUpdateTopic = new RequestType(51);

/**
 * Delete Topic
 */
RequestType.ConsensusDeleteTopic = new RequestType(52);

/**
 * Get Topic information
 */
RequestType.ConsensusGetTopicInfo = new RequestType(53);

/**
 * Submit message to topic
 */
RequestType.ConsensusSubmitMessage = new RequestType(54);

/**
 *
 */
RequestType.UncheckedSubmit = new RequestType(55);

/**
 * Create Token
 */
RequestType.TokenCreate = new RequestType(56);

/**
 * Get Token information
 */
RequestType.TokenGetInfo = new RequestType(58);

/**
 * Freeze Account
 */
RequestType.TokenFreezeAccount = new RequestType(59);

/**
 * Unfreeze Account
 */
RequestType.TokenUnfreezeAccount = new RequestType(60);

/**
 * Grant KYC to Account
 */
RequestType.TokenGrantKycToAccount = new RequestType(61);

/**
 * Revoke KYC from Account
 */
RequestType.TokenRevokeKycFromAccount = new RequestType(62);

/**
 * Delete Token
 */
RequestType.TokenDelete = new RequestType(63);

/**
 * Update Token
 */
RequestType.TokenUpdate = new RequestType(64);

/**
 * Mint tokens to treasury
 */
RequestType.TokenMint = new RequestType(65);

/**
 * Burn tokens from treasury
 */
RequestType.TokenBurn = new RequestType(66);

/**
 * Wipe token amount from Account holder
 */
RequestType.TokenAccountWipe = new RequestType(67);

/**
 * Associate tokens to an account
 */
RequestType.TokenAssociateToAccount = new RequestType(68);

/**
 * Dissociate tokens from an account
 */
RequestType.TokenDissociateFromAccount = new RequestType(69);

/**
 * Create Scheduled Transaction
 */
RequestType.ScheduleCreate = new RequestType(70);

/**
 * Delete Scheduled Transaction
 */
RequestType.ScheduleDelete = new RequestType(71);

/**
 * Sign Scheduled Transaction
 */
RequestType.ScheduleSign = new RequestType(72);

/**
 * Get Scheduled Transaction Information
 */
RequestType.ScheduleGetInfo = new RequestType(73);

/**
 * Pause the Token
 */
RequestType.TokenPause = new RequestType(79);

/**
 * Unpause the Token
 */
RequestType.TokenUnpause = new RequestType(80);
