/**
 * An entry in a Solidity mapping. Very helpful for protocols that apply
 * `LambdaSStore` to manage the entries of a hook contract's mapping instead
 * its raw storage slots.
 * <p>
 * This is especially attractive when the mapping value itself fits in a single
 * word; for more complicated value storage layouts it becomes necessary to
 * combine the mapping update with additional `LambdaStorageSlot` updates that
 * specify the complete storage slots of the value type.
 */
class LambdaMappingEntry {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.key]
     * @param {Uint8Array} [props.value]
     * @param {Uint8Array} [props.preimage]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._key = null;

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._value = null;

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._preimage = null;

        if (props.preimage != null) {
            this.setPreimage(props.preimage);
        }

        if (props.key != null) {
            this.setKey(props.key);
        }

        if (props.value != null) {
            this.setValue(props.value);
        }
    }

    /**
     *
     * @param {Uint8Array} key
     * @returns {this}
     */
    setKey(key) {
        this._key = key;
        this._preimage = null;
        return this;
    }

    /**
     *
     * @param {Uint8Array} value
     * @returns {this}
     */
    setValue(value) {
        this._value = value;
        return this;
    }

    /**
     *
     * @param {Uint8Array} preimage
     * @returns {this}
     */
    setPreimage(preimage) {
        this._preimage = preimage;
        this._key = null;
        return this;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    get key() {
        return this._key;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    get value() {
        return this._value;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    get preimage() {
        return this._preimage;
    }

    /**
     *
     * @param {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.ILambdaMappingEntry} lambdaMappingEntry
     * @returns {LambdaMappingEntry}
     */
    static _fromProtobuf(lambdaMappingEntry) {
        return new LambdaMappingEntry({
            key:
                lambdaMappingEntry.key != null
                    ? lambdaMappingEntry.key
                    : undefined,
            value:
                lambdaMappingEntry.value != null
                    ? lambdaMappingEntry.value
                    : undefined,
            preimage:
                lambdaMappingEntry.preimage != null
                    ? lambdaMappingEntry.preimage
                    : undefined,
        });
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.ILambdaMappingEntry}
     */
    _toProtobuf() {
        return {
            key: this._key,
            value: this._value,
            preimage: this._preimage,
        };
    }
}

export default LambdaMappingEntry;
