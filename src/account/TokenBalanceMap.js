// SPDX-License-Identifier: Apache-2.0

import TokenId from "../token/TokenId.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITokenBalance} HieroProto.proto.ITokenBalance
 * @typedef {import("@hiero-ledger/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("long")} Long
 */

/**
 * @augments {ObjectMap<TokenId, Long>}
 */
export default class TokenBalanceMap extends ObjectMap {
    constructor() {
        super((s) => TokenId.fromString(s));
    }
}
