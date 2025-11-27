import HookEntityId from "../../src/hooks/HookEntityId.js";
import { AccountId } from "../../src/index.js";

describe("HookEntityId", function () {
    describe("constructor", function () {
        it("should create an instance with default null accountId", function () {
            const entityId = new HookEntityId();

            expect(entityId.accountId).to.be.null;
        });

        it("should create an instance with provided accountId", function () {
            const accountId = new AccountId(1, 2, 3);
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId).to.equal(accountId);
        });

        it("should create an instance with accountId from string", function () {
            const accountId = AccountId.fromString("0.0.12345");
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId.toString()).to.equal("0.0.12345");
        });

        it("should create an instance with accountId using shard, realm, num", function () {
            const accountId = new AccountId(10, 20, 30);
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId.shard.toNumber()).to.equal(10);
            expect(entityId.accountId.realm.toNumber()).to.equal(20);
            expect(entityId.accountId.num.toNumber()).to.equal(30);
        });

        it("should create an instance with empty props object", function () {
            const entityId = new HookEntityId({});

            expect(entityId.accountId).to.be.null;
        });
    });

    describe("setAccountId", function () {
        it("should set accountId and return this for chaining", function () {
            const entityId = new HookEntityId();
            const accountId = new AccountId(5, 6, 7);

            const result = entityId.setAccountId(accountId);

            expect(result).to.equal(entityId);
            expect(entityId.accountId).to.equal(accountId);
        });

        it("should overwrite existing accountId", function () {
            const oldAccountId = new AccountId(1, 2, 3);
            const newAccountId = new AccountId(4, 5, 6);
            const entityId = new HookEntityId({ accountId: oldAccountId });

            entityId.setAccountId(newAccountId);

            expect(entityId.accountId).to.equal(newAccountId);
            expect(entityId.accountId).to.not.equal(oldAccountId);
        });

        it("should handle different AccountId formats", function () {
            const entityId = new HookEntityId();

            // Set from new AccountId
            const numericId = new AccountId(1, 2, 100);
            entityId.setAccountId(numericId);
            expect(entityId.accountId.toString()).to.equal("1.2.100");

            // Set from AccountId.fromString
            const stringId = AccountId.fromString("5.10.999");
            entityId.setAccountId(stringId);
            expect(entityId.accountId.toString()).to.equal("5.10.999");
        });

        it("should handle accountId with alias", function () {
            const accountId = AccountId.fromString(
                "0.0.302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777",
            );
            const entityId = new HookEntityId();

            entityId.setAccountId(accountId);

            expect(entityId.accountId).to.equal(accountId);
        });
    });

    describe("getter", function () {
        it("should get accountId using getter", function () {
            const accountId = new AccountId(10, 20, 30);
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId).to.equal(accountId);
        });

        it("should return null for unset accountId", function () {
            const entityId = new HookEntityId();

            expect(entityId.accountId).to.be.null;
        });

        it("should get updated accountId after setter is called", function () {
            const initialId = new AccountId(1, 1, 1);
            const entityId = new HookEntityId({ accountId: initialId });

            const newId = new AccountId(2, 2, 2);
            entityId.setAccountId(newId);

            expect(entityId.accountId).to.equal(newId);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with accountId", function () {
            const accountId = new AccountId(3, 4, 5);
            const entityId = new HookEntityId({ accountId });

            const proto = entityId._toProtobuf();

            expect(proto.accountId).to.not.be.null;
            expect(proto.accountId).to.deep.equal(accountId._toProtobuf());
        });

        it("should convert to protobuf with null accountId", function () {
            const entityId = new HookEntityId();

            const proto = entityId._toProtobuf();

            expect(proto.accountId).to.be.null;
        });

        it("should handle accountId with shard 0, realm 0, num 0", function () {
            const accountId = new AccountId(0, 0, 0);
            const entityId = new HookEntityId({ accountId });

            const proto = entityId._toProtobuf();

            expect(proto.accountId).to.not.be.null;
            expect(proto.accountId.shardNum.toNumber()).to.equal(0);
            expect(proto.accountId.realmNum.toNumber()).to.equal(0);
            expect(proto.accountId.accountNum.toNumber()).to.equal(0);
        });

        it("should produce valid protobuf structure", function () {
            const accountId = new AccountId(7, 8, 9);
            const entityId = new HookEntityId({ accountId });

            const proto = entityId._toProtobuf();

            expect(proto).to.be.an("object");
            expect(proto).to.have.property("accountId");
        });
    });

    describe("_fromProtobuf", function () {
        it("should create instance from protobuf with accountId", function () {
            const accountId = new AccountId(11, 12, 13);
            const proto = {
                accountId: accountId._toProtobuf(),
            };

            const entityId = HookEntityId._fromProtobuf(proto);

            expect(entityId).to.be.instanceOf(HookEntityId);
            expect(entityId.accountId.toString()).to.equal("11.12.13");
        });

        it("should create instance from protobuf with null accountId", function () {
            const proto = {
                accountId: null,
            };

            const entityId = HookEntityId._fromProtobuf(proto);

            expect(entityId).to.be.instanceOf(HookEntityId);
            expect(entityId.accountId).to.be.null;
        });

        it("should create instance from protobuf without accountId field", function () {
            const proto = {};

            const entityId = HookEntityId._fromProtobuf(proto);

            expect(entityId).to.be.instanceOf(HookEntityId);
            expect(entityId.accountId).to.be.null;
        });

        it("should preserve AccountId properties from protobuf", function () {
            const accountId = new AccountId(99, 88, 77);
            const proto = {
                accountId: accountId._toProtobuf(),
            };

            const entityId = HookEntityId._fromProtobuf(proto);

            expect(entityId.accountId.shard.toNumber()).to.equal(99);
            expect(entityId.accountId.realm.toNumber()).to.equal(88);
            expect(entityId.accountId.num.toNumber()).to.equal(77);
        });
    });

    describe("round-trip serialization", function () {
        it("should maintain data through protobuf round-trip", function () {
            const original = new HookEntityId({
                accountId: new AccountId(15, 25, 35),
            });

            const proto = original._toProtobuf();
            const restored = HookEntityId._fromProtobuf(proto);

            expect(restored.accountId.toString()).to.equal(
                original.accountId.toString(),
            );
        });

        it("should handle empty instance round-trip", function () {
            const original = new HookEntityId();

            const proto = original._toProtobuf();
            const restored = HookEntityId._fromProtobuf(proto);

            expect(restored.accountId).to.be.null;
        });

        it("should maintain AccountId with alias through round-trip", function () {
            const accountId = AccountId.fromString(
                "0.0.302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777",
            );
            const original = new HookEntityId({ accountId });

            const proto = original._toProtobuf();
            const restored = HookEntityId._fromProtobuf(proto);

            expect(restored.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });
    });

    describe("method chaining", function () {
        it("should support method chaining with setAccountId", function () {
            const accountId = new AccountId(11, 12, 13);

            const entityId = new HookEntityId().setAccountId(accountId);

            expect(entityId.accountId).to.equal(accountId);
        });

        it("should support multiple setter calls", function () {
            const firstId = new AccountId(1, 1, 1);
            const secondId = new AccountId(2, 2, 2);
            const thirdId = new AccountId(3, 3, 3);

            const entityId = new HookEntityId()
                .setAccountId(firstId)
                .setAccountId(secondId)
                .setAccountId(thirdId);

            expect(entityId.accountId).to.equal(thirdId);
        });
    });

    describe("edge cases", function () {
        it("should handle very large account numbers", function () {
            const accountId = new AccountId(0, 0, 999999999);
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId.toString()).to.equal("0.0.999999999");
        });

        it("should handle different shard and realm values", function () {
            const accountId = new AccountId(255, 255, 255);
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId.shard.toNumber()).to.equal(255);
            expect(entityId.accountId.realm.toNumber()).to.equal(255);
            expect(entityId.accountId.num.toNumber()).to.equal(255);
        });

        it("should not mutate the original accountId object", function () {
            const accountId = new AccountId(5, 5, 5);
            const originalString = accountId.toString();

            const entityId = new HookEntityId({ accountId });
            entityId.setAccountId(new AccountId(9, 9, 9));

            expect(accountId.toString()).to.equal(originalString);
        });

        it("should handle AccountId created from different methods", function () {
            const fromNew = new AccountId(1, 2, 3);
            const fromString = AccountId.fromString("1.2.3");

            const entityId1 = new HookEntityId({ accountId: fromNew });
            const entityId2 = new HookEntityId({ accountId: fromString });

            expect(entityId1.accountId.toString()).to.equal(
                entityId2.accountId.toString(),
            );
        });
    });

    describe("integration with AccountId", function () {
        it("should work with AccountId.fromString", function () {
            const accountId = AccountId.fromString("10.20.30");
            const entityId = new HookEntityId({ accountId });

            const proto = entityId._toProtobuf();

            expect(proto.accountId).to.deep.equal(accountId._toProtobuf());
        });

        it("should preserve AccountId properties", function () {
            const accountId = new AccountId(100, 200, 300);
            const entityId = new HookEntityId({ accountId });

            expect(entityId.accountId.shard.toNumber()).to.equal(100);
            expect(entityId.accountId.realm.toNumber()).to.equal(200);
            expect(entityId.accountId.num.toNumber()).to.equal(300);
        });

        it("should handle AccountId equals comparison", function () {
            const accountId1 = new AccountId(5, 6, 7);
            const accountId2 = new AccountId(5, 6, 7);

            const entityId = new HookEntityId({ accountId: accountId1 });

            expect(entityId.accountId.toString()).to.equal(
                accountId2.toString(),
            );
        });
    });
});
