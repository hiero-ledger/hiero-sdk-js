// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import TokenId from "./TokenId.js";
import { convertAmountToLong } from "../util.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenTransferList} HieroProto.proto.ITokenTransferList
 * @typedef {import("@hashgraph/proto").proto.IAccountAmount} HieroProto.proto.IAccountAmount
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
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
        return {
            accountID: this.accountId._toProtobuf(),
            amount: this.amount,
            isApproval: this.isApproved,
        };
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
