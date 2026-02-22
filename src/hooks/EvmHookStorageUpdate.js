import EvmHookMappingEntry from "./EvmHookMappingEntry.js";

/**
 *
 * @abstract
 * Specifies a key/value pair in the storage of a EVM hook, either by the explicit storage
 * slot contents; or by a combination of a Solidity mapping's slot key and the key into
 * that mapping.
 */
class EvmHookStorageUpdate {
    /**
     *
     * @param {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IEvmHookStorageUpdate} hookStorageUpdate
     * @returns {EvmHookStorageUpdate}
     */
    static _fromProtobuf(hookStorageUpdate) {
        if (hookStorageUpdate.storageSlot != null) {
            return EvmHookStorageSlot._fromProtobuf(hookStorageUpdate);
        }

        if (hookStorageUpdate.mappingEntries != null) {
            return EvmHookMappingEntries._fromProtobuf(hookStorageUpdate);
        }

        throw new Error(
            "EvmHookStorageUpdate must have either storage_slot or mapping_entries set",
        );
    }

    /**
     * @abstract
     * @returns {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IEvmHookStorageUpdate}
     */
    _toProtobuf() {
        throw new Error(
            "EvmHookStorageUpdate._toProtobuf must be implemented by a subclass",
        );
    }
}

/**
 * A slot in the storage of a EVM hook.
 */
class EvmHookStorageSlot extends EvmHookStorageUpdate {
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
     * @param {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IEvmHookStorageUpdate} hookStorageSlot
     * @returns {EvmHookStorageSlot}
     */
    static _fromProtobuf(hookStorageSlot) {
        if (hookStorageSlot.storageSlot != null) {
            return new EvmHookStorageSlot({
                key:
                    hookStorageSlot.storageSlot.key != null
                        ? hookStorageSlot.storageSlot.key
                        : undefined,
                value:
                    hookStorageSlot.storageSlot.value != null
                        ? hookStorageSlot.storageSlot.value
                        : undefined,
            });
        }
        throw new Error(
            "EvmHookStorageSlot._fromProtobuf must be implemented by a subclass",
        );
    }

    /**
     * @returns {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.EvmHookStorageUpdate}
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
class EvmHookMappingEntries extends EvmHookStorageUpdate {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.mappingSlot]
     * @param {import("./EvmHookMappingEntry.js").default[]} [props.entries]
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
         * @type {?import("./EvmHookMappingEntry.js").default[]}
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
     * @param {import("./EvmHookMappingEntry.js").default[]} entries
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
     * @returns {import("./EvmHookMappingEntry.js").default[] | null}
     */
    get entries() {
        return this._entries;
    }

    /**
     *
     * @param {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IEvmHookStorageUpdate} hookStorageUpdate
     * @returns {EvmHookMappingEntries}
     */
    static _fromProtobuf(hookStorageUpdate) {
        return new EvmHookMappingEntries({
            mappingSlot:
                hookStorageUpdate.mappingEntries?.mappingSlot != null
                    ? hookStorageUpdate.mappingEntries.mappingSlot
                    : undefined,
            entries: hookStorageUpdate.mappingEntries?.entries?.map((entry) =>
                EvmHookMappingEntry._fromProtobuf(entry),
            ),
        });
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.EvmHookStorageUpdate}
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

export { EvmHookStorageUpdate, EvmHookStorageSlot, EvmHookMappingEntries };
