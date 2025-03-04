// SPDX-License-Identifier: Apache-2.0

import AccountId from "./AccountId.js";
import Hbar from "../Hbar.js";
import ObjectMap from "../ObjectMap.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransferList} HieroProto.proto.ITransferList
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 */

/**
 * @typedef {import("../long.js").LongObject} LongObject
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * @augments {ObjectMap<AccountId, Hbar>}
 */
export default class HbarTransferMap extends ObjectMap {
    constructor() {
        super((s) => AccountId.fromString(s));
    }

    /**
     * @param {HieroProto.proto.ITransferList} transfers
     * @returns {HbarTransferMap}
     */
    static _fromProtobuf(transfers) {
        const accountTransfers = new HbarTransferMap();

        for (const transfer of transfers.accountAmounts != null
            ? transfers.accountAmounts
            : []) {
            const account = AccountId._fromProtobuf(
                /** @type {HieroProto.proto.IAccountID} */ (transfer.accountID),
            );

            accountTransfers._set(
                account,
                Hbar.fromTinybars(/** @type {Long} */ (transfer.amount)),
            );
        }

        return accountTransfers;
    }
}
