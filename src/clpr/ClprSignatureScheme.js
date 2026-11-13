// SPDX-License-Identifier: Apache-2.0

/**
 * Ownership signature schemes supported by HIP-1535 CLPR.
 */
export default class ClprSignatureScheme {
    /**
     * @internal
     * @hideconstructor
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {number} code
     * @returns {ClprSignatureScheme}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return ClprSignatureScheme.ECDSA_SECP256K1;
            case 1:
                return ClprSignatureScheme.ED25519;
            default:
                throw new Error(
                    `unrecognized CLPR signature scheme code: ${code}`,
                );
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case ClprSignatureScheme.ECDSA_SECP256K1:
                return "ECDSA_SECP256K1";
            case ClprSignatureScheme.ED25519:
                return "ED25519";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @returns {number}
     */
    valueOf() {
        return this._code;
    }
}

/** ECDSA over secp256k1. */
ClprSignatureScheme.ECDSA_SECP256K1 = new ClprSignatureScheme(0);

/** Ed25519. */
ClprSignatureScheme.ED25519 = new ClprSignatureScheme(1);
