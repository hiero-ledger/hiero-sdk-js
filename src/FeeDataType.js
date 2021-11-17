/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").SubType} proto.SubType
 */

export default class FeeDataType {
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
            case FeeDataType.Default:
                return "DEFAULT";
            case FeeDataType.TokenFungibleCommon:
                return "TOKEN_FUNGIBLE_COMMON";
            case FeeDataType.TokenNonFungibleUnique:
                return "TOKEN_NON_FUNGIBLE_UNIQUE";
            case FeeDataType.TokenFungibleCommonWithCustomFees:
                return "TOKEN_NON_FUNGIBLE_UNIQUE_WITH_CUSTOM_FEES";
            case FeeDataType.TokenNonFungibleUniqueWithCustomFees:
                return "TOKEN_NON_FUNGIBLE_UNIQUE_WITH_CUSTOM_FEES";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {FeeDataType}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return FeeDataType.Default;
            case 1:
                return FeeDataType.TokenFungibleCommon;
            case 2:
                return FeeDataType.TokenNonFungibleUnique;
            case 3:
                return FeeDataType.TokenFungibleCommonWithCustomFees;
            case 4:
                return FeeDataType.TokenNonFungibleUniqueWithCustomFees;
        }

        throw new Error(
            `(BUG) SubType.fromCode() does not handle code: ${code}`
        );
    }

    /**
     * @returns {proto.SubType}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * The resource prices have no special scope
 */
FeeDataType.Default = new FeeDataType(0);

/**
 * The resource prices are scoped to an operation on a fungible common token
 */
FeeDataType.TokenFungibleCommon = new FeeDataType(1);

/**
 * The resource prices are scoped to an operation on a non-fungible unique token
 */
FeeDataType.TokenNonFungibleUnique = new FeeDataType(2);

/**
 * The resource prices are scoped to an operation on a fungible common token with a custom fee schedule
 */
FeeDataType.TokenFungibleCommonWithCustomFees = new FeeDataType(3);

/**
 * The resource prices are scoped to an operation on a non-fungible unique token with a custom fee schedule
 */
FeeDataType.TokenNonFungibleUniqueWithCustomFees = new FeeDataType(4);
