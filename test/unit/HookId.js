import Long from "long";
import HookId from "../../src/hooks/HookId.js";
import HookEntityId from "../../src/hooks/HookEntityId.js";
import { AccountId } from "../../src/index.js";

describe("HookId", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const hookId = new HookId();

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId).to.be.null;
        });

        it("should create an instance with provided entityId", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(1, 2, 3),
            });
            const hookId = new HookId({ entityId });

            expect(hookId.entityId).to.equal(entityId);
            expect(hookId.hookId).to.be.null;
        });

        it("should create an instance with provided hookId", function () {
            const id = Long.fromNumber(12345);
            const hookId = new HookId({ hookId: id });

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId).to.equal(id);
        });

        it("should create an instance with both entityId and hookId", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(5, 6, 7),
            });
            const id = Long.fromNumber(99999);
            const hookId = new HookId({ entityId, hookId: id });

            expect(hookId.entityId).to.equal(entityId);
            expect(hookId.hookId).to.equal(id);
        });

        it("should create an instance with empty props object", function () {
            const hookId = new HookId({});

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId).to.be.null;
        });
    });

    describe("setEntityId", function () {
        it("should set entityId and return this for chaining", function () {
            const hookId = new HookId();
            const entityId = new HookEntityId({
                accountId: new AccountId(10, 20, 30),
            });

            const result = hookId.setEntityId(entityId);

            expect(result).to.equal(hookId);
            expect(hookId.entityId).to.equal(entityId);
        });

        it("should overwrite existing entityId", function () {
            const oldEntityId = new HookEntityId({
                accountId: new AccountId(1, 1, 1),
            });
            const newEntityId = new HookEntityId({
                accountId: new AccountId(2, 2, 2),
            });
            const hookId = new HookId({ entityId: oldEntityId });

            hookId.setEntityId(newEntityId);

            expect(hookId.entityId).to.equal(newEntityId);
            expect(hookId.entityId).to.not.equal(oldEntityId);
        });

        it("should handle entityId with different account formats", function () {
            const hookId = new HookId();

            const entityId1 = new HookEntityId({
                accountId: new AccountId(1, 2, 3),
            });
            hookId.setEntityId(entityId1);
            expect(hookId.entityId.accountId.toString()).to.equal("1.2.3");

            const entityId2 = new HookEntityId({
                accountId: AccountId.fromString("5.10.999"),
            });
            hookId.setEntityId(entityId2);
            expect(hookId.entityId.accountId.toString()).to.equal("5.10.999");
        });
    });

    describe("setHookId", function () {
        it("should set hookId and return this for chaining", function () {
            const hookId = new HookId();
            const id = Long.fromNumber(5555);

            const result = hookId.setHookId(id);

            expect(result).to.equal(hookId);
            expect(hookId.hookId).to.equal(id);
        });

        it("should overwrite existing hookId", function () {
            const oldId = Long.fromNumber(100);
            const newId = Long.fromNumber(200);
            const hookId = new HookId({ hookId: oldId });

            hookId.setHookId(newId);

            expect(hookId.hookId).to.equal(newId);
            expect(hookId.hookId).to.not.equal(oldId);
        });

        it("should handle Long.ZERO", function () {
            const hookId = new HookId();
            hookId.setHookId(Long.ZERO);

            expect(hookId.hookId.equals(Long.ZERO)).to.be.true;
        });

        it("should handle large Long values", function () {
            const hookId = new HookId();
            const largeId = Long.fromString("9223372036854775807"); // Max Long value

            hookId.setHookId(largeId);

            expect(hookId.hookId.equals(largeId)).to.be.true;
        });
    });

    describe("getters", function () {
        it("should get entityId using getter", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(15, 25, 35),
            });
            const hookId = new HookId({ entityId });

            expect(hookId.entityId).to.equal(entityId);
        });

        it("should get hookId using getter", function () {
            const id = Long.fromNumber(88888);
            const hookId = new HookId({ hookId: id });

            expect(hookId.hookId).to.equal(id);
        });

        it("should return null for unset properties", function () {
            const hookId = new HookId();

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId).to.be.null;
        });

        it("should get updated values after setters are called", function () {
            const hookId = new HookId();

            const entityId = new HookEntityId({
                accountId: new AccountId(7, 8, 9),
            });
            const id = Long.fromNumber(777);

            hookId.setEntityId(entityId);
            hookId.setHookId(id);

            expect(hookId.entityId).to.equal(entityId);
            expect(hookId.hookId).to.equal(id);
        });
    });

    describe("method chaining", function () {
        it("should support full method chaining", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(11, 12, 13),
            });
            const id = Long.fromNumber(12345);

            const hookId = new HookId().setEntityId(entityId).setHookId(id);

            expect(hookId.entityId).to.equal(entityId);
            expect(hookId.hookId).to.equal(id);
        });

        it("should support chaining in any order", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(1, 2, 3),
            });
            const id = Long.fromNumber(999);

            const hookId = new HookId().setHookId(id).setEntityId(entityId);

            expect(hookId.entityId).to.equal(entityId);
            expect(hookId.hookId).to.equal(id);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create instance from protobuf with all fields", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(20, 30, 40),
            });
            const id = Long.fromNumber(55555);
            const proto = {
                entityId: entityId._toProtobuf(),
                hookId: id,
            };

            const hookId = HookId._fromProtobuf(proto);

            expect(hookId).to.be.instanceOf(HookId);
            expect(hookId.entityId.accountId.toString()).to.equal("20.30.40");
            expect(hookId.hookId.equals(id)).to.be.true;
        });

        it("should create instance from protobuf with only entityId", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(1, 2, 3),
            });
            const proto = {
                entityId: entityId._toProtobuf(),
            };

            const hookId = HookId._fromProtobuf(proto);

            expect(hookId.entityId).to.not.be.null;
            expect(hookId.hookId).to.be.null;
        });

        it("should create instance from protobuf with only hookId", function () {
            const id = Long.fromNumber(88888);
            const proto = {
                hookId: id,
            };

            const hookId = HookId._fromProtobuf(proto);

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId.equals(id)).to.be.true;
        });

        it("should create instance from empty protobuf", function () {
            const proto = {};

            const hookId = HookId._fromProtobuf(proto);

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId).to.be.null;
        });

        it("should create instance from protobuf with null values", function () {
            const proto = {
                entityId: null,
                hookId: null,
            };

            const hookId = HookId._fromProtobuf(proto);

            expect(hookId.entityId).to.be.null;
            expect(hookId.hookId).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(50, 60, 70),
            });
            const id = Long.fromNumber(33333);
            const hookId = new HookId({ entityId, hookId: id });

            const proto = hookId._toProtobuf();

            expect(proto.entityId).to.not.be.null;
            expect(proto.entityId).to.deep.equal(entityId._toProtobuf());
            expect(proto.hookId).to.equal(id);
        });

        it("should convert to protobuf with null entityId", function () {
            const id = Long.fromNumber(44444);
            const hookId = new HookId({ hookId: id });

            const proto = hookId._toProtobuf();

            expect(proto.entityId).to.be.null;
            expect(proto.hookId).to.equal(id);
        });

        it("should convert to protobuf with null hookId", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(80, 90, 100),
            });
            const hookId = new HookId({ entityId });

            const proto = hookId._toProtobuf();

            expect(proto.entityId).to.not.be.null;
            expect(proto.hookId).to.be.null;
        });

        it("should convert to protobuf with all null fields", function () {
            const hookId = new HookId();

            const proto = hookId._toProtobuf();

            expect(proto.entityId).to.be.null;
            expect(proto.hookId).to.be.null;
        });
    });

    describe("round-trip serialization", function () {
        it("should maintain data through protobuf round-trip", function () {
            const original = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(111, 222, 333),
                }),
                hookId: Long.fromNumber(99999),
            });

            const proto = original._toProtobuf();
            const restored = HookId._fromProtobuf(proto);

            expect(restored.entityId.accountId.toString()).to.equal(
                original.entityId.accountId.toString(),
            );
            expect(restored.hookId.equals(original.hookId)).to.be.true;
        });

        it("should handle empty instance round-trip", function () {
            const original = new HookId();

            const proto = original._toProtobuf();
            const restored = HookId._fromProtobuf(proto);

            expect(restored.entityId).to.be.null;
            expect(restored.hookId).to.be.null;
        });

        it("should handle partial instance round-trip", function () {
            const original = new HookId({
                hookId: Long.fromNumber(12345),
            });

            const proto = original._toProtobuf();
            const restored = HookId._fromProtobuf(proto);

            expect(restored.entityId).to.be.null;
            expect(restored.hookId.toNumber()).to.equal(12345);
        });
    });

    describe("edge cases", function () {
        it("should handle hookId of 0", function () {
            const hookId = new HookId({ hookId: Long.ZERO });

            expect(hookId.hookId.equals(Long.ZERO)).to.be.true;

            const proto = hookId._toProtobuf();
            const restored = HookId._fromProtobuf(proto);
            expect(restored.hookId.equals(Long.ZERO)).to.be.true;
        });

        it("should handle maximum Long value", function () {
            const maxLong = Long.MAX_VALUE;
            const hookId = new HookId({ hookId: maxLong });

            expect(hookId.hookId.equals(maxLong)).to.be.true;
        });

        it("should handle minimum Long value", function () {
            const minLong = Long.MIN_VALUE;
            const hookId = new HookId({ hookId: minLong });

            expect(hookId.hookId.equals(minLong)).to.be.true;
        });

        it("should not mutate original objects", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(5, 5, 5),
            });
            const id = Long.fromNumber(5000);
            const originalIdValue = id.toNumber();
            const originalAccountId = entityId.accountId.toString();

            const hookId = new HookId({ entityId, hookId: id });
            hookId.setEntityId(
                new HookEntityId({ accountId: new AccountId(9, 9, 9) }),
            );
            hookId.setHookId(Long.fromNumber(9999));

            expect(id.toNumber()).to.equal(originalIdValue);
            expect(entityId.accountId.toString()).to.equal(originalAccountId);
        });

        it("should handle entityId with zero account values", function () {
            const entityId = new HookEntityId({
                accountId: new AccountId(0, 0, 0),
            });
            const hookId = new HookId({ entityId });

            expect(hookId.entityId.accountId.toString()).to.equal("0.0.0");
        });
    });
});
