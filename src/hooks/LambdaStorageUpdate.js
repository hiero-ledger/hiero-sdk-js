import LambdaMappingEntry from "./LambdaMappingEntry.js";
import LambdaStorageSlot from "./LambdaStorageSlot.js";

class LambdaStorageUpdate {
    /**
     *
     * @param {object} props
     * @param {import("./LambdaStorageSlot.js").default} [props.storageSlot]
     * @param {LambdaMappingEntries} [props.mappingEntries]
     */
    constructor(props = {}) {
        this.storageSlot = null;
        this.mappingEntries = null;

        if (props.storageSlot != null) {
            this.setStorageSlot(props.storageSlot);
        }

        if (props.mappingEntries != null) {
            this.setMappingEntries(props.mappingEntries);
        }
    }

    /**
     * @returns {LambdaStorageUpdate}
     */
    clearStorageUpdates() {
        this.storageSlot = null;
        this.mappingEntries = null;
        return this;
    }

    /**
     *
     * @param {import("./LambdaStorageSlot.js").default} storageSlot
     * @returns {this}
     */
    setStorageSlot(storageSlot) {
        this.storageSlot = storageSlot;
        return this;
    }

    /**
     *
     * @param {LambdaMappingEntries} mappingEntries
     * @returns {this}
     */
    setMappingEntries(mappingEntries) {
        this.mappingEntries = mappingEntries;
        return this;
    }

    /**
     *
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate} lambdaStorageUpdate
     * @returns {LambdaStorageUpdate}
     */
    static _fromProtobuf(lambdaStorageUpdate) {
        return new LambdaStorageUpdate({
            storageSlot:
                lambdaStorageUpdate.storageSlot != null
                    ? LambdaStorageSlot._fromProtobuf(
                          lambdaStorageUpdate.storageSlot,
                      )
                    : undefined,
            mappingEntries:
                lambdaStorageUpdate.mappingEntries != null
                    ? LambdaMappingEntries._fromProtobuf(
                          lambdaStorageUpdate.mappingEntries,
                      )
                    : undefined,
        });
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageUpdate}
     */
    _toProtobuf() {
        return {
            storageSlot: this.storageSlot?._toProtobuf(),
            mappingEntries: this.mappingEntries?._toProtobuf(),
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
class LambdaMappingEntries {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.mappingSlot]
     * @param {import("./LambdaMappingEntry.js").default[]} [props.entries]
     */
    constructor(props) {
        this.mappingSlot = props.mappingSlot;
        this.entries = props.entries;
    }

    /**
     *
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaMappingEntries} lambdaMappingEntries
     * @returns {LambdaMappingEntries}
     */
    static _fromProtobuf(lambdaMappingEntries) {
        return new LambdaMappingEntries({
            mappingSlot:
                lambdaMappingEntries.mappingSlot != null
                    ? lambdaMappingEntries.mappingSlot
                    : undefined,
            entries:
                lambdaMappingEntries.entries != null
                    ? lambdaMappingEntries.entries.map((entry) =>
                          LambdaMappingEntry._fromProtobuf(entry),
                      )
                    : undefined,
        });
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaMappingEntries}
     */
    _toProtobuf() {
        return {
            mappingSlot: this.mappingSlot,
            entries:
                this.entries != null
                    ? this.entries.map((entry) => entry._toProtobuf())
                    : undefined,
        };
    }
}

export default LambdaStorageUpdate;
