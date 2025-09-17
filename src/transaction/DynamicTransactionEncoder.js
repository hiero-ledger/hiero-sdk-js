// SPDX-License-Identifier: Apache-2.0

import importSync from "import-sync";

//import importSync from "import-sync";

/**
 * Dynamic transaction encoder that imports transaction-specific proto encoders
 * This enables tree-shaking and reduces bundle size by only loading the needed proto code
 */

/**
 * Maps transaction data case names to their corresponding proto module names
 * This mapping converts proto field names (e.g., "fileAppend") to class names (e.g., "FileAppendTransaction")
 * @type {Record<string, string>}
 */
const TRANSACTION_PROTO_MAPPING = {
    // Account transactions
    cryptoCreateAccount: "CryptoCreateTransaction",
    cryptoUpdate: "CryptoUpdateTransaction",
    cryptoTransfer: "CryptoTransferTransaction",
    cryptoDelete: "CryptoDeleteTransaction",
    cryptoApproveAllowance: "CryptoApproveAllowanceTransaction",
    cryptoDeleteAllowance: "CryptoDeleteAllowanceTransaction",

    // File transactions
    fileCreate: "FileCreateTransaction",
    fileAppend: "FileAppendTransaction",
    fileUpdate: "FileUpdateTransaction",
    fileDelete: "FileDeleteTransaction",

    // Contract transactions
    contractCreateInstance: "ContractCreateTransaction",
    contractUpdateInstance: "ContractUpdateTransaction",
    contractCall: "ContractCallTransaction",
    contractDeleteInstance: "ContractDeleteTransaction",

    // Topic transactions
    consensusCreateTopic: "ConsensusCreateTopicTransaction",
    consensusUpdateTopic: "ConsensusUpdateTopicTransaction",
    consensusDeleteTopic: "ConsensusDeleteTopicTransaction",
    consensusSubmitMessage: "ConsensusSubmitMessageTransaction",

    // Token transactions
    tokenCreation: "TokenCreateTransaction",
    tokenUpdate: "TokenUpdateTransaction",
    tokenMint: "TokenMintTransaction",
    tokenBurn: "TokenBurnTransaction",
    tokenDeletion: "TokenDeleteTransaction",
    tokenWipe: "TokenWipeAccountTransaction",
    tokenFreeze: "TokenFreezeAccountTransaction",
    tokenUnfreeze: "TokenUnfreezeAccountTransaction",
    tokenGrantKyc: "TokenGrantKycTransaction",
    tokenRevokeKyc: "TokenRevokeKycTransaction",
    tokenAssociate: "TokenAssociateTransaction",
    tokenDissociate: "TokenDissociateTransaction",
    tokenFeeScheduleUpdate: "TokenFeeScheduleUpdateTransaction",
    tokenPause: "TokenPauseTransaction",
    tokenUnpause: "TokenUnpauseTransaction",
    tokenUpdateNfts: "TokenUpdateNftsTransaction",
    tokenReject: "TokenRejectTransaction",
    tokenAirdrop: "TokenAirdropTransaction",
    tokenCancelAirdrop: "TokenCancelAirdropTransaction",
    tokenClaimAirdrop: "TokenClaimAirdropTransaction",

    // Schedule transactions
    scheduleCreate: "ScheduleCreateTransaction",
    scheduleDelete: "ScheduleDeleteTransaction",
    scheduleSign: "ScheduleSignTransaction",

    // System transactions
    freeze: "FreezeTransaction",
    systemDelete: "SystemDeleteTransaction",
    systemUndelete: "SystemUndeleteTransaction",

    // Node transactions
    nodeCreate: "NodeCreateTransaction",
    nodeUpdate: "NodeUpdateTransaction",
    nodeDelete: "NodeDeleteTransaction",
    nodeStakeUpdate: "NodeStakeUpdateTransaction",

    // Other transactions
    utilPrng: "UtilPrngTransaction",
    ethereumTransaction: "EthereumTransactionTransaction",
    atomicBatch: "AtomicBatchTransaction",
};

// --- Minimal oneof discriminator helpers ---
// These helpers avoid importing full @hashgraph/proto by peeking field tags
// of proto.TransactionBody to determine which `data` arm is present.

/**
 * Known top-level non-oneof field numbers in proto.TransactionBody
 * Keep this list in sync with minimal_src definitions
 */
const NON_ONEOF_TRANSACTION_BODY_FIELDS = new Set([1, 2, 3, 4, 6, 73, 1001]);

/**
 * Detects which oneof `data` field number is present in a TransactionBody
 * without decoding with a full schema.
 * Returns the field number (e.g., 16 for fileAppend) or null if none found.
 *
 * @param {Uint8Array} bodyBytes
 * @returns {number | null}
 */
export function detectTransactionBodyDataFieldNumber(bodyBytes) {
    // Lazy import to avoid hard dependency unless used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Reader } = require("protobufjs/minimal");
    const reader = Reader.create(bodyBytes);

    while (reader.pos < reader.len) {
        const tag = reader.uint32();
        const fieldNumber = tag >>> 3;
        const wireType = tag & 7;

        if (!NON_ONEOF_TRANSACTION_BODY_FIELDS.has(fieldNumber)) {
            // Oneof arms are messages → length-delimited
            if (wireType === 2) {
                return fieldNumber;
            }
        }

        reader.skipType(wireType);
    }

    return null;
}

/**
 * Optional mapping from TransactionBody oneof `data` field numbers to case strings.
 * Extend as needed. Only include values you need to detect.
 * @type {Record<number, string>}
 */
export const TRANSACTION_BODY_FIELD_NUMBER_TO_CASE = {
    // Contract
    7: "contractCall",
    8: "contractCreateInstance",
    9: "contractUpdateInstance",
    22: "contractDeleteInstance",

    // Crypto
    11: "cryptoCreateAccount",
    12: "cryptoDelete",
    14: "cryptoTransfer",
    15: "cryptoUpdate",
    48: "cryptoApproveAllowance",
    49: "cryptoDeleteAllowance",

    // File
    16: "fileAppend",
    17: "fileCreate",
    18: "fileDelete",
    19: "fileUpdate",

    // System
    20: "systemDelete",
    21: "systemUndelete",
    23: "freeze",

    // Consensus (Topic)
    24: "consensusCreateTopic",
    25: "consensusUpdateTopic",
    26: "consensusDeleteTopic",
    27: "consensusSubmitMessage",

    // Token
    29: "tokenCreation",
    31: "tokenFreeze",
    32: "tokenUnfreeze",
    33: "tokenGrantKyc",
    34: "tokenRevokeKyc",
    35: "tokenDeletion",
    36: "tokenUpdate",
    37: "tokenMint",
    38: "tokenBurn",
    39: "tokenWipe",
    40: "tokenAssociate",
    41: "tokenDissociate",
    45: "tokenFeeScheduleUpdate",
    46: "tokenPause",
    47: "tokenUnpause",
    53: "tokenUpdateNfts",
    57: "tokenReject",
    58: "tokenAirdrop",
    59: "tokenCancelAirdrop",
    60: "tokenClaimAirdrop",

    // Schedule
    42: "scheduleCreate",
    43: "scheduleDelete",
    44: "scheduleSign",

    // Other
    50: "ethereumTransaction",
    51: "nodeStakeUpdate",
    52: "utilPrng",
    54: "nodeCreate",
    55: "nodeUpdate",
    56: "nodeDelete",
    74: "atomicBatch",
};

/**
 *
 * @param {Uint8Array} bodyBytes
 * @returns
 */
export function decodeTransactionBodyAutoSync(bodyBytes) {
    const dataCase = detectTransactionBodyCaseFromBytes(bodyBytes);
    console.log(dataCase);

    if (!dataCase) {
        throw new Error("Unknown transaction type");
    }

    // Get the file name from direct mapping
    const fileName = TRANSACTION_CASE_TO_FILE_NAME[dataCase];
    if (!fileName) {
        throw new Error("Unknown transaction type");
    }

    try {
        // Use importSync for synchronous dynamic import
        const protoModule = importSync(
            `@hashgraph/proto/lib/minimal/${fileName}`,
        );
        return protoModule.proto.TransactionBody.decode(bodyBytes);
    } catch (error) {
        console.warn(`Failed to load ${dataCase} module:`, error);
    }
}

/**
 *
 * @param {Uint8Array} bodyBytes
 * @returns
 */
export function encodeTransactionBodyAutoSync(bodyBytes) {
    const dataCase = detectTransactionBodyCaseFromBytes(bodyBytes);
    console.log(dataCase);

    if (!dataCase) {
        throw new Error("Unknown transaction type");
    }

    // Get the file name from direct mapping
    const fileName = TRANSACTION_CASE_TO_FILE_NAME[dataCase];
    if (!fileName) {
        throw new Error("Unknown transaction type");
    }

    try {
        // Use importSync for synchronous dynamic import
        const protoModule = importSync(
            `@hashgraph/proto/lib/minimal/${fileName}`,
        );
        return protoModule.proto.TransactionBody.encode(bodyBytes);
    } catch (error) {
        console.warn(`Failed to load ${dataCase} module:`, error);
    }
}

/**
 *
 * @param {import("@hashgraph/proto").proto.ITransaction} body
 * @param {string} transactionDataCase
 * @returns
 */
export function encodeTransactionDynamic(body, transactionDataCase) {
    // Get the file name from direct mapping
    const fileName = TRANSACTION_CASE_TO_FILE_NAME[transactionDataCase];
    if (!fileName) {
        throw new Error("Unknown transaction type");
    }

    try {
        // Use importSync for synchronous dynamic import
        const protoModule = importSync(
            `@hashgraph/proto/lib/minimal/${fileName}`,
        );
        return protoModule.proto.Transaction.encode(body);
    } catch (error) {
        console.warn(`Failed to load ${transactionDataCase} module:`, error);
    }
}

/**
 * Detects the TransactionBody oneof case string directly from bytes, when mapped.
 * Falls back to null if unknown.
 *
 * @param {Uint8Array} bodyBytes
 * @returns {string | null}
 */
export function detectTransactionBodyCaseFromBytes(bodyBytes) {
    const field = detectTransactionBodyDataFieldNumber(bodyBytes);
    if (field == null) return null;
    return TRANSACTION_BODY_FIELD_NUMBER_TO_CASE[field] ?? null;
}

/**
 * Direct mapping from transaction data case to actual file names
 * @type {Record<string, string>}
 */
const TRANSACTION_CASE_TO_FILE_NAME = {
    // Contract
    contractCall: "contract_call_transaction.js",
    contractCreateInstance: "contract_create_transaction.js",
    contractUpdateInstance: "contract_update_transaction.js",
    contractDeleteInstance: "contract_delete_transaction.js",

    // Crypto
    cryptoCreateAccount: "crypto_create_transaction.js",
    cryptoDelete: "crypto_delete_transaction.js",
    cryptoTransfer: "crypto_transfer_transaction.js",
    cryptoUpdate: "crypto_update_transaction.js",
    cryptoApproveAllowance: "crypto_approve_allowance_transaction.js",
    cryptoDeleteAllowance: "crypto_delete_allowance_transaction.js",

    // File
    fileCreate: "file_create_transaction.js",
    fileAppend: "file_append_transaction.js",
    fileUpdate: "file_update_transaction.js",
    fileDelete: "file_delete_transaction.js",

    // System
    systemDelete: "system_delete_transaction.js",
    systemUndelete: "system_undelete_transaction.js",
    freeze: "freeze_transaction.js",

    // Consensus (Topic)
    consensusCreateTopic: "consensus_create_topic_transaction.js",
    consensusUpdateTopic: "consensus_update_topic_transaction.js",
    consensusDeleteTopic: "consensus_delete_topic_transaction.js",
    consensusSubmitMessage: "consensus_submit_message_transaction.js",

    // Token
    tokenCreation: "token_create_transaction.js",
    tokenUpdate: "token_update_transaction.js",
    tokenMint: "token_mint_transaction.js",
    tokenBurn: "token_burn_transaction.js",
    tokenDeletion: "token_delete_transaction.js",
    tokenWipe: "token_wipe_account_transaction.js",
    tokenFreeze: "token_freeze_account_transaction.js",
    tokenUnfreeze: "token_unfreeze_account_transaction.js",
    tokenGrantKyc: "token_grant_kyc_transaction.js",
    tokenRevokeKyc: "token_revoke_kyc_transaction.js",
    tokenAssociate: "token_associate_transaction.js",
    tokenDissociate: "token_dissociate_transaction.js",
    tokenFeeScheduleUpdate: "token_fee_schedule_update_transaction.js",
    tokenPause: "token_pause_transaction.js",
    tokenUnpause: "token_unpause_transaction.js",
    tokenUpdateNfts: "token_update_nfts_transaction.js",
    tokenReject: "token_reject_transaction.js",
    tokenAirdrop: "token_airdrop_transaction.js",
    tokenCancelAirdrop: "token_cancel_airdrop_transaction.js",
    tokenClaimAirdrop: "token_claim_airdrop_transaction.js",

    // Schedule
    scheduleCreate: "schedule_create_transaction.js",
    scheduleDelete: "schedule_delete_transaction.js",
    scheduleSign: "schedule_sign_transaction.js",

    // Other
    ethereumTransaction: "ethereum_transaction_transaction.js",
    nodeStakeUpdate: "node_stake_update_transaction.js",
    utilPrng: "util_prng_transaction.js",
    nodeCreate: "node_create_transaction.js",
    nodeUpdate: "node_update_transaction.js",
    nodeDelete: "node_delete_transaction.js",
    atomicBatch: "atomic_batch_transaction.js",
};

// Add this to DynamicTransactionEncoder.js
export const TRANSACTION_FIELD_NUMBER_TO_CASE = Object.fromEntries(
    Object.entries(TRANSACTION_BODY_FIELD_NUMBER_TO_CASE).map(
        ([fieldNumber, caseName]) => [parseInt(fieldNumber), caseName],
    ),
);

/**
 * Encodes transaction body using field number
 * @param {any} body - The transaction body to encode
 * @param {number} fieldNumber - The protobuf field number
 * @returns {Uint8Array} The encoded transaction body bytes
 */
export function encodeTransactionBodyByFieldNumber(body, fieldNumber) {
    const transactionDataCase = TRANSACTION_FIELD_NUMBER_TO_CASE[fieldNumber];

    if (!transactionDataCase) {
        throw new Error(`Unknown field number: ${fieldNumber}`);
    }

    return encodeTransactionBodyDynamic(body, transactionDataCase);
}

/**
 * Dynamically encodes a transaction body using the specific transaction proto module
 * @param {any} body - The transaction body to encode
 * @param {string} transactionDataCase - The transaction data case (e.g., "fileCreate")
 * @returns {Uint8Array} The encoded transaction body bytes
 */
export function encodeTransactionBodyDynamic(body, transactionDataCase) {
    // Get the file name from the transaction data case
    const fileName = TRANSACTION_CASE_TO_FILE_NAME[transactionDataCase];

    if (!fileName) {
        throw new Error(`Unknown transaction type: ${transactionDataCase}`);
    }

    try {
        // Use importSync for synchronous dynamic import
        const protoModule = importSync(
            `@hashgraph/proto/lib/minimal/${fileName}`,
        );

        // Use the specific transaction proto module to encode
        return protoModule.proto.TransactionBody.encode(body).finish();
    } catch (error) {
        console.warn(`Failed to load ${transactionDataCase} module:`, error);
        throw new Error(
            `Failed to encode transaction body for type: ${transactionDataCase}`,
        );
    }
}

export default {
    decodeTransactionBodyAutoSync,
    encodeTransactionBodyAutoSync,
    encodeTransactionDynamic,
    TRANSACTION_PROTO_MAPPING,
};
