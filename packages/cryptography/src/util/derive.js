import { pbkdf2 } from "@exodus/crypto/pbkdf2";

/**
 * @param {Uint8Array} seed
 * @param {number} index
 * @returns {Promise<Uint8Array>}
 */
export function legacy(seed, index) {
    const password = new Uint8Array(seed.length + 8);
    password.set(seed, 0);

    const view = new DataView(
        password.buffer,
        password.byteOffset,
        password.byteLength
    );

    if (index === 0xffffffffff) {
        view.setInt32(seed.length + 0, 0xff);
        view.setInt32(seed.length + 4, -1); // 0xffffffff
    } else {
        view.setInt32(seed.length + 0, index < 0 ? -1 : 0);
        view.setInt32(seed.length + 4, index);
    }

    const salt = Uint8Array.from([0xff]);
    return pbkdf2('sha512', password, salt, { iterations: 2048, dkLen: 32 }, 'uint8');
}
