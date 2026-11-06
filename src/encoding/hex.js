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
