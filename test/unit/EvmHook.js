import EvmHook from "../../src/hooks/EvmHook.js";
import { EvmHookStorageSlot } from "../../src/hooks/EvmHookStorageUpdate.js";
import { ContractId } from "../../src/index.js";

describe("EvmHook", function () {
    describe("constructor", function () {
        it("should create an instance with default values", function () {
            const hook = new EvmHook();

            expect(hook.contractId).to.be.null;
            expect(hook.storageUpdates).to.be.an("array");
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should create an instance with provided contractId", function () {
            const contractId = new ContractId(1, 2, 3);
            const hook = new EvmHook({ contractId });

            expect(hook.contractId).to.equal(contractId);
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should create an instance with provided storageUpdates", function () {
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1, 2, 3]),
                    value: new Uint8Array([4, 5, 6]),
                }),
            ];
            const hook = new EvmHook({ storageUpdates: updates });

            expect(hook.contractId).to.be.null;
            expect(hook.storageUpdates).to.equal(updates);
            expect(hook.storageUpdates).to.have.lengthOf(1);
        });

        it("should create an instance with both contractId and storageUpdates", function () {
            const contractId = new ContractId(5, 6, 7);
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([10, 20]),
                    value: new Uint8Array([30, 40]),
                }),
            ];
            const hook = new EvmHook({
                contractId,
                storageUpdates: updates,
            });

            expect(hook.contractId).to.equal(contractId);
            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should create an instance with empty storageUpdates array", function () {
            const hook = new EvmHook({ storageUpdates: [] });

            expect(hook.contractId).to.be.null;
            expect(hook.storageUpdates).to.be.an("array");
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should create an instance with empty props object", function () {
            const hook = new EvmHook({});

            expect(hook.contractId).to.be.null;
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });
    });

    describe("setContractId", function () {
        it("should set contractId and return this for chaining", function () {
            const hook = new EvmHook();
            const contractId = new ContractId(10, 20, 30);

            const result = hook.setContractId(contractId);

            expect(result).to.equal(hook);
            expect(hook.contractId).to.equal(contractId);
        });

        it("should overwrite existing contractId", function () {
            const oldContractId = new ContractId(1, 1, 1);
            const newContractId = new ContractId(2, 2, 2);
            const hook = new EvmHook({ contractId: oldContractId });

            hook.setContractId(newContractId);

            expect(hook.contractId).to.equal(newContractId);
            expect(hook.contractId).to.not.equal(oldContractId);
        });

        it("should handle different ContractId instances", function () {
            const hook = new EvmHook();

            const contractId1 = new ContractId(1, 2, 3);
            hook.setContractId(contractId1);
            expect(hook.contractId.toString()).to.equal("1.2.3");

            const contractId2 = new ContractId(4, 5, 6);
            hook.setContractId(contractId2);
            expect(hook.contractId.toString()).to.equal("4.5.6");
        });
    });

    describe("setStorageUpdates", function () {
        it("should set storageUpdates and return this for chaining", function () {
            const hook = new EvmHook();
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];

            const result = hook.setStorageUpdates(updates);

            expect(result).to.equal(hook);
            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should overwrite existing storageUpdates", function () {
            const oldUpdates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];
            const newUpdates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([3]),
                    value: new Uint8Array([4]),
                }),
                new EvmHookStorageSlot({
                    key: new Uint8Array([5]),
                    value: new Uint8Array([6]),
                }),
            ];
            const hook = new EvmHook({ storageUpdates: oldUpdates });

            hook.setStorageUpdates(newUpdates);

            expect(hook.storageUpdates).to.equal(newUpdates);
            expect(hook.storageUpdates).to.have.lengthOf(2);
        });

        it("should handle empty array", function () {
            const hook = new EvmHook({
                storageUpdates: [
                    new EvmHookStorageSlot({
                        key: new Uint8Array([1]),
                        value: new Uint8Array([2]),
                    }),
                ],
            });

            hook.setStorageUpdates([]);

            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should handle multiple storage updates", function () {
            const hook = new EvmHook();
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
                new EvmHookStorageSlot({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                }),
                new EvmHookStorageSlot({
                    key: new Uint8Array([9, 10]),
                    value: new Uint8Array([11, 12]),
                }),
            ];

            hook.setStorageUpdates(updates);

            expect(hook.storageUpdates).to.have.lengthOf(3);
        });
    });

    describe("getters", function () {
        it("should get contractId using getter", function () {
            const contractId = new ContractId(15, 25, 35);
            const hook = new EvmHook({ contractId });

            expect(hook.contractId).to.equal(contractId);
        });

        it("should get storageUpdates using getter", function () {
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([100]),
                    value: new Uint8Array([200]),
                }),
            ];
            const hook = new EvmHook({ storageUpdates: updates });

            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should return null for unset contractId", function () {
            const hook = new EvmHook();

            expect(hook.contractId).to.be.null;
        });

        it("should return empty array for default storageUpdates", function () {
            const hook = new EvmHook();

            expect(hook.storageUpdates).to.be.an("array");
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });
    });

    describe("method chaining", function () {
        it("should support full method chaining", function () {
            const contractId = new ContractId(11, 12, 13);
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];

            const hook = new EvmHook()
                .setContractId(contractId)
                .setStorageUpdates(updates);

            expect(hook.contractId).to.equal(contractId);
            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should support chaining in any order", function () {
            const contractId = new ContractId(1, 2, 3);
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([5]),
                    value: new Uint8Array([6]),
                }),
            ];

            const hook = new EvmHook()
                .setStorageUpdates(updates)
                .setContractId(contractId);

            expect(hook.contractId).to.equal(contractId);
            expect(hook.storageUpdates).to.equal(updates);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const contractId = new ContractId(50, 60, 70);
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([10, 20]),
                    value: new Uint8Array([30, 40]),
                }),
            ];
            const hook = new EvmHook({
                contractId,
                storageUpdates: updates,
            });

            const proto = hook._toProtobuf();

            expect(proto.spec).to.not.be.undefined;
            expect(proto.spec.contractId).to.deep.equal(
                contractId._toProtobuf(),
            );
            expect(proto.storageUpdates).to.be.an("array");
            expect(proto.storageUpdates).to.have.lengthOf(1);
        });

        it("should convert to protobuf with null contractId", function () {
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];
            const hook = new EvmHook({ storageUpdates: updates });

            const proto = hook._toProtobuf();

            expect(proto.spec.contractId).to.be.undefined;
            expect(proto.storageUpdates).to.have.lengthOf(1);
        });

        it("should convert to protobuf with empty storageUpdates", function () {
            const contractId = new ContractId(1, 2, 3);
            const hook = new EvmHook({ contractId });

            const proto = hook._toProtobuf();

            expect(proto.spec.contractId).to.not.be.undefined;
            expect(proto.storageUpdates).to.be.an("array");
            expect(proto.storageUpdates).to.have.lengthOf(0);
        });

        it("should convert to protobuf with all null/empty fields", function () {
            const hook = new EvmHook();

            const proto = hook._toProtobuf();

            expect(proto.spec.contractId).to.be.undefined;
            expect(proto.storageUpdates).to.be.an("array");
            expect(proto.storageUpdates).to.have.lengthOf(0);
        });

        it("should map storageUpdates correctly", function () {
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
                new EvmHookStorageSlot({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                }),
            ];
            const hook = new EvmHook({ storageUpdates: updates });

            const proto = hook._toProtobuf();

            expect(proto.storageUpdates).to.have.lengthOf(2);
            expect(proto.storageUpdates[0]).to.deep.equal(
                updates[0]._toProtobuf(),
            );
            expect(proto.storageUpdates[1]).to.deep.equal(
                updates[1]._toProtobuf(),
            );
        });
    });

    describe("edge cases", function () {
        it("should handle null contractId", function () {
            const hook = new EvmHook();

            expect(hook.contractId).to.be.null;
        });

        it("should not mutate original objects", function () {
            const contractId = new ContractId(5, 5, 5);
            const originalContractId = contractId.toString();
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];
            const originalLength = updates.length;

            const hook = new EvmHook({
                contractId,
                storageUpdates: updates,
            });
            hook.setContractId(new ContractId(9, 9, 9));
            hook.setStorageUpdates([]);

            expect(contractId.toString()).to.equal(originalContractId);
            expect(updates).to.have.lengthOf(originalLength);
        });

        it("should handle storageUpdates with empty Uint8Arrays", function () {
            const updates = [
                new EvmHookStorageSlot({
                    key: new Uint8Array([]),
                    value: new Uint8Array([]),
                }),
            ];
            const hook = new EvmHook({ storageUpdates: updates });

            expect(hook.storageUpdates).to.have.lengthOf(1);
            expect(hook.storageUpdates[0].key).to.have.lengthOf(0);
            expect(hook.storageUpdates[0].value).to.have.lengthOf(0);
        });
    });
});
