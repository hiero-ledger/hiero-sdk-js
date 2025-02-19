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
     * @param {string} text
     * @returns {EvmAddress}
     */
    static fromString(text) {
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
