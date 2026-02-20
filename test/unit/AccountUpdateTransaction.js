import {
    AccountUpdateTransaction,
    AccountId,
    PrivateKey,
} from "../../src/index.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import {
    EvmHookStorageSlot,
    EvmHookMappingEntries,
} from "../../src/hooks/EvmHookStorageUpdate.js";
import EvmHookMappingEntry from "../../src/hooks/EvmHookMappingEntry.js";
import ContractId from "../../src/contract/ContractId.js";
import Long from "long";

describe("AccountUpdateTransaction", function () {
    describe("deserialization of optional parameters", function () {
        let tx, txBytes, tx2;

        beforeAll(function () {
            tx = new AccountUpdateTransaction();
            txBytes = tx.toBytes();
            tx2 = AccountUpdateTransaction.fromBytes(txBytes);
        });

        it("should deserialize with accountMemo being null", function () {
            expect(tx.accountMemo).to.be.null;
            expect(tx2.accountMemo).to.be.null;
        });

        it("should deserialize with declineReward, receiverSignatureRequired being null", function () {
            expect(tx.declineStakingRewards).to.be.null;
            expect(tx2.declineStakingRewards).to.be.null;

            expect(tx.receiverSignatureRequired).to.be.null;
            expect(tx2.receiverSignatureRequired).to.be.null;
        });

        it("should deserialize with maxAutomaticTokenAssociations being null", function () {
            expect(tx.maxAutomaticTokenAssociations).to.be.null;
            expect(tx2.maxAutomaticTokenAssociations).to.be.null;
        });
    });

    describe("Hooks", function () {
        describe("addHookToCreate", function () {
            it("should add a hook to the hooksToCreate array", function () {
                const tx = new AccountUpdateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                });

                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.hooksToCreate[0]).to.equal(hook);
            });

            it("should add multiple hooks to the hooksToCreate array", function () {
                const tx = new AccountUpdateTransaction();
                const hook1 = new HookCreationDetails({
                    extensionPoint: 1,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: 2,
                });

                tx.addHookToCreate(hook1);
                tx.addHookToCreate(hook2);

                expect(tx.hooksToCreate).to.have.lengthOf(2);
                expect(tx.hooksToCreate[0]).to.equal(hook1);
                expect(tx.hooksToCreate[1]).to.equal(hook2);
            });
        });

        describe("setHooksToCreate", function () {
            it("should set the hooksToCreate array", function () {
                const tx = new AccountUpdateTransaction();
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                tx.setHooksToCreate(hooks);

                expect(tx.hooksToCreate).to.have.lengthOf(2);
                expect(tx.hooksToCreate).to.equal(hooks);
            });

            it("should replace existing hooks", function () {
                const tx = new AccountUpdateTransaction();
                const initialHooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                ];
                const newHooks = [
                    new HookCreationDetails({ extensionPoint: 2 }),
                    new HookCreationDetails({ extensionPoint: 3 }),
                ];

                tx.setHooksToCreate(initialHooks);
                tx.setHooksToCreate(newHooks);

                expect(tx.hooksToCreate).to.have.lengthOf(2);
                expect(tx.hooksToCreate).to.equal(newHooks);
            });

            it("should accept empty array", function () {
                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(
                    new HookCreationDetails({ extensionPoint: 1 }),
                );

                tx.setHooksToCreate([]);

                expect(tx.hooksToCreate).to.have.lengthOf(0);
            });
        });

        describe("hooksToCreate getter", function () {
            it("should return empty array by default", function () {
                const tx = new AccountUpdateTransaction();

                expect(tx.hooksToCreate).to.be.an("array");
                expect(tx.hooksToCreate).to.have.lengthOf(0);
            });

            it("should return the hooks array", function () {
                const tx = new AccountUpdateTransaction();
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                tx.setHooksToCreate(hooks);

                expect(tx.hooksToCreate).to.equal(hooks);
            });
        });

        describe("addHookToDelete", function () {
            it("should add a hook ID to the hooksToDelete array", function () {
                const tx = new AccountUpdateTransaction();
                const hookId = Long.fromNumber(123);

                tx.addHookToDelete(hookId);

                expect(tx.hooksToDelete).to.have.lengthOf(1);
                expect(tx.hooksToDelete[0]).to.equal(hookId);
            });

            it("should add multiple hook IDs to the hooksToDelete array", function () {
                const tx = new AccountUpdateTransaction();
                const hookId1 = Long.fromNumber(123);
                const hookId2 = Long.fromNumber(456);

                tx.addHookToDelete(hookId1);
                tx.addHookToDelete(hookId2);

                expect(tx.hooksToDelete).to.have.lengthOf(2);
                expect(tx.hooksToDelete[0]).to.equal(hookId1);
                expect(tx.hooksToDelete[1]).to.equal(hookId2);
            });
        });

        describe("setHooksToDelete", function () {
            it("should set the hooksToDelete array", function () {
                const tx = new AccountUpdateTransaction();
                const hookIds = [Long.fromNumber(123), Long.fromNumber(456)];

                tx.setHooksToDelete(hookIds);

                expect(tx.hooksToDelete).to.have.lengthOf(2);
                expect(tx.hooksToDelete).to.equal(hookIds);
            });

            it("should replace existing hook IDs", function () {
                const tx = new AccountUpdateTransaction();
                const initialIds = [Long.fromNumber(123)];
                const newIds = [Long.fromNumber(456), Long.fromNumber(789)];

                tx.setHooksToDelete(initialIds);
                tx.setHooksToDelete(newIds);

                expect(tx.hooksToDelete).to.have.lengthOf(2);
                expect(tx.hooksToDelete).to.equal(newIds);
            });

            it("should accept empty array", function () {
                const tx = new AccountUpdateTransaction();
                tx.addHookToDelete(Long.fromNumber(123));

                tx.setHooksToDelete([]);

                expect(tx.hooksToDelete).to.have.lengthOf(0);
            });
        });

        describe("hooksToDelete getter", function () {
            it("should return empty array by default", function () {
                const tx = new AccountUpdateTransaction();

                expect(tx.hooksToDelete).to.be.an("array");
                expect(tx.hooksToDelete).to.have.lengthOf(0);
            });

            it("should return the hook IDs array", function () {
                const tx = new AccountUpdateTransaction();
                const hookIds = [Long.fromNumber(123), Long.fromNumber(456)];

                tx.setHooksToDelete(hookIds);

                expect(tx.hooksToDelete).to.equal(hookIds);
            });
        });

        describe("constructor with hooks", function () {
            it("should set hooksToBeCreated via constructor", function () {
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                const tx = new AccountUpdateTransaction({
                    hooksToBeCreated: hooks,
                });

                expect(tx.hooksToCreate).to.equal(hooks);
            });

            it("should set hooksToBeDeleted via constructor", function () {
                const hookIds = [Long.fromNumber(123), Long.fromNumber(456)];

                const tx = new AccountUpdateTransaction({
                    hooksToBeDeleted: hookIds,
                });

                expect(tx.hooksToDelete).to.equal(hookIds);
            });

            it("should set both hooksToBeCreated and hooksToBeDeleted via constructor", function () {
                const hooks = [new HookCreationDetails({ extensionPoint: 1 })];
                const hookIds = [Long.fromNumber(123)];

                const tx = new AccountUpdateTransaction({
                    hooksToBeCreated: hooks,
                    hooksToBeDeleted: hookIds,
                });

                expect(tx.hooksToCreate).to.equal(hooks);
                expect(tx.hooksToDelete).to.equal(hookIds);
            });
        });

        describe("complex hook configurations", function () {
            it("should create a hook with EvmHook and contractId", function () {
                const contractId = new ContractId(0, 0, 100);
                const evmHook = new EvmHook({ contractId });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    evmHook: evmHook,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.hooksToCreate[0].extensionPoint).to.equal(1);
                expect(tx.hooksToCreate[0].evmHook).to.equal(evmHook);
                expect(
                    tx.hooksToCreate[0].evmHook.contractId.num.toNumber(),
                ).to.equal(100);
            });

            it("should create a hook with EvmHookStorageSlot", function () {
                const key = new Uint8Array([1, 2, 3, 4]);
                const value = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({ key, value });

                const contractId = new ContractId(0, 0, 100);
                const evmHook = new EvmHook({
                    contractId,
                    storageUpdates: [storageSlot],
                });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    evmHook: evmHook,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates,
                ).to.have.lengthOf(1);
                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].key,
                ).to.deep.equal(key);
                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].value,
                ).to.deep.equal(value);
            });

            it("should create a hook with EvmHookMappingEntries", function () {
                const mappingSlot = new Uint8Array([1, 2, 3, 4]);
                const entryKey = new Uint8Array([5, 6, 7, 8]);
                const entryValue = new Uint8Array([9, 10, 11, 12]);
                const entry = new EvmHookMappingEntry({
                    key: entryKey,
                    value: entryValue,
                });
                const mappingEntries = new EvmHookMappingEntries({
                    mappingSlot,
                    entries: [entry],
                });

                const contractId = new ContractId(0, 0, 100);
                const evmHook = new EvmHook({
                    contractId,
                    storageUpdates: [mappingEntries],
                });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    evmHook: evmHook,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates,
                ).to.have.lengthOf(1);
                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].mappingSlot,
                ).to.deep.equal(mappingSlot);
                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].entries,
                ).to.have.lengthOf(1);
                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].entries[0]
                        .key,
                ).to.deep.equal(entryKey);
                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].entries[0]
                        .value,
                ).to.deep.equal(entryValue);
            });

            it("should create a hook with adminKey", function () {
                const adminKey = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    adminKey,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate[0].adminKey).to.equal(adminKey);
            });

            it("should create a hook with hookId", function () {
                const hookId = Long.fromNumber(999);
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate[0].hookId).to.equal(hookId);
            });

            it("should create a complex hook with all properties", function () {
                const hookId = Long.fromNumber(999);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const contractId = new ContractId(0, 0, 100);
                const key = new Uint8Array([1, 2, 3, 4]);
                const value = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({ key, value });
                const evmHook = new EvmHook({
                    contractId,
                    storageUpdates: [storageSlot],
                });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                    evmHook: evmHook,
                    adminKey,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate[0].extensionPoint).to.equal(1);
                expect(tx.hooksToCreate[0].hookId).to.equal(hookId);
                expect(tx.hooksToCreate[0].evmHook).to.equal(evmHook);
                expect(tx.hooksToCreate[0].adminKey).to.equal(adminKey);
            });
        });

        describe("serialization with hooks", function () {
            it("should serialize and deserialize with hooksToCreate", function () {
                const accountId = new AccountId(0, 0, 123);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new AccountUpdateTransaction({
                    accountId,
                    hooksToBeCreated: [hook],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(1);
            });

            it("should serialize and deserialize with hooksToDelete", function () {
                const accountId = new AccountId(0, 0, 123);
                const hookId = Long.fromNumber(456);

                const tx = new AccountUpdateTransaction({
                    accountId,
                    hooksToBeDeleted: [hookId],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookIdsToDelete).to.be.an("array");
                expect(txData.hookIdsToDelete).to.have.lengthOf(1);
                expect(txData.hookIdsToDelete[0]).to.equal(hookId);
            });

            it("should serialize and deserialize with both hooks and hook deletions", function () {
                const accountId = new AccountId(0, 0, 123);
                const hook = new HookCreationDetails({ extensionPoint: 1 });
                const hookId = Long.fromNumber(456);

                const tx = new AccountUpdateTransaction({
                    accountId,
                    hooksToBeCreated: [hook],
                    hooksToBeDeleted: [hookId],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(1);
                expect(txData.hookIdsToDelete).to.be.an("array");
                expect(txData.hookIdsToDelete).to.have.lengthOf(1);
            });

            it("should serialize complex hook with all properties", function () {
                const accountId = new AccountId(0, 0, 123);
                const hookId = Long.fromNumber(999);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const contractId = new ContractId(0, 0, 100);
                const key = new Uint8Array([1, 2, 3, 4]);
                const value = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({ key, value });
                const evmHook = new EvmHook({
                    contractId,
                    storageUpdates: [storageSlot],
                });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                    evmHook: evmHook,
                    adminKey,
                });

                const tx = new AccountUpdateTransaction({
                    accountId,
                    hooksToBeCreated: [hook],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(1);
                expect(txData.hookCreationDetails[0].extensionPoint).to.equal(
                    1,
                );
                expect(txData.hookCreationDetails[0].hookId).to.equal(hookId);
                expect(txData.hookCreationDetails[0].evmHook).to.not.be.null;
                expect(txData.hookCreationDetails[0].adminKey).to.not.be.null;
            });
        });

        describe("edge cases", function () {
            it("should handle empty hooks arrays", function () {
                const tx = new AccountUpdateTransaction({
                    hooksToBeCreated: [],
                    hooksToBeDeleted: [],
                });

                expect(tx.hooksToCreate).to.have.lengthOf(0);
                expect(tx.hooksToDelete).to.have.lengthOf(0);
            });

            it("should handle multiple storage updates in a hook", function () {
                const contractId = new ContractId(0, 0, 100);

                const storageSlot1 = new EvmHookStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                });
                const storageSlot2 = new EvmHookStorageSlot({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                });

                const evmHook = new EvmHook({
                    contractId,
                    storageUpdates: [storageSlot1, storageSlot2],
                });

                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    evmHook: evmHook,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates,
                ).to.have.lengthOf(2);
            });

            it("should handle multiple mapping entries in a hook", function () {
                const mappingSlot = new Uint8Array([1, 2, 3, 4]);
                const entry1 = new EvmHookMappingEntry({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                });
                const entry2 = new EvmHookMappingEntry({
                    key: new Uint8Array([9, 10]),
                    value: new Uint8Array([11, 12]),
                });
                const mappingEntries = new EvmHookMappingEntries({
                    mappingSlot,
                    entries: [entry1, entry2],
                });

                const contractId = new ContractId(0, 0, 100);
                const evmHook = new EvmHook({
                    contractId,
                    storageUpdates: [mappingEntries],
                });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    evmHook: evmHook,
                });

                const tx = new AccountUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].entries,
                ).to.have.lengthOf(2);
            });
        });
    });
});
