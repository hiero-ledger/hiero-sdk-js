// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import Long from "long";
import * as hex from "../../../src/encoding/hex.js";
import { makeEndpointManifestResponse } from "../utils/ClprEndpointManifest.js";

describe("ClprEndpointManifestInfo", function () {
    beforeEach(function () {
        expect(
            sdk.ClprEndpointManifestInfo,
            "ClprEndpointManifestInfo must be exported before decoding",
        ).toBeTypeOf("function");
    });

    it("maps the version, service address, two typed endpoints and paired proof", function () {
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(
            makeEndpointManifestResponse(),
        );

        expect(info).toBeInstanceOf(sdk.ClprEndpointManifestInfo);
        expect(Long.isLong(info.version)).toBe(true);
        expect(info.version.unsigned).toBe(true);
        expect(info.version.toString()).toBe("9007199254740993");
        expect(hex.encode(info.serviceAddress)).toBe(
            "000000000000000000000000000000000000016e",
        );
        expect(info.endpoints).toHaveLength(2);
        for (const endpoint of info.endpoints) {
            expect(endpoint).toBeInstanceOf(sdk.ClprEndpoint);
            expect(endpoint.serviceEndpoint).toBeInstanceOf(
                sdk.ClprServiceEndpoint,
            );
        }
        expect(
            info.endpoints.map(
                (endpoint) => endpoint.serviceEndpoint.ipAddress,
            ),
        ).toEqual(["192.0.2.1", "2001:db8::2"]);
        expect(hex.encode(info.manifestStateProof)).toBe("090a0b0c");
    });

    it("keeps the full unsigned uint64 version range", function () {
        const response = makeEndpointManifestResponse();
        response.manifest.version = Long.fromString(
            "18446744073709551615",
            true,
        );
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);

        expect(Long.isLong(info.version)).toBe(true);
        expect(info.version.unsigned).toBe(true);
        expect(info.version.toString()).toBe("18446744073709551615");
    });

    it("copies decoded and returned Long versions", function () {
        const response = makeEndpointManifestResponse();
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);
        const returned = info.version;

        for (const value of [response.manifest.version, returned]) {
            Reflect.set(value, "low", 0);
            Reflect.set(value, "high", 0);
            Reflect.set(value, "unsigned", false);
        }

        expect(info.version.toString()).toBe("9007199254740993");
        expect(info.version.unsigned).toBe(true);
    });

    it.each([
        ["serviceAddress", "000000000000000000000000000000000000016e"],
        ["manifestStateProof", "090a0b0c"],
    ])("copies decoded and returned %s bytes", function (field, expected) {
        const response = makeEndpointManifestResponse();
        const source =
            field === "manifestStateProof" ? response : response.manifest;
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);

        source[field].fill(255);
        info[field].fill(0);

        expect(hex.encode(info[field])).toBe(expected);
    });

    it("copies the source endpoint list and freezes every returned list", function () {
        const response = makeEndpointManifestResponse();
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);
        const endpoints = info.endpoints;

        response.manifest.endpoints.reverse();
        response.manifest.endpoints.pop();
        expect(Object.isFrozen(endpoints)).toBe(true);
        expect(endpoints).not.toBe(response.manifest.endpoints);
        expect(info.endpoints).not.toBe(endpoints);
        expect(Object.isFrozen(info.endpoints)).toBe(true);
        expect(() => endpoints.pop()).toThrow(TypeError);
        expect(() => endpoints.push(endpoints[0])).toThrow(TypeError);
        expect(Reflect.set(endpoints, "0", endpoints[1])).toBe(false);
        expect(info.endpoints).toHaveLength(2);
        expect(info.endpoints[0].serviceEndpoint.ipAddress).toBe("192.0.2.1");
        expect(info.endpoints[1].serviceEndpoint.ipAddress).toBe("2001:db8::2");
    });

    it("copies nested endpoint data from the decoded manifest and returned models", function () {
        const response = makeEndpointManifestResponse();
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);
        const source = response.manifest.endpoints[0];
        const endpoint = info.endpoints[0];

        source.serviceEndpoint.ipAddress = "192.0.2.99";
        source.serviceEndpoint.port = 1;
        source.tlsCertificate.fill(255);
        source.accountId.fill(255);
        endpoint.tlsCertificate.fill(0);
        endpoint.accountId.fill(0);
        expect(info.endpoints[0].serviceEndpoint.ipAddress).toBe("192.0.2.1");
        expect(info.endpoints[0].serviceEndpoint.port).toBe(50211);
        expect(hex.encode(info.endpoints[0].tlsCertificate)).toBe("01020304");
        expect(hex.encode(info.endpoints[0].accountId)).toBe("ff00807f");
    });

    it.each([new Uint8Array(), undefined, null])(
        "keeps an empty or absent manifest proof as empty bytes (%s)",
        function (proof) {
            const response = makeEndpointManifestResponse();
            response.manifestStateProof = proof;
            const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);

            expect(info.manifestStateProof).toBeInstanceOf(Uint8Array);
            expect(info.manifestStateProof).toHaveLength(0);
            expect(info.endpoints).toHaveLength(2);
        },
    );

    it("accepts a manifest with no endpoints and returns a frozen empty list", function () {
        const response = makeEndpointManifestResponse();
        response.manifest.endpoints = [];
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(response);

        expect(info.endpoints).toEqual([]);
        expect(Object.isFrozen(info.endpoints)).toBe(true);
    });

    it("keeps every manifest field read-only", function () {
        const info = sdk.ClprEndpointManifestInfo._fromProtobuf(
            makeEndpointManifestResponse(),
        );

        for (const field of [
            "version",
            "serviceAddress",
            "endpoints",
            "manifestStateProof",
        ]) {
            const value = info[field];
            expect(Reflect.set(info, field, null)).toBe(false);
            expect(info[field]).toEqual(value);
        }
    });
});
