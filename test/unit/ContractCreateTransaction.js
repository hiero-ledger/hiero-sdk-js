import {
    AccountId,
    ContractCreateTransaction,
    Hbar,
    HookExtensionPoint,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import Long from "long";
import * as HieroProto from "@hiero-ledger/proto";

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

    describe("fromBytes bytecode round trip", function () {
        const buildWithBytecode = () =>
            new ContractCreateTransaction()
                .setBytecode(new Uint8Array([1, 2, 3, 4]))
                .setGas(100000)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)));

        it("keeps setBytecode() after a frozen toBytes/fromBytes round trip", function () {
            const frozen = buildWithBytecode().freeze();
            const restored = Transaction.fromBytes(frozen.toBytes());

            expect(restored).to.be.instanceOf(ContractCreateTransaction);
            expect(restored.bytecode).to.deep.equal(
                new Uint8Array([1, 2, 3, 4]),
            );
            expect(restored.bytecodeFileId).to.be.null;
        });

        it("keeps setBytecodeFileId() after a frozen toBytes/fromBytes round trip", function () {
            const fileId = new FileId(0, 0, 100);
            const frozen = new ContractCreateTransaction()
                .setBytecodeFileId(fileId)
                .setGas(100000)
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(2)))
                .freeze();
            const restored = Transaction.fromBytes(frozen.toBytes());

            expect(restored).to.be.instanceOf(ContractCreateTransaction);
            expect(restored.bytecodeFileId.toString()).to.equal(
                fileId.toString(),
            );
            expect(restored.bytecode).to.be.null;
        });

        it("keeps initcode when unfrozen bytes are decoded and frozen again", function () {
            const refrozen = Transaction.fromBytes(
                buildWithBytecode().toBytes(),
            ).freeze();

            expect(refrozen).to.be.instanceOf(ContractCreateTransaction);
            expect(refrozen.bytecode).to.deep.equal(
                new Uint8Array([1, 2, 3, 4]),
            );
            expect(refrozen.bytecodeFileId).to.be.null;

            const body = HieroProto.proto.TransactionBody.decode(
                refrozen.signableNodeBodyBytesList[0]
                    .signableTransactionBodyBytes,
            );
            expect(
                Uint8Array.from(body.contractCreateInstance.initcode),
            ).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
            expect(body.contractCreateInstance.fileID).to.be.null;
        });
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.hooks[0]).to.equal(hook);
            });

            it("should add multiple hooks to the hooks array", function () {
                const tx = new ContractCreateTransaction();
                const hook1 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

                const result = tx.addHook(hook);

                expect(result).to.equal(tx);
            });
        });

        describe("setHooks", function () {
            it("should set the hooks array", function () {
                const tx = new ContractCreateTransaction();
                const hooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];

                tx.setHooks(hooks);

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks).to.equal(hooks);
            });

            it("should replace existing hooks", function () {
                const tx = new ContractCreateTransaction();
                const initialHooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];
                const newHooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];

                tx.setHooks(initialHooks);
                tx.setHooks(newHooks);

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks).to.equal(newHooks);
            });

            it("should accept empty array", function () {
                const tx = new ContractCreateTransaction();
                tx.addHook(
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                );

                tx.setHooks([]);

                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should return the transaction for chaining", function () {
                const tx = new ContractCreateTransaction();
                const hooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];

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
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];

                tx.setHooks(hooks);

                expect(tx.hooks).to.equal(hooks);
            });
        });

        describe("constructor with hooks", function () {
            it("should set hooks via constructor", function () {
                const hooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
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
                const hooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    evmHook: evmHook,
                });

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.hooks[0].extensionPoint).to.equal(
                    HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                );
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    adminKey,
                });

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });

            it("should create a hook with hookId", function () {
                const hookId = Long.fromNumber(999);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId,
                    evmHook: evmHook,
                    adminKey,
                });

                const tx = new ContractCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].extensionPoint).to.equal(
                    HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                );
                expect(tx.hooks[0].hookId).to.equal(hookId);
                expect(tx.hooks[0].evmHook).to.equal(evmHook);
                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });
        });

        describe("serialization with hooks", function () {
            it("should serialize with hooks", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                );
                expect(txData.hookCreationDetails[0].hookId).to.equal(hookId);
                expect(txData.hookCreationDetails[0].evmHook).to.not.be.null;
                expect(txData.hookCreationDetails[0].adminKey).to.not.be.null;
            });

            it("should serialize multiple hooks", function () {
                const bytecodeFileId = new FileId(0, 0, 100);
                const hook1 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook3 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                const hook1 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook3 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

                const tx = new ContractCreateTransaction({ bytecodeFileId });
                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.bytecodeFileId.toString()).to.equal(
                    bytecodeFileId.toString(),
                );
            });

            it("should work with bytecode instead of bytecodeFileId", function () {
                const bytecode = new Uint8Array([1, 2, 3, 4, 5]);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
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

    describe("toBytes() and fromBytes()", function () {
        let transactionId, adminKey;

        beforeEach(function () {
            transactionId = TransactionId.withValidStart(
                AccountId.fromString("0.0.1001"),
                new Timestamp(1596210382, 0),
            );
            adminKey = PrivateKey.generateED25519().publicKey;
        });

        /**
         * Sets every field except the bytecode, the hooks and the staked ID,
         * which each test sets.
         *
         * @param {ContractCreateTransaction} tx
         * @returns {ContractCreateTransaction}
         */
        function setFields(tx) {
            return tx
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setTransactionId(transactionId)
                .setAdminKey(adminKey)
                .setGas(100000)
                .setInitialBalance(new Hbar(5))
                .setProxyAccountId(AccountId.fromString("0.0.5006"))
                .setAutoRenewPeriod(8000000)
                .setConstructorParameters(Uint8Array.of(4, 5, 6))
                .setContractMemo("memo")
                .setMaxAutomaticTokenAssociations(10)
                .setDeclineStakingReward(true)
                .setAutoRenewAccountId(AccountId.fromString("0.0.5007"));
        }

        /**
         * @param {ContractCreateTransaction} tx
         */
        function expectFields(tx) {
            expect(tx).to.be.instanceOf(ContractCreateTransaction);
            expect(tx.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(tx.adminKey.toString()).to.equal(adminKey.toString());
            expect(tx.gas.toString()).to.equal("100000");
            expect(tx.initialBalance.toTinybars().toString()).to.equal(
                new Hbar(5).toTinybars().toString(),
            );
            expect(tx.proxyAccountId.toString()).to.equal("0.0.5006");
            expect(tx.autoRenewPeriod.seconds.toString()).to.equal("8000000");
            expect(tx.constructorParameters).to.deep.equal(
                Uint8Array.of(4, 5, 6),
            );
            expect(tx.contractMemo).to.equal("memo");
            expect(tx.maxAutomaticTokenAssociations.toString()).to.equal("10");
            expect(tx.declineStakingRewards).to.equal(true);
            expect(tx.autoRenewAccountId.toString()).to.equal("0.0.5007");
        }

        it("should keep every field with a staked account ID", function () {
            const tx = setFields(new ContractCreateTransaction())
                .setBytecodeFileId(FileId.fromString("0.0.5005"))
                .setStakedAccountId(AccountId.fromString("0.0.5008"))
                .freeze();

            const tx2 = Transaction.fromBytes(tx.toBytes());

            expectFields(tx2);
            expect(tx2.bytecodeFileId.toString()).to.equal("0.0.5005");
            expect(tx2.stakedAccountId.toString()).to.equal("0.0.5008");
            expect(tx2.stakedNodeId).to.be.null;
        });

        it("should keep every field with a staked node ID", function () {
            const tx = setFields(new ContractCreateTransaction())
                .setBytecodeFileId(FileId.fromString("0.0.5005"))
                .setStakedNodeId(4)
                .freeze();

            const tx2 = Transaction.fromBytes(tx.toBytes());

            expectFields(tx2);
            expect(tx2.stakedNodeId.toString()).to.equal("4");
            expect(tx2.stakedAccountId).to.be.null;
        });

        it("should keep the hooks", function () {
            const hook = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 7,
                evmHook: new EvmHook({
                    contractId: ContractId.fromString("0.0.5010"),
                }),
                adminKey,
            });
            const tx = setFields(new ContractCreateTransaction())
                .setBytecode(Uint8Array.of(1, 2, 3))
                .setHooks([hook])
                .freeze();

            const tx2 = Transaction.fromBytes(tx.toBytes());

            expectFields(tx2);
            expect(tx2.hooks).to.have.lengthOf(1);
            expect(tx2.hooks[0].extensionPoint).to.equal(
                HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
            );
            expect(tx2.hooks[0].hookId.toString()).to.equal("7");
            expect(tx2.hooks[0].evmHook.contractId.toString()).to.equal(
                "0.0.5010",
            );
            expect(tx2.hooks[0].adminKey.toString()).to.equal(
                adminKey.toString(),
            );
        });

        it("should keep multiple hooks", function () {
            const hook1 = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 1,
            });
            const hook2 = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 2,
            });
            const tx = setFields(new ContractCreateTransaction())
                .setBytecode(Uint8Array.of(1, 2, 3))
                .setHooks([hook1, hook2])
                .freeze();

            const tx2 = Transaction.fromBytes(tx.toBytes());

            expect(tx2.hooks).to.have.lengthOf(2);
            expect(tx2.hooks[0].hookId.toString()).to.equal("1");
            expect(tx2.hooks[1].hookId.toString()).to.equal("2");
        });

        it("should keep a hook with storage updates", function () {
            const storageUpdate = new EvmHookStorageSlot({
                key: Uint8Array.of(1, 2, 3, 4),
                value: Uint8Array.of(5, 6, 7, 8),
            });
            const hook = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 7,
                evmHook: new EvmHook({
                    contractId: ContractId.fromString("0.0.5010"),
                    storageUpdates: [storageUpdate],
                }),
            });
            const tx = setFields(new ContractCreateTransaction())
                .setBytecode(Uint8Array.of(1, 2, 3))
                .setHooks([hook])
                .freeze();

            const tx2 = Transaction.fromBytes(tx.toBytes());

            expect(tx2.hooks[0].evmHook.storageUpdates).to.have.lengthOf(1);
            expect(tx2.hooks[0].evmHook.storageUpdates[0].key).to.deep.equal(
                Uint8Array.of(1, 2, 3, 4),
            );
            expect(tx2.hooks[0].evmHook.storageUpdates[0].value).to.deep.equal(
                Uint8Array.of(5, 6, 7, 8),
            );
        });

        it("should keep the hooks when an unfrozen transaction is decoded", function () {
            const hook = new HookCreationDetails({
                extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                hookId: 7,
            });
            const tx = setFields(new ContractCreateTransaction())
                .setBytecode(Uint8Array.of(1, 2, 3))
                .setHooks([hook]);

            const tx2 = Transaction.fromBytes(tx.toBytes()).freeze();
            const body = tx2._makeTransactionData();

            expect(tx2.hooks).to.have.lengthOf(1);
            expect(tx2.hooks[0].hookId.toString()).to.equal("7");
            expect(body.hookCreationDetails).to.have.lengthOf(1);
        });
    });
});
