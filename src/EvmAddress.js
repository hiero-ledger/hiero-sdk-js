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
     * @param {string} evmAddress - The hex string representing the EVM address
     * @returns {EvmAddress}
     * @throws {Error} If the input string is not the correct size
     */
    static fromString(evmAddress) {
        evmAddress = evmAddress.startsWith("0x")
            ? evmAddress.slice(2)
            : evmAddress;

        // Standard EVM address is 20 bytes which is 40 hex characters
        if (evmAddress.length !== 40) {
            throw new Error("Input EVM address string is not the correct size");
        }

        return new EvmAddress(hex.decode(evmAddress));
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
