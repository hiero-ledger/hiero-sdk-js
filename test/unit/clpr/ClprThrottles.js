// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import { makeThrottleLimits } from "../utils/ClprLedgerConfiguration.js";

const { ClprThrottles: ThrottlesProto } =
    HieroProto.com.hedera.hapi.node.state.clpr;
const UINT32_FIELDS = [
    "maxMessagesPerBundle",
    "maxMessagePayloadBytes",
    "maxQueueDepth",
    "maxLocalEndpoints",
    "maxPeerEndpoints",
];
const UINT64_FIELDS = ["maxGasPerMessage", "maxSyncBytes"];
const POSITIVE_FIELDS = [
    "maxMessagesPerBundle",
    "maxMessagePayloadBytes",
    "maxGasPerMessage",
    "maxQueueDepth",
    "maxSyncBytes",
];

describe("ClprThrottles", function () {
    beforeEach(function () {
        expect(
            sdk.ClprThrottles,
            "ClprThrottles must be exported before its rules can be tested",
        ).toBeTypeOf("function");
    });

    it("keeps all seven limits through protobuf bytes", function () {
        const limits = makeThrottleLimits();
        const throttles = sdk.ClprThrottles.of(limits);
        const bytes = ThrottlesProto.encode(throttles._toProtobuf()).finish();
        const restored = sdk.ClprThrottles._fromProtobuf(
            ThrottlesProto.decode(bytes),
        );

        expect(restored).toBeInstanceOf(sdk.ClprThrottles);
        for (const field of UINT32_FIELDS) {
            expect(restored[field]).toBe(limits[field]);
        }
        expect(restored.maxGasPerMessage.toString()).toBe("9007199254740993");
        expect(restored.maxSyncBytes.toString()).toBe("66560");
        expect(restored._toProtobuf()).toEqual(limits);
    });

    it.each(POSITIVE_FIELDS)("rejects zero for %s", function (field) {
        const limits = makeThrottleLimits();
        limits[field] = UINT64_FIELDS.includes(field) ? Long.UZERO : 0;

        expect(() => sdk.ClprThrottles.of(limits)).toThrow();
    });

    it.each(["maxLocalEndpoints", "maxPeerEndpoints"])(
        "accepts zero as no limit for %s",
        function (field) {
            const limits = makeThrottleLimits();
            limits[field] = 0;

            expect(sdk.ClprThrottles.of(limits)[field]).toBe(0);
        },
    );

    it.each([
        [1024, "66560"],
        [2147483648, "2147549184"],
        [4294967295, "4295032831"],
    ])(
        "accepts the exact sync floor for payload %i",
        function (payload, floor) {
            const limits = makeThrottleLimits();
            limits.maxMessagePayloadBytes = payload;
            limits.maxSyncBytes = Long.fromString(floor, true);

            expect(sdk.ClprThrottles.of(limits).maxSyncBytes.toString()).toBe(
                floor,
            );
        },
    );

    it.each([
        [1024, "66559"],
        [2147483648, "2147549183"],
        [4294967295, "4295032830"],
    ])(
        "rejects one byte below the sync floor for payload %i",
        function (payload, belowFloor) {
            const limits = makeThrottleLimits();
            limits.maxMessagePayloadBytes = payload;
            limits.maxSyncBytes = Long.fromString(belowFloor, true);

            expect(() => sdk.ClprThrottles.of(limits)).toThrow();
        },
    );

    it.each(UINT32_FIELDS)("accepts uint32 max for %s", function (field) {
        const limits = makeThrottleLimits();
        limits[field] = 4294967295;
        limits.maxSyncBytes = Long.MAX_UNSIGNED_VALUE;

        const throttles = sdk.ClprThrottles.of(limits);
        const restored = sdk.ClprThrottles._fromProtobuf(
            ThrottlesProto.decode(
                ThrottlesProto.encode(throttles._toProtobuf()).finish(),
            ),
        );

        expect(restored[field]).toBe(4294967295);
    });

    it.each(UINT32_FIELDS)(
        "rejects uint32 max plus one for %s",
        function (field) {
            const limits = makeThrottleLimits();
            limits[field] = 4294967296;
            limits.maxSyncBytes = Long.MAX_UNSIGNED_VALUE;

            expect(() => sdk.ClprThrottles.of(limits)).toThrow();
        },
    );

    for (const invalid of [-1, 1.5]) {
        it.each(UINT32_FIELDS)(
            `rejects ${invalid} for uint32 field %s`,
            function (field) {
                const limits = makeThrottleLimits();
                limits[field] = invalid;

                expect(() => sdk.ClprThrottles.of(limits)).toThrow();
            },
        );
    }

    it.each(UINT64_FIELDS)("keeps uint64 max for %s", function (field) {
        const limits = makeThrottleLimits();
        limits[field] = Long.fromString("18446744073709551615", true);
        const throttles = sdk.ClprThrottles.of(limits);
        const restored = sdk.ClprThrottles._fromProtobuf(
            ThrottlesProto.decode(
                ThrottlesProto.encode(throttles._toProtobuf()).finish(),
            ),
        );

        expect(Long.isLong(restored[field])).toBe(true);
        expect(restored[field].unsigned).toBe(true);
        expect(restored[field].toString()).toBe("18446744073709551615");
    });

    it.each(UINT64_FIELDS)("rejects a negative Long for %s", function (field) {
        const limits = makeThrottleLimits();
        limits[field] = Long.NEG_ONE;

        expect(() => sdk.ClprThrottles.of(limits)).toThrow();
    });

    it.each([...UINT32_FIELDS, ...UINT64_FIELDS])(
        "requires the field %s",
        function (field) {
            const limits = makeThrottleLimits();
            delete limits[field];

            expect(() => sdk.ClprThrottles.of(limits)).toThrow();
        },
    );

    it("accepts decoded zero limits without applying factory validation", function () {
        const decoded = ThrottlesProto.decode(
            ThrottlesProto.encode({
                maxMessagesPerBundle: 0,
                maxMessagePayloadBytes: 0,
                maxGasPerMessage: Long.UZERO,
                maxQueueDepth: 0,
                maxSyncBytes: Long.UZERO,
                maxLocalEndpoints: 0,
                maxPeerEndpoints: 0,
            }).finish(),
        );
        const throttles = sdk.ClprThrottles._fromProtobuf(decoded);

        for (const field of UINT32_FIELDS) {
            expect(throttles[field]).toBe(0);
        }
        for (const field of UINT64_FIELDS) {
            expect(throttles[field].toString()).toBe("0");
            expect(throttles[field].unsigned).toBe(true);
        }
        expect(ThrottlesProto.encode(throttles._toProtobuf()).finish()).toEqual(
            ThrottlesProto.encode(decoded).finish(),
        );
    });

    it("accepts a decoded sync value below the factory floor", function () {
        const limits = makeThrottleLimits();
        limits.maxSyncBytes = Long.fromString("1", true);
        const throttles = sdk.ClprThrottles._fromProtobuf(
            ThrottlesProto.decode(ThrottlesProto.encode(limits).finish()),
        );

        expect(throttles.maxMessagePayloadBytes).toBe(1024);
        expect(throttles.maxSyncBytes.toString()).toBe("1");
    });

    it("keeps its limits read-only", function () {
        const limits = makeThrottleLimits();
        const throttles = sdk.ClprThrottles.of(limits);

        for (const field of [...UINT32_FIELDS, ...UINT64_FIELDS]) {
            expect(Reflect.set(throttles, field, null)).toBe(false);
        }
        expect(throttles._toProtobuf()).toEqual(limits);
    });

    it.each(["of", "_fromProtobuf"])(
        "%s spreads all seven public limits",
        function (factory) {
            const limits = makeThrottleLimits();
            const throttles = sdk.ClprThrottles[factory](limits);
            const spread = { ...throttles };

            expect(Object.keys(spread).sort()).toEqual(
                [...UINT32_FIELDS, ...UINT64_FIELDS].sort(),
            );
            expect(spread).toEqual(limits);
        },
    );

    it.each(["of", "_fromProtobuf"])(
        "%s returns frozen uint64 Long values that cannot be changed",
        function (factory) {
            const limits = makeThrottleLimits();
            const throttles = sdk.ClprThrottles[factory](limits);

            for (const field of UINT64_FIELDS) {
                const value = throttles[field];

                expect(Long.isLong(value)).toBe(true);
                expect(value).not.toBe(limits[field]);
                expect(Object.isFrozen(value)).toBe(true);
                for (const [part, replacement] of [
                    ["low", 0],
                    ["high", 0],
                    ["unsigned", false],
                ]) {
                    expect(Reflect.set(value, part, replacement)).toBe(false);
                }
                expect(value.toString()).toBe(limits[field].toString());
                expect(value.unsigned).toBe(true);
                expect(throttles[field].toString()).toBe(
                    limits[field].toString(),
                );
            }
        },
    );

    it.each(["of", "_fromProtobuf"])(
        "%s copies input Long values and values returned by getters and encoding",
        function (factory) {
            const limits = makeThrottleLimits();
            const throttles = sdk.ClprThrottles[factory](limits);
            const gas = throttles.maxGasPerMessage;
            const sync = throttles.maxSyncBytes;
            const encoded = throttles._toProtobuf();

            limits.maxMessagesPerBundle = 99;
            for (const field of UINT64_FIELDS) {
                expect(Object.isFrozen(limits[field])).toBe(false);
                expect(Reflect.set(limits[field], "low", 0)).toBe(true);
                expect(Reflect.set(limits[field], "high", 0)).toBe(true);
                expect(limits[field].toString()).toBe("0");
            }
            for (const value of [
                gas,
                sync,
                encoded.maxGasPerMessage,
                encoded.maxSyncBytes,
            ]) {
                Reflect.set(value, "low", 0);
                Reflect.set(value, "high", 0);
            }

            expect(throttles.maxMessagesPerBundle).toBe(8);
            expect(throttles.maxGasPerMessage.toString()).toBe(
                "9007199254740993",
            );
            expect(throttles.maxSyncBytes.toString()).toBe("66560");
        },
    );
});
