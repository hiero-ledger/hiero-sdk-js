import Long from "long";
import BigNumber from "bignumber.js";
import CACHE from "./Cache.js";
import * as hex from "./encoding/hex.js";

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
        return bytes.length === 0
            ? Long.UZERO
            : Long.fromString(hex.encode(bytes), true, 16);
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
        return bytes.length === 0
            ? new BigNumber(0)
            : new BigNumber(hex.encode(bytes), 16);
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
        if (value instanceof Uint8Array) {
            return value;
        }

        if (typeof value === "string") {
            const stripped = value.startsWith("0x") ? value.slice(2) : value;
            return hex.decode(stripped);
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

        return hex.decode(
            hexString.length % 2 === 0 ? hexString : "0" + hexString,
        );
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
