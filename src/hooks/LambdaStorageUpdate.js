import LambdaMappingEntry from "./LambdaMappingEntry.js";

/**
 *
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
     *
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
                key: this.key,
                value: this.value,
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
    constructor(props) {
        super();
        /**
         * @protected
         * @type {?Uint8Array}
         */
        this.mappingSlot = null;
        /**
         * @protected
         * @type {?import("./LambdaMappingEntry.js").default[]}
         */
        this.entries = null;

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
        this.mappingSlot = mappingSlot;
        return this;
    }

    /**
     *
     * @param {import("./LambdaMappingEntry.js").default[]} entries
     * @returns {this}
     */
    setEntries(entries) {
        this.entries = entries;
        return this;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    getMappingSlot() {
        return this.mappingSlot;
    }

    /**
     *
     * @returns {import("./LambdaMappingEntry.js").default[] | null}
     */
    getEntries() {
        return this.entries;
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
                mappingSlot: this.mappingSlot,
                entries:
                    this.entries != null
                        ? this.entries.map((entry) => entry._toProtobuf())
                        : null,
            },
        };
    }
}

export default { LambdaStorageUpdate, LambdaStorageSlot, LambdaMappingEntries };
