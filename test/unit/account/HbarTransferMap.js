// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import HbarTransferMap from "../../../src/account/HbarTransferMap.js";
import AccountId from "../../../src/account/AccountId.js";

describe("HbarTransferMap", () => {
    it("uses AccountId.fromString callback configured in constructor", () => {
        const map = new HbarTransferMap();
        const id = map._fromString("0.0.7");

        expect(id.toString()).toBe("0.0.7");
    });

    describe("_fromProtobuf", () => {
        it("returns an empty map when accountAmounts is null", () => {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: null,
            });

            expect(map).toBeInstanceOf(HbarTransferMap);
            expect(map.size).toBe(0);
        });

        it("maps account amounts to AccountId → Hbar and supports get() by id", () => {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [
                    {
                        accountID: {
                            shardNum: 0,
                            realmNum: 0,
                            accountNum: 1,
                        },
                        amount: Long.fromNumber(100),
                    },
                ],
            });

            expect(map.size).toBe(1);

            const id = AccountId.fromString("0.0.1");
            const hbar = map.get(id);
            const hbarByString = map.get("0.0.1");

            expect(hbar).not.toBeNull();
            expect(hbarByString).not.toBeNull();
            expect(hbar.toTinybars().toString()).toBe("100");
            expect(hbarByString.toTinybars().toString()).toBe("100");
        });

        it("handles multiple accountAmounts entries", () => {
            const map = HbarTransferMap._fromProtobuf({
                accountAmounts: [
                    {
                        accountID: {
                            shardNum: 0,
                            realmNum: 0,
                            accountNum: 1,
                        },
                        amount: Long.fromNumber(50),
                    },
                    {
                        accountID: {
                            shardNum: 0,
                            realmNum: 0,
                            accountNum: 2,
                        },
                        amount: Long.fromNumber(-25),
                    },
                ],
            });

            expect(map.size).toBe(2);

            const a1 = map.get(AccountId.fromString("0.0.1"));
            const a2 = map.get(AccountId.fromString("0.0.2"));

            expect(a1).not.toBeNull();
            expect(a2).not.toBeNull();
            expect(a1.toTinybars().toString()).toBe("50");
            expect(a2.toTinybars().toString()).toBe("-25");
        });
    });
});
