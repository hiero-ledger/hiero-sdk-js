import BigNumber from "bignumber.js";
import Long from "long";

/**
 * Utility Error Messages
 */
export const REQUIRE_NON_NULL_ERROR = "This value cannot be null | undefined.";

export const FUNCTION_CONVERT_TO_NUMBER_ERROR =
    "This value must be a String, Number, or BigNumber to be converted.";
export const FUNCTION_CONVERT_TO_NUMBER_PARSE_ERROR =
    "Unable to parse given variable. Returns NaN.";

//Soft Checks

/**
 * Takes any param and returns false if null or undefined.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isNonNull(variable) {
    if (variable == null || variable == undefined) {
        return false;
    } else {
        return true;
    }
}

/**
 * Takes any param and returns true if param is not null and of type Number.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isNumber(variable) {
    return (
        isNonNull(variable) &&
        (typeof variable == "number" || variable instanceof Number)
    );
}

/**
 * Takes any param and returns true if param is not null and of type BigNumber.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isBigNumber(variable) {
    return isNonNull(variable) && variable instanceof BigNumber;
}

/**
 * Takes any param and returns true if param is not null and of type BigNumber.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isLong(variable) {
    return isNonNull(variable) && variable instanceof Long;
}

/**
 * Takes any param and returns true if param is not null and of type string.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isString(variable) {
    return isNonNull(variable) && typeof variable == "string";
}

//Requires

/**
 * Takes any param and throws custom error if null or undefined.
 *
 * @param {any} variable
 * @returns {object}
 */
export function requireNonNull(variable) {
    if (!isNonNull(variable)) {
        throw new Error(REQUIRE_NON_NULL_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return variable;
    }
}


//Conversions

/**
 * @param {*} variable
 * @returns {number}
 */
export function convertToNumber(variable) {
    requireNonNull(variable);
    if (
        isBigNumber(variable) ||
        isString(variable) ||
        isNumber(variable) ||
        isLong(variable)
    ) {
        const num = parseInt(variable);
        if (isNaN(num)) {
            throw new Error(FUNCTION_CONVERT_TO_NUMBER_PARSE_ERROR);
        } else {
            return num;
        }
    } else {
        throw new Error(FUNCTION_CONVERT_TO_NUMBER_ERROR);
    }
}

/**
 * Creates a DataView on top of an Uint8Array that could be or not be pooled, ensuring that we don't get out of bounds.
 *
 * @param {Uint8Array} arr
 * @param {number | undefined} offset
 * @param {number | undefined} length
 * @returns {DataView}
 */
export function safeView(arr, offset = 0, length = arr.byteLength) {
    if (!(Number.isInteger(offset) && offset >= 0))
        throw new Error("Invalid offset!");
    if (!(Number.isInteger(length) && length >= 0))
        throw new Error("Invalid length!");
    return new DataView(
        arr.buffer,
        arr.byteOffset + offset,
        Math.min(length, arr.byteLength - offset)
    );
}
