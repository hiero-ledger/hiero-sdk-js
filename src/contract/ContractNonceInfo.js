// SPDX-License-Identifier: Apache-2.0

import ContractId from "./ContractId.js";
import Long from "long";
import * as protos from "@hashgraph/proto";
const { proto } = protos;

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IContractNonceInfo} HieroProto.proto.IContractNonceInfo
 * @typedef {import("@hashgraph/proto").proto.IContractID} HieroProto.proto.IContractID
 * @typedef {object} ContractNonceInfoJSON
 * @property {string} contractId
 * @property {number} nonce
 */

/**
 * Info about a contract account's nonce value.
 * A nonce of a contract is only incremented when that contract creates another contract.
 */
export default class ContractNonceInfo {
    /**
     * @param {object} props
     * @param {ContractId} props.contractId
     * @param {Long} props.nonce
     */
    constructor(props) {
        /**
         * Id of the contract
         *
         * @readonly
         */
        this.contractId = props.contractId;

        /**
         * The current value of the contract account's nonce property
         *
         * @readonly
         */
        this.nonce = props.nonce;

        Object.freeze(this);
    }

    /**
     *  Extract the contractNonce from the protobuf.
     *
     * @internal
     * @param {HieroProto.proto.IContractNonceInfo} contractNonceInfo the protobuf
     * @returns {ContractNonceInfo} the contract object
     */
    static _fromProtobuf(contractNonceInfo) {
        return new ContractNonceInfo({
            contractId: ContractId._fromProtobuf(
                /** @type {HieroProto.proto.IContractID} */ (
                    contractNonceInfo.contractId
                ),
            ),
            nonce:
                contractNonceInfo.nonce != null
                    ? contractNonceInfo.nonce
                    : Long.ZERO,
        });
    }

    /**
     * Build the protobuf
     *
     * @internal
     * @returns {HieroProto.proto.IContractNonceInfo} the protobuf representation
     */
    _toProtobuf() {
        return {
            contractId: this.contractId._toProtobuf(),
            nonce: this.nonce,
        };
    }

    /**
     * Extract the contractNonce from a byte array.
     *
     * @param {Uint8Array} bytes the byte array
     * @returns {ContractNonceInfo} the extracted contract nonce info
     */
    static fromBytes(bytes) {
        return ContractNonceInfo._fromProtobuf(
            proto.ContractNonceInfo.decode(bytes),
        );
    }

    /**
     * Create a byte array representation.
     *
     * @returns {Uint8Array} the byte array representation
     */
    toBytes() {
        return proto.ContractNonceInfo.encode(this._toProtobuf()).finish();
    }

    /**
     * Create a JSON representation.
     *
     * @returns {ContractNonceInfoJSON} the JSON representation
     */
    toJSON() {
        return {
            contractId: this.contractId.toString(),
            nonce: this.nonce.toNumber(),
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @param {this} other
     * @returns {boolean}
     */
    equals(other) {
        return (
            this.contractId.equals(other.contractId) &&
            this.nonce.eq(other.nonce)
        );
    }
}
