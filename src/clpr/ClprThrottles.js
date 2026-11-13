// SPDX-License-Identifier: Apache-2.0

import Long from "long";

/**
 * All seven limits advertised by a CLPR ledger.
 * @typedef {object} ClprThrottleLimits
 * @property {number} maxMessagesPerBundle
 * @property {number} maxMessagePayloadBytes
 * @property {Long} maxGasPerMessage
 * @property {number} maxQueueDepth
 * @property {Long} maxSyncBytes
 * @property {number} maxLocalEndpoints
 * @property {number} maxPeerEndpoints
 */

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.state.clpr.ClprThrottles.$Properties} ThrottlesProtobuf
 */

/**
 * Immutable capacity limits for a CLPR ledger.
 *
 * Use {@link ClprThrottles.of} to validate all seven limits before submitting
 * a configuration update. The two endpoint limits accept zero for no limit.
 * Configuration updates require treasury or system admin authority.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 */
export default class ClprThrottles {
    /**
     * @private
     * @param {ClprThrottleLimits} limits
     */
    constructor(limits) {
        /** @readonly */
        this.maxMessagesPerBundle = limits.maxMessagesPerBundle;
        /** @readonly */
        this.maxMessagePayloadBytes = limits.maxMessagePayloadBytes;
        /**
         * Maximum gas allocated to one message, as an unsigned Long.
         * @readonly
         * @type {Long}
         */
        this.maxGasPerMessage = Object.freeze(
            Long.fromValue(limits.maxGasPerMessage, true),
        );
        /** @readonly */
        this.maxQueueDepth = limits.maxQueueDepth;
        /**
         * Maximum serialized sync payload size, as an unsigned Long.
         * @readonly
         * @type {Long}
         */
        this.maxSyncBytes = Object.freeze(
            Long.fromValue(limits.maxSyncBytes, true),
        );
        /** @readonly */
        this.maxLocalEndpoints = limits.maxLocalEndpoints;
        /** @readonly */
        this.maxPeerEndpoints = limits.maxPeerEndpoints;

        Object.freeze(this);
    }

    /**
     * Create valid throttles. All fields are required, and the five non-endpoint
     * limits must be positive. Sync capacity must cover one maximum message
     * payload plus 65536 bytes.
     * @param {ClprThrottleLimits} limits
     * @returns {ClprThrottles}
     */
    static of(limits) {
        for (const field of /** @type {const} */ ([
            "maxMessagesPerBundle",
            "maxMessagePayloadBytes",
            "maxQueueDepth",
            "maxLocalEndpoints",
            "maxPeerEndpoints",
        ])) {
            const value = limits[field];
            const minimum =
                field === "maxLocalEndpoints" || field === "maxPeerEndpoints"
                    ? 0
                    : 1;

            if (
                !Number.isInteger(value) ||
                value < minimum ||
                value > 4294967295
            ) {
                throw new RangeError(
                    `${field} must be an integer from ${minimum} to 4294967295`,
                );
            }
        }

        for (const field of /** @type {const} */ ([
            "maxGasPerMessage",
            "maxSyncBytes",
        ])) {
            const value = limits[field];
            if (!Long.isLong(value) || value.isNegative() || value.isZero()) {
                throw new RangeError(`${field} must be a positive uint64 Long`);
            }
        }

        const floor = Long.fromNumber(limits.maxMessagePayloadBytes, true).add(
            65536,
        );
        if (limits.maxSyncBytes.toUnsigned().lessThan(floor)) {
            throw new RangeError(
                "maxSyncBytes must be at least maxMessagePayloadBytes + 65536",
            );
        }

        return new ClprThrottles(limits);
    }

    /**
     * Decode server values without applying configuration-update validation.
     * @internal
     * @param {ThrottlesProtobuf} throttles
     * @returns {ClprThrottles}
     */
    static _fromProtobuf(throttles) {
        return new ClprThrottles({
            maxMessagesPerBundle: throttles.maxMessagesPerBundle ?? 0,
            maxMessagePayloadBytes: throttles.maxMessagePayloadBytes ?? 0,
            maxGasPerMessage: Long.fromValue(
                throttles.maxGasPerMessage ?? 0,
                true,
            ),
            maxQueueDepth: throttles.maxQueueDepth ?? 0,
            maxSyncBytes: Long.fromValue(throttles.maxSyncBytes ?? 0, true),
            maxLocalEndpoints: throttles.maxLocalEndpoints ?? 0,
            maxPeerEndpoints: throttles.maxPeerEndpoints ?? 0,
        });
    }

    /**
     * @internal
     * @returns {ThrottlesProtobuf}
     */
    _toProtobuf() {
        return {
            maxMessagesPerBundle: this.maxMessagesPerBundle,
            maxMessagePayloadBytes: this.maxMessagePayloadBytes,
            maxGasPerMessage: this.maxGasPerMessage,
            maxQueueDepth: this.maxQueueDepth,
            maxSyncBytes: this.maxSyncBytes,
            maxLocalEndpoints: this.maxLocalEndpoints,
            maxPeerEndpoints: this.maxPeerEndpoints,
        };
    }
}
