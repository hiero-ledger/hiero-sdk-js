import createHash from "create-hash";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function digest(data) {
    // fallback to trying node-crypto which could be polyfilled by the browser environment
    return Promise.resolve(createHash("sha384").update(data).digest());
}

/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function digestSync(data) {
    return createHash("sha384").update(data).digest();
}
