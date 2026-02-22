import Long from "long";

import {
    PrivateKey,
    AccountCreateTransaction,
    AccountId,
    Timestamp,
    Transaction,
    TransactionId,
    EvmAddress,
} from "../../src/index.js";
import HookCreationDetails from "../../src/hooks/HookCreationDetails.js";
import EvmHook from "../../src/hooks/EvmHook.js";
import {
    EvmHookStorageSlot,
    EvmHookMappingEntries,
} from "../../src/hooks/EvmHookStorageUpdate.js";
import EvmHookMappingEntry from "../../src/hooks/EvmHookMappingEntry.js";
import ContractId from "../../src/contract/ContractId.js";

describe("AccountCreateTransaction", function () {
    describe("setECDSAKeyWithAlias", function () {
        /** @type {PrivateKey} */
        let privateEcdsaAccountKey;
        /** @type {PublicKey} */
        let publicEcdsaAccountKey;

        beforeEach(function () {
            privateEcdsaAccountKey = PrivateKey.generateECDSA();
            publicEcdsaAccountKey = privateEcdsaAccountKey.publicKey;
        });

        it("should throw when transaction is frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(3)));

            transaction.freeze();

            expect(() => {
                transaction.setECDSAKeyWithAlias(privateEcdsaAccountKey);
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA private key is provided", function () {
            const privateEd25519AccountKey = PrivateKey.generateED25519();

            expect(() => {
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    privateEd25519AccountKey,
                );
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA public key is provided", function () {
            const publicEd25519AccountKey =
                PrivateKey.generateED25519().publicKey;

            expect(() => {
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    publicEd25519AccountKey,
                );
            }).to.throw(Error);
        });

        it("should set correct account key and derived alias when using private ECDSA key", function () {
            const transaction =
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    privateEcdsaAccountKey,
                );

            expect(transaction.key.toString()).to.equal(
                privateEcdsaAccountKey.toString(),
            );

            expect(transaction.alias.toString()).to.equal(
                privateEcdsaAccountKey.publicKey.toEvmAddress(),
            );
        });

        it("should set correct account key and derived alias when using public ECDSA key", function () {
            const transaction =
                new AccountCreateTransaction().setECDSAKeyWithAlias(
                    publicEcdsaAccountKey,
                );

            expect(transaction.key.toString()).to.equal(
                publicEcdsaAccountKey.toString(),
            );

            expect(transaction.alias.toString()).to.equal(
                publicEcdsaAccountKey.toEvmAddress(),
            );
        });
    });

    describe("setKeyWithAlias", function () {
        /** @type {Key} */
        let accountKey;

        /** @type {PrivateKey} */
        let privateEcdsaAliasKey;

        /** @type {PublicKey} */
        let publicEcdsaAliasKey;

        beforeEach(function () {
            accountKey = PrivateKey.generateECDSA().publicKey;
            privateEcdsaAliasKey = PrivateKey.generateECDSA();
            publicEcdsaAliasKey = privateEcdsaAliasKey.publicKey;
        });

        it("should throw when transaction is frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(3)));

            transaction.freeze();

            expect(() => {
                transaction.setKeyWithAlias(accountKey, privateEcdsaAliasKey);
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA private alias key is provided", function () {
            const nonEcdsaAliasKey = PrivateKey.generateED25519();

            expect(() => {
                new AccountCreateTransaction().setKeyWithAlias(
                    accountKey,
                    nonEcdsaAliasKey,
                );
            }).to.throw(Error);
        });

        it("should throw when a non-ECDSA public alias key is provided", function () {
            const nonEcdsaPublicAliasKey =
                PrivateKey.generateED25519().publicKey;

            expect(() => {
                new AccountCreateTransaction().setKeyWithAlias(
                    accountKey,
                    nonEcdsaPublicAliasKey,
                );
            }).to.throw(Error);
        });

        it("should set correct account key and alias derived from private ECDSA alias key", function () {
            const transaction = new AccountCreateTransaction().setKeyWithAlias(
                accountKey,
                privateEcdsaAliasKey,
            );

            expect(transaction.key.toString()).to.equal(accountKey.toString());

            expect(transaction.alias.toString()).to.equal(
                privateEcdsaAliasKey.publicKey.toEvmAddress(),
            );
        });

        it("should set correct account key and alias derived from public ECDSA alias key", function () {
            const transaction = new AccountCreateTransaction().setKeyWithAlias(
                accountKey,
                publicEcdsaAliasKey,
            );

            expect(transaction.key.toString()).to.equal(accountKey.toString());

            expect(transaction.alias.toString()).to.equal(
                publicEcdsaAliasKey.toEvmAddress(),
            );
        });
    });

    describe("setKeyWithoutAlias", function () {
        it("should throw when transaction is frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(3)])
                .setTransactionId(TransactionId.generate(new AccountId(3)));

            transaction.freeze();

            const accountKey = PrivateKey.generateECDSA();
            expect(() => {
                transaction.setKeyWithoutAlias(accountKey);
            }).to.throw(Error);
        });

        it("should set correct account key without modifying the alias when key is provided", function () {
            const accountKey = PrivateKey.generateECDSA();
            const aliasKey = PrivateKey.generateECDSA();

            const transaction = new AccountCreateTransaction().setAlias(
                aliasKey.publicKey.toEvmAddress(),
            );

            transaction.setKeyWithoutAlias(accountKey);

            expect(transaction.key.toString()).to.equal(accountKey.toString());

            expect(transaction.alias.toString()).to.equal(
                aliasKey.publicKey.toEvmAddress(),
            );
        });
    });

    it("should round trip from bytes and maintain order", function () {
        const key1 = PrivateKey.generateECDSA();
        const spenderAccountId1 = new AccountId(7);
        const nodeAccountId = new AccountId(10, 11, 12);
        const timestamp1 = new Timestamp(14, 15);
        const evmAddress = key1.publicKey.toEvmAddress();

        let transaction = new AccountCreateTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setAlias(evmAddress)
            .setNodeAccountIds([nodeAccountId])
            .freeze();

        transaction = Transaction.fromBytes(transaction.toBytes());

        const data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            alias: EvmAddress.fromString(evmAddress).toBytes(),
            autoRenewPeriod: {
                seconds: Long.fromValue(7776000),
            },
            declineReward: false,
            hookCreationDetails: [],
            initialBalance: Long.ZERO,
            key: null,
            maxAutomaticTokenAssociations: 0,
            memo: "",
            proxyAccountID: null,
            receiveRecordThreshold: Long.fromString("9223372036854775807"),
            receiverSigRequired: false,
            sendRecordThreshold: Long.fromString("9223372036854775807"),
            stakedAccountId: null,
            stakedNodeId: null,
        });
    });

    describe("Hooks", function () {
        describe("addHook", function () {
            it("should add a hook to the hooks array", function () {
                const tx = new AccountCreateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                });

                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.hooks[0]).to.equal(hook);
            });

            it("should add multiple hooks to the hooks array", function () {
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                });

                const result = tx.addHook(hook);

                expect(result).to.equal(tx);
            });
        });

        describe("setHooks", function () {
            it("should set the hooks array", function () {
                const tx = new AccountCreateTransaction();
                const hooks = [
                    new HookCreationDetails({ extensionPoint: 1 }),
                    new HookCreationDetails({ extensionPoint: 2 }),
                ];

                tx.setHooks(hooks);

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks).to.equal(hooks);
            });

            it("should replace existing hooks", function () {
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();
                tx.addHook(new HookCreationDetails({ extensionPoint: 1 }));

                tx.setHooks([]);

                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should return the transaction for chaining", function () {
                const tx = new AccountCreateTransaction();
                const hooks = [new HookCreationDetails({ extensionPoint: 1 })];

                const result = tx.setHooks(hooks);

                expect(result).to.equal(tx);
            });
        });

        describe("hooks getter", function () {
            it("should return empty array by default", function () {
                const tx = new AccountCreateTransaction();

                expect(tx.hooks).to.be.an("array");
                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should return the hooks array", function () {
                const tx = new AccountCreateTransaction();
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

                const tx = new AccountCreateTransaction({
                    hooks: hooks,
                });

                expect(tx.hooks).to.have.lengthOf(2);
                expect(tx.hooks[0]).to.equal(hooks[0]);
                expect(tx.hooks[1]).to.equal(hooks[1]);
            });

            it("should work with empty hooks array in constructor", function () {
                const tx = new AccountCreateTransaction({
                    hooks: [],
                });

                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should combine constructor hooks with other properties", function () {
                const hooks = [new HookCreationDetails({ extensionPoint: 1 })];
                const key = PrivateKey.generateED25519().publicKey;
                const accountMemo = "test memo";

                const tx = new AccountCreateTransaction({
                    hooks,
                    key,
                    accountMemo,
                });

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.key).to.equal(key);
                expect(tx.accountMemo).to.equal(accountMemo);
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

                const tx = new AccountCreateTransaction();
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

                const tx = new AccountCreateTransaction();
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

                const tx = new AccountCreateTransaction();
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

                const tx = new AccountCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });

            it("should create a hook with hookId", function () {
                const hookId = Long.fromNumber(999);
                const hook = new HookCreationDetails({
                    extensionPoint: 1,
                    hookId,
                });

                const tx = new AccountCreateTransaction();
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

                const tx = new AccountCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].extensionPoint).to.equal(1);
                expect(tx.hooks[0].hookId).to.equal(hookId);
                expect(tx.hooks[0].evmHook).to.equal(evmHook);
                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });
        });

        describe("serialization with hooks", function () {
            it("should serialize with hooks", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new AccountCreateTransaction({
                    key,
                    hooks: [hook],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(1);
            });

            it("should serialize with empty hooks array", function () {
                const key = PrivateKey.generateED25519().publicKey;

                const tx = new AccountCreateTransaction({
                    key,
                    hooks: [],
                });

                const txData = tx._makeTransactionData();

                expect(txData.hookCreationDetails).to.be.an("array");
                expect(txData.hookCreationDetails).to.have.lengthOf(0);
            });

            it("should serialize complex hook with all properties", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const hookId = Long.fromNumber(999);
                const adminKey = PrivateKey.generateED25519().publicKey;
                const contractId = new ContractId(0, 0, 100);
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

                const tx = new AccountCreateTransaction({
                    key,
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
                const key = PrivateKey.generateED25519().publicKey;
                const hook1 = new HookCreationDetails({ extensionPoint: 1 });
                const hook2 = new HookCreationDetails({ extensionPoint: 2 });
                const hook3 = new HookCreationDetails({ extensionPoint: 3 });

                const tx = new AccountCreateTransaction({
                    key,
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

                const tx = new AccountCreateTransaction();
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

                const tx = new AccountCreateTransaction();
                tx.addHook(hook);

                expect(
                    tx.hooks[0].evmHook.storageUpdates[0].entries,
                ).to.have.lengthOf(2);
            });

            it("should work with frozen transaction without hooks", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);

                const tx = new AccountCreateTransaction()
                    .setKey(key)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                expect(tx.hooks).to.have.lengthOf(0);
                expect(() => tx.toBytes()).to.not.throw();
            });

            it("should work with frozen transaction with hooks", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new AccountCreateTransaction()
                    .setKey(key)
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

                const tx = new AccountCreateTransaction()
                    .addHook(hook1)
                    .addHook(hook2)
                    .addHook(hook3);

                expect(tx.hooks[0]).to.equal(hook1);
                expect(tx.hooks[1]).to.equal(hook2);
                expect(tx.hooks[2]).to.equal(hook3);
            });

            it("should allow setting hooks after initial construction", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({ extensionPoint: 1 });

                const tx = new AccountCreateTransaction({ key });
                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.key).to.equal(key);
            });
        });

        describe("integration with other properties", function () {
            it("should work with all account creation properties", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({ extensionPoint: 1 });
                const accountMemo = "test account";
                const initialBalance = 100;

                const tx = new AccountCreateTransaction({
                    key,
                    hooks: [hook],
                    accountMemo,
                    initialBalance,
                    receiverSignatureRequired: true,
                    maxAutomaticTokenAssociations: 10,
                    declineStakingReward: true,
                });

                expect(tx.key).to.equal(key);
                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.accountMemo).to.equal(accountMemo);
                expect(tx.receiverSignatureRequired).to.equal(true);
                expect(tx.maxAutomaticTokenAssociations.toNumber()).to.equal(
                    10,
                );
                expect(tx.declineStakingRewards).to.equal(true);
            });
        });
    });
});
