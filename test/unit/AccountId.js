import {
    AccountId,
    Client,
    EvmAddress,
    NftId,
    PrivateKey,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Long from "long";

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
            expect(AccountId.fromString("0.0.123").checksum).to.be.null;
            expect(AccountId.fromString("123").toString()).to.equal("0.0.123");
            expect(AccountId.fromString("1.2.3").toString()).to.equal("1.2.3");
            expect(AccountId.fromString("0.0.0123").toString()).to.equal(
                "0.0.123",
            );
            expect(AccountId.fromString("0.0.123-vfmkw").toString()).to.equal(
                "0.0.123",
            );
            expect(AccountId.fromString("0.0.123-vfmkw").checksum).to.equal(
                "vfmkw",
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
            expect(AccountId.fromString(`0.0.${evm}`).checksum).to.be.null;
            expect(AccountId.fromString(`0.0.${evm}-vfmkw`).checksum).to.be
                .null;
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

describe("deprecated", function () {
    let warn;
    let testnet;
    let mainnet;

    beforeEach(function () {
        warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
    });

    afterEach(function () {
        testnet.close();
        mainnet.close();
        vi.restoreAllMocks();
    });

    it("fromEvmPublicAddress puts the EVM address on a 0.0.0 account ID", function () {
        const evmAddress = EvmAddress.fromString(
            "0x302a300506032b6570032100114e6abc371b82da",
        );

        const id = AccountId.fromEvmPublicAddress(evmAddress);

        expect(id.evmAddress).to.equal(evmAddress);
        expect(id.num.toNumber()).to.equal(0);
    });

    it("validate passes when the checksum matches the client's network", function () {
        AccountId.fromString("0.0.123-esxsf").validate(testnet);

        expect(warn).toHaveBeenCalledWith(
            "Deprecated: Use `validateChecksum` instead",
        );
    });

    it("validate throws BadEntityIdError when the checksum is for another network", function () {
        expect(() =>
            AccountId.fromString("0.0.123-esxsf").validate(mainnet),
        ).to.throw(BadEntityIdError);
    });
});
