// SPDX-License-Identifier: Apache-2.0

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.FreezeType} HieroProto.proto.FreezeType
 */

export default class FreezeType {
    /**
     * @hideconstructor
     * @internal
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case FreezeType.UnknownFreezeType:
                return "UNKNOWN_FREEZE_TYPE";
            case FreezeType.FreezeOnly:
                return "FREEZE_ONLY";
            case FreezeType.PrepareUpgrade:
                return "PREPARE_UPGRADE";
            case FreezeType.FreezeUpgrade:
                return "FREEZE_UPGRADE";
            case FreezeType.FreezeAbort:
                return "FREEZE_ABORT";
            case FreezeType.TelemetryUpgrade:
                return "TELEMETRY_UPGRADE";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {FreezeType}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return FreezeType.UnknownFreezeType;
            case 1:
                return FreezeType.FreezeOnly;
            case 2:
                return FreezeType.PrepareUpgrade;
            case 3:
                return FreezeType.FreezeUpgrade;
            case 4:
                return FreezeType.FreezeAbort;
            case 5:
                return FreezeType.TelemetryUpgrade;
            default:
                throw new Error(
                    `(BUG) Status.fromCode() does not handle code: ${code}`,
                );
        }
    }

    /**
     * @returns {HieroProto.proto.FreezeType}
     */
    valueOf() {
        return this._code;
    }
}

/**
 * An (invalid) default value for this enum, to ensure the client explicitly sets
 * the intended type of freeze transaction.
 */
FreezeType.UnknownFreezeType = new FreezeType(0);

/**
 * Freezes the network at the specified time. The start_time field must be provided and
 * must reference a future time. Any values specified for the update_file and file_hash
 * fields will be ignored. This transaction does not perform any network changes or
 * upgrades and requires manual intervention to restart the network.
 */
FreezeType.FreezeOnly = new FreezeType(1);

/**
 * A non-freezing operation that initiates network wide preparation in advance of a
 * scheduled freeze upgrade. The update_file and file_hash fields must be provided and
 * valid. The start_time field may be omitted and any value present will be ignored.
 */
FreezeType.PrepareUpgrade = new FreezeType(2);

/**
 * Freezes the network at the specified time and performs the previously prepared
 * automatic upgrade across the entire network.
 */
FreezeType.FreezeUpgrade = new FreezeType(3);

/**
 * Aborts a pending network freeze operation.
 */
FreezeType.FreezeAbort = new FreezeType(4);

/**
 * Performs an immediate upgrade on auxilary services and containers providing
 * telemetry/metrics. Does not impact network operations.
 */
FreezeType.TelemetryUpgrade = new FreezeType(5);
