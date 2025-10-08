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
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {?Uint8Array}
         */
        this.key = null;

        /**
         * @protected
         * @type {?Uint8Array}
         */
        this.value = null;

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
        this.key = key;
        return this;
    }

    /**
     *
     * @param {Uint8Array} value
     * @returns {this}
     */
    setValue(value) {
        this.value = value;
        return this;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    getKey() {
        return this.key;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    getValue() {
        return this.value;
    }

    /**
     *
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaMappingEntry} lambdaMappingEntry
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
        });
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaMappingEntry}
     */
    _toProtobuf() {
        return {
            key: this.key,
            value: this.value,
        };
    }
}

export default LambdaMappingEntry;
