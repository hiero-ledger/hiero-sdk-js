// SPDX-License-Identifier: Apache-2.0

import { proto } from "@hiero-ledger/proto";
import {
    ClprChannelStatus,
    HttpResponse,
    KeyList,
    MirrorNodeClprChannel,
    MirrorNodeClprChannelQuery,
    MirrorNodeClprConnector,
    MirrorNodeClprConnectorQuery,
    MirrorNodeStatusError,
    PublicKey,
    Status,
} from "../../src/exports.js";
import { Client } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import FakeHttpTransport, { jsonResponse } from "./utils/FakeHttpTransport.js";

import {
    CHANNEL,
    CONNECTOR,
    BASE,
    ED_KEY,
    channelRow,
    connectorRow,
} from "./utils/ClprMirror.js";

for (const kind of ["Channel", "Connector"]) {
    const isChannel = kind === "Channel";
    const field = isChannel ? "channels" : "connectors";
    const fixture = isChannel ? channelRow : connectorRow;
    const create = () =>
        isChannel
            ? new MirrorNodeClprChannelQuery({ channelId: hex.decode(CHANNEL) })
            : new MirrorNodeClprConnectorQuery({
                  channelId: hex.decode(CHANNEL),
                  connectorId: hex.decode(CONNECTOR),
              });
    describe(`MirrorNodeClpr${kind}Query`, function () {
        let fake;
        let client;
        beforeEach(function () {
            fake = new FakeHttpTransport(() =>
                jsonResponse(200, {
                    [field]: [fixture()],
                    links: { next: "/do-not-follow" },
                }),
            );
            client = new Client();
            client.setMirrorNetwork(["mirror.example.com:443"]);
            client.setMirrorNodeHttpConfig({
                transport: fake,
                retryPolicy: { initialBackoff: 0, maxBackoff: 0 },
            });
        });
        afterEach(function () {
            client.close();
        });

        it("uses the exact known-ID route without pagination or timestamps", async function () {
            const result = await create().execute(client);
            expect(result).toBeInstanceOf(
                isChannel ? MirrorNodeClprChannel : MirrorNodeClprConnector,
            );
            expect(fake.requests).toHaveLength(1);
            expect(fake.requests[0].url).toBe(
                isChannel
                    ? `${BASE}/clpr/channels?channel.id=eq:0x${CHANNEL}`
                    : `${BASE}/clpr/channels/0x${CHANNEL}/connectors?connector.id=eq:0x${CONNECTOR}&status=eq:ACTIVE`,
            );
            expect(hex.encode(result.channelId)).toBe(CHANNEL);
            expect(result.createdTimestamp.nanos.toString()).toBe(
                isChannel ? "1" : "123456789",
            );
        });

        it("copies query and result IDs", async function () {
            const channelId = hex.decode(CHANNEL);
            const query = create().setChannelId(channelId);
            channelId.fill(0);
            query.channelId.fill(0);
            if (!isChannel) {
                const id = hex.decode(CONNECTOR);
                query.setConnectorId(id);
                id.fill(0);
                query.connectorId.fill(0);
            }
            const result = await query.execute(client);
            result.channelId.fill(0);
            expect(hex.encode(result.channelId)).toBe(CHANNEL);
            expect(fake.requests[0].url).toContain(CHANNEL);
        });

        it("rejects missing or malformed IDs before transport", async function () {
            const query = isChannel
                ? new MirrorNodeClprChannelQuery()
                : new MirrorNodeClprConnectorQuery();
            await expect(query.execute(client)).rejects.toThrow("requires");
            expect(() => query.setChannelId(new Uint8Array(31))).toThrow();
            expect(() => query.setChannelId("11".repeat(32))).toThrow();
            if (!isChannel) {
                query.setChannelId(hex.decode(CHANNEL));
                await expect(query.execute(client)).rejects.toThrow("requires");
                expect(() =>
                    query.setConnectorId(new Uint8Array(33)),
                ).toThrow();
            }
            expect(fake.requests).toHaveLength(0);
        });

        it("reports empty results as not found with an ingestion-lag warning", async function () {
            fake.handler = () => jsonResponse(200, { [field]: [] });
            let error;
            try {
                await create().execute(client);
            } catch (e) {
                error = e;
            }
            expect(error).toBeInstanceOf(MirrorNodeStatusError);
            expect(error.status).toBe(
                isChannel
                    ? Status.ClprChannelNotFound
                    : Status.ClprConnectorNotFound,
            );
            expect(error.message).toContain("ingestion");
        });

        it("preserves HTTP404 as a route failure, distinct from an empty result", async function () {
            fake.handler = () =>
                jsonResponse(404, {
                    _status: {
                        messages: [
                            {
                                message: "Not Found",
                                detail: "route unavailable",
                            },
                        ],
                    },
                });
            let error;
            try {
                await create().execute(client);
            } catch (e) {
                error = e;
            }
            expect(error).not.toBeInstanceOf(MirrorNodeStatusError);
            expect(error.message).toContain("404");
            expect(error.message).toContain("route unavailable");
            expect(error.cause).toBeDefined();
        });

        it.each([
            null,
            {},
            { [field]: {} },
            { [field]: [fixture(), fixture()] },
            { [field]: [null] },
        ])("rejects malformed or multiple rows: %j", async function (body) {
            fake.handler = () => jsonResponse(200, body);
            await expect(create().execute(client)).rejects.toThrow();
        });

        it("rejects a row for a different ID", async function () {
            const row = fixture();
            row.channel_id = `0x${"00".repeat(32)}`;
            fake.handler = () => jsonResponse(200, { [field]: [row] });
            await expect(create().execute(client)).rejects.toThrow(
                /does not match|do not match/,
            );
        });

        it("reuses shared transport retries and the explicit total deadline", async function () {
            fake.respondJson(429, {}, { "retry-after": "0" }).respondJson(200, {
                [field]: [fixture()],
            });
            await create().execute(client, 3000);
            expect(fake.requests).toHaveLength(2);
            expect(fake.requests[0].deadline).toBeGreaterThan(0);
            expect(fake.requests[0].deadline).toBeLessThanOrEqual(3000);
            fake.hang();
            await expect(create().execute(client, 10)).rejects.toThrow();
        });

        it("keeps unsafe integer JSON literals exact", async function () {
            const raw = JSON.stringify({ [field]: [fixture()] }).replace(
                '"18446744073709551615"',
                "18446744073709551615",
            );
            fake.handler = () =>
                new HttpResponse({
                    statusCode: 200,
                    body: new TextEncoder().encode(raw),
                });
            const result = await create().execute(client);
            const value = isChannel
                ? result.nextMessageId
                : result.inFlightMessageCount;
            expect(value.toString()).toBe("18446744073709551615");
            value.low = 0;
            expect(
                (isChannel
                    ? result.nextMessageId
                    : result.inFlightMessageCount
                ).toString(),
            ).toBe("18446744073709551615");
        });

        it.each([-1, 1.5, "18446744073709551616", "-1", "1.1", null, true])(
            "rejects invalid counters: %j",
            async function (value) {
                const row = fixture();
                row[isChannel ? "next_message_id" : "in_flight_message_count"] =
                    value;
                fake.handler = () => jsonResponse(200, { [field]: [row] });
                await expect(create().execute(client)).rejects.toThrow(
                    "uint64",
                );
            },
        );
    });
}

describe("MirrorNodeClpr models", function () {
    it.each(["ACTIVE", "PAUSED", "CLOSING", "DRAINED", "CLOSED"])(
        "maps completed Channel status %s",
        function (status) {
            const model = MirrorNodeClprChannel._fromJson({
                ...channelRow(),
                status,
            });
            expect(model.status).toBe(ClprChannelStatus[status]);
            expect(model.status.toString()).toBe(status);
            expect(model.modifiedTimestamp.seconds.toString()).toBe(
                "1726874345",
            );
            expect(model.modifiedTimestamp.nanos.toString()).toBe("123456789");
            const time = model.modifiedTimestamp;
            time.seconds.low = 0;
            expect(model.modifiedTimestamp.seconds.toString()).toBe(
                "1726874345",
            );
            model.verifierFingerprint.fill(0);
            model.trustAnchorId.fill(0);
            expect(hex.encode(model.verifierFingerprint)).toBe("33".repeat(32));
            expect(hex.encode(model.trustAnchorId)).toBe("44".repeat(32));
            model.verifierContractId.num.low = 0;
            expect(model.verifierContractId.toString()).toBe("1.2.456");
            expect(Object.isFrozen(model)).toBe(true);
        },
    );

    it.each(["PENDING", "UNKNOWN", null])(
        "rejects non-completed Channel status %s",
        function (status) {
            expect(() =>
                MirrorNodeClprChannel._fromJson({ ...channelRow(), status }),
            ).toThrow("status");
        },
    );

    it.each(["PENDING", "DELETED", null])(
        "rejects non-active Connector status %s",
        function (status) {
            expect(() =>
                MirrorNodeClprConnector._fromJson({
                    ...connectorRow(),
                    status,
                }),
            ).toThrow("ACTIVE");
        },
    );

    it.each(["9223372036854775808", "18446744073709551616", "-1", "0.1", 100])(
        "rejects nonportable stake %j",
        function (locked_stake) {
            expect(() =>
                MirrorNodeClprConnector._fromJson({
                    ...connectorRow(),
                    locked_stake,
                }),
            ).toThrow();
        },
    );

    it("maps exact stake and defensive copies of Connector values", function () {
        const model = MirrorNodeClprConnector._fromJson(connectorRow());
        expect(model.lockedStake.toTinybars().toString()).toBe(
            "9223372036854775807",
        );
        expect(model.connectorContractId.toString()).toBe("1.2.789");
        expect(model.adminKey.toString()).toBe(
            PublicKey.fromStringED25519(ED_KEY).toString(),
        );
        model.connectorId.fill(0);
        model.connectorContractId.evmAddress = new Uint8Array(20);
        model.connectorContractId.num.low = 0;
        expect(hex.encode(model.connectorId)).toBe(CONNECTOR);
        expect(model.connectorContractId.toString()).toBe("1.2.789");
    });

    it("maps every counter as an unsigned detached Long", function () {
        const channel = MirrorNodeClprChannel._fromJson(channelRow());
        const connector = MirrorNodeClprConnector._fromJson({
            ...connectorRow(),
            slash_count: "5",
        });
        for (const [value, expected] of [
            [channel.ackedMessageId, "9007199254740993"],
            [channel.receivedMessageId, "0"],
            [connector.slashCount, "5"],
        ]) {
            expect(value.unsigned).toBe(true);
            expect(value.toString()).toBe(expected);
            value.low = 1;
        }
        expect(channel.ackedMessageId.toString()).toBe("9007199254740993");
        expect(channel.receivedMessageId.toString()).toBe("0");
        expect(connector.slashCount.toString()).toBe("5");
    });

    it.each(["33", "0x3", "0xzz"])(
        "rejects malformed hex bytes %j",
        function (verifier_fingerprint) {
            expect(() =>
                MirrorNodeClprChannel._fromJson({
                    ...channelRow(),
                    verifier_fingerprint,
                }),
            ).toThrow("verifier_fingerprint' must be hex bytes");
        },
    );

    it("rejects a Channel ID that is not 32 bytes", function () {
        expect(() =>
            MirrorNodeClprChannel._fromJson({
                ...channelRow(),
                channel_id: "0x11",
            }),
        ).toThrow("'channel_id' must be 32 bytes");
    });

    it("returns null for contract IDs and Channel bytes the mirror node leaves null", function () {
        const channel = MirrorNodeClprChannel._fromJson({
            ...channelRow(),
            verifier_contract_id: null,
            verifier_fingerprint: null,
            trust_anchor_id: null,
        });
        expect(channel.verifierContractId).toBeNull();
        expect(channel.verifierFingerprint).toBeNull();
        expect(channel.trustAnchorId).toBeNull();
        const connector = MirrorNodeClprConnector._fromJson({
            ...connectorRow(),
            connector_contract_id: null,
        });
        expect(connector.connectorContractId).toBeNull();
    });

    it("uses the shared mirror key decoder for complex admin keys", function () {
        const keys = new KeyList([PublicKey.fromStringED25519(ED_KEY)]);
        const model = MirrorNodeClprConnector._fromJson({
            ...connectorRow(),
            admin_key: {
                _type: "ProtobufEncoded",
                key: hex.encode(
                    proto.Key.encode(keys._toProtobufKey()).finish(),
                ),
            },
        });
        const key = model.adminKey;
        expect(key).toBeInstanceOf(KeyList);
        key.push(PublicKey.fromStringED25519("bb".repeat(32)));
        expect(model.adminKey.toString()).toBe(keys.toString());
    });

    it.each([
        null,
        {},
        { _type: "ED25519", key: "gg" },
        { _type: "ED25519", key: "a" },
        { _type: "UNKNOWN", key: "aa" },
        { _type: "ProtobufEncoded", key: "00" },
    ])("rejects malformed or unsupported admin keys %j", function (admin_key) {
        expect(() =>
            MirrorNodeClprConnector._fromJson({ ...connectorRow(), admin_key }),
        ).toThrow();
    });

    it.each(["0x1", "0xzz", "11".repeat(32), null])(
        "rejects malformed Channel ID bytes %j",
        function (channel_id) {
            expect(() =>
                MirrorNodeClprChannel._fromJson({
                    ...channelRow(),
                    channel_id,
                }),
            ).toThrow();
        },
    );

    it.each(["0", "1", "9007199254740993"])(
        "preserves portable stake %s",
        function (locked_stake) {
            expect(
                MirrorNodeClprConnector._fromJson({
                    ...connectorRow(),
                    locked_stake,
                })
                    .lockedStake.toTinybars()
                    .toString(),
            ).toBe(locked_stake);
        },
    );

    it("supports ECDSA admin keys through the shared decoder", function () {
        const key = PublicKey.fromStringECDSA(
            "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
        );
        const model = MirrorNodeClprConnector._fromJson({
            ...connectorRow(),
            admin_key: { _type: "ECDSA_SECP256K1", key: key.toString() },
        });
        expect(model.adminKey.toString()).toBe(key.toString());
    });
    it.each(["1726874345.1234567890", "1726874345", "-1.0", null])(
        "rejects malformed timestamps %j",
        function (created_timestamp) {
            expect(() =>
                MirrorNodeClprChannel._fromJson({
                    ...channelRow(),
                    created_timestamp,
                }),
            ).toThrow("timestamp");
        },
    );
});
