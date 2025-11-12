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
} from "@hiero-ledger/sdk";
import Long from "long";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import {
    TopicCreateParams,
    TopicUpdateParams,
    TopicDeleteParams,
    TopicSubmitMessageParams,
} from "../params/topic";

import { sdk } from "../sdk_data";
import { TopicResponse } from "../response/topic";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { getKeyFromString } from "../utils/key";

// buildCreateTopic builds a TopicCreateTransaction from parameters
export const buildCreateTopic = ({
    memo,
    adminKey,
    submitKey,
    autoRenewPeriod,
    autoRenewAccountId,
    feeScheduleKey,
    feeExemptKeys,
    customFees,
    commonTransactionParams,
}: TopicCreateParams): TopicCreateTransaction => {
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
            sdk.getClient(),
        );
    }

    return transaction;
};

export const createTopic = async (
    params: TopicCreateParams,
): Promise<TopicResponse> => {
    const transaction = buildCreateTopic(params);

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    return {
        topicId: receipt.topicId?.toString(),
        status: receipt.status.toString(),
    };
};

// buildUpdateTopic builds a TopicUpdateTransaction from parameters
const buildUpdateTopic = ({
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
}: TopicUpdateParams): TopicUpdateTransaction => {
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
        console.log("adminKey in updateTopic", adminKey);
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (submitKey != null) {
        transaction.setSubmitKey(getKeyFromString(submitKey));
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (autoRenewAccountId != null) {
        console.log("autoRenewAccountId in updateTopic", autoRenewAccountId);
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
            sdk.getClient(),
        );
    }

    return transaction;
};

export const updateTopic = async (
    params: TopicUpdateParams,
): Promise<TopicResponse> => {
    const transaction = buildUpdateTopic(params);

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

// buildDeleteTopic builds a TopicDeleteTransaction from parameters
const buildDeleteTopic = ({
    topicId,
    commonTransactionParams,
}: TopicDeleteParams): TopicDeleteTransaction => {
    const transaction = new TopicDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (topicId != null) {
        console.log("topicId in deleteTopic", topicId);
        transaction.setTopicId(topicId);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    return transaction;
};

export const deleteTopic = async (
    params: TopicDeleteParams,
): Promise<TopicResponse> => {
    const transaction = buildDeleteTopic(params);

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

// buildSubmitTopicMessage builds a TopicMessageSubmitTransaction from parameters
export const buildSubmitTopicMessage = ({
    topicId,
    message,
    maxChunks,
    chunkSize,
    customFeeLimits,
    commonTransactionParams,
}: TopicSubmitMessageParams): TopicMessageSubmitTransaction => {
    const transaction = new TopicMessageSubmitTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (topicId != null) {
        transaction.setTopicId(topicId);
    }

    if (message != null) {
        transaction.setMessage(message);
    } else {
        throw new Error("Message is required");
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
            sdk.getClient(),
        );
    }

    return transaction;
};

export const submitTopicMessage = async (
    params: TopicSubmitMessageParams,
): Promise<TopicResponse> => {
    const transaction = buildSubmitTopicMessage(params);

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};
