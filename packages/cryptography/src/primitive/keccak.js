import { keccak_256 } from "@noble/hashes/sha3";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";

/**
 * Keccak-256 (Ethereum variant).
 *
 * Accepts a `0x`-prefixed hex string or a raw UTF-8 string and returns the
 * `0x`-prefixed hex digest, preserving the API of the previous hand-rolled
 * implementation.
 * @param {string} message
 * @returns {string}
 */
export function keccak256(message) {
    const data = message.startsWith("0x")
        ? hex.decode(message)
        : utf8.encode(message);

    return "0x" + hex.encode(keccak_256(data));
}
