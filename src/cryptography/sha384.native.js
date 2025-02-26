// SPDX-License-Identifier: Apache-2.0

import CryptoJS from "crypto-js";
import * as hex from "../encoding/hex.js";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function digest(data) {
    return Promise.resolve(
        hex.decode(
            CryptoJS.SHA384(CryptoJS.enc.Hex.parse(hex.encode(data))).toString(
                CryptoJS.enc.Hex,
            ),
        ),
    );
}
