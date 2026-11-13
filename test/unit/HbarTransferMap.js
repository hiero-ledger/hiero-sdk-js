import Long from "long";
import AccountId from "../../src/account/AccountId.js";
import HbarTransferMap from "../../src/account/HbarTransferMap.js";
import Hbar from "../../src/Hbar.js";
import ObjectMap from "../../src/ObjectMap.js";

describe("HbarTransferMap", function () {
    /**
     * Builds a protobuf-shaped `AccountAmount` with the fields
     * `HbarTransferMap._fromProtobuf` reads: `accountID` and `amount`.
     *
     * @param {number} accountNum
     * @param {Long} amount
     * @returns {object}
     */
    function accountAmount(accountNum, amount) {
        return {
            accountID: {
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                accountNum: Long.fromNumber(accountNum),
            },
            amount,
        };
    }

    describe("constructor", function () {
        it("should create an empty map", function () {
            const map = new HbarTransferMap();

            expect(map).to.be.an.instanceof(ObjectMap);
            expect(map.size).to.equal(0);
            expect([...map.keys()]).to.deep.equal([]);
        });

        it("should parse string keys into AccountId", function () {
            const map = new HbarTransferMap();

            const key = map._fromString("0.0.1234");

            expect(key).to.be.an.instanceof(AccountId);
            expect(key.toString()).to.equal("0.0.1234");
        });
    });

    describe("_fromProtobuf", function () {
        it("should return an empty map when accountAmounts is null", function () {
            const map = HbarTransferMap._fromProtobuf({ accountAmounts: null });

            expect(map).to.be.an.instanceof(HbarTransferMap);
            expect(map.size).to.equal(0);
        });

        it("should return an empty map when accountAmounts is absent", function () {
            const map = HbarTransferMap._fromProtobuf({});

            expect(map).to.be.an.instanceof(HbarTransferMap);
            expect(map.size).to.equal(0);
        });

        it("should return an empty map when accountAmounts is empty", function () {
            const map = HbarTransferMap._fromProtobuf({ accountAmounts: [] });

            expect(map).to.be.an.instanceof(HbarTransferMap);
            expect(map.size).to.equal(0);
        });

        it("should map a single transfer to an AccountId and Hbar entry", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [accountAmount(1, Long.fromNumber(100))],
            });

            expect(map.size).to.equal(1);

            const [[accountId, hbar]] = [...map];

            expect(accountId).to.be.an.instanceof(AccountId);
            expect(accountId.toString()).to.equal("0.0.1");
            expect(hbar).to.be.an.instanceof(Hbar);
            expect(hbar.toTinybars().toNumber()).to.equal(100);
        });

        it("should return entries by AccountId and by string key", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [accountAmount(1, Long.fromNumber(100))],
            });

            const byAccountId = map.get(new AccountId(0, 0, 1));
            const byString = map.get("0.0.1");

            expect(byAccountId).to.be.an.instanceof(Hbar);
            expect(byAccountId.toTinybars().toNumber()).to.equal(100);
            expect(byString).to.equal(byAccountId);
        });

        it("should return null for an account that is not in the map", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [accountAmount(1, Long.fromNumber(100))],
            });

            expect(map.get(new AccountId(0, 0, 2))).to.be.null;
            expect(map.get("0.0.2")).to.be.null;
        });

        it("should map multiple transfers, including negative amounts", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [
                    accountAmount(2, Long.fromNumber(-150)),
                    accountAmount(3, Long.fromNumber(100)),
                    accountAmount(4, Long.fromNumber(50)),
                ],
            });

            expect(map.size).to.equal(3);
            expect(map.get("0.0.2").toTinybars().toNumber()).to.equal(-150);
            expect(map.get("0.0.2").isNegative()).to.be.true;
            expect(map.get("0.0.3").toTinybars().toNumber()).to.equal(100);
            expect(map.get("0.0.4").toTinybars().toNumber()).to.equal(50);
        });

        it("should keep the order of the transfers", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [
                    accountAmount(5, Long.fromNumber(1)),
                    accountAmount(3, Long.fromNumber(2)),
                    accountAmount(4, Long.fromNumber(3)),
                ],
            });

            expect([...map.keys()].map((key) => key.toString())).to.deep.equal([
                "0.0.5",
                "0.0.3",
                "0.0.4",
            ]);
            expect(
                [...map.values()].map((hbar) => hbar.toTinybars().toNumber()),
            ).to.deep.equal([1, 2, 3]);
        });

        it("should keep the shard and realm of the account", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [
                    {
                        accountID: {
                            shardNum: Long.fromNumber(1),
                            realmNum: Long.fromNumber(2),
                            accountNum: Long.fromNumber(3),
                        },
                        amount: Long.fromNumber(10),
                    },
                ],
            });

            expect(map.get("1.2.3").toTinybars().toNumber()).to.equal(10);
            expect(map.get("0.0.3")).to.be.null;
        });

        it("should default missing accountID components to 0", function () {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [
                    {
                        accountID: { accountNum: Long.fromNumber(7) },
                        amount: Long.fromNumber(10),
                    },
                ],
            });

            expect(map.get("0.0.7").toTinybars().toNumber()).to.equal(10);
        });

        it("should keep the full precision of large amounts", function () {
            const amount = Long.fromString("9223372036854775807");

            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [accountAmount(1, amount)],
            });

            expect(map.get("0.0.1").toTinybars().toString()).to.equal(
                "9223372036854775807",
            );
        });
    });
});
