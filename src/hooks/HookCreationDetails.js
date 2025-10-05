import Long from "long";

class HookCreationDetails {
    /**
     *
     * @param {object} props
     * @param {import("./HookExtensionPoint").default} [props.extensionPoint]
     * @param {number} [props.hookId]
     * @param {import("./LambdaEvmHook.js").default} [props.hook]
     * @param {import("../Key.js").default} [props.key]
     */
    constructor(props = {}) {
        this.extensionPoint = props.extensionPoint;
        this.hookId = props.hookId;
        this.hook = props.hook;
        this.key = props.key;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IHookCreationDetails}
     */
    toProtobuf() {
        return {
            extensionPoint: this.extensionPoint,
            hookId: Long.fromInt(this.hookId ?? 0),
            lambdaEvmHook: this.hook?.toProtobuf(),
            adminKey: this.key?._toProtobufKey(),
        };
    }
}

export default HookCreationDetails;
