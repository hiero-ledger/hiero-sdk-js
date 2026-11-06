// SPDX-License-Identifier: Apache-2.0

import * as hex from "./hex.js";
import BigNumber from "bignumber.js";
import { keccak256 } from "../cryptography/keccak.js";

/**
 * @typedef {string | ParamType} TypeInput
 */

/**
 * Minimal ABI decoder compatible with ethers v6 ParamType shapes.
 * Supports the subset of types used by ContractFunctionResult.getResult.
 */

/**
 * ParamType shape matching ethers' public API.
 *
 * @typedef {object} ParamType
 * @property {string} type
 * @property {string} [name]
 * @property {string} [baseType]
 * @property {?boolean} [indexed]
 * @property {?ReadonlyArray<ParamType>} [components]
 * @property {?ParamType} [arrayChildren]
 * @property {?number} [arrayLength]
 */

/**
 * @param {string} typeStr
 * @returns {ParamType}
 */
function parseType(typeStr) {
    // Strip trailing member name: "uint256 a" -> "uint256", "string[] names" -> "string[]"
    typeStr = typeStr.trim().replace(/\s+[A-Za-z_$][\w$]*$/, "");

    // Handle arrays
    const arrayMatch = typeStr.match(/^(.+?)((\[\d*\])+)$/);
    if (arrayMatch) {
        const baseType = arrayMatch[1];
        const dimensions = arrayMatch[2];
        let current = parseType(baseType);

        // Process array dimensions left-to-right
        const dimMatches = [...dimensions.matchAll(/\[(\d*)\]/g)];
        for (const dimMatch of dimMatches) {
            const length = dimMatch[1] ? parseInt(dimMatch[1], 10) : -1;
            current = {
                type: `${current.type}${dimMatch[0]}`,
                baseType: "array",
                arrayChildren: current,
                arrayLength: length,
            };
        }
        return current;
    }

    // Handle tuples - accept both "tuple(...)" and "(...)"
    if (
        typeStr.startsWith("tuple(") ||
        (typeStr.startsWith("(") && typeStr.endsWith(")"))
    ) {
        const inner = typeStr.startsWith("tuple(")
            ? typeStr.slice(6, -1)
            : typeStr.slice(1, -1);
        const components = parseTupleComponents(inner);
        return {
            type: typeStr.startsWith("tuple(") ? typeStr : `tuple${typeStr}`,
            baseType: "tuple",
            components,
        };
    }

    return { type: typeStr };
}

/**
 * Parse tuple components, respecting nested tuples and arrays.
 *
 * @param {string} inner
 * @returns {ParamType[]}
 */
function parseTupleComponents(inner) {
    /** @type {ParamType[]} */
    const components = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if (char === "(" || char === "[") depth++;
        if (char === ")" || char === "]") depth--;

        if (char === "," && depth === 0) {
            const component = inner.slice(start, i).trim();
            if (component) components.push(parseType(component));
            start = i + 1;
        }
    }

    if (start < inner.length) {
        const component = inner.slice(start).trim();
        if (component) components.push(parseType(component));
    }

    return components;
}

/**
 * Decode ABI-encoded data according to the given types.
 * Returns values in the same shape as ethers v6 AbiCoder.decode.
 *
 * @param {TypeInput[]} types
 * @param {Uint8Array} data
 * @returns {Array<any>}
 */
export function decode(types, data) {
    const parsedTypes = types.map((t) =>
        typeof t === "string" ? parseType(t) : t,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return unpack(parsedTypes, data, 0);
}

/**
 * Unpack a list of types from data at a given offset.
 * This handles both top-level decoding, tuple members, and array elements.
 *
 * @param {ParamType[]} types
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {boolean} inTupleOrFixedArray - Whether we're unpacking inside a tuple/fixed array
 * @returns {Array<any>}
 */
function unpack(types, data, offset, inTupleOrFixedArray = false) {
    const results = [];
    let headOffset = offset;

    for (const type of types) {
        if (isDynamic(type)) {
            // Read pointer and follow it
            const pointer = readUint(data, headOffset);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const value = decodeValue(
                type,
                data,
                offset + pointer,
                inTupleOrFixedArray,
            );
            results.push(value);
            headOffset += 32;
        } else {
            // Decode inline
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const value = decodeValue(
                type,
                data,
                headOffset,
                inTupleOrFixedArray,
            );
            results.push(value);
            headOffset += getStaticSize(type);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return results;
}

/**
 * Get the static size in bytes of a type.
 * @param {ParamType} type
 * @returns {number}
 */
function getStaticSize(type) {
    if (isDynamic(type)) return 32; // pointer

    if (type.baseType === "array" && type.arrayLength && type.arrayLength > 0) {
        const childSize = getStaticSize(
            /** @type {ParamType} */ (type.arrayChildren),
        );
        return childSize * type.arrayLength;
    }

    if (type.baseType === "tuple") {
        let size = 0;
        for (const comp of /** @type {ParamType[]} */ (type.components)) {
            size += getStaticSize(comp);
        }
        return size;
    }

    return 32; // All other static types are 32 bytes
}

/**
 * @param {ParamType} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {boolean} inTupleOrFixedArray - Whether inside tuple or fixed array
 * @returns {any}
 */
function decodeValue(type, data, offset, inTupleOrFixedArray) {
    const typeStr = type.type;

    // Static types
    if (typeStr === "bool") {
        checkBounds(data, offset, 32);
        // Check all 32 bytes - only the last byte matters but all others must be zero
        for (let i = 0; i < 31; i++) {
            if (data[offset + i] !== 0) {
                throw new Error("invalid bool encoding");
            }
        }
        return data[offset + 31] !== 0;
    }

    if (typeStr === "address") {
        checkBounds(data, offset, 32);
        // Upper 12 bytes must be zero
        for (let i = 0; i < 12; i++) {
            if (data[offset + i] !== 0) {
                throw new Error("invalid address encoding");
            }
        }
        const addr = hex.encode(data.subarray(offset + 12, offset + 32));
        return checksumAddress(addr);
    }

    if (typeStr === "bytes32") {
        checkBounds(data, offset, 32);
        return `0x${hex.encode(data.subarray(offset, offset + 32))}`;
    }

    // Fixed-size bytesN
    const bytesNMatch = typeStr.match(/^bytes(\d+)$/);
    if (bytesNMatch) {
        checkBounds(data, offset, 32);
        const n = parseInt(bytesNMatch[1], 10);
        return `0x${hex.encode(data.subarray(offset, offset + n))}`;
    }

    // Integer types
    const intMatch = typeStr.match(/^(u?)int(\d+)?$/);
    if (intMatch) {
        checkBounds(data, offset, 32);
        const unsigned = intMatch[1] === "u";
        const bits = intMatch[2] ? parseInt(intMatch[2], 10) : 256;
        return decodeInt(data, offset, unsigned, bits, inTupleOrFixedArray);
    }

    // Fixed-size arrays (e.g., int256[2], string[2])
    if (type.arrayLength != null && type.arrayLength > 0) {
        const childType = /** @type {ParamType} */ (type.arrayChildren);
        const elements = [];

        if (isDynamic(childType)) {
            // Dynamic children (e.g., string[2]): use pointers relative to offset
            let headOffset = offset;
            for (let i = 0; i < type.arrayLength; i++) {
                checkBounds(data, headOffset, 32);
                const pointer = readUint(data, headOffset);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const value = decodeValue(
                    childType,
                    data,
                    offset + pointer,
                    true,
                );
                elements.push(value);
                headOffset += 32;
            }
        } else {
            // Static children: decode inline
            const childSize = getStaticSize(childType);
            let elemOffset = offset;

            for (let i = 0; i < type.arrayLength; i++) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const value = decodeValue(childType, data, elemOffset, true);
                elements.push(value);
                elemOffset += childSize;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return elements;
    }

    // Dynamic types
    if (typeStr === "bytes") {
        checkBounds(data, offset, 32);
        const length = readUint(data, offset);
        checkBounds(data, offset + 32, length);
        return `0x${hex.encode(
            data.subarray(offset + 32, offset + 32 + length),
        )}`;
    }

    if (typeStr === "string") {
        checkBounds(data, offset, 32);
        const length = readUint(data, offset);
        checkBounds(data, offset + 32, length);
        const bytes = data.subarray(offset + 32, offset + 32 + length);
        return new TextDecoder().decode(bytes);
    }

    // Dynamic arrays
    if (typeStr.endsWith("[]")) {
        checkBounds(data, offset, 32);
        const length = readUint(data, offset);
        const childType = /** @type {ParamType} */ (type.arrayChildren);
        const elements = [];
        const arrayDataStart = offset + 32;

        if (isDynamic(childType)) {
            // Dynamic children: read pointers relative to arrayDataStart
            let headOffset = arrayDataStart;
            for (let i = 0; i < length; i++) {
                checkBounds(data, headOffset, 32);
                const pointer = readUint(data, headOffset);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const value = decodeValue(
                    childType,
                    data,
                    arrayDataStart + pointer,
                    inTupleOrFixedArray,
                );
                elements.push(value);
                headOffset += 32;
            }
        } else {
            // Static children: decode inline
            let elemOffset = arrayDataStart;
            const childSize = getStaticSize(childType);
            for (let i = 0; i < length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const value = decodeValue(childType, data, elemOffset, inTupleOrFixedArray);
                elements.push(value);
                elemOffset += childSize;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return elements;
    }

    // Tuples
    if (type.baseType === "tuple") {
        const components = /** @type {ParamType[]} */ (type.components);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return unpack(components, data, offset, true);
    }

    throw new Error(`unsupported type: ${typeStr}`);
}

/**
 * @param {ParamType} type
 * @returns {boolean}
 */
function isDynamic(type) {
    const typeStr = type.type;
    if (typeStr === "bytes" || typeStr === "string" || typeStr.endsWith("[]")) {
        return true;
    }
    if (type.baseType === "array" && type.arrayLength && type.arrayLength > 0) {
        return isDynamic(/** @type {ParamType} */ (type.arrayChildren));
    }
    if (type.baseType === "tuple") {
        return type.components?.some((c) => isDynamic(c)) ?? false;
    }
    return false;
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {number} needed
 */
function checkBounds(data, offset, needed) {
    if (offset + needed > data.length) {
        throw new Error("data out-of-bounds");
    }
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {number}
 */
function readUint(data, offset) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        result = result * 256 + data[offset + i];
        if (result > Number.MAX_SAFE_INTEGER) {
            throw new Error("uint value too large for safe integer");
        }
    }
    return result;
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {boolean} unsigned
 * @param {number} bits
 * @param {boolean} inTupleOrFixedArray
 * @returns {bigint | BigNumber | number}
 */
function decodeInt(data, offset, unsigned, bits, inTupleOrFixedArray) {
    if (unsigned) {
        const bytesNeeded = Math.ceil(bits / 8);
        const start = offset + 32 - bytesNeeded;
        let result = 0n;

        for (let i = 0; i < bytesNeeded; i++) {
            result = (result << 8n) | BigInt(data[start + i]);
        }

        // In tuples or fixed arrays, always return BigNumber
        if (inTupleOrFixedArray) {
            return new BigNumber(result.toString());
        }

        // Otherwise: number for ≤32 bits, BigNumber for larger
        if (bits <= 32) {
            return Number(result);
        }
        return new BigNumber(result.toString());
    } else {
        // Signed integer
        const bytesNeeded = Math.ceil(bits / 8);
        const start = offset + 32 - bytesNeeded;

        // Check sign bit
        const isNegative = (data[start] & 0x80) !== 0;

        let result = 0n;
        if (isNegative) {
            // Two's complement: invert bits and add 1
            for (let i = 0; i < bytesNeeded; i++) {
                result = (result << 8n) | BigInt(~data[start + i] & 0xff);
            }
            result = -(result + 1n);
        } else {
            for (let i = 0; i < bytesNeeded; i++) {
                result = (result << 8n) | BigInt(data[start + i]);
            }
        }

        // In tuples or fixed arrays, always return BigNumber
        if (inTupleOrFixedArray) {
            return new BigNumber(result.toString());
        }

        // Otherwise: number for ≤32 bits, BigNumber for larger
        if (bits <= 32) {
            return Number(result);
        }
        return new BigNumber(result.toString());
    }
}

/**
 * EIP-55 checksum encoding for Ethereum addresses.
 *
 * @param {string} address - hex address without 0x prefix
 * @returns {string} - checksummed address with 0x prefix
 */
function checksumAddress(address) {
    const addr = address.toLowerCase().replace(/^0x/, "");

    // keccak256 from SDK: pass plain string (no 0x), returns 0x-prefixed hash
    const hash = keccak256(addr).slice(2);

    let result = "0x";
    for (let i = 0; i < addr.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            result += addr[i].toUpperCase();
        } else {
            result += addr[i];
        }
    }
    return result;
}
