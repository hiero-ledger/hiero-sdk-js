// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";
import {
    encodeRequest,
    decodeUnaryResponse,
} from "../../../src/channel/Channel.js";
import { makeLedgerConfigurationResponse } from "../utils/ClprLedgerConfiguration.js";
import { makeEndpointManifestResponse } from "../utils/ClprEndpointManifest.js";

for (const [QueryClass, field, rpc, makeResponse, InfoClass] of [
    [
        sdk.ClprGetLedgerConfigurationQuery,
        "clprGetLedgerConfiguration",
        "getLedgerConfiguration",
        makeLedgerConfigurationResponse,
        sdk.ClprLedgerConfigurationInfo,
    ],
    [
        sdk.ClprGetEndpointManifestQuery,
        "clprGetEndpointManifest",
        "getEndpointManifest",
        makeEndpointManifestResponse,
        sdk.ClprEndpointManifestInfo,
    ],
]) {
    describe(`${field} paid execution over gRPC-Web`, function () {
        let client;
        let requests;
        let originalFetch;
        let status;
        const key = sdk.PrivateKey.generateED25519();

        beforeEach(function () {
            requests = [];
            status = proto.ResponseCodeEnum.OK;
            client = new sdk.WebClient({
                network: { "127.0.0.1:50211": "0.0.3" },
                scheduleNetworkUpdate: false,
            });
            originalFetch = globalThis.fetch;
            globalThis.fetch = (url, init) => {
                if (!url.includes("/proto.")) {
                    return Promise.resolve({
                        ok: true,
                        headers: new Headers({ "grpc-status": "0" }),
                    });
                }
                const query = proto.Query.decode(
                    decodeUnaryResponse(init.body),
                );
                requests.push({ url, query });
                const response = makeResponse();
                response.header = {
                    nodeTransactionPrecheckCode: status,
                    responseType: query[field].header.responseType,
                    cost: 100,
                };
                const frame = encodeRequest(
                    proto.Response.encode({ [field]: response }).finish(),
                );
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ "grpc-status": "0" }),
                    arrayBuffer: () => Promise.resolve(frame),
                });
            };
        });

        afterEach(function () {
            client.close();
            globalThis.fetch = originalFetch;
        });

        function payment(index, amount) {
            const header = requests[index].query[field].header;
            expect(header.payment).not.toBeNull();
            const signed = proto.SignedTransaction.decode(
                header.payment.signedTransactionBytes,
            );
            const body = proto.TransactionBody.decode(signed.bodyBytes);
            expect(
                body.cryptoTransfer.transfers.accountAmounts.map(({ amount }) =>
                    amount.toString(),
                ),
            ).toEqual([`-${amount}`, String(amount)]);
            expect(signed.sigMap.sigPair).toHaveLength(1);
            expect(
                key.publicKey.verify(
                    signed.bodyBytes,
                    signed.sigMap.sigPair[0].ed25519,
                ),
            ).toBe(true);
            expect(
                sdk.AccountId._fromProtobuf(
                    body.cryptoTransfer.transfers.accountAmounts[1].accountID,
                ).toString(),
            ).toBe("0.0.3");
        }

        it("looks up cost, adds the standard margin and sends a signed payment", async function () {
            client.setOperator("0.0.1854", key);
            const info = await new QueryClass()
                .setMaxAttempts(1)
                .execute(client);
            expect(info).toBeInstanceOf(InfoClass);
            expect(requests).toHaveLength(2);
            expect(requests.map(({ url }) => url)).toEqual(
                Array(2).fill(
                    `http://127.0.0.1:50211/proto.ClprService/${rpc}`,
                ),
            );
            expect(
                requests.map(({ query }) => query[field].header.responseType),
            ).toEqual([
                proto.ResponseType.COST_ANSWER,
                proto.ResponseType.ANSWER_ONLY,
            ]);
            payment(1, 110);
        });

        it("uses an explicit payment amount without a cost RPC", async function () {
            client.setOperator("0.0.1854", key);
            await new QueryClass()
                .setQueryPayment(sdk.Hbar.fromTinybars(7))
                .execute(client);
            expect(requests).toHaveLength(1);
            expect(requests[0].query[field].header.responseType).toBe(
                proto.ResponseType.ANSWER_ONLY,
            );
            payment(0, 7);
        });

        it.each([false, true])(
            "requires an operator before RPC even with an explicit amount (%s)",
            async function (explicit) {
                const query = new QueryClass();
                if (explicit) query.setQueryPayment(sdk.Hbar.fromTinybars(7));
                await expect(query.execute(client)).rejects.toThrow(/operator/);
                expect(requests).toHaveLength(0);
            },
        );

        it("enforces the maximum payment before requesting the answer", async function () {
            client.setOperator("0.0.1854", key);
            await expect(
                new QueryClass()
                    .setMaxQueryPayment(sdk.Hbar.fromTinybars(109))
                    .execute(client),
            ).rejects.toBeInstanceOf(sdk.MaxQueryPaymentExceeded);
            expect(requests).toHaveLength(1);
            expect(requests[0].query[field].header.responseType).toBe(
                proto.ResponseType.COST_ANSWER,
            );
        });

        it("allows a standalone cost lookup without an operator", async function () {
            const cost = await new QueryClass().getCost(client);
            expect(cost.toTinybars().toString()).toBe("110");
            expect(requests).toHaveLength(1);
            const header = requests[0].query[field].header;
            expect(header.responseType).toBe(proto.ResponseType.COST_ANSWER);
            const signed = proto.SignedTransaction.decode(
                header.payment.signedTransactionBytes,
            );
            expect(signed.sigMap).toBeNull();
        });

        it.each([false, true])(
            "preserves CLPR precheck errors during cost or answer (%s)",
            async function (explicit) {
                client.setOperator("0.0.1854", key);
                status = proto.ResponseCodeEnum.CLPR_NOT_ENABLED;
                const query = new QueryClass().setMaxAttempts(1);
                if (explicit) query.setQueryPayment(sdk.Hbar.fromTinybars(7));
                const error = await query
                    .execute(client)
                    .catch((error) => error);
                expect(error).toBeInstanceOf(sdk.PrecheckStatusError);
                expect(error.status).toBe(sdk.Status.ClprNotEnabled);
                expect(requests).toHaveLength(1);
            },
        );
    });
}
