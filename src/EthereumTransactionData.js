import CACHE from "./Cache.js";

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

        // Signature components. Every concrete envelope sets these in its own
        // constructor; declared here so shared logic (e.g. `isSigned`) can read
        // them. `r`/`s` are the ECDSA signature; the recovery component is `v`
        // on legacy and `recId` on the typed envelopes.
        /** @type {Uint8Array=} */
        this.r = undefined;
        /** @type {Uint8Array=} */
        this.s = undefined;
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
     * Whether this envelope carries a signature, i.e. both `r` and `s` are set.
     *
     * @returns {boolean}
     */
    isSigned() {
        return (
            this.r != null &&
            this.r.length > 0 &&
            this.s != null &&
            this.s.length > 0
        );
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
