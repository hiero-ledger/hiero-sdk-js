import { legacy } from "../../src/util/derive.js";
import * as hex from "../../src/encoding/hex.js";

const seed = new Uint8Array(32).fill(1);

describe("derive", function () {
    it("derives a 32-byte key for the special index 0xffffffffff", async function () {
        const key = await legacy(seed, 0xffffffffff);

        expect(key).to.be.instanceOf(Uint8Array);
        expect(key.length).to.be.equal(32);
        expect(hex.encode(key)).to.be.equal(
            "3f2ab97d6c7d37d19866f50fb879114d90e76a1142a59ff3d49b49a5776ce7b5",
        );
    });

    it("derives a 32-byte key for a negative index", async function () {
        const key = await legacy(seed, -1);

        expect(key).to.be.instanceOf(Uint8Array);
        expect(key.length).to.be.equal(32);
        expect(hex.encode(key)).to.be.equal(
            "5a1c3c9270ef72e994a788f2ac4677d457d62908b09bae31939a47a99f38b37a",
        );
    });

    it("derives a 32-byte key for a normal non-negative index", async function () {
        const key = await legacy(seed, 0);

        expect(key).to.be.instanceOf(Uint8Array);
        expect(key.length).to.be.equal(32);
        expect(hex.encode(key)).to.be.equal(
            "d4fba25e69d6630853c482774c4411ef1f5e1e065c5ea0f51eec8eefa3354663",
        );
    });
});
