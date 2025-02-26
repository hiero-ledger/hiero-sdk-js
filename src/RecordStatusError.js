// SPDX-License-Identifier: Apache-2.0

import StatusError from "./StatusError.js";

/**
 * @typedef {import("./Status.js").default} Status
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./transaction/TransactionRecord").default} TransactionRecord
 */

export default class RecordStatusError extends StatusError {
    /**
     * @param {object} props
     * @param {TransactionRecord} props.transactionRecord
     * @param {Status} props.status
     * @param {TransactionId} props.transactionId
     */
    constructor(props) {
        super(
            props,
            `Record for transaction ${props.transactionId.toString()} contained error status ${props.status.toString()}`,
        );

        /**
         * @type {TransactionRecord}
         * @readonly
         */
        this.transactionRecord = props.transactionRecord;
    }
}
