import { ScheduleInfo } from "@hiero-ledger/sdk";

import { ScheduleInfoQueryResponse } from "../../response/schedule";

export const mapScheduleInfoResponse = (
    info: ScheduleInfo,
): ScheduleInfoQueryResponse => {
    return {
        scheduleId: info.scheduleId?.toString(),
        creatorAccountId: info.creatorAccountId?.toString(),
        payerAccountId: info.payerAccountId?.toString(),
        adminKey: info.adminKey?.toString(),
        signers: info.signers?.toArray().map((key) => key.toString()),
        scheduleMemo: info.scheduleMemo,
        expirationTime: info.expirationTime?.toString(),
        executedAt: info.executed?.toString(),
        deletedAt: info.deleted?.toString(),
        scheduledTransactionId: info.scheduledTransactionId?.toString(),
        waitForExpiry: info.waitForExpiry,
    };
};
