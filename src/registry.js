// SPDX-License-Identifier: Apache-2.0

/**
 * Fills the lookup tables that let the SDK find a class from data alone:
 * `Transaction.fromBytes()` and the inner transactions of `BatchTransaction`
 * (TRANSACTION_REGISTRY), `Query.fromBytes()` (QUERY_REGISTRY),
 * `Transaction.schedule()` (SCHEDULE_CREATE_TRANSACTION), service endpoint
 * parsing (ENDPOINT_FROM_PROTOBUF_REGISTRY, ENDPOINT_FROM_JSON_REGISTRY), and
 * key, account ID and Ethereum data parsing and `TransactionId.getReceipt()` /
 * `getRecord()` (CACHE).
 *
 * exports.js, which every entry point re-exports, imports this module, and
 * it is the only module that registers anything. The classes themselves have
 * no side effects, so a bundler cannot drop a registration by dropping an
 * unused class file (#3011). Don't import this module from a class: the base
 * classes read the tables but must not depend on every class.
 *
 * `sideEffects` in package.json lists this module, exports.js and the entry
 * points, and every other file is treated as side-effect free. The entry
 * points and exports.js have to be listed too: they only re-export, and
 * webpack and Vite skip a side-effect-free module that only re-exports, which
 * also skips the `import "./registry.js"` in it. A new entry point, or moving
 * that import, needs the list updated.
 */

// The registered _fromProtobuf and _fromJson are static and don't use `this`.
/* eslint-disable @typescript-eslint/unbound-method */

import Long from "long";
import CACHE from "./Cache.js";
import {
    TRANSACTION_REGISTRY,
    SCHEDULE_CREATE_TRANSACTION,
} from "./transaction/Transaction.js";
import { QUERY_REGISTRY } from "./query/Query.js";
import {
    ENDPOINT_FROM_PROTOBUF_REGISTRY,
    ENDPOINT_FROM_JSON_REGISTRY,
} from "./node/RegisteredServiceEndpoint.js";
import EthereumTransaction from "./EthereumTransaction.js";
import EthereumTransactionDataEip1559 from "./EthereumTransactionDataEip1559.js";
import EthereumTransactionDataEip2930 from "./EthereumTransactionDataEip2930.js";
import EthereumTransactionDataEip7702 from "./EthereumTransactionDataEip7702.js";
import EthereumTransactionDataLegacy from "./EthereumTransactionDataLegacy.js";
import KeyList from "./KeyList.js";
import PrivateKey from "./PrivateKey.js";
import PrngTransaction from "./PrngTransaction.js";
import PublicKey from "./PublicKey.js";
import AccountAllowanceApproveTransaction from "./account/AccountAllowanceApproveTransaction.js";
import AccountAllowanceDeleteTransaction from "./account/AccountAllowanceDeleteTransaction.js";
import AccountBalanceQuery from "./account/AccountBalanceQuery.js";
import AccountCreateTransaction from "./account/AccountCreateTransaction.js";
import AccountDeleteTransaction from "./account/AccountDeleteTransaction.js";
import AccountId from "./account/AccountId.js";
import AccountInfoQuery from "./account/AccountInfoQuery.js";
import AccountRecordsQuery from "./account/AccountRecordsQuery.js";
import AccountUpdateTransaction from "./account/AccountUpdateTransaction.js";
import TransferTransaction from "./account/TransferTransaction.js";
import ContractByteCodeQuery from "./contract/ContractByteCodeQuery.js";
import ContractCallQuery from "./contract/ContractCallQuery.js";
import ContractCreateTransaction from "./contract/ContractCreateTransaction.js";
import ContractDeleteTransaction from "./contract/ContractDeleteTransaction.js";
import ContractExecuteTransaction from "./contract/ContractExecuteTransaction.js";
import ContractId from "./contract/ContractId.js";
import ContractInfoQuery from "./contract/ContractInfoQuery.js";
import ContractUpdateTransaction from "./contract/ContractUpdateTransaction.js";
import DelegateContractId from "./contract/DelegateContractId.js";
import FileAppendTransaction from "./file/FileAppendTransaction.js";
import FileContentsQuery from "./file/FileContentsQuery.js";
import FileCreateTransaction from "./file/FileCreateTransaction.js";
import FileDeleteTransaction from "./file/FileDeleteTransaction.js";
import FileInfoQuery from "./file/FileInfoQuery.js";
import FileUpdateTransaction from "./file/FileUpdateTransaction.js";
import HookStoreTransaction from "./hooks/HookStoreTransaction.js";
import NetworkVersionInfoQuery from "./network/NetworkVersionInfoQuery.js";
import BlockNodeServiceEndpoint from "./node/BlockNodeServiceEndpoint.js";
import GeneralServiceEndpoint from "./node/GeneralServiceEndpoint.js";
import MirrorNodeServiceEndpoint from "./node/MirrorNodeServiceEndpoint.js";
import NodeCreateTransaction from "./node/NodeCreateTransaction.js";
import NodeDeleteTransaction from "./node/NodeDeleteTransaction.js";
import NodeUpdateTransaction from "./node/NodeUpdateTransaction.js";
import RegisteredNodeCreateTransaction from "./node/RegisteredNodeCreateTransaction.js";
import RegisteredNodeDeleteTransaction from "./node/RegisteredNodeDeleteTransaction.js";
import RegisteredNodeUpdateTransaction from "./node/RegisteredNodeUpdateTransaction.js";
import RpcRelayServiceEndpoint from "./node/RpcRelayServiceEndpoint.js";
import ScheduleCreateTransaction from "./schedule/ScheduleCreateTransaction.js";
import ScheduleDeleteTransaction from "./schedule/ScheduleDeleteTransaction.js";
import ScheduleInfoQuery from "./schedule/ScheduleInfoQuery.js";
import ScheduleSignTransaction from "./schedule/ScheduleSignTransaction.js";
import FreezeTransaction from "./system/FreezeTransaction.js";
import SystemDeleteTransaction from "./system/SystemDeleteTransaction.js";
import SystemUndeleteTransaction from "./system/SystemUndeleteTransaction.js";
import TokenAirdropTransaction from "./token/TokenAirdropTransaction.js";
import TokenAssociateTransaction from "./token/TokenAssociateTransaction.js";
import TokenBurnTransaction from "./token/TokenBurnTransaction.js";
import TokenCancelAirdropTransaction from "./token/TokenCancelAirdropTransaction.js";
import TokenClaimAirdropTransaction from "./token/TokenClaimAirdropTransaction.js";
import TokenCreateTransaction from "./token/TokenCreateTransaction.js";
import TokenDeleteTransaction from "./token/TokenDeleteTransaction.js";
import TokenDissociateTransaction from "./token/TokenDissociateTransaction.js";
import TokenFeeScheduleUpdateTransaction from "./token/TokenFeeScheduleUpdateTransaction.js";
import TokenFreezeTransaction from "./token/TokenFreezeTransaction.js";
import TokenGrantKycTransaction from "./token/TokenGrantKycTransaction.js";
import TokenInfoQuery from "./token/TokenInfoQuery.js";
import TokenMintTransaction from "./token/TokenMintTransaction.js";
import TokenNftInfoQuery from "./token/TokenNftInfoQuery.js";
import TokenPauseTransaction from "./token/TokenPauseTransaction.js";
import TokenRejectTransaction from "./token/TokenRejectTransaction.js";
import TokenRevokeKycTransaction from "./token/TokenRevokeKycTransaction.js";
import TokenUnfreezeTransaction from "./token/TokenUnfreezeTransaction.js";
import TokenUnpauseTransaction from "./token/TokenUnpauseTransaction.js";
import TokenUpdateNftsTransaction from "./token/TokenUpdateNftsTransaction.js";
import TokenUpdateTransaction from "./token/TokenUpdateTransaction.js";
import TokenWipeTransaction from "./token/TokenWipeTransaction.js";
import TopicCreateTransaction from "./topic/TopicCreateTransaction.js";
import TopicDeleteTransaction from "./topic/TopicDeleteTransaction.js";
import TopicInfoQuery from "./topic/TopicInfoQuery.js";
import TopicMessageSubmitTransaction from "./topic/TopicMessageSubmitTransaction.js";
import TopicUpdateTransaction from "./topic/TopicUpdateTransaction.js";
import BatchTransaction from "./transaction/BatchTransaction.js";
import TransactionReceiptQuery from "./transaction/TransactionReceiptQuery.js";
import TransactionRecordQuery from "./transaction/TransactionRecordQuery.js";

TRANSACTION_REGISTRY.set("atomicBatch", BatchTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "consensusCreateTopic",
    TopicCreateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "consensusDeleteTopic",
    TopicDeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "consensusSubmitMessage",
    TopicMessageSubmitTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "consensusUpdateTopic",
    TopicUpdateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "contractCall",
    ContractExecuteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "contractCreateInstance",
    ContractCreateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "contractDeleteInstance",
    ContractDeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "contractUpdateInstance",
    ContractUpdateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "cryptoApproveAllowance",
    AccountAllowanceApproveTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "cryptoCreateAccount",
    AccountCreateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "cryptoDelete",
    AccountDeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "cryptoDeleteAllowance",
    AccountAllowanceDeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("cryptoTransfer", TransferTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "cryptoUpdateAccount",
    AccountUpdateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "ethereumTransaction",
    EthereumTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("fileAppend", FileAppendTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("fileCreate", FileCreateTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("fileDelete", FileDeleteTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("fileUpdate", FileUpdateTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("freeze", FreezeTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("hookStore", HookStoreTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("nodeCreate", NodeCreateTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("nodeDelete", NodeDeleteTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("nodeUpdate", NodeUpdateTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "registeredNodeCreate",
    RegisteredNodeCreateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "registeredNodeDelete",
    RegisteredNodeDeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "registeredNodeUpdate",
    RegisteredNodeUpdateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "scheduleCreate",
    ScheduleCreateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "scheduleDelete",
    ScheduleDeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("scheduleSign", ScheduleSignTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("systemDelete", SystemDeleteTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "systemUndelete",
    SystemUndeleteTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenAirdrop", TokenAirdropTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "tokenAssociate",
    TokenAssociateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenBurn", TokenBurnTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "tokenCancelAirdrop",
    TokenCancelAirdropTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "tokenClaimAirdrop",
    TokenClaimAirdropTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenCreation", TokenCreateTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("tokenDeletion", TokenDeleteTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "tokenDissociate",
    TokenDissociateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "tokenFeeScheduleUpdate",
    TokenFeeScheduleUpdateTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenFreeze", TokenFreezeTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "tokenGrantKyc",
    TokenGrantKycTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenMint", TokenMintTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("tokenPause", TokenPauseTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("tokenReject", TokenRejectTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "tokenRevokeKyc",
    TokenRevokeKycTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set(
    "tokenUnfreeze",
    TokenUnfreezeTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenUnpause", TokenUnpauseTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("tokenUpdate", TokenUpdateTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set(
    "tokenUpdateNfts",
    TokenUpdateNftsTransaction._fromProtobuf,
);
TRANSACTION_REGISTRY.set("tokenWipe", TokenWipeTransaction._fromProtobuf);
TRANSACTION_REGISTRY.set("utilPrng", PrngTransaction._fromProtobuf);

SCHEDULE_CREATE_TRANSACTION.push(() => new ScheduleCreateTransaction());

QUERY_REGISTRY.set("consensusGetTopicInfo", TopicInfoQuery._fromProtobuf);
QUERY_REGISTRY.set("contractCallLocal", ContractCallQuery._fromProtobuf);
QUERY_REGISTRY.set("contractGetBytecode", ContractByteCodeQuery._fromProtobuf);
QUERY_REGISTRY.set("contractGetInfo", ContractInfoQuery._fromProtobuf);
QUERY_REGISTRY.set(
    "cryptoGetAccountRecords",
    AccountRecordsQuery._fromProtobuf,
);
QUERY_REGISTRY.set("cryptoGetInfo", AccountInfoQuery._fromProtobuf);
QUERY_REGISTRY.set(
    "cryptogetAccountBalance",
    // Still registered so Query.fromBytes() can read existing bytes.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    AccountBalanceQuery._fromProtobuf,
);
QUERY_REGISTRY.set("fileGetContents", FileContentsQuery._fromProtobuf);
QUERY_REGISTRY.set("fileGetInfo", FileInfoQuery._fromProtobuf);
QUERY_REGISTRY.set(
    "networkGetVersionInfo",
    NetworkVersionInfoQuery._fromProtobuf,
);
QUERY_REGISTRY.set("scheduleGetInfo", ScheduleInfoQuery._fromProtobuf);
QUERY_REGISTRY.set("tokenGetInfo", TokenInfoQuery._fromProtobuf);
QUERY_REGISTRY.set("tokenGetNftInfo", TokenNftInfoQuery._fromProtobuf);
QUERY_REGISTRY.set(
    "transactionGetReceipt",
    TransactionReceiptQuery._fromProtobuf,
);
QUERY_REGISTRY.set(
    "transactionGetRecord",
    TransactionRecordQuery._fromProtobuf,
);

ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "blockNode",
    BlockNodeServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "generalService",
    GeneralServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "mirrorNode",
    MirrorNodeServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_PROTOBUF_REGISTRY.set(
    "rpcRelay",
    RpcRelayServiceEndpoint._fromProtobuf,
);
ENDPOINT_FROM_JSON_REGISTRY.set(
    "blockNode",
    BlockNodeServiceEndpoint._fromJson,
);
ENDPOINT_FROM_JSON_REGISTRY.set(
    "generalService",
    GeneralServiceEndpoint._fromJson,
);
ENDPOINT_FROM_JSON_REGISTRY.set(
    "mirrorNode",
    MirrorNodeServiceEndpoint._fromJson,
);
ENDPOINT_FROM_JSON_REGISTRY.set("rpcRelay", RpcRelayServiceEndpoint._fromJson);

CACHE.setEthereumTransactionDataEip1559FromBytes((bytes) =>
    EthereumTransactionDataEip1559.fromBytes(bytes),
);
CACHE.setEthereumTransactionDataEip2930FromBytes((bytes) =>
    EthereumTransactionDataEip2930.fromBytes(bytes),
);
CACHE.setEthereumTransactionDataEip7702FromBytes((bytes) =>
    EthereumTransactionDataEip7702.fromBytes(bytes),
);
CACHE.setEthereumTransactionDataLegacyFromBytes((bytes) =>
    EthereumTransactionDataLegacy.fromBytes(bytes),
);
CACHE.setKeyList((key) => KeyList.__fromProtobufKeyList(key));
CACHE.setThresholdKey((key) => KeyList.__fromProtobufThresoldKey(key));
CACHE.setPrivateKeyConstructor((key) => new PrivateKey(key));
CACHE.setPublicKeyED25519((key) => PublicKey.fromBytesED25519(key));
CACHE.setPublicKeyECDSA((key) => PublicKey.fromBytesECDSA(key));
CACHE.setAccountIdConstructor(
    (shard, realm, key) => new AccountId(shard, realm, Long.ZERO, key),
);
CACHE.setContractId((key) => ContractId.__fromProtobufKey(key));
CACHE.setDelegateContractId((key) => DelegateContractId.__fromProtobufKey(key));
CACHE.setTransactionReceiptQueryConstructor(
    () => new TransactionReceiptQuery(),
);
CACHE.setTransactionRecordQueryConstructor(() => new TransactionRecordQuery());
