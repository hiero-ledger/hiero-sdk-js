import * as slip10 from "../../../src/primitive/slip10.js";
import * as bip32 from "../../../src/primitive/bip32.js";
import * as hex from "../../../src/encoding/hex.js";

describe("primitive/slip10", function () {
    // -------------------------------------------------------------------------
    // SLIP-10 Test Vector 1 for ed25519
    // Seed (hex): 000102030405060708090a0b0c0d0e0f
    // https://github.com/satoshilabs/slips/blob/master/slip-0010.md
    // -------------------------------------------------------------------------
    const VECTOR_1_SEED = "000102030405060708090a0b0c0d0e0f";

    it("fromSeed produces correct master key from test vector 1", async function () {
        const seed = hex.decode(VECTOR_1_SEED);
        const { keyData, chainCode } = await slip10.fromSeed(seed);

        expect(hex.encode(keyData)).to.equal(
            "2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7",
        );
        expect(hex.encode(chainCode)).to.equal(
            "90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb",
        );
    });

    // -------------------------------------------------------------------------
    // SLIP-10 Test Vector 2 for ed25519
    // Seed (hex): fffcf9f6f3f0ede...  (64 bytes)
    // -------------------------------------------------------------------------
    const VECTOR_2_SEED =
        "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";

    // Computed constants to avoid PMD numeric-literal precision warnings
    const INDEX_ONE_BILLION = 10 ** 9; // 1,000,000,000
    const INDEX_MAX_NON_HARDENED = 2 ** 31 - 1; // 2,147,483,647
    const HARDENED_OFFSET = 2 ** 31; // 0x80000000

    it("fromSeed produces correct master key from test vector 2", async function () {
        const seed = hex.decode(VECTOR_2_SEED);
        const { keyData, chainCode } = await slip10.fromSeed(seed);

        expect(hex.encode(keyData)).to.equal(
            "171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012",
        );
        expect(hex.encode(chainCode)).to.equal(
            "ef70a74db9c3a5af931b5fe73ed8e1a53464133654fd55e7a66f8570b8e33c3b",
        );
    });

    // Expected derivation chain for test vector 1: m/0H/1H/2H/2H/1000000000H
    const VECTOR_1_CHAIN = [
        {
            index: 0,
            keyData:
                "68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3",
            chainCode:
                "8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69",
        },
        {
            index: 1,
            keyData:
                "b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2",
            chainCode:
                "a320425f77d1b5c2505a6b1b27382b37368ee640e3557c315416801243552f14",
        },
        {
            index: 2,
            keyData:
                "92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9",
            chainCode:
                "2e69929e00b5ab250f49c3fb1c12f252de4fed2c1db88387094a0f8c4c9ccd6c",
        },
        {
            index: 2,
            keyData:
                "30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662",
            chainCode:
                "8f6d87f93d750e0efccda017d662a1b31a266e4a6f5993b15f5c1f07f74dd5cc",
        },
        {
            index: INDEX_ONE_BILLION,
            keyData:
                "8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793",
            chainCode:
                "68789923a0cac2cd5a29172a475fe9e0fb14cd6adb5ad98a3fa70333e7afa230",
        },
    ];

    it("derive produces correct child keys for test vector 1 chain", async function () {
        const seed = hex.decode(VECTOR_1_SEED);
        let currentKey = await slip10.fromSeed(seed);

        for (const expected of VECTOR_1_CHAIN) {
            currentKey = await slip10.derive(
                currentKey.keyData,
                currentKey.chainCode,
                expected.index,
            );
            expect(hex.encode(currentKey.keyData)).to.equal(expected.keyData);
            expect(hex.encode(currentKey.chainCode)).to.equal(
                expected.chainCode,
            );
        }
    });

    it("derive produces correct child keys for test vector 2 chain", async function () {
        const seed = hex.decode(VECTOR_2_SEED);
        const root = await slip10.fromSeed(seed);

        // Chain m/0H
        const child0 = await slip10.derive(root.keyData, root.chainCode, 0);
        expect(hex.encode(child0.keyData)).to.equal(
            "1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635",
        );
        expect(hex.encode(child0.chainCode)).to.equal(
            "0b78a3226f915c082bf118f83618a618ab6dec793752624cbeb622acb562862d",
        );

        // Chain m/0H/2147483647H  (index = 2_147_483_647, NOT pre-hardened)
        const child1 = await slip10.derive(
            child0.keyData,
            child0.chainCode,
            INDEX_MAX_NON_HARDENED,
        );
        expect(hex.encode(child1.keyData)).to.equal(
            "ea4f5bfe8694d8bb74b7b59404632fd5968b774ed545e810de9c32a4fb4192f4",
        );
        expect(hex.encode(child1.chainCode)).to.equal(
            "138f0b2551bcafeca6ff2aa88ba8ed0ed8de070841f0c4ef0165df8181eaad7f",
        );
    });

    it("derive throws when given a pre-hardened index", async function () {
        const seed = hex.decode(VECTOR_1_SEED);
        const { keyData, chainCode } = await slip10.fromSeed(seed);

        // Using raw hardened constant
        let threw = false;
        try {
            await slip10.derive(keyData, chainCode, HARDENED_OFFSET);
        } catch (err) {
            threw = true;
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal(
                "the index should not be pre-hardened",
            );
        }
        expect(threw).to.be.true;

        // Using bip32.toHardenedIndex()
        threw = false;
        try {
            await slip10.derive(keyData, chainCode, bip32.toHardenedIndex(0));
        } catch (err) {
            threw = true;
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal(
                "the index should not be pre-hardened",
            );
        }
        expect(threw).to.be.true;
    });
});
