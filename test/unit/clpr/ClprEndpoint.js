// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import * as hex from "../../../src/encoding/hex.js";
import { makeEndpointManifestResponse } from "../utils/ClprEndpointManifest.js";

describe("ClprEndpoint", function () {
    beforeEach(function () {
        expect(
            sdk.ClprEndpoint,
            "ClprEndpoint must be exported before decoding",
        ).toBeTypeOf("function");
    });

    it("maps the typed service endpoint, TLS certificate and raw account bytes", function () {
        const source = makeEndpointManifestResponse().manifest.endpoints[0];
        const endpoint = sdk.ClprEndpoint._fromProtobuf(source);

        expect(endpoint).toBeInstanceOf(sdk.ClprEndpoint);
        expect(endpoint.serviceEndpoint).toBeInstanceOf(
            sdk.ClprServiceEndpoint,
        );
        expect(endpoint.serviceEndpoint.ipAddress).toBe("192.0.2.1");
        expect(endpoint.serviceEndpoint.port).toBe(50211);
        expect(endpoint.tlsCertificate).toBeInstanceOf(Uint8Array);
        expect(hex.encode(endpoint.tlsCertificate)).toBe("01020304");
        expect(endpoint.accountId).toBeInstanceOf(Uint8Array);
        expect(hex.encode(endpoint.accountId)).toBe("ff00807f");
    });

    it.each([
        ["tlsCertificate", "01020304"],
        ["accountId", "ff00807f"],
    ])("copies decoded and returned %s bytes", function (field, expected) {
        const source = makeEndpointManifestResponse().manifest.endpoints[0];
        const endpoint = sdk.ClprEndpoint._fromProtobuf(source);

        source[field].fill(255);
        endpoint[field].fill(0);

        expect(hex.encode(endpoint[field])).toBe(expected);
    });

    it("copies the decoded service endpoint and keeps all fields read-only", function () {
        const source = makeEndpointManifestResponse().manifest.endpoints[0];
        const endpoint = sdk.ClprEndpoint._fromProtobuf(source);

        source.serviceEndpoint.ipAddress = "192.0.2.99";
        source.serviceEndpoint.port = 1;
        for (const field of [
            "serviceEndpoint",
            "tlsCertificate",
            "accountId",
        ]) {
            const value = endpoint[field];
            expect(Reflect.set(endpoint, field, null)).toBe(false);
            expect(endpoint[field]).toEqual(value);
        }
        expect(
            Reflect.set(endpoint.serviceEndpoint, "ipAddress", "192.0.2.100"),
        ).toBe(false);
        expect(endpoint.serviceEndpoint.ipAddress).toBe("192.0.2.1");
        expect(endpoint.serviceEndpoint.port).toBe(50211);
    });
});
