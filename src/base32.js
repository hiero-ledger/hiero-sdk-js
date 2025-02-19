// SPDX-License-Identifier: Apache-2.0

// HIP-32: https://hips.hedera.com/hip/hip-32
import { base32 } from "rfc4648";

const decodeOpts = { loose: true };
const encodeOpts = { pad: false };

/**
 * Decodes the rfc4648 base32 string into a {@link Uint8Array}. If the input string is null, returns null.
 * @param {string} str  the base32 string.
 * @returns {Uint8Array | ''}
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const decode = (str) => str && base32.parse(str, decodeOpts);

/**
 * Encodes the byte array into a rfc4648 base32 string without padding. If the input is null, returns null. Note with
 * the rfc4648 loose = true option, it allows lower case letters, padding, and auto corrects 0 -> O, 1 -> L, 8 -> B
 * @param {Buffer|Uint8Array} data
 * @returns {string}
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const encode = (data) => data && base32.stringify(data, encodeOpts);

export default {
    decode,
    encode,
};
