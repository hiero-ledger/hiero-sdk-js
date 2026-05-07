// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import NullableTokenDecimalMap from "../../../src/account/NullableTokenDecimalMap.js";

describe("NullableTokenDecimalMap", function () {
    it("should construct a NullableTokenDecimalMap", function () {
        const map = new NullableTokenDecimalMap();

        expect(map).toBeInstanceOf(NullableTokenDecimalMap);
    });
});