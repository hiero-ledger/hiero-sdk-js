// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";

describe("ClprServiceEndpoint", function () {
    beforeEach(function () {
        expect(
            sdk.ClprServiceEndpoint,
            "ClprServiceEndpoint must be exported before decoding",
        ).toBeTypeOf("function");
    });

    it.each([
        ["192.0.2.1", 50211],
        ["2001:db8::2", 50212],
    ])("maps the IP string %s and port %i", function (ipAddress, port) {
        const endpoint = sdk.ClprServiceEndpoint._fromProtobuf({
            ipAddress,
            port,
        });

        expect(endpoint).toBeInstanceOf(sdk.ClprServiceEndpoint);
        expect(endpoint.ipAddress).toBe(ipAddress);
        expect(endpoint.port).toBe(port);
        expect(endpoint).not.toBeInstanceOf(sdk.ServiceEndpoint);
        expect(endpoint).not.toBeInstanceOf(sdk.RegisteredServiceEndpoint);
    });

    it("keeps decoded fields independent and read-only", function () {
        const source = { ipAddress: "192.0.2.1", port: 50211 };
        const endpoint = sdk.ClprServiceEndpoint._fromProtobuf(source);

        source.ipAddress = "192.0.2.99";
        source.port = 1;
        expect(Reflect.set(endpoint, "ipAddress", "192.0.2.100")).toBe(false);
        expect(Reflect.set(endpoint, "port", 2)).toBe(false);
        expect(endpoint.ipAddress).toBe("192.0.2.1");
        expect(endpoint.port).toBe(50211);
    });
});
