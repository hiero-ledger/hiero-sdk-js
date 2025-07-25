import {
    TopicCreateTransaction,
    Timestamp,
    CustomFixedFee,
    Hbar,
} from "@hashgraph/sdk";
import Long from "long";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import { TopicCreateParams } from "../params/topic";

import { sdk } from "../sdk_data";
import { TopicResponse } from "../response/topic";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { getKeyFromString } from "../utils/key";

export const createTopic = async ({
    memo,
    adminKey,
    submitKey,
    autoRenewPeriod,
    autoRenewAccountId,
    feeScheduleKey,
    feeExemptKeys,
    customFees,
    commonTransactionParams,
}: TopicCreateParams): Promise<TopicResponse> => {
    const transaction = new TopicCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );
    // TODO: remove this
    transaction.setMaxTransactionFee(new Hbar(50));

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

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    return {
        topicId: receipt.topicId?.toString(),
        status: receipt.status.toString(),
    };
};
