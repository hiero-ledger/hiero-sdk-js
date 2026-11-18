import Long from "long";
import HookCall from "../../src/hooks/HookCall.js";
import EvmHookCall from "../../src/hooks/EvmHookCall.js";
import HookExtensionPoint from "../../src/hooks/HookExtensionPoint.js";

describe("HookExtensionPoint", function () {
    it("ACCOUNT_ALLOWANCE_HOOK should equal 0", function () {
        expect(HookExtensionPoint.ACCOUNT_ALLOWANCE_HOOK).to.equal(0);
    });
});

describe("HookCall", function () {
    describe("constructor", function () {
        it("should create an instance with no props leaving hookId and evmHookCall undefined", function () {
            const hookCall = new HookCall();

            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance with hookId", function () {
            const hookId = Long.fromNumber(42);
            const hookCall = new HookCall({ hookId });

            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance with evmHookCall", function () {
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(1, 2, 3),
                gasLimit: Long.fromNumber(100000),
            });
            const hookCall = new HookCall({ evmHookCall });

            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.equal(evmHookCall);
        });

        it("should create an instance with both hookId and evmHookCall", function () {
            const hookId = Long.fromNumber(7);
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(10, 20),
                gasLimit: Long.fromNumber(50000),
            });
            const hookCall = new HookCall({ hookId, evmHookCall });

            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.equal(evmHookCall);
        });
    });

    describe("setHookId", function () {
        it("should set the hookId and return this for chaining", function () {
            const hookCall = new HookCall();
            const hookId = Long.fromNumber(99);

            const result = hookCall.setHookId(hookId);

            expect(result).to.equal(hookCall);
            expect(hookCall.hookId).to.equal(hookId);
        });

        it("should overwrite an existing hookId", function () {
            const hookCall = new HookCall({ hookId: Long.fromNumber(1) });
            const newHookId = Long.fromNumber(2);

            hookCall.setHookId(newHookId);

            expect(hookCall.hookId).to.equal(newHookId);
        });
    });

    describe("setCall", function () {
        it("should set the evmHookCall and return this for chaining", function () {
            const hookCall = new HookCall();
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(5, 6, 7),
                gasLimit: Long.fromNumber(200000),
            });

            const result = hookCall.setCall(evmHookCall);

            expect(result).to.equal(hookCall);
            expect(hookCall.evmHookCall).to.equal(evmHookCall);
        });

        it("should overwrite an existing evmHookCall", function () {
            const first = new EvmHookCall({ data: Uint8Array.of(1) });
            const second = new EvmHookCall({ data: Uint8Array.of(2) });
            const hookCall = new HookCall({ evmHookCall: first });

            hookCall.setCall(second);

            expect(hookCall.evmHookCall).to.equal(second);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with hookId and evmHookCall", function () {
            const hookId = Long.fromNumber(10);
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(1, 2, 3),
                gasLimit: Long.fromNumber(100000),
            });
            const hookCall = new HookCall({ hookId, evmHookCall });

            const proto = hookCall._toProtobuf();

            expect(proto.hookId).to.equal(hookId);
            expect(proto.evmHookCall).to.deep.equal(evmHookCall._toProtobuf());
        });

        it("should convert to protobuf without evmHookCall", function () {
            const hookId = Long.fromNumber(5);
            const hookCall = new HookCall({ hookId });

            const proto = hookCall._toProtobuf();

            expect(proto.hookId).to.equal(hookId);
            expect(proto.evmHookCall).to.be.undefined;
        });

        it("should convert to protobuf when both fields are unset", function () {
            const hookCall = new HookCall();

            const proto = hookCall._toProtobuf();

            expect(proto.hookId).to.be.undefined;
            expect(proto.evmHookCall).to.be.undefined;
        });
    });

    describe("_fromProtobuf", function () {
        it("should create an instance from protobuf with hookId and evmHookCall", function () {
            const hookId = Long.fromNumber(20);
            const evmProto = {
                data: Uint8Array.of(9, 8, 7),
                gasLimit: Long.fromNumber(300000),
            };
            const proto = { hookId, evmHookCall: evmProto };

            const hookCall = HookCall._fromProtobuf(proto);

            expect(hookCall).to.be.instanceOf(HookCall);
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.instanceOf(EvmHookCall);
            expect(hookCall.evmHookCall.data).to.equal(evmProto.data);
            expect(hookCall.evmHookCall.gasLimit).to.equal(evmProto.gasLimit);
        });

        it("should create an instance from protobuf without evmHookCall", function () {
            const hookId = Long.fromNumber(3);
            const proto = { hookId };

            const hookCall = HookCall._fromProtobuf(proto);

            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance from protobuf without hookId", function () {
            const evmProto = { data: Uint8Array.of(1, 2), gasLimit: null };
            const proto = { evmHookCall: evmProto };

            const hookCall = HookCall._fromProtobuf(proto);

            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.instanceOf(EvmHookCall);
        });

        it("should create an instance from an empty protobuf", function () {
            const hookCall = HookCall._fromProtobuf({});

            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.undefined;
        });
    });

    describe("round-trip serialization", function () {
        it("should preserve hookId and evmHookCall through a round-trip", function () {
            const hookId = Long.fromNumber(55);
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(11, 22, 33),
                gasLimit: Long.fromNumber(12345),
            });
            const original = new HookCall({ hookId, evmHookCall });

            const restored = HookCall._fromProtobuf(original._toProtobuf());

            expect(restored.hookId.equals(original.hookId)).to.be.true;
            expect(restored.evmHookCall.data).to.deep.equal(
                original.evmHookCall.data,
            );
            expect(
                restored.evmHookCall.gasLimit.equals(
                    original.evmHookCall.gasLimit,
                ),
            ).to.be.true;
        });

        it("should handle an empty instance through a round-trip", function () {
            const original = new HookCall();

            const restored = HookCall._fromProtobuf(original._toProtobuf());

            expect(restored.hookId).to.be.undefined;
            expect(restored.evmHookCall).to.be.undefined;
        });
    });
});
