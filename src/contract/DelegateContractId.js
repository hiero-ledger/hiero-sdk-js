// SPDX-License-Identifier: Apache-2.0

import CACHE from "../Cache.js";
import ContractId from "./ContractId.js";

/**
 * @namespace {proto}
 * @typedef {import("@hashgraph/proto").proto.IContractID} HieroProto.proto.IContractID
 * @typedef {import("@hashgraph/proto").proto.IKey} HieroProto.proto.IKey
 */

/**
 * @typedef {import("long")} Long
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * epresents a delegatable smart contract ID on the Hedera network.
 * This class extends ContractId and provides additional functionality for delegatable contracts.
 */
export default class DelegateContractId extends ContractId {
    /**
     * @param {number | Long | import("../EntityIdHelper").IEntityId} props
     * @param {(number | Long)=} realm
     * @param {(number | Long)=} num
     * @param {Uint8Array=} evmAddress
     */
    constructor(props, realm, num, evmAddress) {
        super(props, realm, num, evmAddress);
    }

    /**
     * @param {string} text
     * @returns {DelegateContractId}
     */
    static fromString(text) {
        return new DelegateContractId(ContractId.fromString(text));
    }

    /**
     * @internal
     * @param {HieroProto.proto.IContractID} id
     * @returns {DelegateContractId}
     */
    static _fromProtobuf(id) {
        return new DelegateContractId(ContractId._fromProtobuf(id));
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {DelegateContractId}
     */
    static fromBytes(bytes) {
        return new DelegateContractId(ContractId.fromBytes(bytes));
    }

    /**
     * @param {string} address
     * @deprecated - Use `fromEvmAddress` instead
     * @returns {DelegateContractId}
     */
    static fromSolidityAddress(address) {
        // eslint-disable-next-line deprecation/deprecation
        return new DelegateContractId(ContractId.fromSolidityAddress(address));
    }

    /**
     * @returns {DelegateContractId}
     */
    clone() {
        const id = new DelegateContractId(this);
        id._checksum = this._checksum;
        return id;
    }

    /**
     * @returns {HieroProto.proto.IKey}
     */
    _toProtobufKey() {
        return {
            delegatableContractId: this._toProtobuf(),
        };
    }

    /**
     * @param {HieroProto.proto.IContractID} key
     * @returns {DelegateContractId}
     */
    static __fromProtobufKey(key) {
        return DelegateContractId._fromProtobuf(key);
    }
}

CACHE.setDelegateContractId((key) => DelegateContractId.__fromProtobufKey(key));
