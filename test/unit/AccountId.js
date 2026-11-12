import { AccountId, NftId, PrivateKey } from "../../src/index.js";
import Long from "long";

describe("AccountId", function () {
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

        it("should round-trip a 40-character shard.realm.num ID", function () {
            const accountId = new AccountId(
                Long.fromString("100000000000000000"),
                0,
                Long.fromString("1000000000000000000"),
            );
            const text = accountId.toString();
            expect(text.length).to.equal(40);

            const parsed = AccountId.fromString(text);
            expect(parsed.shard.toString()).to.equal(
                accountId.shard.toString(),
            );
            expect(parsed.realm.toString()).to.equal(
                accountId.realm.toString(),
            );
            expect(parsed.num.toString()).to.equal(accountId.num.toString());
            expect(parsed.evmAddress).to.equal(null);
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
