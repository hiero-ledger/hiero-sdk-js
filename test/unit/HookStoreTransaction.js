import Long from "long";
import {
    AccountId,
    Transaction,
    TransactionId,
    Timestamp,
} from "../../src/index.js";
import HookStoreTransaction from "../../src/hooks/HookStoreTransaction.js";
import HookId from "../../src/hooks/HookId.js";
import HookEntityId from "../../src/hooks/HookEntityId.js";
import {
    EvmHookStorageSlot,
    EvmHookMappingEntries,
} from "../../src/hooks/EvmHookStorageUpdate.js";
import EvmHookMappingEntry from "../../src/hooks/EvmHookMappingEntry.js";

describe("HookStoreTransaction", function () {
    const accountId = new AccountId(1);
    const nodeAccountId = new AccountId(3);
    const timestamp = new Timestamp(1234567890, 0);

    describe("constructor", function () {
        it("should create an empty transaction", function () {
            const transaction = new HookStoreTransaction();

            expect(transaction).to.be.an.instanceof(HookStoreTransaction);
            expect(transaction.hookId).to.be.null;
            expect(transaction.storageUpdates).to.be.an("array");
            expect(transaction.storageUpdates).to.have.lengthOf(0);
        });

        it("should create transaction with hookId", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });

            const transaction = new HookStoreTransaction({
                hookId,
            });

            expect(transaction.hookId).to.equal(hookId);
            expect(transaction.storageUpdates).to.be.an("array");
            expect(transaction.storageUpdates).to.have.lengthOf(0);
        });

        it("should create transaction with storage updates", function () {
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const transaction = new HookStoreTransaction({
                storageUpdates: [storageSlot],
            });

            expect(transaction.hookId).to.be.null;
            expect(transaction.storageUpdates).to.have.lengthOf(1);
            expect(transaction.storageUpdates[0]).to.equal(storageSlot);
        });

        it("should create transaction with both hookId and storage updates", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const transaction = new HookStoreTransaction({
                hookId,
                storageUpdates: [storageSlot],
            });

            expect(transaction.hookId).to.equal(hookId);
            expect(transaction.storageUpdates).to.have.lengthOf(1);
            expect(transaction.storageUpdates[0]).to.equal(storageSlot);
        });
    });

    describe("setHookId", function () {
        it("should set hook ID", function () {
            const transaction = new HookStoreTransaction();
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(777),
            });

            const result = transaction.setHookId(hookId);

            expect(transaction.hookId).to.equal(hookId);
            expect(result).to.equal(transaction); // should return this for chaining
        });

        it("should allow changing hook ID", function () {
            const hookId1 = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(111),
            });
            const hookId2 = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(4, 5, 6),
                }),
                hookId: Long.fromNumber(222),
            });

            const transaction = new HookStoreTransaction().setHookId(hookId1);
            transaction.setHookId(hookId2);

            expect(transaction.hookId).to.equal(hookId2);
        });
    });

    describe("setStorageUpdates", function () {
        it("should set storage updates", function () {
            const transaction = new HookStoreTransaction();
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const result = transaction.setStorageUpdates([storageSlot]);

            expect(transaction.storageUpdates).to.have.lengthOf(1);
            expect(transaction.storageUpdates[0]).to.equal(storageSlot);
            expect(result).to.equal(transaction); // should return this for chaining
        });

        it("should set multiple storage updates", function () {
            const storageSlot1 = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2]),
                value: new Uint8Array([3, 4]),
            });
            const storageSlot2 = new EvmHookStorageSlot({
                key: new Uint8Array([5, 6]),
                value: new Uint8Array([7, 8]),
            });

            const transaction = new HookStoreTransaction().setStorageUpdates([
                storageSlot1,
                storageSlot2,
            ]);

            expect(transaction.storageUpdates).to.have.lengthOf(2);
            expect(transaction.storageUpdates[0]).to.equal(storageSlot1);
            expect(transaction.storageUpdates[1]).to.equal(storageSlot2);
        });

        it("should allow replacing storage updates", function () {
            const storageSlot1 = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2]),
                value: new Uint8Array([3, 4]),
            });
            const storageSlot2 = new EvmHookStorageSlot({
                key: new Uint8Array([5, 6]),
                value: new Uint8Array([7, 8]),
            });

            const transaction = new HookStoreTransaction().setStorageUpdates([
                storageSlot1,
            ]);
            transaction.setStorageUpdates([storageSlot2]);

            expect(transaction.storageUpdates).to.have.lengthOf(1);
            expect(transaction.storageUpdates[0]).to.equal(storageSlot2);
        });
    });

    describe("_makeTransactionData", function () {
        it("should create transaction data with hookId only", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });

            const transaction = new HookStoreTransaction({
                hookId,
            });

            const data = transaction._makeTransactionData();

            expect(data.hookId).to.not.be.undefined;
            expect(data.storageUpdates).to.be.an("array");
            expect(data.storageUpdates).to.have.lengthOf(0);
        });

        it("should create transaction data with storage updates only", function () {
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const transaction = new HookStoreTransaction({
                storageUpdates: [storageSlot],
            });

            const data = transaction._makeTransactionData();

            expect(data.hookId).to.be.undefined;
            expect(data.storageUpdates).to.be.an("array");
            expect(data.storageUpdates).to.have.lengthOf(1);
        });

        it("should create transaction data with both hookId and storage updates", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const transaction = new HookStoreTransaction({
                hookId,
                storageUpdates: [storageSlot],
            });

            const data = transaction._makeTransactionData();

            expect(data.hookId).to.not.be.undefined;
            expect(data.storageUpdates).to.be.an("array");
            expect(data.storageUpdates).to.have.lengthOf(1);
        });

        it("should handle null values", function () {
            const transaction = new HookStoreTransaction();

            const data = transaction._makeTransactionData();

            expect(data.hookId).to.be.undefined;
            expect(data.storageUpdates).to.be.an("array");
            expect(data.storageUpdates).to.have.lengthOf(0);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return correct transaction data case", function () {
            const transaction = new HookStoreTransaction();

            expect(transaction._getTransactionDataCase()).to.equal("hookStore");
        });
    });

    describe("_getLogId", function () {
        it("should return correct log ID", function () {
            const transaction = new HookStoreTransaction()
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(
                    TransactionId.withValidStart(accountId, timestamp),
                );

            const logId = transaction._getLogId();

            expect(logId).to.include("HookStoreTransaction:");
            expect(logId).to.include(timestamp.toString());
        });
    });

    describe("storage update types", function () {
        describe("EvmHookStorageSlot", function () {
            it("should handle storage slot updates", function () {
                const key = new Uint8Array([1, 2, 3, 4]);
                const value = new Uint8Array([5, 6, 7, 8]);
                const storageSlot = new EvmHookStorageSlot({ key, value });

                const transaction = new HookStoreTransaction({
                    storageUpdates: [storageSlot],
                });

                expect(transaction.storageUpdates).to.have.lengthOf(1);
                expect(transaction.storageUpdates[0]).to.be.an.instanceof(
                    EvmHookStorageSlot,
                );
                expect(transaction.storageUpdates[0].key).to.deep.equal(key);
                expect(transaction.storageUpdates[0].value).to.deep.equal(
                    value,
                );
            });

            it("should handle multiple storage slot updates", function () {
                const slot1 = new EvmHookStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                });
                const slot2 = new EvmHookStorageSlot({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                });

                const transaction = new HookStoreTransaction({
                    storageUpdates: [slot1, slot2],
                });

                expect(transaction.storageUpdates).to.have.lengthOf(2);
                expect(transaction.storageUpdates[0]).to.equal(slot1);
                expect(transaction.storageUpdates[1]).to.equal(slot2);
            });
        });

        describe("EvmHookMappingEntries", function () {
            it("should handle mapping entries", function () {
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

                const transaction = new HookStoreTransaction({
                    storageUpdates: [mappingEntries],
                });

                expect(transaction.storageUpdates).to.have.lengthOf(1);
                expect(transaction.storageUpdates[0]).to.be.an.instanceof(
                    EvmHookMappingEntries,
                );
                expect(transaction.storageUpdates[0].mappingSlot).to.deep.equal(
                    mappingSlot,
                );
                expect(transaction.storageUpdates[0].entries).to.have.lengthOf(
                    1,
                );
                expect(
                    transaction.storageUpdates[0].entries[0].key,
                ).to.deep.equal(entryKey);
                expect(
                    transaction.storageUpdates[0].entries[0].value,
                ).to.deep.equal(entryValue);
            });

            it("should handle multiple mapping entries", function () {
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

                const transaction = new HookStoreTransaction({
                    storageUpdates: [mappingEntries],
                });

                expect(transaction.storageUpdates[0].entries).to.have.lengthOf(
                    2,
                );
                expect(transaction.storageUpdates[0].entries[0]).to.equal(
                    entry1,
                );
                expect(transaction.storageUpdates[0].entries[1]).to.equal(
                    entry2,
                );
            });
        });

        describe("mixed storage update types", function () {
            it("should handle both storage slots and mapping entries", function () {
                const storageSlot = new EvmHookStorageSlot({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                });
                const mappingEntries = new EvmHookMappingEntries({
                    mappingSlot: new Uint8Array([5, 6]),
                    entries: [
                        new EvmHookMappingEntry({
                            key: new Uint8Array([7, 8]),
                            value: new Uint8Array([9, 10]),
                        }),
                    ],
                });

                const transaction = new HookStoreTransaction({
                    storageUpdates: [storageSlot, mappingEntries],
                });

                expect(transaction.storageUpdates).to.have.lengthOf(2);
                expect(transaction.storageUpdates[0]).to.be.an.instanceof(
                    EvmHookStorageSlot,
                );
                expect(transaction.storageUpdates[1]).to.be.an.instanceof(
                    EvmHookMappingEntries,
                );
            });
        });
    });

    describe("serialization", function () {
        it("should serialize and deserialize empty transaction with nothing set", function () {
            const transaction = new HookStoreTransaction()
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(
                    TransactionId.withValidStart(accountId, timestamp),
                )
                .freeze();

            const bytes = transaction.toBytes();
            const deserializedTx = Transaction.fromBytes(bytes);

            expect(deserializedTx).to.be.an.instanceof(HookStoreTransaction);
            expect(deserializedTx.hookId).to.be.null;
            expect(deserializedTx.storageUpdates).to.be.an("array");
            expect(deserializedTx.storageUpdates).to.have.lengthOf(0);
        });

        it("should serialize and deserialize with hookId only", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });

            const transaction = new HookStoreTransaction({ hookId })
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(
                    TransactionId.withValidStart(accountId, timestamp),
                )
                .freeze();

            const bytes = transaction.toBytes();
            const deserializedTx = Transaction.fromBytes(bytes);

            expect(deserializedTx).to.be.an.instanceof(HookStoreTransaction);
            expect(deserializedTx.hookId).to.not.be.null;
            expect(deserializedTx.hookId.hookId.toNumber()).to.equal(999);
        });

        it("should serialize and deserialize with storage updates", function () {
            const key = new Uint8Array([1, 2, 3, 4]);
            const value = new Uint8Array([5, 6, 7, 8]);
            const storageSlot = new EvmHookStorageSlot({
                key,
                value,
            });

            const transaction = new HookStoreTransaction({
                storageUpdates: [storageSlot],
            })
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(
                    TransactionId.withValidStart(accountId, timestamp),
                )
                .freeze();

            const bytes = transaction.toBytes();
            const deserializedTx = Transaction.fromBytes(bytes);

            expect(deserializedTx).to.be.an.instanceof(HookStoreTransaction);
            expect(deserializedTx.storageUpdates).to.have.lengthOf(1);
            expect(deserializedTx.storageUpdates[0]).to.be.an.instanceof(
                EvmHookStorageSlot,
            );
            expect(deserializedTx.storageUpdates[0].key).to.deep.equal(key);
            expect(deserializedTx.storageUpdates[0].value).to.deep.equal(value);
        });

        it("should serialize and deserialize complete transaction", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });
            const mappingEntries = new EvmHookMappingEntries({
                mappingSlot: new Uint8Array([9, 10, 11, 12]),
                entries: [
                    new EvmHookMappingEntry({
                        key: new Uint8Array([13, 14]),
                        value: new Uint8Array([15, 16]),
                    }),
                ],
            });

            const transaction = new HookStoreTransaction({
                hookId,
                storageUpdates: [storageSlot, mappingEntries],
            })
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(
                    TransactionId.withValidStart(accountId, timestamp),
                )
                .freeze();

            const bytes = transaction.toBytes();
            const deserializedTx = Transaction.fromBytes(bytes);

            expect(deserializedTx).to.be.an.instanceof(HookStoreTransaction);
            expect(deserializedTx.hookId).to.not.be.null;
            expect(deserializedTx.hookId.hookId.toNumber()).to.equal(999);
            expect(deserializedTx.storageUpdates).to.have.lengthOf(2);
            expect(deserializedTx.storageUpdates[0]).to.be.an.instanceof(
                EvmHookStorageSlot,
            );
            expect(deserializedTx.storageUpdates[1]).to.be.an.instanceof(
                EvmHookMappingEntries,
            );
        });
    });

    describe("method chaining", function () {
        it("should support method chaining", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const transaction = new HookStoreTransaction()
                .setHookId(hookId)
                .setStorageUpdates([storageSlot])
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(
                    TransactionId.withValidStart(accountId, timestamp),
                );

            expect(transaction).to.be.an.instanceof(HookStoreTransaction);
            expect(transaction.hookId).to.equal(hookId);
            expect(transaction.storageUpdates).to.have.lengthOf(1);
        });
    });

    describe("edge cases", function () {
        it("should handle empty storage updates array", function () {
            const transaction = new HookStoreTransaction({
                storageUpdates: [],
            });

            expect(transaction.storageUpdates).to.be.an("array");
            expect(transaction.storageUpdates).to.have.lengthOf(0);
        });

        it("should handle setting storage updates to empty array", function () {
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2]),
                value: new Uint8Array([3, 4]),
            });

            const transaction = new HookStoreTransaction({
                storageUpdates: [storageSlot],
            });

            transaction.setStorageUpdates([]);

            expect(transaction.storageUpdates).to.have.lengthOf(0);
        });

        it("should handle large byte arrays in storage slots", function () {
            const largeKey = new Uint8Array(256).fill(1);
            const largeValue = new Uint8Array(512).fill(2);
            const storageSlot = new EvmHookStorageSlot({
                key: largeKey,
                value: largeValue,
            });

            const transaction = new HookStoreTransaction({
                storageUpdates: [storageSlot],
            });

            expect(transaction.storageUpdates[0].key).to.deep.equal(largeKey);
            expect(transaction.storageUpdates[0].value).to.deep.equal(
                largeValue,
            );
        });

        it("should handle mapping entry with preimage", function () {
            const entry = new EvmHookMappingEntry({
                preimage: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });
            const mappingEntries = new EvmHookMappingEntries({
                mappingSlot: new Uint8Array([9, 10]),
                entries: [entry],
            });

            const transaction = new HookStoreTransaction({
                storageUpdates: [mappingEntries],
            });

            expect(
                transaction.storageUpdates[0].entries[0].preimage,
            ).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
            expect(transaction.storageUpdates[0].entries[0].key).to.be.null;
        });

        it("should handle very long hook ID", function () {
            const largeHookId = Long.fromString("9223372036854775807"); // max Long value
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: largeHookId,
            });

            const transaction = new HookStoreTransaction({ hookId });

            expect(transaction.hookId.hookId.toString()).to.equal(
                "9223372036854775807",
            );
        });
    });

    describe("protobuf conversion", function () {
        it("should convert to protobuf correctly", function () {
            const hookId = new HookId({
                entityId: new HookEntityId({
                    accountId: new AccountId(1, 2, 3),
                }),
                hookId: Long.fromNumber(999),
            });
            const storageSlot = new EvmHookStorageSlot({
                key: new Uint8Array([1, 2, 3, 4]),
                value: new Uint8Array([5, 6, 7, 8]),
            });

            const transaction = new HookStoreTransaction({
                hookId,
                storageUpdates: [storageSlot],
            });

            const txData = transaction._makeTransactionData();

            expect(txData.hookId).to.not.be.undefined;
            expect(txData.storageUpdates).to.be.an("array");
            expect(txData.storageUpdates).to.have.lengthOf(1);
            expect(txData.storageUpdates[0].storageSlot).to.not.be.undefined;
            expect(txData.storageUpdates[0].storageSlot.key).to.deep.equal(
                new Uint8Array([1, 2, 3, 4]),
            );
            expect(txData.storageUpdates[0].storageSlot.value).to.deep.equal(
                new Uint8Array([5, 6, 7, 8]),
            );
        });
    });
});
