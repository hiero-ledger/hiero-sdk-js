/* eslint-disable deprecation/deprecation */
import NodeAccountIdSignatureMapLegacy from "./NodeAccountIdSignatureMapLegacy.js";
import ObjectMap from "../ObjectMap.js";
import AccountId from "../account/AccountId.js";

/**
 * @deprecated
 * @augments {ObjectMap<AccountId, NodeAccountIdSignatureMapLegacy>}
 */
export default class SignatureMap extends ObjectMap {
    constructor() {
        super((s) => AccountId.fromString(s));
    }

    /**
     * @param {import("./Transaction.js").default} transaction
     * @returns {SignatureMap}
     */
    static _fromTransaction(transaction) {
        const signatures = new SignatureMap();

        for (let i = 0; i < transaction._nodeAccountIds.length; i++) {
            const sigMap = transaction._signedTransactions.get(i).sigMap;

            if (sigMap != null) {
                signatures._set(
                    transaction._nodeAccountIds.list[i],
                    NodeAccountIdSignatureMapLegacy._fromTransactionSigMap(
                        sigMap,
                    ),
                );
            }
        }

        return signatures;
    }
}
