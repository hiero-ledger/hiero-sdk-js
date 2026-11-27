import CACHE from "../../src/Cache.js";

describe("Cache", function () {
    describe("mnemonicFromString", function () {
        afterEach(function () {
            // CACHE is shared, so put it back the way it started
            CACHE._mnemonicFromString = null;
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
