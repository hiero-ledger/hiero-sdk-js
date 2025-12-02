import Long from "long";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import LambdaEvmHook from "../../src/hooks/LambdaEvmHook.js";
import { PrivateKey, ContractId } from "../../src/index.js";

describe("HookCreationDetails", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const details = new HookCreationDetails();

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided extensionPoint", function () {
            const extensionPoint = 1;
            const details = new HookCreationDetails({ extensionPoint });

            expect(details.extensionPoint).to.equal(1);
            expect(details.hookId).to.be.null;
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided hookId", function () {
            const hookId = Long.fromNumber(12345);
            const details = new HookCreationDetails({ hookId });

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.equal(hookId);
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided hook", function () {
            const contractId = new ContractId(0, 0, 100);
            const hook = new LambdaEvmHook({ contractId });
            const details = new HookCreationDetails({ hook });

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.hook).to.equal(hook);
            expect(details.adminKey).to.be.null;
        });

        it("should create an instance with provided adminKey", function () {
            const key = PrivateKey.generateED25519().publicKey;
            const details = new HookCreationDetails({ key });

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.equal(key);
        });

        it("should create an instance with all properties", function () {
            const extensionPoint = 2;
            const hookId = Long.fromNumber(999);
            const contractId = new ContractId(1, 2, 3);
            const hook = new LambdaEvmHook({ contractId });
            const key = PrivateKey.generateECDSA().publicKey;

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                hook,
                key,
            });

            expect(details.extensionPoint).to.equal(extensionPoint);
            expect(details.hookId).to.equal(hookId);
            expect(details.hook).to.equal(hook);
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

    describe("setHook", function () {
        it("should set hook and return this for chaining", function () {
            const details = new HookCreationDetails();
            const contractId = new ContractId(5, 6, 7);
            const hook = new LambdaEvmHook({ contractId });

            const result = details.setHook(hook);

            expect(result).to.equal(details);
            expect(details.hook).to.equal(hook);
        });

        it("should overwrite existing hook", function () {
            const oldContractId = new ContractId(1, 1, 1);
            const oldHook = new LambdaEvmHook({ contractId: oldContractId });
            const newContractId = new ContractId(2, 2, 2);
            const newHook = new LambdaEvmHook({ contractId: newContractId });

            const details = new HookCreationDetails({ hook: oldHook });
            details.setHook(newHook);

            expect(details.hook).to.equal(newHook);
            expect(details.hook).to.not.equal(oldHook);
        });
    });

    describe("setKey", function () {
        it("should set adminKey and return this for chaining", function () {
            const details = new HookCreationDetails();
            const key = PrivateKey.generateED25519().publicKey;

            const result = details.setKey(key);

            expect(result).to.equal(details);
            expect(details.adminKey).to.equal(key);
        });

        it("should overwrite existing adminKey", function () {
            const oldKey = PrivateKey.generateED25519().publicKey;
            const newKey = PrivateKey.generateECDSA().publicKey;
            const details = new HookCreationDetails({ key: oldKey });

            details.setKey(newKey);

            expect(details.adminKey).to.equal(newKey);
            expect(details.adminKey).to.not.equal(oldKey);
        });

        it("should handle both ED25519 and ECDSA keys", function () {
            const details = new HookCreationDetails();

            const ed25519Key = PrivateKey.generateED25519().publicKey;
            details.setKey(ed25519Key);
            expect(details.adminKey).to.equal(ed25519Key);

            const ecdsaKey = PrivateKey.generateECDSA().publicKey;
            details.setKey(ecdsaKey);
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

        it("should get hook using getter", function () {
            const contractId = new ContractId(8, 9, 10);
            const hook = new LambdaEvmHook({ contractId });
            const details = new HookCreationDetails({ hook });

            expect(details.hook).to.equal(hook);
        });

        it("should get adminKey using getter", function () {
            const key = PrivateKey.generateED25519().publicKey;
            const details = new HookCreationDetails({ key });

            expect(details.adminKey).to.equal(key);
        });

        it("should return null for all unset properties", function () {
            const details = new HookCreationDetails();

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.be.null;
        });
    });

    describe("method chaining", function () {
        it("should support full method chaining", function () {
            const extensionPoint = 3;
            const hookId = Long.fromNumber(777);
            const contractId = new ContractId(4, 5, 6);
            const hook = new LambdaEvmHook({ contractId });
            const key = PrivateKey.generateED25519().publicKey;

            const details = new HookCreationDetails()
                .setExtensionPoint(extensionPoint)
                .setHookId(hookId)
                .setHook(hook)
                .setKey(key);

            expect(details.extensionPoint).to.equal(extensionPoint);
            expect(details.hookId).to.equal(hookId);
            expect(details.hook).to.equal(hook);
            expect(details.adminKey).to.equal(key);
        });

        it("should support partial method chaining", function () {
            const details = new HookCreationDetails()
                .setExtensionPoint(1)
                .setHookId(Long.fromNumber(123));

            expect(details.extensionPoint).to.equal(1);
            expect(details.hookId.toNumber()).to.equal(123);
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const extensionPoint = 4;
            const hookId = Long.fromNumber(5000);
            const contractId = new ContractId(7, 8, 9);
            const hook = new LambdaEvmHook({ contractId });
            const key = PrivateKey.generateED25519().publicKey;

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                hook,
                key,
            });

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.equal(extensionPoint);
            expect(proto.hookId).to.equal(hookId);
            expect(proto.lambdaEvmHook).to.not.be.null;
            expect(proto.adminKey).to.not.be.null;
        });

        it("should convert to protobuf with null hook", function () {
            const extensionPoint = 2;
            const hookId = Long.fromNumber(100);
            const key = PrivateKey.generateECDSA().publicKey;

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                key,
            });

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.equal(extensionPoint);
            expect(proto.hookId).to.equal(hookId);
            expect(proto.lambdaEvmHook).to.be.null;
            expect(proto.adminKey).to.not.be.null;
        });

        it("should convert to protobuf with null adminKey", function () {
            const extensionPoint = 5;
            const hookId = Long.fromNumber(999);
            const contractId = new ContractId(1, 2, 3);
            const hook = new LambdaEvmHook({ contractId });

            const details = new HookCreationDetails({
                extensionPoint,
                hookId,
                hook,
            });

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.equal(extensionPoint);
            expect(proto.hookId).to.equal(hookId);
            expect(proto.lambdaEvmHook).to.not.be.null;
            expect(proto.adminKey).to.be.null;
        });

        it("should convert to protobuf with all null fields", function () {
            const details = new HookCreationDetails();

            const proto = details._toProtobuf();

            expect(proto.extensionPoint).to.be.null;
            expect(proto.hookId).to.be.null;
            expect(proto.lambdaEvmHook).to.be.null;
            expect(proto.adminKey).to.be.null;
        });

        it("should call _toProtobuf on hook", function () {
            const contractId = new ContractId(5, 5, 5);
            const hook = new LambdaEvmHook({ contractId });
            const details = new HookCreationDetails({ hook });

            const proto = details._toProtobuf();

            expect(proto.lambdaEvmHook).to.deep.equal(hook._toProtobuf());
        });

        it("should call _toProtobufKey on adminKey", function () {
            const key = PrivateKey.generateED25519().publicKey;
            const details = new HookCreationDetails({ key });

            const proto = details._toProtobuf();

            expect(proto.adminKey).to.deep.equal(key._toProtobufKey());
        });
    });

    describe("edge cases", function () {
        it("should handle extensionPoint of 0", function () {
            const details = new HookCreationDetails({ extensionPoint: 0 });

            expect(details.extensionPoint).to.equal(0);

            const proto = details._toProtobuf();
            expect(proto.extensionPoint).to.equal(0);
        });

        it("should handle hookId of 0", function () {
            const hookId = Long.ZERO;
            const details = new HookCreationDetails({ hookId });

            expect(details.hookId.equals(Long.ZERO)).to.be.true;

            const proto = details._toProtobuf();
            expect(proto.hookId.equals(Long.ZERO)).to.be.true;
        });

        it("should handle empty constructor props object", function () {
            const details = new HookCreationDetails({});

            expect(details.extensionPoint).to.be.null;
            expect(details.hookId).to.be.null;
            expect(details.hook).to.be.null;
            expect(details.adminKey).to.be.null;
        });

        it("should not mutate original objects", function () {
            const hookId = Long.fromNumber(5000);
            const originalValue = hookId.toNumber();
            const contractId = new ContractId(1, 2, 3);
            const hook = new LambdaEvmHook({ contractId });

            const details = new HookCreationDetails({ hookId, hook });
            details.setHookId(Long.fromNumber(9999));
            details.setHook(new LambdaEvmHook());

            expect(hookId.toNumber()).to.equal(originalValue);
            expect(hook.contractId).to.equal(contractId);
        });
    });

    describe("integration tests", function () {
        it("should work with complex LambdaEvmHook", function () {
            const contractId = new ContractId(10, 20, 30);
            const hook = new LambdaEvmHook({
                contractId,
                storageUpdates: [],
            });
            const details = new HookCreationDetails({
                extensionPoint: 1,
                hookId: Long.fromNumber(100),
                hook,
                key: PrivateKey.generateED25519().publicKey,
            });

            const proto = details._toProtobuf();

            expect(proto.lambdaEvmHook.spec.contractId).to.deep.equal(
                contractId._toProtobuf(),
            );
        });

        it("should preserve all properties through setters", function () {
            const details = new HookCreationDetails();

            const extensionPoint = 99;
            const hookId = Long.fromNumber(12345);
            const contractId = new ContractId(1, 2, 3);
            const hook = new LambdaEvmHook({ contractId });
            const key = PrivateKey.generateECDSA().publicKey;

            details
                .setExtensionPoint(extensionPoint)
                .setHookId(hookId)
                .setHook(hook)
                .setKey(key);

            expect(details.extensionPoint).to.equal(extensionPoint);
            expect(details.hookId.equals(hookId)).to.be.true;
            expect(details.hook).to.equal(hook);
            expect(details.adminKey).to.equal(key);
        });
    });
});
