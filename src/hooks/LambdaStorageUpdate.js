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
