// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.TokenKeyValidation} HieroProto.proto.TokenKeyValidation
 */

/** Types of validation strategies for token keys. */
export default class TokenKeyValidation {
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
            case TokenKeyValidation.FullValidation:
                return "FULL_VALIDATION";
            case TokenKeyValidation.NoValidation:
                return "NO_VALIDATION";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {TokenKeyValidation}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return TokenKeyValidation.FullValidation;
            case 1:
                return TokenKeyValidation.NoValidation;
        }

        throw new Error(
            `(BUG) TokenKeyValidation.fromCode() does not handle code: ${code}`,
        );
    }

    /**
     * @returns {HieroProto.proto.TokenKeyValidation}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * Currently the default behaviour. It will perform all token key validations.
 */
TokenKeyValidation.FullValidation = new TokenKeyValidation(0);

/**
 * Perform no validations at all for all passed token keys.
 */
TokenKeyValidation.NoValidation = new TokenKeyValidation(1);
