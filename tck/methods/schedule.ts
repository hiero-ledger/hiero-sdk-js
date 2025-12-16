import {
    ScheduleCreateTransaction,
    Timestamp,
    AccountId,
    ScheduleSignTransaction,
    ScheduleId,
    TransactionReceiptQuery,
    Status,
    ScheduleDeleteTransaction,
    ScheduleInfoQuery,
    Hbar,
} from "@hiero-ledger/sdk";

import {
    ScheduleCreateParams,
    ScheduleDeleteParams,
    ScheduledTransaction,
    ScheduleSignParams,
    GetScheduleInfoParams,
} from "../params/schedule";
import {
    ScheduleResponse,
    ScheduleInfoQueryResponse,
} from "../response/schedule";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { sdk } from "../sdk_data";
import { getKeyFromString } from "../utils/key";
import { mapScheduleInfoResponse } from "../utils/helpers/schedule";
import Long from "long";

// Import parameter types for scheduled transactions
import { TransferCryptoParams } from "../params/transfer";
import {
    AccountAllowanceApproveParams,
    CreateAccountParams,
} from "../params/account";
import { MintTokenParams, BurnTokenParams } from "../params/token";
import { TopicSubmitMessageParams, TopicCreateParams } from "../params/topic";

// Import build functions from other method files
import {
    buildTransferCrypto,
    buildApproveAllowance,
    buildCreateAccount,
} from "./account";
import { buildMintToken, buildBurnToken } from "./token";
import { buildSubmitTopicMessage, buildCreateTopic } from "./topic";

export const createSchedule = async ({
    scheduledTransaction,
    memo,
    adminKey,
    payerAccountId,
    expirationTime,
    waitForExpiry,
    commonTransactionParams,
    sessionId,
}: ScheduleCreateParams): Promise<ScheduleResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ScheduleCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (scheduledTransaction != null) {
        const scheduledTx = buildScheduledTransaction(
            scheduledTransaction,
            client,
        );
        transaction.setScheduledTransaction(scheduledTx);
    }

    if (memo != null) {
        transaction.setScheduleMemo(memo);
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (payerAccountId != null) {
        transaction.setPayerAccountId(AccountId.fromString(payerAccountId));
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (waitForExpiry != null) {
        transaction.setWaitForExpiry(waitForExpiry);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResponse.transactionId)
        .setValidateStatus(true)
        .execute(client);

    let scheduleId: string | undefined;
    if (receipt.status === Status.Success) {
        scheduleId = receipt.scheduleId?.toString();
    }

    return {
        scheduleId: scheduleId,
        transactionId: receipt.scheduledTransactionId?.toString(),
        status: receipt.status.toString(),
    };
};

// buildScheduledTransaction creates the appropriate transaction based on method name
const buildScheduledTransaction = (
    scheduledTx: ScheduledTransaction,
    client,
): any => {
    switch (scheduledTx.method) {
        case "transferCrypto":
            const transferParams = scheduledTx.params as TransferCryptoParams;
            return buildTransferCrypto(transferParams, client);

        case "approveAllowance":
            const allowanceParams =
                scheduledTx.params as AccountAllowanceApproveParams;
            return buildApproveAllowance(allowanceParams, client);

        case "mintToken":
            const mintParams = scheduledTx.params as MintTokenParams;
            return buildMintToken(mintParams, client);

        case "burnToken":
            const burnParams = scheduledTx.params as BurnTokenParams;
            return buildBurnToken(burnParams, client);

        case "submitMessage":
            const submitParams = scheduledTx.params as TopicSubmitMessageParams;
            return buildSubmitTopicMessage(submitParams, client);

        case "createTopic":
            const topicParams = scheduledTx.params as TopicCreateParams;
            return buildCreateTopic(topicParams, client);

        case "createAccount":
            const accountParams = scheduledTx.params as CreateAccountParams;
            return buildCreateAccount(accountParams, client);

        default:
            throw new Error(
                `Unsupported scheduled transaction method: ${scheduledTx.method} (only transferCrypto, approveAllowance, mintToken, burnToken, submitMessage, createTopic, and createAccount are supported)`,
            );
    }
};

export const signSchedule = async ({
    scheduleId,
    commonTransactionParams,
    sessionId,
}: ScheduleSignParams): Promise<ScheduleResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ScheduleSignTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (scheduleId != null) {
        const scheduleID = ScheduleId.fromString(scheduleId);
        transaction.setScheduleId(scheduleID);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResponse.transactionId)
        .setValidateStatus(true)
        .execute(client);

    return {
        status: receipt.status.toString(),
    };
};

export const deleteSchedule = async ({
    scheduleId,
    commonTransactionParams,
    sessionId,
}: ScheduleDeleteParams): Promise<ScheduleResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new ScheduleDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (scheduleId != null) {
        const scheduleID = ScheduleId.fromString(scheduleId);
        transaction.setScheduleId(scheduleID);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txResponse.transactionId)
        .setValidateStatus(true)
        .execute(client);

    return {
        status: receipt.status.toString(),
    };
};

export const getScheduleInfo = async ({
    scheduleId,
    queryPayment,
    maxQueryPayment,
    getCost,
    sessionId,
}: GetScheduleInfoParams): Promise<ScheduleInfoQueryResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new ScheduleInfoQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (scheduleId != null) {
        query.setScheduleId(scheduleId);
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

    return mapScheduleInfoResponse(response);
};
