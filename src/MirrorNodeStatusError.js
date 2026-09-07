// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./Status.js").default} Status
 */

/**
 * A mirror-node REST query failed with a condition the consensus node
 * reported as a `Status`.
 *
 * Mirror REST queries reach no consensus node, so they have no transaction
 * and no node account id — which is why this does not extend `StatusError`,
 * whose `transactionId` is part of every consensus-node error. `status` lets
 * callers keep the `err.status === Status.InvalidAccountId` check they used
 * with the consensus-node queries these mirror queries replace.
 *
 * Match on `status`, not on the error class: the consensus-node queries these
 * replace failed with `PrecheckStatusError`, which this deliberately is not.
 */
export default class MirrorNodeStatusError extends Error {
    /**
     * @param {object} props
     * @param {Status} props.status
     * @param {string} message
     */
    constructor(props, message) {
        super(message);

        this.name = "MirrorNodeStatusError";

        /**
         * The consensus-node status this mirror-node condition maps to.
         *
         * @readonly
         */
        this.status = props.status;
    }
}
