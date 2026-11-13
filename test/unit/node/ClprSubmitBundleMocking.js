// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

const PAYLOAD_HEX = "00ff80000d0ac32801";

function submitBundle(props) {
    expect(
        sdk.ClprSubmitBundleTransaction,
        "SDK must export ClprSubmitBundleTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprSubmitBundleTransaction(props);
}

function signedBody(transaction) {
    const list = proto.TransactionList.decode(transaction.toBytes());
    return proto.SignedTransaction.decode(
        list.transactionList[0].signedTransactionBytes,
    );
}

describe("ClprSubmitBundleMocking", function () {
    describe.each([
        ["channelId", "setChannelId", vectors.channelId],
        ["bundlePayload", "setBundlePayload", PAYLOAD_HEX],
    ])("%s", function (field, setter, expected) {
        it.each(["constructor", "setter"])(
            "copies a Node Buffer on input and output through the %s",
            function (path) {
                const input = Buffer.from(expected, "hex");
                const transaction =
                    path === "constructor"
                        ? submitBundle({ [field]: input })
                        : submitBundle()[setter](input);

                input.fill(127);
                expect(hex.encode(transaction[field])).toBe(expected);
                transaction[field].fill(127);
                expect(hex.encode(transaction[field])).toBe(expected);
            },
        );
    });

    it("executes submitBundle over Node gRPC with only the allowed opaque builder fields", async function () {
        const transaction = submitBundle()
            .setChannelId(hex.decode(vectors.channelId))
            .setBundlePayload(hex.decode(PAYLOAD_HEX))
            .setTransactionMemo("submit bundle")
            .setMaxAttempts(1);
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
                "/proto.ClprService/submitBundle",
            ]);
            expect(received.bodyBytes).toEqual(
                signedBody(transaction).bodyBytes,
            );
            expect(Mocker.verifySignatures(received)).toBe(true);
            const body = proto.TransactionBody.decode(received.bodyBytes);
            expect(body.data).toBe("clprSubmitBundle");
            expect(Object.keys(body.clprSubmitBundle).sort()).toEqual([
                "bundlePayload",
                "channelId",
            ]);
            expect(hex.encode(body.clprSubmitBundle.channelId)).toBe(
                vectors.channelId,
            );
            expect(hex.encode(body.clprSubmitBundle.bundlePayload)).toBe(
                PAYLOAD_HEX,
            );
            expect(body.memo).toBe("submit bundle");
            expect(response.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            const receipt = await response.getReceipt(mock.client);
            expect(receipt.status).toBe(sdk.Status.Success);
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                "/proto.ClprService/submitBundle",
                "/proto.CryptoService/getTransactionReceipts",
            ]);
        } finally {
            mock?.client.close();
            mock?.servers.close();
            unaryRequests.mockRestore();
        }
    });
});
