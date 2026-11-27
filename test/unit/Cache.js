import CACHE from "../../src/Cache.js";

describe("Cache", function () {
    describe("mnemonicFromString", function () {
        let original;

        beforeEach(function () {
            // CACHE is shared with other test files, so keep whatever they set
            original = CACHE._mnemonicFromString;
            CACHE._mnemonicFromString = null;
        });

        afterEach(function () {
            CACHE._mnemonicFromString = original;
        });

        it("throws when it is read before it is set", function () {
            expect(() => CACHE.mnemonicFromString).to.throw(
                "Cache.mnemonicFromString was used before it was set",
            );
        });

        it("returns the function passed to setMnemonicFromString", function () {
            const fn = (mnemonic) => mnemonic;

            CACHE.setMnemonicFromString(fn);

            expect(CACHE.mnemonicFromString).to.equal(fn);
        });
    });
});
