// SPDX-License-Identifier: Apache-2.0

import ObjectMap from "../ObjectMap.js";
import TransactionId from "./TransactionId.js";
import SignaturePairMap from "./SignaturePairMap.js";
import * as HieroProto from "@hashgraph/proto";

/**
 * @augments {ObjectMap<TransactionId, SignaturePairMap>}
 */
export default class NodeAccountIdSignatureMap extends ObjectMap {
    constructor() {
        super((s) => TransactionId.fromString(s));
    }

    /**
     * This function is used to create a NodeAccountIdSignaturemap from an already built transaction.
     * @param { import('./List.js').default<import("@hashgraph/proto").proto.ISignedTransaction>} signedTransactions
     * @returns {NodeAccountIdSignatureMap}
     */
    static _fromSignedTransactions(signedTransactions) {
        const signatures = new NodeAccountIdSignatureMap();

        for (const { bodyBytes, sigMap } of signedTransactions.list) {
            if (bodyBytes != null && sigMap != null) {
                const body = HieroProto.proto.TransactionBody.decode(bodyBytes);

                if (body.transactionID != null) {
                    const transactionId = TransactionId._fromProtobuf(
                        body.transactionID,
                    );

                    signatures._set(
                        transactionId,
                        SignaturePairMap._fromTransactionSigMap(sigMap),
                    );
                }
            }
        }

        return signatures;
    }

    /**
     *
     * Adds a signature pair for this transaction id.
     * @param {TransactionId} txId
     * @param {import("../SignerSignature.js").PublicKey} publicKey
     * @param {Uint8Array} signature
     */
    addSignature(txId, publicKey, signature) {
        const sigPairMap = this.get(txId);
        if (sigPairMap) {
            sigPairMap.addSignature(publicKey, signature);
        } else {
            this._set(
                txId,
                new SignaturePairMap().addSignature(publicKey, signature),
            );
        }
    }
}
