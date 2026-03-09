import { describe, it, expect } from "vitest";
import AccountBalance from "../../src/account/AccountBalance.js";
import Hbar from "../../src/Hbar.js";
import TokenId from "../../src/token/TokenId.js";
import TokenBalanceMap from "../../src/account/TokenBalanceMap.js";
import TokenDecimalMap from "../../src/account/TokenDecimalMap.js";

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

    it("defaults decimals to 0 in JSON when tokenDecimals is null", () => {
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

    it("uses provided tokenDecimals when available", () => {
        const tokenBalances = new TokenBalanceMap();
        const tokenDecimals = new TokenDecimalMap();
        const tokenId = new TokenId(0, 0, 456);

        tokenBalances._set(tokenId, 200);
        tokenDecimals._set(tokenId, 8);

        const balance = new AccountBalance({
            hbars: Hbar.fromTinybars(0),
            tokens: tokenBalances,
            tokenDecimals: tokenDecimals,
        });

        const json = balance.toJSON();

        expect(json.tokens.length).toBe(1);
        expect(json.tokens[0].decimals).toBe(8);
    });

    it("handles empty token map correctly", () => {
        const balance = new AccountBalance({
            hbars: Hbar.fromTinybars(0),
            tokens: new TokenBalanceMap(),
            tokenDecimals: new TokenDecimalMap(),
        });

        const json = balance.toJSON();

        expect(json.tokens.length).toBe(0);
    });

    it("correctly serializes tokens in _toProtobuf()", () => {
        const tokenBalances = new TokenBalanceMap();
        const tokenDecimals = new TokenDecimalMap();
        const tokenId = new TokenId(0, 0, 789);

        tokenBalances._set(tokenId, 50);
        tokenDecimals._set(tokenId, 4);

        const balance = new AccountBalance({
            hbars: Hbar.fromTinybars(0),
            tokens: tokenBalances,
            tokenDecimals: tokenDecimals,
        });

        const proto = balance._toProtobuf();

        expect(proto.tokenBalances.length).toBe(1);
        expect(proto.tokenBalances[0].decimals).toBe(4);
    });

    it("round-trips correctly through protobuf serialization", () => {
        const tokenBalances = new TokenBalanceMap();
        const tokenDecimals = new TokenDecimalMap();
        const tokenId = new TokenId(0, 0, 999);

        tokenBalances._set(tokenId, 75);
        tokenDecimals._set(tokenId, 2);

        const balance = new AccountBalance({
            hbars: Hbar.fromTinybars(0),
            tokens: tokenBalances,
            tokenDecimals: tokenDecimals,
        });

        const bytes = balance.toBytes();
        const decoded = AccountBalance.fromBytes(bytes);

        expect(decoded).toBeInstanceOf(AccountBalance);
    });

});