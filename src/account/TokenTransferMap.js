// SPDX-License-Identifier: Apache-2.0

import TokenId from "../token/TokenId.js";
import AccountId from "../account/AccountId.js";
import TokenTransferAccountMap from "./TokenTransferAccountMap.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenTransferList} HieroProto.proto.ITokenTransferList
 * @typedef {import("@hashgraph/proto").proto.IAccountAmount} HieroProto.proto.IAccountAmount
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 */

/**
 * @augments {ObjectMap<TokenId, TokenTransferAccountMap>}
 */
export default class TokenTransferMap extends ObjectMap {
    constructor() {
        super((s) => TokenId.fromString(s));
    }

    /**
     * @internal
     * @param {TokenId} tokenId
     * @param {AccountId} accountId
     * @param {Long} amount
     */
    __set(tokenId, accountId, amount) {
        const token = tokenId.toString();

        let _map = this._map.get(token);
        if (_map == null) {
            _map = new TokenTransferAccountMap();
            this._map.set(token, _map);
            this.__map.set(tokenId, _map);
        }

        _map._set(accountId, amount);
    }

    /**
     * @param {HieroProto.proto.ITokenTransferList[]} transfers
     * @returns {TokenTransferMap}
     */
    static _fromProtobuf(transfers) {
        const tokenTransfersMap = new TokenTransferMap();

        for (const transfer of transfers) {
            const token = TokenId._fromProtobuf(
                /** @type {HieroProto.proto.ITokenID} */ (transfer.token),
            );

            for (const aa of transfer.transfers != null
                ? transfer.transfers
                : []) {
                const account = AccountId._fromProtobuf(
                    /** @type {HieroProto.proto.IAccountID} */ (aa.accountID),
                );

                tokenTransfersMap.__set(
                    token,
                    account,
                    /** @type {Long} */ (aa.amount),
                );
            }
        }

        return tokenTransfersMap;
    }

    /**
     * @returns {HieroProto.proto.ITokenTransferList[]}
     */
    _toProtobuf() {
        /** @type {HieroProto.proto.ITokenTransferList[]} */
        const tokenTransferList = [];

        for (const [tokenId, value] of this) {
            /** @type {HieroProto.proto.IAccountAmount[]} */
            const transfers = [];

            for (const [accountId, amount] of value) {
                transfers.push({
                    accountID: accountId._toProtobuf(),
                    amount: amount,
                });
            }

            tokenTransferList.push({
                token: tokenId._toProtobuf(),
                transfers: transfers,
            });
        }

        return tokenTransferList;
    }
}
