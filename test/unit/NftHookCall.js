import Long from "long";
import NftHookCall from "../../src/hooks/NftHookCall.js";
import NftHookType from "../../src/hooks/NftHookType.js";
import EvmHookCall from "../../src/hooks/EvmHookCall.js";

describe("NftHookCall", function () {
    describe("constructor", function () {
        it("should throw when type is missing", function () {
            expect(function () {
                new NftHookCall({});
            }).to.throw("type cannot be null");
        });

        it("should throw when type is null", function () {
            expect(function () {
                new NftHookCall({ type: null });
            }).to.throw("type cannot be null");
        });

        it("should create an instance with PRE_HOOK_SENDER type", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_HOOK_SENDER,
            });

            expect(hookCall.type).to.equal(NftHookType.PRE_HOOK_SENDER);
            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance with PRE_POST_HOOK_SENDER type", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_POST_HOOK_SENDER,
            });

            expect(hookCall.type).to.equal(NftHookType.PRE_POST_HOOK_SENDER);
        });

        it("should create an instance with PRE_HOOK_RECEIVER type", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_HOOK_RECEIVER,
            });

            expect(hookCall.type).to.equal(NftHookType.PRE_HOOK_RECEIVER);
        });

        it("should create an instance with PRE_POST_HOOK_RECEIVER type", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_POST_HOOK_RECEIVER,
            });

            expect(hookCall.type).to.equal(NftHookType.PRE_POST_HOOK_RECEIVER);
        });

        it("should create an instance with all props set", function () {
            const hookId = Long.fromNumber(1);
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(1, 2, 3),
                gasLimit: Long.fromNumber(100000),
            });

            const hookCall = new NftHookCall({
                hookId,
                evmHookCall,
                type: NftHookType.PRE_HOOK_SENDER,
            });

            expect(hookCall.type).to.equal(NftHookType.PRE_HOOK_SENDER);
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.equal(evmHookCall);
        });
    });

    describe("type getter", function () {
        it("should return PRE_HOOK_SENDER (0)", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_HOOK_SENDER,
            });

            expect(hookCall.type).to.equal(0);
        });

        it("should return PRE_POST_HOOK_SENDER (1)", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_POST_HOOK_SENDER,
            });

            expect(hookCall.type).to.equal(1);
        });

        it("should return PRE_HOOK_RECEIVER (2)", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_HOOK_RECEIVER,
            });

            expect(hookCall.type).to.equal(2);
        });

        it("should return PRE_POST_HOOK_RECEIVER (3)", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_POST_HOOK_RECEIVER,
            });

            expect(hookCall.type).to.equal(3);
        });
    });

    describe("inherited setters", function () {
        it("setHookId should set hookId and return this", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_HOOK_SENDER,
            });
            const hookId = Long.fromNumber(5);

            const result = hookCall.setHookId(hookId);

            expect(result).to.equal(hookCall);
            expect(hookCall.hookId).to.equal(hookId);
        });

        it("setCall should set evmHookCall and return this", function () {
            const hookCall = new NftHookCall({
                type: NftHookType.PRE_HOOK_SENDER,
            });
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(4, 5, 6),
                gasLimit: Long.fromNumber(50000),
            });

            const result = hookCall.setCall(evmHookCall);

            expect(result).to.equal(hookCall);
            expect(hookCall.evmHookCall).to.equal(evmHookCall);
        });
    });

    describe("_fromProtobufWithType", function () {
        it("should create an instance with PRE_HOOK_SENDER from protobuf with evmHookCall", function () {
            const hookId = Long.fromNumber(10);
            const evmProto = {
                data: Uint8Array.of(7, 8, 9),
                gasLimit: Long.fromNumber(200000),
            };
            const proto = { hookId, evmHookCall: evmProto };

            const hookCall = NftHookCall._fromProtobufWithType(
                proto,
                NftHookType.PRE_HOOK_SENDER,
            );

            expect(hookCall).to.be.instanceOf(NftHookCall);
            expect(hookCall.type).to.equal(NftHookType.PRE_HOOK_SENDER);
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.instanceOf(EvmHookCall);
            expect(hookCall.evmHookCall.data).to.equal(evmProto.data);
        });

        it("should create an instance with PRE_POST_HOOK_SENDER from protobuf without evmHookCall", function () {
            const hookId = Long.fromNumber(2);
            const proto = { hookId };

            const hookCall = NftHookCall._fromProtobufWithType(
                proto,
                NftHookType.PRE_POST_HOOK_SENDER,
            );

            expect(hookCall.type).to.equal(NftHookType.PRE_POST_HOOK_SENDER);
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance with PRE_HOOK_RECEIVER from protobuf", function () {
            const proto = { hookId: Long.fromNumber(3) };

            const hookCall = NftHookCall._fromProtobufWithType(
                proto,
                NftHookType.PRE_HOOK_RECEIVER,
            );

            expect(hookCall.type).to.equal(NftHookType.PRE_HOOK_RECEIVER);
        });

        it("should create an instance with PRE_POST_HOOK_RECEIVER from protobuf", function () {
            const proto = { hookId: Long.fromNumber(4) };

            const hookCall = NftHookCall._fromProtobufWithType(
                proto,
                NftHookType.PRE_POST_HOOK_RECEIVER,
            );

            expect(hookCall.type).to.equal(NftHookType.PRE_POST_HOOK_RECEIVER);
        });

        it("should create an instance from an empty protobuf", function () {
            const hookCall = NftHookCall._fromProtobufWithType(
                {},
                NftHookType.PRE_HOOK_SENDER,
            );

            expect(hookCall.type).to.equal(NftHookType.PRE_HOOK_SENDER);
            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance from protobuf when hookId is null", function () {
            const proto = { hookId: null };

            const hookCall = NftHookCall._fromProtobufWithType(
                proto,
                NftHookType.PRE_HOOK_SENDER,
            );

            expect(hookCall.hookId).to.be.undefined;
        });
    });
});
