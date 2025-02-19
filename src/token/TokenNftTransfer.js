// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import AccountId from "../account/AccountId.js";
import TokenId from "./TokenId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenTransferList} HashgraphProto.proto.ITokenTransferList
 * @typedef {import("@hashgraph/proto").proto.IAccountAmount} HashgraphProto.proto.IAccountAmount
 * @typedef {import("@hashgraph/proto").proto.INftTransfer} HashgraphProto.proto.INftTransfer
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HashgraphProto.proto.IAccountID
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HashgraphProto.proto.ITokenID
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
        this.isApproved = props.isApproved;
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.ITokenTransferList[]} tokenTransfers
     * @returns {TokenNftTransfer[]}
     */
    static _fromProtobuf(tokenTransfers) {
        const transfers = [];

        for (const tokenTransfer of tokenTransfers) {
            const tokenId = TokenId._fromProtobuf(
                /** @type {HashgraphProto.proto.ITokenID} */ (
                    tokenTransfer.token
                ),
            );
            for (const transfer of tokenTransfer.nftTransfers != null
                ? tokenTransfer.nftTransfers
                : []) {
                transfers.push(
                    new TokenNftTransfer({
                        tokenId,
                        senderAccountId: AccountId._fromProtobuf(
                            /** @type {HashgraphProto.proto.IAccountID} */ (
                                transfer.senderAccountID
                            ),
                        ),
                        receiverAccountId: AccountId._fromProtobuf(
                            /** @type {HashgraphProto.proto.IAccountID} */ (
                                transfer.receiverAccountID
                            ),
                        ),
                        serialNumber:
                            transfer.serialNumber != null
                                ? transfer.serialNumber
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
     * @returns {HashgraphProto.proto.INftTransfer}
     */
    _toProtobuf() {
        return {
            senderAccountID: this.senderAccountId._toProtobuf(),
            receiverAccountID: this.receiverAccountId._toProtobuf(),
            serialNumber: this.serialNumber,
            isApproval: this.isApproved,
        };
    }
}
