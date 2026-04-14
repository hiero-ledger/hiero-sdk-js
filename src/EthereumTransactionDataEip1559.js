import { decodeRlp, encodeRlp } from "ethers";
import * as hex from "./encoding/hex.js";
import EthereumTransactionData from "./EthereumTransactionData.js";
import CACHE from "./Cache.js";

/**
 * @typedef {[Uint8Array, Uint8Array[]]} AccessListItem - [address, storageKeys[]]
 */

/**
 * @typedef {object} AccessListItemJSON
 * @property {string} address
 * @property {string[]} storageKeys
 */

/**
 * @typedef {object} EthereumTransactionDataEip1559JSON
 * @property {string} chainId
 * @property {string} nonce
 * @property {string} maxPriorityGas
 * @property {string} maxGas
 * @property {string} gasLimit
 * @property {string} to
 * @property {string} value
 * @property {string} callData
 * @property {AccessListItemJSON[]} accessList
 * @property {string} recId
 * @property {string} r
 * @property {string} s
 */

export default class EthereumTransactionDataEip1559 extends EthereumTransactionData {
    /**
     * @private
     * @param {object} props
     * @param {Uint8Array} props.chainId
     * @param {Uint8Array} props.nonce
     * @param {Uint8Array} props.maxPriorityGas
     * @param {Uint8Array} props.maxGas
     * @param {Uint8Array} props.gasLimit
     * @param {Uint8Array} props.to
     * @param {Uint8Array} props.value
     * @param {Uint8Array} props.callData
     * @param {AccessListItem[]} props.accessList
     * @param {Uint8Array} props.recId
     * @param {Uint8Array} props.r
     * @param {Uint8Array} props.s
     */
    constructor(props) {
        super(props);

        this.chainId = props.chainId;
        this.nonce = props.nonce;
        this.maxPriorityGas = props.maxPriorityGas;
        this.maxGas = props.maxGas;
        this.gasLimit = props.gasLimit;
        this.to = props.to;
        this.value = props.value;
        this.accessList = props.accessList;
        this.recId = props.recId;
        this.r = props.r;
        this.s = props.s;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {EthereumTransactionData}
     */
    static fromBytes(bytes) {
        if (bytes.length === 0) {
            throw new Error("empty bytes");
        }

        const decoded = /** @type {unknown[]} */ (
            /** @type {unknown} */ (decodeRlp(bytes.subarray(1)))
        );

        if (!Array.isArray(decoded)) {
            throw new Error("ethereum data is not a list");
        }

        if (decoded.length != 12) {
            throw new Error("invalid ethereum transaction data");
        }

        // TODO
        return new EthereumTransactionDataEip1559({
            chainId: hex.decode(/** @type {string} */ (decoded[0])),
            nonce: hex.decode(/** @type {string} */ (decoded[1])),
            maxPriorityGas: hex.decode(/** @type {string} */ (decoded[2])),
            maxGas: hex.decode(/** @type {string} */ (decoded[3])),
            gasLimit: hex.decode(/** @type {string} */ (decoded[4])),
            to: hex.decode(/** @type {string} */ (decoded[5])),
            value: hex.decode(/** @type {string} */ (decoded[6])),
            callData: hex.decode(/** @type {string} */ (decoded[7])),
            accessList: /** @type {AccessListItem[]} */ (
                /** @type {Array<[string, string[]]>} */ (
                    /** @type {unknown} */ (decoded[8])
                ).map((item) => {
                    if (!Array.isArray(item) || item.length !== 2) {
                        throw new Error(
                            "invalid access list entry: must be [address, storageKeys[]]",
                        );
                    }
                    return [
                        hex.decode(item[0]),
                        item[1].map((key) => hex.decode(key)),
                    ];
                })
            ),
            recId: hex.decode(/** @type {string} */ (decoded[9])),
            r: hex.decode(/** @type {string} */ (decoded[10])),
            s: hex.decode(/** @type {string} */ (decoded[11])),
        });
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        const encoded = encodeRlp([
            this.chainId,
            this.nonce,
            this.maxPriorityGas,
            this.maxGas,
            this.gasLimit,
            this.to,
            this.value,
            this.callData,
            this.accessList,
            this.recId,
            this.r,
            this.s,
        ]);
        return hex.decode("02" + encoded.substring(2));
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON(), null, 2);
    }

    /**
     * @returns {EthereumTransactionDataEip1559JSON}
     */
    toJSON() {
        return {
            chainId: hex.encode(this.chainId),
            nonce: hex.encode(this.nonce),
            maxPriorityGas: hex.encode(this.maxPriorityGas),
            maxGas: hex.encode(this.maxGas),
            gasLimit: hex.encode(this.gasLimit),
            to: hex.encode(this.to),
            value: hex.encode(this.value),
            callData: hex.encode(this.callData),
            accessList: this.accessList.map(([address, storageKeys]) => ({
                address: hex.encode(address),
                storageKeys: storageKeys.map((key) => hex.encode(key)),
            })),
            recId: hex.encode(this.recId),
            r: hex.encode(this.r),
            s: hex.encode(this.s),
        };
    }
}

CACHE.setEthereumTransactionDataEip1559FromBytes((bytes) =>
    EthereumTransactionDataEip1559.fromBytes(bytes),
);
