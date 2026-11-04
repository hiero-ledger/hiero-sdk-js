// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import {
    encodeRequest,
    decodeUnaryResponse,
} from "../../../src/channel/Channel.js";
import { makeLedgerConfigurationResponse } from "../utils/ClprLedgerConfiguration.js";

describe("ClprGetLedgerConfigurationQuery execution", function () {
    it("sends one request without a payment or operator", async function () {
        const requests = [];
        const frame = encodeRequest(
            proto.Response.encode({
                clprGetLedgerConfiguration: makeLedgerConfigurationResponse(),
            }).finish(),
        );
        const originalFetch = globalThis.fetch;
        const client = new sdk.WebClient({
            network: { "127.0.0.1:50211": "0.0.3" },
            scheduleNetworkUpdate: false,
        });
        globalThis.fetch = (url, init) => {
            if (url.includes("/proto.")) {
                requests.push({
                    url,
                    query: proto.Query.decode(decodeUnaryResponse(init.body)),
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
            const info = await new sdk.ClprGetLedgerConfigurationQuery()
                .setMaxAttempts(1)
                .execute(client);

            expect(info).toBeInstanceOf(sdk.ClprLedgerConfigurationInfo);
            expect(requests).toHaveLength(1);
            expect(requests[0].url).toBe(
                "http://127.0.0.1:50211/proto.ClprService/getLedgerConfiguration",
            );
            const header = requests[0].query.clprGetLedgerConfiguration.header;
            expect(header.payment == null).toBe(true);
            expect(header.responseType).toBe(proto.ResponseType.ANSWER_ONLY);
        } finally {
            client.close();
            globalThis.fetch = originalFetch;
        }
    });
});
