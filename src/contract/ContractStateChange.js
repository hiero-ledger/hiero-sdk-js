// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hashgraph/proto";
import ContractId from "./ContractId.js";
import StorageChange from "./StorageChange.js";

/**
 * @deprecated - Use mirror node for contract traceability instead
 */
export default class ContractStateChange {
    /**
     * @private
     * @param {object} props
     * @param {ContractId} props.contractId
     * @param {StorageChange[]} props.storageChanges
     */
    constructor(props) {
        this.contractId = props.contractId;
        this.storageChanges = props.storageChanges;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.IContractStateChange} change
     * @returns {ContractStateChange}
     */
    static _fromProtobuf(change) {
        // eslint-disable-next-line deprecation/deprecation
        return new ContractStateChange({
            contractId: ContractId._fromProtobuf(
                /** @type {HieroProto.proto.IContractID} */ (change.contractId),
            ),
            storageChanges: (change.storageChanges != null
                ? change.storageChanges
                : []
            )
                // eslint-disable-next-line deprecation/deprecation
                .map((change) => StorageChange._fromProtobuf(change)),
        });
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {ContractStateChange}
     */
    static fromBytes(bytes) {
        // eslint-disable-next-line deprecation/deprecation
        return ContractStateChange._fromProtobuf(
            HieroProto.proto.ContractStateChange.decode(bytes),
        );
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IContractStateChange} change
     */
    _toProtobuf() {
        return {
            contractId: this.contractId._toProtobuf(),
            storageChanges: this.storageChanges.map((storageChange) =>
                storageChange._toProtobuf(),
            ),
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        // eslint-disable-next-line deprecation/deprecation
        return HieroProto.proto.ContractStateChange.encode(
            this._toProtobuf(),
        ).finish();
    }
}
