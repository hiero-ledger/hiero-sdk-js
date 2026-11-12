// SPDX-License-Identifier: Apache-2.0

import Key from "../../src/Key.js";

describe("Key string coercion", function () {
    it("preserves object string coercion for keys without a concrete override", function () {
        class CustomKey extends Key {}

        const key = new CustomKey();
        expect(String(key)).to.equal("[object Object]");

        Object.defineProperty(key, Symbol.toStringTag, { value: "CustomKey" });
        expect(String(key)).to.equal("[object CustomKey]");
    });
});
