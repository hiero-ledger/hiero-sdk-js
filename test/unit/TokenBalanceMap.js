import Long from "long";
import TokenId from "../../src/token/TokenId.js";
import TokenBalanceMap from "../../src/account/TokenBalanceMap.js";

describe("TokenBalanceMap", function () {
    /**
     * @returns {TokenBalanceMap}
     */
    function balances() {
        const map = new TokenBalanceMap();

        map._set(new TokenId(0, 0, 9454951), Long.UZERO);
        map._set(
            new TokenId(0, 0, 9454946),
            Long.fromString("18446744073709551615", true),
        );

        return map;
    }

    const expected = '{"0.0.9454951":"0","0.0.9454946":"18446744073709551615"}';

    it("should serialize balances as decimal strings", function () {
        expect(JSON.stringify(balances())).to.equal(expected);
    });

    it("should stringify balances as decimal strings", function () {
        expect(balances().toString()).to.equal(expected);
    });
});
