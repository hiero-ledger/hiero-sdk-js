import Long from "long";
import EvmHookCall from "../../src/hooks/EvmHookCall.js";

describe("EvmHookCall", function () {
    describe("constructor", function () {
        it("should create an instance with default null values", function () {
            const evmHookCall = new EvmHookCall();

            expect(evmHookCall.data).to.be.null;
            expect(evmHookCall.gasLimit).to.be.null;
        });

        it("should create an instance with provided data", function () {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const evmHookCall = new EvmHookCall({ data });

            expect(evmHookCall.data).to.equal(data);
            expect(evmHookCall.gasLimit).to.be.null;
        });

        it("should create an instance with provided gasLimit", function () {
            const gasLimit = Long.fromNumber(100000);
            const evmHookCall = new EvmHookCall({ gasLimit });

            expect(evmHookCall.data).to.be.null;
            expect(evmHookCall.gasLimit).to.equal(gasLimit);
        });

        it("should create an instance with both data and gasLimit", function () {
            const data = new Uint8Array([1, 2, 3]);
            const gasLimit = Long.fromNumber(50000);
            const evmHookCall = new EvmHookCall({ data, gasLimit });

            expect(evmHookCall.data).to.equal(data);
            expect(evmHookCall.gasLimit).to.equal(gasLimit);
        });
    });

    describe("setData", function () {
        it("should set data and return this for chaining", function () {
            const evmHookCall = new EvmHookCall();
            const data = new Uint8Array([10, 20, 30]);

            const result = evmHookCall.setData(data);

            expect(result).to.equal(evmHookCall);
            expect(evmHookCall.data).to.equal(data);
        });

        it("should overwrite existing data", function () {
            const oldData = new Uint8Array([1, 2]);
            const newData = new Uint8Array([3, 4, 5]);
            const evmHookCall = new EvmHookCall({ data: oldData });

            evmHookCall.setData(newData);

            expect(evmHookCall.data).to.equal(newData);
        });
    });

    describe("setGasLimit", function () {
        it("should set gasLimit and return this for chaining", function () {
            const evmHookCall = new EvmHookCall();
            const gasLimit = Long.fromNumber(75000);

            const result = evmHookCall.setGasLimit(gasLimit);

            expect(result).to.equal(evmHookCall);
            expect(evmHookCall.gasLimit).to.equal(gasLimit);
        });

        it("should overwrite existing gasLimit", function () {
            const oldLimit = Long.fromNumber(10000);
            const newLimit = Long.fromNumber(20000);
            const evmHookCall = new EvmHookCall({ gasLimit: oldLimit });

            evmHookCall.setGasLimit(newLimit);

            expect(evmHookCall.gasLimit).to.equal(newLimit);
        });
    });

    describe("getters", function () {
        it("should get data using getter", function () {
            const data = new Uint8Array([5, 6, 7, 8]);
            const evmHookCall = new EvmHookCall({ data });

            expect(evmHookCall.data).to.equal(data);
        });

        it("should get gasLimit using getter", function () {
            const gasLimit = Long.fromNumber(99999);
            const evmHookCall = new EvmHookCall({ gasLimit });

            expect(evmHookCall.gasLimit).to.equal(gasLimit);
        });

        it("should return null for unset properties", function () {
            const evmHookCall = new EvmHookCall();

            expect(evmHookCall.data).to.be.null;
            expect(evmHookCall.gasLimit).to.be.null;
        });
    });

    describe("method chaining", function () {
        it("should support method chaining", function () {
            const data = new Uint8Array([1, 2, 3]);
            const gasLimit = Long.fromNumber(12345);

            const evmHookCall = new EvmHookCall()
                .setData(data)
                .setGasLimit(gasLimit);

            expect(evmHookCall.data).to.equal(data);
            expect(evmHookCall.gasLimit).to.equal(gasLimit);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create instance from protobuf with all fields", function () {
            const protoData = new Uint8Array([10, 20, 30]);
            const protoGasLimit = Long.fromNumber(55555);
            const proto = {
                data: protoData,
                gasLimit: protoGasLimit,
            };

            const evmHookCall = EvmHookCall._fromProtobuf(proto);

            expect(evmHookCall).to.be.instanceOf(EvmHookCall);
            expect(evmHookCall.data).to.equal(protoData);
            expect(evmHookCall.gasLimit).to.equal(protoGasLimit);
        });

        it("should create instance from protobuf with only data", function () {
            const protoData = new Uint8Array([1, 2]);
            const proto = { data: protoData };

            const evmHookCall = EvmHookCall._fromProtobuf(proto);

            expect(evmHookCall.data).to.equal(protoData);
            expect(evmHookCall.gasLimit).to.be.null;
        });

        it("should create instance from protobuf with only gasLimit", function () {
            const protoGasLimit = Long.fromNumber(88888);
            const proto = { gasLimit: protoGasLimit };

            const evmHookCall = EvmHookCall._fromProtobuf(proto);

            expect(evmHookCall.data).to.be.null;
            expect(evmHookCall.gasLimit).to.equal(protoGasLimit);
        });

        it("should create instance from empty protobuf", function () {
            const proto = {};

            const evmHookCall = EvmHookCall._fromProtobuf(proto);

            expect(evmHookCall.data).to.be.null;
            expect(evmHookCall.gasLimit).to.be.null;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const data = new Uint8Array([100, 200]);
            const gasLimit = Long.fromNumber(33333);
            const evmHookCall = new EvmHookCall({ data, gasLimit });

            const proto = evmHookCall._toProtobuf();

            expect(proto.data).to.equal(data);
            expect(proto.gasLimit).to.equal(gasLimit);
        });

        it("should convert to protobuf with null data", function () {
            const gasLimit = Long.fromNumber(44444);
            const evmHookCall = new EvmHookCall({ gasLimit });

            const proto = evmHookCall._toProtobuf();

            expect(proto.data).to.be.null;
            expect(proto.gasLimit).to.equal(gasLimit);
        });

        it("should convert to protobuf with null gasLimit", function () {
            const data = new Uint8Array([50, 60, 70]);
            const evmHookCall = new EvmHookCall({ data });

            const proto = evmHookCall._toProtobuf();

            expect(proto.data).to.equal(data);
            expect(proto.gasLimit).to.be.null;
        });

        it("should convert to protobuf with all null fields", function () {
            const evmHookCall = new EvmHookCall();

            const proto = evmHookCall._toProtobuf();

            expect(proto.data).to.be.null;
            expect(proto.gasLimit).to.be.null;
        });
    });

    describe("round-trip serialization", function () {
        it("should maintain data through protobuf round-trip", function () {
            const original = new EvmHookCall({
                data: new Uint8Array([11, 22, 33, 44]),
                gasLimit: Long.fromNumber(12345),
            });

            const proto = original._toProtobuf();
            const restored = EvmHookCall._fromProtobuf(proto);

            expect(restored.data).to.deep.equal(original.data);
            expect(restored.gasLimit.equals(original.gasLimit)).to.be.true;
        });

        it("should handle empty instance round-trip", function () {
            const original = new EvmHookCall();

            const proto = original._toProtobuf();
            const restored = EvmHookCall._fromProtobuf(proto);

            expect(restored.data).to.be.null;
            expect(restored.gasLimit).to.be.null;
        });
    });
});
