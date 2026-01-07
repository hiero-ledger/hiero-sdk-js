// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import TokenId from "./TokenId.js";
import NftHookCall from "../hooks/NftHookCall.js";
import NftHookType from "../hooks/NftHookType.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITokenTransferList} HieroProto.proto.ITokenTransferList
 * @typedef {import("@hiero-ledger/proto").proto.IAccountAmount} HieroProto.proto.IAccountAmount
 * @typedef {import("@hiero-ledger/proto").proto.INftTransfer} HieroProto.proto.INftTransfer
 * @typedef {import("@hiero-ledger/proto").proto.IAccountID} HieroProto.proto.IAccountID
 * @typedef {import("@hiero-ledger/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * An account, and the amount that it sends or receives during a cryptocurrency tokentransfer.
 */
export default class TokenNftTransfer {
    /**
     * @internal
     * @param {object} props
     * @param {TokenId | string} props.tokenId
     * @param {AccountId | string} props.senderAccountId
     * @param {AccountId | string} props.receiverAccountId
     * @param {Long | number} props.serialNumber
     * @param {boolean} props.isApproved
     * @param {NftHookCall} [props.senderHookCall]
     * @param {NftHookCall} [props.receiverHookCall]
     */
    constructor(props) {
        /**
         * The Token ID that sends or receives cryptocurrency.
         */
        this.tokenId =
            props.tokenId instanceof TokenId
                ? props.tokenId
                : TokenId.fromString(props.tokenId);

        /**
         * The Account ID that sends or receives cryptocurrency.
         */
        this.senderAccountId =
            props.senderAccountId instanceof AccountId
                ? props.senderAccountId
                : AccountId.fromString(props.senderAccountId);

        /**
         * The Account ID that sends or receives cryptocurrency.
         */
        this.receiverAccountId =
            props.receiverAccountId instanceof AccountId
                ? props.receiverAccountId
                : AccountId.fromString(props.receiverAccountId);

        this.serialNumber = Long.fromValue(props.serialNumber);
        this.senderHookCall = props.senderHookCall;
        this.receiverHookCall = props.receiverHookCall;
        this.isApproved = props.isApproved;
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITokenTransferList[]} tokenTransfers
     * @returns {TokenNftTransfer[]}
     */
    static _fromProtobuf(tokenTransfers) {
        const transfers = [];

        for (const tokenTransfer of tokenTransfers) {
            const tokenId = TokenId._fromProtobuf(
                /** @type {HieroProto.proto.ITokenID} */ (tokenTransfer.token),
            );
            for (const transfer of tokenTransfer.nftTransfers != null
                ? tokenTransfer.nftTransfers
                : []) {
                // Determine sender hook type
                let senderHookCall;
                if (transfer.preTxSenderAllowanceHook != null) {
                    senderHookCall = NftHookCall._fromProtobufWithType(
                        transfer.preTxSenderAllowanceHook,
                        NftHookType.PRE_HOOK_SENDER,
                    );
                } else if (transfer.prePostTxSenderAllowanceHook != null) {
                    senderHookCall = NftHookCall._fromProtobufWithType(
                        transfer.prePostTxSenderAllowanceHook,
                        NftHookType.PRE_POST_HOOK_SENDER,
                    );
                }

                // Determine receiver hook type
                let receiverHookCall;
                if (transfer.preTxReceiverAllowanceHook != null) {
                    receiverHookCall = NftHookCall._fromProtobufWithType(
                        transfer.preTxReceiverAllowanceHook,
                        NftHookType.PRE_HOOK_RECEIVER,
                    );
                } else if (transfer.prePostTxReceiverAllowanceHook != null) {
                    receiverHookCall = NftHookCall._fromProtobufWithType(
                        transfer.prePostTxReceiverAllowanceHook,
                        NftHookType.PRE_POST_HOOK_RECEIVER,
                    );
                }

                transfers.push(
                    new TokenNftTransfer({
                        tokenId,
                        senderAccountId: AccountId._fromProtobuf(
                            /** @type {HieroProto.proto.IAccountID} */ (
                                transfer.senderAccountID
                            ),
                        ),
                        receiverAccountId: AccountId._fromProtobuf(
                            /** @type {HieroProto.proto.IAccountID} */ (
                                transfer.receiverAccountID
                            ),
                        ),
                        serialNumber:
                            transfer.serialNumber != null
                                ? transfer.serialNumber
                                : Long.ZERO,
                        isApproved: transfer.isApproval == true,
                        senderHookCall: senderHookCall,
                        receiverHookCall: receiverHookCall,
                    }),
                );
            }
        }

        return transfers;
    }

    /**
     * @internal
     * @returns {HieroProto.proto.INftTransfer}
     */
    _toProtobuf() {
        /** @type {HieroProto.proto.INftTransfer} */
        const result = {
            senderAccountID: this.senderAccountId._toProtobuf(),
            receiverAccountID: this.receiverAccountId._toProtobuf(),
            serialNumber: this.serialNumber,
            isApproval: this.isApproved,
        };

        // Handle sender hook
        if (this.senderHookCall != null) {
            switch (this.senderHookCall.type) {
                case NftHookType.PRE_HOOK_SENDER:
                    result.preTxSenderAllowanceHook =
                        this.senderHookCall._toProtobuf();
                    break;
                case NftHookType.PRE_POST_HOOK_SENDER:
                    result.prePostTxSenderAllowanceHook =
                        this.senderHookCall._toProtobuf();
                    break;
            }
        }

        // Handle receiver hook
        if (this.receiverHookCall != null) {
            switch (this.receiverHookCall.type) {
                case NftHookType.PRE_HOOK_RECEIVER:
                    result.preTxReceiverAllowanceHook =
                        this.receiverHookCall._toProtobuf();
                    break;
                case NftHookType.PRE_POST_HOOK_RECEIVER:
                    result.prePostTxReceiverAllowanceHook =
                        this.receiverHookCall._toProtobuf();
                    break;
            }
        }

        return result;
    }
}
