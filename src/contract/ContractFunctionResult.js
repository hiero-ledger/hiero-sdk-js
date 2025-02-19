// SPDX-License-Identifier: Apache-2.0

import ContractLogInfo from "./ContractLogInfo.js";
import ContractId from "./ContractId.js";
import AccountId from "../account/AccountId.js";
import BigNumber from "bignumber.js";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";
import * as util from "../util.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ParamType, defaultAbiCoder } from "@ethersproject/abi";
import Long from "long";
import ContractNonceInfo from "./ContractNonceInfo.js";

/**
 * @typedef {import("./ContractStateChange.js").default} ContractStateChange
 */

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IContractFunctionResult} HieroProto.proto.IContractFunctionResult
 * @typedef {import("@hashgraph/proto").proto.IContractID} HieroProto.proto.IContractID
 */

/**
 * The result returned by a call to a smart contract function. This is part of the response to
 * a ContractCallLocal query, and is in the record for a ContractCall or ContractCreateInstance
 * transaction. The ContractCreateInstance transaction record has the results of the call to
 * the constructor.
 */
export default class ContractFunctionResult {
    /**
     * Constructor isn't part of the stable API
     *
     * @param {object} result
     * @param {boolean} result._createResult
     * @param {?ContractId} result.contractId
     * @param {?string} result.errorMessage
     * @param {Uint8Array} result.bloom
     * @param {Long} result.gasUsed
     * @param {ContractLogInfo[]} result.logs
     * @param {ContractId[]} result.createdContractIds
     * @param {Uint8Array | null} result.evmAddress
     * @param {Uint8Array} result.bytes
     * @param {Long} result.gas
     * @param {Long} result.amount
     * @param {Uint8Array} result.functionParameters
     * @param {?AccountId} result.senderAccountId
     * @param {ContractStateChange[]} result.stateChanges
     * @param {ContractNonceInfo[]} result.contractNonces
     * @param {Long | null} result.signerNonce
     */
    constructor(result) {
        /**
         * Determines if this result came from `record.contractCreateResult` if true
         * or `record.contractCallResult` if false
         */
        this._createResult = result._createResult;

        /**
         * The smart contract instance whose function was called.
         */
        this.contractId = result.contractId;

        this.bytes = result.bytes;

        /**
         * Message In case there was an error during smart contract execution.
         */
        this.errorMessage = result.errorMessage;

        /**
         * Bloom filter for record
         */
        this.bloom = result.bloom;

        /**
         * Units of gas used  to execute contract.
         */
        this.gasUsed = result.gasUsed;

        /**
         * The log info for events returned by the function.
         */
        this.logs = result.logs;

        /**
         * @deprecated the list of smart contracts that were created by the function call.
         *
         * The created ids will now _also_ be externalized through internal transaction
         * records, where each record has its alias field populated with the new contract's
         * EVM address. (This is needed for contracts created with CREATE2, since
         * there is no longer a simple relationship between the new contract's 0.0.X id
         * and its Solidity address.)
         */
        // eslint-disable-next-line deprecation/deprecation
        this.createdContractIds = result.createdContractIds;

        this.evmAddress = result.evmAddress;

        /**
         * @deprecated - Use mirror node for contract traceability instead
         */
        // eslint-disable-next-line deprecation/deprecation
        this.stateChanges = result.stateChanges;

        /**
         * The amount of gas available for the call, aka the gasLimit.
         */
        this.gas = result.gas;

        /**
         * Number of tinybars sent (the function must be payable if this is nonzero).
         */
        this.amount = result.amount;

        /**
         * The parameters passed into the contract call.
         */
        this.functionParameters = result.functionParameters;

        /**
         * The account that is the "sender." If not present it is the accountId from the transactionId.
         *
         * This field should only be populated when the paired TransactionBody in the record stream is not a
         * ContractCreateTransactionBody or a ContractCallTransactionBody.
         */
        this.senderAccountId = result.senderAccountId;

        /**
         * A list of updated contract account nonces containing the new nonce value for each contract account.
         * This is always empty in a ContractCallLocalResponse#ContractFunctionResult message, since no internal creations can happen in a static EVM call.
         */
        this.contractNonces = result.contractNonces;

        /**
         * If not null this field specifies what the value of the signer account nonce is post transaction execution.
         * For transactions that don't update the signer nonce (like HAPI ContractCall and ContractCreate transactions) this field should be null.
         */
        this.signerNonce = result.signerNonce;
    }

    /**
     * @param {HieroProto.proto.IContractFunctionResult} result
     * @param {boolean} _createResult
     * @returns {ContractFunctionResult}
     */
    static _fromProtobuf(result, _createResult) {
        const contractId = /** @type {HieroProto.proto.IContractID | null} */ (
            result.contractID
        );
        const gasUsed = /** @type {Long} */ (result.gasUsed);
        const gas = /** @type {Long} */ (result.gas ? result.gas : -1);
        const amount = /** @type {Long} */ (result.amount ? result.amount : -1);

        return new ContractFunctionResult({
            _createResult,
            bytes: /** @type {Uint8Array} */ (result.contractCallResult),
            contractId:
                contractId != null
                    ? ContractId._fromProtobuf(contractId)
                    : null,
            errorMessage:
                result.errorMessage != null ? result.errorMessage : null,
            bloom: /** @type {Uint8Array} */ (result.bloom),
            gasUsed:
                gasUsed instanceof Long ? gasUsed : Long.fromValue(gasUsed),
            logs: (result.logInfo != null ? result.logInfo : []).map((info) =>
                ContractLogInfo._fromProtobuf(info),
            ),
            createdContractIds: (result.createdContractIDs != null
                ? result.createdContractIDs
                : []
            ).map((contractId) => ContractId._fromProtobuf(contractId)),
            evmAddress:
                result.evmAddress != null &&
                Object.hasOwn(result.evmAddress, "value") &&
                result.evmAddress.value != null
                    ? result.evmAddress.value
                    : null,
            stateChanges: [],
            gas: gas instanceof Long ? gas : Long.fromValue(gas),
            amount: amount instanceof Long ? amount : Long.fromValue(amount),
            functionParameters: /** @type {Uint8Array} */ (
                result.functionParameters
            ),
            senderAccountId:
                result.senderId != null
                    ? AccountId._fromProtobuf(result.senderId)
                    : null,
            contractNonces: (result.contractNonces != null
                ? result.contractNonces
                : []
            ).map((contractNonce) =>
                ContractNonceInfo._fromProtobuf(contractNonce),
            ),
            signerNonce:
                result.signerNonce != null
                    ? Object.hasOwn(result.signerNonce, "value")
                        ? result.signerNonce.value || null
                        : null
                    : null,
        });
    }

    /**
     * @returns {Uint8Array}
     */
    asBytes() {
        return this.bytes;
    }

    /**
     * @param {number} [index]
     * @returns {string}
     */
    getString(index) {
        return utf8.decode(this.getBytes(index));
    }

    /**
     * @private
     * @param {number} [index]
     * @returns {Uint8Array}
     */
    getBytes(index) {
        // Len should never be larger than Number.MAX
        // index * 32 is the position of the lenth
        // (index + 1) * 32 onward to (index + 1) * 32 + len will be the elements of the array
        // Arrays in solidity cannot be longer than 1024:
        // https://solidity.readthedocs.io/en/v0.4.21/introduction-to-smart-contracts.html
        const offset = this.getInt32(index);
        const len = util.safeView(this.bytes).getInt32(offset + 28);

        return this.bytes.subarray(offset + 32, offset + 32 + len);
    }

    /**
     * @param {number} [index]
     * @returns {Uint8Array}
     */
    getBytes32(index) {
        return this.bytes.subarray(
            (index != null ? index : 0) * 32,
            (index != null ? index : 0) * 32 + 32,
        );
    }

    /**
     * @param {number} [index]
     * @returns {boolean}
     */
    getBool(index) {
        return this.bytes[(index != null ? index : 0) * 32 + 31] !== 0;
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getInt8(index) {
        const position = (index != null ? index : 0) * 32 + 31;
        return util.safeView(this.bytes).getInt8(position);
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getUint8(index) {
        return this.bytes[(index != null ? index : 0) * 32 + 31];
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getInt16(index) {
        // .getInt32() interprets as big-endian
        // Using DataView instead of Uint32Array because the latter interprets
        // using platform endianness which is little-endian on x86
        const position = (index != null ? index : 0) * 32 + 28;
        return util.safeView(this.bytes).getInt32(position);
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getUint16(index) {
        // .getUint32() interprets as big-endian
        // Using DataView instead of Uint32Array because the latter interprets
        // using platform endianness which is little-endian on x86
        const position = (index != null ? index : 0) * 32 + 28;
        return util.safeView(this.bytes).getUint32(position);
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getInt24(index) {
        // .getInt32() interprets as big-endian
        // Using DataView instead of Uint32Array because the latter interprets
        // using platform endianness which is little-endian on x86
        const position = (index != null ? index : 0) * 32 + 28;
        return util.safeView(this.bytes).getInt32(position);
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getUint24(index) {
        // .getUint32() interprets as big-endian
        // Using DataView instead of Uint32Array because the latter interprets
        // using platform endianness which is little-endian on x86
        const position = (index != null ? index : 0) * 32 + 28;
        return util.safeView(this.bytes).getUint32(position);
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getInt32(index) {
        // .getInt32() interprets as big-endian
        // Using DataView instead of Uint32Array because the latter interprets
        // using platform endianness which is little-endian on x86
        const position = (index != null ? index : 0) * 32 + 28;
        return util.safeView(this.bytes).getInt32(position);
    }

    /**
     * @param {number} [index]
     * @returns {number}
     */
    getUint32(index) {
        // .getUint32() interprets as big-endian
        // Using DataView instead of Uint32Array because the latter interprets
        // using platform endianness which is little-endian on x86
        const position = (index != null ? index : 0) * 32 + 28;
        return util.safeView(this.bytes).getUint32(position);
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt40(index) {
        const result = defaultAbiCoder.decode(
            ["int40"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint40(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(27, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt48(index) {
        const result = defaultAbiCoder.decode(
            ["int48"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint48(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(26, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt56(index) {
        const result = defaultAbiCoder.decode(
            ["int56"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint56(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(25, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt64(index) {
        const result = defaultAbiCoder.decode(
            ["int64"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint64(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(24, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt72(index) {
        const result = defaultAbiCoder.decode(
            ["int72"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint72(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(23, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt80(index) {
        const result = defaultAbiCoder.decode(
            ["int80"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint80(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(22, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt88(index) {
        const result = defaultAbiCoder.decode(
            ["int88"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint88(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(21, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt96(index) {
        const result = defaultAbiCoder.decode(
            ["int96"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint96(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(20, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt104(index) {
        const result = defaultAbiCoder.decode(
            ["int104"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint104(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(19, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt112(index) {
        const result = defaultAbiCoder.decode(
            ["int112"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint112(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(18, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt120(index) {
        const result = defaultAbiCoder.decode(
            ["int120"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint120(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(17, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt128(index) {
        const result = defaultAbiCoder.decode(
            ["int128"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint128(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(16, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt136(index) {
        const result = defaultAbiCoder.decode(
            ["int136"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint136(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(15, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt144(index) {
        const result = defaultAbiCoder.decode(
            ["int144"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint144(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(14, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt152(index) {
        const result = defaultAbiCoder.decode(
            ["int152"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint152(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(13, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt160(index) {
        const result = defaultAbiCoder.decode(
            ["int160"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint160(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(12, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt168(index) {
        const result = defaultAbiCoder.decode(
            ["int168"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint168(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(11, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt176(index) {
        const result = defaultAbiCoder.decode(
            ["int176"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint176(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(10, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt184(index) {
        const result = defaultAbiCoder.decode(
            ["int184"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint184(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(9, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt192(index) {
        const result = defaultAbiCoder.decode(
            ["int192"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint192(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(8, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt200(index) {
        const result = defaultAbiCoder.decode(
            ["int200"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint200(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(7, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt208(index) {
        const result = defaultAbiCoder.decode(
            ["int208"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint208(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(6, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt216(index) {
        const result = defaultAbiCoder.decode(
            ["int216"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint216(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(5, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt224(index) {
        const result = defaultAbiCoder.decode(
            ["int224"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint224(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(4, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt232(index) {
        const result = defaultAbiCoder.decode(
            ["int232"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint232(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(3, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt240(index) {
        const result = defaultAbiCoder.decode(
            ["int240"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint240(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(2, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt248(index) {
        const result = defaultAbiCoder.decode(
            ["int248"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint248(index) {
        return new BigNumber(
            hex.encode(this._getBytes32(index).subarray(1, 32)),
            16,
        );
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getInt256(index) {
        const result = defaultAbiCoder.decode(
            ["int256"],
            this._getBytes32(index != null ? index : 0),
        );
        return new BigNumber(result.toString());
    }

    /**
     * @param {number} [index]
     * @returns {BigNumber}
     */
    getUint256(index) {
        return new BigNumber(hex.encode(this._getBytes32(index)), 16);
    }

    /**
     * @param {number} [index]
     * @returns {string}
     */
    getAddress(index) {
        return hex.encode(
            this.bytes.subarray(
                (index != null ? index : 0) * 32 + 12,
                (index != null ? index : 0) * 32 + 32,
            ),
        );
    }

    /**
     * @description Decode the data according to the array of types, each of which may be a string or ParamType.
     * @param {Array<string | ParamType>} types
     * @returns {string | any}
     */
    getResult(types) {
        return defaultAbiCoder.decode(types, this.bytes);
    }

    /**
     * @param {number} [index]
     * @returns {Uint8Array}
     */
    _getBytes32(index) {
        return this.bytes.subarray(
            (index != null ? index : 0) * 32,
            (index != null ? index : 0) * 32 + 32,
        );
    }

    /**
     * @returns {HieroProto.proto.IContractFunctionResult}
     */
    _toProtobuf() {
        return {
            contractID:
                this.contractId != null ? this.contractId._toProtobuf() : null,
            contractCallResult: this.bytes,
            errorMessage: this.errorMessage,
            bloom: this.bloom,
            gasUsed: this.gasUsed,
            logInfo: this.logs.map((log) => log._toProtobuf()),
            // eslint-disable-next-line deprecation/deprecation
            createdContractIDs: this.createdContractIds.map((id) =>
                id._toProtobuf(),
            ),
            evmAddress:
                this.evmAddress != null
                    ? {
                          value: this.evmAddress,
                      }
                    : null,
            gas: this.gas,
            amount: this.amount,
            functionParameters: this.functionParameters,
            senderId:
                this.senderAccountId != null
                    ? this.senderAccountId._toProtobuf()
                    : null,
            contractNonces: this.contractNonces.map((contractNonce) =>
                contractNonce._toProtobuf(),
            ),
            signerNonce:
                this.signerNonce != null
                    ? {
                          value: this.signerNonce,
                      }
                    : null,
        };
    }
}
