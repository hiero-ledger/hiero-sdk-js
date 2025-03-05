// this will be executed in browser environment so we can use window.crypto
/* eslint-disable n/no-unsupported-features/node-builtins */

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export async function digest(data) {
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}
