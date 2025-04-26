import { hash } from "@exodus/crypto/hash";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function digest(data) {
  return hash('sha256', data, 'uint8')
}
