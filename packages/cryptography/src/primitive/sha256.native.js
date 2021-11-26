import createHash from "create-hash";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function digest(data) {
    // fallback to trying node-crypto which could be polyfilled by the browser environment
    return createHash("sha256").update(data).digest();
}
