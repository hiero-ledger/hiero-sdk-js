// SPDX-License-Identifier: Apache-2.0

import Cache from "../../src/Cache.js";

describe("Cache", function () {
    describe("mnemonicFromString", function () {
        let original;

        beforeEach(function () {
            original = Cache._mnemonicFromString;
            Cache.setMnemonicFromString(null);
        });

        afterEach(function () {
            Cache.setMnemonicFromString(original);
        });

        it("throws when read before it is set", function () {
            expect(() => Cache.mnemonicFromString).to.throw(
                "Cache.mnemonicFromString was used before it was set",
            );
        });

        it("returns the function passed to setMnemonicFromString", function () {
            // The getter used to return `this.mnemonicFromString`, so once a
            // function was set every read called the getter again until the
            // stack overflowed (#4817).
            const mnemonicFromString = (mnemonic) => mnemonic;
            Cache.setMnemonicFromString(mnemonicFromString);

            expect(Cache.mnemonicFromString).to.equal(mnemonicFromString);
        });
    });
});
