// SPDX-License-Identifier: Apache-2.0

import ContractId from "./ContractId.js";

/**
 * @namespace {proto}
 * @typedef {import("@hiero-ledger/proto").proto.IContractID} HieroProto.proto.IContractID
 * @typedef {import("@hiero-ledger/proto").proto.IKey} HieroProto.proto.IKey
 */

/**
 * @typedef {import("long").default} Long
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 */

/**
 * epresents a delegatable smart contract ID on the Hedera network.
 * This class extends ContractId and provides additional functionality for delegatable contracts.
 */
export default class DelegateContractId extends ContractId {
    /**
     * @param {number | Long | import("../EntityIdHelper.js").IEntityId} props
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
        return DelegateContractId._fromContractId(ContractId.fromString(text));
    }

    /**
     * @internal
     * @param {HieroProto.proto.IContractID} id
     * @returns {DelegateContractId}
     */
    static _fromProtobuf(id) {
        return DelegateContractId._fromContractId(ContractId._fromProtobuf(id));
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {DelegateContractId}
     */
    static fromBytes(bytes) {
        return DelegateContractId._fromContractId(ContractId.fromBytes(bytes));
    }

    /**
     * Copies shard, realm, num and the EVM address of a `ContractId`.
     *
     * @internal
     * @param {ContractId} id
     * @returns {DelegateContractId}
     */
    static _fromContractId(id) {
        return new DelegateContractId(
            id,
            undefined,
            undefined,
            id.evmAddress != null ? id.evmAddress : undefined,
        );
    }

    /**
     * @returns {DelegateContractId}
     */
    clone() {
        const id = DelegateContractId._fromContractId(this);
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
