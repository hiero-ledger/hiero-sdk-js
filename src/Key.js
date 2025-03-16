// SPDX-License-Identifier: Apache-2.0

import CACHE from "./Cache.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IKey} HieroProto.proto.IKey
 */

export default class Key {
    /**
     * @internal
     * @abstract
     * @returns {HieroProto.proto.IKey}
     */
    // eslint-disable-next-line jsdoc/require-returns-check
    _toProtobufKey() {
        throw new Error("not implemented");
    }

    /**
     * @internal
     * @param {HieroProto.proto.IKey} key
     * @returns {Key}
     */
    static _fromProtobufKey(key) {
        if (key.contractID != null) {
            return CACHE.contractId(key.contractID);
        }

        if (key.delegatableContractId != null) {
            return CACHE.delegateContractId(key.delegatableContractId);
        }

        if (key.ed25519 != null && key.ed25519.byteLength > 0) {
            return CACHE.publicKeyED25519(key.ed25519);
        }

        if (key.ECDSASecp256k1 != null && key.ECDSASecp256k1.byteLength > 0) {
            return CACHE.publicKeyECDSA(key.ECDSASecp256k1);
        }

        if (key.thresholdKey != null && key.thresholdKey.threshold != null) {
            return CACHE.thresholdKey(key.thresholdKey);
        }

        if (key.keyList != null) {
            return CACHE.keyList(key.keyList);
        }

        // @ts-ignore
        return null;

        /* throw new Error(
            `(BUG) keyFromProtobuf: not implemented key case: ${JSON.stringify(
                key
            )}`
        ); */
    }
}
