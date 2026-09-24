// SPDX-License-Identifier: Apache-2.0
import FeeEstimateMode from "./enums/FeeEstimateMode.js";
import FeeEstimateResponse from "./FeeEstimateResponse.js";
import NetworkFee from "./NetworkFee.js";
import FeeEstimate from "./FeeEstimate.js";
import * as HieroProto from "@hiero-ledger/proto";
import {
    bodyJson,
    statusMessage,
} from "../mirror_node/MirrorNodeHttpClient.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/Transaction.js").default} Transaction
 * @typedef {import("./FeeEstimateResponse.js").FeeEstimateResponseJSON} FeeEstimateResponseJSON
 * @typedef {import("../mirror_node/MirrorNodeHttpClient.js").default} MirrorNodeHttpClient
 */

/**
 * Maximum value (basis points) for the high-volume throttle utilization.
 * 10000 = 100%.
 */
const HIGH_VOLUME_THROTTLE_MAX_BPS = 10000;

/**
 * Request object for users, SDKs, and tools to query expected fees without
 * submitting transactions to the network.
 *
 * Communicates with the mirror node REST API
 * (`POST /api/v1/network/fees`), not the consensus node gRPC API, through
 * the client's shared HTTP transport. Per HIP-1261 this class is modeled
 * after {@link MirrorNodeContractQuery} (a plain class) rather than the gRPC
 * `Query` base, since the gRPC features (node selection, query payment,
 * transaction-id signing) do not apply. Retry, backoff and timeouts follow
 * the client's `MirrorNodeHttpRetryPolicy` (see
 * `Client.setMirrorNodeHttpConfig`).
 *
 * Per HIP-1261, transactions are automatically frozen if not already frozen
 * when `execute()` is called.
 */
export default class FeeEstimateQuery {
    /**
     * @param {object} [props]
     * @param {typeof FeeEstimateMode.STATE | typeof FeeEstimateMode.INTRINSIC} [props.mode]
     * @param {Transaction} [props.transaction]
     * @param {number} [props.highVolumeThrottle]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {number}
         */
        this._mode = FeeEstimateMode.INTRINSIC;

        /**
         * @private
         * @type {?Transaction}
         */
        this._transaction = null;

        /**
         * @private
         * @type {number}
         */
        this._highVolumeThrottle = 0;

        if (props.mode != null) {
            this.setMode(props.mode);
        }

        if (props.transaction != null) {
            this.setTransaction(props.transaction);
        }

        if (props.highVolumeThrottle != null) {
            this.setHighVolumeThrottle(props.highVolumeThrottle);
        }
    }

    /**
     * @returns {number}
     */
    get mode() {
        return this._mode;
    }

    /**
     * Set the estimation mode (optional, defaults to INTRINSIC per HIP-1261).
     *
     * @param {typeof FeeEstimateMode.STATE | typeof FeeEstimateMode.INTRINSIC} mode
     * @returns {FeeEstimateQuery}
     */
    setMode(mode) {
        const modeValue = Number(mode);
        const validValues = Object.values(FeeEstimateMode).map(Number);

        if (!validValues.includes(modeValue)) {
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
     * Set the high-volume throttle utilization in basis points (0–10000, where
     * 10000 = 100%). A value of 0 (the default) disables high-volume pricing
     * simulation. Maps to the `high_volume_throttle` query parameter on the
     * mirror node REST API.
     *
     * @param {number} throttle
     * @returns {FeeEstimateQuery}
     */
    setHighVolumeThrottle(throttle) {
        const value = Number(throttle);
        if (
            !Number.isInteger(value) ||
            value < 0 ||
            value > HIGH_VOLUME_THROTTLE_MAX_BPS
        ) {
            throw new Error(
                `Invalid highVolumeThrottle: ${throttle}. Must be an integer in [0, ${HIGH_VOLUME_THROTTLE_MAX_BPS}].`,
            );
        }
        this._highVolumeThrottle = value;
        return this;
    }

    /**
     * Get the current high-volume throttle utilization, in basis points.
     *
     * @returns {number}
     */
    getHighVolumeThrottle() {
        return this._highVolumeThrottle;
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
     * @param {number} [requestTimeout] - total timeout for the whole
     * operation in milliseconds, every chunk and every retry included;
     * defaults to the retry policy's `totalDeadline`, which in turn
     * defaults to `client.requestTimeout`
     * @returns {Promise<FeeEstimateResponse>}
     */
    execute(client, requestTimeout) {
        return new Promise((resolve, reject) => {
            this._makeMirrorNodeRequest(
                client,
                resolve,
                reject,
                requestTimeout,
            );
        });
    }

    /**
     * @private
     * @param {Client} client
     * @param {(value: FeeEstimateResponse) => void} resolve
     * @param {(error: Error) => void} reject
     * @param {number} [requestTimeout]
     */
    _makeMirrorNodeRequest(client, resolve, reject, requestTimeout) {
        if (this._transaction == null) {
            reject(new Error("FeeEstimateQuery requires a transaction"));
            return;
        }

        const txObj = this._transaction;

        // Per HIP-1261: auto-freeze if not already frozen.
        txObj.freezeWith(client);
        txObj._buildAllTransactions();

        const rowLength = txObj._nodeAccountIds.length || 1;
        const chunks = txObj.getRequiredChunks();

        // One adapter for the whole call: every chunk targets the same
        // mirror node and draws on the same total deadline.
        /** @type {MirrorNodeHttpClient} */
        let http;
        try {
            http = client._mirrorNodeHttpClient({
                // `/network/fees` is served by the mirror node's Java REST
                // API, a different port on a local network.
                family: "rest-java",
                totalDeadline: requestTimeout,
            });
        } catch (error) {
            reject(/** @type {Error} */ (error));
            return;
        }

        /** @type {Promise<FeeEstimateResponse>[]} */
        const perChunkPromises = [];

        for (let chunk = 0; chunk < chunks; chunk++) {
            const index = chunk * rowLength + 0;
            perChunkPromises.push(
                this._requestFeeEstimateForIndex(http, txObj, index),
            );
        }

        Promise.all(perChunkPromises)
            .then((responses) => {
                resolve(this._aggregateFeeResponses(responses));
            })
            .catch(reject);
    }

    /**
     * Aggregate per-chunk fee responses into a single response per the HIP-1261
     * chunked transaction rules:
     *
     * - aggregated node total: sum of `node.base + sum(node.extras[*].subtotal)`
     * - aggregated service total: sum of `service.base + sum(service.extras[*].subtotal)`
     * - `network.subtotal` = aggregated node total * `network.multiplier`
     * - `total` = `network.subtotal` + aggregated node total + aggregated service total
     *
     * @private
     * @param {FeeEstimateResponse[]} responses
     * @returns {FeeEstimateResponse}
     */
    _aggregateFeeResponses(responses) {
        if (responses.length === 0) {
            return new FeeEstimateResponse({
                highVolumeMultiplier: 1,
                networkFee: new NetworkFee({ multiplier: 0, subtotal: 0 }),
                nodeFee: new FeeEstimate({ base: 0, extras: [] }),
                serviceFee: new FeeEstimate({ base: 0, extras: [] }),
                total: 0,
            });
        }

        // Single-chunk: pass the mirror node response through as-is. The
        // HIP-1261 aggregation rules only apply to multi-chunk transactions.
        if (responses.length === 1) {
            return responses[0];
        }

        const networkMultiplier = responses[0].networkFee.multiplier;
        const highVolumeMultiplier = responses[0].highVolumeMultiplier;

        let nodeBase = 0;
        let serviceBase = 0;
        /** @type {import("./FeeExtra.js").default[]} */
        const nodeExtras = [];
        /** @type {import("./FeeExtra.js").default[]} */
        const serviceExtras = [];

        for (const r of responses) {
            nodeBase += Number(r.nodeFee.base);
            serviceBase += Number(r.serviceFee.base);
            nodeExtras.push(...r.nodeFee.extras);
            serviceExtras.push(...r.serviceFee.extras);
        }

        const nodeExtrasSubtotal = nodeExtras.reduce(
            (sum, extra) => sum + Number(extra.subtotal),
            0,
        );
        const serviceExtrasSubtotal = serviceExtras.reduce(
            (sum, extra) => sum + Number(extra.subtotal),
            0,
        );

        const aggregatedNodeTotal = nodeBase + nodeExtrasSubtotal;
        const aggregatedServiceTotal = serviceBase + serviceExtrasSubtotal;
        const networkSubtotal = aggregatedNodeTotal * networkMultiplier;
        const total =
            networkSubtotal + aggregatedNodeTotal + aggregatedServiceTotal;

        return new FeeEstimateResponse({
            highVolumeMultiplier,
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
            total,
        });
    }

    /**
     * Build the mirror node REST path for the configured mode and throttle,
     * relative to the REST base URL.
     *
     * @private
     * @returns {string}
     */
    _buildRequestPath() {
        const params = new URLSearchParams();
        params.set(
            "mode",
            this._mode === FeeEstimateMode.STATE ? "STATE" : "INTRINSIC",
        );
        if (this._highVolumeThrottle > 0) {
            params.set(
                "high_volume_throttle",
                String(this._highVolumeThrottle),
            );
        }

        return `/network/fees?${params.toString()}`;
    }

    /**
     * Send a fee estimate request for the transaction chunk at a flattened
     * index. Transient failures (retryable statuses, timeouts, connection
     * errors) are retried by the adapter under the client's policy; a
     * `400` (malformed transaction) is not.
     *
     * @private
     * @param {MirrorNodeHttpClient} http
     * @param {Transaction} txObj
     * @param {number} index
     * @returns {Promise<FeeEstimateResponse>}
     */
    _requestFeeEstimateForIndex(http, txObj, index) {
        return new Promise((res, rej) => {
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

            http.post(this._buildRequestPath(), "application/protobuf", buffer)
                .then((response) => {
                    if (!response.ok) {
                        // The mirror node returns a JSON
                        // `_status.messages[].detail` describing what
                        // failed; surface it so consumers can act on it.
                        throw new Error(statusMessage(response));
                    }
                    const data = /** @type {FeeEstimateResponseJSON} */ (
                        bodyJson(response)
                    );
                    res(FeeEstimateResponse._fromJSON(data));
                })
                .catch((error) => {
                    const message =
                        error instanceof Error ? error.message : String(error);
                    rej(new Error(`Failed to estimate fees: ${message}`));
                });
        });
    }
}
