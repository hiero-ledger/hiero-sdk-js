import {
    AccountUpdateTransaction,
    AccountId,
    Client,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Duration from "../../src/Duration.js";
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

    describe("clearAccountMemo", function () {
        it("should send an empty memo wrapper when the memo is cleared", function () {
            const tx = new AccountUpdateTransaction()
                .setAccountMemo("old memo")
                .clearAccountMemo();

            expect(tx.accountMemo).to.equal("");
            expect(tx._makeTransactionData().memo).to.deep.equal({
                value: "",
            });
        });

        it("should keep an explicitly empty memo through a bytes round trip", function () {
            const tx = new AccountUpdateTransaction().clearAccountMemo();
            const tx2 = AccountUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx2.accountMemo).to.equal("");
            expect(tx2._makeTransactionData().memo).to.deep.equal({
                value: "",
            });
        });

        it("should not send a memo wrapper when the memo was never set", function () {
            const tx = new AccountUpdateTransaction();

            expect(tx._makeTransactionData().memo).to.be.null;
        });
    });

    describe("constructor and setters", function () {
        const VALID_START = new Timestamp(1596210382, 0);

        let key, accountId, nodeId;

        beforeEach(function () {
            key = PrivateKey.generateED25519().publicKey;
            accountId = new AccountId(0, 0, 123);
            nodeId = new AccountId(0, 0, 3);
        });

        /**
         * @param {AccountUpdateTransaction} transaction
         * @returns {AccountUpdateTransaction}
         */
        function freezeWithIds(transaction) {
            return transaction
                .setNodeAccountIds([nodeId])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();
        }

        it("should set the fields given in props", function () {
            const transaction = new AccountUpdateTransaction({
                accountId,
                key,
                receiverSignatureRequired: true,
                autoRenewPeriod: 90,
                expirationTime: new Timestamp(1596210382, 0),
                accountMemo: "memo",
                maxAutomaticTokenAssociations: 10,
                stakedAccountId: new AccountId(0, 0, 456),
                stakedNodeId: 1,
                declineStakingReward: true,
            });

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(transaction.key.toString()).to.equal(key.toString());
            expect(transaction.receiverSignatureRequired).to.be.true;
            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
            expect(transaction.expirationTime.toString()).to.equal(
                new Timestamp(1596210382, 0).toString(),
            );
            expect(transaction.accountMemo).to.equal("memo");
            expect(
                transaction.maxAutomaticTokenAssociations.toNumber(),
            ).to.equal(10);
            expect(transaction.stakedAccountId.toString()).to.equal("0.0.456");
            expect(transaction.stakedNodeId.toNumber()).to.equal(1);
            expect(transaction.declineStakingRewards).to.be.true;
        });

        it("should set every field with the setters", function () {
            const transaction = new AccountUpdateTransaction()
                .setAccountId(accountId)
                .setKey(key)
                .setReceiverSignatureRequired(true)
                .setAutoRenewPeriod(90)
                .setExpirationTime(new Timestamp(1596210382, 0))
                .setAccountMemo("memo")
                .setMaxAutomaticTokenAssociations(10)
                .setStakedAccountId("0.0.456")
                .setStakedNodeId(1)
                .setDeclineStakingReward(true);

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(transaction.key.toString()).to.equal(key.toString());
            expect(transaction.receiverSignatureRequired).to.be.true;
            expect(transaction.accountMemo).to.equal("memo");
            expect(transaction.stakedAccountId.toString()).to.equal("0.0.456");
            expect(transaction.stakedNodeId.toNumber()).to.equal(1);
            expect(transaction.declineStakingRewards).to.be.true;
        });

        it("should default every field to null", function () {
            const transaction = new AccountUpdateTransaction();

            expect(transaction.accountId).to.be.null;
            expect(transaction.key).to.be.null;
            expect(transaction.receiverSignatureRequired).to.be.null;
            expect(transaction.autoRenewPeriod).to.be.null;
            expect(transaction.expirationTime).to.be.null;
            expect(transaction.accountMemo).to.be.null;
            expect(transaction.maxAutomaticTokenAssociations).to.be.null;
            expect(transaction.stakedAccountId).to.be.null;
            expect(transaction.stakedNodeId).to.be.null;
            expect(transaction.declineStakingRewards).to.be.null;
        });

        it("should set accountId from a string", function () {
            const transaction = new AccountUpdateTransaction().setAccountId(
                "0.0.123",
            );

            expect(transaction.accountId.toString()).to.equal("0.0.123");
        });

        it("should store a copy of the account ID instance", function () {
            const transaction = new AccountUpdateTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId).to.not.equal(accountId);
        });

        it("should set stakedAccountId from a string", function () {
            const transaction =
                new AccountUpdateTransaction().setStakedAccountId("0.0.456");

            expect(transaction.stakedAccountId.toString()).to.equal("0.0.456");
        });

        it("should set stakedNodeId from a Long", function () {
            const transaction = new AccountUpdateTransaction().setStakedNodeId(
                Long.fromNumber(2),
            );

            expect(transaction.stakedNodeId.toNumber()).to.equal(2);
        });

        it("should accept an autoRenewPeriod given as a Duration", function () {
            const transaction =
                new AccountUpdateTransaction().setAutoRenewPeriod(
                    new Duration(90),
                );

            expect(transaction.autoRenewPeriod).to.be.instanceOf(Duration);
            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
        });

        it("should accept an autoRenewPeriod given as a Long", function () {
            const transaction =
                new AccountUpdateTransaction().setAutoRenewPeriod(
                    Long.fromNumber(90),
                );

            expect(transaction.autoRenewPeriod).to.be.instanceOf(Duration);
            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
        });

        it("should accept an expirationTime given as a Date", function () {
            const date = new Date(1596210382000);
            const transaction =
                new AccountUpdateTransaction().setExpirationTime(date);

            expect(transaction.expirationTime).to.be.instanceOf(Timestamp);
            expect(transaction.expirationTime.toString()).to.equal(
                Timestamp.fromDate(date).toString(),
            );
        });

        it("should clear a staked account ID to 0.0.0", function () {
            const transaction = new AccountUpdateTransaction()
                .setStakedAccountId(new AccountId(0, 0, 456))
                .clearStakedAccountId();

            expect(transaction.stakedAccountId.toString()).to.equal("0.0.0");
        });

        it("should clear a staked node ID to -1", function () {
            const transaction = new AccountUpdateTransaction()
                .setStakedNodeId(1)
                .clearStakedNodeId();

            expect(transaction.stakedNodeId.toNumber()).to.equal(-1);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new AccountUpdateTransaction());

            expect(() => transaction.setAccountId(accountId)).to.throw(
                "transaction is immutable",
            );
            expect(() => transaction.setKey(key)).to.throw(
                "transaction is immutable",
            );
            expect(() =>
                transaction.setReceiverSignatureRequired(true),
            ).to.throw("transaction is immutable");
            expect(() => transaction.setAutoRenewPeriod(90)).to.throw(
                "transaction is immutable",
            );
            expect(() =>
                transaction.setExpirationTime(new Timestamp(1596210382, 0)),
            ).to.throw("transaction is immutable");
            expect(() => transaction.setAccountMemo("memo")).to.throw(
                "transaction is immutable",
            );
            expect(() =>
                transaction.setMaxAutomaticTokenAssociations(10),
            ).to.throw("transaction is immutable");
            expect(() =>
                transaction.setStakedAccountId(new AccountId(0, 0, 456)),
            ).to.throw("transaction is immutable");
            expect(() => transaction.clearStakedAccountId()).to.throw(
                "transaction is immutable",
            );
            expect(() => transaction.setStakedNodeId(1)).to.throw(
                "transaction is immutable",
            );
            expect(() => transaction.clearStakedNodeId()).to.throw(
                "transaction is immutable",
            );
            expect(() => transaction.setDeclineStakingReward(true)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        const VALID_START = new Timestamp(1596210382, 0);

        let key, nodeId;

        beforeEach(function () {
            key = PrivateKey.generateED25519().publicKey;
            nodeId = new AccountId(0, 0, 3);
        });

        it("should keep every field through a round trip", function () {
            const transaction = new AccountUpdateTransaction()
                .setAccountId(new AccountId(0, 0, 123))
                .setKey(key)
                .setReceiverSignatureRequired(true)
                .setAutoRenewPeriod(new Duration(90))
                .setExpirationTime(new Timestamp(1596210382, 0))
                .setAccountMemo("memo")
                .setMaxAutomaticTokenAssociations(10)
                .setStakedAccountId(new AccountId(0, 0, 456))
                .setDeclineStakingReward(true)
                .setNodeAccountIds([nodeId])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(AccountUpdateTransaction);
            expect(decoded.accountId.toString()).to.equal("0.0.123");
            expect(decoded.key.toString()).to.equal(key.toString());
            expect(decoded.receiverSignatureRequired).to.be.true;
            expect(decoded.autoRenewPeriod.seconds.toNumber()).to.equal(90);
            expect(decoded.expirationTime.toString()).to.equal(
                new Timestamp(1596210382, 0).toString(),
            );
            expect(decoded.accountMemo).to.equal("memo");
            expect(decoded.maxAutomaticTokenAssociations.toNumber()).to.equal(
                10,
            );
            expect(decoded.stakedAccountId.toString()).to.equal("0.0.456");
            expect(decoded.declineStakingRewards).to.be.true;
        });

        it("should keep a staked node ID through a round trip", function () {
            const transaction = new AccountUpdateTransaction()
                .setAccountId(new AccountId(0, 0, 123))
                .setStakedNodeId(1)
                .setNodeAccountIds([nodeId])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded.stakedNodeId.toNumber()).to.equal(1);
        });

        // TODO(#4654): Transaction.fromBytes() drops hooksToCreate and
        // hooksToDelete, so the round trip cannot be tested until that is fixed.
        it.skip("should keep hooksToCreate through a round trip", function () {
            const transaction = new AccountUpdateTransaction()
                .addHookToCreate(new HookCreationDetails({ extensionPoint: 1 }))
                .setNodeAccountIds([nodeId])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded.hooksToCreate).to.have.lengthOf(1);
        });

        // TODO(#4654): Transaction.fromBytes() drops hooksToCreate and
        // hooksToDelete, so the round trip cannot be tested until that is fixed.
        it.skip("should keep hooksToDelete through a round trip", function () {
            const transaction = new AccountUpdateTransaction()
                .addHookToDelete(Long.fromNumber(123))
                .setNodeAccountIds([nodeId])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded.hooksToDelete).to.have.lengthOf(1);
        });
    });

    describe("_validateChecksums", function () {
        let mainnet, testnet;

        beforeEach(function () {
            mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
            testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        });

        afterEach(function () {
            mainnet.close();
            testnet.close();
        });

        /**
         * @returns {AccountId}
         */
        function checksummedAccountId() {
            // 0.0.123-vfmkw has the mainnet checksum
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";
            return accountId;
        }

        it("should check the account ID checksum against the client's network", function () {
            const transaction = new AccountUpdateTransaction().setAccountId(
                checksummedAccountId(),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the deprecated proxy account ID checksum", function () {
            const transaction = new AccountUpdateTransaction();
            transaction._proxyAccountId = checksummedAccountId();

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip unset fields", function () {
            expect(() =>
                new AccountUpdateTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.updateAccount() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    updateAccount: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new AccountUpdateTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const VALID_START = new Timestamp(1596210382, 0);
            const transaction = new AccountUpdateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `AccountUpdateTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
