import fc from "fast-check";
import Long from "long";
import AccountId from "../../../src/account/AccountId.js";
import ContractId from "../../../src/contract/ContractId.js";
import FileId from "../../../src/file/FileId.js";
import ScheduleId from "../../../src/schedule/ScheduleId.js";
import NftId from "../../../src/token/NftId.js";
import TokenId from "../../../src/token/TokenId.js";
import TopicId from "../../../src/topic/TopicId.js";

/**
 * Any value a shard, realm, entity number or NFT serial can hold: a
 * non-negative signed 64-bit integer.
 */
const int64 = fc
    .bigInt({ min: 0n, max: 2n ** 63n - 1n })
    .map((value) => Long.fromString(value.toString()));

const digits = fc.stringMatching(/^\d{1,19}$/);

/**
 * At most 19 characters, so AccountId and ContractId read it as an entity
 * number and not as an EVM address or alias key.
 */
const digitsWithLetter = fc.stringMatching(
    /^[0-9a-zA-Z]{0,9}[a-zA-Z][0-9a-zA-Z]{0,9}$/,
);

/**
 * A `shard.realm.num` string where one of the three parts has a letter in it.
 */
const entityIdWithLetter = fc
    .tuple(
        digits,
        digits,
        digits,
        digitsWithLetter,
        fc.integer({ min: 0, max: 2 }),
    )
    .map(([shard, realm, num, bad, index]) => {
        const parts = [shard, realm, num];
        parts[index] = bad;
        return parts.join(".");
    });

const ENTITY_IDS = [
    ["AccountId", AccountId],
    ["ContractId", ContractId],
    ["FileId", FileId],
    ["ScheduleId", ScheduleId],
    ["TokenId", TokenId],
    ["TopicId", TopicId],
];

/**
 * @param {{ shard: Long, realm: Long, num: Long }} actual
 * @param {Long} shard
 * @param {Long} realm
 * @param {Long} num
 */
function expectEntityId(actual, shard, realm, num) {
    expect(actual.shard.toString()).to.equal(shard.toString());
    expect(actual.realm.toString()).to.equal(realm.toString());
    expect(actual.num.toString()).to.equal(num.toString());
}

// A retry runs with a new seed and could hide a failing property, so these
// tests never retry (the browser config sets `retry: 1`).
describe("Entity ID properties", { retry: 0 }, function () {
    for (const [name, EntityId] of ENTITY_IDS) {
        describe(name, function () {
            it("fromString() reads back what toString() writes", function () {
                fc.assert(
                    fc.property(int64, int64, int64, (shard, realm, num) => {
                        const id = new EntityId(shard, realm, num);
                        const text = id.toString();

                        // TODO(#4671): AccountId.fromString() reads any
                        // 40-character string as an EVM address, so it
                        // cannot read back an ID whose toString() is 40
                        // characters long. Remove this once that is fixed.
                        fc.pre(EntityId !== AccountId || text.length !== 40);

                        expectEntityId(
                            EntityId.fromString(text),
                            shard,
                            realm,
                            num,
                        );
                    }),
                );
            });

            it("fromBytes() reads back what toBytes() writes", function () {
                fc.assert(
                    fc.property(int64, int64, int64, (shard, realm, num) => {
                        const id = new EntityId(shard, realm, num);

                        expectEntityId(
                            EntityId.fromBytes(id.toBytes()),
                            shard,
                            realm,
                            num,
                        );
                    }),
                );
            });

            it("fromString() throws when a number part has a letter in it", function () {
                fc.assert(
                    fc.property(entityIdWithLetter, (text) => {
                        expect(() => EntityId.fromString(text)).to.throw();
                    }),
                );
            });
        });
    }

    describe("NftId", function () {
        const nftId = fc
            .tuple(int64, int64, int64, int64)
            .map(
                ([shard, realm, num, serial]) =>
                    new NftId(new TokenId(shard, realm, num), serial),
            );

        /**
         * @param {NftId} actual
         * @param {NftId} expected
         */
        function expectNftId(actual, expected) {
            const { shard, realm, num } = expected.tokenId;
            expectEntityId(actual.tokenId, shard, realm, num);
            expect(actual.serial.toString()).to.equal(
                expected.serial.toString(),
            );
        }

        it("fromString() reads back what toString() writes", function () {
            fc.assert(
                fc.property(nftId, (id) => {
                    expectNftId(NftId.fromString(id.toString()), id);
                }),
            );
        });

        it("fromString() reads the token@serial form", function () {
            fc.assert(
                fc.property(nftId, (id) => {
                    const text = `${id.tokenId.toString()}@${id.serial.toString()}`;
                    expectNftId(NftId.fromString(text), id);
                }),
            );
        });

        it("fromBytes() reads back what toBytes() writes", function () {
            fc.assert(
                fc.property(nftId, (id) => {
                    expectNftId(NftId.fromBytes(id.toBytes()), id);
                }),
            );
        });

        it("fromString() throws when the token ID or serial has a letter in it", function () {
            const badToken = fc
                .tuple(entityIdWithLetter, digits)
                .map(([token, serial]) => `${token}/${serial}`);
            const badSerial = fc
                .tuple(digits, digits, digits, digitsWithLetter)
                .map(
                    ([shard, realm, num, serial]) =>
                        `${shard}.${realm}.${num}/${serial}`,
                );

            fc.assert(
                fc.property(fc.oneof(badToken, badSerial), (text) => {
                    expect(() => NftId.fromString(text)).to.throw();
                }),
            );
        });
    });
});
