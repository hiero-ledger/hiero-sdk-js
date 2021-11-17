import { PublicKey } from "@exodus/hashgraph-cryptography";
import ObjectMap from "../ObjectMap.js";

/**
 * @augments {ObjectMap<PublicKey, Uint8Array>}
 */
export default class NodeAccountIdSignatureMap extends ObjectMap {
    constructor() {
        super((s) => PublicKey.fromString(s));
    }

    /**
     * @param {import("@exodus/hashgraph-proto").ISignatureMap} sigMap
     * @returns {NodeAccountIdSignatureMap}
     */
    static _fromTransactionSigMap(sigMap) {
        const signatures = new NodeAccountIdSignatureMap();

        const sigPairs = sigMap.sigPair != null ? sigMap.sigPair : [];

        for (const sigPair of sigPairs) {
            if (sigPair.pubKeyPrefix != null && sigPair.ed25519 != null) {
                signatures._set(
                    PublicKey.fromBytes(sigPair.pubKeyPrefix),
                    sigPair.ed25519
                );
            }
        }

        return signatures;
    }
}
