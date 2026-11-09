import {
    AccountId,
    EvmHookCall,
    NftHookCall,
    NftHookType,
    TokenId,
} from "../../src/index.js";
import TokenNftTransfer from "../../src/token/TokenNftTransfer.js";
import Long from "long";

describe("TokenNftTransfer", function () {
    let tokenId;
    let senderAccountId;
    let receiverAccountId;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 123);
        senderAccountId = new AccountId(0, 0, 456);
        receiverAccountId = new AccountId(0, 0, 789);
    });

    function hookProtobuf(hookId) {
        return {
            hookId: Long.fromNumber(hookId),
            evmHookCall: {
                data: Uint8Array.of(1, 2, 3),
                gasLimit: Long.fromNumber(100),
            },
        };
    }

    function hookCall(type, hookId) {
        return new NftHookCall({
            hookId: Long.fromNumber(hookId),
            evmHookCall: new EvmHookCall({
                data: Uint8Array.of(1, 2, 3),
                gasLimit: Long.fromNumber(100),
            }),
            type,
        });
    }

    function transferProtobuf(extra = {}) {
        return {
            token: tokenId._toProtobuf(),
            nftTransfers: [
                {
                    senderAccountID: senderAccountId._toProtobuf(),
                    receiverAccountID: receiverAccountId._toProtobuf(),
                    serialNumber: Long.fromNumber(1),
                    isApproval: false,
                    ...extra,
                },
            ],
        };
    }

    describe("constructor", function () {
        it("should keep the given instances", function () {
            const transfer = new TokenNftTransfer({
                tokenId,
                senderAccountId,
                receiverAccountId,
                serialNumber: Long.fromNumber(1),
                isApproved: true,
            });

            expect(transfer.tokenId).to.equal(tokenId);
            expect(transfer.senderAccountId).to.equal(senderAccountId);
            expect(transfer.receiverAccountId).to.equal(receiverAccountId);
            expect(transfer.serialNumber.toNumber()).to.equal(1);
            expect(transfer.isApproved).to.be.true;
            expect(transfer.senderHookCall).to.be.undefined;
            expect(transfer.receiverHookCall).to.be.undefined;
        });

        it("should accept strings and numbers", function () {
            const transfer = new TokenNftTransfer({
                tokenId: "0.0.123",
                senderAccountId: "0.0.456",
                receiverAccountId: "0.0.789",
                serialNumber: 2,
                isApproved: false,
            });

            expect(transfer.tokenId.toString()).to.equal("0.0.123");
            expect(transfer.senderAccountId.toString()).to.equal("0.0.456");
            expect(transfer.receiverAccountId.toString()).to.equal("0.0.789");
            expect(transfer.serialNumber.toNumber()).to.equal(2);
            expect(transfer.isApproved).to.be.false;
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode a plain transfer", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                transferProtobuf(),
            ]);

            expect(transfer).to.be.instanceOf(TokenNftTransfer);
            expect(transfer.tokenId.toString()).to.equal("0.0.123");
            expect(transfer.senderAccountId.toString()).to.equal("0.0.456");
            expect(transfer.receiverAccountId.toString()).to.equal("0.0.789");
            expect(transfer.serialNumber.toNumber()).to.equal(1);
            expect(transfer.isApproved).to.be.false;
            expect(transfer.senderHookCall).to.be.undefined;
            expect(transfer.receiverHookCall).to.be.undefined;
        });

        it("should decode isApproval true", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                transferProtobuf({ isApproval: true }),
            ]);

            expect(transfer.isApproved).to.be.true;
        });

        it("should default the serial number to zero", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                {
                    token: tokenId._toProtobuf(),
                    nftTransfers: [
                        {
                            senderAccountID: senderAccountId._toProtobuf(),
                            receiverAccountID: receiverAccountId._toProtobuf(),
                        },
                    ],
                },
            ]);

            expect(transfer.serialNumber.toNumber()).to.equal(0);
            expect(transfer.isApproved).to.be.false;
        });

        it("should return an empty list when there are no transfers", function () {
            expect(TokenNftTransfer._fromProtobuf([])).to.deep.equal([]);
        });

        it("should decode a pre hook sender", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                transferProtobuf({
                    preTxSenderAllowanceHook: hookProtobuf(1),
                }),
            ]);

            expect(transfer.senderHookCall.type).to.equal(
                NftHookType.PRE_HOOK_SENDER,
            );
            expect(transfer.senderHookCall.hookId.toNumber()).to.equal(1);
            expect(transfer.receiverHookCall).to.be.undefined;
        });

        it("should decode a pre/post hook sender", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                transferProtobuf({
                    prePostTxSenderAllowanceHook: hookProtobuf(2),
                }),
            ]);

            expect(transfer.senderHookCall.type).to.equal(
                NftHookType.PRE_POST_HOOK_SENDER,
            );
            expect(transfer.senderHookCall.hookId.toNumber()).to.equal(2);
        });

        it("should decode a pre hook receiver", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                transferProtobuf({
                    preTxReceiverAllowanceHook: hookProtobuf(3),
                }),
            ]);

            expect(transfer.receiverHookCall.type).to.equal(
                NftHookType.PRE_HOOK_RECEIVER,
            );
            expect(transfer.receiverHookCall.hookId.toNumber()).to.equal(3);
            expect(transfer.senderHookCall).to.be.undefined;
        });

        it("should decode a pre/post hook receiver", function () {
            const [transfer] = TokenNftTransfer._fromProtobuf([
                transferProtobuf({
                    prePostTxReceiverAllowanceHook: hookProtobuf(4),
                }),
            ]);

            expect(transfer.receiverHookCall.type).to.equal(
                NftHookType.PRE_POST_HOOK_RECEIVER,
            );
            expect(transfer.receiverHookCall.hookId.toNumber()).to.equal(4);
        });
    });

    describe("_toProtobuf", function () {
        it("should encode a plain transfer", function () {
            const transfer = new TokenNftTransfer({
                tokenId,
                senderAccountId,
                receiverAccountId,
                serialNumber: 1,
                isApproved: true,
            });

            expect(transfer._toProtobuf()).to.deep.equal({
                senderAccountID: senderAccountId._toProtobuf(),
                receiverAccountID: receiverAccountId._toProtobuf(),
                serialNumber: Long.fromNumber(1),
                isApproval: true,
            });
        });

        it("should encode a pre hook sender", function () {
            const senderHookCall = hookCall(NftHookType.PRE_HOOK_SENDER, 1);
            const transfer = new TokenNftTransfer({
                tokenId,
                senderAccountId,
                receiverAccountId,
                serialNumber: 1,
                isApproved: false,
                senderHookCall,
            });

            const result = transfer._toProtobuf();

            expect(result.preTxSenderAllowanceHook).to.deep.equal(
                senderHookCall._toProtobuf(),
            );
            expect(result.prePostTxSenderAllowanceHook).to.be.undefined;
            expect(result.preTxReceiverAllowanceHook).to.be.undefined;
            expect(result.prePostTxReceiverAllowanceHook).to.be.undefined;
        });

        it("should encode a pre/post hook sender", function () {
            const senderHookCall = hookCall(
                NftHookType.PRE_POST_HOOK_SENDER,
                2,
            );
            const transfer = new TokenNftTransfer({
                tokenId,
                senderAccountId,
                receiverAccountId,
                serialNumber: 1,
                isApproved: false,
                senderHookCall,
            });

            const result = transfer._toProtobuf();

            expect(result.prePostTxSenderAllowanceHook).to.deep.equal(
                senderHookCall._toProtobuf(),
            );
            expect(result.preTxSenderAllowanceHook).to.be.undefined;
        });

        it("should encode a pre hook receiver", function () {
            const receiverHookCall = hookCall(NftHookType.PRE_HOOK_RECEIVER, 3);
            const transfer = new TokenNftTransfer({
                tokenId,
                senderAccountId,
                receiverAccountId,
                serialNumber: 1,
                isApproved: false,
                receiverHookCall,
            });

            const result = transfer._toProtobuf();

            expect(result.preTxReceiverAllowanceHook).to.deep.equal(
                receiverHookCall._toProtobuf(),
            );
            expect(result.prePostTxReceiverAllowanceHook).to.be.undefined;
            expect(result.preTxSenderAllowanceHook).to.be.undefined;
            expect(result.prePostTxSenderAllowanceHook).to.be.undefined;
        });

        it("should encode a pre/post hook receiver", function () {
            const receiverHookCall = hookCall(
                NftHookType.PRE_POST_HOOK_RECEIVER,
                4,
            );
            const transfer = new TokenNftTransfer({
                tokenId,
                senderAccountId,
                receiverAccountId,
                serialNumber: 1,
                isApproved: false,
                receiverHookCall,
            });

            const result = transfer._toProtobuf();

            expect(result.prePostTxReceiverAllowanceHook).to.deep.equal(
                receiverHookCall._toProtobuf(),
            );
            expect(result.preTxReceiverAllowanceHook).to.be.undefined;
        });
    });
});
