// SPDX-License-Identifier: Apache-2.0

import { keccak256 } from "../cryptography/keccak.js";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";

/**
 * @enum {number}
 */
export const ArgumentType = {
    uint8: 0,
    int8: 1,
    uint16: 2,
    int16: 3,
    uint24: 4,
    int24: 5,
    uint32: 6,
    int32: 7,
    uint40: 8,
    int40: 9,
    uint48: 10,
    int48: 11,
    uint56: 12,
    int56: 13,
    uint64: 14,
    int64: 15,
    uint72: 16,
    int72: 17,
    uint80: 18,
    int80: 19,
    uint88: 20,
    int88: 21,
    uint96: 22,
    int96: 23,
    uint104: 24,
    int104: 25,
    uint112: 26,
    int112: 27,
    uint120: 28,
    int120: 29,
    uint128: 30,
    int128: 31,
    uint136: 32,
    int136: 33,
    uint144: 34,
    int144: 35,
    uint152: 36,
    int152: 37,
    uint160: 38,
    int160: 39,
    uint168: 40,
    int168: 41,
    uint176: 42,
    int176: 43,
    uint184: 44,
    int184: 45,
    uint192: 46,
    int192: 47,
    uint200: 48,
    int200: 49,
    uint208: 50,
    int208: 51,
    uint216: 52,
    int216: 53,
    uint224: 54,
    int224: 55,
    uint232: 56,
    int232: 57,
    uint240: 58,
    int240: 59,
    uint248: 60,
    int248: 61,
    uint256: 62,
    int256: 63,
    string: 64,
    bool: 65,
    bytes: 66,
    bytes32: 67,
    address: 68,
    func: 69,
};

/**
 * @typedef {object} Argument
 * @property {boolean} dynamic
 * @property {Uint8Array} value
 */

/**
 * @typedef {object} SolidityType
 * @property {ArgumentType} ty
 * @property {boolean} array
 */

/**
 * Class to help construct function selectors for Hedera smart contract function calls.
 * Function selectors are the first 4 bytes of the Keccak-256 hash of the function's signature.
 *
 * This class provides methods to build function signatures by adding parameters of various Solidity types.
 * It supports all standard Solidity parameter types and their array variants.
 */
export default class ContractFunctionSelector {
    /**
     * @param {string} [name]
     */
    constructor(name) {
        /**
         * @type {?string}
         */
        this.name = null;

        /**
         * @type {string}
         */
        this._params = "";

        /**
         * @type {SolidityType[]}
         */
        this._paramTypes = [];

        if (name != null) {
            this._name = name;
        }
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addString() {
        return this._addParam({ ty: ArgumentType.string, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addStringArray() {
        return this._addParam({ ty: ArgumentType.string, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addBytes() {
        return this._addParam({ ty: ArgumentType.bytes, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addBytes32() {
        return this._addParam({ ty: ArgumentType.bytes32, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addBytesArray() {
        return this._addParam({ ty: ArgumentType.bytes, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addBytes32Array() {
        return this._addParam({ ty: ArgumentType.bytes32, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt8() {
        return this._addParam({ ty: ArgumentType.int8, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint8() {
        return this._addParam({ ty: ArgumentType.uint8, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt16() {
        return this._addParam({ ty: ArgumentType.int16, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint16() {
        return this._addParam({ ty: ArgumentType.uint16, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt24() {
        return this._addParam({ ty: ArgumentType.int24, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint24() {
        return this._addParam({ ty: ArgumentType.uint24, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt32() {
        return this._addParam({ ty: ArgumentType.int32, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint32() {
        return this._addParam({ ty: ArgumentType.uint32, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt40() {
        return this._addParam({ ty: ArgumentType.int40, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint40() {
        return this._addParam({ ty: ArgumentType.uint40, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt48() {
        return this._addParam({ ty: ArgumentType.int48, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint48() {
        return this._addParam({ ty: ArgumentType.uint48, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt56() {
        return this._addParam({ ty: ArgumentType.int56, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint56() {
        return this._addParam({ ty: ArgumentType.uint56, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt64() {
        return this._addParam({ ty: ArgumentType.int64, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint64() {
        return this._addParam({ ty: ArgumentType.uint64, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt72() {
        return this._addParam({ ty: ArgumentType.int72, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint72() {
        return this._addParam({ ty: ArgumentType.uint72, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt80() {
        return this._addParam({ ty: ArgumentType.int80, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint80() {
        return this._addParam({ ty: ArgumentType.uint80, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt88() {
        return this._addParam({ ty: ArgumentType.int88, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint88() {
        return this._addParam({ ty: ArgumentType.uint88, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt96() {
        return this._addParam({ ty: ArgumentType.int96, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint96() {
        return this._addParam({ ty: ArgumentType.uint96, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt104() {
        return this._addParam({ ty: ArgumentType.int104, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint104() {
        return this._addParam({ ty: ArgumentType.uint104, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt112() {
        return this._addParam({ ty: ArgumentType.int112, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint112() {
        return this._addParam({ ty: ArgumentType.uint112, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt120() {
        return this._addParam({ ty: ArgumentType.int120, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint120() {
        return this._addParam({ ty: ArgumentType.uint120, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt128() {
        return this._addParam({ ty: ArgumentType.int128, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint128() {
        return this._addParam({ ty: ArgumentType.uint128, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt136() {
        return this._addParam({ ty: ArgumentType.int136, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint136() {
        return this._addParam({ ty: ArgumentType.uint136, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt144() {
        return this._addParam({ ty: ArgumentType.int144, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint144() {
        return this._addParam({ ty: ArgumentType.uint144, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt152() {
        return this._addParam({ ty: ArgumentType.int152, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint152() {
        return this._addParam({ ty: ArgumentType.uint152, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt160() {
        return this._addParam({ ty: ArgumentType.int160, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint160() {
        return this._addParam({ ty: ArgumentType.uint160, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt168() {
        return this._addParam({ ty: ArgumentType.int168, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint168() {
        return this._addParam({ ty: ArgumentType.uint168, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt176() {
        return this._addParam({ ty: ArgumentType.int176, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint176() {
        return this._addParam({ ty: ArgumentType.uint176, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt184() {
        return this._addParam({ ty: ArgumentType.int184, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint184() {
        return this._addParam({ ty: ArgumentType.uint184, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt192() {
        return this._addParam({ ty: ArgumentType.int192, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint192() {
        return this._addParam({ ty: ArgumentType.uint192, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt200() {
        return this._addParam({ ty: ArgumentType.int200, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint200() {
        return this._addParam({ ty: ArgumentType.uint200, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt208() {
        return this._addParam({ ty: ArgumentType.int208, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint208() {
        return this._addParam({ ty: ArgumentType.uint208, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt216() {
        return this._addParam({ ty: ArgumentType.int216, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint216() {
        return this._addParam({ ty: ArgumentType.uint216, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt224() {
        return this._addParam({ ty: ArgumentType.int224, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint224() {
        return this._addParam({ ty: ArgumentType.uint224, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt232() {
        return this._addParam({ ty: ArgumentType.int232, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint232() {
        return this._addParam({ ty: ArgumentType.uint232, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt240() {
        return this._addParam({ ty: ArgumentType.int240, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint240() {
        return this._addParam({ ty: ArgumentType.uint240, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt248() {
        return this._addParam({ ty: ArgumentType.int248, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint248() {
        return this._addParam({ ty: ArgumentType.uint248, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt256() {
        return this._addParam({ ty: ArgumentType.int256, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint256() {
        return this._addParam({ ty: ArgumentType.uint256, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt8Array() {
        return this._addParam({ ty: ArgumentType.int8, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint8Array() {
        return this._addParam({ ty: ArgumentType.uint8, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt16Array() {
        return this._addParam({ ty: ArgumentType.int16, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint16Array() {
        return this._addParam({ ty: ArgumentType.uint16, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt24Array() {
        return this._addParam({ ty: ArgumentType.int24, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint24Array() {
        return this._addParam({ ty: ArgumentType.uint24, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt32Array() {
        return this._addParam({ ty: ArgumentType.int32, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint32Array() {
        return this._addParam({ ty: ArgumentType.uint32, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt40Array() {
        return this._addParam({ ty: ArgumentType.int40, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint40Array() {
        return this._addParam({ ty: ArgumentType.uint40, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt48Array() {
        return this._addParam({ ty: ArgumentType.int48, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint48Array() {
        return this._addParam({ ty: ArgumentType.uint48, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt56Array() {
        return this._addParam({ ty: ArgumentType.int56, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint56Array() {
        return this._addParam({ ty: ArgumentType.uint56, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt64Array() {
        return this._addParam({ ty: ArgumentType.int64, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint64Array() {
        return this._addParam({ ty: ArgumentType.uint64, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt72Array() {
        return this._addParam({ ty: ArgumentType.int72, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint72Array() {
        return this._addParam({ ty: ArgumentType.uint72, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt80Array() {
        return this._addParam({ ty: ArgumentType.int80, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint80Array() {
        return this._addParam({ ty: ArgumentType.uint80, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt88Array() {
        return this._addParam({ ty: ArgumentType.int88, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint88Array() {
        return this._addParam({ ty: ArgumentType.uint88, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt96Array() {
        return this._addParam({ ty: ArgumentType.int96, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint96Array() {
        return this._addParam({ ty: ArgumentType.uint96, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt104Array() {
        return this._addParam({ ty: ArgumentType.int104, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint104Array() {
        return this._addParam({ ty: ArgumentType.uint104, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt112Array() {
        return this._addParam({ ty: ArgumentType.int112, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint112Array() {
        return this._addParam({ ty: ArgumentType.uint112, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt120Array() {
        return this._addParam({ ty: ArgumentType.int120, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint120Array() {
        return this._addParam({ ty: ArgumentType.uint120, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt128Array() {
        return this._addParam({ ty: ArgumentType.int128, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint128Array() {
        return this._addParam({ ty: ArgumentType.uint128, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt136Array() {
        return this._addParam({ ty: ArgumentType.int136, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint136Array() {
        return this._addParam({ ty: ArgumentType.uint136, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt144Array() {
        return this._addParam({ ty: ArgumentType.int144, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint144Array() {
        return this._addParam({ ty: ArgumentType.uint144, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt152Array() {
        return this._addParam({ ty: ArgumentType.int152, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint152Array() {
        return this._addParam({ ty: ArgumentType.uint152, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt160Array() {
        return this._addParam({ ty: ArgumentType.int160, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint160Array() {
        return this._addParam({ ty: ArgumentType.uint160, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt168Array() {
        return this._addParam({ ty: ArgumentType.int168, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint168Array() {
        return this._addParam({ ty: ArgumentType.uint168, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt176Array() {
        return this._addParam({ ty: ArgumentType.int176, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint176Array() {
        return this._addParam({ ty: ArgumentType.uint176, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt184Array() {
        return this._addParam({ ty: ArgumentType.int184, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint184Array() {
        return this._addParam({ ty: ArgumentType.uint184, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt192Array() {
        return this._addParam({ ty: ArgumentType.int192, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint192Array() {
        return this._addParam({ ty: ArgumentType.uint192, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt200Array() {
        return this._addParam({ ty: ArgumentType.int200, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint200Array() {
        return this._addParam({ ty: ArgumentType.uint200, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt208Array() {
        return this._addParam({ ty: ArgumentType.int208, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint208Array() {
        return this._addParam({ ty: ArgumentType.uint208, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt216Array() {
        return this._addParam({ ty: ArgumentType.int216, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint216Array() {
        return this._addParam({ ty: ArgumentType.uint216, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt224Array() {
        return this._addParam({ ty: ArgumentType.int224, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint224Array() {
        return this._addParam({ ty: ArgumentType.uint224, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt232Array() {
        return this._addParam({ ty: ArgumentType.int232, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint232Array() {
        return this._addParam({ ty: ArgumentType.uint232, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt240Array() {
        return this._addParam({ ty: ArgumentType.int240, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint240Array() {
        return this._addParam({ ty: ArgumentType.uint240, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt248Array() {
        return this._addParam({ ty: ArgumentType.int248, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint248Array() {
        return this._addParam({ ty: ArgumentType.uint248, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addInt256Array() {
        return this._addParam({ ty: ArgumentType.int256, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addUint256Array() {
        return this._addParam({ ty: ArgumentType.uint256, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addBool() {
        return this._addParam({ ty: ArgumentType.bool, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addAddress() {
        return this._addParam({ ty: ArgumentType.address, array: false });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addAddressArray() {
        return this._addParam({ ty: ArgumentType.address, array: true });
    }

    /**
     * @returns {ContractFunctionSelector}
     */
    addFunction() {
        return this._addParam({ ty: ArgumentType.func, array: false });
    }

    /**
     * @param {SolidityType} ty
     * @returns {ContractFunctionSelector}
     */
    _addParam(ty) {
        if (this._paramTypes.length > 0) {
            this._params += ",";
        }

        this._params += solidityTypeToString(ty);
        this._paramTypes.push(ty);

        return this;
    }

    /**
     * @param {string} [name]
     * @returns {Uint8Array}
     */
    _build(name) {
        if (name != null) {
            this._name = name;
        } else if (this._name == null) {
            throw new Error("`name` required for ContractFunctionSelector");
        }

        const func = hex.encode(utf8.encode(this.toString()));
        return hex.decode(keccak256(`0x${func}`)).slice(0, 4);
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this._name != null ? this._name.toString() : ""}(${
            this._params
        })`;
    }
}

/**
 * @param {SolidityType} ty
 * @returns {string}
 */
export function solidityTypeToString(ty) {
    let s = "";
    switch (ty.ty) {
        case ArgumentType.uint8:
            s = "uint8";
            break;
        case ArgumentType.int8:
            s = "int8";
            break;
        case ArgumentType.uint16:
            s = "uint16";
            break;
        case ArgumentType.int16:
            s = "int16";
            break;
        case ArgumentType.uint24:
            s = "uint24";
            break;
        case ArgumentType.int24:
            s = "int24";
            break;
        case ArgumentType.uint32:
            s = "uint32";
            break;
        case ArgumentType.int32:
            s = "int32";
            break;
        case ArgumentType.uint40:
            s = "uint40";
            break;
        case ArgumentType.int40:
            s = "int40";
            break;
        case ArgumentType.uint48:
            s = "uint48";
            break;
        case ArgumentType.int48:
            s = "int48";
            break;
        case ArgumentType.uint56:
            s = "uint56";
            break;
        case ArgumentType.int56:
            s = "int56";
            break;
        case ArgumentType.uint64:
            s = "uint64";
            break;
        case ArgumentType.int64:
            s = "int64";
            break;
        case ArgumentType.uint72:
            s = "uint72";
            break;
        case ArgumentType.int72:
            s = "int72";
            break;
        case ArgumentType.uint80:
            s = "uint80";
            break;
        case ArgumentType.int80:
            s = "int80";
            break;
        case ArgumentType.uint88:
            s = "uint88";
            break;
        case ArgumentType.int88:
            s = "int88";
            break;
        case ArgumentType.uint96:
            s = "uint96";
            break;
        case ArgumentType.int96:
            s = "int96";
            break;
        case ArgumentType.uint104:
            s = "uint104";
            break;
        case ArgumentType.int104:
            s = "int104";
            break;
        case ArgumentType.uint112:
            s = "uint112";
            break;
        case ArgumentType.int112:
            s = "int112";
            break;
        case ArgumentType.uint120:
            s = "uint120";
            break;
        case ArgumentType.int120:
            s = "int120";
            break;
        case ArgumentType.uint128:
            s = "uint128";
            break;
        case ArgumentType.int128:
            s = "int128";
            break;
        case ArgumentType.uint136:
            s = "uint136";
            break;
        case ArgumentType.int136:
            s = "int136";
            break;
        case ArgumentType.uint144:
            s = "uint144";
            break;
        case ArgumentType.int144:
            s = "int144";
            break;
        case ArgumentType.uint152:
            s = "uint152";
            break;
        case ArgumentType.int152:
            s = "int152";
            break;
        case ArgumentType.uint160:
            s = "uint160";
            break;
        case ArgumentType.int160:
            s = "int160";
            break;
        case ArgumentType.uint168:
            s = "uint168";
            break;
        case ArgumentType.int168:
            s = "int168";
            break;
        case ArgumentType.uint176:
            s = "uint176";
            break;
        case ArgumentType.int176:
            s = "int176";
            break;
        case ArgumentType.uint184:
            s = "uint184";
            break;
        case ArgumentType.int184:
            s = "int184";
            break;
        case ArgumentType.uint192:
            s = "uint192";
            break;
        case ArgumentType.int192:
            s = "int192";
            break;
        case ArgumentType.uint200:
            s = "uint200";
            break;
        case ArgumentType.int200:
            s = "int200";
            break;
        case ArgumentType.uint208:
            s = "uint208";
            break;
        case ArgumentType.int208:
            s = "int208";
            break;
        case ArgumentType.uint216:
            s = "uint216";
            break;
        case ArgumentType.int216:
            s = "int216";
            break;
        case ArgumentType.uint224:
            s = "uint224";
            break;
        case ArgumentType.int224:
            s = "int224";
            break;
        case ArgumentType.uint232:
            s = "uint232";
            break;
        case ArgumentType.int232:
            s = "int232";
            break;
        case ArgumentType.uint240:
            s = "uint240";
            break;
        case ArgumentType.int240:
            s = "int240";
            break;
        case ArgumentType.uint248:
            s = "uint248";
            break;
        case ArgumentType.int248:
            s = "int248";
            break;
        case ArgumentType.uint256:
            s = "uint256";
            break;
        case ArgumentType.int256:
            s = "int256";
            break;
        case ArgumentType.string:
            s = "string";
            break;
        case ArgumentType.bool:
            s = "bool";
            break;
        case ArgumentType.bytes:
            s = "bytes";
            break;
        case ArgumentType.bytes32:
            s = "bytes32";
            break;
        case ArgumentType.address:
            s = "address";
            break;
        case ArgumentType.func:
            s = "function";
            break;
        default:
            s = "";
            break;
    }

    if (ty.array) {
        s += "[]";
    }

    return s;
}
