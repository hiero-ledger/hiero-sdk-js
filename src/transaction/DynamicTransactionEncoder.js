// SPDX-License-Identifier: Apache-2.0

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

/**
 * Cache for dynamically imported proto modules to avoid re-importing
 * @type {Map<string, any>}
 */
const protoModuleCache = new Map();

/**
 * Dynamically imports and returns the appropriate transaction proto encoder
 * @param {string} transactionDataCase - The transaction data case from _getTransactionDataCase()
 * @returns {Promise<any>} The proto module with TransactionBody encoder
 */
export async function getTransactionProtoEncoder(transactionDataCase) {
    // Check cache first
    if (protoModuleCache.has(transactionDataCase)) {
        return protoModuleCache.get(transactionDataCase);
    }

    // Get the proto module name
    const protoModuleName = TRANSACTION_PROTO_MAPPING[transactionDataCase];

    if (!protoModuleName) {
        throw new Error(
            `No proto module mapping found for transaction type: ${transactionDataCase}`,
        );
    }

    try {
        // Dynamic import using the minimal proto package
        const protoModule = await import(
            `@hashgraph/proto/lib/minimal/${protoModuleName.toLowerCase().replace(/transaction$/, "_transaction.js")}`
        );

        // Cache the result
        protoModuleCache.set(transactionDataCase, protoModule);

        return protoModule;
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to dynamically import proto module for ${transactionDataCase}: ${errorMessage}`,
        );
    }
}

/**
 * Dynamically encodes a transaction body using the appropriate proto encoder
 * @param {any} body - The transaction body to encode
 * @param {string} transactionDataCase - The transaction data case from _getTransactionDataCase()
 * @returns {Promise<Uint8Array>} The encoded transaction body bytes
 */
export async function encodeTransactionBody(body, transactionDataCase) {
    const protoModule = await getTransactionProtoEncoder(transactionDataCase);

    // Use the proto module to encode the transaction body
    return protoModule.proto.TransactionBody.encode(body).finish();
}

/**
 * Dynamically encodes a transaction body using the appropriate proto encoder (sync version with fallback)
 * This version attempts to use a cached encoder first, falls back to main proto if not available
 * @param {any} body - The transaction body to encode
 * @param {string} transactionDataCase - The transaction data case from _getTransactionDataCase()
 * @param {any} fallbackProto - Fallback proto module (e.g., HieroProto)
 * @returns {Uint8Array} The encoded transaction body bytes
 */
export function encodeTransactionBodySync(
    body,
    transactionDataCase,
    fallbackProto,
) {
    // Check if we have a cached proto module
    if (protoModuleCache.has(transactionDataCase)) {
        const protoModule = protoModuleCache.get(transactionDataCase);
        return protoModule.proto.TransactionBody.encode(body).finish();
    }

    // Fall back to the main proto module if no cached version available
    return fallbackProto.proto.TransactionBody.encode(body).finish();
}

/**
 * Preload specific transaction proto encoders
 * This can be called during app initialization for commonly used transactions
 * @param {string[]} transactionTypes - Array of transaction data cases to preload
 * @returns {Promise<void>}
 */
export async function preloadTransactionEncoders(transactionTypes) {
    const promises = transactionTypes.map((type) =>
        getTransactionProtoEncoder(type).catch((error) =>
            console.warn(`Failed to preload proto encoder for ${type}:`, error),
        ),
    );

    await Promise.all(promises);
}

export default {
    getTransactionProtoEncoder,
    encodeTransactionBody,
    encodeTransactionBodySync,
    preloadTransactionEncoders,
    TRANSACTION_PROTO_MAPPING,
};
