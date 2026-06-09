/**
 * Normalize a typed array to one backed by an `ArrayBuffer` (rather than a
 * `SharedArrayBuffer`), as required by the WebCrypto `BufferSource` type.
 * Only copies when the input is not already `ArrayBuffer`-backed.
 * @param {Uint8Array} data
 * @returns {Uint8Array<ArrayBuffer>}
 */
export function toBufferSource(data) {
    return /** @type {Uint8Array<ArrayBuffer>} */ (
        data.buffer instanceof ArrayBuffer ? data : new Uint8Array(data)
    );
}

/**
 * Byte comparison utility
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
export function equalBytes(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
