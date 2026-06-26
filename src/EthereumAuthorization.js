// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import BigNumber from "bignumber.js";
import EvmAddress from "./EvmAddress.js";
import * as hex from "./encoding/hex.js";

/**
 * @typedef {[Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array]} AuthorizationTuple
 * - the positional `[chainId, address, nonce, yParity, r, s]` representation
 *   used on the wire / RLP encoding.
 */

/**
 * A structured, read-only view of a single EIP-7702 / HIP-1340 authorization,
 * layered over the positional `[chainId, address, nonce, yParity, r, s]` tuple
 * stored by `EthereumTransactionDataEip7702`.
 *
 * Per the cross-SDK proposal the authorization is immutable: it has no setters,
 * and is created either at construction time or from an existing tuple. The
 * envelope keeps the tuple representation as the source of truth.
 */
export default class EthereumAuthorization {
    /**
     * Each argument is normalized to minimal big-endian bytes. Integer-like
     * fields accept a `number | Long | Uint8Array | string`; `address` also
     * accepts an {@link EvmAddress}.
     *
     * @param {number | Long | Uint8Array | string} chainId
     * @param {EvmAddress | Uint8Array | string} address
     * @param {number | Long | Uint8Array | string} nonce
     * @param {number | Long | Uint8Array | string} yParity
     * @param {Uint8Array | string} r
     * @param {Uint8Array | string} s
     */
    constructor(chainId, address, nonce, yParity, r, s) {
        /** @type {Uint8Array} */
        this._chainId = EthereumAuthorization._intToBytes(chainId);
        /** @type {Uint8Array} */
        this._address =
            address instanceof EvmAddress
                ? address.toBytes()
                : EthereumAuthorization._bytes(address);
        /** @type {Uint8Array} */
        this._nonce = EthereumAuthorization._intToBytes(nonce);
        /** @type {Uint8Array} */
        this._yParity = EthereumAuthorization._intToBytes(yParity);
        /** @type {Uint8Array} */
        this._r = EthereumAuthorization._bytes(r);
        /** @type {Uint8Array} */
        this._s = EthereumAuthorization._bytes(s);
    }

    /**
     * Build an authorization from the positional
     * `[chainId, address, nonce, yParity, r, s]` tuple.
     *
     * @param {AuthorizationTuple} tuple
     * @returns {EthereumAuthorization}
     */
    static fromTuple(tuple) {
        const [chainId, address, nonce, yParity, r, s] = tuple;
        return new EthereumAuthorization(
            chainId,
            address,
            nonce,
            yParity,
            r,
            s,
        );
    }

    /**
     * Convert back into the positional tuple used by the envelope's
     * `authorizationList` field.
     *
     * @returns {AuthorizationTuple}
     */
    toTuple() {
        return [
            this._chainId,
            this._address,
            this._nonce,
            this._yParity,
            this._r,
            this._s,
        ];
    }

    /**
     * @param {Uint8Array | string} value
     * @returns {Uint8Array}
     */
    static _bytes(value) {
        if (typeof value === "string") {
            return hex.decode(value.startsWith("0x") ? value.slice(2) : value);
        }
        return value;
    }

    /**
     * @param {number | Long | Uint8Array | string} value
     * @returns {Uint8Array}
     */
    static _intToBytes(value) {
        if (value instanceof Uint8Array) {
            return value;
        }
        if (typeof value === "string") {
            return hex.decode(value.startsWith("0x") ? value.slice(2) : value);
        }

        const hexString = Long.isLong(value)
            ? value.toUnsigned().toString(16)
            : new BigNumber(value).toString(16);

        if (hexString === "0") {
            return new Uint8Array();
        }
        return hex.decode(
            hexString.length % 2 === 0 ? hexString : "0" + hexString,
        );
    }

    /**
     * @returns {Long} the chain id as an unsigned integer
     */
    getChainId() {
        return this._chainId.length === 0
            ? Long.UZERO
            : Long.fromString(hex.encode(this._chainId), true, 16);
    }

    /**
     * @returns {Uint8Array} the raw chain id bytes
     */
    getChainIdBytes() {
        return this._chainId;
    }

    /**
     * @returns {?EvmAddress} the delegated address, or `null` when none is set
     */
    getAddress() {
        return this._address.length === 0
            ? null
            : EvmAddress.fromBytes(this._address);
    }

    /**
     * @returns {Uint8Array} the raw address bytes
     */
    getAddressBytes() {
        return this._address;
    }

    /**
     * @returns {Long} the nonce as an unsigned integer
     */
    getNonce() {
        return this._nonce.length === 0
            ? Long.UZERO
            : Long.fromString(hex.encode(this._nonce), true, 16);
    }

    /**
     * @returns {Uint8Array} the raw nonce bytes
     */
    getNonceBytes() {
        return this._nonce;
    }

    /**
     * @returns {Long} the y-parity (recovery id) of the authorization signature
     */
    getYParity() {
        return this._yParity.length === 0
            ? Long.UZERO
            : Long.fromString(hex.encode(this._yParity), true, 16);
    }

    /**
     * Alias of {@link getYParity}.
     *
     * @returns {Long}
     */
    getRecoveryId() {
        return this.getYParity();
    }

    /**
     * @returns {Uint8Array} the authorization signature `r` value
     */
    getR() {
        return this._r;
    }

    /**
     * @returns {Uint8Array} the authorization signature `s` value
     */
    getS() {
        return this._s;
    }
}
