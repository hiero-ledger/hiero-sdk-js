/*-
 * ‌
 * Hedera JavaScript SDK
 * ​
 * Copyright (C) 2020 - 2023 Hedera Hashgraph, LLC
 * ​
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ‍
 */

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.HederaFunctionality} HashgraphProto.proto.HederaFunctionality
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
            case RequestType.Prng:
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
            case RequestType.TssMessage:
                return "TssMessage";
            case RequestType.TssVote:
                return "TssVote";
            case RequestType.TssShareSignature:
                return "TssShareSignature";
            case RequestType.TssEncryptionKey:
                return "TssEncryptionKey";
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
                return RequestType.Prng;
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
            case 96:
                return RequestType.TssMessage;
            case 97:
                return RequestType.TssVote;
            case 98:
                return RequestType.TssShareSignature;
            case 99:
                return RequestType.TssEncryptionKey;
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
     * @returns {HashgraphProto.proto.HederaFunctionality}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * UNSPECIFIED - Need to keep first value as unspecified because first element is ignored and
 * not parsed (0 is ignored by parser)
 */
RequestType.None = new RequestType(0);

/**
 * crypto transfer
 */
RequestType.CryptoTransfer = new RequestType(1);

/**
 * crypto update account
 */
RequestType.CryptoUpdate = new RequestType(2);

/**
 * crypto delete account
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
 * crypto get account balance
 */
RequestType.CryptoGetAccountBalance = new RequestType(13);

/**
 * crypto get account record
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
 * Smart Contract, get the runtime code
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
 * crypto create account
 */
RequestType.CryptoCreate = new RequestType(27);

/**
 * system delete file
 */
RequestType.SystemDelete = new RequestType(28);

/**
 * system undelete file
 */
RequestType.SystemUndelete = new RequestType(29);

/**
 * delete contract
 */
RequestType.ContractDelete = new RequestType(30);

/**
 * freeze
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
 * Get Token Account Nft Information
 */
RequestType.TokenGetAccountNftInfos = new RequestType(74);

/**
 * Get Token Nft Information
 */
RequestType.TokenGetNftInfo = new RequestType(75);

/**
 * Get Token Nft List Information
 */
RequestType.TokenGetNftInfos = new RequestType(76);

/**
 * Update a token's custom fee schedule, if permissible
 */
RequestType.TokenFeeScheduleUpdate = new RequestType(77);

/**
 * Get execution time(s) by TransactionID, if available
 */
RequestType.NetworkGetExecutionTime = new RequestType(78);

/**
 * Pause the Token
 */
RequestType.TokenPause = new RequestType(79);

/**
 * Unpause the Token
 */
RequestType.TokenUnpause = new RequestType(80);

/**
 * Approve allowance for a spender relative to the owner account
 */
RequestType.CryptoApproveAllowance = new RequestType(81);

/**
 * Deletes granted allowances on owner account
 */
RequestType.CryptoDeleteAllowance = new RequestType(82);

/**
 * Gets all the information about an account, including balance and allowances. This does not get the list of
 * account records.
 */
RequestType.GetAccountDetails = new RequestType(83);

/**
 * Ethereum Transaction
 */
RequestType.EthereumTransaction = new RequestType(84);

/**
 * Updates the staking info at the end of staking period to indicate new staking period has started.
 */
RequestType.NodeStakeUpdate = new RequestType(85);

/**
 * Generates a pseudorandom number.
 */
RequestType.Prng = new RequestType(86);

/**
 * Get a record for a transaction (lasts 180 seconds)
 */
RequestType.TransactionGetFastRecord = new RequestType(87);

/**
 * Update the metadata of one or more NFT's of a specific token type.
 */
RequestType.TokenUpdateNfts = new RequestType(88);

/**
 * A transaction body for a `createNode` request.
 */
RequestType.NodeCreate = new RequestType(89);

/**
 * A transaction body for an `updateNode` request.
 */
RequestType.NodeUpdate = new RequestType(90);

/**
 * A transaction body for a `deleteNode` request.
 */
RequestType.NodeDelete = new RequestType(91);

/**
 * Transfer one or more token balances held by the requesting account to the treasury for each token type.
 */
RequestType.TokenReject = new RequestType(92);

/**
 * Airdrop one or more tokens to one or more accounts.
 */
RequestType.TokenAirdrop = new RequestType(93);

/**
 * Remove one or more pending airdrops from state on behalf of the sender(s) for each airdrop.
 */
RequestType.TokenCancelAirdrop = new RequestType(94);

/**
 * Claim one or more pending airdrops
 */
RequestType.TokenClaimAirdrop = new RequestType(95);

/**
 * (TSS) Messages for a candidate roster.
 */
RequestType.TssMessage = new RequestType(96);

/**
 * Vote on the validity of Threshold Signature Scheme (TSS)
 */
RequestType.TssVote = new RequestType(97);

/**
 * Communicates a node's signature of a block hash
 * using its private share within the TSS process
 */
RequestType.TssShareSignature = new RequestType(98);

/**
 * Submit a node public tss encryption key as part of the Threshold Signature Scheme (TSS).
 */
RequestType.TssEncryptionKey = new RequestType(99);

/**
 * Submit a signature of a state root hash gossiped to other nodes
 */
RequestType.StateSignatureTransaction = new RequestType(100);

/**
 * Sign a particular history assembly.
 */
RequestType.HistoryAssemblySignature = new RequestType(104);

/**
 * Publish a roster history proof key to the network.
 */
RequestType.HistoryProofKeyPublication = new RequestType(105);

/**
 * Vote for a particular history proof.
 */
RequestType.HistoryProofVote = new RequestType(106);
