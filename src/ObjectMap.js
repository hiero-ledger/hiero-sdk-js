// SPDX-License-Identifier: Apache-2.0

/**
 * A simple "map" type that allows indexing by objects other than
 * strings, numbers, or booleans, and doesn't use the object pointer.
 *
 * @abstract
 * @template {{ toString(): string }} KeyT
 * @template {any} ValueT
 */
export default class ObjectMap {
    /**
     * @param {(s: string) => KeyT} fromString
     */
    constructor(fromString) {
        /**
         * This map is from the stringified version of the key, to the value
         *
         * @type {Map<string, ValueT>}
         */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this._map = new Map();

        /**
         * This map is from the key, to the value
         *
         * @type {Map<KeyT, ValueT>}
         */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.__map = new Map();

        /**
         * A function pointer to convert a key into a string. So we can set each
         * value in both maps.
         */
        this._fromString = fromString;
    }

    /**
     * Get a value by key or string.
     *
     * This is the main benefit of this class. If a user provides a `KeyT` we
     * implicitly serialize it to a string and use the string version. Otherwise
     * the user will get `undefined` even for a key that exists in the map since
     * the `KeyT` the provided has a different pointer than the one we have stored.
     * The string version doesn't have this issue since JS hashes the string and
     * that would result in both `KeyT` hitting the same value even if they're
     * different pointers.
     *
     * @param {KeyT | string} key
     * @returns {?ValueT}
     */
    get(key) {
        const k = typeof key === "string" ? key : key.toString();

        const value = this._map.get(k);
        return value != null ? value : null;
    }

    /**
     * Set the key to a value in both maps
     *
     * @internal
     * @param {KeyT} key
     * @param {ValueT} value
     */
    _set(key, value) {
        const k = typeof key === "string" ? key : key.toString();

        this._map.set(k, value);
        this.__map.set(key, value);
    }

    /**
     * Create iterator of values
     *
     * @returns {IterableIterator<ValueT>}
     */
    values() {
        return this._map.values();
    }

    /**
     * Get the size of the map
     *
     * @returns {number}
     */
    get size() {
        return this._map.size;
    }

    /**
     * Get the keys of the map.
     *
     * @returns {IterableIterator<KeyT>}
     */
    keys() {
        return this.__map.keys();
    }

    /**
     * Create an iterator over key, value pairs
     *
     * @returns {IterableIterator<[KeyT, ValueT]>}
     */
    [Symbol.iterator]() {
        return this.__map[Symbol.iterator]();
    }

    /**
     * Stringify the map into _something_ readable.
     * **NOTE**: This implementation is not stable and can change.
     *
     * @returns {string}
     */
    toString() {
        /** @type {{[key: string]: any}} */
        const map = {};

        for (const [key, value] of this._map) {
            map[key] = value;
        }

        return JSON.stringify(map);
    }

    toJSON() {
        const obj = {};

        this._map.forEach((value, key) => {
            // @ts-ignore
            obj[key] = value;
        });

        return obj;
    }
}
