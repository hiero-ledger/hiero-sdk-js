// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/index.js";
import { Client as GrpcClient } from "@grpc/grpc-js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import { vi } from "vitest";
import * as hex from "../../../src/encoding/hex.js";
import Mocker from "../Mocker.js";
import { makeEndpointManifestResponse } from "../utils/ClprEndpointManifest.js";

describe("ClprGetEndpointManifestMocking", function () {
    let mock;
    let client;
    let unaryRequests;
    let received;

    beforeEach(function () {
        mock = undefined;
        client = undefined;
        received = [];
        expect(
            sdk.ClprGetEndpointManifestQuery,
            "ClprGetEndpointManifestQuery must be exported before execution",
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
                        return { clprGetEndpointManifest: response };
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
        const result = await new sdk.ClprGetEndpointManifestQuery()
            .setMaxAttempts(1)
            .execute(client);

        expect(unaryRequests).toHaveBeenCalledTimes(1);
        expect(unaryRequests.mock.calls[0][0]).toBe(
            "/proto.ClprService/getEndpointManifest",
        );
        expect(received).toHaveLength(1);
        const request = proto.Query.decode(
            proto.Query.encode(received[0]).finish(),
        );
        expect(request.query).toBe("clprGetEndpointManifest");
        expect(request.clprGetEndpointManifest.header).not.toBeNull();
        expect(request.clprGetEndpointManifest.header.payment == null).toBe(
            true,
        );
        expect(request.clprGetEndpointManifest.header.responseType).toBe(
            proto.ResponseType.ANSWER_ONLY,
        );
        expect(result).toBeInstanceOf(sdk.ClprEndpointManifestInfo);

        return result;
    }

    it("gets every manifest field and two typed endpoints with one free RPC and no operator", async function () {
        const info = await execute(makeEndpointManifestResponse());

        expect(Long.isLong(info.version)).toBe(true);
        expect(info.version.unsigned).toBe(true);
        expect(info.version.toString()).toBe("9007199254740993");
        expect(hex.encode(info.serviceAddress)).toBe(
            "000000000000000000000000000000000000016e",
        );
        expect(info.endpoints).toHaveLength(2);
        expect(Object.isFrozen(info.endpoints)).toBe(true);
        for (const [index, ipAddress, port, certificate, accountId] of [
            [0, "192.0.2.1", 50211, "01020304", "ff00807f"],
            [1, "2001:db8::2", 50212, "05060708", "aabbccdd"],
        ]) {
            const endpoint = info.endpoints[index];
            expect(endpoint).toBeInstanceOf(sdk.ClprEndpoint);
            expect(endpoint.serviceEndpoint).toBeInstanceOf(
                sdk.ClprServiceEndpoint,
            );
            expect(endpoint.serviceEndpoint.ipAddress).toBe(ipAddress);
            expect(endpoint.serviceEndpoint.port).toBe(port);
            expect(hex.encode(endpoint.tlsCertificate)).toBe(certificate);
            expect(endpoint.accountId).toBeInstanceOf(Uint8Array);
            expect(hex.encode(endpoint.accountId)).toBe(accountId);
        }
        expect(hex.encode(info.manifestStateProof)).toBe("090a0b0c");
    });

    it("keeps uint64 max version through the real transport and typed model", async function () {
        const response = makeEndpointManifestResponse();
        response.manifest.version = Long.fromString(
            "18446744073709551615",
            true,
        );
        const info = await execute(response);

        expect(Long.isLong(info.version)).toBe(true);
        expect(info.version.unsigned).toBe(true);
        expect(info.version.toString()).toBe("18446744073709551615");
    });

    it("succeeds with an empty manifest proof", async function () {
        const response = makeEndpointManifestResponse();
        response.manifestStateProof = new Uint8Array();
        const info = await execute(response);

        expect(info.endpoints).toHaveLength(2);
        expect(info.manifestStateProof).toBeInstanceOf(Uint8Array);
        expect(info.manifestStateProof).toHaveLength(0);
    });
});
