
import { proto } from "@hiero-ledger/proto";
const body = proto.FileAppendTransactionBody.encode(
    proto.FileAppendTransactionBody.create({
        fileID: { shardNum: 0, realmNum: 0, fileNum: 42 },
        contents: new Uint8Array([1, 2, 3]),
    }),
).finish();
globalThis.__result = body.length;
