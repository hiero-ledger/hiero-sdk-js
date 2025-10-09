import LambdaEvmHook from "../../src/hooks/LambdaEvmHook.js";
import EvmHookSpec from "../../src/hooks/EvmHookSpec.js";
import { LambdaStorageSlot } from "../../src/hooks/LambdaStorageUpdate.js";
import { ContractId } from "../../src/index.js";

describe("LambdaEvmHook", function () {
    describe("constructor", function () {
        it("should create an instance with default values", function () {
            const hook = new LambdaEvmHook();

            expect(hook.spec).to.be.null;
            expect(hook.storageUpdates).to.be.an("array");
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should create an instance with provided spec", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(1, 2, 3),
            });
            const hook = new LambdaEvmHook({ spec });

            expect(hook.spec).to.equal(spec);
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should create an instance with provided storageUpdates", function () {
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([1, 2, 3]),
                    value: new Uint8Array([4, 5, 6]),
                }),
            ];
            const hook = new LambdaEvmHook({ storageUpdates: updates });

            expect(hook.spec).to.be.null;
            expect(hook.storageUpdates).to.equal(updates);
            expect(hook.storageUpdates).to.have.lengthOf(1);
        });

        it("should create an instance with both spec and storageUpdates", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(5, 6, 7),
            });
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([10, 20]),
                    value: new Uint8Array([30, 40]),
                }),
            ];
            const hook = new LambdaEvmHook({ spec, storageUpdates: updates });

            expect(hook.spec).to.equal(spec);
            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should create an instance with empty storageUpdates array", function () {
            const hook = new LambdaEvmHook({ storageUpdates: [] });

            expect(hook.spec).to.be.null;
            expect(hook.storageUpdates).to.be.an("array");
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should create an instance with empty props object", function () {
            const hook = new LambdaEvmHook({});

            expect(hook.spec).to.be.null;
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });
    });

    describe("setSpec", function () {
        it("should set spec and return this for chaining", function () {
            const hook = new LambdaEvmHook();
            const spec = new EvmHookSpec({
                contractId: new ContractId(10, 20, 30),
            });

            const result = hook.setSpec(spec);

            expect(result).to.equal(hook);
            expect(hook.spec).to.equal(spec);
        });

        it("should overwrite existing spec", function () {
            const oldSpec = new EvmHookSpec({
                contractId: new ContractId(1, 1, 1),
            });
            const newSpec = new EvmHookSpec({
                contractId: new ContractId(2, 2, 2),
            });
            const hook = new LambdaEvmHook({ spec: oldSpec });

            hook.setSpec(newSpec);

            expect(hook.spec).to.equal(newSpec);
            expect(hook.spec).to.not.equal(oldSpec);
        });

        it("should handle different EvmHookSpec instances", function () {
            const hook = new LambdaEvmHook();

            const spec1 = new EvmHookSpec({
                contractId: new ContractId(1, 2, 3),
            });
            hook.setSpec(spec1);
            expect(hook.spec.contractId.toString()).to.equal("1.2.3");

            const spec2 = new EvmHookSpec({
                contractId: new ContractId(4, 5, 6),
            });
            hook.setSpec(spec2);
            expect(hook.spec.contractId.toString()).to.equal("4.5.6");
        });
    });

    describe("setStorageUpdates", function () {
        it("should set storageUpdates and return this for chaining", function () {
            const hook = new LambdaEvmHook();
            const updates = [
                new LambdaStorageSlot({
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
                new LambdaStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];
            const newUpdates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([3]),
                    value: new Uint8Array([4]),
                }),
                new LambdaStorageSlot({
                    key: new Uint8Array([5]),
                    value: new Uint8Array([6]),
                }),
            ];
            const hook = new LambdaEvmHook({ storageUpdates: oldUpdates });

            hook.setStorageUpdates(newUpdates);

            expect(hook.storageUpdates).to.equal(newUpdates);
            expect(hook.storageUpdates).to.have.lengthOf(2);
        });

        it("should handle empty array", function () {
            const hook = new LambdaEvmHook({
                storageUpdates: [
                    new LambdaStorageSlot({
                        key: new Uint8Array([1]),
                        value: new Uint8Array([2]),
                    }),
                ],
            });

            hook.setStorageUpdates([]);

            expect(hook.storageUpdates).to.have.lengthOf(0);
        });

        it("should handle multiple storage updates", function () {
            const hook = new LambdaEvmHook();
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
                new LambdaStorageSlot({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                }),
                new LambdaStorageSlot({
                    key: new Uint8Array([9, 10]),
                    value: new Uint8Array([11, 12]),
                }),
            ];

            hook.setStorageUpdates(updates);

            expect(hook.storageUpdates).to.have.lengthOf(3);
        });
    });

    describe("getters", function () {
        it("should get spec using getter", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(15, 25, 35),
            });
            const hook = new LambdaEvmHook({ spec });

            expect(hook.spec).to.equal(spec);
        });

        it("should get storageUpdates using getter", function () {
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([100]),
                    value: new Uint8Array([200]),
                }),
            ];
            const hook = new LambdaEvmHook({ storageUpdates: updates });

            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should return null for unset spec", function () {
            const hook = new LambdaEvmHook();

            expect(hook.spec).to.be.null;
        });

        it("should return empty array for default storageUpdates", function () {
            const hook = new LambdaEvmHook();

            expect(hook.storageUpdates).to.be.an("array");
            expect(hook.storageUpdates).to.have.lengthOf(0);
        });
    });

    describe("method chaining", function () {
        it("should support full method chaining", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(11, 12, 13),
            });
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];

            const hook = new LambdaEvmHook()
                .setSpec(spec)
                .setStorageUpdates(updates);

            expect(hook.spec).to.equal(spec);
            expect(hook.storageUpdates).to.equal(updates);
        });

        it("should support chaining in any order", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(1, 2, 3),
            });
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([5]),
                    value: new Uint8Array([6]),
                }),
            ];

            const hook = new LambdaEvmHook()
                .setStorageUpdates(updates)
                .setSpec(spec);

            expect(hook.spec).to.equal(spec);
            expect(hook.storageUpdates).to.equal(updates);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(50, 60, 70),
            });
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([10, 20]),
                    value: new Uint8Array([30, 40]),
                }),
            ];
            const hook = new LambdaEvmHook({ spec, storageUpdates: updates });

            const proto = hook._toProtobuf();

            expect(proto.spec).to.not.be.undefined;
            expect(proto.spec).to.deep.equal(spec._toProtobuf());
            expect(proto.storageUpdates).to.be.an("array");
            expect(proto.storageUpdates).to.have.lengthOf(1);
        });

        it("should convert to protobuf with null spec", function () {
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];
            const hook = new LambdaEvmHook({ storageUpdates: updates });

            const proto = hook._toProtobuf();

            expect(proto.spec).to.be.undefined;
            expect(proto.storageUpdates).to.have.lengthOf(1);
        });

        it("should convert to protobuf with empty storageUpdates", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(1, 2, 3),
            });
            const hook = new LambdaEvmHook({ spec });

            const proto = hook._toProtobuf();

            expect(proto.spec).to.not.be.undefined;
            expect(proto.storageUpdates).to.be.an("array");
            expect(proto.storageUpdates).to.have.lengthOf(0);
        });

        it("should convert to protobuf with all null/empty fields", function () {
            const hook = new LambdaEvmHook();

            const proto = hook._toProtobuf();

            expect(proto.spec).to.be.undefined;
            expect(proto.storageUpdates).to.be.an("array");
            expect(proto.storageUpdates).to.have.lengthOf(0);
        });

        it("should map storageUpdates correctly", function () {
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
                new LambdaStorageSlot({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                }),
            ];
            const hook = new LambdaEvmHook({ storageUpdates: updates });

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
        it("should handle spec with null contractId", function () {
            const spec = new EvmHookSpec();
            const hook = new LambdaEvmHook({ spec });

            expect(hook.spec).to.equal(spec);
            expect(hook.spec.contractId).to.be.null;
        });

        it("should not mutate original objects", function () {
            const spec = new EvmHookSpec({
                contractId: new ContractId(5, 5, 5),
            });
            const originalContractId = spec.contractId.toString();
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([1]),
                    value: new Uint8Array([2]),
                }),
            ];
            const originalLength = updates.length;

            const hook = new LambdaEvmHook({ spec, storageUpdates: updates });
            hook.setSpec(
                new EvmHookSpec({ contractId: new ContractId(9, 9, 9) }),
            );
            hook.setStorageUpdates([]);

            expect(spec.contractId.toString()).to.equal(originalContractId);
            expect(updates).to.have.lengthOf(originalLength);
        });

        it("should handle storageUpdates with empty Uint8Arrays", function () {
            const updates = [
                new LambdaStorageSlot({
                    key: new Uint8Array([]),
                    value: new Uint8Array([]),
                }),
            ];
            const hook = new LambdaEvmHook({ storageUpdates: updates });

            expect(hook.storageUpdates).to.have.lengthOf(1);
            expect(hook.storageUpdates[0].key).to.have.lengthOf(0);
            expect(hook.storageUpdates[0].value).to.have.lengthOf(0);
        });
    });
});
