import * as hex from "../../../src/encoding/hex.js";
import * as rlp from "@ethersproject/rlp";
import { proto } from "@hashgraph/proto";
import Mocker from "../Mocker.js";
import { EthereumFlow, FileId } from "../../../src/index.js";

const TRANSACTION_RECEIPT_SUCCESS_RESPONSE = {
    transactionGetReceipt: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
        },
        receipt: {
            status: proto.ResponseCodeEnum.SUCCESS,
        },
    },
};

const TRANSACTION_RESPONSE_SUCCESS = {
    nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
};

const bytes = hex.decode(
    "f864012f83018000947e3a9eaf9bcc39e2ffa38eb30bf7a93feacbc18180827653820277a0f9fbff985d374be4a55f296915002eec11ac96f1ce2df183adf992baa9390b2fa00c1e867cc960d9c74ec2e6a662b7908ec4c8cc9f3091e886bcefbeb2290fb792",
);

const callDataFileId = FileId.fromString("0.0.1");

describe("EthereumFlowMocking", function () {
    let client;
    let servers;

    afterEach(function () {
        client.close();
        servers.close();
    });

    it("doesn't truncate ethereum data if it's not long enough", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        expect(
                            transactionBody.ethereumTransaction.ethereumData,
                        ).to.deep.equal(bytes);

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
            ],
        ]));

        await (
            await new EthereumFlow().setEthereumData(bytes).execute(client)
        ).getReceipt(client);
    });

    it("errors if ethereum data is not provided", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        expect(
                            transactionBody.ethereumTransaction.ethereumData,
                        ).to.deep.equal(bytes);

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
            ],
        ]));

        try {
            await new EthereumFlow().execute(client);
        } catch (error) {
            if (
                !error.message.startsWith(
                    "cannot submit ethereum transaction with no ethereum data",
                )
            ) {
                throw error;
            }
        }
    });

    it("extracts the calldata if it's too large", async function () {
        const decoded = rlp.decode(bytes);
        const longCallData = "0x" + "00".repeat(133121);
        decoded[5] = longCallData;
        const encoded = hex.decode(rlp.encode(decoded));
        decoded[5] = "0x";
        const encodedWithoutCallData = hex.decode(rlp.encode(decoded));

        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileCreate = transactionBody.fileCreate;
                        expect(
                            `0x${fileCreate.contents.toString()}`,
                        ).to.deep.equal(
                            // includes 0x prefix
                            longCallData.substring(0, 4098),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileAppend = transactionBody.fileAppend;
                        expect(fileAppend.contents.toString()).to.deep.equal(
                            longCallData.substring(4098, 8194),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                // Yes, you need 4 receipt responses here. One happens in
                // `FileAppendTransaction.executeAll()` in a loop, and the next
                // is for `TransactionResponse.getReceipt()`
                ...Array(130).fill({
                    response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE,
                }),
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const ethereumTransaction =
                            transactionBody.ethereumTransaction;
                        expect(ethereumTransaction.ethereumData).to.deep.equal(
                            encodedWithoutCallData,
                        );
                        expect(
                            FileId._fromProtobuf(
                                ethereumTransaction.callData,
                            ).toString(),
                        ).to.equal(callDataFileId.toString());

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
            ],
        ]));

        await (
            await new EthereumFlow()
                .setEthereumData(encoded)
                .setMaxChunks(131)
                .execute(client)
        ).getReceipt(client);
    });

    it("extracts the calldata if it's too large and try to deploy it by chunks, but thrown", async function () {
        const decoded = rlp.decode(bytes);
        const longCallData = "0x" + "00".repeat(7000);
        decoded[5] = longCallData;
        const encoded = hex.decode(rlp.encode(decoded));
        decoded[5] = "0x";
        const encodedWithoutCallData = hex.decode(rlp.encode(decoded));

        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileCreate = transactionBody.fileCreate;
                        expect(
                            `0x${fileCreate.contents.toString()}`,
                        ).to.deep.equal(
                            // includes 0x prefix
                            longCallData.substring(0, 4098),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileAppend = transactionBody.fileAppend;
                        expect(fileAppend.contents.toString()).to.deep.equal(
                            longCallData.substring(4098, 8194),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileAppend = transactionBody.fileAppend;
                        expect(fileAppend.contents.toString()).to.deep.equal(
                            longCallData.substring(8194, 12290),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                // Yes, you need 4 receipt responses here. One happens in
                // `FileAppendTransaction.executeAll()` in a loop, and the next
                // is for `TransactionResponse.getReceipt()`
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const ethereumTransaction =
                            transactionBody.ethereumTransaction;
                        expect(ethereumTransaction.ethereumData).to.deep.equal(
                            encodedWithoutCallData,
                        );
                        expect(
                            FileId._fromProtobuf(
                                ethereumTransaction.callData,
                            ).toString(),
                        ).to.equal(callDataFileId.toString());

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
            ],
        ]));

        let error = null;
        try {
            await new EthereumFlow()
                .setEthereumData(encoded)
                .setMaxChunks(2)
                .execute(client);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.an("Error");
    });

    it("extracts the calldata if it's too large and deploy it by the right amount of chunks", async function () {
        const decoded = rlp.decode(bytes);
        const longCallData = "0x" + "00".repeat(133121);
        decoded[5] = longCallData;
        const encoded = hex.decode(rlp.encode(decoded));
        decoded[5] = "0x";
        const encodedWithoutCallData = hex.decode(rlp.encode(decoded));

        ({ client, servers } = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileCreate = transactionBody.fileCreate;

                        expect(
                            `0x${fileCreate.contents.toString()}`,
                        ).to.deep.equal(
                            // includes 0x prefix
                            longCallData.substring(0, 4098),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileAppend = transactionBody.fileAppend;
                        expect(fileAppend.contents.toString()).to.deep.equal(
                            longCallData.substring(4098, 8194),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const fileAppend = transactionBody.fileAppend;
                        expect(fileAppend.contents.toString()).to.deep.equal(
                            longCallData.substring(8194, 12290),
                        );

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                {
                    response: {
                        transactionGetReceipt: {
                            header: {
                                nodeTransactionPrecheckCode:
                                    proto.ResponseCodeEnum.OK,
                            },
                            receipt: {
                                status: proto.ResponseCodeEnum.SUCCESS,
                                fileID: callDataFileId._toProtobuf(),
                            },
                        },
                    },
                },
                // Yes, you need 4 receipt responses here. One happens in
                // `FileAppendTransaction.executeAll()` in a loop, and the next
                // is for `TransactionResponse.getReceipt()`
                ...Array(130).fill({
                    response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE,
                }),
                {
                    call: (request) => {
                        const transactionBody = proto.TransactionBody.decode(
                            proto.SignedTransaction.decode(
                                request.signedTransactionBytes,
                            ).bodyBytes,
                        );

                        const ethereumTransaction =
                            transactionBody.ethereumTransaction;
                        expect(ethereumTransaction.ethereumData).to.deep.equal(
                            encodedWithoutCallData,
                        );
                        expect(
                            FileId._fromProtobuf(
                                ethereumTransaction.callData,
                            ).toString(),
                        ).to.equal(callDataFileId.toString());

                        return { response: TRANSACTION_RESPONSE_SUCCESS };
                    },
                },
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
            ],
        ]));

        await (
            await new EthereumFlow()
                .setEthereumData(encoded)
                .setMaxChunks(131)
                .execute(client)
        ).getReceipt(client);
    });
});
