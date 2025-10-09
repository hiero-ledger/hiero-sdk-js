import LambdaMappingEntry from "./LambdaMappingEntry.js";

/**
 *
 * @abstract
 * Specifies a key/value pair in the storage of a lambda, either by the explicit storage
 * slot contents; or by a combination of a Solidity mapping's slot key and the key into
 * that mapping.
 */
class LambdaStorageUpdate {
    /**
     *
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate} lambdaStorageUpdate
     * @returns {LambdaStorageUpdate}
     */
    static _fromProtobuf(lambdaStorageUpdate) {
        if (lambdaStorageUpdate.storageSlot != null) {
            return LambdaStorageSlot._fromProtobuf(lambdaStorageUpdate);
        }

        if (lambdaStorageUpdate.mappingEntries != null) {
            return LambdaMappingEntries._fromProtobuf(lambdaStorageUpdate);
        }

        throw new Error(
            "LambdaStorageUpdate must have either storage_slot or mapping_entries set",
        );
    }

    /**
     * @abstract
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate}
     */
    _toProtobuf() {
        throw new Error(
            "LambdaStorageUpdate._toProtobuf must be implemented by a subclass",
        );
    }
}

/**
 * A slot in the storage of a lambda EVM hook.
 */
class LambdaStorageSlot extends LambdaStorageUpdate {
    /**
     * @param {object} props
     * @param {Uint8Array} [props.key]
     * @param {Uint8Array} [props.value]
     */
    constructor(props = {}) {
        super();
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
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate} lambdaStorageSlot
     * @returns {LambdaStorageSlot}
     */
    static _fromProtobuf(lambdaStorageSlot) {
        if (lambdaStorageSlot.storageSlot != null) {
            return new LambdaStorageSlot({
                key:
                    lambdaStorageSlot.storageSlot.key != null
                        ? lambdaStorageSlot.storageSlot.key
                        : undefined,
                value:
                    lambdaStorageSlot.storageSlot.value != null
                        ? lambdaStorageSlot.storageSlot.value
                        : undefined,
            });
        }
        throw new Error(
            "LambdaStorageSlot._fromProtobuf must be implemented by a subclass",
        );
    }

    /**
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.LambdaStorageUpdate}
     */
    _toProtobuf() {
        return {
            storageSlot: {
                key: this._key,
                value: this._value,
            },
        };
    }
}

/**
 * Specifies storage slot updates via indirection into a Solidity mapping.
 * <p>
 * Concretely, if the Solidity mapping is itself at slot `mapping_slot`, then
 * the * storage slot for key `key` in the mapping is defined by the relationship
 * `key_storage_slot = keccak256(abi.encodePacked(mapping_slot, key))`.
 * <p>
 * This message lets a metaprotocol be specified in terms of changes to a
 * Solidity mapping's entries. If only raw slots could be updated, then a block
 * stream consumer following the metaprotocol would have to invert the Keccak256
 * hash to determine which mapping entry was being updated, which is not possible.
 */
class LambdaMappingEntries extends LambdaStorageUpdate {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.mappingSlot]
     * @param {import("./LambdaMappingEntry.js").default[]} [props.entries]
     */
    constructor(props = {}) {
        super();
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._mappingSlot = null;

        /**
         * @private
         * @type {?import("./LambdaMappingEntry.js").default[]}
         */
        this._entries = null;

        if (props.mappingSlot != null) {
            this.setMappingSlot(props.mappingSlot);
        }

        if (props.entries != null) {
            this.setEntries(props.entries);
        }
    }

    /**
     *
     * @param {Uint8Array} mappingSlot
     * @returns {this}
     */
    setMappingSlot(mappingSlot) {
        this._mappingSlot = mappingSlot;
        return this;
    }

    /**
     *
     * @param {import("./LambdaMappingEntry.js").default[]} entries
     * @returns {this}
     */
    setEntries(entries) {
        this._entries = entries;
        return this;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    get mappingSlot() {
        return this._mappingSlot;
    }

    /**
     *
     * @returns {import("./LambdaMappingEntry.js").default[] | null}
     */
    get entries() {
        return this._entries;
    }

    /**
     *
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate} lambdaStorageUpdate
     * @returns {LambdaMappingEntries}
     */
    static _fromProtobuf(lambdaStorageUpdate) {
        return new LambdaMappingEntries({
            mappingSlot:
                lambdaStorageUpdate.mappingEntries?.mappingSlot != null
                    ? lambdaStorageUpdate.mappingEntries.mappingSlot
                    : undefined,
            entries: lambdaStorageUpdate.mappingEntries?.entries?.map((entry) =>
                LambdaMappingEntry._fromProtobuf(entry),
            ),
        });
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate}
     */
    _toProtobuf() {
        return {
            mappingEntries: {
                mappingSlot: this._mappingSlot,
                entries:
                    this._entries != null
                        ? this._entries.map((entry) => entry._toProtobuf())
                        : null,
            },
        };
    }
}

export { LambdaStorageUpdate, LambdaStorageSlot, LambdaMappingEntries };
