// SPDX-License-Identifier: Apache-2.0

/**
 * Minimal RLP (Recursive Length Prefix) encoder and decoder, byte-for-byte
 * compatible with the `encodeRlp`/`decodeRlp` helpers from ethers v6.
 *
 * https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/
 */

/**
 * @typedef {Uint8Array | string | RlpInputList} RlpInput
 * @typedef {RlpInput[]} RlpInputList
 */

/**
 * @typedef {Uint8Array | RlpValueList} RlpValue
 * @typedef {RlpValue[]} RlpValueList
 */

/**
 * @param {number} value
 * @returns {number[]}
 */
function integerToBytes(value) {
    /** @type {number[]} */
    const result = [];
    while (value) {
        result.unshift(value & 0xff);
        value = Math.floor(value / 256);
    }
    return result;
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {number} length
 * @returns {number}
 */
function bytesToInteger(data, offset, length) {
    let result = 0;
    for (let i = 0; i < length; i++) {
        result = result * 256 + data[offset + i];
    }
    return result;
}

/**
 * Same rules as ethers' `getBytes`: bytes pass through, strings must be
 * `0x`-prefixed hex with an even number of digits.
 *
 * @param {Uint8Array | string} value
 * @returns {Uint8Array}
 */
function toBytes(value) {
    if (value instanceof Uint8Array) {
        return value;
    }

    if (
        typeof value === "string" &&
        value.length % 2 === 0 &&
        /^0x[0-9a-f]*$/i.test(value)
    ) {
        const result = new Uint8Array((value.length - 2) / 2);
        for (let i = 0; i < result.length; i++) {
            result[i] = parseInt(value.substring(2 + i * 2, 4 + i * 2), 16);
        }
        return result;
    }

    throw new Error("invalid RLP item: expected bytes or a 0x hex string");
}

/**
 * @param {number} length
 * @param {number} shortOffset 0x80 for strings, 0xc0 for lists
 * @returns {number[]}
 */
function encodeLength(length, shortOffset) {
    if (length <= 55) {
        return [shortOffset + length];
    }
    const lengthBytes = integerToBytes(length);
    return [shortOffset + 55 + lengthBytes.length, ...lengthBytes];
}

/**
 * @param {RlpInput} value
 * @param {number[]} out
 */
function encodeInto(value, out) {
    if (Array.isArray(value)) {
        /** @type {number[]} */
        const payload = [];
        for (const child of value) {
            encodeInto(child, payload);
        }
        out.push(...encodeLength(payload.length, 0xc0));
        for (const byte of payload) {
            out.push(byte);
        }
        return;
    }

    const data = toBytes(value);
    if (data.length === 1 && data[0] <= 0x7f) {
        out.push(data[0]);
        return;
    }
    out.push(...encodeLength(data.length, 0x80));
    for (const byte of data) {
        out.push(byte);
    }
}

/**
 * @param {RlpInput} value
 * @returns {Uint8Array}
 */
export function encode(value) {
    /** @type {number[]} */
    const out = [];
    encodeInto(value, out);
    return Uint8Array.from(out);
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {{ consumed: number, result: RlpValue }}
 */
function decodeAt(data, offset) {
    /**
     * @param {number} end
     */
    const checkEnd = (end) => {
        if (end > data.length) {
            throw new Error("invalid RLP: data too short");
        }
    };

    /**
     * @param {number} start
     * @param {number} length
     * @returns {{ consumed: number, result: RlpValue }}
     */
    const decodeChildren = (start, length) => {
        /** @type {RlpValue[]} */
        const result = [];
        const end = start + length;
        let childOffset = start;
        while (childOffset < end) {
            const decoded = decodeAt(data, childOffset);
            result.push(decoded.result);
            childOffset += decoded.consumed;
            if (childOffset > end) {
                throw new Error("invalid RLP: child data too short");
            }
        }
        return { consumed: end - offset, result };
    };

    checkEnd(offset + 1);
    const prefix = data[offset];

    if (prefix >= 0xf8) {
        const lengthLength = prefix - 0xf7;
        checkEnd(offset + 1 + lengthLength);
        const length = bytesToInteger(data, offset + 1, lengthLength);
        checkEnd(offset + 1 + lengthLength + length);
        return decodeChildren(offset + 1 + lengthLength, length);
    }

    if (prefix >= 0xc0) {
        const length = prefix - 0xc0;
        checkEnd(offset + 1 + length);
        return decodeChildren(offset + 1, length);
    }

    if (prefix >= 0xb8) {
        const lengthLength = prefix - 0xb7;
        checkEnd(offset + 1 + lengthLength);
        const length = bytesToInteger(data, offset + 1, lengthLength);
        const start = offset + 1 + lengthLength;
        checkEnd(start + length);
        return {
            consumed: 1 + lengthLength + length,
            result: data.slice(start, start + length),
        };
    }

    if (prefix >= 0x80) {
        const length = prefix - 0x80;
        checkEnd(offset + 1 + length);
        return {
            consumed: 1 + length,
            result: data.slice(offset + 1, offset + 1 + length),
        };
    }

    return { consumed: 1, result: data.slice(offset, offset + 1) };
}

/**
 * Decode RLP data. Byte strings come back as fresh `Uint8Array` copies and
 * lists as arrays.
 *
 * @param {Uint8Array} data
 * @returns {RlpValue}
 */
export function decode(data) {
    if (data.length === 0) {
        throw new Error("invalid RLP: data too short");
    }

    const decoded = decodeAt(data, 0);
    if (decoded.consumed !== data.length) {
        throw new Error("invalid RLP: unexpected junk after rlp payload");
    }
    return decoded.result;
}

/**
 * Narrow a decoded RLP item to a byte string.
 *
 * @param {RlpValue | undefined} value
 * @returns {Uint8Array}
 */
export function asBytes(value) {
    if (!(value instanceof Uint8Array)) {
        throw new Error("invalid RLP: expected a byte string");
    }
    return value;
}

/**
 * Narrow a decoded RLP item to a list.
 *
 * @param {RlpValue | undefined} value
 * @returns {RlpValue[]}
 */
export function asList(value) {
    if (!Array.isArray(value)) {
        throw new Error("invalid RLP: expected a list");
    }
    return value;
}

/**
 * Encode `value` as an EIP-2718 typed transaction payload:
 * `type || rlp(value)`.
 *
 * @param {number} type
 * @param {RlpInput} value
 * @returns {Uint8Array}
 */
export function encodeTyped(type, value) {
    const encoded = encode(value);
    const result = new Uint8Array(encoded.length + 1);
    result[0] = type;
    result.set(encoded, 1);
    return result;
}
