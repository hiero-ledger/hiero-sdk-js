// SPDX-License-Identifier: Apache-2.0

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export function encode(data) {
    return Buffer.from(data).toString("hex");
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function decode(text) {
    const str = text.startsWith("0x") ? text.substring(2) : text;

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

    const bytes = new Uint8Array(str.length / 2);

    for (let i = 0; i < str.length; i += 2) {
        const byte = parseInt(str.substring(i, i + 2), 16);
        bytes[i / 2] = byte;
    }

    return Buffer.from(str, "hex");
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

/**
 * Encode with a specified length. Supports zero padding if the most significant byte is 0
 *
 * https://github.com/ethers-io/ethers.js/blob/master/packages/bytes/src.ts/index.ts#L315
 *
 * @param {Uint8Array} value
 * @param {number} length
 * @returns {string}
 */
export function hexZeroPadded(value, length) {
    const HexCharacters = "0123456789abcdef";

    // https://github.com/ethers-io/ethers.js/blob/master/packages/bytes/src.ts/index.ts#L243
    let result = "0x";
    for (let i = 0; i < value.length; i++) {
        let v = value[i];
        result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
    }

    // https://github.com/ethers-io/ethers.js/blob/master/packages/bytes/src.ts/index.ts#L315
    if (result.length > 2 * length + 2) {
        console.log("result out of range", "result");
    }

    while (result.length < 2 * length + 2) {
        result = "0x0" + result.substring(2);
    }

    return result.substring(2);
}
