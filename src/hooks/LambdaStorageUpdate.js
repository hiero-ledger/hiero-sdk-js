class LambdaStorageUpdate {
    /**
     *
     * @param {object} props
     * @param {import("./LambdaStorageSlot.js").default} [props.storageSlot]
     * @param {import("./LambdaMappingEntry.js").default[]} [props.mappingEntries]
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
     *
     * @param {import("./LambdaStorageSlot.js").default} storageSlot
     * @returns
     */
    setStorageSlot(storageSlot) {
        this.storageSlot = storageSlot;
        return this;
    }

    /**
     *
     * @param {import("./LambdaMappingEntry.js").default[]} mappingEntries
     * @returns
     */
    setMappingEntries(mappingEntries) {
        this.mappingEntries = mappingEntries;
        return this;
    }
}

export default LambdaStorageUpdate;
