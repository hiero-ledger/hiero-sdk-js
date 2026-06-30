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
 * Coerce a `Uint8Array | hex-string` into bytes, preserving the exact byte
 * sequence (a leading `0x` is stripped). The result is always a fresh copy, so
 * the stored field never aliases the caller's buffer.
 *
 * @param {Uint8Array | string} value
 * @returns {Uint8Array}
 */
export function bytesOrHexToBytes(value) {
    if (typeof value === "string") {
        return hex.decode(value.startsWith("0x") ? value.slice(2) : value);
    }
    // Copy so a later mutation of the caller's array can't change this field.
    return value.slice();
}

/**
 * Normalize an integer-valued input into minimal big-endian bytes (no leading
 * zeros; zero becomes empty bytes). Accepts the union used by the typed
 * setters.
 *
 * Numeric semantics:
 * - `Uint8Array`: trimmed to minimal form and copied (never aliased).
 * - `string`: `0x`-prefixed is parsed as hex, otherwise as decimal.
 * - `number`: must be a safe integer — values above 2^53 must be passed as
 *   `Long`/`BigNumber`/bytes to avoid silent precision loss.
 * - `Long`: interpreted by its signed value (a negative `Long` is rejected,
 *   not silently wrapped to a uint64).
 * All forms must resolve to a non-negative integer.
 *
 * @param {number | Long | BigNumber | Uint8Array | string} value
 * @returns {Uint8Array}
 */
export function toMinimalBytes(value) {
    // Bytes: trim leading zeros to canonical minimal form, returning a COPY so
    // the field never aliases the caller's (or another field's) buffer.
    if (value instanceof Uint8Array) {
        let start = 0;
        while (start < value.length && value[start] === 0) {
            start++;
        }
        return value.slice(start);
    }

    // Every other form resolves to a single non-negative-integer BigNumber.
    let bn;
    if (typeof value === "string") {
        bn = value.startsWith("0x")
            ? new BigNumber(value.slice(2), 16)
            : new BigNumber(value, 10);
    } else if (Long.isLong(value)) {
        // toString() is signed decimal, so a negative Long fails the guard
        // below instead of silently wrapping to 2^64-1.
        bn = new BigNumber(value.toString());
    } else if (BigNumber.isBigNumber(value)) {
        bn = value;
    } else {
        // Guard before constructing the BigNumber: new BigNumber(double) would
        // otherwise silently round a number above 2^53.
        if (!Number.isSafeInteger(value)) {
            throw new Error(
                "Ethereum transaction data number fields must be safe integers; use Long, BigNumber, or bytes for larger values",
            );
        }
        bn = new BigNumber(value);
    }

    if (!bn.isFinite() || bn.isNegative() || !bn.isInteger()) {
        throw new Error(
            "Ethereum transaction data fields must be non-negative integers",
        );
    }

    if (bn.isZero()) {
        return new Uint8Array();
    }
    const hexString = bn.toString(16);
    return hex.decode(hexString.length % 2 === 0 ? hexString : "0" + hexString);
}

/**
 * Decode minimal big-endian bytes into an unsigned {@link Long} (for `uint64`
 * fields such as `chainId`, `nonce` and `gasLimit`). Empty bytes decode to
 * zero. Throws if the value exceeds the `uint64` range rather than silently
 * wrapping — use the raw `*Bytes` accessor for out-of-range values.
 *
 * @param {Uint8Array} bytes
 * @returns {Long}
 */
export function bytesToLong(bytes) {
    if (bytes.length === 0) {
        return Long.UZERO;
    }
    if (bytes.length > 8) {
        throw new Error(
            "value exceeds the uint64 range; use the raw *Bytes accessor instead",
        );
    }
    return Long.fromString(hex.encode(bytes), true, 16);
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
