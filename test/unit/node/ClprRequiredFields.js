// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import {
    AccountId,
    Client,
    Transaction,
    TransactionId,
} from "../../../src/index.js";

describe("CLPR required fields before execution", function () {
    it.each([
        ["clprCloseChannel", "channelId", {}],
        ["clprSubmitBundle", "channelId", {}],
        [
            "clprDeregisterConnector",
            "stakeRecipient",
            { channelId: new Uint8Array(32), connectorId: new Uint8Array(32) },
        ],
        ["clprUpdateLedgerConfiguration", "throttles", {}],
    ])(
        "rejects a frozen decoded %s without %s before any RPC",
        async function (kind, field, data) {
            const bodyBytes = proto.TransactionBody.encode({
                transactionID: TransactionId.fromString(
                    "0.0.5006@1596210382.0",
                )._toProtobuf(),
                nodeAccountID: new AccountId(3)._toProtobuf(),
                transactionValidDuration: { seconds: 120 },
                [kind]: data,
            }).finish();
            const encoded = proto.TransactionList.encode({
                transactionList: [
                    {
                        signedTransactionBytes: proto.SignedTransaction.encode({
                            bodyBytes,
                        }).finish(),
                    },
                ],
            }).finish();
            const transaction =
                Transaction.fromBytes(encoded).setMaxAttempts(1);
            const client = Client.forNetwork({ "127.0.0.1:50211": "0.0.3" });
            client.setGrpcDeadline(100);
            const rpc = vi
                .spyOn(GrpcClient.prototype, "makeUnaryRequest")
                .mockImplementation(() => {
                    throw new Error("RPC must not be reached");
                });
            try {
                expect(transaction.isFrozen()).toBe(true);
                await expect(transaction.execute(client)).rejects.toThrow(
                    new RegExp(field),
                );
                expect(rpc).not.toHaveBeenCalled();
                expect(transaction.toBytes()).toEqual(encoded);
            } finally {
                rpc.mockRestore();
                client.close();
            }
        },
    );
});
