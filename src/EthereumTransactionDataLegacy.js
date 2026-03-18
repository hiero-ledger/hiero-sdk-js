import { decodeRlp, encodeRlp } from "ethers";
import * as hex from "./encoding/hex.js";
import EthereumTransactionData from "./EthereumTransactionData.js";
import CACHE from "./Cache.js";

/**
 * @typedef {object} EthereumTransactionDataLegacyJSON
 * @property {string} nonce
 * @property {string} gasPrice
 * @property {string} gasLimit
 * @property {string} to
 * @property {string} value
 * @property {string} callData
 * @property {string} v
 * @property {string} r
 * @property {string} s
 */

export default class EthereumTransactionDataLegacy extends EthereumTransactionData {
    /**
     * @private
     * @param {object} props
     * @param {Uint8Array} props.nonce
     * @param {Uint8Array} props.gasPrice
     * @param {Uint8Array} props.gasLimit
     * @param {Uint8Array} props.to
     * @param {Uint8Array} props.value
     * @param {Uint8Array} props.callData
     * @param {Uint8Array} props.v
     * @param {Uint8Array} props.r
     * @param {Uint8Array} props.s
     */
    constructor(props) {
        super(props);

        this.nonce = props.nonce;
        this.gasPrice = props.gasPrice;
        this.gasLimit = props.gasLimit;
        this.to = props.to;
        this.value = props.value;
        this.v = props.v;
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const decoded = /** @type {string[]} */ (decodeRlp(bytes));

        if (decoded.length != 9) {
            throw new Error("invalid ethereum transaction data");
        }

        return new EthereumTransactionDataLegacy({
            nonce: hex.decode(/** @type {string} */ (decoded[0])),
            gasPrice: hex.decode(/** @type {string} */ (decoded[1])),
            gasLimit: hex.decode(/** @type {string} */ (decoded[2])),
            to: hex.decode(/** @type {string} */ (decoded[3])),
            value: hex.decode(/** @type {string} */ (decoded[4])),
            callData: hex.decode(/** @type {string} */ (decoded[5])),
            v: hex.decode(/** @type {string} */ (decoded[6])),
            r: hex.decode(/** @type {string} */ (decoded[7])),
            s: hex.decode(/** @type {string} */ (decoded[8])),
        });
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return hex.decode(
            encodeRlp([
                this.nonce,
                this.gasPrice,
                this.gasLimit,
                this.to,
                this.value,
                this.callData,
                this.v,
                this.r,
                this.s,
            ]),
        );
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON(), null, 2);
    }

    /**
     * @returns {EthereumTransactionDataLegacyJSON}
     */
    toJSON() {
        return {
            nonce: hex.encode(this.nonce),
            gasPrice: hex.encode(this.gasPrice),
            gasLimit: hex.encode(this.gasLimit),
            to: hex.encode(this.to),
            value: hex.encode(this.value),
            callData: hex.encode(this.callData),
            v: hex.encode(this.v),
            r: hex.encode(this.r),
            s: hex.encode(this.s),
        };
    }
}

CACHE.setEthereumTransactionDataLegacyFromBytes((bytes) =>
    EthereumTransactionDataLegacy.fromBytes(bytes),
);
