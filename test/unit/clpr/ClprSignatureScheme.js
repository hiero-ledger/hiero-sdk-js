import * as sdk from "../../../src/exports.js";

describe("ClprSignatureScheme", function () {
    it.each([
        [0, "ECDSA_SECP256K1"],
        [1, "ED25519"],
    ])("maps wire code %i to %s", function (code, name) {
        expect(
            sdk.ClprSignatureScheme,
            "CLPR signature enum must exist",
        ).toBeTypeOf("function");
        const scheme = sdk.ClprSignatureScheme[name];

        expect(sdk.ClprSignatureScheme._fromCode(code)).toBe(scheme);
        expect(scheme.toString()).toBe(name);
        expect(scheme.valueOf()).toBe(code);
        expect(Object.isFrozen(scheme)).toBe(true);
    });

    it("rejects an unknown scheme code", function () {
        expect(sdk.ClprSignatureScheme).toBeTypeOf("function");
        expect(() => sdk.ClprSignatureScheme._fromCode(2)).toThrow(/2/);
    });

    it("exports the enum from the package entry", async function () {
        const entry = import.meta.env.SSR
            ? await import("../../../src/index.js")
            : await import("../../../src/browser.js");

        expect(
            entry.ClprSignatureScheme,
            "package entry must export the enum",
        ).toBeTypeOf("function");
        expect(entry.ClprSignatureScheme).toBe(sdk.ClprSignatureScheme);
    });
});
