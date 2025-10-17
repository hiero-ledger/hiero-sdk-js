// SPDX-License-Identifier: Apache-2.0

import HookCall from "./HookCall.js";
import EvmHookCall from "./EvmHookCall.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IHookCall} HieroProto.proto.IHookCall
 */

/**
 * A typed hook call for NFT transfers.
 */
class NftHookCall extends HookCall {
    /**
     * @param {object} props
     * @param {Long} [props.hookId]
     * @param {import("../hooks/HookId.js").default} [props.fullHookId]
     * @param {import("../hooks/EvmHookCall.js").default} [props.evmHookCall]
     * @param {number | null} [props.type] - One of NftHookType (PRE_HOOK_SENDER, PRE_POST_HOOK_SENDER, PRE_HOOK_RECEIVER, PRE_POST_HOOK_RECEIVER)
     */
    constructor(props) {
        super(props);

        if (props.type == null) {
            throw new Error("type cannot be null");
        }
        /**
         * The type of NFT hook
         * @private
         * @type {number | null}
         */
        this._type = null;

        if (props.type != null) {
            this._type = props.type;
        }
    }

    /**
     * @returns {number | null}
     */
    get type() {
        return this._type;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IHookCall} hookCall
     * @param {number} type
     * @returns {NftHookCall}
     */
    static _fromProtobufWithType(hookCall, type) {
        return new NftHookCall({
            hookId: hookCall.hookId != null ? hookCall.hookId : undefined,
            evmHookCall: hookCall.evmHookCall
                ? EvmHookCall._fromProtobuf(hookCall.evmHookCall)
                : undefined,
            type,
        });
    }
}

export default NftHookCall;
