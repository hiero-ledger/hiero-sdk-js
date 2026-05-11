import { digest, digestSync } from "../../../src/cryptography/sha384.js";

describe("sha384", function () {
    const input = new TextEncoder().encode("hello world");

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
});
