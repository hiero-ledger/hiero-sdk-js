import { proto } from "@hiero-ledger/proto";
import Long from "long";

export const CLPR_RPC_CASES = [
    ...[
        "registerChannel",
        "completeChannel",
        "closeChannel",
        "submitBundle",
        "registerConnector",
        "deregisterConnector",
        "completeConnector",
        "updateLedgerConfiguration",
    ].map((method) => ({
        method,
        requestType: proto.Transaction,
        responseType: proto.TransactionResponse,
        request: { signedTransactionBytes: new Uint8Array([1, 2, 3]) },
        response: {
            nodeTransactionPrecheckCode: 9,
            cost: Long.fromNumber(123, true),
        },
    })),
    {
        method: "getLedgerConfiguration",
        requestType: proto.Query,
        responseType: proto.Response,
        request: {
            clprGetLedgerConfiguration: { header: { responseType: 0 } },
        },
        response: {
            clprGetLedgerConfiguration: {
                header: { nodeTransactionPrecheckCode: 0 },
                configuration: { protocolVersion: 1, chainId: "test-ledger" },
                configurationStateProof: new Uint8Array([4, 5, 6]),
            },
        },
    },
    {
        method: "getEndpointManifest",
        requestType: proto.Query,
        responseType: proto.Response,
        request: {
            clprGetEndpointManifest: { header: { responseType: 0 } },
        },
        response: {
            clprGetEndpointManifest: {
                header: { nodeTransactionPrecheckCode: 0 },
                manifest: {
                    version: Long.fromNumber(42, true),
                    serviceAddress: new Uint8Array([7, 8, 9]),
                },
                manifestStateProof: new Uint8Array([10, 11, 12]),
            },
        },
    },
];
