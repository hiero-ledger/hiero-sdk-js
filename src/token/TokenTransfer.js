// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import TokenId from "./TokenId.js";
import { convertAmountToLong } from "../util.js";
import FungibleHookCall from "../hooks/FungibleHookCall.js";
import FungibleHookType from "../hooks/FungibleHookType.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITokenTransferList} HieroProto.proto.ITokenTransferList
 * @typedef {import("@hiero-ledger/proto").proto.IAccountAmount} HieroProto.proto.IAccountAmount
 * @typedef {import("@hiero-ledger/proto").proto.IAccountID} HieroProto.proto.IAccountID
 * @typedef {import("@hiero-ledger/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * @typedef {object} TokenTransferJSON
 * @property {string} tokenId
 * @property {string} accountId
 * @property {?number} expectedDecimals
 * @property {string} amount
 * @property {boolean} isApproved
 */

/**
 * An account, and the amount that it sends or receives during a cryptocurrency tokentransfer.
 */
export default class TokenTransfer {
    /**
     * @internal
     * @param {object} props
     * @param {TokenId | string} props.tokenId
     * @param {AccountId | string} props.accountId
     * @param {number | null} props.expectedDecimals
     * @param {Long | number | BigNumber | bigint} props.amount
     * @param {boolean} props.isApproved
     * @param {FungibleHookCall} [props.hookCall]
     */
    constructor(props) {
        /**
         * The Token ID that sends or receives cryptocurrency.
         *
         * @readonly
         */
        this.tokenId =
            props.tokenId instanceof TokenId
                ? props.tokenId
                : TokenId.fromString(props.tokenId);

        /**
         * The Account ID that sends or receives cryptocurrency.
         *
         * @readonly
         */
        this.accountId =
            props.accountId instanceof AccountId
                ? props.accountId
                : AccountId.fromString(props.accountId);

        this.expectedDecimals = props.expectedDecimals;
        this.amount = convertAmountToLong(props.amount);
        this.isApproved = props.isApproved;
        this.hookCall = props.hookCall || null;
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITokenTransferList[]} tokenTransfers
     * @returns {TokenTransfer[]}
     */
    static _fromProtobuf(tokenTransfers) {
        const transfers = [];

        for (const tokenTransfer of tokenTransfers) {
            const tokenId = TokenId._fromProtobuf(
                /** @type {HieroProto.proto.ITokenID} */ (tokenTransfer.token),
            );
            const expectedDecimals =
                tokenTransfer.expectedDecimals != null
                    ? Object.hasOwn(tokenTransfer.expectedDecimals, "value")
                        ? tokenTransfer.expectedDecimals.value
                        : null
                    : null;

            for (const transfer of tokenTransfer.transfers != null
                ? tokenTransfer.transfers
                : []) {
                // Determine which hook type is present, if any
                let hookCall = null;
                if (transfer.preTxAllowanceHook != null) {
                    hookCall = FungibleHookCall._fromProtobufWithType(
                        transfer.preTxAllowanceHook,
                        FungibleHookType.PRE_TX_ALLOWANCE_HOOK,
                    );
                } else if (transfer.prePostTxAllowanceHook != null) {
                    hookCall = FungibleHookCall._fromProtobufWithType(
                        transfer.prePostTxAllowanceHook,
                        FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK,
                    );
                }

                transfers.push(
                    new TokenTransfer({
                        tokenId,
                        accountId: AccountId._fromProtobuf(
                            /** @type {HieroProto.proto.IAccountID} */ (
                                transfer.accountID
                            ),
                        ),
                        expectedDecimals: expectedDecimals || null,
                        amount:
                            transfer.amount != null
                                ? transfer.amount
                                : Long.ZERO,
                        isApproved: transfer.isApproval == true,
                        hookCall: hookCall ?? undefined,
                    }),
                );
            }
        }

        return transfers;
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IAccountAmount}
     */
    _toProtobuf() {
        /** @type {HieroProto.proto.IAccountAmount} */
        const result = {
            accountID: this.accountId._toProtobuf(),
            amount: this.amount,
            isApproval: this.isApproved,
        };

        if (this.hookCall != null) {
            switch (this.hookCall.type) {
                case FungibleHookType.PRE_TX_ALLOWANCE_HOOK:
                    result.preTxAllowanceHook = this.hookCall._toProtobuf();
                    break;
                case FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK:
                    result.prePostTxAllowanceHook = this.hookCall._toProtobuf();
                    break;
            }
        }

        return result;
    }

    /**
     * @returns {TokenTransferJSON}
     */
    toJSON() {
        return {
            tokenId: this.tokenId.toString(),
            accountId: this.accountId.toString(),
            expectedDecimals: this.expectedDecimals,
            amount: this.amount.toString(),
            isApproved: this.isApproved,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
