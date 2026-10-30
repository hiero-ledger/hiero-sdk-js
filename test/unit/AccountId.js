import { AccountId, EvmAddress, NftId, PrivateKey } from "../../src/index.js";

describe("AccountId", function () {
    describe("clone()", function () {
        it.each(["original", "clone"])(
            "copies EVM address bytes independently when mutating the %s",
            function (target) {
                const address = "0011223344556677889900112233445577889900";
                const original = AccountId.fromString(`2.3.${address}`);
                const clone = original.clone();

                expect(clone.evmAddress).toBeInstanceOf(EvmAddress);
                expect(clone.equals(original)).toBe(true);
                const mutated = target === "original" ? original : clone;
                const unchanged = target === "original" ? clone : original;
                mutated.evmAddress.toBytes().fill(255);

                expect(unchanged.toString()).toBe(`2.3.${address}`);
                expect(mutated.toString()).toBe(`2.3.${"ff".repeat(20)}`);
            },
        );
    });

    describe("fromString()", function () {
        it("should parse valid entity IDs", function () {
            expect(AccountId.fromString("0.0.123").toString()).to.equal(
                "0.0.123",
            );
            expect(AccountId.fromString("123").toString()).to.equal("0.0.123");
            expect(AccountId.fromString("1.2.3").toString()).to.equal("1.2.3");
            expect(AccountId.fromString("0.0.0123").toString()).to.equal(
                "0.0.123",
            );
            expect(AccountId.fromString("0.0.123-vfmkw").toString()).to.equal(
                "0.0.123",
            );
        });

        it("should throw when the entity number contains letters", function () {
            for (const text of ["0.0.12ab34", "0.0.ff", "0.0.5a", "0.0.1e3"]) {
                expect(() => AccountId.fromString(text)).to.throw(
                    `failed to parse entity id: ${text}`,
                );
            }
        });

        it("should still parse an EVM address", function () {
            const evm = "0011223344556677889900112233445577889900";
            expect(AccountId.fromString(`0.0.${evm}`).toString()).to.equal(
                `0.0.${evm}`,
            );
            expect(AccountId.fromString(evm).toString()).to.equal(`0.0.${evm}`);
            expect(AccountId.fromString(`0x${evm}`).toString()).to.equal(
                `0.0.${evm}`,
            );
        });

        it("should still parse a public key alias", function () {
            const publicKey = PrivateKey.generateED25519().publicKey;
            const accountId = AccountId.fromString(
                `0.0.${publicKey.toStringDer()}`,
            );
            expect(accountId.aliasKey.toStringDer()).to.equal(
                publicKey.toStringDer(),
            );
        });

        it("should throw for NftId when the token entity number contains letters", function () {
            expect(() => NftId.fromString("0.0.5a/1")).to.throw(
                "failed to parse entity id: 0.0.5a",
            );
        });
    });
});
