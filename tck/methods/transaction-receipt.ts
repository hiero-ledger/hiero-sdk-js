import { TransactionReceiptQuery, TransactionReceipt } from "@hiero-ledger/sdk";

import { sdk } from "../sdk_data";
import { GetTransactionReceiptParams } from "../params/transaction-receipt";
import { TransactionReceiptResponse } from "../response/transaction-receipt";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";

const mapTransactionReceiptResponse = (
    receipt: TransactionReceipt,
): TransactionReceiptResponse => {
    return {
        status: receipt.status.toString(),
        accountId: receipt.accountId?.toString() ?? null,
        fileId: receipt.fileId?.toString() ?? null,
        contractId: receipt.contractId?.toString() ?? null,
        topicId: receipt.topicId?.toString() ?? null,
        tokenId: receipt.tokenId?.toString() ?? null,
        scheduleId: receipt.scheduleId?.toString() ?? null,
        exchangeRate: receipt.exchangeRate
            ? {
                  hbars: receipt.exchangeRate.hbars,
                  cents: receipt.exchangeRate.cents,
                  expirationTime:
                      receipt.exchangeRate.expirationTime?.toISOString() ??
                      null,
              }
            : null,
        topicSequenceNumber:
            receipt.topicSequenceNumber?.toString() ?? null,
        topicRunningHash: receipt.topicRunningHash
            ? Buffer.from(receipt.topicRunningHash).toString("hex")
            : null,
        totalSupply: receipt.totalSupply?.toString() ?? null,
        scheduledTransactionId:
            receipt.scheduledTransactionId?.toString() ?? null,
        serials: receipt.serials.map((s) => s.toString()),
        duplicates: receipt.duplicates.map(mapTransactionReceiptResponse),
        children: receipt.children.map(mapTransactionReceiptResponse),
        nodeId: receipt.nodeId?.toString() ?? null,
    };
};

export const getTransactionReceipt = async ({
    transactionId,
    includeDuplicates,
    includeChildren,
    validateStatus,
    sessionId,
}: GetTransactionReceiptParams): Promise<TransactionReceiptResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new TransactionReceiptQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (transactionId != null) {
        query.setTransactionId(transactionId);
    }

    if (includeDuplicates != null) {
        query.setIncludeDuplicates(includeDuplicates);
    }

    if (includeChildren != null) {
        query.setIncludeChildren(includeChildren);
    }

    if (validateStatus != null) {
        query.setValidateStatus(validateStatus);
    }

    const receipt = await query.execute(client);
    return mapTransactionReceiptResponse(receipt);
};
