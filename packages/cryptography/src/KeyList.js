import Key from "./Key.js";

/**
 * A list of Keys (`Key`) with an optional threshold.
 */
export default class KeyList extends Key {
    /**
     * @param {?Key[]} [keys]
     * @param {?number} [threshold]
     */
    constructor(keys, threshold) {
        super();

        /**
         * @private
         * @type {Key[]}
         */
        // @ts-ignore
        if (keys == null) this._keys = [];
        //checks if the value for `keys` is passed as a single key
        //rather than a list that contains just one key
        else if (keys instanceof Key) this._keys = [keys];
        else this._keys = keys;

        /**
         * @type {?number}
         */
        this._threshold = threshold == null ? null : threshold;
    }

    /**
     * @param {Key[]} keys
     * @returns {KeyList}
     */
    static of(...keys) {
        return new KeyList(keys, null);
    }

    /**
     * @template T
     * @param {ArrayLike<Key>} arrayLike
     * @param {((key: Key) => Key)} [mapFn]
     * @param {T} [thisArg]
     * @returns {KeyList}
     */
    static from(arrayLike, mapFn, thisArg) {
        if (mapFn == null) {
            return new KeyList(Array.from(arrayLike));
        }

        return new KeyList(Array.from(arrayLike, mapFn, thisArg));
    }

    /**
     * @returns {?number}
     */
    get threshold() {
        return this._threshold;
    }

    /**
     * @param {number} threshold
     * @returns {this}
     */
    setThreshold(threshold) {
        this._threshold = threshold;
        return this;
    }

    /**
     * @param {Key[]} keys
     * @returns {number}
     */
    push(...keys) {
        return this._keys.push(...keys);
    }

    /**
     * @param {number} start
     * @param {number} deleteCount
     * @param {Key[]} items
     * @returns {KeyList}
     */
    splice(start, deleteCount, ...items) {
        return new KeyList(
            this._keys.splice(start, deleteCount, ...items),
            this.threshold,
        );
    }

    /**
     * @param {number=} start
     * @param {number=} end
     * @returns {KeyList}
     */
    slice(start, end) {
        return new KeyList(this._keys.slice(start, end), this.threshold);
    }

    /**
     * @returns {Iterator<Key>}
     */
    [Symbol.iterator]() {
        return this._keys[Symbol.iterator]();
    }

    /**
     * @returns {Key[]}
     */
    toArray() {
        return this._keys.slice();
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify({
            threshold: this._threshold,
            keys: this._keys.toString(),
        });
    }
}
