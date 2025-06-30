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
    const result = str.match(/.{1,2}/gu);

    return new Uint8Array(
        (result == null ? [] : result).map((byte) => parseInt(byte, 16)),
    );
}

/**
 * Encode with a specified length. Supports zero padding if the most significant byte is 0
 *
 * https://github.com/ethers-io/ethers.js/blob/master/packages/bytes/src.ts/index.ts#L315
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
