// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import ProxyStaker from "../../../src/account/ProxyStaker.js";
import AccountId from "../../../src/account/AccountId.js";
import Hbar from "../../../src/Hbar.js";
import Long from "long";

describe("ProxyStaker", () => {
    const accountId = new AccountId(0, 0, 5); // 

    describe("constructor", () => {
        it("wraps a raw number amount in an Hbar instance", () => {
            const staker = new ProxyStaker({ accountId, amount: 10 });
            expect(staker.amount).toBeInstanceOf(Hbar);
            expect(staker.amount.toTinybars().toNumber()).toBe(
                new Hbar(10).toTinybars().toNumber(),
            );
        });

        it("stores an Hbar instance directly without re-wrapping", () => {
            const hbar = Hbar.fromTinybars(500);
            const staker = new ProxyStaker({ accountId, amount: hbar });
            expect(staker.amount).toBe(hbar);
        });

        it("wraps a string amount in an Hbar instance", () => {
            const staker = new ProxyStaker({ accountId, amount: "5" });
            expect(staker.amount).toBeInstanceOf(Hbar);
            expect(staker.amount.toTinybars().toNumber()).toBe(
                new Hbar("5").toTinybars().toNumber(),
            );
        });

        it("stores the accountId as provided", () => {
            const staker = new ProxyStaker({ accountId, amount: 0 });
            expect(staker.accountId).toBe(accountId);
        });

        it("is frozen after construction", () => {
            const staker = new ProxyStaker({ accountId, amount: 0 });
            expect(Object.isFrozen(staker)).toBe(true);
        });
    });

    describe("_fromProtobuf", () => {
        it("deserializes a protobuf object with a positive amount", () => {
            const proto = {
                accountID: { shardNum: 0, realmNum: 0, accountNum: 5 },
                amount: Long.fromNumber(50),
            };
            const staker = ProxyStaker._fromProtobuf(proto);
            expect(staker).toBeInstanceOf(ProxyStaker);
            expect(staker.accountId.toString()).toBe("0.0.5");
            expect(staker.amount.toTinybars().toNumber()).toBe(50);
        });

        it("deserializes a protobuf object with a negative amount", () => {
            const proto = {
                accountID: { shardNum: 0, realmNum: 0, accountNum: 7 },
                amount: Long.fromNumber(-200),
            };
            const staker = ProxyStaker._fromProtobuf(proto);
            expect(staker.amount.toTinybars().toNumber()).toBe(-200);
        });

        it("defaults to 0 tinybars when amount is null", () => {
            const proto = {
                accountID: { shardNum: 0, realmNum: 0, accountNum: 3 },
                amount: null,
            };
            const staker = ProxyStaker._fromProtobuf(proto);
            expect(staker.amount.toTinybars().toNumber()).toBe(0);
        });

        it("defaults to 0 tinybars when amount is undefined", () => {
            const proto = {
                accountID: { shardNum: 0, realmNum: 0, accountNum: 3 },
            };
            const staker = ProxyStaker._fromProtobuf(proto);
            expect(staker.amount.toTinybars().toNumber()).toBe(0);
        });
    });


    describe("_toProtobuf", () => {
        it("serializes to a protobuf object", () => {
    const hbar = Hbar.fromTinybars(750);
    const staker = new ProxyStaker({ accountId, amount: hbar });
    const proto = staker._toProtobuf();

    // Compare account fields as numbers
    expect(proto.accountID.shardNum.toNumber()).toBe(0);
    expect(proto.accountID.realmNum.toNumber()).toBe(0);
    expect(proto.accountID.accountNum.toNumber()).toBe(5);
    expect(proto.amount.toNumber()).toBe(750);
});

        it("round-trips through _fromProtobuf and _toProtobuf", () => {
    const original = {
        accountID: { shardNum: 0, realmNum: 0, accountNum: 5 },
        amount: Long.fromNumber(1234),
    };
    const staker = ProxyStaker._fromProtobuf(original);
    const roundTripped = staker._toProtobuf();

   
    expect(roundTripped.accountID.shardNum.toNumber()).toBe(original.accountID.shardNum);
    expect(roundTripped.accountID.realmNum.toNumber()).toBe(original.accountID.realmNum);
    expect(roundTripped.accountID.accountNum.toNumber()).toBe(original.accountID.accountNum);
    expect(roundTripped.amount.toNumber()).toBe(original.amount.toNumber());
});

        it("round-trips a zero amount correctly", () => {
            const original = {
                accountID: { shardNum: 0, realmNum: 0, accountNum: 1 },
                amount: Long.fromNumber(0),
            };
            const staker = ProxyStaker._fromProtobuf(original);
            const roundTripped = staker._toProtobuf();
            expect(roundTripped.amount.toNumber()).toBe(0);
        });

        it("round-trips a negative amount correctly", () => {
            const original = {
                accountID: { shardNum: 0, realmNum: 0, accountNum: 2 },
                amount: Long.fromNumber(-500),
            };
            const staker = ProxyStaker._fromProtobuf(original);
            const roundTripped = staker._toProtobuf();
            expect(roundTripped.amount.toNumber()).toBe(-500);
        });
    });
});