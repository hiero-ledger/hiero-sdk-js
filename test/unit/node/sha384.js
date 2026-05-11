import { digest, digestSync } from "../../../src/cryptography/sha384.js";

describe("sha384", function () {
    const input = new TextEncoder().encode("hello world");
    const KNOWN_HEX =
        "fdbd8e75a67f29f701a4e040385e2e23986303ea10239211af907fcbb83578b3e417cb71ce646efd0819dd8c088de1bd";

    it("digestSync returns a 48-byte Uint8Array", function () {
        const result = digestSync(input);
        expect(result).to.be.instanceOf(Uint8Array);
        expect(result.length).to.equal(48);
    });

    it("digest resolves to a 48-byte Uint8Array", async function () {
        const result = await digest(input);
        expect(result).to.be.instanceOf(Uint8Array);
        expect(result.length).to.equal(48);
    });

    it("digestSync and digest produce the same bytes", async function () {
        const sync = digestSync(input);
        const async_ = await digest(input);
        expect(Array.from(sync)).to.deep.equal(Array.from(async_));
    });

    it("digestSync produces the correct SHA-384 hash for a known input", function () {
        const result = digestSync(input);
        const hex = Array.from(result)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        expect(hex).to.equal(KNOWN_HEX);
    });
});
