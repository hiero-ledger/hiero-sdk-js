import {
    AccountCreateTransaction,
    AccountId,
    FileAppendTransaction,
    FileId,
    Hbar,
    PrivateKey,
    TransactionId,
} from "@hashgraph/sdk";

import { useEffect, useState } from "react";

const TransactionBody = ({ transaction }) => {
    const [accountCreateTransaction, setAccountCreateTransaction] =
        useState(null);
    const [fileAppendTransaction, setFileAppendTransaction] = useState(null);
    const [transactionSize, setTransactionSize] = useState(null);

    useEffect(() => {
        if (transaction === "accountCreate" && accountCreateTransaction) {
            accountCreateTransaction.size.then((size) => {
                setTransactionSize(size);
            });
        }
        if (transaction === "fileAppend" && fileAppendTransaction) {
            fileAppendTransaction.size.then((size) => {
                setTransactionSize(size);
            });
        }
    }, [transaction, accountCreateTransaction, fileAppendTransaction]);

    useEffect(() => {
        const tx = new AccountCreateTransaction()
            .setAccountMemo("test")
            .setKeyWithoutAlias(PrivateKey.generateECDSA())
            .setNodeAccountIds([AccountId.fromString("0.0.1")])
            .setTransactionId(
                TransactionId.generate(AccountId.fromString("0.0.1")),
            )
            .setInitialBalance(Hbar.fromString("1000000000000000000"))
            .freeze();

        setAccountCreateTransaction(tx);
    }, []);

    useEffect(() => {
        const tx = new FileAppendTransaction()
            .setFileId(FileId.fromString("0.0.1"))
            .setChunkSize(1)
            .setContents("00")
            .setNodeAccountIds([AccountId.fromString("0.0.1")])
            .setTransactionId(
                TransactionId.generate(AccountId.fromString("0.0.1")),
            )
            .freeze();
        setFileAppendTransaction(tx);
    }, []);

    if (transaction === "fileAppend" && fileAppendTransaction) {
        return (
            <>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        FileAppendTransaction Details
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Content:
                            </span>
                            <span className="text-gray-800">00</span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Node AccountIds:
                            </span>
                            <span className="text-gray-800">
                                {fileAppendTransaction.nodeAccountIds.toString()}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                TransactionId:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {fileAppendTransaction.transactionId.toString()}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                FileId:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {fileAppendTransaction.fileId.toString()}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Chunk Size:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {fileAppendTransaction.chunkSize}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium underline text-gray-600 underline">
                                Body size of a chunk:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {fileAppendTransaction.bodySizeAllChunks.map(
                                    (chunk) => chunk + " bytes ",
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </>
        );
    } else if (transaction === "accountCreate" && accountCreateTransaction) {
        return (
            <>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        AccountCreateTransaction Details
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Memo:
                            </span>
                            <span className="text-gray-800">
                                {accountCreateTransaction.accountMemo}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Initial Balance:
                            </span>
                            <span className="text-gray-800">
                                {accountCreateTransaction.initialBalance.toString()}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Key:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {accountCreateTransaction.key
                                    ? accountCreateTransaction.key.toString()
                                    : "No key"}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                Node AccountIds:
                            </span>
                            <span className="text-gray-800">
                                {accountCreateTransaction.nodeAccountIds.toString()}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium text-gray-600">
                                TransactionId:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {accountCreateTransaction.transactionId.toString()}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium underline text-gray-600">
                                Body Size:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {accountCreateTransaction.bodySize} bytes
                            </span>
                        </div>
                        <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                            <span className="font-medium underline text-gray-600">
                                TotalSize:
                            </span>
                            <span className="text-gray-800 truncate max-w-[240px]">
                                {transactionSize} bytes
                            </span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return <div>Loading...</div>;
};

export default TransactionBody;
