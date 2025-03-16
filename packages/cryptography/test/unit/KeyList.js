import PublicKey from "../../src/PublicKey.js";
import KeyList from "../../src/KeyList.js";

describe("KeyList", function () {
    it("KeyList.toString()", async function () {
        const key1 = PublicKey.fromString(
            "302a300506032b65700321008f41f9476ded1bfb887ef49b40b2a33c97c9a90324e79ce53465e15968bb4503",
        );
        const key2 = PublicKey.fromString(
            "302a300506032b6570032100bbb3991523f8145f1cf4b90c7b57bfa60f42d07547aaf979fddd69388d210f6c",
        );
        const key3 = PublicKey.fromString(
            "302a300506032b6570032100f169271fe46f43ba29a786c170359e71c69eb34354e90d0b8c1e2b4b317cc650",
        );

        const keys = KeyList.of(key1, key2, key3);

        const string =
            '{"threshold":null,"keys":"302a300506032b65700321008f41f9476ded1bfb887ef49b40b2a33c97c9a90324e79ce53465e15968bb4503,302a300506032b6570032100bbb3991523f8145f1cf4b90c7b57bfa60f42d07547aaf979fddd69388d210f6c,302a300506032b6570032100f169271fe46f43ba29a786c170359e71c69eb34354e90d0b8c1e2b4b317cc650"}';

        expect(keys.toString()).to.be.equal(string);
    });
});
