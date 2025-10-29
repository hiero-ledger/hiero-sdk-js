// SPDX-License-Identifier: Apache-2.0

import Query from "./Query.js";
import FeeEstimateMode from "./enums/FeeEstimateMode.js";
import FeeEstimateResponse from "./FeeEstimateResponse.js";
import * as HieroProto from "@hashgraph/proto";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/Transaction.js").default} Transaction
 */

/**
 * Request object for users, SDKs, and tools to query expected fees without
 * submitting transactions to the network.
 * @augments {Query<FeeEstimateResponse>}
 */
export default class FeeEstimateQuery extends Query {
    /**
     * @param {object} props
     * @param {typeof FeeEstimateMode.STATE|typeof FeeEstimateMode.INTRINSIC} [props.mode]
     * @param {Transaction} [props.transaction]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {number}
         */
        this._mode = FeeEstimateMode.STATE;

        /**
         * @private
         * @type {?Transaction}
         */
        this._transaction = null;

        if (props.mode != null) {
            this.setMode(props.mode);
        }

        if (props.transaction != null) {
            this.setTransaction(props.transaction);
        }
    }

    /**
     * @returns {number}
     */
    get mode() {
        return this._mode;
    }

    /**
     * Set the estimation mode (optional, defaults to STATE).
     *
     * @param {typeof FeeEstimateMode.STATE|typeof FeeEstimateMode.INTRINSIC} mode
     * @returns {FeeEstimateQuery}
     */
    setMode(mode) {
        const modeValue = Number(mode);
        const validValues = Object.values(FeeEstimateMode).map(Number);

        if (!validValues.includes(modeValue)) {
            // Generate error message with all valid modes
            const validModes = Object.entries(FeeEstimateMode)
                .map(([key, value]) => `${key} (${Number(value)})`)
                .join(", ");
            throw new Error(
                `Invalid FeeEstimateMode: ${modeValue}. Must be one of: ${validModes}`,
            );
        }
        this._mode = modeValue;
        return this;
    }

    /**
     * Get the current estimation mode.
     *
     * @returns {number}
     */
    getMode() {
        return this._mode;
    }

    /**
     * @returns {?Transaction}
     */
    get transaction() {
        return this._transaction;
    }

    /**
     * Set the transaction to estimate (required).
     *
     * @param {Transaction} transaction
     * @returns {FeeEstimateQuery}
     */
    setTransaction(transaction) {
        this._transaction = transaction;
        return this;
    }

    /**
     * Get the current transaction.
     *
     * @returns {?Transaction}
     */
    getTransaction() {
        return this._transaction;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._transaction != null) {
            this._transaction._validateChecksums(client);
        }
    }

    /**
     * @param {Client} client
     * @returns {Promise<FeeEstimateResponse>}
     */
    execute(client) {
        return new Promise((resolve, reject) => {
            this._makeMirrorNodeRequest(client, resolve, reject);
        });
    }

    /**
     * @private
     * @param {Client} client
     * @param {(value: FeeEstimateResponse) => void} resolve
     * @param {(error: Error) => void} reject
     */
    _makeMirrorNodeRequest(client, resolve, reject) {
        const request =
            HieroProto.com.hedera.mirror.api.proto.FeeEstimateQuery.encode({
                mode: FeeEstimateMode.STATE,
                transaction: this._transaction?._transactions.get(0),
            }).finish();

        /** @type {any} */ client._mirrorNetwork
            .getNextMirrorNode()
            .getChannel()
            .makeServerStreamRequest(
                "NetworkService",
                "getFeeEstimate",
                request,
                /** @param {any} data */ (data) => {
                    const response =
                        HieroProto.com.hedera.mirror.api.proto.FeeEstimateResponse.decode(
                            data,
                        );
                    resolve(FeeEstimateResponse._fromProtobuf(response));
                },
                /** @param {any} error */ (error) => {
                    reject(
                        new Error(
                            `Failed to estimate fees: ${
                                error.message || error.details
                            }`,
                        ),
                    );
                },
                () => {},
            );
    }
}
