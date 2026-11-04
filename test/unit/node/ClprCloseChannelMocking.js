// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function closeChannel(props) {
    expect(
        sdk.ClprCloseChannelTransaction,
        "SDK must export ClprCloseChannelTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprCloseChannelTransaction(props);
}

function signedBody(transaction) {
    const list = proto.TransactionList.decode(transaction.toBytes());
    return proto.SignedTransaction.decode(
        list.transactionList[0].signedTransactionBytes,
    );
}

describe("ClprCloseChannelMocking", function () {
    describe.each([
        ["channelId", "setChannelId", vectors.channelId],
        [
            "ownershipCommitment",
            "setOwnershipCommitment",
            vectors.vectors[0].channelCommitment,
        ],
    ])("%s", function (field, setter, expected) {
        it.each(["constructor", "setter"])(
            "copies a Node Buffer on input and output through the %s",
            function (path) {
                const input = Buffer.from(expected, "hex");
                const transaction =
                    path === "constructor"
                        ? closeChannel({ [field]: input })
                        : closeChannel()[setter](input);

                input.fill(255);
                expect(hex.encode(transaction[field])).toBe(expected);
                transaction[field].fill(255);
                expect(hex.encode(transaction[field])).toBe(expected);
            },
        );
    });

    it.each([false, true])(
        "executes closeChannel over Node gRPC with the builder body and ownershipCommitment set to %s",
        async function (withCommitment) {
            const transaction = closeChannel()
                .setChannelId(hex.decode(vectors.channelId))
                .setTransactionMemo("close channel")
                .setMaxAttempts(1);
            if (withCommitment) {
                transaction.setOwnershipCommitment(
                    hex.decode(vectors.vectors[0].channelCommitment),
                );
            }
            const unaryRequests = vi.spyOn(
                GrpcClient.prototype,
                "makeUnaryRequest",
            );
            let mock;
            let received;
            try {
                mock = await Mocker.withResponses([
                    [
                        {
                            call: (request) => {
                                received = proto.SignedTransaction.decode(
                                    request.signedTransactionBytes,
                                );
                                return {
                                    nodeTransactionPrecheckCode:
                                        proto.ResponseCodeEnum.OK,
                                };
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
                                    },
                                },
                            },
                        },
                    ],
                ]);

                const response = await transaction.execute(mock.client);

                expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                    "/proto.ClprService/closeChannel",
                ]);
                expect(received.bodyBytes).toEqual(
                    signedBody(transaction).bodyBytes,
                );
                expect(Mocker.verifySignatures(received)).toBe(true);
                const body = proto.TransactionBody.decode(received.bodyBytes);
                expect(body.data).toBe("clprCloseChannel");
                expect(hex.encode(body.clprCloseChannel.channelId)).toBe(
                    vectors.channelId,
                );
                expect(
                    Object.hasOwn(body.clprCloseChannel, "ownershipCommitment"),
                ).toBe(withCommitment);
                if (withCommitment) {
                    expect(
                        hex.encode(body.clprCloseChannel.ownershipCommitment),
                    ).toBe(vectors.vectors[0].channelCommitment);
                }
                expect(body.memo).toBe("close channel");
                expect(response.transactionId.toString()).toBe(
                    transaction.transactionId.toString(),
                );
                const receipt = await response.getReceipt(mock.client);
                expect(receipt.status).toBe(sdk.Status.Success);
                expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                    "/proto.ClprService/closeChannel",
                    "/proto.CryptoService/getTransactionReceipts",
                ]);
            } finally {
                mock?.client.close();
                mock?.servers.close();
                unaryRequests.mockRestore();
            }
        },
    );
});
