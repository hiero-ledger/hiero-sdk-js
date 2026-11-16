// SPDX-License-Identifier: Apache-2.0

import ClprSignatureScheme from "./ClprSignatureScheme.js";

/**
 * The proof fields shared by Channel and Connector completion bodies.
 * @typedef {object} ProofBody
 * @property {Uint8Array | null} [publicKey]
 * @property {Uint8Array | null} [signature]
 * @property {number | null} [signatureScheme]
 */

/**
 * An immutable ownership proof containing no private key.
 * @internal
 */
export default class OwnershipProof {
    /** @type {Uint8Array} */
    #publicKey;

    /** @type {Uint8Array} */
    #signature;

    /**
     * @param {object} props
     * @param {ClprSignatureScheme} props.scheme
     * @param {Uint8Array} props.publicKey
     * @param {Uint8Array} props.signature
     */
    constructor({ scheme, publicKey, signature }) {
        /** @readonly */
        this.scheme = scheme;
        this.#publicKey = new Uint8Array(publicKey);
        this.#signature = new Uint8Array(signature);

        Object.freeze(this);
    }

    /**
     * @returns {Uint8Array}
     */
    get publicKey() {
        return new Uint8Array(this.#publicKey);
    }

    /**
     * @returns {Uint8Array}
     */
    get signature() {
        return new Uint8Array(this.#signature);
    }

    /**
     * @returns {boolean}
     */
    isComplete() {
        return this.#publicKey.length > 0 && this.#signature.length > 0;
    }

    /**
     * @param {ProofBody} body
     * @returns {OwnershipProof}
     */
    static _fromProtobuf(body) {
        return new OwnershipProof({
            scheme: ClprSignatureScheme._fromCode(body.signatureScheme ?? 0),
            publicKey: body.publicKey ?? new Uint8Array(),
            signature: body.signature ?? new Uint8Array(),
        });
    }

    /**
     * @returns {ProofBody}
     */
    _toProtobuf() {
        return {
            publicKey: this.publicKey,
            signature: this.signature,
            signatureScheme: this.scheme.valueOf(),
        };
    }
}
