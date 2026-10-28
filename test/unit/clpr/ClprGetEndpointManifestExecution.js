// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import Long from "long";
import {
    encodeRequest,
    decodeUnaryResponse,
} from "../../../src/channel/Channel.js";
import * as hex from "../../../src/encoding/hex.js";
import { makeEndpointManifestResponse } from "../utils/ClprEndpointManifest.js";

describe("ClprGetEndpointManifestQuery execution", function () {
    it.each(["090a0b0c", ""])(
        "reads a typed manifest with proof '%s' using one free RPC and no operator",
        async function (proof) {
            expect(sdk.ClprGetEndpointManifestQuery).toBeTypeOf("function");
            const response = makeEndpointManifestResponse();
            response.manifest.version = Long.fromString(
                "18446744073709551615",
                true,
            );
            response.manifestStateProof = hex.decode(proof);
            const frame = encodeRequest(
                proto.Response.encode({
                    clprGetEndpointManifest: response,
                }).finish(),
            );
            const requests = [];
            const originalFetch = globalThis.fetch;
            const client = new sdk.WebClient({
                network: { "127.0.0.1:50211": "0.0.3" },
                scheduleNetworkUpdate: false,
            });
            globalThis.fetch = (url, init) => {
                if (url.includes("/proto.")) {
                    requests.push({
                        url,
                        query: proto.Query.decode(
                            decodeUnaryResponse(init.body),
                        ),
                    });
                }

                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ "grpc-status": "0" }),
                    arrayBuffer: () => Promise.resolve(frame),
                });
            };

            try {
                expect(client.operatorAccountId).toBeNull();
                const info = await new sdk.ClprGetEndpointManifestQuery()
                    .setMaxAttempts(1)
                    .execute(client);

                expect(requests).toHaveLength(1);
                expect(requests[0].url).toBe(
                    "http://127.0.0.1:50211/proto.ClprService/getEndpointManifest",
                );
                expect(requests[0].query.query).toBe("clprGetEndpointManifest");
                const header = requests[0].query.clprGetEndpointManifest.header;
                expect(header.payment == null).toBe(true);
                expect(header.responseType).toBe(
                    proto.ResponseType.ANSWER_ONLY,
                );
                expect(info).toBeInstanceOf(sdk.ClprEndpointManifestInfo);
                expect(Long.isLong(info.version)).toBe(true);
                expect(info.version.unsigned).toBe(true);
                expect(info.version.toString()).toBe("18446744073709551615");
                expect(info.endpoints).toHaveLength(2);
                expect(info.endpoints[0]).toBeInstanceOf(sdk.ClprEndpoint);
                expect(info.endpoints[1].serviceEndpoint).toBeInstanceOf(
                    sdk.ClprServiceEndpoint,
                );
                expect(info.endpoints[1].serviceEndpoint.ipAddress).toBe(
                    "2001:db8::2",
                );
                expect(info.manifestStateProof).toBeInstanceOf(Uint8Array);
                expect(hex.encode(info.manifestStateProof)).toBe(proof);
            } finally {
                client.close();
                globalThis.fetch = originalFetch;
            }
        },
    );
});
