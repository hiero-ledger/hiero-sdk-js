import { TokenId } from "../../src/index.js";
import MirrorNodeTokenBalance from "../../src/account/MirrorNodeTokenBalance.js";
import Long from "long";

describe("MirrorNodeTokenBalance", function () {
    describe("constructor", function () {
        it("should set the token ID, balance and decimals", function () {
            const tokenId = new TokenId(0, 0, 1234);

            const balance = new MirrorNodeTokenBalance({
                tokenId,
                balance: Long.fromNumber(1234),
                decimals: 2,
            });

            expect(balance.tokenId).to.equal(tokenId);
            expect(balance.balance.toNumber()).to.equal(1234);
            expect(balance.decimals).to.equal(2);
        });

        it("should be frozen once constructed", function () {
            const balance = new MirrorNodeTokenBalance({
                tokenId: new TokenId(0, 0, 1234),
                balance: Long.fromNumber(1234),
                decimals: 2,
            });

            expect(Object.isFrozen(balance)).to.be.true;
            expect(() => {
                balance.balance = Long.fromNumber(1);
            }).to.throw();
        });
    });

    describe("toString", function () {
        it("should include the token ID, balance and decimals", function () {
            const balance = new MirrorNodeTokenBalance({
                tokenId: new TokenId(0, 0, 1234),
                balance: Long.fromNumber(1234),
                decimals: 2,
            });

            expect(balance.toString()).to.equal("0.0.1234: 1234 (2 decimals)");
        });

        it("should print a zero balance", function () {
            const balance = new MirrorNodeTokenBalance({
                tokenId: new TokenId(0, 0, 5),
                balance: Long.ZERO,
                decimals: 0,
            });

            expect(balance.toString()).to.equal("0.0.5: 0 (0 decimals)");
        });
    });
});
