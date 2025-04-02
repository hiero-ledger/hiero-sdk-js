// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.HederaFunctionality} HieroProto.proto.HederaFunctionality
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
            case RequestType.NONE:
                return "NONE";
            case RequestType.CryptoTransfer:
                return "CryptoTransfer";
            case RequestType.CryptoUpdate:
                return "CryptoUpdate";
            case RequestType.CryptoDelete:
                return "CryptoDelete";
            case RequestType.CryptoAddLiveHash:
                return "CryptoAddLiveHash";
            case RequestType.CryptoDeleteLiveHash:
                return "CryptoDeleteLiveHash";
            case RequestType.ContractCall:
                return "ContractCall";
            case RequestType.ContractCreate:
                return "ContractCreate";
            case RequestType.ContractUpdate:
                return "ContractUpdate";
            case RequestType.FileCreate:
                return "FileCreate";
            case RequestType.FileAppend:
                return "FileAppend";
            case RequestType.FileUpdate:
                return "FileUpdate";
            case RequestType.FileDelete:
                return "FileDelete";
            case RequestType.CryptoGetAccountBalance:
                return "CryptoGetAccountBalance";
            case RequestType.CryptoGetAccountRecords:
                return "CryptoGetAccountRecords";
            case RequestType.CryptoGetInfo:
                return "CryptoGetInfo";
            case RequestType.ContractCallLocal:
                return "ContractCallLocal";
            case RequestType.ContractGetInfo:
                return "ContractGetInfo";
            case RequestType.ContractGetBytecode:
                return "ContractGetBytecode";
            case RequestType.GetBySolidityID:
                return "GetBySolidityID";
            case RequestType.GetByKey:
                return "GetByKey";
            case RequestType.CryptoGetLiveHash:
                return "CryptoGetLiveHash";
            case RequestType.CryptoGetStakers:
                return "CryptoGetStakers";
            case RequestType.FileGetContents:
                return "FileGetContents";
            case RequestType.FileGetInfo:
                return "FileGetInfo";
            case RequestType.TransactionGetRecord:
                return "TransactionGetRecord";
            case RequestType.ContractGetRecords:
                return "ContractGetRecords";
            case RequestType.CryptoCreate:
                return "CryptoCreate";
            case RequestType.SystemDelete:
                return "SystemDelete";
            case RequestType.SystemUndelete:
                return "SystemUndelete";
            case RequestType.ContractDelete:
                return "ContractDelete";
            case RequestType.Freeze:
                return "Freeze";
            case RequestType.CreateTransactionRecord:
                return "CreateTransactionRecord";
            case RequestType.CryptoAccountAutoRenew:
                return "CryptoAccountAutoRenew";
            case RequestType.ContractAutoRenew:
                return "ContractAutoRenew";
            case RequestType.GetVersionInfo:
                return "GetVersionInfo";
            case RequestType.TransactionGetReceipt:
                return "TransactionGetReceipt";
            case RequestType.ConsensusCreateTopic:
                return "ConsensusCreateTopic";
            case RequestType.ConsensusUpdateTopic:
                return "ConsensusUpdateTopic";
            case RequestType.ConsensusDeleteTopic:
                return "ConsensusDeleteTopic";
            case RequestType.ConsensusGetTopicInfo:
                return "ConsensusGetTopicInfo";
            case RequestType.ConsensusSubmitMessage:
                return "ConsensusSubmitMessage";
            case RequestType.UncheckedSubmit:
                return "UncheckedSubmit";
            case RequestType.TokenCreate:
                return "TokenCreate";
            case RequestType.TokenGetInfo:
                return "TokenGetInfo";
            case RequestType.TokenFreezeAccount:
                return "TokenFreezeAccount";
            case RequestType.TokenUnfreezeAccount:
                return "TokenUnfreezeAccount";
            case RequestType.TokenGrantKycToAccount:
                return "TokenGrantKycToAccount";
            case RequestType.TokenRevokeKycFromAccount:
                return "TokenRevokeKycFromAccount";
            case RequestType.TokenDelete:
                return "TokenDelete";
            case RequestType.TokenUpdate:
                return "TokenUpdate";
            case RequestType.TokenMint:
                return "TokenMint";
            case RequestType.TokenBurn:
                return "TokenBurn";
            case RequestType.TokenAccountWipe:
                return "TokenAccountWipe";
            case RequestType.TokenAssociateToAccount:
                return "TokenAssociateToAccount";
            case RequestType.TokenDissociateFromAccount:
                return "TokenDissociateFromAccount";
            case RequestType.ScheduleCreate:
                return "ScheduleCreate";
            case RequestType.ScheduleDelete:
                return "ScheduleDelete";
            case RequestType.ScheduleSign:
                return "ScheduleSign";
            case RequestType.ScheduleGetInfo:
                return "ScheduleGetInfo";
            case RequestType.TokenGetAccountNftInfos:
                return "TokenGetAccountNftInfos";
            case RequestType.TokenGetNftInfo:
                return "TokenGetNftInfo";
            case RequestType.TokenGetNftInfos:
                return "TokenGetNftInfos";
            case RequestType.TokenFeeScheduleUpdate:
                return "TokenFeeScheduleUpdate";
            case RequestType.NetworkGetExecutionTime:
                return "NetworkGetExecutionTime";
            case RequestType.TokenPause:
                return "TokenPause";
            case RequestType.TokenUnpause:
                return "TokenUnpause";
            case RequestType.CryptoApproveAllowance:
                return "CryptoApproveAllowance";
            case RequestType.CryptoDeleteAllowance:
                return "CryptoDeleteAllowance";
            case RequestType.GetAccountDetails:
                return "GetAccountDetails";
            case RequestType.EthereumTransaction:
                return "EthereumTransaction";
            case RequestType.NodeStakeUpdate:
                return "NodeStakeUpdate";
            case RequestType.UtilPrng:
                return "UtilPrng";
            case RequestType.TransactionGetFastRecord:
                return "TransactionGetFastRecord";
            case RequestType.TokenUpdateNfts:
                return "TokenUpdateNfts";
            case RequestType.NodeCreate:
                return "NodeCreate";
            case RequestType.NodeUpdate:
                return "NodeUpdate";
            case RequestType.NodeDelete:
                return "NodeDelete";
            case RequestType.TokenReject:
                return "TokenReject";
            case RequestType.TokenAirdrop:
                return "TokenAirdrop";
            case RequestType.TokenCancelAirdrop:
                return "TokenCancelAirdrop";
            case RequestType.TokenClaimAirdrop:
                return "TokenClaimAirdrop";
            case RequestType.StateSignatureTransaction:
                return "StateSignatureTransaction";
            case RequestType.HistoryAssemblySignature:
                return "HistoryAssemblySignature";
            case RequestType.HistoryProofKeyPublication:
                return "HistoryProofKeyPublication";
            case RequestType.HistoryProofVote:
                return "HistoryProofVote";
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
                return RequestType.NONE;
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
            case 74:
                return RequestType.TokenGetAccountNftInfos;
            case 75:
                return RequestType.TokenGetNftInfo;
            case 76:
                return RequestType.TokenGetNftInfos;
            case 77:
                return RequestType.TokenFeeScheduleUpdate;
            case 78:
                return RequestType.NetworkGetExecutionTime;
            case 79:
                return RequestType.TokenPause;
            case 80:
                return RequestType.TokenUnpause;
            case 81:
                return RequestType.CryptoApproveAllowance;
            case 82:
                return RequestType.CryptoDeleteAllowance;
            case 83:
                return RequestType.GetAccountDetails;
            case 84:
                return RequestType.EthereumTransaction;
            case 85:
                return RequestType.NodeStakeUpdate;
            case 86:
                return RequestType.UtilPrng;
            case 87:
                return RequestType.TransactionGetFastRecord;
            case 88:
                return RequestType.TokenUpdateNfts;
            case 89:
                return RequestType.NodeCreate;
            case 90:
                return RequestType.NodeUpdate;
            case 91:
                return RequestType.NodeDelete;
            case 92:
                return RequestType.TokenReject;
            case 93:
                return RequestType.TokenAirdrop;
            case 94:
                return RequestType.TokenCancelAirdrop;
            case 95:
                return RequestType.TokenClaimAirdrop;
            case 100:
                return RequestType.StateSignatureTransaction;
            case 104:
                return RequestType.HistoryAssemblySignature;
            case 105:
                return RequestType.HistoryProofKeyPublication;
            case 106:
                return RequestType.HistoryProofVote;
        }

        throw new Error(
            `(BUG) RequestType.fromCode() does not handle code: ${code}`,
        );
    }

    /**
     * @returns {HieroProto.proto.HederaFunctionality}
     */
    valueOf() {
        return this._code;
    }
}

/**
            * n o n e
            */
            RequestType.NONE = new RequestType(0);

/**
            * crypto transfer
            */
            RequestType.CryptoTransfer = new RequestType(1);

/**
            * crypto update
            */
            RequestType.CryptoUpdate = new RequestType(2);

/**
            * crypto delete
            */
            RequestType.CryptoDelete = new RequestType(3);

/**
            * crypto add live hash
            */
            RequestType.CryptoAddLiveHash = new RequestType(4);

/**
            * crypto delete live hash
            */
            RequestType.CryptoDeleteLiveHash = new RequestType(5);

/**
            * contract call
            */
            RequestType.ContractCall = new RequestType(6);

/**
            * contract create
            */
            RequestType.ContractCreate = new RequestType(7);

/**
            * contract update
            */
            RequestType.ContractUpdate = new RequestType(8);

/**
            * file create
            */
            RequestType.FileCreate = new RequestType(9);

/**
            * file append
            */
            RequestType.FileAppend = new RequestType(10);

/**
            * file update
            */
            RequestType.FileUpdate = new RequestType(11);

/**
            * file delete
            */
            RequestType.FileDelete = new RequestType(12);

/**
            * crypto get account balance
            */
            RequestType.CryptoGetAccountBalance = new RequestType(13);

/**
            * crypto get account records
            */
            RequestType.CryptoGetAccountRecords = new RequestType(14);

/**
            * crypto get info
            */
            RequestType.CryptoGetInfo = new RequestType(15);

/**
            * contract call local
            */
            RequestType.ContractCallLocal = new RequestType(16);

/**
            * contract get info
            */
            RequestType.ContractGetInfo = new RequestType(17);

/**
            * contract get bytecode
            */
            RequestType.ContractGetBytecode = new RequestType(18);

/**
            * get by solidity i d
            */
            RequestType.GetBySolidityID = new RequestType(19);

/**
            * get by key
            */
            RequestType.GetByKey = new RequestType(20);

/**
            * crypto get live hash
            */
            RequestType.CryptoGetLiveHash = new RequestType(21);

/**
            * crypto get stakers
            */
            RequestType.CryptoGetStakers = new RequestType(22);

/**
            * file get contents
            */
            RequestType.FileGetContents = new RequestType(23);

/**
            * file get info
            */
            RequestType.FileGetInfo = new RequestType(24);

/**
            * transaction get record
            */
            RequestType.TransactionGetRecord = new RequestType(25);

/**
            * contract get records
            */
            RequestType.ContractGetRecords = new RequestType(26);

/**
            * crypto create
            */
            RequestType.CryptoCreate = new RequestType(27);

/**
            * system delete
            */
            RequestType.SystemDelete = new RequestType(28);

/**
            * system undelete
            */
            RequestType.SystemUndelete = new RequestType(29);

/**
            * contract delete
            */
            RequestType.ContractDelete = new RequestType(30);

/**
            * freeze
            */
            RequestType.Freeze = new RequestType(31);

/**
            * create transaction record
            */
            RequestType.CreateTransactionRecord = new RequestType(32);

/**
            * crypto account auto renew
            */
            RequestType.CryptoAccountAutoRenew = new RequestType(33);

/**
            * contract auto renew
            */
            RequestType.ContractAutoRenew = new RequestType(34);

/**
            * get version info
            */
            RequestType.GetVersionInfo = new RequestType(35);

/**
            * transaction get receipt
            */
            RequestType.TransactionGetReceipt = new RequestType(36);

/**
            * consensus create topic
            */
            RequestType.ConsensusCreateTopic = new RequestType(50);

/**
            * consensus update topic
            */
            RequestType.ConsensusUpdateTopic = new RequestType(51);

/**
            * consensus delete topic
            */
            RequestType.ConsensusDeleteTopic = new RequestType(52);

/**
            * consensus get topic info
            */
            RequestType.ConsensusGetTopicInfo = new RequestType(53);

/**
            * consensus submit message
            */
            RequestType.ConsensusSubmitMessage = new RequestType(54);

/**
            * unchecked submit
            */
            RequestType.UncheckedSubmit = new RequestType(55);

/**
            * token create
            */
            RequestType.TokenCreate = new RequestType(56);

/**
            * token get info
            */
            RequestType.TokenGetInfo = new RequestType(58);

/**
            * token freeze account
            */
            RequestType.TokenFreezeAccount = new RequestType(59);

/**
            * token unfreeze account
            */
            RequestType.TokenUnfreezeAccount = new RequestType(60);

/**
            * token grant kyc to account
            */
            RequestType.TokenGrantKycToAccount = new RequestType(61);

/**
            * token revoke kyc from account
            */
            RequestType.TokenRevokeKycFromAccount = new RequestType(62);

/**
            * token delete
            */
            RequestType.TokenDelete = new RequestType(63);

/**
            * token update
            */
            RequestType.TokenUpdate = new RequestType(64);

/**
            * token mint
            */
            RequestType.TokenMint = new RequestType(65);

/**
            * token burn
            */
            RequestType.TokenBurn = new RequestType(66);

/**
            * token account wipe
            */
            RequestType.TokenAccountWipe = new RequestType(67);

/**
            * token associate to account
            */
            RequestType.TokenAssociateToAccount = new RequestType(68);

/**
            * token dissociate from account
            */
            RequestType.TokenDissociateFromAccount = new RequestType(69);

/**
            * schedule create
            */
            RequestType.ScheduleCreate = new RequestType(70);

/**
            * schedule delete
            */
            RequestType.ScheduleDelete = new RequestType(71);

/**
            * schedule sign
            */
            RequestType.ScheduleSign = new RequestType(72);

/**
            * schedule get info
            */
            RequestType.ScheduleGetInfo = new RequestType(73);

/**
            * token get account nft infos
            */
            RequestType.TokenGetAccountNftInfos = new RequestType(74);

/**
            * token get nft info
            */
            RequestType.TokenGetNftInfo = new RequestType(75);

/**
            * token get nft infos
            */
            RequestType.TokenGetNftInfos = new RequestType(76);

/**
            * token fee schedule update
            */
            RequestType.TokenFeeScheduleUpdate = new RequestType(77);

/**
            * network get execution time
            */
            RequestType.NetworkGetExecutionTime = new RequestType(78);

/**
            * token pause
            */
            RequestType.TokenPause = new RequestType(79);

/**
            * token unpause
            */
            RequestType.TokenUnpause = new RequestType(80);

/**
            * crypto approve allowance
            */
            RequestType.CryptoApproveAllowance = new RequestType(81);

/**
            * crypto delete allowance
            */
            RequestType.CryptoDeleteAllowance = new RequestType(82);

/**
            * get account details
            */
            RequestType.GetAccountDetails = new RequestType(83);

/**
            * ethereum transaction
            */
            RequestType.EthereumTransaction = new RequestType(84);

/**
            * node stake update
            */
            RequestType.NodeStakeUpdate = new RequestType(85);

/**
            * util prng
            */
            RequestType.UtilPrng = new RequestType(86);

/**
            * transaction get fast record
            */
            RequestType.TransactionGetFastRecord = new RequestType(87);

/**
            * token update nfts
            */
            RequestType.TokenUpdateNfts = new RequestType(88);

/**
            * node create
            */
            RequestType.NodeCreate = new RequestType(89);

/**
            * node update
            */
            RequestType.NodeUpdate = new RequestType(90);

/**
            * node delete
            */
            RequestType.NodeDelete = new RequestType(91);

/**
            * token reject
            */
            RequestType.TokenReject = new RequestType(92);

/**
            * token airdrop
            */
            RequestType.TokenAirdrop = new RequestType(93);

/**
            * token cancel airdrop
            */
            RequestType.TokenCancelAirdrop = new RequestType(94);

/**
            * token claim airdrop
            */
            RequestType.TokenClaimAirdrop = new RequestType(95);

/**
            * state signature transaction
            */
            RequestType.StateSignatureTransaction = new RequestType(100);

/**
            * history assembly signature
            */
            RequestType.HistoryAssemblySignature = new RequestType(104);

/**
            * history proof key publication
            */
            RequestType.HistoryProofKeyPublication = new RequestType(105);

/**
            * history proof vote
            */
            RequestType.HistoryProofVote = new RequestType(106);

