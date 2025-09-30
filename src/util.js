// SPDX-License-Identifier: Apache-2.0

import BigNumber from "bignumber.js";
import Long from "long";

/**
 * @typedef {import("./Hbar.js").default} Hbar
 */

/**
 * Utility Error Messages
 */
export const REQUIRE_NON_NULL_ERROR = "This value cannot be null | undefined.";
export const REQUIRE_STRING_ERROR = "This value must be a string.";
export const REQUIRE_UINT8ARRAY_ERROR = "This value must be a Uint8Array.";
export const REQUIRE_STRING_OR_UINT8ARRAY_ERROR =
    "This value must be a string or Uint8Array.";
export const REQUIRE_NUMBER_ERROR = "This value must be a Number.";
export const REQUIRE_BIGNUMBER_ERROR = "This value must be a BigNumber.";
export const REQUIRE_ARRAY_ERROR = "The provided variable must be an Array.";
export const REQUIRE_LONG_ERROR = "This value must be a Long.";

export const REQUIRE_TYPE_ERROR =
    "The provided variables are not matching types.";

export const FUNCTION_CONVERT_TO_BIGNUMBER_ERROR =
    "This value must be a String, Number, or BigNumber to be converted.";
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
    return variable != null;
}

/**
 * Takes any param and returns true if param variable and type are the same.
 *
 * @param {any | null | undefined} variable
 * @param {any | null | undefined} type
 * @returns {boolean}
 */
export function isType(variable, type) {
    return typeof variable == typeof type;
}

/**
 * Takes any param and returns true if param is not null and of type Uint8Array.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isUint8Array(variable) {
    return isNonNull(variable) && variable instanceof Uint8Array;
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

/**
 * Takes any param and returns true if param is not null and type string or Uint8Array.
 *
 * @param {any | null | undefined} variable
 * @returns {boolean}
 */
export function isStringOrUint8Array(variable) {
    return (
        isNonNull(variable) && (isString(variable) || isUint8Array(variable))
    );
}

/**
 * Takes an address as `Uint8Array` and returns whether or not this is a long-zero address
 *
 * @param {Uint8Array} address
 * @returns {boolean}
 */
export function isLongZeroAddress(address) {
    for (let i = 0; i < 12; i++) {
        if (address[i] != 0) {
            return false;
        }
    }
    return true;
}

/**
 * Takes any param and returns false if null or undefined.
 *
 * @template {Long | Hbar} T
 * @param {T} variable
 * @returns {T}
 */
export function requireNotNegative(variable) {
    if (variable.isNegative()) {
        throw new Error("negative value not allowed");
    }

    return variable;
}

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

/**
 * Takes any param and throws custom error if params are not same type.
 *
 * @param {any | null | undefined} variable
 * @param {any | null | undefined} type
 * @returns {object}
 */
export function requireType(variable, type) {
    if (!isType(variable, type)) {
        throw new Error(REQUIRE_TYPE_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return variable;
    }
}

/**
 * Takes any param and throws custom error if non BigNumber.
 *
 * @param {any | null | undefined} variable
 * @returns {BigNumber}
 */
export function requireBigNumber(variable) {
    if (!isBigNumber(requireNonNull(variable))) {
        throw new Error(REQUIRE_BIGNUMBER_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return /** @type {BigNumber} */ (variable);
    }
}

/**
 * Takes any param and throws custom error if non BigNumber.
 *
 * @param {any | null | undefined} variable
 * @returns {Long}
 */
export function requireLong(variable) {
    if (!isLong(requireNonNull(variable))) {
        throw new Error(REQUIRE_LONG_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return /** @type {Long} */ (variable);
    }
}

/**
 * Takes any param and throws custom error if non string.
 *
 * @param {any | null | undefined} variable
 * @returns {string}
 */
export function requireString(variable) {
    if (!isString(requireNonNull(variable))) {
        throw new Error(REQUIRE_STRING_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return /** @type {string} */ (variable);
    }
}

/**
 * Takes any param and throws custom error if non Uint8Array.
 *
 * @param {any | null | undefined} variable
 * @returns {Uint8Array}
 */
export function requireUint8Array(variable) {
    if (!isUint8Array(requireNonNull(variable))) {
        throw new Error(REQUIRE_UINT8ARRAY_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return /** @type {Uint8Array} */ (variable);
    }
}

/**
 * Takes any param and throws custom error if non Uint8Array.
 *
 * @param {any | null | undefined} variable
 * @returns {number}
 */
export function requireNumber(variable) {
    if (!isNumber(requireNonNull(variable))) {
        throw new Error(REQUIRE_NUMBER_ERROR);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return /** @type {number} */ (variable);
    }
}

/**
 * Takes any param and throws custom error if null or undefined and not a string or Uint8Array.
 *
 * @param {any | null | undefined} variable
 * @returns {string | Uint8Array}
 */
export function requireStringOrUint8Array(variable) {
    if (isStringOrUint8Array(requireNonNull(variable))) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return /** @type {string | Uint8Array} */ (variable);
    } else {
        throw new Error(REQUIRE_STRING_OR_UINT8ARRAY_ERROR);
    }
}

//Conversions

/**
 * Converts number or string to BigNumber.
 *
 * @param {any | null | undefined} variable
 * @returns {BigNumber}
 */
export function convertToBigNumber(variable) {
    requireNonNull(variable);
    if (
        isBigNumber(variable) ||
        isString(variable) ||
        isNumber(variable) ||
        isLong(variable)
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new BigNumber(variable);
    }
    throw new Error(FUNCTION_CONVERT_TO_BIGNUMBER_ERROR);
}

/**
 * Converts amount (number, Long, BigNumber, or bigint) to Long.
 * This utility ensures consistent amount handling across the SDK.
 *
 * @param {number | Long | BigNumber | bigint} amount
 * @returns {Long}
 */
export function convertAmountToLong(amount) {
    requireNonNull(amount);

    // Preserve exact original behavior for existing types
    if (Long.isLong(amount)) {
        return amount;
    } else if (typeof amount === "number") {
        return Long.fromNumber(amount);
    } else if (BigNumber.isBigNumber(amount)) {
        return Long.fromValue(
            amount.integerValue(BigNumber.ROUND_DOWN).toString(),
        );
    } else if (typeof amount === "bigint") {
        return Long.fromValue(amount.toString());
    } else {
        // Handle other types that can be converted to string
        return Long.fromValue(String(amount));
    }
}
/**
 * Converts Array of Numbers or Strings to Array of BigNumbers.
 *
 * @param {any | null | undefined} variable
 * @returns {Array<BigNumber>}
 */
export function convertToBigNumberArray(variable) {
    if (variable instanceof Array) {
        return /** @type {Array<BigNumber>} */ (
            variable.map(convertToBigNumber)
        );
    } else {
        throw new Error(REQUIRE_ARRAY_ERROR);
    }
}

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
 * @param {Uint8Array | Int8Array} arr
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
        Math.min(length, arr.byteLength - offset),
    );
}

/**
 * @param {any} a
 * @param {any} b
 * @param {Set<string>=} ignore
 * @returns {boolean}
 */
export function compare(a, b, ignore = new Set()) {
    if (typeof a === "object" && typeof b === "object") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const aKeys = Object.keys(a);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const bKeys = Object.keys(b);

        if (aKeys.length !== bKeys.length) {
            return false;
        }

        for (let i = 0; i < aKeys.length; i++) {
            if (aKeys[i] !== bKeys[i]) {
                return false;
            }

            if (ignore.has(aKeys[i])) {
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!compare(a[aKeys[i]], b[bKeys[i]], ignore)) {
                return false;
            }
        }

        return true;
    } else if (typeof a === "number" && typeof b === "number") {
        return a === b;
    } else if (typeof a === "string" && typeof b === "string") {
        return a === b;
    } else if (typeof a === "boolean" && typeof b === "boolean") {
        return a === b;
    } else {
        return false;
    }
}

/**
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * @template T
 * @param {Array<T>} array
 */
export function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}

/**
 * @param {Uint8Array} array1
 * @param {Uint8Array} array2
 * @returns {boolean}
 */
export function arrayEqual(array1, array2) {
    if (array1 === array2) {
        return true;
    }

    if (array1.byteLength !== array2.byteLength) {
        return false;
    }

    const view1 = new DataView(
        array1.buffer,
        array1.byteOffset,
        array1.byteLength,
    );
    const view2 = new DataView(
        array2.buffer,
        array2.byteOffset,
        array2.byteLength,
    );

    let i = array1.byteLength;

    while (i--) {
        if (view1.getUint8(i) !== view2.getUint8(i)) {
            return false;
        }
    }

    return true;
}

/**
 * @description Function that delays an execution for a given time (in milliseconds)
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a SCREAMING_SNAKE_CASE string to PascalCase
 * @param {string} name - The string to convert
 * @returns {string} The converted PascalCase string
 */
export function screamingSnakeToPascalCase(name) {
    const words = name.toLowerCase().split("_");
    let result = "";
    for (let i = 0; i < words.length; i++) {
        result += words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    return result;
}
