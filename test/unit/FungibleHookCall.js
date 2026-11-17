import Long from "long";
import FungibleHookCall from "../../src/hooks/FungibleHookCall.js";
import FungibleHookType from "../../src/hooks/FungibleHookType.js";
import EvmHookCall from "../../src/hooks/EvmHookCall.js";

describe("FungibleHookCall", function () {
    describe("constructor", function () {
        it("should throw when type is missing", function () {
            expect(function () {
                new FungibleHookCall({});
            }).to.throw("type cannot be null");
        });

        it("should throw when type is null", function () {
            expect(function () {
                new FungibleHookCall({ type: null });
            }).to.throw("type cannot be null");
        });

        it("should create an instance with PRE_TX_ALLOWANCE_HOOK type", function () {
            const hookCall = new FungibleHookCall({
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            expect(hookCall.type).to.equal(
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );
            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance with PRE_POST_TX_ALLOWANCE_HOOK type", function () {
            const hookCall = new FungibleHookCall({
                type: FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            });

            expect(hookCall.type).to.equal(
                FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            );
        });

        it("should create an instance with all props set", function () {
            const hookId = Long.fromNumber(1);
            const evmHookCall = new EvmHookCall({
                data: Uint8Array.of(1, 2, 3),
                gasLimit: Long.fromNumber(100000),
            });

            const hookCall = new FungibleHookCall({
                hookId,
                evmHookCall,
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            expect(hookCall.type).to.equal(
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.equal(evmHookCall);
        });
    });

    describe("type getter", function () {
        it("should return PRE_TX_ALLOWANCE_HOOK", function () {
            const hookCall = new FungibleHookCall({
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });

            expect(hookCall.type).to.equal(0);
        });

        it("should return PRE_POST_TX_ALLOWANCE_HOOK", function () {
            const hookCall = new FungibleHookCall({
                type: FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            });

            expect(hookCall.type).to.equal(1);
        });
    });

    describe("inherited setters", function () {
        it("setHookId should set hookId and return this", function () {
            const hookCall = new FungibleHookCall({
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            });
            const hookId = Long.fromNumber(5);

            const result = hookCall.setHookId(hookId);

            expect(result).to.equal(hookCall);
            expect(hookCall.hookId).to.equal(hookId);
        });

        it("setCall should set evmHookCall and return this", function () {
            const hookCall = new FungibleHookCall({
                type: FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
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
        it("should create an instance with PRE_TX_ALLOWANCE_HOOK from protobuf with evmHookCall", function () {
            const hookId = Long.fromNumber(10);
            const evmProto = {
                data: Uint8Array.of(7, 8, 9),
                gasLimit: Long.fromNumber(200000),
            };
            const proto = { hookId, evmHookCall: evmProto };

            const hookCall = FungibleHookCall._fromProtobufWithType(
                proto,
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );

            expect(hookCall).to.be.instanceOf(FungibleHookCall);
            expect(hookCall.type).to.equal(
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.instanceOf(EvmHookCall);
            expect(hookCall.evmHookCall.data).to.equal(evmProto.data);
        });

        it("should create an instance with PRE_POST_TX_ALLOWANCE_HOOK from protobuf without evmHookCall", function () {
            const hookId = Long.fromNumber(2);
            const proto = { hookId };

            const hookCall = FungibleHookCall._fromProtobufWithType(
                proto,
                FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            );

            expect(hookCall.type).to.equal(
                FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            );
            expect(hookCall.hookId).to.equal(hookId);
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance from an empty protobuf", function () {
            const hookCall = FungibleHookCall._fromProtobufWithType(
                {},
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );

            expect(hookCall.type).to.equal(
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );
            expect(hookCall.hookId).to.be.undefined;
            expect(hookCall.evmHookCall).to.be.undefined;
        });

        it("should create an instance from protobuf when hookId is null", function () {
            const proto = { hookId: null };

            const hookCall = FungibleHookCall._fromProtobufWithType(
                proto,
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );

            expect(hookCall.hookId).to.be.undefined;
        });
    });
});
