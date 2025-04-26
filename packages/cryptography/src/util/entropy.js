import * as sha256 from "../primitive/sha256.js";

/**
 * @param {string[]} words
 * @param {string[]} wordlist
 * @returns {[Uint8Array, number]}
 */
export function legacy1(words, wordlist) {
    const indicies = words.map((word) => wordlist.indexOf(word.toLowerCase()));

    const data = convertRadix(indicies, wordlist.length, 256, 33);
    const checksum = data[data.length - 1];
    const result = new Uint8Array(data.length - 1);

    for (let i = 0; i < data.length - 1; i += 1) {
        result[i] = data[i] ^ checksum;
    }

    return [result, checksum];
}

/**
 * @param {string[]} words
 * @param {string[]} wordlist
 * @returns {Promise<Uint8Array>}
 */
export async function legacy2(words, wordlist) {
    const concatBitsLen = words.length * 11;
    /** @type {boolean[]} */
    const concatBits = [];
    concatBits.fill(false, 0, concatBitsLen);

    for (const [wordIndex, word] of words.entries()) {
        const index = wordlist.indexOf(word.toLowerCase());

        if (index < 0) {
            throw new Error(`Word not found in wordlist: ${word}`);
        }

        for (let i = 0; i < 11; i += 1) {
            concatBits[wordIndex * 11 + i] = (index & (1 << (10 - i))) !== 0;
        }
    }

    const checksumBitsLen = concatBitsLen / 33;
    const entropyBitsLen = concatBitsLen - checksumBitsLen;
    const entropy = new Uint8Array(entropyBitsLen / 8);

    for (let i = 0; i < entropy.length; i += 1) {
        for (let j = 0; j < 8; j += 1) {
            if (concatBits[i * 8 + j]) {
                entropy[i] |= 1 << (7 - j);
            }
        }
    }

    // Checksum validation
    const hash = await sha256.digest(entropy);
    const hashBits = bytesToBits(hash);

    for (let i = 0; i < checksumBitsLen; i += 1) {
        if (concatBits[entropyBitsLen + i] !== hashBits[i]) {
            throw new Error("Checksum mismatch");
        }
    }

    return entropy;
}

/**
 * @param {Uint8Array} data
 * @returns {number}
 */
export function crc8(data) {
    let crc = 0xff;

    for (let i = 0; i < data.length - 1; i += 1) {
        crc ^= data[i];
        for (let j = 0; j < 8; j += 1) {
            crc = (crc >>> 1) ^ ((crc & 1) === 0 ? 0 : 0xb2);
        }
    }

    return crc ^ 0xff;
}

/**
 * @param {number[]} nums
 * @param {number} fromRadix
 * @param {number} toRadix
 * @param {number} toLength
 * @returns {Uint8Array}
 */
export function convertRadix(nums, fromRadix, toRadix, toLength) {
    let num = BigInt(0);

    for (const element of nums) {
        num = num * BigInt(fromRadix);
        num = num + BigInt(element);
    }

    const result = new Uint8Array(toLength);

    for (let i = toLength - 1; i >= 0; i -= 1) {
        const tem = num / BigInt(toRadix);
        const rem = num % BigInt(toRadix);
        num = tem;
        result[i] = Number(rem);
    }

    return result;
}

/**
 * @param {Uint8Array} data
 * @returns {boolean[]}
 */
export function bytesToBits(data) {
    /** @type {boolean[]} */
    const bits = [];
    bits.fill(false, 0, data.length * 8);

    for (let i = 0; i < data.length; i += 1) {
        for (let j = 0; j < 8; j += 1) {
            bits[i * 8 + j] = (data[i] & (1 << (7 - j))) !== 0;
        }
    }

    return bits;
}
