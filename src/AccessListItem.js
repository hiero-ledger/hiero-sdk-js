// SPDX-License-Identifier: Apache-2.0

import EvmAddress from "./EvmAddress.js";
import { bytesOrHexToBytes } from "./encoding/rlpNumber.js";

/**
 * @typedef {[Uint8Array, Uint8Array[]]} AccessListTuple - the positional
 * `[address, storageKeys[]]` representation used on the wire / RLP encoding.
 */

/**
 * A structured, inspectable view of a single EIP-2930 access list entry,
 * layered over the positional `[address, storageKeys[]]` tuple that the
 * Ethereum transaction data envelopes store on the wire.
 *
 * This is additive: the envelopes keep the tuple representation as the source
 * of truth; this class is a convenience wrapper produced by `getAccessList()`
 * and consumed by `setAccessList()`.
 */
export default class AccessListItem {
    /**
     * @param {Uint8Array | null} [address] - 20-byte address (nullable)
     * @param {Uint8Array[]} [storageKeys] - 32-byte storage keys
     */
    constructor(address = null, storageKeys = []) {
        /** @type {Uint8Array | null} */
        this._address = address;
        // Copy so mutating this item (e.g. addStorageKey) never reaches the
        // caller's array or the envelope tuple it may have come from.
        /** @type {Uint8Array[]} */
        this._storageKeys = [...storageKeys];
    }

    /**
     * Build an item from the positional `[address, storageKeys[]]` tuple.
     *
     * @param {AccessListTuple} tuple
     * @returns {AccessListItem}
     */
    static fromTuple(tuple) {
        const [address, storageKeys] = tuple;
        return new AccessListItem(address, storageKeys);
    }

    /**
     * Convert back into the positional `[address, storageKeys[]]` tuple used by
     * the envelope's `accessList` field.
     *
     * @returns {AccessListTuple}
     */
    toTuple() {
        return [this._address ?? new Uint8Array(), [...this._storageKeys]];
    }

    /**
     * @returns {?EvmAddress} the address, or `null` when none is set
     */
    getAddress() {
        return this._address == null || this._address.length === 0
            ? null
            : EvmAddress.fromBytes(this._address);
    }

    /**
     * @returns {Uint8Array} the raw address bytes (empty when none is set)
     */
    getAddressBytes() {
        return this._address ?? new Uint8Array();
    }

    /**
     * @param {EvmAddress | Uint8Array | string} address
     * @returns {this}
     */
    setAddress(address) {
        this._address =
            address instanceof EvmAddress
                ? address.toBytes()
                : bytesOrHexToBytes(address);
        return this;
    }

    /**
     * @returns {Uint8Array[]} the storage keys
     */
    getStorageKeys() {
        return [...this._storageKeys];
    }

    /**
     * @param {Uint8Array[]} storageKeys
     * @returns {this}
     */
    setStorageKeys(storageKeys) {
        this._storageKeys = [...storageKeys];
        return this;
    }

    /**
     * @param {Uint8Array | string} storageKey
     * @returns {this}
     */
    addStorageKey(storageKey) {
        this._storageKeys.push(bytesOrHexToBytes(storageKey));
        return this;
    }
}
