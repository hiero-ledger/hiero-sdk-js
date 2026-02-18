import { AccountId, ContractCreateTransaction } from "../../src/index.js";
import Long from "long";

import PrivateKey from "../../src/PrivateKey.js";
import TransactionId from "../../src/transaction/TransactionId.js";
import FileId from "../../src/file/FileId.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import {
    EvmHookStorageSlot,
    EvmHookMappingEntries,
} from "../../src/hooks/EvmHookStorageUpdate.js";
import EvmHookMappingEntry from "../../src/hooks/EvmHookMappingEntry.js";
import ContractId from "../../src/contract/ContractId.js";

describe("ContractCreateTransaction", function () {
    let stakedAccountId;
    let stakedNodeId;

    beforeEach(function () {
        stakedAccountId = new AccountId(0, 0, 3333);
        stakedNodeId = Long.fromNumber(5);
    });

    it("should throw an error if gas is negative", function () {
        const tx = new ContractCreateTransaction();

        let err = false;
        try {
            tx.setGas(-1);
        } catch (error) {
            if (error.message.includes("Gas cannot be negative number"))
                err = true;
        }

        expect(err).to.be.true;
    });

    it("should get the last called if both stakedAccountId and stakedNodeId are present", function () {
        const tx = new ContractCreateTransaction({
            stakedAccountId: stakedAccountId,
            stakedNodeId: stakedNodeId,
        });

        expect(tx.stakedAccountId).to.be.null;
        expect(tx.stakedNodeId.toString()).to.equal(stakedNodeId.toString());

        tx.setStakedAccountId(stakedAccountId);

        expect(tx.stakedAccountId.toString()).to.equal(
            stakedAccountId.toString(),
        );
        expect(tx.stakedNodeId).to.be.null;
    });

    describe("Hooks", function () {
        describe("addHook", function () {
            it("should add a hook to the hooks array", function () {
                const tx = new ContractCreateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                });

                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.hooks[0]).to.equal(hook);
            });

            it("should add multiple hooks to the hooks array", function () {
                const tx = new ContractCreateTransaction();
                const hook1 = new HookCreationDetails({
                    extensionPoint: 1,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: 2,
                });

                tx.addHook(hook1);
                tx.addHook(hook2);

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks[0]).to.equal(hook1);
                expect(tx.hooks[1]).to.equal(hook2);
            });

            it("should return the transaction for chaining", function () {
                const tx = new ContractCreateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                });

                const result = tx.addHook(hook);

                expect(result).to.equal(tx);
            });
        });

        describe("setHooks", function () {
            it("should set the hooks array", function () {
                const tx = new ContractCreateTransaction();
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                tx.setHooks(hooks);

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks).to.equal(hooks);
            });

            it("should replace existing hooks", function () {
                const tx = new ContractCreateTransaction();
                const initialHooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                ];
                const newHooks = [
                    new HookCreationDetails({ extensionPoint: 2 }),
                    new HookCreationDetails({ extensionPoint: 3 }),
                ];

                tx.setHooks(initialHooks);
                tx.setHooks(newHooks);

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks).to.equal(newHooks);
            });

            it("should accept empty array", function () {
                const tx = new ContractCreateTransaction();
                tx.addHook(new HookCreationDetails({ extensionPoint: 1 }));

                tx.setHooks([]);

                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should return the transaction for chaining", function () {
                const tx = new ContractCreateTransaction();
                const hooks = [new HookCreationDetails({ extensionPoint: 1 })];

                const result = tx.setHooks(hooks);

                expect(result).to.equal(tx);
            });
        });

        describe("hooks getter", function () {
            it("should return empty array by default", function () {
                const tx = new ContractCreateTransaction();

                expect(tx.hooks).to.be.an("array");
                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should return the hooks array", function () {
                const tx = new ContractCreateTransaction();
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                tx.setHooks(hooks);

                expect(tx.hooks).to.equal(hooks);
            });
        });

        describe("constructor with hooks", function () {
            it("should set hooks via constructor", function () {
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                const tx = new ContractCreateTransaction({
                    hooks: hooks,
                });

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks[0]).to.equal(hooks[0]);
                expect(tx.hooks[1]).to.equal(hooks[1]);
            });

            it("should work with empty hooks array in constructor", function () {
                const tx = new ContractCreateTransaction({
                    hooks: [],
                });

                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should combine constructor hooks with other properties", function () {
                const hooks = [new HookCreationDetails({ extensionPoint: 1 })];
                const bytecodeFileId = new FileId(0, 0, 100);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const gas = Long.fromNumber(100000);

                const tx = new ContractCreateTransaction({
                    hooks,
                    bytecodeFileId,
                    adminKey,
                    gas,
                });

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.bytecodeFileId.toString()).to.equal(
                    bytecodeFileId.toString(),
                );
                expect(tx.adminKey).to.equal(adminKey);
                expect(tx.gas.toString()).to.equal(gas.toString());
            });
        });

        describe("complex hook configurations", function () {
            it("should create a hook with EvmHook", function () {
                const contractId = new ContractId(0, 0, 100);
                const evmHook = new EvmHook({ contractId });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    evmHook: evmHook,
                });

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.hooks[0].extensionPoint).to.equal(1);
                expect(tx.hooks[0].evmHook).to.equal(evmHook);
                expect(tx.hooks[0].evmHook.contractId.num.toNumber()).to.equal(
                    100,
                );
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

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].evmHook.storageUpdates).to.have.lengthOf(1);
                expect(tx.hooks[0].evmHook.storageUpdates[0].key).to.deep.equal(
                    key,
                );
                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].value,
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

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].evmHook.storageUpdates).to.have.lengthOf(1);
                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].mappingSlot,
                ).to.deep.equal(mappingSlot);
                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].entries,
                ).to.have.lengthOf(1);
                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].entries[0].key,
                ).to.deep.equal(entryKey);
                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].entries[0].value,
                ).to.deep.equal(entryValue);
            });

            it("should create a hook with adminKey", function () {
                const adminKey = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    adminKey,
                });

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });

            it("should create a hook with hookId", function () {
                const hookId = Long.fromNumber(999);
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                });

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].hookId).to.equal(hookId);
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

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].extensionPoint).to.equal(1);
                expect(tx.hooks[0].hookId).to.equal(hookId);
                expect(tx.hooks[0].evmHook).to.equal(evmHook);
                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });
        });

        describe("serialization with hooks", function () {
            it("should serialize with hooks", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new ContractCreateTransaction({
                    bytecodeFileId,
                    hooks: [hook],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(1);
            });

            it("should serialize with empty hooks array", function () {
                const bytecodeFileId = new FileId(0, 0, 100);

                const tx = new ContractCreateTransaction({
                    bytecodeFileId,
                    hooks: [],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(0);
            });

            it("should serialize complex hook with all properties", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const hookId = Long.fromNumber(999);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const contractId = new ContractId(0, 0, 200);
                const storageKey = new Uint8Array([1, 2, 3, 4]);
                const storageValue = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({
                    key: storageKey,
                    value: storageValue,
                });
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

                const tx = new ContractCreateTransaction({
                    bytecodeFileId,
                    hooks: [hook],
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

            it("should serialize multiple hooks", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const hook1 = new HookCreationDetails({ extensionPoint: 1 });
                const hook2 = new HookCreationDetails({ extensionPoint: 2 });
                const hook3 = new HookCreationDetails({ extensionPoint: 3 });

                const tx = new ContractCreateTransaction({
                    bytecodeFileId,
                    hooks: [hook1, hook2, hook3],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(3);
            });
        });

        describe("edge cases", function () {
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

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].evmHook.storageUpdates).to.have.lengthOf(2);
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

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].entries,
                ).to.have.lengthOf(2);
            });

            it("should work with frozen transaction without hooks", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const gas = Long.fromNumber(100000);
                const accountId = new AccountId(3);

                const tx = new ContractCreateTransaction()
                    .setBytecodeFileId(bytecodeFileId)
                    .setGas(gas)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                expect(tx.hooks).to.have.lengthOf(0);
                expect(() => tx.toBytes()).to.not.throw();
            });

            it("should work with frozen transaction with hooks", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const gas = Long.fromNumber(100000);
                const accountId = new AccountId(3);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new ContractCreateTransaction()
                    .setBytecodeFileId(bytecodeFileId)
                    .setGas(gas)
                    .addHook(hook)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                expect(tx.hooks).to.have.lengthOf(1);
                expect(() => tx.toBytes()).to.not.throw();
            });

            it("should maintain hook order", function () {
                const hook1 = new HookCreationDetails({ extensionPoint: 1 });
                const hook2 = new HookCreationDetails({ extensionPoint: 2 });
                const hook3 = new HookCreationDetails({ extensionPoint: 3 });

                const tx = new ContractCreateTransaction()
                    .addHook(hook1)
                    .addHook(hook2)
                    .addHook(hook3);

                expect(tx.hooks[0]).to.equal(hook1);
                expect(tx.hooks[1]).to.equal(hook2);
                expect(tx.hooks[2]).to.equal(hook3);
            });

            it("should allow setting hooks after initial construction", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new ContractCreateTransaction({ bytecodeFileId });
                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.bytecodeFileId.toString()).to.equal(
                    bytecodeFileId.toString(),
                );
            });

            it("should work with bytecode instead of bytecodeFileId", function () {
                const bytecode = new Uint8Array([1, 2, 3, 4, 5]);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new ContractCreateTransaction({
                    bytecode,
                    hooks: [hook],
                });

                expect(tx.bytecode).to.equal(bytecode);
                expect(tx.hooks).to.have.lengthOf(1);
            });
        });

        describe("integration with other properties", function () {
            it("should work with all contract creation properties", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const gas = Long.fromNumber(100000);
                const hook = new HookCreationDetails({ extensionPoint: 1 });
                const contractMemo = "test contract";
                const autoRenewAccountId = new AccountId(0, 0, 200);

                const tx = new ContractCreateTransaction({
                    bytecodeFileId,
                    adminKey,
                    gas,
                    hooks: [hook],
                    contractMemo,
                    maxAutomaticTokenAssociations: 10,
                    declineStakingReward: true,
                    autoRenewAccountId,
                });

                expect(tx.bytecodeFileId.toString()).to.equal(
                    bytecodeFileId.toString(),
                );
                expect(tx.adminKey).to.equal(adminKey);
                expect(tx.gas.toString()).to.equal(gas.toString());
                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.contractMemo).to.equal(contractMemo);
                expect(tx.maxAutomaticTokenAssociations).to.equal(10);
                expect(tx.declineStakingRewards).to.equal(true);
                expect(tx.autoRenewAccountId.toString()).to.equal(
                    autoRenewAccountId.toString(),
                );
            });
        });
    });
});
