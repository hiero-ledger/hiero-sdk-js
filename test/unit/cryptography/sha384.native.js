import { digest } from "../../../src/cryptography/sha384.native.js";

describe("sha384 (native)", function () {
    const input = new TextEncoder().encode("hello world");

    it("digest resolves to a 48-byte Uint8Array", async function () {
        const result = await digest(input);
        expect(result).to.be.instanceOf(Uint8Array);
        expect(result.length).to.equal(48);
    });

    it("digest produces the correct SHA-384 hash", async function () {
        const result = await digest(input);
        const hexStr = Array.from(result)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        // Known SHA-384 of "hello world"
        expect(hexStr).to.equal(
            "fdbd8e75a67f29f701a4e040385e2e23986303ea10239211af907fcbb83578b3e417cb71ce646efd0819dd8c088de1bd",
        );
    });
});