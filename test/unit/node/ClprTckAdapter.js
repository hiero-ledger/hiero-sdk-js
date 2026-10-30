// SPDX-License-Identifier: Apache-2.0

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import { fileURLToPath } from "node:url";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import { vi } from "vitest";
import Mocker from "../Mocker.js";
import vectors from "../utils/ClprOwnershipVectors.js";
import { makeLedgerConfigurationResponse } from "../utils/ClprLedgerConfiguration.js";
import { makeEndpointManifestResponse } from "../utils/ClprEndpointManifest.js";

// Load the CommonJS TCK in its own package context, as its server does.
const tckRequire = createRequire(
    new URL("../../../tck/package.json", import.meta.url),
);
tckRequire("ts-node").register({
    project: fileURLToPath(
        new URL("../../../tck/tsconfig.json", import.meta.url),
    ),
    transpileOnly: true,
});
const sdk = tckRequire("@hiero-ledger/sdk");
const registry = tckRequire("./sdk_data.ts").sdk;
const methods = tckRequire("./methods/index.ts").default;
const express = tckRequire("express");
const { Client: GrpcClient } = tckRequire("@grpc/grpc-js");
const { convertToKeyListHex } = tckRequire("./utils/key.ts");
const { CustomError } = tckRequire("./utils/custom-error.ts");

// Keep the real HTTP handler and JSON-RPC middleware, without binding a socket.
let app;
const listen = vi
    .spyOn(express.application, "listen")
    .mockImplementation(function () {
        app = this;
    });
try {
    tckRequire("./server.ts");
} finally {
    listen.mockRestore();
}

function rpc(method, params) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const socket = new Duplex({
            read() {},
            write(chunk, _encoding, callback) {
                chunks.push(Buffer.from(chunk));
                callback();
            },
        });
        const request = new IncomingMessage(socket);
        const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
        request.method = "POST";
        request.url = "/";
        request.complete = true;
        request.headers = {
            "content-type": "application/json",
            "content-length": String(Buffer.byteLength(body)),
        };
        const response = new ServerResponse(request);
        response.assignSocket(socket);
        response.on("finish", () => {
            try {
                const output = Buffer.concat(chunks).toString();
                resolve(
                    JSON.parse(output.slice(output.indexOf("\r\n\r\n") + 4)),
                );
            } catch (error) {
                reject(error);
            } finally {
                socket.destroy();
            }
        });
        socket.on("error", reject);
        app(request, response);
        request.push(body);
        request.push(null);
    });
}

const sessionId = "clpr-adapter";
const uint64Max = "18446744073709551615";
const stake = "9223372036854775807";
const vector = vectors.vectors[0];
const ownershipKey = (value) =>
    value.signatureScheme === "ECDSA_SECP256K1"
        ? sdk.PrivateKey.fromStringECDSA(value.privateKeyOrSeed)
        : sdk.PrivateKey.fromStringED25519(value.privateKeyOrSeed);
const signer = ownershipKey(vectors.vectors[1]);
const hex = (value) => Buffer.from(value).toString("hex");
const throttleParams = {
    maxMessagesPerBundle: 8,
    maxMessagePayloadBytes: 1024,
    maxGasPerMessage: "9007199254740993",
    maxQueueDepth: 16,
    maxSyncBytes: uint64Max,
    maxLocalEndpoints: 0,
    maxPeerEndpoints: 0,
};
const transactionCases = [
    [
        "registerClprChannel",
        "registerChannel",
        { ownershipCommitment: vector.channelCommitment },
    ],
    [
        "completeClprChannel",
        "completeChannel",
        {
            channelId: vectors.channelId,
            ownershipPrivateKey: ownershipKey(vector).toStringDer(),
            verifierContract: "1.2.345",
            configProofBytes: "ff0007",
            endpointManifestProofBytes: "",
        },
    ],
    [
        "closeClprChannel",
        "closeChannel",
        {
            channelId: vectors.channelId,
            ownershipCommitment: vector.channelCommitment,
        },
    ],
    [
        "submitClprBundle",
        "submitBundle",
        { channelId: vectors.channelId, bundlePayload: "ff00807f" },
    ],
    [
        "registerClprConnector",
        "registerConnector",
        { commitment: vector.connectorCommitment },
    ],
    [
        "completeClprConnector",
        "completeConnector",
        {
            channelId: vectors.channelId,
            connectorId: vector.connectorId,
            salt: vectors.salt,
            ownershipPrivateKey: ownershipKey(vector).toStringDer(),
            connectorContract: "1.2.346",
            adminKey: signer.publicKey.toStringDer(),
            lockedStake: stake,
        },
    ],
    [
        "deregisterClprConnector",
        "deregisterConnector",
        {
            channelId: vectors.channelId,
            connectorId: vector.connectorId,
            stakeRecipient: "1.2.347",
        },
    ],
    [
        "updateClprLedgerConfiguration",
        "updateLedgerConfiguration",
        { throttles: throttleParams },
    ],
];
const queryNames = ["getClprLedgerConfiguration", "getClprEndpointManifest"];
const names = [...transactionCases.map(([name]) => name), ...queryNames];

function requireMethod(name) {
    expect(methods[name], `TCK loader must discover ${name}`).toBeTypeOf(
        "function",
    );
}

function receipt(status = proto.ResponseCodeEnum.SUCCESS) {
    return {
        response: {
            transactionGetReceipt: {
                header: { nodeTransactionPrecheckCode: 0 },
                receipt: { status },
            },
        },
    };
}

function decodeTransaction(signed) {
    return sdk.Transaction.fromBytes(
        proto.TransactionList.encode({
            transactionList: [
                {
                    signedTransactionBytes:
                        proto.SignedTransaction.encode(signed).finish(),
                },
            ],
        }).finish(),
    );
}

describe("CLPR TCK adapter", function () {
    let mock;
    let client;
    let unaryRequests;

    beforeEach(function () {
        unaryRequests = vi.spyOn(GrpcClient.prototype, "makeUnaryRequest");
    });

    afterEach(function () {
        registry.removeClient(sessionId);
        registry.removeClient(`${sessionId}-other`);
        client?.close();
        mock?.client.close();
        mock?.servers.close();
        unaryRequests.mockRestore();
        client = undefined;
        mock = undefined;
    });

    async function connect(responses, withOperator = true) {
        mock = await Mocker.withResponses([responses]);
        const network = Object.fromEntries(
            Object.entries(mock.client.network).map(([address, accountId]) => [
                address.replace("0.0.0.0:", "127.0.0.1:"),
                accountId.toString(),
            ]),
        );
        client = sdk.Client.forNetwork(network, {
            scheduleNetworkUpdate: false,
        }).setMaxAttempts(1);
        if (withOperator) client.setOperator("0.0.1854", signer);
        registry.setClient(client, sessionId);
        registry.setClient(
            sdk.Client.forNetwork(
                { "127.0.0.1:1": "0.0.4" },
                { scheduleNetworkUpdate: false },
            ),
            `${sessionId}-other`,
        );
    }

    async function submit(
        name,
        params,
        status = proto.ResponseCodeEnum.SUCCESS,
    ) {
        requireMethod(name);
        let signed;
        let body;
        await connect([
            {
                call(request) {
                    signed = proto.SignedTransaction.decode(
                        request.signedTransactionBytes,
                    );
                    body = proto.TransactionBody.decode(signed.bodyBytes);
                    return { nodeTransactionPrecheckCode: 0 };
                },
            },
            receipt(status),
        ]);
        const response = await rpc(name, {
            ...params,
            sessionId,
            commonTransactionParams: {
                transactionId: "0.0.1854@1700000000.000000001",
                maxTransactionFee: 123456789,
                memo: "CLPR adapter",
                signers: [signer.toStringDer()],
            },
        });
        return { response, signed, body };
    }

    it("loads existing methods and runs the existing server without opening a socket", async function () {
        expect(methods.createNode).toBeTypeOf("function");
        const errorLog = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        try {
            const response = await rpc("getAccountInfo", {
                sessionId: "not-registered",
            });
            expect(response.error).toMatchObject({
                code: -32603,
                message: "Internal error",
                data: {
                    message: "Client not set up for session: not-registered",
                },
            });
        } finally {
            errorLog.mockRestore();
        }
    });

    it.each(names)("discovers %s through the existing loader", function (name) {
        requireMethod(name);
    });

    it("exports exactly the ten CLPR RPC methods, keeping helpers private", function () {
        for (const name of names) requireMethod(name);
        expect(Object.keys(tckRequire("./methods/clpr.ts")).sort()).toEqual(
            [...names].sort(),
        );
    });

    it.each(["methods", "params", "response"])(
        "keeps %s/clpr.ts free of raw proof setters and proto imports",
        function (folder) {
            const path = new URL(
                `../../../tck/${folder}/clpr.ts`,
                import.meta.url,
            );
            expect(existsSync(path), `TCK ${folder}/clpr.ts must exist`).toBe(
                true,
            );
            expect(readFileSync(path, "utf8")).not.toMatch(
                /@hiero-ledger\/proto|setPublicKey|setSignature|setSignatureScheme/,
            );
        },
    );

    it.each([
        [
            "completeClprChannel",
            { ownershipPrivateKey: undefined },
            "ownershipPrivateKey must be a private key string",
        ],
        [
            "completeClprConnector",
            { ownershipPrivateKey: undefined },
            "ownershipPrivateKey must be a private key string",
        ],
        [
            "completeClprChannel",
            { ownershipPrivateKey: signer.publicKey.toStringDer() },
            "ownershipPrivateKey must be a private key string",
        ],
        [
            "completeClprChannel",
            { ownershipPrivateKey: "ff" },
            "ownershipPrivateKey must be a private key string",
        ],
        [
            "completeClprConnector",
            { adminKey: "ff" },
            "adminKey must be an SDK key string",
        ],
        [
            "updateClprLedgerConfiguration",
            {
                throttles: {
                    ...throttleParams,
                    maxGasPerMessage: "not-a-uint64",
                },
            },
            "uint64 must be an unsigned decimal string",
        ],
        [
            "updateClprLedgerConfiguration",
            {
                throttles: {
                    ...throttleParams,
                    maxGasPerMessage: "18446744073709551616",
                },
            },
            "uint64 must fit in 64 unsigned bits",
        ],
        [
            "completeClprConnector",
            { lockedStake: "not-tinybars" },
            "uint64 must be an unsigned decimal string",
        ],
        [
            "completeClprConnector",
            { lockedStake: "0.5" },
            "uint64 must be an unsigned decimal string",
        ],
        [
            "completeClprConnector",
            { lockedStake: "-1" },
            "uint64 must be an unsigned decimal string",
        ],
        [
            "completeClprConnector",
            { lockedStake: 0 },
            "uint64 must be an unsigned decimal string",
        ],
        [
            "completeClprConnector",
            { lockedStake: "9223372036854775808" },
            "lockedStake must be a valid tinybar amount",
        ],
    ])(
        "%s reports adapter-owned validation as the existing invalid-params error %#",
        async function (name, overrides, message) {
            requireMethod(name);
            const params = transactionCases.find(
                ([method]) => method === name,
            )[2];
            const error = await methods[name]({
                ...params,
                ...overrides,
                sessionId,
            }).catch((caught) => caught);

            expect(error).toMatchObject({
                code: -32602,
                message: `invalid parameters: ${message}`,
            });
            expect(error).toBeInstanceOf(CustomError);
            expect(unaryRequests).not.toHaveBeenCalled();
        },
    );

    it.each(transactionCases)(
        "%s builds the SDK transaction, applies common parameters and returns SUCCESS",
        async function (name, rpcName, params) {
            const { response, signed, body } = await submit(name, params);
            const transaction = decodeTransaction(signed);
            expect(response.result).toMatchObject({ status: "SUCCESS" });
            expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                `/proto.ClprService/${rpcName}`,
                "/proto.CryptoService/getTransactionReceipts",
            ]);
            expect(Mocker.verifySignatures(signed)).toBe(true);
            expect(body.memo).toBe("CLPR adapter");
            expect(body.transactionFee.toString()).toBe("123456789");
            expect(transaction.transactionId.toString()).toBe(
                "0.0.1854@1700000000.000000001",
            );
            const data =
                body[`clpr${rpcName[0].toUpperCase()}${rpcName.slice(1)}`];
            expect(data).toBeDefined();
            for (const field of [
                "channelId",
                "connectorId",
                "salt",
                "ownershipCommitment",
                "commitment",
                "bundlePayload",
                "configProofBytes",
                "endpointManifestProofBytes",
            ]) {
                if (params[field] != null)
                    expect(hex(data[field])).toBe(params[field]);
            }
            if (params.verifierContract)
                expect(transaction.verifierContract.toString()).toBe("1.2.345");
            if (params.connectorContract)
                expect(transaction.connectorContract.toString()).toBe(
                    "1.2.346",
                );
            if (params.stakeRecipient)
                expect(transaction.stakeRecipient.toString()).toBe("1.2.347");
            if (params.lockedStake)
                expect(data.lockedStake.toString()).toBe(stake);
            if (params.adminKey)
                expect(transaction.adminKey.toString()).toBe(
                    signer.publicKey.toString(),
                );
            if (params.throttles) {
                expect(Object.keys(data.configuration)).toEqual(["throttles"]);
                for (const [field, value] of Object.entries(throttleParams)) {
                    expect(data.configuration.throttles[field].toString()).toBe(
                        String(value),
                    );
                }
            }
        },
    );

    for (const [name, , params] of transactionCases) {
        it.each(["precheck", "receipt"])(
            `${name} preserves a CLPR %s error through the existing server mapper`,
            async function (phase) {
                requireMethod(name);
                await connect(
                    phase === "precheck"
                        ? [
                              {
                                  response: {
                                      nodeTransactionPrecheckCode:
                                          proto.ResponseCodeEnum
                                              .CLPR_NOT_ENABLED,
                                  },
                              },
                          ]
                        : [
                              { response: { nodeTransactionPrecheckCode: 0 } },
                              receipt(
                                  proto.ResponseCodeEnum
                                      .CLPR_AUTHORIZATION_FAILED,
                              ),
                          ],
                );
                const errorLog = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});
                try {
                    const response = await rpc(name, { ...params, sessionId });
                    expect(response.error).toMatchObject({
                        code: -32001,
                        message: "Hedera Error",
                        data: {
                            status:
                                phase === "precheck"
                                    ? "CLPR_NOT_ENABLED"
                                    : "CLPR_AUTHORIZATION_FAILED",
                        },
                    });
                    expect(response.error.data.message).toContain(
                        response.error.data.status,
                    );
                } finally {
                    errorLog.mockRestore();
                }
            },
        );
    }

    for (const name of ["completeClprChannel", "completeClprConnector"]) {
        it.each(vectors.vectors)(
            `${name} uses a private key string to produce a $signatureScheme ownership proof before freezing`,
            async function (value) {
                const params = transactionCases.find(
                    ([method]) => method === name,
                )[2];
                const { body, signed, response } = await submit(name, {
                    ...params,
                    connectorId: value.connectorId,
                    ownershipPrivateKey: ownershipKey(value).toStringDer(),
                });
                expect(response.result).toMatchObject({ status: "SUCCESS" });
                const isConnector = name === "completeClprConnector";
                const proof =
                    body[
                        isConnector
                            ? "clprCompleteConnector"
                            : "clprCompleteChannel"
                    ];
                expect(proof.signatureScheme).toBe(
                    value.signatureScheme === "ECDSA_SECP256K1" ? 0 : 1,
                );
                expect(hex(proof.publicKey)).toBe(value.publicKey);
                expect(response.result.publicKey).toBe(hex(proof.publicKey));
                expect(response.result.signature).toBe(hex(proof.signature));
                expect(response.result.signatureScheme).toBe(
                    value.signatureScheme,
                );
                // Verify the proof against the pinned signing input.
                const decoded = decodeTransaction(signed);
                expect(response.result.signatureScheme).toBe(
                    decoded.signatureScheme.toString(),
                );
                expect(decoded.signatureScheme.toString()).toBe(
                    value.signatureScheme,
                );
                expect(decoded.signature).toHaveLength(64);
                const preimage = isConnector
                    ? Buffer.from(
                          value.connectorId + vectors.clprServiceAddress,
                          "hex",
                      )
                    : Buffer.from(vectors.channelId, "hex");
                const message =
                    value.signatureScheme === "ED25519"
                        ? Buffer.from(
                              value[
                                  isConnector
                                      ? "connectorDigest"
                                      : "channelDigest"
                              ],
                              "hex",
                          )
                        : preimage;
                expect(
                    ownershipKey(value).publicKey.verify(
                        message,
                        proof.signature,
                    ),
                ).toBe(true);
            },
        );

        it(`${name} rejects a public key supplied as the ownership private key`, async function () {
            requireMethod(name);
            client = sdk.Client.forNetwork(
                { "127.0.0.1:1": "0.0.3" },
                { scheduleNetworkUpdate: false },
            );
            registry.setClient(client, sessionId);
            const params = transactionCases.find(
                ([method]) => method === name,
            )[2];
            await expect(
                methods[name]({
                    ...params,
                    sessionId,
                    ownershipPrivateKey: signer.publicKey.toStringDer(),
                }),
            ).rejects.toThrow();
            expect(unaryRequests).not.toHaveBeenCalled();
        });
    }

    it.each([
        signer.toStringDer(),
        convertToKeyListHex(new sdk.KeyList([signer.publicKey], 1)),
    ])(
        "completeClprConnector accepts administrative key encoding %#",
        async function (adminKey) {
            const params = transactionCases.find(
                ([name]) => name === "completeClprConnector",
            )[2];
            const { signed, response } = await submit("completeClprConnector", {
                ...params,
                adminKey,
            });
            expect(response.result).toMatchObject({ status: "SUCCESS" });
            const key = decodeTransaction(signed).adminKey;
            expect(
                key instanceof sdk.KeyList
                    ? key.toArray()[0].toString()
                    : key.toString(),
            ).toBe(signer.publicKey.toString());
        },
    );

    it.each([
        { ...throttleParams, maxSyncBytes: "66559" },
        { ...throttleParams, maxGasPerMessage: "0" },
        { ...throttleParams, maxQueueDepth: undefined },
    ])(
        "updateClprLedgerConfiguration validates all throttles with the SDK factory %#",
        async function (throttles) {
            requireMethod("updateClprLedgerConfiguration");
            client = sdk.Client.forNetwork(
                { "127.0.0.1:1": "0.0.3" },
                { scheduleNetworkUpdate: false },
            );
            registry.setClient(client, sessionId);
            await expect(
                methods.updateClprLedgerConfiguration({ sessionId, throttles }),
            ).rejects.toThrow();
            expect(unaryRequests).not.toHaveBeenCalled();
        },
    );

    for (const [name, rpcName, makeResponse, proofField] of [
        [
            "getClprLedgerConfiguration",
            "getLedgerConfiguration",
            makeLedgerConfigurationResponse,
            "configurationStateProof",
        ],
        [
            "getClprEndpointManifest",
            "getEndpointManifest",
            makeEndpointManifestResponse,
            "manifestStateProof",
        ],
    ]) {
        it.each(["090a0b0c", ""])(
            `${name} maps typed fields to JSON and returns state proof '%s' with one free query`,
            async function (proof) {
                requireMethod(name);
                const wireResponse = makeResponse();
                wireResponse[proofField] = Buffer.from(proof, "hex");
                if (wireResponse.configuration) {
                    wireResponse.configuration.throttles.maxGasPerMessage =
                        Long.MAX_UNSIGNED_VALUE;
                    wireResponse.configuration.throttles.maxSyncBytes =
                        Long.MAX_UNSIGNED_VALUE;
                } else {
                    wireResponse.manifest.version = Long.MAX_UNSIGNED_VALUE;
                }
                let received;
                const field = `clpr${rpcName[0].toUpperCase()}${rpcName.slice(
                    1,
                )}`;
                await connect(
                    [
                        {
                            call(request) {
                                received = request;
                                return { [field]: wireResponse };
                            },
                        },
                    ],
                    false,
                );
                expect(client.operatorAccountId).toBeNull();
                const response = await rpc(name, { sessionId });
                const result = response.result;
                expect(result).toBeDefined();
                expect(result[proofField]).toBe(proof);
                expect(result.serviceAddress).toBe(vectors.clprServiceAddress);
                if (wireResponse.configuration) {
                    expect(result).toMatchObject({
                        protocolVersion: 1,
                        chainId: "hedera:testnet",
                        timestamp: "1700000000.123456789",
                        initialTrustAnchor: "01020304",
                        initialTrustAnchorId: "05060708",
                        throttles: {
                            ...throttleParams,
                            maxGasPerMessage: uint64Max,
                            maxLocalEndpoints: 2,
                            maxPeerEndpoints: 3,
                        },
                    });
                } else {
                    expect(result.version).toBe(uint64Max);
                    expect(result.endpoints).toEqual([
                        {
                            serviceEndpoint: {
                                ipAddress: "192.0.2.1",
                                port: 50211,
                            },
                            tlsCertificate: "01020304",
                            accountId: "ff00807f",
                        },
                        {
                            serviceEndpoint: {
                                ipAddress: "2001:db8::2",
                                port: 50212,
                            },
                            tlsCertificate: "05060708",
                            accountId: "aabbccdd",
                        },
                    ]);
                }
                expect(received[field].header.payment == null).toBe(true);
                expect(unaryRequests.mock.calls.map(([path]) => path)).toEqual([
                    `/proto.ClprService/${rpcName}`,
                ]);
            },
        );
    }
});
