import { describe, it, expect } from "vitest";
import AccountBalance from "../../src/account/AccountBalance.js";
import Hbar from "../../src/Hbar.js";
import TokenId from "../../src/token/TokenId.js";
import TokenBalanceMap from "../../src/account/TokenBalanceMap.js";

describe("AccountBalance normalization", () => {

    it("handles null tokens and tokenDecimals safely", () => {
        const balance = new AccountBalance({
            hbars: Hbar.fromTinybars(1000),
            tokens: null,
            tokenDecimals: null,
        });

        const json = balance.toJSON();

        expect(json.tokens).toEqual([]);

        const bytes = balance.toBytes();
        const decoded = AccountBalance.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(AccountBalance);
    });

    it("defaults decimals to 0 in JSON when missing", () => {
        const tokenBalances = new TokenBalanceMap();
        const tokenId = new TokenId(0, 0, 123);

        tokenBalances._set(tokenId, 100);

        const balance = new AccountBalance({
            hbars: Hbar.fromTinybars(0),
            tokens: tokenBalances,
            tokenDecimals: null,
        });

        const json = balance.toJSON();

        expect(json.tokens.length).toBe(1);
        expect(json.tokens[0].decimals).toBe(0);
    });

});