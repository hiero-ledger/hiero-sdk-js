// SPDX-License-Identifier: Apache-2.0

/**
 * @type {string[]}
 */
const byteToHex = [];

for (let n = 0; n <= 0xff; n += 1) {
    byteToHex.push(n.toString(16).padStart(2, "0"));
}

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export function encode(data) {
    let string = "";

    for (const byte of data) {
        string += byteToHex[byte];
    }

    return string;
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function decode(text) {
    const str = text.startsWith("0x") ? text.substring(2) : text;

    // Same checks as hex.js, so every platform rejects the same input.
    if (str.length % 2 !== 0) {
        throw new Error(
            "Invalid hex string: Must have an even number of characters.",
        );
    }

    if (/[^0-9a-fA-F]/.test(str)) {
        throw new Error(
            "Invalid hex string: Contains non-hexadecimal characters.",
        );
    }

    const result = str.match(/.{1,2}/gu);

    return new Uint8Array(
        (result == null ? [] : result).map((byte) => parseInt(byte, 16)),
    );
}

/**
 * Check if a string is a valid hexadecimal string
 * @param {string} text - The string to check
 * @returns {boolean} - True if the string is a valid hex string, false otherwise
 */
export function isHexString(text) {
    if (typeof text !== "string") {
        return false;
    }

    const str = text.startsWith("0x") ? text.substring(2) : text;

    // Check if the string is empty after removing 0x prefix
    if (str.length === 0) {
        return false;
    }

    // Check if the string has even length (hex pairs)
    if (str.length % 2 !== 0) {
        return false;
    }

    // Check if all characters are valid hex digits
    const hexRegex = /^[0-9a-fA-F]+$/;
    return hexRegex.test(str);
}
