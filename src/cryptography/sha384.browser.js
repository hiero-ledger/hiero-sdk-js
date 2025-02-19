// SPDX-License-Identifier: Apache-2.0

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export async function digest(data) {
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    return new Uint8Array(await window.crypto.subtle.digest("SHA-384", data));
}
