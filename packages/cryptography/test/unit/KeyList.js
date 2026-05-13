import PublicKey from "../../src/PublicKey.js";
import KeyList from "../../src/KeyList.js";

const key1 = PublicKey.fromString(
    "302a300506032b65700321008f41f9476ded1bfb887ef49b40b2a33c97c9a90324e79ce53465e15968bb4503",
);
const key2 = PublicKey.fromString(
    "302a300506032b6570032100bbb3991523f8145f1cf4b90c7b57bfa60f42d07547aaf979fddd69388d210f6c",
);
const key3 = PublicKey.fromString(
    "302a300506032b6570032100f169271fe46f43ba29a786c170359e71c69eb34354e90d0b8c1e2b4b317cc650",
);

describe("KeyList", function () {
    describe("constructor", function () {
        it("should create an empty KeyList when no arguments are given", function () {
            const list = new KeyList();
            expect(list.toArray()).to.be.an("array").that.is.empty;
            expect(list.threshold).to.be.null;
        });

        it("should create a KeyList from an array of keys", function () {
            const list = new KeyList([key1, key2]);
            expect(list.toArray()).to.have.lengthOf(2);
        });

        it("should set threshold when provided as second argument", function () {
            const list = new KeyList([key1, key2], 1);
            expect(list.threshold).to.equal(1);
        });
    });

    describe("KeyList.of()", function () {
        it("should create a KeyList from variadic key arguments", function () {
            const list = KeyList.of(key1, key2, key3);
            expect(list.toArray()).to.have.lengthOf(3);
            expect(list.threshold).to.be.null;
        });
    });

    describe("KeyList.from()", function () {
        it("should create a KeyList from an iterable", function () {
            const list = KeyList.from([key1, key2]);
            expect(list.toArray()).to.have.lengthOf(2);
        });

        it("should apply a mapping function when provided", function () {
            const list = KeyList.from([key1, key2], (k) => k);
            expect(list.toArray()).to.have.lengthOf(2);
        });
    });

    describe("setThreshold / threshold", function () {
        it("should update threshold via setThreshold", function () {
            const list = new KeyList([key1, key2]);
            list.setThreshold(2);
            expect(list.threshold).to.equal(2);
        });

        it("should default threshold to null", function () {
            const list = new KeyList([key1]);
            expect(list.threshold).to.be.null;
        });
    });

    describe("push", function () {
        it("should add a key to the list", function () {
            const list = new KeyList([key1]);
            list.push(key2);
            expect(list.toArray()).to.have.lengthOf(2);
        });
    });

    describe("slice", function () {
        it("should return a subarray without modifying the original", function () {
            const list = new KeyList([key1, key2, key3]);
            const sliced = list.slice(0, 2);
            expect(sliced.toArray()).to.have.lengthOf(2);
            expect(list.toArray()).to.have.lengthOf(3);
        });
    });

    describe("toArray", function () {
        it("should return a copy of the internal array", function () {
            const list = new KeyList([key1, key2]);
            const arr = list.toArray();
            arr.pop();
            expect(arr).to.have.lengthOf(1);
            expect(list.toArray()).to.have.lengthOf(2);
        });
    });

    describe("Symbol.iterator", function () {
        it("should support for...of iteration over all keys", function () {
            const list = KeyList.of(key1, key2, key3);
            const collected = [];
            for (const k of list) {
                collected.push(k);
            }
            expect(collected).to.have.lengthOf(3);
        });
    });

    describe("toString", function () {
        it("should serialize keys as comma-separated string with null threshold", function () {
            const list = KeyList.of(key1, key2, key3);
            const expected =
                '{"threshold":null,"keys":"302a300506032b65700321008f41f9476ded1bfb887ef49b40b2a33c97c9a90324e79ce53465e15968bb4503,302a300506032b6570032100bbb3991523f8145f1cf4b90c7b57bfa60f42d07547aaf979fddd69388d210f6c,302a300506032b6570032100f169271fe46f43ba29a786c170359e71c69eb34354e90d0b8c1e2b4b317cc650"}';
            expect(list.toString()).to.equal(expected);
        });

        it("should include threshold value when set", function () {
            const list = new KeyList([key1], 1);
            const parsed = JSON.parse(list.toString());
            expect(parsed.threshold).to.equal(1);
            expect(parsed.keys).to.equal(key1.toString());
        });
    });
});