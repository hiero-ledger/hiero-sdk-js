// SPDX-License-Identifier: Apache-2.0

import Key from "./Key.js";
import * as hex from "./encoding/hex.js";
import { arrayEqual } from "./util.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IKey} HieroProto.proto.IKey
 */

/**
 * @typedef {import("./client/Client.js").default<*, *>} Client
 */

/**
 *  Represents an Ethereum Virtual Machine (EVM) address.
 * This class extends the Key class and provides functionality for handling EVM addresses.
 */
export default class EvmAddress extends Key {
    /**
     * @internal
     * @param {Uint8Array} bytes
     */
    constructor(bytes) {
        super();
        this._bytes = bytes;
    }

    /**
     * Creates an EvmAddress from a hex string representation.
     * @param {string} text - The hex string representing the EVM address
     * @returns {EvmAddress}
     * @throws {Error} If the input string is not the correct size
     */
    static fromString(text) {
        const EVM_ADDRESS_BYTES = 20; // Standard EVM address is 20 bytes
        const prefix = "0x";
        const hasPrefix = text.toLowerCase().startsWith(prefix);

        // Check input length (40 hex chars = 20 bytes, +2 if has prefix)
        const expectedLength =
            EVM_ADDRESS_BYTES * 2 + (hasPrefix ? prefix.length : 0);
        if (text.length !== expectedLength) {
            throw new Error("Input EVM address string is not the correct size");
        }

        return new EvmAddress(hex.decode(text));
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {EvmAddress}
     */
    static fromBytes(bytes) {
        return new EvmAddress(bytes);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return this._bytes;
    }

    /**
     * @returns {string}
     */
    toString() {
        return hex.encode(this._bytes);
    }

    /**
     * @param {EvmAddress} other
     * @returns {boolean}
     */
    equals(other) {
        return arrayEqual(this._bytes, other._bytes);
    }
}
