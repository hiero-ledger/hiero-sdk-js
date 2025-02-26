// SPDX-License-Identifier: Apache-2.0

/**
 * A simple efficient function for comparing byte arrays
 *
 * @param {Uint8Array} array1
 * @param {Uint8Array} array2
 * @returns {boolean}
 */
export function arrayEqual(array1, array2) {
    if (array1 === array2) {
        return true;
    }

    if (array1.byteLength !== array2.byteLength) {
        return false;
    }

    const view1 = new DataView(
        array1.buffer,
        array1.byteOffset,
        array1.byteLength,
    );
    const view2 = new DataView(
        array2.buffer,
        array2.byteOffset,
        array2.byteLength,
    );

    let i = array1.byteLength;

    while (i--) {
        if (view1.getUint8(i) !== view2.getUint8(i)) {
            return false;
        }
    }

    return true;
}

/**
 * @param {Uint8Array} array
 * @param {Uint8Array} arrayPrefix
 * @returns {boolean}
 */
export function arrayStartsWith(array, arrayPrefix) {
    if (array.byteLength < arrayPrefix.byteLength) {
        return false;
    }

    let i = arrayPrefix.byteLength;

    while (i--) {
        if (array[i] !== arrayPrefix[i]) {
            return false;
        }
    }

    return true;
}
