// SPDX-License-Identifier: Apache-2.0
import Query from "./Query.js";
import FeeEstimateMode from "./enums/FeeEstimateMode.js";
import FeeEstimateResponse from "./FeeEstimateResponse.js";
import NetworkFee from "./NetworkFee.js";
import FeeEstimate from "./FeeEstimate.js";
import * as HieroProto from "@hiero-ledger/proto";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../channel/MirrorChannel.js").MirrorError} MirrorError
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
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
        if (this._transaction == null) {
            reject(new Error("FeeEstimateQuery requires a transaction"));
            return;
        }

        const txObj = this._transaction;

        // Ensure the transaction is prepared so chunk and node matrices exist
        txObj.freezeWith(client);
        // Ensure protobuf transactions exist for lookup
        txObj._buildAllTransactions();

        const rowLength = txObj._nodeAccountIds.length || 1;
        const chunks = txObj.getRequiredChunks();

        /** @type {Promise<FeeEstimateResponse>[]} */
        const perChunkPromises = [];

        /**
         * @param {number} index
         * @returns {Promise<FeeEstimateResponse>}
         */
        const requestForIndex = (index) =>
            this._requestFeeEstimateForIndex(client, txObj, index);

        // Use the first node for each chunk row
        for (let chunk = 0; chunk < chunks; chunk++) {
            const index = chunk * rowLength + 0;
            perChunkPromises.push(requestForIndex(index));
        }

        Promise.all(perChunkPromises)
            .then((responses) => {
                resolve(this._aggregateFeeResponses(responses));
            })
            .catch(reject);
    }

    /**
     * Aggregate per-chunk fee responses into a single response.
     * @private
     * @param {FeeEstimateResponse[]} responses
     * @returns {FeeEstimateResponse}
     */
    _aggregateFeeResponses(responses) {
        if (responses.length === 0) {
            return new FeeEstimateResponse({
                mode: this._mode,
                networkFee: new NetworkFee({
                    multiplier: 0,
                    subtotal: 0,
                }),
                nodeFee: new FeeEstimate({ base: 0, extras: [] }),
                serviceFee: new FeeEstimate({ base: 0, extras: [] }),
                notes: [],
                total: 0,
            });
        }

        // Aggregate results across chunks
        let networkMultiplier = responses[0].networkFee.multiplier;
        let networkSubtotal = 0;
        let nodeBase = 0;
        let serviceBase = 0;
        /** @type {import("./FeeExtra.js").default[]} */
        const nodeExtras = [];
        /** @type {import("./FeeExtra.js").default[]} */
        const serviceExtras = [];
        const notes = [];
        let total = 0;

        for (const r of responses) {
            networkMultiplier = r.networkFee.multiplier;
            networkSubtotal += Number(r.networkFee.subtotal);
            nodeBase += Number(r.nodeFee.base);
            serviceBase += Number(r.serviceFee.base);
            nodeExtras.push(...r.nodeFee.extras);
            serviceExtras.push(...r.serviceFee.extras);
            notes.push(...r.notes);
            total += Number(r.total);
        }

        return new FeeEstimateResponse({
            mode: this._mode,
            networkFee: new NetworkFee({
                multiplier: networkMultiplier,
                subtotal: networkSubtotal,
            }),
            nodeFee: new FeeEstimate({
                base: nodeBase,
                extras: nodeExtras,
            }),
            serviceFee: new FeeEstimate({
                base: serviceBase,
                extras: serviceExtras,
            }),
            notes,
            total,
        });
    }

    /**
     * Send a fee estimate request for the transaction chunk at a flattened index.
     * @private
     * @param {Client} client
     * @param {Transaction} txObj
     * @param {number} index
     * @returns {Promise<FeeEstimateResponse>}
     */
    _requestFeeEstimateForIndex(client, txObj, index) {
        return new Promise((res, rej) => {
            // Ensure this index is built
            txObj._buildTransaction(index);
            const tx =
                /** @type {HieroProto.proto.ITransaction | undefined} */ (
                    txObj._transactions.get(index)
                );
            if (tx == null) {
                rej(new Error("Failed to build transaction for fee estimate"));
                return;
            }

            const buffer = HieroProto.proto.Transaction.encode(tx).finish();
            const url = `${client.mirrorRestApiBaseUrl}/network/fees?mode=${
                this._mode === FeeEstimateMode.STATE ? "STATE" : "INTRINSIC"
            }`;

            // eslint-disable-next-line n/no-unsupported-features/node-builtins
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/protobuf",
                },
                body: /** @type {BodyInit} */ (buffer),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`,
                        );
                    }
                    return response.json();
                })
                .then(
                    /**
                     * @param {Parameters<typeof FeeEstimateResponse._fromJSON>[0]} data
                     */
                    (data) => {
                        res(FeeEstimateResponse._fromJSON(data));
                    },
                )
                .catch((error) => {
                    const message =
                        error instanceof Error ? error.message : String(error);
                    rej(new Error(`Failed to estimate fees: ${message}`));
                });
        });
    }
}
