// SPDX-License-Identifier: Apache-2.0

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export async function digest(data) {
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    // This will be executed in a browser environment so the crypto object should be available if its
    // in secure context.
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    return new Uint8Array(await window.crypto.subtle.digest("SHA-384", data));
}
