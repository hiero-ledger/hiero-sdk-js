import { decodeRlp, encodeRlp } from "ethers";
import * as hex from "./encoding/hex.js";
import EthereumTransactionData from "./EthereumTransactionData.js";
import EvmAddress from "./EvmAddress.js";
import EthereumAccessListItem from "./EthereumAccessListItem.js";
import CACHE from "./Cache.js";

/**
 * @typedef {import("long")} Long
 * @typedef {import("bignumber.js").default} BigNumber
 */

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
     * Sign this transaction data with the given ECDSA (secp256k1) key,
     * populating `recId`, `r` and `s`. Throws if `key` is not an ECDSA key.
     *
     * @param {import("./PrivateKey.js").default} key
     * @returns {EthereumTransactionDataEip1559}
     */
    sign(key) {
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
        ]);
        const message = hex.decode("02" + encoded.substring(2));

        const { r, s, recoveryId } = this._signMessage(key, message);
        this.r = r;
        this.s = s;
        this.recId = this._numberToBytes(recoveryId);

        return this;
    }

    // --- Typed accessors (additive; the Uint8Array fields remain the source of truth) ---

    /**
     * @returns {Long} the chain id as an unsigned integer
     */
    getChainId() {
        return this._bytesToLong(this.chainId);
    }

    /**
     * @returns {Uint8Array} the raw chain id bytes
     */
    getChainIdBytes() {
        return this.chainId;
    }

    /**
     * @param {number | Long | BigNumber | Uint8Array | string} chainId
     * @returns {this}
     */
    setChainId(chainId) {
        this.chainId = this._toMinimalBytes(chainId);
        return this;
    }

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
     * @param {number | Long | BigNumber | Uint8Array | string} nonce
     * @returns {this}
     */
    setNonce(nonce) {
        this.nonce = this._toMinimalBytes(nonce);
        return this;
    }

    /**
     * @returns {BigNumber} the max priority fee per gas
     */
    getMaxPriorityGas() {
        return this._bytesToBigNumber(this.maxPriorityGas);
    }

    /**
     * @returns {Uint8Array} the raw max priority fee per gas bytes
     */
    getMaxPriorityGasBytes() {
        return this.maxPriorityGas;
    }

    /**
     * @param {number | Long | BigNumber | Uint8Array | string} maxPriorityGas
     * @returns {this}
     */
    setMaxPriorityGas(maxPriorityGas) {
        this.maxPriorityGas = this._toMinimalBytes(maxPriorityGas);
        return this;
    }

    /**
     * @returns {BigNumber} the max fee per gas
     */
    getMaxGas() {
        return this._bytesToBigNumber(this.maxGas);
    }

    /**
     * @returns {Uint8Array} the raw max fee per gas bytes
     */
    getMaxGasBytes() {
        return this.maxGas;
    }

    /**
     * @param {number | Long | BigNumber | Uint8Array | string} maxGas
     * @returns {this}
     */
    setMaxGas(maxGas) {
        this.maxGas = this._toMinimalBytes(maxGas);
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
     * @param {number | Long | BigNumber | Uint8Array | string} gasLimit
     * @returns {this}
     */
    setGasLimit(gasLimit) {
        this.gasLimit = this._toMinimalBytes(gasLimit);
        return this;
    }

    /**
     * @returns {EvmAddress} the `to` address
     */
    getTo() {
        return EvmAddress.fromBytes(this.to);
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
            to instanceof EvmAddress ? to.toBytes() : this._toMinimalBytes(to);
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
     * @param {number | Long | BigNumber | Uint8Array | string} value
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
        this.callData = this._toMinimalBytes(callData);
        return this;
    }

    /**
     * @returns {Long} the recovery id
     */
    getRecId() {
        return this._bytesToLong(this.recId);
    }

    /**
     * @returns {Uint8Array} the raw recovery id bytes
     */
    getRecIdBytes() {
        return this.recId;
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
     * @returns {EthereumAccessListItem[]} a structured view of the access list
     */
    getAccessList() {
        return this.accessList.map((tuple) =>
            EthereumAccessListItem.fromTuple(tuple),
        );
    }

    /**
     * @param {EthereumAccessListItem[]} accessList
     * @returns {this}
     */
    setAccessList(accessList) {
        this.accessList = accessList.map((item) => item.toTuple());
        return this;
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
