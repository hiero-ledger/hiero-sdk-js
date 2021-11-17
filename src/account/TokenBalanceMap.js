import TokenId from "../token/TokenId.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITokenBalance} proto.ITokenBalance
 * @typedef {import("@exodus/hashgraph-proto").ITokenID} proto.ITokenID
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
