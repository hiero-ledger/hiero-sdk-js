// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function registerConnector(props) {
    expect(
        sdk.ClprRegisterConnectorTransaction,
        "SDK must export ClprRegisterConnectorTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprRegisterConnectorTransaction(props);
}

function signedBody(transaction) {
    const list = proto.TransactionList.decode(transaction.toBytes());
    return proto.SignedTransaction.decode(
        list.transactionList[0].signedTransactionBytes,
    );
}

describe("ClprRegisterConnectorMocking", function () {
    it.each(["constructor", "setter"])(
        "copies a Node Buffer commitment on input and output through the %s",
        function (path) {
            const input = Buffer.from(
                vectors.vectors[0].connectorCommitment,
                "hex",
            );
            const transaction =
                path === "constructor"
                    ? registerConnector({ commitment: input })
                    : registerConnector().setCommitment(input);

            input.fill(0);
            expect(hex.encode(transaction.commitment)).toBe(
                vectors.vectors[0].connectorCommitment,
            );
            transaction.commitment.fill(0);
            expect(hex.encode(transaction.commitment)).toBe(
                vectors.vectors[0].connectorCommitment,
            );
        },
    );

    it("executes registerConnector over Node gRPC with the builder body and gets a normal receipt", async function () {
        const transaction = registerConnector()
            .setCommitment(hex.decode(vectors.vectors[0].connectorCommitment))
            .setTransactionMemo("register connector");
        const unaryRequests = vi.spyOn(
            GrpcClient.prototype,
            "makeUnaryRequest",
        );
        let mock;
        let received;
        let submissions = 0;
        try {
            mock = await Mocker.withResponses([
                [
                    {
                        call: (request) => {
                            submissions += 1;
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
                                header: { nodeTransactionPrecheckCode: 0 },
                                receipt: {
                                    status: proto.ResponseCodeEnum.SUCCESS,
                                },
                            },
                        },
                    },
                ],
            ]);

            const response = await transaction.execute(mock.client);

            expect(submissions).toBe(1);
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                "/proto.ClprService/registerConnector",
            ]);
            expect(received.bodyBytes).toEqual(
                signedBody(transaction).bodyBytes,
            );
            expect(Mocker.verifySignatures(received)).toBe(true);
            const body = proto.TransactionBody.decode(received.bodyBytes);
            expect(body.data).toBe("clprRegisterConnector");
            expect(
                Uint8Array.from(body.clprRegisterConnector.commitment),
            ).toEqual(transaction.commitment);
            expect(body.memo).toBe("register connector");
            expect(response.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            const receipt = await response.getReceipt(mock.client);
            expect(receipt.status).toBe(sdk.Status.Success);
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                "/proto.ClprService/registerConnector",
                "/proto.CryptoService/getTransactionReceipts",
            ]);
        } finally {
            mock?.client.close();
            mock?.servers.close();
            unaryRequests.mockRestore();
        }
    });

    it("surfaces a CLPR_NOT_ENABLED receipt as the named Status and receipt error", async function () {
        const transaction = registerConnector().setCommitment(
            hex.decode(vectors.vectors[0].connectorCommitment),
        );
        let mock;
        try {
            mock = await Mocker.withResponses([
                [
                    { response: { nodeTransactionPrecheckCode: 0 } },
                    {
                        response: {
                            transactionGetReceipt: {
                                header: { nodeTransactionPrecheckCode: 0 },
                                receipt: {
                                    status: proto.ResponseCodeEnum
                                        .CLPR_NOT_ENABLED,
                                },
                            },
                        },
                    },
                ],
            ]);

            const response = await transaction.execute(mock.client);
            const error = await response
                .getReceipt(mock.client)
                .catch((err) => err);

            expect(error).toBeInstanceOf(sdk.ReceiptStatusError);
            expect(error.status).toBe(sdk.Status.ClprNotEnabled);
            expect(error.status.toString()).toBe("CLPR_NOT_ENABLED");
            expect(error.transactionReceipt.status).toBe(
                sdk.Status.ClprNotEnabled,
            );
            expect(error.message).toContain("CLPR_NOT_ENABLED");
        } finally {
            mock?.client.close();
            mock?.servers.close();
        }
    });
});
