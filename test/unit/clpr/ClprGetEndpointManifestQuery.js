// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";

describe("ClprGetEndpointManifestQuery", function () {
    it.each([
        "ClprServiceEndpoint",
        "ClprEndpoint",
        "ClprEndpointManifestInfo",
        "ClprGetEndpointManifestQuery",
    ])("exports %s from the package entry", async function (name) {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry[name], `package entry must export ${name}`).toBeTypeOf(
            "function",
        );
        expect(entry[name]).toBe(sdk[name]);
    });

    it("serializes a manifest query with an answer-only header and no payment", function () {
        expect(sdk.ClprGetEndpointManifestQuery).toBeTypeOf("function");
        const query = new sdk.ClprGetEndpointManifestQuery();
        const decoded = proto.Query.decode(query.toBytes());

        expect(query).toBeInstanceOf(sdk.Query);
        expect(decoded.query).toBe("clprGetEndpointManifest");
        expect(decoded.clprGetEndpointManifest.header).not.toBeNull();
        expect(decoded.clprGetEndpointManifest.header.payment == null).toBe(
            true,
        );
        expect(decoded.clprGetEndpointManifest.header.responseType).toBe(
            proto.ResponseType.ANSWER_ONLY,
        );
    });

    it("registers the wire query for Query.fromBytes without a constructor call", function () {
        const bytes = proto.Query.encode({
            clprGetEndpointManifest: { header: {} },
        }).finish();
        const query = sdk.Query.fromBytes(bytes);

        expect(query).toBeInstanceOf(sdk.ClprGetEndpointManifestQuery);
        expect(query.toBytes()).toEqual(bytes);
    });

    it("round-trips a newly built query through Query.fromBytes", function () {
        expect(sdk.ClprGetEndpointManifestQuery).toBeTypeOf("function");
        const bytes = new sdk.ClprGetEndpointManifestQuery().toBytes();
        const restored = sdk.Query.fromBytes(bytes);

        expect(restored).toBeInstanceOf(sdk.ClprGetEndpointManifestQuery);
        expect(restored.toBytes()).toEqual(bytes);
    });
});
