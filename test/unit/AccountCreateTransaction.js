import Long from "long";

import {
    PrivateKey,
    AccountCreateTransaction,
    AccountId,
    Timestamp,
    Transaction,
    TransactionId,
    EvmAddress,
    Client,
    Hbar,
    HookExtensionPoint,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.hooks[0]).to.equal(hook);
            });

            it("should add multiple hooks to the hooks array", function () {
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

                const result = tx.addHook(hook);

                expect(result).to.equal(tx);
            });
        });

        describe("setHooks", function () {
            it("should set the hooks array", function () {
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();
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
                const tx = new AccountCreateTransaction();

                expect(tx.hooks).to.be.an("array");
                expect(tx.hooks).to.have.lengthOf(0);
            });

            it("should return the hooks array", function () {
                const tx = new AccountCreateTransaction();
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
                const hooks = [
                    new HookCreationDetails({
                        extensionPoint:
                            HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    }),
                ];
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    evmHook: evmHook,
                });

                const tx = new AccountCreateTransaction();
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    adminKey,
                });

                const tx = new AccountCreateTransaction();
                tx.addHook(hook);

                expect(tx.hooks[0].adminKey).to.equal(adminKey);
            });

            it("should create a hook with hookId", function () {
                const hookId = Long.fromNumber(999);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId,
                    evmHook: evmHook,
                    adminKey,
                });

                const tx = new AccountCreateTransaction();
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
                const key = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                );
                expect(txData.hookCreationDetails[0].hookId).to.equal(hookId);
                expect(txData.hookCreationDetails[0].evmHook).to.not.be.null;
                expect(txData.hookCreationDetails[0].adminKey).to.not.be.null;
            });

            it("should serialize multiple hooks", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const hook1 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook3 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
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
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                const hook1 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
                const hook3 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

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
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });

                const tx = new AccountCreateTransaction({ key });
                tx.addHook(hook);

                expect(tx.hooks).to.have.lengthOf(1);
                expect(tx.key).to.equal(key);
            });
        });

        describe("integration with other properties", function () {
            it("should work with all account creation properties", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                });
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

        describe("round-trip serialization (toBytes/fromBytes)", function () {
            it("should preserve hooks in frozen -> toBytes() -> fromBytes() round trip", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: Long.fromNumber(42),
                    evmHook: new EvmHook({
                        contractId: new ContractId(1234),
                    }),
                });

                const tx = new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .addHook(hook)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                const decoded = Transaction.fromBytes(tx.toBytes());

                expect(decoded.hooks).to.have.lengthOf(1);
                expect(decoded.hooks[0].extensionPoint).to.equal(
                    HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                );
                expect(decoded.hooks[0].hookId.toNumber()).to.equal(42);
                expect(
                    decoded.hooks[0].evmHook.contractId.num.toNumber(),
                ).to.equal(1234);
            });

            it("should preserve hooks in unfrozen -> toBytes() -> fromBytes() -> freeze() round trip", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: Long.fromNumber(42),
                });

                const tx = new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .addHook(hook)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId));

                const decoded = Transaction.fromBytes(tx.toBytes()).freeze();

                expect(decoded.hooks).to.have.lengthOf(1);
                expect(decoded.hooks[0].extensionPoint).to.equal(
                    HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                );
                expect(decoded.hooks[0].hookId.toNumber()).to.equal(42);

                const body = decoded._makeTransactionData();
                expect(body.hookCreationDetails).to.have.lengthOf(1);
            });

            it("should preserve complex hooks with storage updates", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);
                const storageKey = new Uint8Array([1, 2, 3, 4]);
                const storageValue = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({
                    key: storageKey,
                    value: storageValue,
                });
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    evmHook: new EvmHook({
                        contractId: new ContractId(999),
                        storageUpdates: [storageSlot],
                    }),
                });

                const tx = new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .addHook(hook)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                const decoded = Transaction.fromBytes(tx.toBytes());

                expect(decoded.hooks).to.have.lengthOf(1);
                expect(
                    decoded.hooks[0].evmHook.storageUpdates,
                ).to.have.lengthOf(1);
                expect(
                    decoded.hooks[0].evmHook.storageUpdates[0].key,
                ).to.deep.equal(storageKey);
                expect(
                    decoded.hooks[0].evmHook.storageUpdates[0].value,
                ).to.deep.equal(storageValue);
            });

            it("should preserve multiple hooks", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);
                const hook1 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: Long.fromNumber(1),
                });
                const hook2 = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    hookId: Long.fromNumber(2),
                });

                const tx = new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .addHook(hook1)
                    .addHook(hook2)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                const decoded = Transaction.fromBytes(tx.toBytes());

                expect(decoded.hooks).to.have.lengthOf(2);
                expect(decoded.hooks[0].hookId.toNumber()).to.equal(1);
                expect(decoded.hooks[1].hookId.toNumber()).to.equal(2);
            });

            it("should preserve hooks with adminKey", function () {
                const key = PrivateKey.generateED25519().publicKey;
                const adminKey = PrivateKey.generateED25519().publicKey;
                const accountId = new AccountId(3);
                const hook = new HookCreationDetails({
                    extensionPoint: HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK,
                    adminKey,
                });

                const tx = new AccountCreateTransaction()
                    .setKeyWithoutAlias(key)
                    .addHook(hook)
                    .setNodeAccountIds([accountId])
                    .setTransactionId(TransactionId.generate(accountId))
                    .freeze();

                const decoded = Transaction.fromBytes(tx.toBytes());

                expect(decoded.hooks).to.have.lengthOf(1);
                expect(decoded.hooks[0].adminKey).to.not.be.null;
                expect(decoded.hooks[0].adminKey.toString()).to.equal(
                    adminKey.toString(),
                );
            });
        });
    });

    describe("autoRenewPeriod, staking and logging", function () {
        const VALID_START = new Timestamp(1596210382, 0);

        it("should accept an autoRenewPeriod given as a Duration", function () {
            const transaction =
                new AccountCreateTransaction().setAutoRenewPeriod(
                    new Duration(90),
                );

            expect(transaction.autoRenewPeriod).to.be.instanceOf(Duration);
            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
        });

        it("should accept an autoRenewPeriod given as a Long", function () {
            const transaction =
                new AccountCreateTransaction().setAutoRenewPeriod(
                    Long.fromNumber(90),
                );

            expect(transaction.autoRenewPeriod).to.be.instanceOf(Duration);
            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
        });

        it("should accept an autoRenewPeriod given as a number", function () {
            const transaction =
                new AccountCreateTransaction().setAutoRenewPeriod(90);

            expect(transaction.autoRenewPeriod).to.be.instanceOf(Duration);
            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
        });

        it("should set stakedAccountId from a string", function () {
            const transaction =
                new AccountCreateTransaction().setStakedAccountId("0.0.456");

            expect(transaction.stakedAccountId.toString()).to.equal("0.0.456");
        });

        it("should set stakedAccountId from an instance", function () {
            const transaction =
                new AccountCreateTransaction().setStakedAccountId(
                    new AccountId(0, 0, 456),
                );

            expect(transaction.stakedAccountId.toString()).to.equal("0.0.456");
        });

        it("should set stakedNodeId", function () {
            const transaction = new AccountCreateTransaction().setStakedNodeId(
                1,
            );

            expect(transaction.stakedNodeId.toNumber()).to.equal(1);

            transaction.setStakedNodeId(Long.fromNumber(2));

            expect(transaction.stakedNodeId.toNumber()).to.equal(2);
        });

        it("should set the staking fields from props", function () {
            const transaction = new AccountCreateTransaction({
                autoRenewPeriod: new Duration(90),
                stakedAccountId: new AccountId(0, 0, 456),
                stakedNodeId: 1,
            });

            expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(90);
            expect(transaction.stakedAccountId.toString()).to.equal("0.0.456");
            expect(transaction.stakedNodeId.toNumber()).to.equal(1);
        });

        it("should keep the staking fields through a round trip", function () {
            const transaction = new AccountCreateTransaction()
                .setKey(PrivateKey.generateED25519().publicKey)
                .setStakedAccountId(new AccountId(0, 0, 456))
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(AccountCreateTransaction);
            expect(decoded.stakedAccountId.toString()).to.equal("0.0.456");
        });

        it("should throw once frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        VALID_START,
                    ),
                )
                .freeze();

            expect(() => transaction.setAutoRenewPeriod(90)).to.throw(
                "transaction is immutable",
            );
            expect(() =>
                transaction.setStakedAccountId(new AccountId(0, 0, 456)),
            ).to.throw("transaction is immutable");
            expect(() => transaction.setStakedNodeId(1)).to.throw(
                "transaction is immutable",
            );
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

        it("should check the deprecated proxy account ID checksum", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";

            const transaction = new AccountCreateTransaction();
            transaction._proxyAccountId = accountId;

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should not throw when no proxy account ID is set", function () {
            expect(() =>
                new AccountCreateTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.createAccount() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    createAccount: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new AccountCreateTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        new Timestamp(1596210382, 0),
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `AccountCreateTransaction:${new Timestamp(
                    1596210382,
                    0,
                ).toString()}`,
            );
        });
    });

    describe("initialBalance", function () {
        it("defaults to null", function () {
            expect(new AccountCreateTransaction().initialBalance).to.be.null;
        });

        it("should set the initial balance from a number", function () {
            const transaction =
                new AccountCreateTransaction().setInitialBalance(100);

            expect(transaction.initialBalance).to.be.instanceOf(Hbar);
            expect(transaction.initialBalance.toTinybars().toNumber()).to.equal(
                10000000000,
            );
        });

        it("should keep an Hbar instance as is", function () {
            const initialBalance = new Hbar(2);
            const transaction =
                new AccountCreateTransaction().setInitialBalance(
                    initialBalance,
                );

            expect(transaction.initialBalance).to.equal(initialBalance);
        });

        it("should throw once frozen", function () {
            const transaction = new AccountCreateTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        new Timestamp(1596210382, 0),
                    ),
                )
                .freeze();

            expect(() => transaction.setInitialBalance(1)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setAlias", function () {
        it("should throw for an invalid EVM address", function () {
            expect(() =>
                new AccountCreateTransaction().setAlias("0x1234"),
            ).to.throw(
                'evmAddress must be a valid EVM address with or without "0x" prefix',
            );
        });
    });
});
