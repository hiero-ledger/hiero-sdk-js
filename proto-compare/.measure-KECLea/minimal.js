
import { FileAppendTransactionBody } from "@hiero-ledger/proto/minimal";
const body = FileAppendTransactionBody.encode(
    FileAppendTransactionBody.fromPartial({
        fileID: { shardNum: 0n, realmNum: 0n, fileNum: 42n },
        contents: new Uint8Array([1, 2, 3]),
    }),
).finish();
globalThis.__result = body.length;
