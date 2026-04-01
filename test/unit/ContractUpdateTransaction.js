import {
    ContractUpdateTransaction,
    ContractId,
    AccountId,
    FileId,
    Timestamp,
    PrivateKey,
} from "../../src/index.js";
import Duration from "../../src/Duration.js";
import Long from "long";

import TransactionId from "../../src/transaction/TransactionId.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import {
    EvmHookStorageSlot,
    EvmHookMappingEntries,
} from "../../src/hooks/EvmHookStorageUpdate.js";
import EvmHookMappingEntry from "../../src/hooks/EvmHookMappingEntry.js";

describe("ContractUpdateTransaction", function () {
    describe("constructor", function () {
        it("should set all properties correctly via constructor", function () {
            const contractId = new ContractId(1);
            const expirationTime = new Timestamp(500, 600);
            const adminKey = PrivateKey.generateED25519().publicKey;
            const proxyAccountId = new AccountId(2);
            const autoRenewPeriod = new Duration(7000);
            const bytecodeFileId = new FileId(3);
            const contractMemo = "test memo";
            const maxAutomaticTokenAssociations = 10;
            const stakedAccountId = new AccountId(4);
            const stakedNodeId = Long.fromNumber(5);
            const declineStakingReward = true;
            const autoRenewAccountId = new AccountId(6);

            const tx = new ContractUpdateTransaction({
                contractId,
                expirationTime,
                adminKey,
                proxyAccountId,
                autoRenewPeriod,
                bytecodeFileId,
                contractMemo,
                maxAutomaticTokenAssociations,
                stakedAccountId,
                stakedNodeId,
                declineStakingReward,
                autoRenewAccountId,
            });

            expect(tx.contractId.toString()).to.equal(contractId.toString());
            expect(tx.expirationTime).to.equal(expirationTime);
            expect(tx.adminKey).to.equal(adminKey);
            expect(tx.proxyAccountId.toString()).to.equal(
                proxyAccountId.toString(),
            );
            expect(tx.autoRenewPeriod.toString()).to.equal(
                autoRenewPeriod.toString(),
            );
            expect(tx.bytecodeFileId.toString()).to.equal(
                bytecodeFileId.toString(),
            );
            expect(tx.contractMemo).to.equal(contractMemo);
            expect(tx.maxAutomaticTokenAssociations).to.equal(
                maxAutomaticTokenAssociations,
            );
            expect(tx.stakedAccountId.toString()).to.equal(
                stakedAccountId.toString(),
            );
            expect(tx.stakedNodeId.toString()).to.equal(
                stakedNodeId.toString(),
            );
            expect(tx.declineStakingRewards).to.equal(declineStakingReward);
            expect(tx.autoRenewAccountId.toString()).to.equal(
                autoRenewAccountId.toString(),
            );
        });

        it("should accept string values for IDs in constructor", function () {
            const tx = new ContractUpdateTransaction({
                contractId: "0.0.1",
                proxyAccountId: "0.0.2",
                bytecodeFileId: "0.0.3",
                stakedAccountId: "0.0.4",
                autoRenewAccountId: "0.0.5",
            });

            expect(tx.contractId.toString()).to.equal("0.0.1");
            expect(tx.proxyAccountId.toString()).to.equal("0.0.2");
            expect(tx.bytecodeFileId.toString()).to.equal("0.0.3");
            expect(tx.stakedAccountId.toString()).to.equal("0.0.4");
            expect(tx.autoRenewAccountId.toString()).to.equal("0.0.5");
        });

        it("should accept Date for expirationTime in constructor", function () {
            const date = new Date();

            const tx = new ContractUpdateTransaction({
                expirationTime: date,
            });

            expect(tx.expirationTime.toDate().getTime()).to.equal(
                date.getTime(),
            );
        });

        it("should accept number or Long for autoRenewPeriod in constructor", function () {
            const numberPeriod = 8000;
            const tx1 = new ContractUpdateTransaction({
                autoRenewPeriod: numberPeriod,
            });

            expect(tx1.autoRenewPeriod.seconds.toNumber()).to.equal(
                numberPeriod,
            );

            const longPeriod = Long.fromNumber(9000);
            const tx2 = new ContractUpdateTransaction({
                autoRenewPeriod: longPeriod,
            });

            expect(tx2.autoRenewPeriod.seconds.toNumber()).to.equal(
                longPeriod.toNumber(),
            );
        });

        it("should accept number and Long for stakedNodeId in constructor", function () {
            const numberNodeId = 6;
            const tx1 = new ContractUpdateTransaction({
                stakedNodeId: numberNodeId,
            });

            expect(tx1.stakedNodeId.toNumber()).to.equal(numberNodeId);

            const longNodeId = Long.fromNumber(7);
            const tx2 = new ContractUpdateTransaction({
                stakedNodeId: longNodeId,
            });

            expect(tx2.stakedNodeId.toNumber()).to.equal(longNodeId.toNumber());
        });
    });

    describe("deserialization of optional parameters", function () {
        it("should deserialize with contractMemo being null", function () {
            const tx = new ContractUpdateTransaction();
            const tx2 = ContractUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.contractMemo).to.be.null;
            expect(tx2.contractMemo).to.be.null;
        });
    });

    describe("serialization and deserialization", function () {
        it("should maintain all properties after serialization and deserialization", function () {
            const originalTx = new ContractUpdateTransaction({
                contractId: "0.0.1",
                expirationTime: new Timestamp(500, 600),
                autoRenewPeriod: 7000,
                contractMemo: "test memo",
                maxAutomaticTokenAssociations: 10,
                stakedNodeId: 5,
                declineStakingReward: true,
                autoRenewAccountId: "0.0.6",
            });

            const recreatedTx = ContractUpdateTransaction.fromBytes(
                originalTx.toBytes(),
            );

            expect(recreatedTx.contractId.toString()).to.equal("0.0.1");
            expect(recreatedTx.expirationTime.seconds.toString()).to.equal(
                "500",
            );
            expect(recreatedTx.expirationTime.nanos.toString()).to.equal("600");
            expect(recreatedTx.autoRenewPeriod.seconds.toString()).to.equal(
                "7000",
            );
            expect(recreatedTx.contractMemo).to.equal("test memo");
            expect(recreatedTx.maxAutomaticTokenAssociations).to.equal(10);
            expect(recreatedTx.stakedNodeId.toString()).to.equal("5");
            expect(recreatedTx.declineStakingRewards).to.equal(true);
            expect(recreatedTx.autoRenewAccountId.toString()).to.equal("0.0.6");
        });
    });

    describe("Hooks", function () {
        describe("addHookToCreate", function () {
            it("should add a hook to the hooksToCreate array", function () {
                const tx = new ContractUpdateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                });

                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.hooksToCreate[0]).to.equal(hook);
            });

            it("should add multiple hooks to the hooksToCreate array", function () {
                const tx = new ContractUpdateTransaction();
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
                const tx = new ContractUpdateTransaction();
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                tx.setHooksToCreate(hooks);

                expect(tx.hooksToCreate).to.have.lengthOf(2);
                expect(tx.hooksToCreate).to.equal(hooks);
            });

            it("should replace existing hooks", function () {
                const tx = new ContractUpdateTransaction();
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
                const tx = new ContractUpdateTransaction();
                tx.addHookToCreate(
                    new HookCreationDetails({ extensionPoint: 1 }),
                );

                tx.setHooksToCreate([]);

                expect(tx.hooksToCreate).to.have.lengthOf(0);
            });
        });

        describe("hooksToCreate getter", function () {
            it("should return empty array by default", function () {
                const tx = new ContractUpdateTransaction();

                expect(tx.hooksToCreate).to.be.an("array");
                expect(tx.hooksToCreate).to.have.lengthOf(0);
            });

            it("should return the hooks array", function () {
                const tx = new ContractUpdateTransaction();
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
                const tx = new ContractUpdateTransaction();
                const hookId = Long.fromNumber(123);

                tx.addHookToDelete(hookId);

                expect(tx.hooksToDelete).to.have.lengthOf(1);
                expect(tx.hooksToDelete[0]).to.equal(hookId);
            });

            it("should add multiple hook IDs to the hooksToDelete array", function () {
                const tx = new ContractUpdateTransaction();
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
                const tx = new ContractUpdateTransaction();
                const hookIds = [Long.fromNumber(123), Long.fromNumber(456)];

                tx.setHooksToDelete(hookIds);

                expect(tx.hooksToDelete).to.have.lengthOf(2);
                expect(tx.hooksToDelete).to.equal(hookIds);
            });

            it("should replace existing hook IDs", function () {
                const tx = new ContractUpdateTransaction();
                const initialIds = [Long.fromNumber(123)];
                const newIds = [Long.fromNumber(456), Long.fromNumber(789)];

                tx.setHooksToDelete(initialIds);
                tx.setHooksToDelete(newIds);

                expect(tx.hooksToDelete).to.have.lengthOf(2);
                expect(tx.hooksToDelete).to.equal(newIds);
            });

            it("should accept empty array", function () {
                const tx = new ContractUpdateTransaction();
                tx.addHookToDelete(Long.fromNumber(123));

                tx.setHooksToDelete([]);

                expect(tx.hooksToDelete).to.have.lengthOf(0);
            });
        });

        describe("hooksToDelete getter", function () {
            it("should return empty array by default", function () {
                const tx = new ContractUpdateTransaction();

                expect(tx.hooksToDelete).to.be.an("array");
                expect(tx.hooksToDelete).to.have.lengthOf(0);
            });

            it("should return the hook IDs array", function () {
                const tx = new ContractUpdateTransaction();
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

                const tx = new ContractUpdateTransaction({
                    hooksToBeCreated: hooks,
                });

                expect(tx.hooksToCreate).to.equal(hooks);
            });

            it("should set hooksToBeDeleted via constructor", function () {
                const hookIds = [Long.fromNumber(123), Long.fromNumber(456)];

                const tx = new ContractUpdateTransaction({
                    hooksToBeDeleted: hookIds,
                });

                expect(tx.hooksToDelete).to.equal(hookIds);
            });

            it("should set both hooksToBeCreated and hooksToBeDeleted via constructor", function () {
                const hooks = [new HookCreationDetails({ extensionPoint: 1 })];
                const hookIds = [Long.fromNumber(123)];

                const tx = new ContractUpdateTransaction({
                    hooksToBeCreated: hooks,
                    hooksToBeDeleted: hookIds,
                });

                expect(tx.hooksToCreate).to.equal(hooks);
                expect(tx.hooksToDelete).to.equal(hookIds);
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

                const tx = new ContractUpdateTransaction();
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

                const tx = new ContractUpdateTransaction();
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

                const tx = new ContractUpdateTransaction();
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

                const tx = new ContractUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate[0].adminKey).to.equal(adminKey);
            });

            it("should create a hook with hookId", function () {
                const hookId = Long.fromNumber(999);
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                });

                const tx = new ContractUpdateTransaction();
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

                const tx = new ContractUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate[0].extensionPoint).to.equal(1);
                expect(tx.hooksToCreate[0].hookId).to.equal(hookId);
                expect(tx.hooksToCreate[0].evmHook).to.equal(evmHook);
                expect(tx.hooksToCreate[0].adminKey).to.equal(adminKey);
            });
        });

        describe("serialization with hooks", function () {
            it("should serialize and deserialize with hooksToCreate", function () {
                const contractId = new ContractId(0, 0, 123);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new ContractUpdateTransaction({
                    contractId,
                    hooksToBeCreated: [hook],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(1);
            });

            it("should serialize and deserialize with hooksToDelete", function () {
                const contractId = new ContractId(0, 0, 123);
                const hookId = Long.fromNumber(456);

                const tx = new ContractUpdateTransaction({
                    contractId,
                    hooksToBeDeleted: [hookId],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookIdsToDelete).to.be.an("array");
                expect(txData.hookIdsToDelete).to.have.lengthOf(1);
                expect(txData.hookIdsToDelete[0]).to.equal(hookId);
            });

            it("should serialize and deserialize with both hooks and hook deletions", function () {
                const contractId = new ContractId(0, 0, 123);
                const hook = new HookCreationDetails({ extensionPoint: 1 });
                const hookId = Long.fromNumber(456);

                const tx = new ContractUpdateTransaction({
                    contractId,
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
                const contractId = new ContractId(0, 0, 123);
                const hookId = Long.fromNumber(999);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const hookContractId = new ContractId(0, 0, 100);
                const key = new Uint8Array([1, 2, 3, 4]);
                const value = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({ key, value });
                const evmHook = new EvmHook({
                    contractId: hookContractId,
                    storageUpdates: [storageSlot],
                });
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                    evmHook: evmHook,
                    adminKey,
                });

                const tx = new ContractUpdateTransaction({
                    contractId,
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

            it("should serialize with empty hookIdsToDelete when empty", function () {
                const contractId = new ContractId(0, 0, 123);

                const tx = new ContractUpdateTransaction({
                    contractId,
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookIdsToDelete).to.have.lengthOf(0);
            });

            it("should serialize with empty hookCreationDetails when empty", function () {
                const contractId = new ContractId(0, 0, 123);

                const tx = new ContractUpdateTransaction({
                    contractId,
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.have.lengthOf(0);
            });
        });

        describe("edge cases", function () {
            it("should handle empty hooks arrays", function () {
                const tx = new ContractUpdateTransaction({
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

                const tx = new ContractUpdateTransaction();
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

                const tx = new ContractUpdateTransaction();
                tx.addHookToCreate(hook);

                expect(
                    tx.hooksToCreate[0].evmHook.storageUpdates[0].entries,
                ).to.have.lengthOf(2);
            });

            it("should work with frozen transaction without hooks", function () {
                const contractId = new ContractId(0, 0, 123);
                const accountId = new AccountId(3);

                const tx = new ContractUpdateTransaction()
                    .setContractId(contractId)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                expect(tx.hooksToCreate).to.have.lengthOf(0);
                expect(tx.hooksToDelete).to.have.lengthOf(0);
                expect(() => tx.toBytes()).to.not.throw();
            });

            it("should work with frozen transaction with hooks", function () {
                const contractId = new ContractId(0, 0, 123);
                const accountId = new AccountId(3);
                const hook = new HookCreationDetails({ extensionPoint: 1 });
                const hookId = Long.fromNumber(456);

                const tx = new ContractUpdateTransaction()
                    .setContractId(contractId)
                    .addHookToCreate(hook)
                    .addHookToDelete(hookId)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.hooksToDelete).to.have.lengthOf(1);
                expect(() => tx.toBytes()).to.not.throw();
            });

            it("should maintain hook order", function () {
                const hook1 = new HookCreationDetails({ extensionPoint: 1 });
                const hook2 = new HookCreationDetails({ extensionPoint: 2 });
                const hook3 = new HookCreationDetails({ extensionPoint: 3 });

                const tx = new ContractUpdateTransaction()
                    .addHookToCreate(hook1)
                    .addHookToCreate(hook2)
                    .addHookToCreate(hook3);

                expect(tx.hooksToCreate[0]).to.equal(hook1);
                expect(tx.hooksToCreate[1]).to.equal(hook2);
                expect(tx.hooksToCreate[2]).to.equal(hook3);
            });

            it("should maintain hookId order", function () {
                const hookId1 = Long.fromNumber(123);
                const hookId2 = Long.fromNumber(456);
                const hookId3 = Long.fromNumber(789);

                const tx = new ContractUpdateTransaction()
                    .addHookToDelete(hookId1)
                    .addHookToDelete(hookId2)
                    .addHookToDelete(hookId3);

                expect(tx.hooksToDelete[0]).to.equal(hookId1);
                expect(tx.hooksToDelete[1]).to.equal(hookId2);
                expect(tx.hooksToDelete[2]).to.equal(hookId3);
            });

            it("should allow setting hooks after initial construction", function () {
                const contractId = new ContractId(0, 0, 123);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new ContractUpdateTransaction({ contractId });
                tx.addHookToCreate(hook);

                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.contractId.toString()).to.equal(
                    contractId.toString(),
                );
            });
        });

        describe("integration with other properties", function () {
            it("should work with all contract update properties", function () {
                const contractId = new ContractId(0, 0, 123);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({ extensionPoint: 1 });
                const hookId = Long.fromNumber(456);
                const contractMemo = "updated contract";
                const autoRenewAccountId = new AccountId(0, 0, 200);

                const tx = new ContractUpdateTransaction({
                    contractId,
                    adminKey,
                    hooksToBeCreated: [hook],
                    hooksToBeDeleted: [hookId],
                    contractMemo,
                    maxAutomaticTokenAssociations: 15,
                    declineStakingReward: true,
                    autoRenewAccountId,
                });

                expect(tx.contractId.toString()).to.equal(
                    contractId.toString(),
                );
                expect(tx.adminKey).to.equal(adminKey);
                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.hooksToDelete).to.have.lengthOf(1);
                expect(tx.contractMemo).to.equal(contractMemo);
                expect(tx.maxAutomaticTokenAssociations).to.equal(15);
                expect(tx.declineStakingRewards).to.equal(true);
                expect(tx.autoRenewAccountId.toString()).to.equal(
                    autoRenewAccountId.toString(),
                );
            });

            it("should handle updating hooks (delete and create)", function () {
                const contractId = new ContractId(0, 0, 123);
                const oldHookId = Long.fromNumber(100);
                const newHook = new HookCreationDetails({ extensionPoint: 2 });

                const tx = new ContractUpdateTransaction({
                    contractId,
                    hooksToBeDeleted: [oldHookId],
                    hooksToBeCreated: [newHook],
                });

                expect(tx.hooksToDelete).to.have.lengthOf(1);
                expect(tx.hooksToDelete[0]).to.equal(oldHookId);
                expect(tx.hooksToCreate).to.have.lengthOf(1);
                expect(tx.hooksToCreate[0]).to.equal(newHook);
            });
        });
    });
});
