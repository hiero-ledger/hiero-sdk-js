import CryptoJS from "crypto-js";
import * as hex from "../encoding/hex.js";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */

/**
 *
 * @param data
 */
export async function digest(data) {
    return Promise.resolve(
        hex.decode(
            CryptoJS.SHA256(CryptoJS.enc.Hex.parse(hex.encode(data))).toString(
                CryptoJS.enc.Hex,
            ),
        ),
    );
}
