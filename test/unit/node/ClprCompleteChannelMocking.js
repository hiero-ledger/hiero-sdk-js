// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

function completeChannel(props) {
    expect(
        sdk.ClprCompleteChannelTransaction,
        "SDK must export ClprCompleteChannelTransaction",
    ).toBeTypeOf("function");
    return new sdk.ClprCompleteChannelTransaction(props);
}

describe("ClprCompleteChannelMocking", function () {
    for (const [field, setter, value] of [
        ["channelId", "setChannelId", vectors.channelId],
        ["configProofBytes", "setConfigProofBytes", "ff0007"],
        [
            "endpointManifestProofBytes",
            "setEndpointManifestProofBytes",
            "800009ff",
        ],
    ]) {
        it.each(["constructor", "setter"])(
            `copies a Node Buffer for ${field} through the %s`,
            function (path) {
                const input = Buffer.from(value, "hex");
                const transaction =
                    path === "constructor"
                        ? completeChannel({ [field]: input })
                        : completeChannel()[setter](input);

                input.fill(0);
                expect(hex.encode(transaction[field])).toBe(value);
                transaction[field].fill(0);
                expect(hex.encode(transaction[field])).toBe(value);
            },
        );
    }

    it.each(vectors.vectors)(
        "executes completeChannel over Node gRPC with the $signatureScheme proof, verifier and opaque bytes",
        async function (vector) {
            const key =
                vector.signatureScheme === "ECDSA_SECP256K1"
                    ? sdk.PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
                    : sdk.PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
            const transaction = completeChannel()
                .setChannelId(hex.decode(vectors.channelId))
                .setOwnershipProof(key)
                .setVerifierContract(new sdk.ContractId(1, 2, 345))
                .setConfigProofBytes(new Uint8Array([255, 0, 7]))
                .setEndpointManifestProofBytes(new Uint8Array([128, 0, 9, 255]))
                .setTransactionMemo("complete channel");
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
                    "/proto.ClprService/completeChannel",
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
                expect(body.data).toBe("clprCompleteChannel");
                const completion = body.clprCompleteChannel;
                expect(hex.encode(completion.channelId)).toBe(
                    vectors.channelId,
                );
                expect(hex.encode(completion.publicKey)).toBe(vector.publicKey);
                expect(new Uint8Array(completion.signature)).toEqual(
                    transaction.signature,
                );
                expect(completion.signatureScheme).toBe(
                    transaction.signatureScheme.valueOf(),
                );
                expect(
                    sdk.ContractId._fromProtobuf(
                        completion.verifierContract,
                    ).toString(),
                ).toBe("1.2.345");
                expect(new Uint8Array(completion.configProofBytes)).toEqual(
                    transaction.configProofBytes,
                );
                expect(
                    new Uint8Array(completion.endpointManifestProofBytes),
                ).toEqual(transaction.endpointManifestProofBytes);
                expect(body.memo).toBe("complete channel");
                expect(response.transactionId.toString()).toBe(
                    transaction.transactionId.toString(),
                );
                const receipt = await response.getReceipt(mock.client);
                expect(receipt.status).toBe(sdk.Status.Success);
            } finally {
                mock?.client.close();
                mock?.servers.close();
                unaryRequests.mockRestore();
            }
        },
    );
});
