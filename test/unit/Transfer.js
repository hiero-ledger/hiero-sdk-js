import {
    AccountId,
    Hbar,
    Transfer,
    FungibleHookCall,
    FungibleHookType,
    EvmHookCall,
} from "../../src/index.js";
import Long from "long";

describe("Transfer", function () {
    const sampleAccountId = new AccountId(3);
    const sampleAmount = new Hbar(10);

    function createHookCall(type) {
        return new FungibleHookCall({
            hookId: Long.fromNumber(5),
            evmHookCall: new EvmHookCall({
                data: new Uint8Array([1, 2, 3]),
                gasLimit: Long.fromNumber(1000),
            }),
            type,
        });
    }

    describe("constructor", function () {
        it("should accept AccountId instance and Hbar instance", function () {
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: true,
            });

            expect(transfer.accountId).to.equal(sampleAccountId);
            expect(transfer.amount).to.equal(sampleAmount);
            expect(transfer.isApproved).to.be.true;
            expect(transfer.hookCall).to.be.undefined;
        });

        it("should accept string account ID and number amount", function () {
            const transfer = new Transfer({
                accountId: "0.0.3",
                amount: 10,
                isApproved: false,
            });

            expect(transfer.accountId).to.be.instanceOf(AccountId);
            expect(transfer.accountId.toString()).to.equal("0.0.3");
            expect(transfer.amount).to.be.instanceOf(Hbar);
            expect(transfer.amount.toString()).to.equal("10 ℏ");
            expect(transfer.isApproved).to.be.false;
        });

        it("should store hookCall when provided", function () {
            const hook = createHookCall(FungibleHookType.PRE_TX_ALLOWANCE_HOOK);
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: false,
                hookCall: hook,
            });

            expect(transfer.hookCall).to.equal(hook);
        });
    });

    describe("_fromProtobuf", function () {
        it("should throw error if accountID is missing", function () {
            expect(() => {
                Transfer._fromProtobuf([
                    {
                        amount: Long.fromNumber(100),
                        isApproval: false,
                    },
                ]);
            }).to.throw("accountID is required");
        });

        it("should default amount to 0 when amount is null/undefined", function () {
            const transfers = Transfer._fromProtobuf([
                {
                    accountID: sampleAccountId._toProtobuf(),
                    amount: null,
                    isApproval: false,
                },
            ]);

            expect(transfers).to.have.lengthOf(1);
            expect(transfers[0].amount.toTinybars().toNumber()).to.equal(0);
        });

        it("should parse preTxAllowanceHook correctly", function () {
            const hook = createHookCall(FungibleHookType.PRE_TX_ALLOWANCE_HOOK);
            const proto = {
                accountID: sampleAccountId._toProtobuf(),
                amount: Long.fromNumber(500),
                isApproval: true,
                preTxAllowanceHook: hook._toProtobuf(),
            };

            const transfers = Transfer._fromProtobuf([proto]);
            expect(transfers).to.have.lengthOf(1);
            expect(transfers[0].hookCall).to.be.instanceOf(FungibleHookCall);
            expect(transfers[0].hookCall.type).to.equal(
                FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
            );
            expect(transfers[0].isApproved).to.be.true;
        });

        it("should parse prePostTxAllowanceHook correctly", function () {
            const hook = createHookCall(
                FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            );
            const proto = {
                accountID: sampleAccountId._toProtobuf(),
                amount: Long.fromNumber(500),
                isApproval: false,
                prePostTxAllowanceHook: hook._toProtobuf(),
            };

            const transfers = Transfer._fromProtobuf([proto]);
            expect(transfers).to.have.lengthOf(1);
            expect(transfers[0].hookCall).to.be.instanceOf(FungibleHookCall);
            expect(transfers[0].hookCall.type).to.equal(
                FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            );
        });

        it("should handle transfer without hook calls", function () {
            const proto = {
                accountID: sampleAccountId._toProtobuf(),
                amount: Long.fromNumber(200),
                isApproval: false,
            };

            const transfers = Transfer._fromProtobuf([proto]);
            expect(transfers).to.have.lengthOf(1);
            expect(transfers[0].hookCall).to.be.undefined;
        });
    });

    describe("_toProtobuf", function () {
        it("should serialize without hookCall", function () {
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: true,
            });

            const proto = transfer._toProtobuf();
            expect(proto.accountID).to.deep.equal(
                sampleAccountId._toProtobuf(),
            );
            expect(proto.amount.toString()).to.equal(
                sampleAmount.toTinybars().toString(),
            );
            expect(proto.isApproval).to.be.true;
            expect(proto.preTxAllowanceHook).to.be.undefined;
            expect(proto.prePostTxAllowanceHook).to.be.undefined;
        });

        it("should serialize with PRE_TX_ALLOWANCE_HOOK", function () {
            const hook = createHookCall(FungibleHookType.PRE_TX_ALLOWANCE_HOOK);
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: false,
                hookCall: hook,
            });

            const proto = transfer._toProtobuf();
            expect(proto.preTxAllowanceHook).to.deep.equal(hook._toProtobuf());
            expect(proto.prePostTxAllowanceHook).to.be.undefined;
        });

        it("should serialize with PRE_POST_TX_ALLOWANCE_HOOK", function () {
            const hook = createHookCall(
                FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
            );
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: false,
                hookCall: hook,
            });

            const proto = transfer._toProtobuf();
            expect(proto.prePostTxAllowanceHook).to.deep.equal(
                hook._toProtobuf(),
            );
            expect(proto.preTxAllowanceHook).to.be.undefined;
        });
    });

    describe("toJSON and toString", function () {
        it("should correctly format JSON representation", function () {
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: true,
            });

            const json = transfer.toJSON();
            expect(json).to.deep.equal({
                accountId: sampleAccountId.toString(),
                amount: sampleAmount.toTinybars().toString(),
                isApproved: true,
            });
        });

        it("should correctly stringify to JSON string", function () {
            const transfer = new Transfer({
                accountId: sampleAccountId,
                amount: sampleAmount,
                isApproved: false,
            });

            expect(transfer.toString()).to.equal(
                JSON.stringify(transfer.toJSON()),
            );
        });
    });
});
