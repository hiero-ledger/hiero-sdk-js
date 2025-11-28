import {
    LambdaStorageUpdate,
    LambdaStorageSlot,
    LambdaMappingEntries,
} from "../../src/hooks/LambdaStorageUpdate.js";
import LambdaMappingEntry from "../../src/hooks/LambdaMappingEntry.js";

describe("LambdaStorageSlot", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const slot = new LambdaStorageSlot();

            expect(slot.key).to.be.null;
            expect(slot.value).to.be.null;
        });

        it("should create an instance with provided key", function () {
            const key = new Uint8Array([1, 2, 3, 4]);
            const slot = new LambdaStorageSlot({ key });

            expect(slot.key).to.equal(key);
            expect(slot.value).to.be.null;
        });

        it("should create an instance with provided value", function () {
            const value = new Uint8Array([5, 6, 7, 8]);
            const slot = new LambdaStorageSlot({ value });

            expect(slot.key).to.be.null;
            expect(slot.value).to.equal(value);
        });

        it("should create an instance with key and value", function () {
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const slot = new LambdaStorageSlot({ key, value });

            expect(slot.key).to.equal(key);
            expect(slot.value).to.equal(value);
        });

        it("should create an instance with empty props object", function () {
            const slot = new LambdaStorageSlot({});

            expect(slot.key).to.be.null;
            expect(slot.value).to.be.null;
        });

        it("should handle empty Uint8Arrays", function () {
            const key = new Uint8Array([]);
            const value = new Uint8Array([]);
            const slot = new LambdaStorageSlot({ key, value });

            expect(slot.key).to.equal(key);
            expect(slot.value).to.equal(value);
            expect(slot.key.length).to.equal(0);
            expect(slot.value.length).to.equal(0);
        });
    });

    describe("setKey", function () {
        it("should set key and return this for chaining", function () {
            const slot = new LambdaStorageSlot();
            const key = new Uint8Array([1, 2, 3]);

            const result = slot.setKey(key);

            expect(result).to.equal(slot);
            expect(slot.key).to.equal(key);
        });

        it("should overwrite existing key", function () {
            const oldKey = new Uint8Array([1, 2, 3]);
            const newKey = new Uint8Array([4, 5, 6]);
            const slot = new LambdaStorageSlot({ key: oldKey });

            slot.setKey(newKey);

            expect(slot.key).to.equal(newKey);
        });

        it("should not affect value", function () {
            const value = new Uint8Array([1, 2, 3]);
            const slot = new LambdaStorageSlot({ value });
            const key = new Uint8Array([4, 5, 6]);

            slot.setKey(key);

            expect(slot.value).to.equal(value);
        });
    });

    describe("setValue", function () {
        it("should set value and return this for chaining", function () {
            const slot = new LambdaStorageSlot();
            const value = new Uint8Array([7, 8, 9]);

            const result = slot.setValue(value);

            expect(result).to.equal(slot);
            expect(slot.value).to.equal(value);
        });

        it("should overwrite existing value", function () {
            const oldValue = new Uint8Array([1, 2, 3]);
            const newValue = new Uint8Array([4, 5, 6]);
            const slot = new LambdaStorageSlot({ value: oldValue });

            slot.setValue(newValue);

            expect(slot.value).to.equal(newValue);
        });

        it("should not affect key", function () {
            const key = new Uint8Array([1, 2, 3]);
            const slot = new LambdaStorageSlot({ key });
            const value = new Uint8Array([4, 5, 6]);

            slot.setValue(value);

            expect(slot.key).to.equal(key);
        });
    });

    describe("getters", function () {
        it("should get key using getter", function () {
            const key = new Uint8Array([1, 2, 3]);
            const slot = new LambdaStorageSlot({ key });

            expect(slot.key).to.equal(key);
        });

        it("should get value using getter", function () {
            const value = new Uint8Array([4, 5, 6]);
            const slot = new LambdaStorageSlot({ value });

            expect(slot.value).to.equal(value);
        });

        it("should return null for unset values", function () {
            const slot = new LambdaStorageSlot();

            expect(slot.key).to.be.null;
            expect(slot.value).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with key and value", function () {
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const slot = new LambdaStorageSlot({ key, value });

            const proto = slot._toProtobuf();

            expect(proto).to.be.an("object");
            expect(proto).to.have.property("storageSlot");
            expect(proto.storageSlot.key).to.equal(key);
            expect(proto.storageSlot.value).to.equal(value);
        });

        it("should convert to protobuf with null values", function () {
            const slot = new LambdaStorageSlot();

            const proto = slot._toProtobuf();

            expect(proto.storageSlot.key).to.be.null;
            expect(proto.storageSlot.value).to.be.null;
        });

        it("should handle empty Uint8Arrays", function () {
            const key = new Uint8Array([]);
            const value = new Uint8Array([]);
            const slot = new LambdaStorageSlot({ key, value });

            const proto = slot._toProtobuf();

            expect(proto.storageSlot.key).to.equal(key);
            expect(proto.storageSlot.value).to.equal(value);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create instance from protobuf with key and value", function () {
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const proto = {
                storageSlot: { key, value },
            };

            const slot = LambdaStorageSlot._fromProtobuf(proto);

            expect(slot).to.be.instanceOf(LambdaStorageSlot);
            expect(slot.key).to.equal(key);
            expect(slot.value).to.equal(value);
        });

        it("should create instance from protobuf with null values", function () {
            const proto = {
                storageSlot: { key: null, value: null },
            };

            const slot = LambdaStorageSlot._fromProtobuf(proto);

            expect(slot).to.be.instanceOf(LambdaStorageSlot);
            expect(slot.key).to.be.null;
            expect(slot.value).to.be.null;
        });

        it("should throw error if storageSlot is not present", function () {
            const proto = {};

            expect(() => LambdaStorageSlot._fromProtobuf(proto)).to.throw(
                "LambdaStorageSlot._fromProtobuf must be implemented by a subclass",
            );
        });

        it("should handle empty Uint8Arrays from protobuf", function () {
            const key = new Uint8Array([]);
            const value = new Uint8Array([]);
            const proto = {
                storageSlot: { key, value },
            };

            const slot = LambdaStorageSlot._fromProtobuf(proto);

            expect(slot.key.length).to.equal(0);
            expect(slot.value.length).to.equal(0);
        });
    });

    describe("round-trip serialization", function () {
        it("should maintain data through protobuf round-trip", function () {
            const key = new Uint8Array([1, 2, 3, 4, 5]);
            const value = new Uint8Array([6, 7, 8, 9, 10]);
            const original = new LambdaStorageSlot({ key, value });

            const proto = original._toProtobuf();
            const restored = LambdaStorageSlot._fromProtobuf(proto);

            expect(Array.from(restored.key)).to.deep.equal(
                Array.from(original.key),
            );
            expect(Array.from(restored.value)).to.deep.equal(
                Array.from(original.value),
            );
        });

        it("should handle empty instance round-trip", function () {
            const original = new LambdaStorageSlot();

            const proto = original._toProtobuf();
            const restored = LambdaStorageSlot._fromProtobuf(proto);

            expect(restored.key).to.be.null;
            expect(restored.value).to.be.null;
        });
    });

    describe("method chaining", function () {
        it("should support chaining setKey and setValue", function () {
            const slot = new LambdaStorageSlot();
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);

            const result = slot.setKey(key).setValue(value);

            expect(result).to.equal(slot);
            expect(slot.key).to.equal(key);
            expect(slot.value).to.equal(value);
        });
    });

    describe("inheritance", function () {
        it("should be an instance of LambdaStorageUpdate", function () {
            const slot = new LambdaStorageSlot();

            expect(slot).to.be.instanceOf(LambdaStorageUpdate);
        });
    });
});

describe("LambdaMappingEntries", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const mappingEntries = new LambdaMappingEntries();

            expect(mappingEntries.mappingSlot).to.be.null;
            expect(mappingEntries.entries).to.be.null;
        });

        it("should create an instance with provided mappingSlot", function () {
            const mappingSlot = new Uint8Array([1, 2, 3, 4]);
            const mappingEntries = new LambdaMappingEntries({ mappingSlot });

            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
            expect(mappingEntries.entries).to.be.null;
        });

        it("should create an instance with provided entries", function () {
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({ entries });

            expect(mappingEntries.mappingSlot).to.be.null;
            expect(mappingEntries.entries).to.equal(entries);
            expect(mappingEntries.entries).to.have.lengthOf(1);
        });

        it("should create an instance with mappingSlot and entries", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([4, 5]),
                    value: new Uint8Array([6, 7]),
                }),
                new LambdaMappingEntry({
                    key: new Uint8Array([8, 9]),
                    value: new Uint8Array([10, 11]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({
                mappingSlot,
                entries,
            });

            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
            expect(mappingEntries.entries).to.equal(entries);
            expect(mappingEntries.entries).to.have.lengthOf(2);
        });

        it("should handle empty entries array", function () {
            const entries = [];
            const mappingEntries = new LambdaMappingEntries({ entries });

            expect(mappingEntries.entries).to.equal(entries);
            expect(mappingEntries.entries).to.have.lengthOf(0);
        });
    });

    describe("setMappingSlot", function () {
        it("should set mappingSlot and return this for chaining", function () {
            const mappingEntries = new LambdaMappingEntries();
            const mappingSlot = new Uint8Array([1, 2, 3]);

            const result = mappingEntries.setMappingSlot(mappingSlot);

            expect(result).to.equal(mappingEntries);
            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
        });

        it("should overwrite existing mappingSlot", function () {
            const oldSlot = new Uint8Array([1, 2, 3]);
            const newSlot = new Uint8Array([4, 5, 6]);
            const mappingEntries = new LambdaMappingEntries({
                mappingSlot: oldSlot,
            });

            mappingEntries.setMappingSlot(newSlot);

            expect(mappingEntries.mappingSlot).to.equal(newSlot);
        });

        it("should not affect entries", function () {
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({ entries });
            const mappingSlot = new Uint8Array([5, 6]);

            mappingEntries.setMappingSlot(mappingSlot);

            expect(mappingEntries.entries).to.equal(entries);
        });
    });

    describe("setEntries", function () {
        it("should set entries and return this for chaining", function () {
            const mappingEntries = new LambdaMappingEntries();
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
            ];

            const result = mappingEntries.setEntries(entries);

            expect(result).to.equal(mappingEntries);
            expect(mappingEntries.entries).to.equal(entries);
        });

        it("should overwrite existing entries", function () {
            const oldEntries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
            ];
            const newEntries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([5, 6]),
                    value: new Uint8Array([7, 8]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({
                entries: oldEntries,
            });

            mappingEntries.setEntries(newEntries);

            expect(mappingEntries.entries).to.equal(newEntries);
        });

        it("should not affect mappingSlot", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const mappingEntries = new LambdaMappingEntries({ mappingSlot });
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([4, 5]),
                    value: new Uint8Array([6, 7]),
                }),
            ];

            mappingEntries.setEntries(entries);

            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
        });
    });

    describe("getters", function () {
        it("should get mappingSlot using getter", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const mappingEntries = new LambdaMappingEntries({ mappingSlot });

            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
        });

        it("should get entries using getter", function () {
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({ entries });

            expect(mappingEntries.entries).to.equal(entries);
        });

        it("should return null for unset values", function () {
            const mappingEntries = new LambdaMappingEntries();

            expect(mappingEntries.mappingSlot).to.be.null;
            expect(mappingEntries.entries).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with mappingSlot and entries", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([4, 5]),
                    value: new Uint8Array([6, 7]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({
                mappingSlot,
                entries,
            });

            const proto = mappingEntries._toProtobuf();

            expect(proto).to.be.an("object");
            expect(proto).to.have.property("mappingEntries");
            expect(proto.mappingEntries.mappingSlot).to.equal(mappingSlot);
            expect(proto.mappingEntries.entries).to.be.an("array");
            expect(proto.mappingEntries.entries).to.have.lengthOf(1);
        });

        it("should convert to protobuf with null values", function () {
            const mappingEntries = new LambdaMappingEntries();

            const proto = mappingEntries._toProtobuf();

            expect(proto.mappingEntries.mappingSlot).to.be.null;
            expect(proto.mappingEntries.entries).to.be.null;
        });

        it("should handle empty entries array", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const entries = [];
            const mappingEntries = new LambdaMappingEntries({
                mappingSlot,
                entries,
            });

            const proto = mappingEntries._toProtobuf();

            expect(proto.mappingEntries.entries).to.be.an("array");
            expect(proto.mappingEntries.entries).to.have.lengthOf(0);
        });

        it("should serialize nested entries correctly", function () {
            const mappingSlot = new Uint8Array([1, 2]);
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([3, 4]),
                    value: new Uint8Array([5, 6]),
                }),
                new LambdaMappingEntry({
                    preimage: new Uint8Array([7, 8]),
                    value: new Uint8Array([9, 10]),
                }),
            ];
            const mappingEntries = new LambdaMappingEntries({
                mappingSlot,
                entries,
            });

            const proto = mappingEntries._toProtobuf();

            expect(proto.mappingEntries.entries).to.have.lengthOf(2);
            expect(proto.mappingEntries.entries[0].key).to.deep.equal(
                new Uint8Array([3, 4]),
            );
            expect(proto.mappingEntries.entries[1].preimage).to.deep.equal(
                new Uint8Array([7, 8]),
            );
        });
    });

    describe("_fromProtobuf", function () {
        it("should create instance from protobuf with mappingSlot and entries", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const proto = {
                mappingEntries: {
                    mappingSlot,
                    entries: [
                        {
                            key: new Uint8Array([4, 5]),
                            value: new Uint8Array([6, 7]),
                        },
                    ],
                },
            };

            const mappingEntries = LambdaMappingEntries._fromProtobuf(proto);

            expect(mappingEntries).to.be.instanceOf(LambdaMappingEntries);
            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
            expect(mappingEntries.entries).to.be.an("array");
            expect(mappingEntries.entries).to.have.lengthOf(1);
            expect(mappingEntries.entries[0]).to.be.instanceOf(
                LambdaMappingEntry,
            );
        });

        it("should create instance from protobuf with null values", function () {
            const proto = {
                mappingEntries: {},
            };

            const mappingEntries = LambdaMappingEntries._fromProtobuf(proto);

            expect(mappingEntries).to.be.instanceOf(LambdaMappingEntries);
            expect(mappingEntries.mappingSlot).to.be.null;
        });

        it("should handle empty entries array from protobuf", function () {
            const proto = {
                mappingEntries: {
                    mappingSlot: new Uint8Array([1, 2]),
                    entries: [],
                },
            };

            const mappingEntries = LambdaMappingEntries._fromProtobuf(proto);

            expect(mappingEntries.entries).to.be.an("array");
            expect(mappingEntries.entries).to.have.lengthOf(0);
        });

        it("should deserialize nested entries correctly", function () {
            const proto = {
                mappingEntries: {
                    mappingSlot: new Uint8Array([1, 2]),
                    entries: [
                        {
                            key: new Uint8Array([3, 4]),
                            value: new Uint8Array([5, 6]),
                        },
                        {
                            preimage: new Uint8Array([7, 8]),
                            value: new Uint8Array([9, 10]),
                        },
                    ],
                },
            };

            const mappingEntries = LambdaMappingEntries._fromProtobuf(proto);

            expect(mappingEntries.entries).to.have.lengthOf(2);
            expect(Array.from(mappingEntries.entries[0].key)).to.deep.equal([
                3, 4,
            ]);
            expect(
                Array.from(mappingEntries.entries[1].preimage),
            ).to.deep.equal([7, 8]);
        });
    });

    describe("round-trip serialization", function () {
        it("should maintain data through protobuf round-trip", function () {
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([4, 5]),
                    value: new Uint8Array([6, 7]),
                }),
                new LambdaMappingEntry({
                    preimage: new Uint8Array([8, 9]),
                    value: new Uint8Array([10, 11]),
                }),
            ];
            const original = new LambdaMappingEntries({ mappingSlot, entries });

            const proto = original._toProtobuf();
            const restored = LambdaMappingEntries._fromProtobuf(proto);

            expect(Array.from(restored.mappingSlot)).to.deep.equal(
                Array.from(original.mappingSlot),
            );
            expect(restored.entries).to.have.lengthOf(original.entries.length);
            expect(Array.from(restored.entries[0].key)).to.deep.equal(
                Array.from(original.entries[0].key),
            );
            expect(Array.from(restored.entries[1].preimage)).to.deep.equal(
                Array.from(original.entries[1].preimage),
            );
        });

        it("should handle empty instance round-trip", function () {
            const original = new LambdaMappingEntries();

            const proto = original._toProtobuf();
            const restored = LambdaMappingEntries._fromProtobuf(proto);

            expect(restored.mappingSlot).to.be.null;
            expect(restored.entries).to.be.null;
        });
    });

    describe("method chaining", function () {
        it("should support chaining setMappingSlot and setEntries", function () {
            const mappingEntries = new LambdaMappingEntries();
            const mappingSlot = new Uint8Array([1, 2, 3]);
            const entries = [
                new LambdaMappingEntry({
                    key: new Uint8Array([4, 5]),
                    value: new Uint8Array([6, 7]),
                }),
            ];

            const result = mappingEntries
                .setMappingSlot(mappingSlot)
                .setEntries(entries);

            expect(result).to.equal(mappingEntries);
            expect(mappingEntries.mappingSlot).to.equal(mappingSlot);
            expect(mappingEntries.entries).to.equal(entries);
        });
    });

    describe("inheritance", function () {
        it("should be an instance of LambdaStorageUpdate", function () {
            const mappingEntries = new LambdaMappingEntries();

            expect(mappingEntries).to.be.instanceOf(LambdaStorageUpdate);
        });
    });
});

describe("LambdaStorageUpdate", function () {
    describe("_fromProtobuf", function () {
        it("should create LambdaStorageSlot when storageSlot is present", function () {
            const proto = {
                storageSlot: {
                    key: new Uint8Array([1, 2, 3]),
                    value: new Uint8Array([4, 5, 6]),
                },
            };

            const result = LambdaStorageUpdate._fromProtobuf(proto);

            expect(result).to.be.instanceOf(LambdaStorageSlot);
            expect(result.key).to.deep.equal(new Uint8Array([1, 2, 3]));
            expect(result.value).to.deep.equal(new Uint8Array([4, 5, 6]));
        });

        it("should create LambdaMappingEntries when mappingEntries is present", function () {
            const proto = {
                mappingEntries: {
                    mappingSlot: new Uint8Array([1, 2, 3]),
                    entries: [
                        {
                            key: new Uint8Array([4, 5]),
                            value: new Uint8Array([6, 7]),
                        },
                    ],
                },
            };

            const result = LambdaStorageUpdate._fromProtobuf(proto);

            expect(result).to.be.instanceOf(LambdaMappingEntries);
            expect(result.mappingSlot).to.deep.equal(new Uint8Array([1, 2, 3]));
            expect(result.entries).to.have.lengthOf(1);
        });

        it("should throw error when neither storageSlot nor mappingEntries is present", function () {
            const proto = {};

            expect(() => LambdaStorageUpdate._fromProtobuf(proto)).to.throw(
                "LambdaStorageUpdate must have either storage_slot or mapping_entries set",
            );
        });

        it("should prioritize storageSlot when both are present", function () {
            const proto = {
                storageSlot: {
                    key: new Uint8Array([1, 2]),
                    value: new Uint8Array([3, 4]),
                },
                mappingEntries: {
                    mappingSlot: new Uint8Array([5, 6]),
                    entries: [],
                },
            };

            const result = LambdaStorageUpdate._fromProtobuf(proto);

            expect(result).to.be.instanceOf(LambdaStorageSlot);
        });
    });

    describe("_toProtobuf", function () {
        it("should throw error when called on base class", function () {
            const update = new LambdaStorageUpdate();

            expect(() => update._toProtobuf()).to.throw(
                "LambdaStorageUpdate._toProtobuf must be implemented by a subclass",
            );
        });
    });
});
