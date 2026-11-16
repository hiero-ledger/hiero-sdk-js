// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import * as hex from "../../../src/encoding/hex.js";
import Long from "long";
import { makeLedgerConfigurationResponse } from "../utils/ClprLedgerConfiguration.js";

const BYTE_FIELDS = [
    ["serviceAddress", "000000000000000000000000000000000000016e"],
    ["initialTrustAnchor", "01020304"],
    ["initialTrustAnchorId", "05060708"],
    ["configurationStateProof", "090a0b0c"],
];

describe("ClprLedgerConfigurationInfo", function () {
    beforeEach(function () {
        expect(
            sdk.ClprLedgerConfigurationInfo,
            "ClprLedgerConfigurationInfo must be exported before decoding",
        ).toBeTypeOf("function");
    });

    it("maps every configuration field and the state proof", function () {
        const info = sdk.ClprLedgerConfigurationInfo._fromProtobuf(
            makeLedgerConfigurationResponse(),
        );

        expect(info).toBeInstanceOf(sdk.ClprLedgerConfigurationInfo);
        expect(info.protocolVersion).toBe(1);
        expect(info.chainId).toBe("hedera:testnet");
        expect(info.timestamp).toBeInstanceOf(sdk.Timestamp);
        expect(info.timestamp.seconds.toString()).toBe("1700000000");
        expect(info.timestamp.nanos.toString()).toBe("123456789");
        expect(info.throttles).toBeInstanceOf(sdk.ClprThrottles);
        expect(info.throttles.maxMessagesPerBundle).toBe(8);
        expect(info.throttles.maxMessagePayloadBytes).toBe(1024);
        expect(info.throttles.maxGasPerMessage.toString()).toBe(
            "9007199254740993",
        );
        expect(info.throttles.maxQueueDepth).toBe(16);
        expect(info.throttles.maxSyncBytes.toString()).toBe("66560");
        expect(info.throttles.maxLocalEndpoints).toBe(2);
        expect(info.throttles.maxPeerEndpoints).toBe(3);
        for (const [field, expected] of BYTE_FIELDS) {
            expect(hex.encode(info[field])).toBe(expected);
        }
    });

    it.each([
        ["9007199254740993", "9007199254740995"],
        ["18446744073709551615", "18446744073709551615"],
    ])(
        "preserves exact uint64 limits %s and %s when editing a spread of info.throttles",
        function (gas, sync) {
            const response = makeLedgerConfigurationResponse();
            response.configuration.throttles.maxGasPerMessage = Long.fromString(
                gas,
                true,
            );
            response.configuration.throttles.maxSyncBytes = Long.fromString(
                sync,
                true,
            );
            const info =
                sdk.ClprLedgerConfigurationInfo._fromProtobuf(response);

            const updated = sdk.ClprThrottles.of({
                ...info.throttles,
                maxMessagesPerBundle: 20,
            });

            expect(updated.maxMessagesPerBundle).toBe(20);
            expect(updated.maxGasPerMessage.unsigned).toBe(true);
            expect(updated.maxGasPerMessage.toString()).toBe(gas);
            expect(updated.maxSyncBytes.unsigned).toBe(true);
            expect(updated.maxSyncBytes.toString()).toBe(sync);
            expect(updated._toProtobuf()).toEqual({
                ...response.configuration.throttles,
                maxMessagesPerBundle: 20,
            });
            expect(info.throttles.maxMessagesPerBundle).toBe(8);
            expect(info.throttles.maxGasPerMessage.toString()).toBe(gas);
            expect(info.throttles.maxSyncBytes.toString()).toBe(sync);
        },
    );

    it("keeps an empty state proof as empty bytes", function () {
        const response = makeLedgerConfigurationResponse();
        response.configurationStateProof = new Uint8Array();
        const info = sdk.ClprLedgerConfigurationInfo._fromProtobuf(response);

        expect(info.configurationStateProof).toBeInstanceOf(Uint8Array);
        expect(info.configurationStateProof).toHaveLength(0);
    });

    it.each(BYTE_FIELDS)(
        "copies decoded %s and every returned byte array",
        function (field, expected) {
            const response = makeLedgerConfigurationResponse();
            const source =
                field === "configurationStateProof"
                    ? response
                    : response.configuration;
            const info =
                sdk.ClprLedgerConfigurationInfo._fromProtobuf(response);

            source[field].fill(255);
            info[field].fill(0);

            expect(hex.encode(info[field])).toBe(expected);
        },
    );

    it("keeps every exposed field read-only", function () {
        const info = sdk.ClprLedgerConfigurationInfo._fromProtobuf(
            makeLedgerConfigurationResponse(),
        );

        for (const field of [
            "protocolVersion",
            "chainId",
            "timestamp",
            "throttles",
            ...BYTE_FIELDS.map(([field]) => field),
        ]) {
            const value = info[field];
            expect(Reflect.set(info, field, null)).toBe(false);
            expect(info[field]).toEqual(value);
        }
    });

    it("copies decoded and returned Timestamp and throttle Long values", function () {
        const response = makeLedgerConfigurationResponse();
        const info = sdk.ClprLedgerConfigurationInfo._fromProtobuf(response);
        const timestamp = info.timestamp;
        const throttles = info.throttles;

        response.configuration.timestamp.nanos = 0;
        for (const value of [
            response.configuration.timestamp.seconds,
            response.configuration.throttles.maxGasPerMessage,
            response.configuration.throttles.maxSyncBytes,
            timestamp.seconds,
            timestamp.nanos,
            throttles.maxGasPerMessage,
            throttles.maxSyncBytes,
        ]) {
            Reflect.set(value, "low", 0);
            Reflect.set(value, "high", 0);
        }

        expect(info.timestamp.seconds.toString()).toBe("1700000000");
        expect(info.timestamp.nanos.toString()).toBe("123456789");
        expect(info.throttles.maxGasPerMessage.toString()).toBe(
            "9007199254740993",
        );
        expect(info.throttles.maxSyncBytes.toString()).toBe("66560");
    });
});
