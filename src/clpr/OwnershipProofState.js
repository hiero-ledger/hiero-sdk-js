// SPDX-License-Identifier: Apache-2.0

import { arrayEqual } from "../util.js";
import OwnershipProof from "./OwnershipProof.js";
import { sign } from "./ownership.js";

/**
 * @typedef {import("./OwnershipProof.js").ProofBody} ProofBody
 * @typedef {import("./ClprSignatureScheme.js").default} ClprSignatureScheme
 * @typedef {import("../PrivateKey.js").default} PrivateKey
 */

/**
 * Owns the mutable proof lifecycle shared by CLPR completion transactions.
 * Transactions choose their bound fields and signing preimages. This helper
 * stores only the immutable proof value, never the ownership private key.
 * @internal
 */
export default class OwnershipProofState {
    /** @type {?OwnershipProof} */
    #proof = null;

    /**
     * Clears the proof only when a validated bound value changes bytes.
     * @param {?Uint8Array} previous
     * @param {Uint8Array} next
     * @returns {void}
     */
    clearIfChanged(previous, next) {
        if (previous == null || !arrayEqual(previous, next)) {
            this.#proof = null;
        }
    }

    /**
     * Signs and stores the proof only after signing succeeds.
     * @param {PrivateKey} privateKey
     * @param {Uint8Array} preimage
     * @returns {void}
     */
    sign(privateKey, preimage) {
        this.#proof = sign(privateKey, preimage);
    }

    /**
     * Restores wire proof fields after the transaction's bound inputs are set.
     * An absent proof stays null, including when its scheme defaults to ECDSA.
     * @param {ProofBody} body
     * @returns {void}
     */
    restore(body) {
        this.#proof =
            body.publicKey?.length || body.signature?.length
                ? OwnershipProof._fromProtobuf(body)
                : null;
    }

    /**
     * Returns copied public key bytes, or null without a proof.
     * @returns {?Uint8Array}
     */
    get publicKey() {
        return this.#proof?.publicKey ?? null;
    }

    /**
     * Returns copied signature bytes, or null without a proof.
     * @returns {?Uint8Array}
     */
    get signature() {
        return this.#proof?.signature ?? null;
    }

    /**
     * Returns the scheme, including ECDSA code zero, or null without a proof.
     * @returns {?ClprSignatureScheme}
     */
    get signatureScheme() {
        return this.#proof?.scheme ?? null;
    }

    /**
     * Applies the same completeness rule during freeze and before execution.
     * @param {string} transactionName
     * @returns {void}
     */
    requireComplete(transactionName) {
        if (this.#proof == null || !this.#proof.isComplete()) {
            throw new Error(
                `${transactionName}: a complete ownership proof must be set before freezing or executing.`,
            );
        }
    }

    /**
     * @returns {ProofBody}
     */
    _toProtobuf() {
        return this.#proof?._toProtobuf() ?? {};
    }
}
