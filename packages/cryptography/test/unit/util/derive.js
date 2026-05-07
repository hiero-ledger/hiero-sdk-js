import { legacy } from "../../../src/util/derive.js";

describe("derive", function () {
    it("special index", async function () {
        const seed = new Uint8Array(32).fill(1);
        const result = await legacy(seed, 0xffffffffff);
        expect(result.length).to.equal(32);
    });

    it("negative index", async function () {
        const seed = new Uint8Array(32).fill(1);
        const result = await legacy(seed, -1);
        expect(result.length).to.equal(32);
    });

    it("normal index", async function () {
        const seed = new Uint8Array(32).fill(1);
        const result = await legacy(seed, 0);
        expect(result.length).to.equal(32);
    });
});