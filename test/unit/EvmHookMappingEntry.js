import EvmHookMappingEntry from "../../src/hooks/EvmHookMappingEntry.js";

describe("EvmHookMappingEntry", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const entry = new EvmHookMappingEntry();

            expect(entry.key).to.be.null;
            expect(entry.value).to.be.null;
            expect(entry.preimage).to.be.null;
        });

        it("should create an instance with provided key", function () {
            const key = new Uint8Array([1, 2, 3, 4]);
            const entry = new EvmHookMappingEntry({ key });

            expect(entry.key).to.equal(key);
            expect(entry.value).to.be.null;
            expect(entry.preimage).to.be.null;
        });

        it("should create an instance with provided value", function () {
            const value = new Uint8Array([5, 6, 7, 8]);
            const entry = new EvmHookMappingEntry({ value });

            expect(entry.key).to.be.null;
            expect(entry.value).to.equal(value);
            expect(entry.preimage).to.be.null;
        });

        it("should create an instance with provided preimage", function () {
            const preimage = new Uint8Array([9, 10, 11, 12]);
            const entry = new EvmHookMappingEntry({ preimage });

            expect(entry.key).to.be.null;
            expect(entry.value).to.be.null;
            expect(entry.preimage).to.equal(preimage);
        });

        it("should create an instance with key and value", function () {
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ key, value });

            expect(entry.key).to.equal(key);
            expect(entry.value).to.equal(value);
            expect(entry.preimage).to.be.null;
        });

        it("should prioritize preimage over key when both provided", function () {
            const key = new Uint8Array([1, 2, 3]);
            const preimage = new Uint8Array([7, 8, 9]);
            const entry = new EvmHookMappingEntry({ key, preimage });

            expect(entry.key).to.equal(key);
            expect(entry.preimage).to.be.null;
        });

        it("should handle empty Uint8Arrays", function () {
            const key = new Uint8Array([]);
            const value = new Uint8Array([]);
            const entry = new EvmHookMappingEntry({ key, value });

            expect(entry.key).to.equal(key);
            expect(entry.value).to.equal(value);
            expect(entry.key.length).to.equal(0);
            expect(entry.value.length).to.equal(0);
        });
    });

    describe("setKey", function () {
        it("should set key and return this for chaining", function () {
            const entry = new EvmHookMappingEntry();
            const key = new Uint8Array([1, 2, 3]);

            const result = entry.setKey(key);

            expect(result).to.equal(entry);
            expect(entry.key).to.equal(key);
        });

        it("should overwrite existing key", function () {
            const oldKey = new Uint8Array([1, 2, 3]);
            const newKey = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ key: oldKey });

            entry.setKey(newKey);

            expect(entry.key).to.equal(newKey);
        });

        it("should clear preimage when key is set", function () {
            const preimage = new Uint8Array([1, 2, 3]);
            const entry = new EvmHookMappingEntry({ preimage });
            const key = new Uint8Array([4, 5, 6]);

            expect(entry.preimage).to.equal(preimage);

            entry.setKey(key);

            expect(entry.key).to.equal(key);
            expect(entry.preimage).to.be.null;
        });

        it("should not affect value", function () {
            const value = new Uint8Array([1, 2, 3]);
            const entry = new EvmHookMappingEntry({ value });
            const key = new Uint8Array([4, 5, 6]);

            entry.setKey(key);

            expect(entry.value).to.equal(value);
        });
    });

    describe("setValue", function () {
        it("should set value and return this for chaining", function () {
            const entry = new EvmHookMappingEntry();
            const value = new Uint8Array([7, 8, 9]);

            const result = entry.setValue(value);

            expect(result).to.equal(entry);
            expect(entry.value).to.equal(value);
        });

        it("should overwrite existing value", function () {
            const oldValue = new Uint8Array([1, 2, 3]);
            const newValue = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ value: oldValue });

            entry.setValue(newValue);

            expect(entry.value).to.equal(newValue);
        });

        it("should not affect key or preimage", function () {
            const key = new Uint8Array([1, 2, 3]);
            const entry = new EvmHookMappingEntry({ key });
            const value = new Uint8Array([4, 5, 6]);

            entry.setValue(value);

            expect(entry.key).to.equal(key);
            expect(entry.value).to.equal(value);
        });
    });

    describe("setPreimage", function () {
        it("should set preimage and return this for chaining", function () {
            const entry = new EvmHookMappingEntry();
            const preimage = new Uint8Array([10, 11, 12]);

            const result = entry.setPreimage(preimage);

            expect(result).to.equal(entry);
            expect(entry.preimage).to.equal(preimage);
        });

        it("should overwrite existing preimage", function () {
            const oldPreimage = new Uint8Array([1, 2, 3]);
            const newPreimage = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ preimage: oldPreimage });

            entry.setPreimage(newPreimage);

            expect(entry.preimage).to.equal(newPreimage);
        });

        it("should clear key when preimage is set", function () {
            const key = new Uint8Array([1, 2, 3]);
            const entry = new EvmHookMappingEntry({ key });
            const preimage = new Uint8Array([4, 5, 6]);

            expect(entry.key).to.equal(key);

            entry.setPreimage(preimage);

            expect(entry.preimage).to.equal(preimage);
            expect(entry.key).to.be.null;
        });

        it("should not affect value", function () {
            const value = new Uint8Array([1, 2, 3]);
            const entry = new EvmHookMappingEntry({ value });
            const preimage = new Uint8Array([4, 5, 6]);

            entry.setPreimage(preimage);

            expect(entry.value).to.equal(value);
        });
    });

    describe("getters", function () {
        it("should get key using getter", function () {
            const key = new Uint8Array([1, 2, 3]);
            const entry = new EvmHookMappingEntry({ key });

            expect(entry.key).to.equal(key);
        });

        it("should get value using getter", function () {
            const value = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ value });

            expect(entry.value).to.equal(value);
        });

        it("should get preimage using getter", function () {
            const preimage = new Uint8Array([7, 8, 9]);
            const entry = new EvmHookMappingEntry({ preimage });

            expect(entry.preimage).to.equal(preimage);
        });

        it("should return null for unset values", function () {
            const entry = new EvmHookMappingEntry();

            expect(entry.key).to.be.null;
            expect(entry.value).to.be.null;
            expect(entry.preimage).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with key and value", function () {
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ key, value });

            const proto = entry._toProtobuf();

            expect(proto).to.be.an("object");
            expect(proto.key).to.equal(key);
            expect(proto.value).to.equal(value);
            expect(proto.preimage).to.be.null;
        });

        it("should convert to protobuf with preimage and value", function () {
            const preimage = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const entry = new EvmHookMappingEntry({ preimage, value });

            const proto = entry._toProtobuf();

            expect(proto.key).to.be.null;
            expect(proto.value).to.equal(value);
            expect(proto.preimage).to.equal(preimage);
        });

        it("should convert to protobuf with null values", function () {
            const entry = new EvmHookMappingEntry();

            const proto = entry._toProtobuf();

            expect(proto.key).to.be.null;
            expect(proto.value).to.be.null;
            expect(proto.preimage).to.be.null;
        });
    });

    describe("_fromProtobuf", function () {
        it("should create instance from protobuf with key and value", function () {
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const proto = { key, value };

            const entry = EvmHookMappingEntry._fromProtobuf(proto);

            expect(entry).to.be.instanceOf(EvmHookMappingEntry);
            expect(entry.key).to.equal(key);
            expect(entry.value).to.equal(value);
            expect(entry.preimage).to.be.null;
        });

        it("should create instance from protobuf with preimage", function () {
            const preimage = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);
            const proto = { preimage, value };

            const entry = EvmHookMappingEntry._fromProtobuf(proto);

            expect(entry).to.be.instanceOf(EvmHookMappingEntry);
            expect(entry.preimage).to.equal(preimage);
            expect(entry.value).to.equal(value);
        });

        it("should create instance from protobuf with null values", function () {
            const proto = {};

            const entry = EvmHookMappingEntry._fromProtobuf(proto);

            expect(entry).to.be.instanceOf(EvmHookMappingEntry);
            expect(entry.key).to.be.null;
            expect(entry.value).to.be.null;
            expect(entry.preimage).to.be.null;
        });

        it("should handle empty Uint8Arrays from protobuf", function () {
            const key = new Uint8Array([]);
            const value = new Uint8Array([]);
            const proto = { key, value };

            const entry = EvmHookMappingEntry._fromProtobuf(proto);

            expect(entry.key.length).to.equal(0);
            expect(entry.value.length).to.equal(0);
        });
    });

    describe("round-trip serialization", function () {
        it("should maintain data through protobuf round-trip with key", function () {
            const key = new Uint8Array([1, 2, 3, 4, 5]);
            const value = new Uint8Array([6, 7, 8, 9, 10]);
            const original = new EvmHookMappingEntry({ key, value });

            const proto = original._toProtobuf();
            const restored = EvmHookMappingEntry._fromProtobuf(proto);

            expect(Array.from(restored.key)).to.deep.equal(
                Array.from(original.key),
            );
            expect(Array.from(restored.value)).to.deep.equal(
                Array.from(original.value),
            );
            expect(restored.preimage).to.be.null;
        });

        it("should maintain data through protobuf round-trip with preimage", function () {
            const preimage = new Uint8Array([11, 12, 13]);
            const value = new Uint8Array([14, 15, 16]);
            const original = new EvmHookMappingEntry({ preimage, value });

            const proto = original._toProtobuf();
            const restored = EvmHookMappingEntry._fromProtobuf(proto);

            expect(restored.key).to.be.null;
            expect(Array.from(restored.value)).to.deep.equal(
                Array.from(original.value),
            );
            expect(Array.from(restored.preimage)).to.deep.equal(
                Array.from(original.preimage),
            );
        });

        it("should handle empty instance round-trip", function () {
            const original = new EvmHookMappingEntry();

            const proto = original._toProtobuf();
            const restored = EvmHookMappingEntry._fromProtobuf(proto);

            expect(restored.key).to.be.null;
            expect(restored.value).to.be.null;
            expect(restored.preimage).to.be.null;
        });
    });

    describe("method chaining", function () {
        it("should support chaining setKey and setValue", function () {
            const entry = new EvmHookMappingEntry();
            const key = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);

            const result = entry.setKey(key).setValue(value);

            expect(result).to.equal(entry);
            expect(entry.key).to.equal(key);
            expect(entry.value).to.equal(value);
        });

        it("should support chaining setPreimage and setValue", function () {
            const entry = new EvmHookMappingEntry();
            const preimage = new Uint8Array([1, 2, 3]);
            const value = new Uint8Array([4, 5, 6]);

            const result = entry.setPreimage(preimage).setValue(value);

            expect(result).to.equal(entry);
            expect(entry.preimage).to.equal(preimage);
            expect(entry.value).to.equal(value);
            expect(entry.key).to.be.null;
        });
    });

    describe("key/preimage mutual exclusivity", function () {
        it("should clear preimage when setting key", function () {
            const entry = new EvmHookMappingEntry();
            const preimage = new Uint8Array([1, 2, 3]);
            const key = new Uint8Array([4, 5, 6]);

            entry.setPreimage(preimage);
            expect(entry.preimage).to.equal(preimage);

            entry.setKey(key);
            expect(entry.key).to.equal(key);
            expect(entry.preimage).to.be.null;
        });

        it("should clear key when setting preimage", function () {
            const entry = new EvmHookMappingEntry();
            const key = new Uint8Array([1, 2, 3]);
            const preimage = new Uint8Array([4, 5, 6]);

            entry.setKey(key);
            expect(entry.key).to.equal(key);

            entry.setPreimage(preimage);
            expect(entry.preimage).to.equal(preimage);
            expect(entry.key).to.be.null;
        });

        it("should maintain value when alternating key/preimage", function () {
            const entry = new EvmHookMappingEntry();
            const value = new Uint8Array([99, 98, 97]);
            const key = new Uint8Array([1, 2, 3]);
            const preimage = new Uint8Array([4, 5, 6]);

            entry.setValue(value).setKey(key);
            expect(entry.value).to.equal(value);

            entry.setPreimage(preimage);
            expect(entry.value).to.equal(value);
        });
    });
});
