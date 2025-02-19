// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.TokenType} HieroProto.proto.TokenType
 */

export default class TokenType {
    /**
     * @hideconstructor
     * @internal
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case TokenType.FungibleCommon:
                return "FUNGIBLE_COMMON";
            case TokenType.NonFungibleUnique:
                return "NON_FUNGIBLE_UNIQUE";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {TokenType}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return TokenType.FungibleCommon;
            case 1:
                return TokenType.NonFungibleUnique;
        }

        throw new Error(
            `(BUG) TokenType.fromCode() does not handle code: ${code}`,
        );
    }

    /**
     * @returns {HieroProto.proto.TokenType}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * Interchangeable value with one another, where any quantity of them has the
 * same value as another equal quantity if they are in the same class. Share
 * a single set of properties, not distinct from one another. Simply represented
 * as a balance or quantity to a given Hedera account.
 */
TokenType.FungibleCommon = new TokenType(0);

/**
 * Unique, not interchangeable with other tokens of the same type as they
 * typically have different values. Individually traced and can carry unique
 * properties (e.g. serial number).
 */
TokenType.NonFungibleUnique = new TokenType(1);
