import * as proto from "@exodus/hashgraph-proto";
import FeeSchedule from "./FeeSchedule";

export default class FeeSchedules {
    /**
     * @param {object} [props]
     * @param {FeeSchedule} [props.currentFeeSchedule]
     * @param {FeeSchedule} [props.nextFeeSchedule]
     */
    constructor(props = {}) {
        /*
         * Contains current Fee Schedule
         *
         * @type {FeeSchedule}
         */
        this.current = props.currentFeeSchedule;

        /*
         * Contains next Fee Schedule
         *
         * @type {FeeSchedule}
         */
        this.next = props.nextFeeSchedule;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FeeSchedules}
     */
    static fromBytes(bytes) {
        return FeeSchedules._fromProtobuf(
            proto.CurrentAndNextFeeSchedule.decode(bytes)
        );
    }

    /**
     * @internal
     * @param {proto.ICurrentAndNextFeeSchedule} feeSchedules
     * @returns {FeeSchedules}
     */
    static _fromProtobuf(feeSchedules) {
        return new FeeSchedules({
            currentFeeSchedule:
                feeSchedules.currentFeeSchedule != null
                    ? FeeSchedule._fromProtobuf(feeSchedules.currentFeeSchedule)
                    : undefined,
            nextFeeSchedule:
                feeSchedules.nextFeeSchedule != null
                    ? FeeSchedule._fromProtobuf(feeSchedules.nextFeeSchedule)
                    : undefined,
        });
    }

    /**
     * @internal
     * @returns {proto.ICurrentAndNextFeeSchedule}
     */
    _toProtobuf() {
        return {
            currentFeeSchedule:
                this.current != null ? this.current._toProtobuf() : undefined,
            nextFeeSchedule:
                this.next != null ? this.next._toProtobuf() : undefined,
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.CurrentAndNextFeeSchedule.encode(
            this._toProtobuf()
        ).finish();
    }
}
