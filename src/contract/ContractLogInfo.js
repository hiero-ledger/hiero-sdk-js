import ContractId from "./ContractId.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IContractLoginfo} proto.IContractLoginfo
 * @typedef {import("@exodus/hashgraph-proto").IContractID} proto.IContractID
 */

/**
 * The log information for an event returned by a smart contract function call. One function call
 * may return several such events.
 */
export default class ContractLogInfo {
    /**
     * @param {object} props
     * @param {ContractId} props.contractId
     * @param {Uint8Array} props.bloom
     * @param {Uint8Array[]} props.topics
     * @param {Uint8Array} props.data
     */
    constructor(props) {
        /**
         * Address of a contract that emitted the event.
         *
         * @readonly
         */
        this.contractId = props.contractId;

        /**
         * Bloom filter for a particular log.
         *
         * @readonly
         */
        this.bloom = props.bloom;

        /**
         * Topics of a particular event.
         *
         * @readonly
         */
        this.topics = props.topics;

        /**
         * Event data.
         *
         * @readonly
         */
        this.data = props.data;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.IContractLoginfo} info
     * @returns {ContractLogInfo}
     */
    static _fromProtobuf(info) {
        return new ContractLogInfo({
            contractId: ContractId._fromProtobuf(
                /** @type {proto.IContractID} */ (info.contractID)
            ),
            bloom: info.bloom != null ? info.bloom : new Uint8Array(),
            topics: info.topic != null ? info.topic : [],
            data: info.data != null ? info.data : new Uint8Array(),
        });
    }

    /**
     * @internal
     * @returns {proto.IContractLoginfo}
     */
    _toProtobuf() {
        return {
            contractID: this.contractId._toProtobuf(),
            bloom: this.bloom,
            topic: this.topics,
            data: this.data,
        };
    }
}
