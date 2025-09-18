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

    toProtobuf() {
        return {
            extension_point: this.extensionPoint,
            hook_id: this.hookId,
            hook: this.hook,
            key: this.key,
        };
    }
}

export default HookCreationDetails;
