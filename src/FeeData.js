// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hashgraph/proto";
import FeeComponents from "./FeeComponents.js";
import FeeDataType from "./FeeDataType.js";

/**
 * A total fee, in component amounts charged for a transaction.
 *
 * Total fees are composed of three sets of components.
 * - Node data, components that compensate the specific node that submitted
 *   the transaction.
 * - Network data, components that compensate the Hedera network for gossiping
 *   the transaction and determining the consensus timestamp.
 * - Service data, components that compensate the Hedera network for the ongoing
 *   maintenance and operation of the network, as well as ongoing development
 *   of network services.
 *
 * Fee components are recorded in thousandths of a tiny cent, and the network
 * exchange rate converts these to tinybar amounts, which are what the network
 * charges for transactions and what the network reports in the record stream.
 */
export default class FeeData {
    /**
     * @param {object} [props]
     * @param {FeeComponents} [props.nodedata]
     * @param {FeeComponents} [props.networkdata]
     * @param {FeeComponents} [props.servicedata]
     * @param {FeeDataType} [props.feeDataType]
     */
    constructor(props = {}) {
        /*
         * Fee paid to the submitting node
         *
         * @type {FeeComponents}
         */
        this.nodedata = props.nodedata;

        /*
         * Fee paid to the network for processing a transaction into consensus
         *
         * @type {FeeComponents}
         */
        this.networkdata = props.networkdata;

        /*
         * Fee paid to the network for providing the service associated with the transaction; for instance, storing a file
         *
         * @type {FeeComponents}
         */
        this.servicedata = props.servicedata;

        /*
         * SubType distinguishing between different types of FeeData, correlating to the same HederaFunctionality
         *
         * @type {SubType}
         */
        this.feeDataType = props.feeDataType;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FeeData}
     */
    static fromBytes(bytes) {
        return FeeData._fromProtobuf(HieroProto.proto.FeeData.decode(bytes));
    }

    /**
     * @internal
     * @param {HieroProto.proto.IFeeData} feeData
     * @returns {FeeData}
     */
    static _fromProtobuf(feeData) {
        return new FeeData({
            nodedata:
                feeData.nodedata != null
                    ? FeeComponents._fromProtobuf(feeData.nodedata)
                    : undefined,
            networkdata:
                feeData.networkdata != null
                    ? FeeComponents._fromProtobuf(feeData.networkdata)
                    : undefined,
            servicedata:
                feeData.servicedata != null
                    ? FeeComponents._fromProtobuf(feeData.servicedata)
                    : undefined,
            feeDataType:
                feeData.subType != null
                    ? FeeDataType._fromCode(feeData.subType)
                    : undefined,
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IFeeData}
     */
    _toProtobuf() {
        return {
            nodedata:
                this.nodedata != null ? this.nodedata._toProtobuf() : undefined,

            networkdata:
                this.networkdata != null
                    ? this.networkdata._toProtobuf()
                    : undefined,

            servicedata:
                this.servicedata != null
                    ? this.servicedata._toProtobuf()
                    : undefined,

            subType:
                this.feeDataType != null
                    ? this.feeDataType.valueOf()
                    : undefined,
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.FeeData.encode(this._toProtobuf()).finish();
    }
}
