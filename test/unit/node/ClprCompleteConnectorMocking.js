// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function completeConnector(props) {
    expect(
        sdk.ClprCompleteConnectorTransaction,
        "SDK must export ClprCompleteConnectorTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprCompleteConnectorTransaction(props);
}

function privateKey(vector) {
    return vector.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
}

describe("ClprCompleteConnectorMocking", function () {
    for (const [field, setter, value] of [
        ["channelId", "setChannelId", vectors.channelId],
        ["connectorId", "setConnectorId", vectors.vectors[1].connectorId],
        ["salt", "setSalt", vectors.salt],
    ]) {
        it.each(["constructor", "setter"])(
            `copies a Node Buffer for ${field} through the %s`,
            function (path) {
                const input = Buffer.from(value, "hex");
                const transaction =
                    path === "constructor"
                        ? completeConnector({ [field]: input })
                        : completeConnector()[setter](input);

                input.fill(0);
                expect(hex.encode(transaction[field])).toBe(value);
                transaction[field].fill(0);
                expect(hex.encode(transaction[field])).toBe(value);
            },
        );
    }

    it.each(vectors.vectors)(
        "executes completeConnector over Node gRPC with the $signatureScheme proof, threshold admin key, contract and stake",
        async function (vector) {
            const adminKey = new sdk.KeyList(
                vectors.vectors.map((value) => privateKey(value).publicKey),
                1,
            );
            const transaction = completeConnector()
                .setChannelId(hex.decode(vectors.channelId))
                .setConnectorId(hex.decode(vector.connectorId))
                .setSalt(hex.decode(vectors.salt))
                .setOwnershipProof(privateKey(vector))
                .setAdminKey(adminKey)
                .setConnectorContract(new sdk.ContractId(1, 2, 345))
                .setLockedStake(sdk.Hbar.fromTinybars("9223372036854775807"))
                .setTransactionMemo("complete connector");
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
                    "/proto.ClprService/completeConnector",
                ]);
                const list = proto.TransactionList.decode(
                    transaction.toBytes(),
                );
                const sent = proto.SignedTransaction.decode(
                    list.transactionList[0].signedTransactionBytes,
                );
                expect(received.bodyBytes).toEqual(sent.bodyBytes);
                expect(Mocker.verifySignatures(received)).toBe(true);
                const body = proto.TransactionBody.decode(received.bodyBytes);
                expect(body.data).toBe("clprCompleteConnector");
                const completion = body.clprCompleteConnector;
                expect(hex.encode(completion.channelId)).toBe(
                    vectors.channelId,
                );
                expect(hex.encode(completion.connectorId)).toBe(
                    vector.connectorId,
                );
                expect(hex.encode(completion.salt)).toBe(vectors.salt);
                expect(hex.encode(completion.publicKey)).toBe(vector.publicKey);
                expect(new Uint8Array(completion.signature)).toEqual(
                    transaction.signature,
                );
                expect(completion.signatureScheme).toBe(
                    transaction.signatureScheme.valueOf(),
                );
                expect(
                    sdk.Key._fromProtobufKey(completion.adminKey).toString(),
                ).toBe(adminKey.toString());
                expect(
                    sdk.ContractId._fromProtobuf(
                        completion.connectorContract,
                    ).toString(),
                ).toBe("1.2.345");
                expect(completion.lockedStake.unsigned).toBe(true);
                expect(completion.lockedStake.toString()).toBe(
                    "9223372036854775807",
                );
                expect(body.memo).toBe("complete connector");
                expect(response.transactionId.toString()).toBe(
                    transaction.transactionId.toString(),
                );
                const receipt = await response.getReceipt(mock.client);
                expect(receipt.status).toBe(sdk.Status.Success);
                expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                    "/proto.ClprService/completeConnector",
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
