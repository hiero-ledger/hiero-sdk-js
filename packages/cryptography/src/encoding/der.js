/**
 * @typedef {object} AsnSeq
 * @property {AsnType[]} seq
 */

/**
 * @typedef {object} AsnInt
 * @property {number} int
 */

/**
 * @typedef {object} AsnBytes
 * @property {Uint8Array} bytes
 */

/**
 * @typedef {object} AsnIdent
 * @property {string} ident
 */

/**
 * @typedef {{}} AsnNull
 */

/**
 * @typedef {AsnSeq | AsnInt | AsnBytes | AsnIdent | AsnNull} AsnType
 */

/**
 * Throws an `Error` on malformed input, such as `invalid DER: data too short`.
 * Catch and rethrow it with, e.g. `BadKeyError`.
 *@param {Uint8Array} data
 *@returns {AsnType}
 */
export function decode(data) {
    return decodeIncremental(data)[0];
}

/**
 * @param {Uint8Array} bytes
 * @returns {[AsnType, Uint8Array]}
 */
function decodeIncremental(bytes) {
    if (bytes.length === 0) {
        throw new Error("invalid DER: data too short");
    }

    // slice off the initial tag byte, `decodeLength` returns a slice of the remaining data
    const [len, rem] = decodeLength(bytes.subarray(1));

    if (len > rem.length) {
        throw new Error("invalid DER: data too short");
    }

    const data = rem.subarray(0, len);
    const tail = rem.subarray(len);

    switch (bytes[0]) {
        case 2:
            if (data.length === 0) {
                throw new Error("invalid DER: INTEGER has no content");
            }

            return [{ int: decodeInt(data) }, tail];
        case 4: // must always be primitive form in DER; for OCTET STRING this is literal bytes
            return [{ bytes: data }, tail];
        case 5: // empty
            return [{}, tail];
        case 6:
            return [{ ident: decodeObjectIdent(data) }, tail];
        case 48:
            return [{ seq: decodeSeq(data) }, tail];
        default:
            throw new Error(`unsupported DER type tag: ${bytes[0]}`);
    }
}

/**
 * @param {Uint8Array} seqBytes
 * @returns {AsnType[]}
 */
function decodeSeq(seqBytes) {
    let data = seqBytes;

    const seq = [];

    while (data.length !== 0) {
        const [decoded, remaining] = decodeIncremental(data);
        seq.push(decoded);
        data = remaining;
    }

    return seq;
}

/**
 * @param {Uint8Array} idBytes
 * @returns {string}
 */
function decodeObjectIdent(idBytes) {
    if (idBytes.length === 0) {
        throw new Error("invalid DER: OBJECT IDENTIFIER has no content");
    }

    // the last byte of every component has the MSB clear
    if (idBytes[idBytes.length - 1] >= 128) {
        throw new Error("invalid DER: OBJECT IDENTIFIER is cut off");
    }

    const id = [
        // first octet is 40 * value1 + value2
        Math.floor(idBytes[0] / 40),
        idBytes[0] % 40,
    ];

    // each following ID component is big-endian base128 where the MSB is set if another byte
    // follows for the same value
    let val = 0;

    for (const byte of idBytes.subarray(1)) {
        // shift the entire value left by 7 bits
        val *= 128;

        if (byte < 128) {
            // no more octets follow for this value, finish it off
            val += byte;
            id.push(val);
            val = 0;
        } else {
            // zero the MSB
            val += byte & 127;
        }
    }

    return id.join(".");
}

/**
 * @param {Uint8Array} lenBytes
 * @returns {[number, Uint8Array]}
 */
function decodeLength(lenBytes) {
    if (lenBytes.length === 0) {
        throw new Error("invalid DER: data too short");
    }

    if (lenBytes[0] < 128) {
        // definite, short form
        return [lenBytes[0], lenBytes.subarray(1)];
    }

    const numBytes = lenBytes[0] - 128;

    if (numBytes === 0) {
        throw new Error("invalid DER: indefinite length");
    }

    if (numBytes > lenBytes.length - 1) {
        throw new Error("invalid DER: data too short");
    }

    const intBytes = lenBytes.subarray(1, numBytes + 1);
    const rem = lenBytes.subarray(numBytes + 1);

    return [decodeInt(intBytes), rem];
}

/**
 * @param {Uint8Array} intBytes
 * @returns {number}
 */
function decodeInt(intBytes) {
    const len = intBytes.length;
    if (len === 1) {
        return intBytes[0];
    }

    let view = new DataView(
        intBytes.buffer,
        intBytes.byteOffset,
        intBytes.byteLength,
    );

    if (len === 2) return view.getUint16(0, false);

    if (len === 3) {
        // prefix a zero byte and we'll treat it as a 32-bit int
        const data = Uint8Array.of(0, ...intBytes);
        view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    if (len > 4) {
        // this probably means a bug in the decoding as this would mean a >4GB structure
        throw new Error(`unsupported DER integer length of ${len} bytes`);
    }

    return view.getUint32(0, false);
}
