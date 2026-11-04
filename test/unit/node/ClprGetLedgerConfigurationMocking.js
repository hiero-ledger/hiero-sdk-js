// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import { vi } from "vitest";
import * as hex from "../../../src/encoding/hex.js";
import Mocker from "../Mocker.js";
import { makeLedgerConfigurationResponse } from "../utils/ClprLedgerConfiguration.js";

describe("ClprGetLedgerConfigurationMocking", function () {
    let mock;
    let client;
    let unaryRequests;
    let received;

    beforeEach(function () {
        mock = undefined;
        client = undefined;
        received = [];
        expect(
            sdk.ClprGetLedgerConfigurationQuery,
            "ClprGetLedgerConfigurationQuery must be exported before execution",
        ).toBeTypeOf("function");
        unaryRequests = vi.spyOn(GrpcClient.prototype, "makeUnaryRequest");
    });

    afterEach(function () {
        client?.close();
        mock?.client.close();
        mock?.servers.close();
        unaryRequests?.mockRestore();
        unaryRequests = undefined;
    });

    async function execute(response) {
        mock = await Mocker.withResponses([
            [
                {
                    call: (request) => {
                        received.push(request);
                        return { clprGetLedgerConfiguration: response };
                    },
                },
            ],
        ]);
        const network = Object.fromEntries(
            Object.entries(mock.client.network).map(([address, accountId]) => [
                address.replace("0.0.0.0:", "127.0.0.1:"),
                accountId,
            ]),
        );
        client = sdk.Client.forNetwork(network, {
            scheduleNetworkUpdate: false,
        });

        expect(client.operatorAccountId).toBeNull();
        const result = await new sdk.ClprGetLedgerConfigurationQuery()
            .setMaxAttempts(1)
            .execute(client);

        expect(unaryRequests).toHaveBeenCalledTimes(1);
        expect(unaryRequests.mock.calls[0][0]).toBe(
            "/proto.ClprService/getLedgerConfiguration",
        );
        expect(received).toHaveLength(1);
        const request = proto.Query.decode(
            proto.Query.encode(received[0]).finish(),
        );
        expect(request.query).toBe("clprGetLedgerConfiguration");
        expect(request.clprGetLedgerConfiguration.header).not.toBeNull();
        expect(request.clprGetLedgerConfiguration.header.payment == null).toBe(
            true,
        );
        expect(request.clprGetLedgerConfiguration.header.responseType).toBe(
            proto.ResponseType.ANSWER_ONLY,
        );
        expect(result).toBeInstanceOf(sdk.ClprLedgerConfigurationInfo);

        return result;
    }

    it("gets every typed configuration field with one free RPC and no operator", async function () {
        const info = await execute(makeLedgerConfigurationResponse());

        expect(info.protocolVersion).toBe(1);
        expect(info.chainId).toBe("hedera:testnet");
        expect(hex.encode(info.serviceAddress)).toBe(
            "000000000000000000000000000000000000016e",
        );
        expect(info.timestamp).toBeInstanceOf(sdk.Timestamp);
        expect(info.timestamp.seconds.toString()).toBe("1700000000");
        expect(info.timestamp.nanos.toString()).toBe("123456789");
        expect(info.throttles).toBeInstanceOf(sdk.ClprThrottles);
        expect(info.throttles.maxMessagesPerBundle).toBe(8);
        expect(info.throttles.maxMessagePayloadBytes).toBe(1024);
        expect(info.throttles.maxGasPerMessage.toString()).toBe(
            "9007199254740993",
        );
        expect(info.throttles.maxGasPerMessage.unsigned).toBe(true);
        expect(info.throttles.maxQueueDepth).toBe(16);
        expect(info.throttles.maxSyncBytes.toString()).toBe("66560");
        expect(info.throttles.maxSyncBytes.unsigned).toBe(true);
        expect(info.throttles.maxLocalEndpoints).toBe(2);
        expect(info.throttles.maxPeerEndpoints).toBe(3);
        expect(hex.encode(info.initialTrustAnchor)).toBe("01020304");
        expect(hex.encode(info.initialTrustAnchorId)).toBe("05060708");
        expect(hex.encode(info.configurationStateProof)).toBe("090a0b0c");
    });

    it("keeps both uint64 maxima through the real transport and typed model", async function () {
        const response = makeLedgerConfigurationResponse();
        response.configuration.throttles.maxGasPerMessage =
            Long.MAX_UNSIGNED_VALUE;
        response.configuration.throttles.maxSyncBytes = Long.MAX_UNSIGNED_VALUE;
        const info = await execute(response);

        for (const value of [
            info.throttles.maxGasPerMessage,
            info.throttles.maxSyncBytes,
        ]) {
            expect(Long.isLong(value)).toBe(true);
            expect(value.unsigned).toBe(true);
            expect(value.toString()).toBe("18446744073709551615");
        }
    });

    it("succeeds with empty proof bytes", async function () {
        const response = makeLedgerConfigurationResponse();
        response.configurationStateProof = new Uint8Array();
        const info = await execute(response);

        expect(info.chainId).toBe("hedera:testnet");
        expect(info.configurationStateProof).toBeInstanceOf(Uint8Array);
        expect(info.configurationStateProof).toHaveLength(0);
    });

    it("returns byte arrays that cannot change the typed result", async function () {
        const info = await execute(makeLedgerConfigurationResponse());

        info.serviceAddress.fill(255);
        info.initialTrustAnchor.fill(0);
        info.initialTrustAnchorId.fill(0);
        info.configurationStateProof.fill(0);

        expect(hex.encode(info.serviceAddress)).toBe(
            "000000000000000000000000000000000000016e",
        );
        expect(hex.encode(info.initialTrustAnchor)).toBe("01020304");
        expect(hex.encode(info.initialTrustAnchorId)).toBe("05060708");
        expect(hex.encode(info.configurationStateProof)).toBe("090a0b0c");
    });

    it("accepts a server throttle value that the factory would reject", async function () {
        const response = makeLedgerConfigurationResponse();
        response.configuration.throttles.maxMessagesPerBundle = 0;
        const info = await execute(response);

        expect(info.throttles).toBeInstanceOf(sdk.ClprThrottles);
        expect(info.throttles.maxMessagesPerBundle).toBe(0);
    });
});
