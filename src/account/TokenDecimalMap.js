import TokenId from "../token/TokenId.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITokenBalance} proto.ITokenBalance
 * @typedef {import("@exodus/hashgraph-proto").ITokenID} proto.ITokenID
 */

/**
 * @augments {ObjectMap<TokenId, number>}
 */
export default class TokenDecimalMap extends ObjectMap {
    constructor() {
        super((s) => TokenId.fromString(s));
    }
}
