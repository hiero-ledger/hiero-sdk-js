/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.HookExtensionPoint} HieroHookExtensionPoint
 */

/**
 * The Hiero extension points that accept a hook.
 */
export class HookExtensionPoint {
    /**
     * @hideconstructor
     * @internal
     */
    constructor() {}

    /**
     * Used to customize an account's allowances during a CryptoTransfer transaction.
     * @returns {HookExtensionPoint}
     */
    static get ACCOUNT_ALLOWANCE_HOOK() {
        return 0;
    }
}

export default HookExtensionPoint;
