// SPDX-License-Identifier: Apache-2.0

import TokenId from "../token/TokenId.js";
import TokenRelationship from "./TokenRelationship.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenRelationship} HieroProto.proto.ITokenRelationship
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("long")} Long
 */

/**
 * @augments {ObjectMap<TokenId, TokenRelationship>}
 */
export default class TokenRelationshipMap extends ObjectMap {
    constructor() {
        super((s) => TokenId.fromString(s));
    }

    /**
     * @param {HieroProto.proto.ITokenRelationship[]} relationships
     * @returns {TokenRelationshipMap}
     */
    static _fromProtobuf(relationships) {
        const tokenRelationships = new TokenRelationshipMap();

        for (const relationship of relationships) {
            const tokenId = TokenId._fromProtobuf(
                /** @type {HieroProto.proto.ITokenID} */ (relationship.tokenId),
            );

            tokenRelationships._set(
                tokenId,
                TokenRelationship._fromProtobuf(relationship),
            );
        }

        return tokenRelationships;
    }

    /**
     * @returns {HieroProto.proto.ITokenRelationship[]}
     */
    _toProtobuf() {
        const list = [];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, relationship] of this) {
            list.push(relationship._toProtobuf());
        }

        return list;
    }
}
