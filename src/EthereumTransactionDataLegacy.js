import { decodeRlp, encodeRlp } from "ethers";
import * as hex from "./encoding/hex.js";
import EthereumTransactionData from "./EthereumTransactionData.js";
import EvmAddress from "./EvmAddress.js";
import CACHE from "./Cache.js";

/**
 * @typedef {import("long")} Long
 * @typedef {import("bignumber.js").default} BigNumber
 */

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

        const decoded = /** @type {unknown[]} */ (
            /** @type {unknown} */ (decodeRlp(bytes))
        );

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
                // r/s are signature scalars: encode minimally (no leading
                // zero bytes), or nodes reject the tx as a non-canonical integer.
                this._toMinimalBytes(this.r),
                this._toMinimalBytes(this.s),
            ]),
        );
    }

    /**
     * Sign this transaction data with the given ECDSA (secp256k1) key,
     * populating `v`, `r` and `s`. Throws if `key` is not an ECDSA key.
     *
     * The unsigned, non-type-prefixed RLP payload is signed and `v` is stored
     * as `27 + recoveryId` (pre-EIP-155).
     *
     * @param {import("./PrivateKey.js").default} key
     * @returns {EthereumTransactionDataLegacy}
     */
    sign(key) {
        const message = hex.decode(
            encodeRlp([
                this.nonce,
                this.gasPrice,
                this.gasLimit,
                this.to,
                this.value,
                this.callData,
            ]),
        );

        const { r, s, recoveryId } = this._signMessage(key, message);
        this.r = r;
        this.s = s;
        this.v = this._numberToBytes(27 + recoveryId);

        return this;
    }

    // --- Typed accessors (additive; the Uint8Array fields remain the source of truth) ---

    /**
     * @returns {Long} the nonce as an unsigned integer
     */
    getNonce() {
        return this._bytesToLong(this.nonce);
    }

    /**
     * @returns {Uint8Array} the raw nonce bytes
     */
    getNonceBytes() {
        return this.nonce;
    }

    /**
     * @param {number | bigint | Long | BigNumber | Uint8Array | string} nonce
     * @returns {this}
     */
    setNonce(nonce) {
        this.nonce = this._toMinimalBytes(nonce);
        return this;
    }

    /**
     * @returns {BigNumber} the gas price
     */
    getGasPrice() {
        return this._bytesToBigNumber(this.gasPrice);
    }

    /**
     * @returns {Uint8Array} the raw gas price bytes
     */
    getGasPriceBytes() {
        return this.gasPrice;
    }

    /**
     * @param {number | bigint | Long | BigNumber | Uint8Array | string} gasPrice
     * @returns {this}
     */
    setGasPrice(gasPrice) {
        this.gasPrice = this._toMinimalBytes(gasPrice);
        return this;
    }

    /**
     * @returns {Long} the gas limit as an unsigned integer
     */
    getGasLimit() {
        return this._bytesToLong(this.gasLimit);
    }

    /**
     * @returns {Uint8Array} the raw gas limit bytes
     */
    getGasLimitBytes() {
        return this.gasLimit;
    }

    /**
     * @param {number | bigint | Long | BigNumber | Uint8Array | string} gasLimit
     * @returns {this}
     */
    setGasLimit(gasLimit) {
        this.gasLimit = this._toMinimalBytes(gasLimit);
        return this;
    }

    /**
     * @returns {?EvmAddress} the `to` address, or `null` when none is set
     *     (contract creation)
     */
    getTo() {
        return this.to.length === 0 ? null : EvmAddress.fromBytes(this.to);
    }

    /**
     * @returns {Uint8Array} the raw `to` address bytes
     */
    getToBytes() {
        return this.to;
    }

    /**
     * @param {EvmAddress | Uint8Array | string} to
     * @returns {this}
     */
    setTo(to) {
        this.to =
            to instanceof EvmAddress ? to.toBytes() : this._toExactBytes(to);
        return this;
    }

    /**
     * @returns {BigNumber} the value (in wei)
     */
    getValue() {
        return this._bytesToBigNumber(this.value);
    }

    /**
     * @returns {Uint8Array} the raw value bytes
     */
    getValueBytes() {
        return this.value;
    }

    /**
     * @param {number | bigint | Long | BigNumber | Uint8Array | string} value
     * @returns {this}
     */
    setValue(value) {
        this.value = this._toMinimalBytes(value);
        return this;
    }

    /**
     * @returns {Uint8Array} the call data
     */
    getCallData() {
        return this.callData;
    }

    /**
     * @param {Uint8Array | string} callData
     * @returns {this}
     */
    setCallData(callData) {
        this.callData = this._toExactBytes(callData);
        return this;
    }

    /**
     * @returns {Long} the `v` value (recovery id + 27, pre-EIP-155)
     */
    getV() {
        return this._bytesToLong(this.v);
    }

    /**
     * @returns {Uint8Array} the raw `v` bytes
     */
    getVBytes() {
        return this.v;
    }

    /**
     * @returns {Uint8Array} the signature `r` value
     */
    getR() {
        return this.r;
    }

    /**
     * @returns {Uint8Array} the signature `s` value
     */
    getS() {
        return this.s;
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
