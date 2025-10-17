// SPDX-License-Identifier: Apache-2.0

import HookCall from "./HookCall.js";
import EvmHookCall from "./EvmHookCall.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IHookCall} HieroProto.proto.IHookCall
 */

/**
 * A typed hook call for fungible (HBAR and FT) transfers.
 */
class FungibleHookCall extends HookCall {
    /**
     * @param {object} props
     * @param {Long} [props.hookId]
     * @param {import("../hooks/HookId.js").default} [props.fullHookId]
     * @param {import("../hooks/EvmHookCall.js").default} [props.evmHookCall]
     * @param {number} props.type - One of FungibleHookType.PRE_TX_ALLOWANCE_HOOK or FungibleHookType.PRE_POST_TX_ALLOWANCE_HOOK
     */
    constructor(props) {
        super(props);

        if (props.type == null) {
            throw new Error("type cannot be null");
        }

        /**
         * The type of fungible hook
         * @private
         * @type {number}
         */
        this._type = props.type;
    }

    /**
     * @returns {number}
     */
    get type() {
        return this._type;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IHookCall} hookCall
     * @param {number} type
     * @returns {FungibleHookCall}
     */
    static _fromProtobufWithType(hookCall, type) {
        return new FungibleHookCall({
            hookId: hookCall.hookId != null ? hookCall.hookId : undefined,
            evmHookCall: hookCall.evmHookCall
                ? EvmHookCall._fromProtobuf(hookCall.evmHookCall)
                : undefined,
            type: type,
        });
    }
}

export default FungibleHookCall;
