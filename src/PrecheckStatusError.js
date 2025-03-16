// SPDX-License-Identifier: Apache-2.0

import StatusError from "./StatusError.js";

/**
 * @typedef {import("./Status.js").default} Status
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./contract/ContractFunctionResult.js").default} ContractFunctionResult
 * @typedef {import("./account/AccountId.js").default} AccountId
 */

/**
 * @typedef {object} PrecheckStatusErrorJSON
 * @property {string} name
 * @property {string} status
 * @property {string} transactionId
 * @property {?string | null} nodeId
 * @property {string} message
 * @property {?ContractFunctionResult} contractFunctionResult
 */

/**
 * Represents an error that occurs during the pre-check phase of a transaction
 * on the Hedera network. The `PrecheckStatusError` class extends the base
 * `StatusError` class and provides additional context specific to pre-check
 * failures, such as the transaction ID, status, and any associated messages.
 *
 * This error is typically thrown when a transaction fails to meet the necessary
 * conditions before being processed, allowing developers to handle such errors
 * gracefully in their applications. The error includes details about the failure,
 * making it easier to diagnose issues related to transaction submissions.
 */
export default class PrecheckStatusError extends StatusError {
    /**
     * @param {object} props
     * @param {Status} props.status
     * @param {TransactionId} props.transactionId
     * @param {AccountId} props.nodeId
     * @param {?ContractFunctionResult} props.contractFunctionResult
     */
    constructor(props) {
        super(
            props,
            `transaction ${props.transactionId.toString()} failed precheck with status ${props.status.toString()} against node account id ${props.nodeId.toString()}`,
        );

        /**
         * @type {?ContractFunctionResult}
         * @readonly
         */
        this.contractFunctionResult = props.contractFunctionResult;

        /**
         * @type {AccountId}
         * @readonly
         */
        this.nodeId = props.nodeId;
    }

    /**
     * @returns {PrecheckStatusErrorJSON}
     */
    toJSON() {
        return {
            name: this.name,
            status: this.status.toString(),
            transactionId: this.transactionId.toString(),
            nodeId: this.nodeId.toString(),
            message: this.message,
            contractFunctionResult: this.contractFunctionResult,
        };
    }
}
