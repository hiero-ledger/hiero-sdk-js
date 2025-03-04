// SPDX-License-Identifier: Apache-2.0

import ContractFunctionSelector, {
    ArgumentType,
    solidityTypeToString,
} from "./ContractFunctionSelector.js";
import * as utf8 from "../encoding/utf8.js";
import * as hex from "../encoding/hex.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import BigNumber from "bignumber.js";
import * as util from "../util.js";
import { defaultAbiCoder } from "@ethersproject/abi";
import { arrayify } from "@ethersproject/bytes";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import EvmAddress from "../EvmAddress.js";

/**
 * Class to help construct parameters for a Hedera smart contract function call.
 *
 * This class provides methods to add different types of parameters that will be passed to a smart contract function.
 * It supports all Solidity parameter types including basic types (uint/int of various sizes, bool, address),
 * arrays, strings, and bytes.
 *
 */
export default class ContractFunctionParameters {
    constructor() {
        /**
         * @type {ContractFunctionSelector}
         */
        this._selector = new ContractFunctionSelector();

        /**
         * @type {import("./ContractFunctionSelector.js").Argument[]}
         */
        this._arguments = [];
    }

    /**
     * @param {string} value
     * @returns {ContractFunctionParameters}
     */
    addString(value) {
        this._selector.addString();
        return this._addParam(value, true);
    }

    /**
     * @param {string[]} value
     * @returns {ContractFunctionParameters}
     */
    addStringArray(value) {
        this._selector.addStringArray();
        return this._addParam(value, true);
    }

    /**
     * @param {Uint8Array} value
     * @returns {ContractFunctionParameters}
     */
    addBytes(value) {
        this._selector.addBytes();
        return this._addParam(value, true);
    }

    /**
     * @param {Uint8Array} value
     * @returns {ContractFunctionParameters}
     */
    addBytes32(value) {
        if (value.length !== 32) {
            throw new Error(
                `addBytes32 expected array to be of length 32, but received ${value.length}`,
            );
        }

        this._selector.addBytes32();
        return this._addParam(value, false);
    }

    /**
     * @param {Uint8Array[]} value
     * @returns {ContractFunctionParameters}
     */
    addBytesArray(value) {
        this._selector.addBytesArray();
        return this._addParam(value, true);
    }

    /**
     * @param {Uint8Array[]} value
     * @returns {ContractFunctionParameters}
     */
    addBytes32Array(value) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, entry] of value.entries()) {
            if (entry.length !== 32) {
                throw new Error(
                    `addBytes32 expected array to be of length 32, but received ${entry.length}`,
                );
            }
        }

        this._selector.addBytes32Array();
        return this._addParam(value, true);
    }

    /**
     * @param {boolean} value
     * @returns {ContractFunctionParameters}
     */
    addBool(value) {
        this._selector.addBool();
        return this._addParam(value, false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt8(value) {
        this._selector.addInt8();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint8(value) {
        this._selector.addUint8();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt16(value) {
        this._selector.addInt16();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint16(value) {
        this._selector.addUint16();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt24(value) {
        this._selector.addInt24();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint24(value) {
        this._selector.addUint24();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt32(value) {
        this._selector.addInt32();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint32(value) {
        this._selector.addUint32();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt40(value) {
        this._selector.addInt40();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint40(value) {
        this._selector.addUint40();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt48(value) {
        this._selector.addInt48();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint48(value) {
        this._selector.addUint48();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt56(value) {
        this._selector.addInt56();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint56(value) {
        this._selector.addUint56();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt64(value) {
        this._selector.addInt64();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint64(value) {
        this._selector.addUint64();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt72(value) {
        this._selector.addInt72();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint72(value) {
        this._selector.addUint72();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt80(value) {
        this._selector.addInt80();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint80(value) {
        this._selector.addUint80();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt88(value) {
        this._selector.addInt88();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint88(value) {
        this._selector.addUint88();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt96(value) {
        this._selector.addInt96();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint96(value) {
        this._selector.addUint96();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt104(value) {
        this._selector.addInt104();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint104(value) {
        this._selector.addUint104();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt112(value) {
        this._selector.addInt112();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint112(value) {
        this._selector.addUint112();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt120(value) {
        this._selector.addInt120();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint120(value) {
        this._selector.addUint120();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt128(value) {
        this._selector.addInt128();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint128(value) {
        this._selector.addUint128();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt136(value) {
        this._selector.addInt136();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint136(value) {
        this._selector.addUint136();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt144(value) {
        this._selector.addInt144();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint144(value) {
        this._selector.addUint144();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt152(value) {
        this._selector.addInt152();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint152(value) {
        this._selector.addUint152();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt160(value) {
        this._selector.addInt160();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint160(value) {
        this._selector.addUint160();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt168(value) {
        this._selector.addInt168();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint168(value) {
        this._selector.addUint168();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt176(value) {
        this._selector.addInt176();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint176(value) {
        this._selector.addUint176();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt184(value) {
        this._selector.addInt184();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint184(value) {
        this._selector.addUint184();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt192(value) {
        this._selector.addInt192();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint192(value) {
        this._selector.addUint192();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt200(value) {
        this._selector.addInt200();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint200(value) {
        this._selector.addUint200();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt208(value) {
        this._selector.addInt208();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint208(value) {
        this._selector.addUint208();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt216(value) {
        this._selector.addInt216();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint216(value) {
        this._selector.addUint216();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt224(value) {
        this._selector.addInt224();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint224(value) {
        this._selector.addUint224();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt232(value) {
        this._selector.addInt232();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint232(value) {
        this._selector.addUint232();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt240(value) {
        this._selector.addInt240();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint240(value) {
        this._selector.addUint240();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt248(value) {
        this._selector.addInt248();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint248(value) {
        this._selector.addUint248();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addInt256(value) {
        this._selector.addInt256();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number | BigNumber | Long} value
     * @returns {ContractFunctionParameters}
     */
    addUint256(value) {
        this._selector.addUint256();
        return this._addParam(util.convertToBigNumber(value), false);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt8Array(value) {
        this._selector.addInt8Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint8Array(value) {
        this._selector.addUint8Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt16Array(value) {
        this._selector.addInt16Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint16Array(value) {
        this._selector.addUint16Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt24Array(value) {
        this._selector.addInt24Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint24Array(value) {
        this._selector.addUint24Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt32Array(value) {
        this._selector.addInt32Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint32Array(value) {
        this._selector.addUint32Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt40Array(value) {
        this._selector.addInt40Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint40Array(value) {
        this._selector.addUint40Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt48Array(value) {
        this._selector.addInt48Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint48Array(value) {
        this._selector.addUint48Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt56Array(value) {
        this._selector.addInt56Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint56Array(value) {
        this._selector.addUint56Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt64Array(value) {
        this._selector.addInt64Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint64Array(value) {
        this._selector.addUint64Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt72Array(value) {
        this._selector.addInt72Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint72Array(value) {
        this._selector.addUint72Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt80Array(value) {
        this._selector.addInt80Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint80Array(value) {
        this._selector.addUint80Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt88Array(value) {
        this._selector.addInt88Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint88Array(value) {
        this._selector.addUint88Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt96Array(value) {
        this._selector.addInt96Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint96Array(value) {
        this._selector.addUint96Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt104Array(value) {
        this._selector.addInt104Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint104Array(value) {
        this._selector.addUint104Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt112Array(value) {
        this._selector.addInt112Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint112Array(value) {
        this._selector.addUint112Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt120Array(value) {
        this._selector.addInt120Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint120Array(value) {
        this._selector.addUint120Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt128Array(value) {
        this._selector.addInt128Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint128Array(value) {
        this._selector.addUint128Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt136Array(value) {
        this._selector.addInt136Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint136Array(value) {
        this._selector.addUint136Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt144Array(value) {
        this._selector.addInt144Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint144Array(value) {
        this._selector.addUint144Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt152Array(value) {
        this._selector.addInt152Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint152Array(value) {
        this._selector.addUint152Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt160Array(value) {
        this._selector.addInt160Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint160Array(value) {
        this._selector.addUint160Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt168Array(value) {
        this._selector.addInt168Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint168Array(value) {
        this._selector.addUint168Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt176Array(value) {
        this._selector.addInt176Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint176Array(value) {
        this._selector.addUint176Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt184Array(value) {
        this._selector.addInt184Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint184Array(value) {
        this._selector.addUint184Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt192Array(value) {
        this._selector.addInt192Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint192Array(value) {
        this._selector.addUint192Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt200Array(value) {
        this._selector.addInt200Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint200Array(value) {
        this._selector.addUint200Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt208Array(value) {
        this._selector.addInt208Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint208Array(value) {
        this._selector.addUint208Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt216Array(value) {
        this._selector.addInt216Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint216Array(value) {
        this._selector.addUint216Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt224Array(value) {
        this._selector.addInt224Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint224Array(value) {
        this._selector.addUint224Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt232Array(value) {
        this._selector.addInt232Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint232Array(value) {
        this._selector.addUint232Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt240Array(value) {
        this._selector.addInt240Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint240Array(value) {
        this._selector.addUint240Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt248Array(value) {
        this._selector.addInt248Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint248Array(value) {
        this._selector.addUint248Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addInt256Array(value) {
        this._selector.addInt256Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {number[] | BigNumber[] | Long[]} value
     * @returns {ContractFunctionParameters}
     */
    addUint256Array(value) {
        this._selector.addUint256Array();
        return this._addParam(util.convertToBigNumberArray(value), true);
    }

    /**
     * @param {string | EvmAddress} value
     * @returns {ContractFunctionParameters}
     */
    addAddress(value) {
        let address;
        if (typeof value === "string") {
            // Allow `0x` prefix
            if (value.length !== 40 && value.length !== 42) {
                throw new Error(
                    "`address` type requires parameter to be 40 or 42 characters",
                );
            }
            address = value;
        } else {
            address = value.toString();
        }

        const par =
            address.length === 40
                ? hex.decode(address)
                : hex.decode(address.substring(2));

        this._selector.addAddress();

        return this._addParam(par, false);
    }

    /**
     * @param {string[] | EvmAddress[]} value
     * @returns {ContractFunctionParameters}
     */
    addAddressArray(value) {
        /**
         * @type {Uint8Array[]}
         */
        const par = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, entry] of value.entries()) {
            let address;
            if (typeof entry === "string") {
                if (entry.length !== 40 && entry.length !== 42) {
                    throw new Error(
                        "`address` type requires parameter to be 40 or 42 characters",
                    );
                }
                address = entry;
            } else {
                address = entry.toString();
            }

            const buf =
                address.length === 40
                    ? hex.decode(address)
                    : hex.decode(address.substring(2));

            par.push(buf);
        }

        this._selector.addAddressArray();

        return this._addParam(par, true);
    }

    /**
     * @param {string} address
     * @param {ContractFunctionSelector} selector
     * @returns {ContractFunctionParameters}
     */
    addFunction(address, selector) {
        const addressParam = hex.decode(address);
        const functionSelector = selector._build();

        if (addressParam.length !== 20) {
            throw new Error(
                "`function` type requires parameter `address` to be exactly 20 bytes",
            );
        }

        this._selector.addFunction();

        const proto = new Uint8Array(24);
        proto.set(addressParam, 0);
        proto.set(functionSelector, 20);

        return this._addParam(proto, false);
    }

    /**
     * @internal
     * @param {string | boolean | number | Uint8Array | BigNumber | string[] | boolean[] | number[] | Uint8Array[] | BigNumber[]} param
     * @param {boolean} dynamic
     * @returns {ContractFunctionParameters}
     */
    _addParam(param, dynamic) {
        const index = this._selector._paramTypes.length - 1;
        const value = argumentToBytes(param, this._selector._paramTypes[index]);

        this._arguments.push({ dynamic, value });
        return this;
    }

    /**
     * @internal
     * @param {string=} name
     * @returns {Uint8Array}
     */
    _build(name) {
        const includeId = name != null;
        const nameOffset = includeId ? 4 : 0;

        const length =
            this._arguments.length === 0
                ? nameOffset
                : this._arguments.length * 32 +
                  this._arguments
                      .map((arg) => (arg.dynamic ? arg.value.length : 0))
                      .reduce((sum, value) => sum + value) +
                  nameOffset;

        const func = new Uint8Array(length);

        if (includeId) {
            func.set(this._selector._build(name), 0);
        }

        let offset = 32 * this._arguments.length;

        for (const [i, { dynamic, value }] of this._arguments.entries()) {
            if (dynamic) {
                const view = util.safeView(func, nameOffset + i * 32 + 28);
                view.setUint32(0, offset);
                func.set(value, view.getUint32(0) + nameOffset);
                offset += value.length;
            } else {
                func.set(value, nameOffset + i * 32);
            }
        }

        return func;
    }
}

/**
 * @param {string | boolean | number | Uint8Array | BigNumber | string[] | boolean[] | number[] | Uint8Array[] | BigNumber[]} param
 * @param {import("./ContractFunctionSelector.js").SolidityType} ty
 * @returns {Uint8Array}
 */
function argumentToBytes(param, ty) {
    let value = new Uint8Array(32);
    let valueView = util.safeView(value);
    /** @type {Uint8Array} */
    let par;

    if (ty.array) {
        if (!Array.isArray(param)) {
            throw new TypeError(
                "SolidityType indicates type is array, but parameter is not an array",
            );
        }

        /**
         * @type {Uint8Array[]}
         */
        const values = [];

        // Generic over any type of array
        // Destructuring required so the first variable must be assigned
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, p] of param.entries()) {
            const arg = argumentToBytes(p, { ty: ty.ty, array: false });
            values.push(arg);
        }

        const totalLengthOfValues = values
            .map((a) => a.length)
            .reduce((total, current) => total + current, 0);

        switch (ty.ty) {
            case ArgumentType.uint8:
            case ArgumentType.int8:
            case ArgumentType.uint16:
            case ArgumentType.int16:
            case ArgumentType.uint24:
            case ArgumentType.int24:
            case ArgumentType.uint32:
            case ArgumentType.int32:
            case ArgumentType.uint40:
            case ArgumentType.int40:
            case ArgumentType.uint48:
            case ArgumentType.int48:
            case ArgumentType.uint56:
            case ArgumentType.int56:
            case ArgumentType.uint64:
            case ArgumentType.int64:
            case ArgumentType.uint72:
            case ArgumentType.int72:
            case ArgumentType.uint80:
            case ArgumentType.int80:
            case ArgumentType.uint88:
            case ArgumentType.int88:
            case ArgumentType.uint96:
            case ArgumentType.int96:
            case ArgumentType.uint104:
            case ArgumentType.int104:
            case ArgumentType.uint112:
            case ArgumentType.int112:
            case ArgumentType.uint120:
            case ArgumentType.int120:
            case ArgumentType.uint128:
            case ArgumentType.int128:
            case ArgumentType.uint136:
            case ArgumentType.int136:
            case ArgumentType.uint144:
            case ArgumentType.int144:
            case ArgumentType.uint152:
            case ArgumentType.int152:
            case ArgumentType.uint160:
            case ArgumentType.int160:
            case ArgumentType.uint168:
            case ArgumentType.int168:
            case ArgumentType.uint176:
            case ArgumentType.int176:
            case ArgumentType.uint184:
            case ArgumentType.int184:
            case ArgumentType.uint192:
            case ArgumentType.int192:
            case ArgumentType.uint200:
            case ArgumentType.int200:
            case ArgumentType.uint208:
            case ArgumentType.int208:
            case ArgumentType.uint216:
            case ArgumentType.int216:
            case ArgumentType.uint224:
            case ArgumentType.int224:
            case ArgumentType.uint232:
            case ArgumentType.int232:
            case ArgumentType.uint240:
            case ArgumentType.int240:
            case ArgumentType.uint248:
            case ArgumentType.int248:
            case ArgumentType.uint256:
            case ArgumentType.int256:
            case ArgumentType.bool:
            case ArgumentType.bytes32:
            case ArgumentType.address:
            case ArgumentType.func:
                value = new Uint8Array(totalLengthOfValues + 32);
                break;
            case ArgumentType.bytes:
            case ArgumentType.string:
                value = new Uint8Array(
                    values.length * 32 + totalLengthOfValues + 32,
                );
                break;
            default:
                throw new TypeError(
                    `Expected param type to be ArgumentType, but received ${ty.ty}`,
                );
        }

        valueView = util.safeView(value, 28);
        valueView.setUint32(0, values.length);

        let offset = 32 * values.length;

        for (const [i, e] of values.entries()) {
            switch (ty.ty) {
                case ArgumentType.uint8:
                case ArgumentType.int8:
                case ArgumentType.uint16:
                case ArgumentType.int16:
                case ArgumentType.uint24:
                case ArgumentType.int24:
                case ArgumentType.uint32:
                case ArgumentType.int32:
                case ArgumentType.uint40:
                case ArgumentType.int40:
                case ArgumentType.uint48:
                case ArgumentType.int48:
                case ArgumentType.uint56:
                case ArgumentType.int56:
                case ArgumentType.uint64:
                case ArgumentType.int64:
                case ArgumentType.uint72:
                case ArgumentType.int72:
                case ArgumentType.uint80:
                case ArgumentType.int80:
                case ArgumentType.uint88:
                case ArgumentType.int88:
                case ArgumentType.uint96:
                case ArgumentType.int96:
                case ArgumentType.uint104:
                case ArgumentType.int104:
                case ArgumentType.uint112:
                case ArgumentType.int112:
                case ArgumentType.uint120:
                case ArgumentType.int120:
                case ArgumentType.uint128:
                case ArgumentType.int128:
                case ArgumentType.uint136:
                case ArgumentType.int136:
                case ArgumentType.uint144:
                case ArgumentType.int144:
                case ArgumentType.uint152:
                case ArgumentType.int152:
                case ArgumentType.uint160:
                case ArgumentType.int160:
                case ArgumentType.uint168:
                case ArgumentType.int168:
                case ArgumentType.uint176:
                case ArgumentType.int176:
                case ArgumentType.uint184:
                case ArgumentType.int184:
                case ArgumentType.uint192:
                case ArgumentType.int192:
                case ArgumentType.uint200:
                case ArgumentType.int200:
                case ArgumentType.uint208:
                case ArgumentType.int208:
                case ArgumentType.uint216:
                case ArgumentType.int216:
                case ArgumentType.uint224:
                case ArgumentType.int224:
                case ArgumentType.uint232:
                case ArgumentType.int232:
                case ArgumentType.uint240:
                case ArgumentType.int240:
                case ArgumentType.uint248:
                case ArgumentType.int248:
                case ArgumentType.uint256:
                case ArgumentType.int256:
                case ArgumentType.bool:
                case ArgumentType.bytes32:
                case ArgumentType.address:
                case ArgumentType.func:
                    value.set(e, i * 32 + 32);
                    break;
                case ArgumentType.bytes:
                case ArgumentType.string:
                    // eslint-disable-next-line no-case-declarations
                    const view = util.safeView(value, (i + 1) * 32 + 28);
                    view.setUint32(0, offset);
                    value.set(e, view.getUint32(0) + 32);
                    offset += e.length;
                    break;
                default:
                    throw new TypeError(
                        `Expected param type to be ArgumentType, but received ${ty.ty}`,
                    );
            }
        }

        return value;
    }

    switch (ty.ty) {
        case ArgumentType.uint8:
        case ArgumentType.int8:
        case ArgumentType.uint16:
        case ArgumentType.int16:
        case ArgumentType.uint24:
        case ArgumentType.int24:
        case ArgumentType.uint32:
        case ArgumentType.int32:
        case ArgumentType.uint40:
        case ArgumentType.int40:
        case ArgumentType.uint48:
        case ArgumentType.int48:
        case ArgumentType.uint56:
        case ArgumentType.int56:
        case ArgumentType.uint64:
        case ArgumentType.int64:
        case ArgumentType.uint72:
        case ArgumentType.int72:
        case ArgumentType.uint80:
        case ArgumentType.int80:
        case ArgumentType.uint88:
        case ArgumentType.int88:
        case ArgumentType.uint96:
        case ArgumentType.int96:
        case ArgumentType.uint104:
        case ArgumentType.int104:
        case ArgumentType.uint112:
        case ArgumentType.int112:
        case ArgumentType.uint120:
        case ArgumentType.int120:
        case ArgumentType.uint128:
        case ArgumentType.int128:
        case ArgumentType.uint136:
        case ArgumentType.int136:
        case ArgumentType.uint144:
        case ArgumentType.int144:
        case ArgumentType.uint152:
        case ArgumentType.int152:
        case ArgumentType.uint160:
        case ArgumentType.int160:
        case ArgumentType.uint168:
        case ArgumentType.int168:
        case ArgumentType.uint176:
        case ArgumentType.int176:
        case ArgumentType.uint184:
        case ArgumentType.int184:
        case ArgumentType.uint192:
        case ArgumentType.int192:
        case ArgumentType.uint200:
        case ArgumentType.int200:
        case ArgumentType.uint208:
        case ArgumentType.int208:
        case ArgumentType.uint216:
        case ArgumentType.int216:
        case ArgumentType.uint224:
        case ArgumentType.int224:
        case ArgumentType.uint232:
        case ArgumentType.int232:
        case ArgumentType.uint240:
        case ArgumentType.int240:
        case ArgumentType.uint248:
        case ArgumentType.int248:
        case ArgumentType.int256:
        case ArgumentType.uint256: {
            let paramToHex = param.toString(16);

            // @ts-ignore
            if (param > 0 || param == 0) {
                paramToHex = "0x" + paramToHex;
            } else {
                paramToHex =
                    paramToHex.slice(0, 1) + "0x" + paramToHex.slice(1);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const encodedData = defaultAbiCoder.encode(
                [solidityTypeToString(ty)],
                [paramToHex],
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const dataToArrayify = arrayify(encodedData);
            return dataToArrayify;
        }
        case ArgumentType.address:
            value.set(/** @type {Uint8Array} */ (param), 32 - 20);
            return value;
        case ArgumentType.bool:
            value[31] = /** @type {boolean} */ (param) ? 1 : 0;
            return value;
        case ArgumentType.func:
            value.set(/** @type {Uint8Array} */ (param), 32 - 24);
            return value;
        case ArgumentType.bytes32:
            value.set(/** @type {Uint8Array} */ (param), 0);
            return value;
        // Bytes should have not the length already encoded
        // JS String type is encoded as UTF-16 whilst Solidity `string` type is UTF-8 encoded.
        // So if will assume is already correctly updated to being a Uint8Array of UTF-8 string
        case ArgumentType.bytes:
        case ArgumentType.string: {
            // If value is of type string, encode it in UTF-8 format and conver it to Uint8Array
            // Required because JS Strings are UTF-16
            // eslint-disable-next-line no-case-declarations
            par =
                param instanceof Uint8Array
                    ? param
                    : utf8.encode(/** @type {string} */ (param));

            // Resize value to a 32 byte boundary if needed
            if (Math.floor(par.length / 32) >= 0) {
                if (Math.floor(par.length % 32) !== 0) {
                    value = new Uint8Array(
                        (Math.floor(par.length / 32) + 1) * 32 + 32,
                    );
                } else {
                    value = new Uint8Array(
                        Math.floor(par.length / 32) * 32 + 32,
                    );
                }
            } else {
                value = new Uint8Array(64);
            }

            value.set(par, 32);

            valueView = util.safeView(value, 28);
            valueView.setUint32(0, par.length);
            return value;
        }
        default:
            throw new Error(`Unsupported argument type: ${ty.toString()}`);
    }
}
