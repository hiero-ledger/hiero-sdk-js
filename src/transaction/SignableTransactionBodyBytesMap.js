// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import ObjectMap from "../ObjectMap.js";
import { proto } from "@hashgraph/proto";

/**
 * @augments {ObjectMap<AccountId, Uint8Array>}
 */
export default class SignableTransactionBodyBytesMap extends ObjectMap {
    constructor() {
        super((s) => AccountId.fromString(s));
    }

    /**
     * Build a map of NodeAccountId => bodyBytes from a frozen transaction
     *
     * @param {import("./Transaction.js").default} transaction
     * @returns {SignableTransactionBodyBytesMap}
     */
    static _fromTransaction(transaction) {
        transaction._requireFrozen();

        const map = new SignableTransactionBodyBytesMap();

        for (const signedTransaction of transaction._signedTransactions.list) {
            if (!signedTransaction.bodyBytes) {
                throw new Error("Missing bodyBytes in signed transaction.");
            }

            const body = proto.TransactionBody.decode(
                signedTransaction.bodyBytes,
            );

            if (!body.nodeAccountID) {
                throw new Error("Missing nodeAccountID in transaction body.");
            }

            const nodeId = AccountId._fromProtobuf(body.nodeAccountID);
            map._set(nodeId, signedTransaction.bodyBytes);
        }

        return map;
    }
}
