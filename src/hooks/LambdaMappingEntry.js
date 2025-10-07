class LambdaMappingEntry {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.key]
     * @param {Uint8Array} [props.value]
     */
    constructor(props = {}) {
        this.key = props.key;
        this.value = props.value;

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
