// SPDX-License-Identifier: Apache-2.0

import * as sdk from "../../../src/exports.js";
import { proto } from "@hiero-ledger/proto";

describe("ClprGetLedgerConfigurationQuery", function () {
    it.each([
        "ClprThrottles",
        "ClprLedgerConfigurationInfo",
        "ClprGetLedgerConfigurationQuery",
    ])("exports %s from the package entry", async function (name) {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(entry[name], `package entry must export ${name}`).toBeTypeOf(
            "function",
        );
        expect(entry[name]).toBe(sdk[name]);
    });

    it("serializes a CLPR query with an answer-only header and no payment", function () {
        expect(sdk.ClprGetLedgerConfigurationQuery).toBeTypeOf("function");
        const query = new sdk.ClprGetLedgerConfigurationQuery();
        const decoded = proto.Query.decode(query.toBytes());

        expect(query).toBeInstanceOf(sdk.Query);
        expect(decoded.query).toBe("clprGetLedgerConfiguration");
        expect(decoded.clprGetLedgerConfiguration.header).not.toBeNull();
        expect(decoded.clprGetLedgerConfiguration.header.payment == null).toBe(
            true,
        );
        expect(decoded.clprGetLedgerConfiguration.header.responseType).toBe(
            proto.ResponseType.ANSWER_ONLY,
        );
    });

    it("registers the wire query for Query.fromBytes without a constructor call", function () {
        const bytes = proto.Query.encode({
            clprGetLedgerConfiguration: { header: {} },
        }).finish();
        const query = sdk.Query.fromBytes(bytes);

        expect(query).toBeInstanceOf(sdk.ClprGetLedgerConfigurationQuery);
        expect(query.toBytes()).toEqual(bytes);
    });

    it("round-trips a newly built query through Query.fromBytes", function () {
        expect(sdk.ClprGetLedgerConfigurationQuery).toBeTypeOf("function");
        const bytes = new sdk.ClprGetLedgerConfigurationQuery().toBytes();
        const restored = sdk.Query.fromBytes(bytes);

        expect(restored).toBeInstanceOf(sdk.ClprGetLedgerConfigurationQuery);
        expect(restored.toBytes()).toEqual(bytes);
    });
});
