import NullableTokenDecimalMap from "../../../src/account/NullableTokenDecimalMap.js";
import TokenId from "../../../src/token/TokenId.js";

describe("NullableTokenDecimalMap", function () {
    it("should instantiate without throwing and return a valid instance", function () {
        const map = new NullableTokenDecimalMap();
        expect(map).to.be.instanceOf(NullableTokenDecimalMap);
    });

    it("should correctly parse TokenId strings as keys using _set and get", function () {
        const map = new NullableTokenDecimalMap();
        // Since TokenId.fromString is used behind the scenes, keys should be recognized.
        map._set("0.0.1234", 100);
        expect(map.get("0.0.1234")).to.equal(100);

        // Ensure the string was mapped using TokenId correctly
        const tokenId = TokenId.fromString("0.0.1234");
        expect(map.get(tokenId)).to.equal(100);
    });
});
