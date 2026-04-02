import Long from "long";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import { PrivateKey, ContractId } from "../../src/index.js";

describe("HookCreationDetails", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const details = new HookCreationDetails();

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided extensionPoint", function () {
            const extensionPoint = 1;
            const details = new HookCreationDetails({ extensionPoint });

            expect(details.extensionPoint).to.equal(1);
            expect(details.hookId).to.be.null;
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided hookId", function () {
            const hookId = Long.fromNumber(12345);
            const details = new HookCreationDetails({ hookId });

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.equal(hookId);
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided evmHook", function () {
            const contractId = new ContractId(0, 0, 100);
            const hook = new EvmHook({ contractId });
            const details = new HookCreationDetails({ evmHook: hook });

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.evmHook).to.equal(hook);
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided adminKey", function () {
            const key = PrivateKey.generateED25519().publicKey;
            const details = new HookCreationDetails({ adminKey: key });

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.equal(key);
        });

        it("should create an instance with all properties", function () {
            const extensionPoint = 2;
            const hookId = Long.fromNumber(999);
            const contractId = new ContractId(1, 2, 3);
            const hook = new EvmHook({ contractId });
            const key = PrivateKey.generateECDSA().publicKey;

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                evmHook: hook,
                adminKey: key,
            });

            expect(details.extensionPoint).to.equal(extensionPoint);
            expect(details.hookId).to.equal(hookId);
            expect(details.evmHook).to.equal(hook);
            expect(details.adminKey).to.equal(key);
        });
    });

    describe("setExtensionPoint", function () {
        it("should set extensionPoint and return this for chaining", function () {
            const details = new HookCreationDetails();
            const result = details.setExtensionPoint(5);

            expect(result).to.equal(details);
            expect(details.extensionPoint).to.equal(5);
        });

        it("should overwrite existing extensionPoint", function () {
            const details = new HookCreationDetails({ extensionPoint: 1 });
            details.setExtensionPoint(10);

            expect(details.extensionPoint).to.equal(10);
        });

        it("should handle zero as valid extensionPoint", function () {
            const details = new HookCreationDetails();
            details.setExtensionPoint(0);

            expect(details.extensionPoint).to.equal(0);
        });
    });

    describe("setHookId", function () {
        it("should set hookId and return this for chaining", function () {
            const details = new HookCreationDetails();
            const hookId = Long.fromNumber(5555);
            const result = details.setHookId(hookId);

            expect(result).to.equal(details);
            expect(details.hookId).to.equal(hookId);
        });

        it("should overwrite existing hookId", function () {
            const oldId = Long.fromNumber(100);
            const newId = Long.fromNumber(200);
            const details = new HookCreationDetails({ hookId: oldId });

            details.setHookId(newId);

            expect(details.hookId).to.equal(newId);
        });

        it("should handle large Long values", function () {
            const details = new HookCreationDetails();
            const largeId = Long.fromString("9223372036854775807"); // Max Long value

            details.setHookId(largeId);

            expect(details.hookId.equals(largeId)).to.be.true;
        });
    });

    describe("setEvmHook", function () {
        it("should set evmHook and return this for chaining", function () {
            const details = new HookCreationDetails();
            const contractId = new ContractId(5, 6, 7);
            const hook = new EvmHook({ contractId });

            const result = details.setEvmHook(hook);

            expect(result).to.equal(details);
            expect(details.evmHook).to.equal(hook);
        });

        it("should overwrite existing evmHook", function () {
            const oldContractId = new ContractId(1, 1, 1);
            const oldHook = new EvmHook({ contractId: oldContractId });
            const newContractId = new ContractId(2, 2, 2);
            const newHook = new EvmHook({ contractId: newContractId });

            const details = new HookCreationDetails({ evmHook: oldHook });
            details.setEvmHook(newHook);

            expect(details.evmHook).to.equal(newHook);
            expect(details.evmHook).to.not.equal(oldHook);
        });
    });

    describe("setAdminKey", function () {
        it("should set adminKey and return this for chaining", function () {
            const details = new HookCreationDetails();
            const key = PrivateKey.generateED25519().publicKey;

            const result = details.setAdminKey(key);

            expect(result).to.equal(details);
            expect(details.adminKey).to.equal(key);
        });

        it("should overwrite existing adminKey", function () {
            const oldKey = PrivateKey.generateED25519().publicKey;
            const newKey = PrivateKey.generateECDSA().publicKey;
            const details = new HookCreationDetails({ adminKey: oldKey });

            details.setAdminKey(newKey);

            expect(details.adminKey).to.equal(newKey);
            expect(details.adminKey).to.not.equal(oldKey);
        });

        it("should handle both ED25519 and ECDSA keys", function () {
            const details = new HookCreationDetails();

            const ed25519Key = PrivateKey.generateED25519().publicKey;
            details.setAdminKey(ed25519Key);
            expect(details.adminKey).to.equal(ed25519Key);

            const ecdsaKey = PrivateKey.generateECDSA().publicKey;
            details.setAdminKey(ecdsaKey);
            expect(details.adminKey).to.equal(ecdsaKey);
        });
    });

    describe("getters", function () {
        it("should get extensionPoint using getter", function () {
            const details = new HookCreationDetails({ extensionPoint: 7 });

            expect(details.extensionPoint).to.equal(7);
        });

        it("should get hookId using getter", function () {
            const hookId = Long.fromNumber(88888);
            const details = new HookCreationDetails({ hookId });

            expect(details.hookId).to.equal(hookId);
        });

        it("should get evmHook using getter", function () {
            const contractId = new ContractId(8, 9, 10);
            const hook = new EvmHook({ contractId });
            const details = new HookCreationDetails({ evmHook: hook });

            expect(details.evmHook).to.equal(hook);
        });

        it("should get adminKey using getter", function () {
            const key = PrivateKey.generateED25519().publicKey;
            const details = new HookCreationDetails({ adminKey: key });

            expect(details.adminKey).to.equal(key);
        });

        it("should return null for all unset properties", function () {
            const details = new HookCreationDetails();

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.be.null;
        });
    });

    describe("method chaining", function () {
        it("should support full method chaining", function () {
            const extensionPoint = 3;
            const hookId = Long.fromNumber(777);
            const contractId = new ContractId(4, 5, 6);
            const hook = new EvmHook({ contractId });
            const key = PrivateKey.generateED25519().publicKey;

            const details = new HookCreationDetails()
                .setExtensionPoint(extensionPoint)
                .setHookId(hookId)
                .setEvmHook(hook)
                .setAdminKey(key);

            expect(details.extensionPoint).to.equal(extensionPoint);
            expect(details.hookId).to.equal(hookId);
            expect(details.evmHook).to.equal(hook);
            expect(details.adminKey).to.equal(key);
        });

        it("should support partial method chaining", function () {
            const details = new HookCreationDetails()
                .setExtensionPoint(1)
                .setHookId(Long.fromNumber(123));

            expect(details.extensionPoint).to.equal(1);
            expect(details.hookId.toNumber()).to.equal(123);
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const extensionPoint = 4;
            const hookId = Long.fromNumber(5000);
            const contractId = new ContractId(7, 8, 9);
            const hook = new EvmHook({ contractId });
            const key = PrivateKey.generateED25519().publicKey;

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                evmHook: hook,
                adminKey: key,
            });

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.equal(extensionPoint);
            expect(proto.hookId).to.equal(hookId);
            expect(proto.evmHook).to.not.be.null;
            expect(proto.adminKey).to.not.be.null;
        });

        it("should convert to protobuf with null hook", function () {
            const extensionPoint = 2;
            const hookId = Long.fromNumber(100);
            const key = PrivateKey.generateECDSA().publicKey;

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                adminKey: key,
            });

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.equal(extensionPoint);
            expect(proto.hookId).to.equal(hookId);
            expect(proto.evmHook).to.be.null;
            expect(proto.adminKey).to.not.be.null;
        });

        it("should convert to protobuf with null adminKey", function () {
            const extensionPoint = 5;
            const hookId = Long.fromNumber(999);
            const contractId = new ContractId(1, 2, 3);
            const hook = new EvmHook({ contractId });

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                evmHook: hook,
            });

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.equal(extensionPoint);
            expect(proto.hookId).to.equal(hookId);
            expect(proto.evmHook).to.not.be.null;
            expect(proto.adminKey).to.be.null;
        });

        it("should throw error when converting to protobuf with missing required fields", function () {
            const details = new HookCreationDetails();

            expect(() => details._toProtobuf()).to.throw(
                Error,
                "extensionPoint is required for HookCreationDetails",
            );
        });

        it("should call _toProtobuf on evmHook", function () {
            const contractId = new ContractId(5, 5, 5);
            const hook = new EvmHook({ contractId });
            const details = new HookCreationDetails({
                extensionPoint: 1,
                hookId: Long.fromNumber(1),
                evmHook: hook,
            });

            const proto = details._toProtobuf();

            expect(proto.evmHook).to.deep.equal(hook._toProtobuf());
        });

        it("should call _toProtobufKey on adminKey", function () {
            const key = PrivateKey.generateED25519().publicKey;
            const details = new HookCreationDetails({
                extensionPoint: 1,
                hookId: Long.fromNumber(1),
                adminKey: key,
            });

            const proto = details._toProtobuf();

            expect(proto.adminKey).to.deep.equal(key._toProtobufKey());
        });
    });

    describe("edge cases", function () {
        it("should handle extensionPoint of 0", function () {
            const details = new HookCreationDetails({
                extensionPoint: 0,
                hookId: Long.fromNumber(1),
            });

            expect(details.extensionPoint).to.equal(0);

            const proto = details._toProtobuf();
            expect(proto.extensionPoint).to.equal(0);
        });

        it("should handle hookId of 0", function () {
            const hookId = Long.ZERO;
            const details = new HookCreationDetails({
                extensionPoint: 1,
                hookId,
            });

            expect(details.hookId.equals(Long.ZERO)).to.be.true;

            const proto = details._toProtobuf();
            expect(proto.hookId.equals(Long.ZERO)).to.be.true;
        });

        it("should handle empty constructor props object", function () {
            const details = new HookCreationDetails({});

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.evmHook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should not mutate original objects", function () {
            const hookId = Long.fromNumber(5000);
            const originalValue = hookId.toNumber();
            const contractId = new ContractId(1, 2, 3);
            const hook = new EvmHook({ contractId });

            const details = new HookCreationDetails({ hookId, evmHook: hook });
            details.setHookId(Long.fromNumber(9999));
            details.setEvmHook(new EvmHook());

            expect(hookId.toNumber()).to.equal(originalValue);
            expect(hook.contractId).to.equal(contractId);
        });
    });

    describe("integration tests", function () {
        it("should work with complex EvmHook", function () {
            const contractId = new ContractId(10, 20, 30);
            const hook = new EvmHook({
                contractId,
                storageUpdates: [],
            });
            const details = new HookCreationDetails({
                extensionPoint: 1,
                hookId: Long.fromNumber(100),
                evmHook: hook,
                adminKey: PrivateKey.generateED25519().publicKey,
            });

            const proto = details._toProtobuf();

            expect(proto.evmHook.spec.contractId).to.deep.equal(
                contractId._toProtobuf(),
            );
        });

        it("should preserve all properties through setters", function () {
            const details = new HookCreationDetails();

            const extensionPoint = 99;
            const hookId = Long.fromNumber(12345);
            const contractId = new ContractId(1, 2, 3);
            const hook = new EvmHook({ contractId });
            const key = PrivateKey.generateECDSA().publicKey;

            details
                .setExtensionPoint(extensionPoint)
                .setHookId(hookId)
                .setEvmHook(hook)
                .setAdminKey(key);

            expect(details.extensionPoint).to.equal(extensionPoint);
            expect(details.hookId.equals(hookId)).to.be.true;
            expect(details.evmHook).to.equal(hook);
            expect(details.adminKey).to.equal(key);
        });
    });
});
