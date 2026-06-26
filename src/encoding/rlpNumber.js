// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import BigNumber from "bignumber.js";
import * as hex from "./hex.js";

/**
 * Shared conversion helpers between Ethereum transaction data fields (stored as
 * minimal big-endian `Uint8Array`, matching RLP integer encoding) and the typed
 * representations used by the SDK's accessors.
 *
 * "Minimal big-endian" means no leading zero bytes, and zero is encoded as
 * empty bytes (`0x80` once RLP-wrapped).
 */

/**
 * Coerce a `Uint8Array | hex-string` into bytes (a leading `0x` is stripped).
 *
 * @param {Uint8Array | string} value
 * @returns {Uint8Array}
 */
export function bytesOrHexToBytes(value) {
    if (typeof value === "string") {
        return hex.decode(value.startsWith("0x") ? value.slice(2) : value);
    }
    return value;
}

/**
 * Normalize a numeric/bytes/hex-string value into minimal big-endian bytes
 * (no leading zeros; zero becomes empty bytes). Accepts the union used by the
 * typed setters.
 *
 * @param {number | Long | BigNumber | Uint8Array | string} value
 * @returns {Uint8Array}
 */
export function toMinimalBytes(value) {
    if (value instanceof Uint8Array) {
        return value;
    }

    if (typeof value === "string") {
        return bytesOrHexToBytes(value);
    }

    let hexString;
    if (Long.isLong(value)) {
        hexString = value.toUnsigned().toString(16);
    } else if (BigNumber.isBigNumber(value)) {
        hexString = value.toString(16);
    } else {
        hexString = new BigNumber(value).toString(16);
    }

    if (hexString === "0") {
        return new Uint8Array();
    }

    return hex.decode(hexString.length % 2 === 0 ? hexString : "0" + hexString);
}

/**
 * Decode minimal big-endian bytes into an unsigned {@link Long} (for `uint64`
 * fields such as `chainId`, `nonce` and `gasLimit`). Empty bytes decode to
 * zero.
 *
 * @param {Uint8Array} bytes
 * @returns {Long}
 */
export function bytesToLong(bytes) {
    return bytes.length === 0
        ? Long.UZERO
        : Long.fromString(hex.encode(bytes), true, 16);
}

/**
 * Decode minimal big-endian bytes into a {@link BigNumber} (for `uint256`
 * fields such as `value`, `gasPrice` and `maxGas`). Empty bytes decode to zero.
 *
 * @param {Uint8Array} bytes
 * @returns {BigNumber}
 */
export function bytesToBigNumber(bytes) {
    return bytes.length === 0
        ? new BigNumber(0)
        : new BigNumber(hex.encode(bytes), 16);
}
