// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function deregisterConnector(props) {
    expect(
        sdk.ClprDeregisterConnectorTransaction,
        "SDK must export ClprDeregisterConnectorTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprDeregisterConnectorTransaction(props);
}

describe("ClprDeregisterConnectorMocking", function () {
    describe.each([
        ["channelId", "setChannelId", vectors.channelId],
        ["connectorId", "setConnectorId", vectors.vectors[0].connectorId],
    ])("%s Buffer copies", function (field, setter, expected) {
        it.each(["constructor", "setter"])(
            "copies input and output through the %s",
            function (path) {
                const input = Buffer.from(expected, "hex");
                const transaction =
                    path === "constructor"
                        ? deregisterConnector({ [field]: input })
                        : deregisterConnector()[setter](input);

                input.fill(0);
                expect(hex.encode(transaction[field])).toBe(expected);
                transaction[field].fill(0);
                expect(hex.encode(transaction[field])).toBe(expected);
            },
        );
    });

    it("never defaults stakeRecipient to the client operator", function () {
        const transaction = deregisterConnector({
            channelId: hex.decode(vectors.channelId),
            connectorId: hex.decode(vectors.vectors[0].connectorId),
        });
        const client = sdk.Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
        try {
            client.setOperator(
                "0.0.5006",
                sdk.PrivateKey.fromStringED25519(
                    vectors.vectors[1].privateKeyOrSeed,
                ),
            );

            expect(transaction.stakeRecipient).toBeNull();
            expect(() => transaction.freezeWith(client)).toThrow(
                /stakeRecipient/,
            );
            expect(transaction.stakeRecipient).toBeNull();
            expect(transaction.isFrozen()).toBe(false);
        } finally {
            client.close();
        }
    });

    it("executes deregisterConnector over Node gRPC with the builder body and explicit stake recipient", async function () {
        const transaction = deregisterConnector({
            channelId: hex.decode(vectors.channelId),
            connectorId: hex.decode(vectors.vectors[0].connectorId),
            stakeRecipient: sdk.AccountId.fromString("2.3.9007199254740993"),
        })
            .setTransactionMemo("deregister connector")
            .setMaxAttempts(1);
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
                "/proto.ClprService/deregisterConnector",
            ]);
            const sent = proto.TransactionList.decode(transaction.toBytes());
            const builder = proto.SignedTransaction.decode(
                sent.transactionList[0].signedTransactionBytes,
            );
            expect(received.bodyBytes).toEqual(builder.bodyBytes);
            expect(Mocker.verifySignatures(received)).toBe(true);
            const body = proto.TransactionBody.decode(received.bodyBytes);
            expect(body.data).toBe("clprDeregisterConnector");
            expect(
                Uint8Array.from(body.clprDeregisterConnector.channelId),
            ).toEqual(transaction.channelId);
            expect(
                Uint8Array.from(body.clprDeregisterConnector.connectorId),
            ).toEqual(transaction.connectorId);
            const recipient = sdk.AccountId._fromProtobuf(
                body.clprDeregisterConnector.stakeRecipient,
            );
            expect(recipient.toString()).toBe("2.3.9007199254740993");
            expect(recipient.equals(transaction.stakeRecipient)).toBe(true);
            expect(recipient.equals(mock.client.operatorAccountId)).toBe(false);
            expect(body.memo).toBe("deregister connector");
            expect(response.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            const receipt = await response.getReceipt(mock.client);
            expect(receipt.status).toBe(sdk.Status.Success);
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                "/proto.ClprService/deregisterConnector",
                "/proto.CryptoService/getTransactionReceipts",
            ]);
        } finally {
            mock?.client.close();
            mock?.servers.close();
            unaryRequests.mockRestore();
        }
    });
});
