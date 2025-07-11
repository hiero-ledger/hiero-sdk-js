// SPDX-License-Identifier: Apache-2.0

/**
 * @type {string[]}
 */
const byteToHex = [];

/**
 * @type {string[]}
 */
const byteToHexByteString = [
    "\x00",
    "\x01",
    "\x02",
    "\x03",
    "\x04",
    "\x05",
    "\x06",
    "\x07",
    "\x08",
    "\x09",
    "\x0A",
    "\x0B",
    "\x0C",
    "\x0D",
    "\x0E",
    "\x0F",
    "\x10",
    "\x11",
    "\x12",
    "\x13",
    "\x14",
    "\x15",
    "\x16",
    "\x17",
    "\x18",
    "\x19",
    "\x1A",
    "\x1B",
    "\x1C",
    "\x1D",
    "\x1E",
    "\x1F",
    "\x20",
    "\x21",
    "\x22",
    "\x23",
    "\x24",
    "\x25",
    "\x26",
    "\x27",
    "\x28",
    "\x29",
    "\x2A",
    "\x2B",
    "\x2C",
    "\x2D",
    "\x2E",
    "\x2F",
    "\x30",
    "\x31",
    "\x32",
    "\x33",
    "\x34",
    "\x35",
    "\x36",
    "\x37",
    "\x38",
    "\x39",
    "\x3A",
    "\x3B",
    "\x3C",
    "\x3D",
    "\x3E",
    "\x3F",
    "\x40",
    "\x41",
    "\x42",
    "\x43",
    "\x44",
    "\x45",
    "\x46",
    "\x47",
    "\x48",
    "\x49",
    "\x4A",
    "\x4B",
    "\x4C",
    "\x4D",
    "\x4E",
    "\x4F",
    "\x50",
    "\x51",
    "\x52",
    "\x53",
    "\x54",
    "\x55",
    "\x56",
    "\x57",
    "\x58",
    "\x59",
    "\x5A",
    "\x5B",
    "\x5C",
    "\x5D",
    "\x5E",
    "\x5F",
    "\x60",
    "\x61",
    "\x62",
    "\x63",
    "\x64",
    "\x65",
    "\x66",
    "\x67",
    "\x68",
    "\x69",
    "\x6A",
    "\x6B",
    "\x6C",
    "\x6D",
    "\x6E",
    "\x6F",
    "\x70",
    "\x71",
    "\x72",
    "\x73",
    "\x74",
    "\x75",
    "\x76",
    "\x77",
    "\x78",
    "\x79",
    "\x7A",
    "\x7B",
    "\x7C",
    "\x7D",
    "\x7E",
    "\x7F",
    "\x80",
    "\x81",
    "\x82",
    "\x83",
    "\x84",
    "\x85",
    "\x86",
    "\x87",
    "\x88",
    "\x89",
    "\x8A",
    "\x8B",
    "\x8C",
    "\x8D",
    "\x8E",
    "\x8F",
    "\x90",
    "\x91",
    "\x92",
    "\x93",
    "\x94",
    "\x95",
    "\x96",
    "\x97",
    "\x98",
    "\x99",
    "\x9A",
    "\x9B",
    "\x9C",
    "\x9D",
    "\x9E",
    "\x9F",
    "\xA0",
    "\xA1",
    "\xA2",
    "\xA3",
    "\xA4",
    "\xA5",
    "\xA6",
    "\xA7",
    "\xA8",
    "\xA9",
    "\xAA",
    "\xAB",
    "\xAC",
    "\xAD",
    "\xAE",
    "\xAF",
    "\xB0",
    "\xB1",
    "\xB2",
    "\xB3",
    "\xB4",
    "\xB5",
    "\xB6",
    "\xB7",
    "\xB8",
    "\xB9",
    "\xBA",
    "\xBB",
    "\xBC",
    "\xBD",
    "\xBE",
    "\xBF",
    "\xC0",
    "\xC1",
    "\xC2",
    "\xC3",
    "\xC4",
    "\xC5",
    "\xC6",
    "\xC7",
    "\xC8",
    "\xC9",
    "\xCA",
    "\xCB",
    "\xCC",
    "\xCD",
    "\xCE",
    "\xCF",
    "\xD0",
    "\xD1",
    "\xD2",
    "\xD3",
    "\xD4",
    "\xD5",
    "\xD6",
    "\xD7",
    "\xD8",
    "\xD9",
    "\xDA",
    "\xDB",
    "\xDC",
    "\xDD",
    "\xDE",
    "\xDF",
    "\xE0",
    "\xE1",
    "\xE2",
    "\xE3",
    "\xE4",
    "\xE5",
    "\xE6",
    "\xE7",
    "\xE8",
    "\xE9",
    "\xEA",
    "\xEB",
    "\xEC",
    "\xED",
    "\xEE",
    "\xEF",
    "\xF0",
    "\xF1",
    "\xF2",
    "\xF3",
    "\xF4",
    "\xF5",
    "\xF6",
    "\xF7",
    "\xF8",
    "\xF9",
    "\xFA",
    "\xFB",
    "\xFC",
    "\xFD",
    "\xFE",
    "\xFF",
];

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

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export function encodeToByteString(data) {
    let string = "";

    for (const byte of data) {
        string += byteToHexByteString[byte];
    }

    return string;
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function decodeFromByteString(text) {
    const buffer = new Uint8Array(text.length);
    const view = new DataView(buffer.buffer);

    for (let i = 0; i < text.length; i++) {
        view.setUint8(i, text.charCodeAt(i));
    }

    return buffer;
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
