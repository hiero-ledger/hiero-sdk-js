import { FileInfo } from "@hiero-ledger/sdk";

import { FileInfoQueryResponse } from "../../response/file";

export const mapFileInfoResponse = (info: FileInfo): FileInfoQueryResponse => {
    return {
        fileId: info.fileId?.toString(),
        size: info.size?.toString(),
        expirationTime: info.expirationTime?.toString(),
        isDeleted: info.isDeleted,
        keys: info.keys?.toArray().map((key) => key.toString()),
        memo: info.fileMemo,
        ledgerId: info.ledgerId?.toString(),
    };
};
