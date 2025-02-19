// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.TokenSupplyType} HieroProto.proto.TokenSupplyType
 */

export default class TokenSupplyType {
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
            case TokenSupplyType.Infinite:
                return "INFINITE";
            case TokenSupplyType.Finite:
                return "FINITE";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {TokenSupplyType}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return TokenSupplyType.Infinite;
            case 1:
                return TokenSupplyType.Finite;
        }

        throw new Error(
            `(BUG) TokenSupplyType.fromCode() does not handle code: ${code}`,
        );
    }

    /**
     * @returns {HieroProto.proto.TokenSupplyType}
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
TokenSupplyType.Infinite = new TokenSupplyType(0);

/**
 * Unique, not interchangeable with other tokens of the same type as they
 * typically have different values. Individually traced and can carry unique
 * properties (e.g. serial number).
 */
TokenSupplyType.Finite = new TokenSupplyType(1);
