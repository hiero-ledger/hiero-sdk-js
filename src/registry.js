// SPDX-License-Identifier: Apache-2.0

/**
 * Fills the lookup tables that let the SDK find a class from data alone:
 * `Transaction.fromBytes()` and the inner transactions of `BatchTransaction`
 * (TRANSACTION_REGISTRY) and `Transaction.schedule()` (SCHEDULE_CREATE_TRANSACTION).
 *
 * Every entry point (index.js, browser.js, native.js) imports this module.
 * The classes registered here have no side effects, so a bundler cannot drop
 * a registration by dropping an unused class file (#3011). Don't import this
 * module from a class: the base classes read the tables but must not depend
 * on every class.
 */

// The registered _fromProtobuf and _fromJson are static and don't use `this`.
/* eslint-disable @typescript-eslint/unbound-method */

import {
    TRANSACTION_REGISTRY,
    SCHEDULE_CREATE_TRANSACTION,
} from "./transaction/Transaction.js";
import EthereumTransaction from "./EthereumTransaction.js";
import PrngTransaction from "./PrngTransaction.js";
import AccountAllowanceApproveTransaction from "./account/AccountAllowanceApproveTransaction.js";
import AccountAllowanceDeleteTransaction from "./account/AccountAllowanceDeleteTransaction.js";
import AccountCreateTransaction from "./account/AccountCreateTransaction.js";
import AccountDeleteTransaction from "./account/AccountDeleteTransaction.js";
import AccountUpdateTransaction from "./account/AccountUpdateTransaction.js";
import TransferTransaction from "./account/TransferTransaction.js";
import ContractCreateTransaction from "./contract/ContractCreateTransaction.js";
import ContractDeleteTransaction from "./contract/ContractDeleteTransaction.js";
import ContractExecuteTransaction from "./contract/ContractExecuteTransaction.js";
import ContractUpdateTransaction from "./contract/ContractUpdateTransaction.js";
import FileAppendTransaction from "./file/FileAppendTransaction.js";
import FileCreateTransaction from "./file/FileCreateTransaction.js";
import FileDeleteTransaction from "./file/FileDeleteTransaction.js";
import FileUpdateTransaction from "./file/FileUpdateTransaction.js";
import HookStoreTransaction from "./hooks/HookStoreTransaction.js";
import NodeCreateTransaction from "./node/NodeCreateTransaction.js";
import NodeDeleteTransaction from "./node/NodeDeleteTransaction.js";
import NodeUpdateTransaction from "./node/NodeUpdateTransaction.js";
import RegisteredNodeCreateTransaction from "./node/RegisteredNodeCreateTransaction.js";
import RegisteredNodeDeleteTransaction from "./node/RegisteredNodeDeleteTransaction.js";
import RegisteredNodeUpdateTransaction from "./node/RegisteredNodeUpdateTransaction.js";
import ScheduleCreateTransaction from "./schedule/ScheduleCreateTransaction.js";
import ScheduleDeleteTransaction from "./schedule/ScheduleDeleteTransaction.js";
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
import TokenMintTransaction from "./token/TokenMintTransaction.js";
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
import TopicMessageSubmitTransaction from "./topic/TopicMessageSubmitTransaction.js";
import TopicUpdateTransaction from "./topic/TopicUpdateTransaction.js";
import BatchTransaction from "./transaction/BatchTransaction.js";

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
