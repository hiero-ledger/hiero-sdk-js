import {
    TopicCreateTransaction,
    Timestamp,
    CustomFixedFee,
    Hbar,
    TopicUpdateTransaction,
    TopicDeleteTransaction,
    TopicMessageSubmitTransaction,
    CustomFeeLimit,
    AccountId,
    TopicInfoQuery,
    TopicInfo,
} from "@hiero-ledger/sdk";
import Long from "long";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import {
    TopicCreateParams,
    TopicUpdateParams,
    TopicDeleteParams,
    TopicSubmitMessageParams,
    GetTopicInfoParams,
} from "../params/topic";

import { sdk } from "../sdk_data";
import { TopicResponse, TopicInfoQueryResponse } from "../response/topic";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { getKeyFromString } from "../utils/key";

// buildCreateTopic builds a TopicCreateTransaction from parameters
export const buildCreateTopic = (
    {
        memo,
        adminKey,
        submitKey,
        autoRenewPeriod,
        autoRenewAccountId,
        feeScheduleKey,
        feeExemptKeys,
        customFees,
        commonTransactionParams,
    }: TopicCreateParams,
    client,
): TopicCreateTransaction => {
    const transaction = new TopicCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (memo != null) {
        transaction.setTopicMemo(memo);
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (submitKey != null) {
        transaction.setSubmitKey(getKeyFromString(submitKey));
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(autoRenewAccountId);
    }

    if (feeScheduleKey != null) {
        transaction.setFeeScheduleKey(getKeyFromString(feeScheduleKey));
    }

    if (feeExemptKeys != null && feeExemptKeys.length > 0) {
        transaction.setFeeExemptKeys(
            feeExemptKeys.map((key: string) => getKeyFromString(key)),
        );
    }

    if (customFees != null && customFees.length > 0) {
        const sdkCustomFees = customFees.map((fee) => {
            if (fee.fixedFee.denominatingTokenId) {
                return new CustomFixedFee()
                    .setAmount(Long.fromString(fee.fixedFee.amount))
                    .setDenominatingTokenId(fee.fixedFee.denominatingTokenId)
                    .setFeeCollectorAccountId(fee.feeCollectorAccountId)
                    .setAllCollectorsAreExempt(fee.feeCollectorsExempt);
            } else {
                return new CustomFixedFee()
                    .setHbarAmount(
                        Hbar.fromTinybars(Long.fromString(fee.fixedFee.amount)),
                    )
                    .setFeeCollectorAccountId(fee.feeCollectorAccountId)
                    .setAllCollectorsAreExempt(fee.feeCollectorsExempt);
            }
        });
        transaction.setCustomFees(sdkCustomFees);
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

export const createTopic = async (
    params: TopicCreateParams,
): Promise<TopicResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildCreateTopic(params, client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        topicId: receipt.topicId?.toString(),
        status: receipt.status.toString(),
    };
};

// buildUpdateTopic builds a TopicUpdateTransaction from parameters
const buildUpdateTopic = (
    {
        topicId,
        memo,
        adminKey,
        submitKey,
        autoRenewPeriod,
        autoRenewAccountId,
        expirationTime,
        feeScheduleKey,
        feeExemptKeys,
        customFees,
        commonTransactionParams,
    }: TopicUpdateParams,
    client,
): TopicUpdateTransaction => {
    const transaction = new TopicUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (topicId != null) {
        transaction.setTopicId(topicId);
    }

    if (memo != null) {
        transaction.setTopicMemo(memo);
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (submitKey != null) {
        transaction.setSubmitKey(getKeyFromString(submitKey));
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(autoRenewAccountId);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (feeScheduleKey != null) {
        const feeScheduleKeyObj = getKeyFromString(feeScheduleKey);
        transaction.setFeeScheduleKey(feeScheduleKeyObj);
    }

    if (feeExemptKeys != null) {
        if (feeExemptKeys.length === 0) {
            transaction.clearFeeExemptKeys();
        } else {
            transaction.setFeeExemptKeys(
                feeExemptKeys.map((key: string) => getKeyFromString(key)),
            );
        }
    }

    if (customFees != null) {
        if (customFees.length === 0) {
            transaction.clearCustomFees();
        } else {
            const sdkCustomFees = customFees.map((fee) => {
                if (fee.fixedFee.denominatingTokenId) {
                    return new CustomFixedFee()
                        .setAmount(Long.fromString(fee.fixedFee.amount))
                        .setDenominatingTokenId(
                            fee.fixedFee.denominatingTokenId,
                        )
                        .setFeeCollectorAccountId(fee.feeCollectorAccountId)
                        .setAllCollectorsAreExempt(fee.feeCollectorsExempt);
                } else {
                    return new CustomFixedFee()
                        .setHbarAmount(
                            Hbar.fromTinybars(
                                Long.fromString(fee.fixedFee.amount),
                            ),
                        )
                        .setFeeCollectorAccountId(fee.feeCollectorAccountId)
                        .setAllCollectorsAreExempt(fee.feeCollectorsExempt);
                }
            });
            transaction.setCustomFees(sdkCustomFees);
        }
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

export const updateTopic = async (
    params: TopicUpdateParams,
): Promise<TopicResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildUpdateTopic(params, client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildDeleteTopic builds a TopicDeleteTransaction from parameters
const buildDeleteTopic = (
    { topicId, commonTransactionParams }: TopicDeleteParams,
    client,
): TopicDeleteTransaction => {
    const transaction = new TopicDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (topicId != null) {
        transaction.setTopicId(topicId);
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

export const deleteTopic = async (
    params: TopicDeleteParams,
): Promise<TopicResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildDeleteTopic(params, client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildSubmitTopicMessage builds a TopicMessageSubmitTransaction from parameters
export const buildSubmitTopicMessage = (
    {
        topicId,
        message,
        maxChunks,
        chunkSize,
        customFeeLimits,
        commonTransactionParams,
    }: TopicSubmitMessageParams,
    client,
): TopicMessageSubmitTransaction => {
    const transaction = new TopicMessageSubmitTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (topicId != null) {
        transaction.setTopicId(topicId);
    }

    if (message != null) {
        transaction.setMessage(message);
    }

    if (maxChunks != null) {
        transaction.setMaxChunks(maxChunks);
    }

    if (chunkSize != null) {
        transaction.setChunkSize(chunkSize);
    }

    if (customFeeLimits != null) {
        const sdkCustomFeeLimits = customFeeLimits.map((feeLimit) => {
            const customFixedFees = feeLimit.fixedFees.map((fee) => {
                if (fee.denominatingTokenId) {
                    return new CustomFixedFee()
                        .setAmount(Long.fromString(fee.amount))
                        .setDenominatingTokenId(fee.denominatingTokenId);
                } else {
                    return new CustomFixedFee().setHbarAmount(
                        Hbar.fromTinybars(Long.fromString(fee.amount)),
                    );
                }
            });
            return new CustomFeeLimit()
                .setAccountId(AccountId.fromString(feeLimit.payerId))
                .setFees(customFixedFees);
        });
        transaction.setCustomFeeLimits(sdkCustomFeeLimits);
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

export const submitTopicMessage = async (
    params: TopicSubmitMessageParams,
): Promise<TopicResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildSubmitTopicMessage(params, client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// Helper function to map TopicInfo to TopicInfoQueryResponse
const mapTopicInfoResponse = (info: TopicInfo): TopicInfoQueryResponse => {
    // Helper function to serialize custom fees
    const serializeCustomFees = (customFees: CustomFixedFee[]): any[] => {
        if (!customFees || customFees.length === 0) {
            return [];
        }
        return customFees.map((fee) => {
            return {
                feeCollectorAccountId: fee.feeCollectorAccountId?.toString(),
                allCollectorsAreExempt: fee.allCollectorsAreExempt,
                fixedFee: {
                    amount: fee.amount?.toString(),
                    denominatingTokenId:
                        fee.denominatingTokenId?.toString() || null,
                },
            };
        });
    };

    return {
        topicId: info.topicId?.toString(),
        topicMemo: info.topicMemo,
        runningHash:
            info.runningHash && info.runningHash.length > 0
                ? Buffer.from(info.runningHash).toString("hex")
                : undefined,
        sequenceNumber: info.sequenceNumber?.toString(),
        expirationTime: info.expirationTime?.seconds.toString(),
        adminKey: info.adminKey?.toString(),
        submitKey: info.submitKey?.toString(),
        feeScheduleKey: info.feeScheduleKey?.toString(),
        feeExemptKeys:
            info.feeExemptKeys && info.feeExemptKeys.length > 0
                ? info.feeExemptKeys.map((key) => key.toString())
                : undefined,
        autoRenewPeriod: info.autoRenewPeriod?.seconds.toString(),
        autoRenewAccountId: info.autoRenewAccountId?.toString(),
        customFees: serializeCustomFees(info.customFees),
        ledgerId: info.ledgerId?.toString(),
    };
};

export const getTopicInfo = async ({
    topicId,
    queryPayment,
    maxQueryPayment,
    getCost,
    sessionId,
}: GetTopicInfoParams): Promise<TopicInfoQueryResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new TopicInfoQuery().setGrpcDeadline(DEFAULT_GRPC_DEADLINE);

    if (topicId != null) {
        query.setTopicId(topicId);
    }

    if (queryPayment != null) {
        query.setQueryPayment(Hbar.fromTinybars(queryPayment));
    }

    if (maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(maxQueryPayment));
    }

    if (getCost) {
        const cost = await query.getCost(client);

        return {
            cost: cost.toTinybars().toString(),
        };
    }

    const response = await query.execute(client);

    return mapTopicInfoResponse(response);
};
