// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import { makeLedgerConfigurationResponse } from "../utils/ClprLedgerConfiguration.js";

describe("ClprUpdateLedgerConfigurationMocking", function () {
    it("reads configuration then executes a throttles-only update over Node gRPC and gets a receipt", async function () {
        expect(
            sdk.ClprUpdateLedgerConfigurationTransaction,
            "SDK must export ClprUpdateLedgerConfigurationTransaction",
        ).toBeTypeOf("function");
        const configurationResponse = makeLedgerConfigurationResponse();
        configurationResponse.configuration.throttles.maxSyncBytes =
            Long.fromString("18446744073709551615", true);
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
                        response: {
                            clprGetLedgerConfiguration: configurationResponse,
                        },
                    },
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

            const info = await new sdk.ClprGetLedgerConfigurationQuery()
                .setMaxAttempts(1)
                .execute(mock.client);
            expect(info).toBeInstanceOf(sdk.ClprLedgerConfigurationInfo);
            const current = info.throttles;
            const throttles = sdk.ClprThrottles.of({
                maxMessagesPerBundle: current.maxMessagesPerBundle,
                maxMessagePayloadBytes: current.maxMessagePayloadBytes,
                maxGasPerMessage: current.maxGasPerMessage,
                maxQueueDepth: 17,
                maxSyncBytes: current.maxSyncBytes,
                maxLocalEndpoints: current.maxLocalEndpoints,
                maxPeerEndpoints: current.maxPeerEndpoints,
            });
            const transaction =
                new sdk.ClprUpdateLedgerConfigurationTransaction()
                    .setThrottles(throttles)
                    .setTransactionMemo("update CLPR throttles")
                    .setMaxAttempts(1);
            const response = await transaction.execute(mock.client);

            expect(submissions).toBe(1);
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                "/proto.ClprService/getLedgerConfiguration",
                "/proto.ClprService/updateLedgerConfiguration",
            ]);
            const body = proto.TransactionBody.decode(received.bodyBytes);
            expect(body.data).toBe("clprUpdateLedgerConfiguration");
            const update = body.clprUpdateLedgerConfiguration;
            expect(Object.keys(update)).toEqual(["configuration"]);
            expect(Object.keys(update.configuration)).toEqual(["throttles"]);
            expect(update).toEqual({
                configuration: {
                    throttles: {
                        ...configurationResponse.configuration.throttles,
                        maxQueueDepth: 17,
                    },
                },
            });
            expect(body.memo).toBe("update CLPR throttles");
            expect(Mocker.verifySignatures(received)).toBe(true);
            expect(response.transactionId.toString()).toBe(
                transaction.transactionId.toString(),
            );
            const receipt = await response.getReceipt(mock.client);
            expect(receipt.status).toBe(sdk.Status.Success);
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                "/proto.ClprService/getLedgerConfiguration",
                "/proto.ClprService/updateLedgerConfiguration",
                "/proto.CryptoService/getTransactionReceipts",
            ]);
        } finally {
            mock?.client.close();
            mock?.servers.close();
            unaryRequests.mockRestore();
        }
    });
});
