// SPDX-License-Identifier: Apache-2.0

import * as hex from "./hex.js";
import BigNumber from "bignumber.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

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
 * @typedef {Object} ParamType
 * @property {string} type
 * @property {string} [name]
 * @property {string} [baseType]
 * @property {boolean} [indexed]
 * @property {ParamType[]} [components]
 * @property {ParamType} [arrayChildren]
 * @property {number} [arrayLength]
 */

/**
 * @param {string} typeStr
 * @returns {ParamType}
 */
function parseType(typeStr) {
    // Handle arrays
    const arrayMatch = typeStr.match(/^(.+?)((\[\d*\])+)$/);
    if (arrayMatch) {
        const baseType = arrayMatch[1];
        const dimensions = arrayMatch[2];
        let current = parseType(baseType);

        // Process array dimensions right-to-left
        const dimMatches = [...dimensions.matchAll(/\[(\d*)\]/g)].reverse();
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

    // Handle tuples
    if (typeStr.startsWith("tuple(")) {
        const inner = typeStr.slice(6, -1);
        const components = parseTupleComponents(inner);
        return {
            type: typeStr,
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
            components.push(parseType(inner.slice(start, i).trim()));
            start = i + 1;
        }
    }

    if (start < inner.length) {
        components.push(parseType(inner.slice(start).trim()));
    }

    return components;
}

/**
 * Decode ABI-encoded data according to the given types.
 * Returns values in the same shape as ethers v6 AbiCoder.decode.
 *
 * @param {TypeInput[]} types
 * @param {Uint8Array} data
 * @returns {Array<*>}
 */
export function decode(types, data) {
    const parsedTypes = types.map((t) =>
        typeof t === "string" ? parseType(t) : t,
    );

    const results = [];
    let offset = 0;

    for (const type of parsedTypes) {
        const { value, consumed } = decodeValue(type, data, offset, data);
        results.push(value);
        offset += consumed;
    }

    return results;
}

/**
 * @param {ParamType} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {Uint8Array} rootData
 * @param {boolean} [inTuple=false] - Whether we're inside a tuple (affects int conversion)
 * @returns {{ value: any, consumed: number }}
 */
function decodeValue(type, data, offset, rootData, inTuple = false) {
    const typeStr = type.type;

    // Static types
    if (typeStr === "bool") {
        return { value: data[offset + 31] !== 0, consumed: 32 };
    }

    if (typeStr === "address") {
        const addr = hex.encode(data.subarray(offset + 12, offset + 32));
        // Checksum the address like ethers does
        return { value: checksumAddress(addr), consumed: 32 };
    }

    if (typeStr === "bytes32") {
        return {
            value: `0x${hex.encode(data.subarray(offset, offset + 32))}`,
            consumed: 32,
        };
    }

    // Fixed-size bytesN
    const bytesNMatch = typeStr.match(/^bytes(\d+)$/);
    if (bytesNMatch) {
        const n = parseInt(bytesNMatch[1], 10);
        return {
            value: `0x${hex.encode(data.subarray(offset, offset + n))}`,
            consumed: 32,
        };
    }

    // Integer types
    const intMatch = typeStr.match(/^(u?)int(\d+)?$/);
    if (intMatch) {
        const unsigned = intMatch[1] === "u";
        const bits = intMatch[2] ? parseInt(intMatch[2], 10) : 256;
        return { value: decodeInt(data, offset, unsigned, bits, inTuple), consumed: 32 };
    }

    // Fixed-size arrays (e.g., int256[2])
    if (type.arrayLength != null && type.arrayLength > 0) {
        const elements = [];
        let elemOffset = offset;
        for (let i = 0; i < type.arrayLength; i++) {
            const { value } = decodeValue(
                /** @type {ParamType} */ (type.arrayChildren),
                data,
                elemOffset,
                rootData,
                inTuple,
            );
            elements.push(value);
            elemOffset += isDynamic(
                /** @type {ParamType} */ (type.arrayChildren),
            )
                ? 32
                : 32;
        }
        return { value: elements, consumed: 32 * type.arrayLength };
    }

    // Dynamic types (read pointer and follow it)
    if (
        typeStr.includes("[]") ||
        typeStr === "bytes" ||
        typeStr === "string" ||
        type.baseType === "tuple"
    ) {
        const pointer = readUint(data, offset);
        const { value } = decodeDynamic(type, rootData, pointer, inTuple);
        return { value, consumed: 32 };
    }

    throw new Error(`unsupported type: ${typeStr}`);
}

/**
 * @param {ParamType} type
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {boolean} [inTuple=false]
 * @returns {{ value: any, consumed: number }}
 */
function decodeDynamic(type, data, offset, inTuple = false) {
    const typeStr = type.type;

    if (typeStr === "bytes") {
        const length = readUint(data, offset);
        const value = `0x${hex.encode(data.subarray(offset + 32, offset + 32 + length))}`;
        const consumed = 32 + Math.ceil(length / 32) * 32;
        return { value, consumed };
    }

    if (typeStr === "string") {
        const length = readUint(data, offset);
        const bytes = data.subarray(offset + 32, offset + 32 + length);
        const value = new TextDecoder().decode(bytes);
        const consumed = 32 + Math.ceil(length / 32) * 32;
        return { value, consumed };
    }

    // Dynamic arrays
    if (typeStr.endsWith("[]")) {
        const length = readUint(data, offset);
        const elements = [];
        let elemOffset = offset + 32;

        const childType = /** @type {ParamType} */ (type.arrayChildren);
        const childIsDynamic = isDynamic(childType);

        for (let i = 0; i < length; i++) {
            if (childIsDynamic) {
                const pointer = readUint(data, elemOffset);
                const { value } = decodeDynamic(childType, data, offset + 32 + pointer, inTuple);
                elements.push(value);
                elemOffset += 32;
            } else {
                const { value } = decodeValue(childType, data, elemOffset, data, inTuple);
                elements.push(value);
                elemOffset += 32;
            }
        }

        return { value: elements, consumed: elemOffset - offset };
    }

    // Tuples
    if (type.baseType === "tuple") {
        const components = /** @type {ParamType[]} */ (type.components);
        const values = [];
        let headOffset = offset;
        let tailOffset = offset;

        // Calculate where dynamic data starts
        for (const comp of components) {
            tailOffset += isDynamic(comp) ? 32 : 32;
        }

        for (const comp of components) {
            if (isDynamic(comp)) {
                const pointer = readUint(data, headOffset);
                const { value } = decodeDynamic(comp, data, offset + pointer, true);
                values.push(value);
                headOffset += 32;
            } else {
                const { value } = decodeValue(comp, data, headOffset, data, true);
                values.push(value);
                headOffset += 32;
            }
        }

        return { value: values, consumed: tailOffset - offset };
    }

    throw new Error(`unsupported dynamic type: ${typeStr}`);
}

/**
 * @param {ParamType} type
 * @returns {boolean}
 */
function isDynamic(type) {
    const typeStr = type.type;
    if (
        typeStr === "bytes" ||
        typeStr === "string" ||
        typeStr.endsWith("[]")
    ) {
        return true;
    }
    if (type.baseType === "tuple") {
        return (
            type.components?.some((c) => isDynamic(c)) ?? false
        );
    }
    return false;
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
        // Prevent overflow for large numbers
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
 * @param {boolean} [inTuple=false] - If true, always return BigNumber for compatibility
 * @returns {bigint | BigNumber | number}
 */
function decodeInt(data, offset, unsigned, bits, inTuple = false) {
    if (unsigned) {
        const bytesNeeded = Math.ceil(bits / 8);
        const start = offset + 32 - bytesNeeded;
        let result = 0n;

        for (let i = 0; i < bytesNeeded; i++) {
            result = (result << 8n) | BigInt(data[start + i]);
        }

        // In tuples, always return BigNumber for compatibility with ethers
        if (inTuple) {
            return new BigNumber(result.toString());
        }

        // Return number for ≤32 bits, BigNumber for larger
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

        // In tuples, always return BigNumber for compatibility with ethers
        if (inTuple) {
            return new BigNumber(result.toString());
        }

        // Return number for ≤32 bits, BigNumber for larger
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

    // Hash the ASCII representation of the lowercase address
    const addrBytes = new TextEncoder().encode(addr);
    const hashBytes = keccak_256(addrBytes);
    const hash = hex.encode(hashBytes);

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
