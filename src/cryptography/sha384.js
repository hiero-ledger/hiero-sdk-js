// SPDX-License-Identifier: Apache-2.0

import crypto from "crypto";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function digest(data) {
    // fallback to trying node-crypto which could be polyfilled by the browser environment
    return Promise.resolve(crypto.createHash("sha384").update(data).digest());
}

/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function digestSync(data) {
    return crypto.createHash("sha384").update(data).digest();
}
