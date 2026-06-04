import {
    FeeEstimateQuery,
    FeeEstimateMode,
    ContractCreateTransaction,
    FileCreateTransaction,
    FileAppendTransaction,
    Hbar,
    Timestamp,
    Transaction,
    Client,
} from "@hiero-ledger/sdk";
import Long from "long";

import { sdk } from "../sdk_data";
import {
    ExecuteFeeEstimateQueryParams,
    FeeEstimateModeName,
    FeeEstimateTransactionType,
} from "../params/fee-estimate";
import {
    FeeEstimateQueryResponse,
    FeeExtraResponse,
} from "../response/fee-estimate";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { getKeyFromString } from "../utils/key";
import { decode } from "../utils/hex";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";

import { buildCreateAccount, buildTransferCrypto } from "./account";
import { buildCreateToken, buildMintToken } from "./token";
import { buildCreateTopic, buildSubmitTopicMessage } from "./topic";

const MODE_MAP: Record<
    FeeEstimateModeName,
    typeof FeeEstimateMode.STATE | typeof FeeEstimateMode.INTRINSIC
> = {
    STATE: FeeEstimateMode.STATE,
    INTRINSIC: FeeEstimateMode.INTRINSIC,
};

/**
 * Build a FileCreateTransaction from the same params shape used by createFile.
 * Kept local so we don't have to refactor file.ts.
 */
const buildCreateFile = (
    {
        keys,
        contents,
        expirationTime,
        memo,
        commonTransactionParams,
    }: Record<string, any>,
    client: Client,
): FileCreateTransaction => {
    const transaction = new FileCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (keys?.length && keys.length > 0) {
        transaction.setKeys(keys.map((key: string) => getKeyFromString(key)));
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (memo != null) {
        transaction.setFileMemo(memo);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

/**
 * Build a FileAppendTransaction from the same params shape used by appendFile.
 */
const buildAppendFile = (
    {
        fileId,
        contents,
        maxChunks,
        chunkSize,
        commonTransactionParams,
    }: Record<string, any>,
    client: Client,
): FileAppendTransaction => {
    const transaction = new FileAppendTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (fileId != null) {
        transaction.setFileId(fileId);
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (maxChunks != null) {
        transaction.setMaxChunks(maxChunks);
    }

    if (chunkSize != null) {
        transaction.setChunkSize(chunkSize);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

/**
 * Build a ContractCreateTransaction from the same params shape used by createContract.
 */
const buildCreateContract = (
    {
        adminKey,
        autoRenewPeriod,
        autoRenewAccountId,
        initialBalance,
        bytecodeFileId,
        initcode,
        stakedAccountId,
        stakedNodeId,
        gas,
        declineStakingReward,
        memo,
        maxAutomaticTokenAssociations,
        constructorParameters,
        commonTransactionParams,
    }: Record<string, any>,
    client: Client,
): ContractCreateTransaction => {
    const transaction = new ContractCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }
    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }
    if (gas != null) {
        transaction.setGas(Long.fromString(gas));
    }
    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(autoRenewAccountId);
    }
    if (initialBalance != null) {
        transaction.setInitialBalance(Hbar.fromTinybars(initialBalance));
    }
    if (initcode != null) {
        transaction.setBytecode(decode(initcode));
    }
    if (bytecodeFileId != null) {
        transaction.setBytecodeFileId(bytecodeFileId);
    }
    if (stakedAccountId != null) {
        transaction.setStakedAccountId(stakedAccountId);
    }
    if (stakedNodeId != null) {
        transaction.setStakedNodeId(Long.fromString(stakedNodeId));
    }
    if (declineStakingReward != null) {
        transaction.setDeclineStakingReward(declineStakingReward);
    }
    if (memo != null) {
        transaction.setContractMemo(memo);
    }
    if (maxAutomaticTokenAssociations != null) {
        transaction.setMaxAutomaticTokenAssociations(
            maxAutomaticTokenAssociations,
        );
    }
    if (constructorParameters != null) {
        transaction.setConstructorParameters(decode(constructorParameters));
    }
    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

/**
 * Dispatch a transactionType + params to the correct builder.
 */
const buildTransactionForFeeEstimate = (
    transactionType: FeeEstimateTransactionType,
    transactionParams: Record<string, any>,
    sessionId: string | undefined,
    client: Client,
): Transaction => {
    const params = { ...transactionParams, sessionId };

    switch (transactionType) {
        case "AccountCreate":
            return buildCreateAccount(params as any, client);
        case "TransferCrypto":
            return buildTransferCrypto(params as any, client);
        case "TokenCreate":
            return buildCreateToken(params as any, client);
        case "TokenMint":
            return buildMintToken(params as any, client);
        case "TopicCreate":
            return buildCreateTopic(params as any, client);
        case "TopicMessageSubmit":
            return buildSubmitTopicMessage(params as any, client);
        case "ContractCreate":
            return buildCreateContract(params, client);
        case "FileCreate":
            return buildCreateFile(params, client);
        case "FileAppend":
            return buildAppendFile(params, client);
        default:
            throw new Error(
                `Unsupported transactionType for FeeEstimateQuery: ${transactionType}`,
            );
    }
};

/**
 * Convert a FeeEstimateResponse from the SDK into the TCK JSON-RPC response
 * shape (Long values stringified for precision).
 */
const formatExtras = (
    extras: Array<{
        name: string;
        included: number;
        count: number;
        charged: number;
        feePerUnit: { toString: () => string };
        subtotal: { toString: () => string };
    }>,
): FeeExtraResponse[] => {
    return extras.map((extra) => ({
        name: extra.name,
        included: extra.included,
        count: extra.count,
        charged: extra.charged,
        feePerUnit: extra.feePerUnit.toString(),
        subtotal: extra.subtotal.toString(),
    }));
};

/**
 * Execute a FeeEstimateQuery (HIP-1261).
 *
 * Builds the inner transaction from the supplied transactionType +
 * transactionParams, wraps it in FeeEstimateQuery, and returns the response
 * in JSON form with all tinycent values stringified.
 */
export const executeFeeEstimateQuery = async (
    params: ExecuteFeeEstimateQueryParams,
): Promise<FeeEstimateQueryResponse> => {
    const { sessionId, mode, highVolumeThrottle, transactionType } = params;
    const client = sdk.getClient(sessionId);

    if (transactionType == null) {
        throw new Error(
            "executeFeeEstimateQuery requires a transactionType parameter",
        );
    }

    const transaction = buildTransactionForFeeEstimate(
        transactionType,
        params.transactionParams ?? {},
        sessionId,
        client,
    );

    const query = new FeeEstimateQuery().setTransaction(transaction);

    if (mode != null) {
        const modeValue = MODE_MAP[mode];
        if (modeValue == null) {
            throw new Error(
                `Invalid FeeEstimateQuery mode: ${mode}. Must be one of: STATE, INTRINSIC`,
            );
        }
        query.setMode(modeValue);
    }

    if (highVolumeThrottle != null) {
        query.setHighVolumeThrottle(highVolumeThrottle);
    }

    const response = await query.execute(client);

    return {
        highVolumeMultiplier: response.highVolumeMultiplier.toString(),
        networkFee: {
            multiplier: response.networkFee.multiplier,
            subtotal: response.networkFee.subtotal.toString(),
        },
        nodeFee: {
            base: response.nodeFee.base.toString(),
            extras: formatExtras(response.nodeFee.extras as any),
        },
        serviceFee: {
            base: response.serviceFee.base.toString(),
            extras: formatExtras(response.serviceFee.extras as any),
        },
        total: response.total.toString(),
    };
};
