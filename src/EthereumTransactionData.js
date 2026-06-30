import CACHE from "./Cache.js";
import {
    bytesToLong,
    bytesToBigNumber,
    toMinimalBytes,
    bytesOrHexToBytes,
} from "./encoding/rlpNumber.js";

/**
 * @typedef {import("long")} Long
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * Represents the base class for Ethereum transaction data.
 * This class provides the foundation for different types of Ethereum transactions
 * including Legacy, EIP-1559, EIP-2930, and EIP-7702 transactions.
 */
export default class EthereumTransactionData {
    /**
     * @protected
     * @param {object} props
     * @param {Uint8Array} props.callData
     */
    constructor(props) {
        this.callData = props.callData;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {EthereumTransactionData}
     */
    static fromBytes(bytes) {
        if (bytes.length === 0) {
            throw new Error("empty bytes");
        }

        switch (bytes[0]) {
            case 1:
                return CACHE.ethereumTransactionDataEip2930FromBytes(bytes);
            case 2:
                return CACHE.ethereumTransactionDataEip1559FromBytes(bytes);
            case 4:
                return CACHE.ethereumTransactionDataEip7702FromBytes(bytes);
            default:
                return CACHE.ethereumTransactionDataLegacyFromBytes(bytes);
        }
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        throw new Error("not implemented");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Sign this transaction data with the given ECDSA (secp256k1) key,
     * populating the signature fields (`r`, `s` and the recovery component) on
     * this instance.
     *
     * Throws if `key` is not an ECDSA key.
     *
     * @param {import("./PrivateKey.js").default} key
     * @returns {EthereumTransactionData}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sign(key) {
        throw new Error("not implemented");
    }

    /**
     * Shared ECDSA signing logic for every envelope variant. Signs the given
     * unsigned message — the type-prefixed RLP payload for typed envelopes, or
     * the bare RLP payload for legacy — and returns the signature components.
     *
     * Detection of a non-ECDSA key happens via the recovery-id computation
     * rather than a key-type or length check: an Ed25519 signature is also 64
     * bytes, so a length check alone is insufficient. If a valid recovery id
     * cannot be derived, signing fails.
     *
     * @protected
     * @param {import("./PrivateKey.js").default} key
     * @param {Uint8Array} message
     * @returns {{ r: Uint8Array, s: Uint8Array, recoveryId: number }}
     */
    _signMessage(key, message) {
        const signature = key.sign(message);
        const r = signature.subarray(0, 32);
        const s = signature.subarray(32, 64);
        const recoveryId = key.getRecoveryId(r, s, message);
        return { r, s, recoveryId };
    }

    /**
     * Encode a small non-negative integer as a minimal big-endian byte array
     * (no leading zeros; zero becomes empty bytes), matching Ethereum's RLP
     * integer encoding.
     *
     * @protected
     * @param {number} value
     * @returns {Uint8Array}
     */
    _numberToBytes(value) {
        if (value <= 0) {
            return new Uint8Array();
        }

        const bytes = [];
        let remaining = value;
        while (remaining > 0) {
            bytes.unshift(remaining & 0xff);
            remaining = Math.floor(remaining / 256);
        }
        return new Uint8Array(bytes);
    }

    /**
     * Decode minimal big-endian bytes into an unsigned {@link Long} (for
     * `uint64` fields such as `chainId`, `nonce` and `gasLimit`). Empty bytes
     * decode to zero.
     *
     * @protected
     * @param {Uint8Array} bytes
     * @returns {Long}
     */
    _bytesToLong(bytes) {
        return bytesToLong(bytes);
    }

    /**
     * Decode minimal big-endian bytes into a {@link BigNumber} (for `uint256`
     * fields such as `value`, `gasPrice` and `maxGas`). Empty bytes decode to
     * zero.
     *
     * @protected
     * @param {Uint8Array} bytes
     * @returns {BigNumber}
     */
    _bytesToBigNumber(bytes) {
        return bytesToBigNumber(bytes);
    }

    /**
     * Normalize a numeric/bytes/hex-string value into minimal big-endian bytes
     * (no leading zeros; zero becomes empty bytes), matching Ethereum's RLP
     * integer encoding. Accepts the union used by the typed setters.
     *
     * @protected
     * @param {number | Long | BigNumber | Uint8Array | string} value
     * @returns {Uint8Array}
     */
    _toMinimalBytes(value) {
        return toMinimalBytes(value);
    }

    /**
     * Coerce a bytes-or-hex-string value into bytes, preserving the exact byte
     * sequence (no minimal-encoding / leading-zero trimming). Used for
     * fixed-width or opaque fields — addresses and call data — where trimming
     * would corrupt the value.
     *
     * @protected
     * @param {Uint8Array | string} value
     * @returns {Uint8Array}
     */
    _toExactBytes(value) {
        return bytesOrHexToBytes(value);
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {string}
     */
    toString() {
        throw new Error("not implemented");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {{[key: string]: any}}
     */
    toJSON() {
        throw new Error("not implemented");
    }
}
