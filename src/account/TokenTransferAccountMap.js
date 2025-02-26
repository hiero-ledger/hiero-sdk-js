// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @augments {ObjectMap<AccountId, Long>}
 */
export default class TokenTransferAccountMap extends ObjectMap {
    constructor() {
        super((s) => AccountId.fromString(s));
    }

    toJSON() {
        const obj = {};

        this._map.forEach((value, key) => {
            // @ts-ignore
            obj[key] = value.toString();
        });

        return obj;
    }
}
