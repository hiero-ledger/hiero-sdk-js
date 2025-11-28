import * as rlp from "@ethersproject/rlp";
import * as hex from "./encoding/hex.js";
import EthereumTransactionData from "./EthereumTransactionData.js";
import CACHE from "./Cache.js";

/**
 * @typedef {object} EthereumTransactionDataEip7702JSON
 * @property {string} chainId
 * @property {string} nonce
 * @property {string} maxPriorityGas
 * @property {string} maxGas
 * @property {string} gasLimit
 * @property {string} to
 * @property {string} value
 * @property {string} callData
 * @property {Array<[string, string, string, string, string, string]>} authorizationList - Array of [chainId, contractAddress, nonce, yParity, r, s] tuples
 * @property {string[]} accessList
 * @property {string} recId
 * @property {string} r
 * @property {string} s
 */

export default class EthereumTransactionDataEip7702 extends EthereumTransactionData {
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
     * @param {Array<[Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array]>} props.authorizationList - Array of [chainId, contractAddress, nonce, yParity, r, s] tuples
     * @param {Uint8Array[]} props.accessList
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
        this.callData = props.callData;
        this.authorizationList = props.authorizationList;
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const decoded = /** @type {any[]} */ (rlp.decode(bytes.subarray(1)));

        if (!Array.isArray(decoded)) {
            throw new Error("ethereum data is not a list");
        }

        if (decoded.length !== 12) {
            // Type 4 per spec: [chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, data, access_list, [[contract_code, y_parity, r, s], ...], signature_y_parity, signature_r, signature_s]
            throw new Error("invalid ethereum transaction data");
        }

        // Decode authorization list: array of [chainId, contractAddress, nonce, yParity, r, s] tuples
        // Authorization list can be empty (empty array is valid)
        if (!Array.isArray(decoded[8])) {
            throw new Error("authorization list must be an array");
        }
        const authorizationList = /** @type {string[]} */ (decoded[8]).map(
            (authTuple) => {
                if (!Array.isArray(authTuple) || authTuple.length !== 6) {
                    throw new Error(
                        "invalid authorization list entry: must be [chainId, contractAddress, nonce, yParity, r, s]",
                    );
                }
                return [
                    hex.decode(/** @type {string} */ (authTuple[0])), // chainId
                    hex.decode(/** @type {string} */ (authTuple[1])), // contractAddress (20 bytes)
                    hex.decode(/** @type {string} */ (authTuple[2])), // nonce
                    hex.decode(/** @type {string} */ (authTuple[3])), // yParity (0 or 1)
                    hex.decode(/** @type {string} */ (authTuple[4])), // r (32 bytes)
                    hex.decode(/** @type {string} */ (authTuple[5])), // s (32 bytes)
                ];
            },
        );

        return new EthereumTransactionDataEip7702({
            chainId: hex.decode(/** @type {string} */ (decoded[0])), // chain_id
            nonce: hex.decode(/** @type {string} */ (decoded[1])), // nonce
            maxPriorityGas: hex.decode(/** @type {string} */ (decoded[2])), // max_priority_fee_per_gas
            maxGas: hex.decode(/** @type {string} */ (decoded[3])), // max_fee_per_gas
            gasLimit: hex.decode(/** @type {string} */ (decoded[4])), // gas_limit
            to: hex.decode(/** @type {string} */ (decoded[5])), // destination
            value: new Uint8Array(), // value is not in EIP-7702 spec
            callData: hex.decode(/** @type {string} */ (decoded[6])), // data
            // @ts-ignore
            accessList: /** @type {string[]} */ (decoded[7]).map((v) =>
                hex.decode(v),
            ), // access_list
            // @ts-ignore
            authorizationList: authorizationList, // [[contract_code, y_parity, r, s], ...]
            recId: hex.decode(/** @type {string} */ (decoded[9])), // signature_y_parity
            r: hex.decode(/** @type {string} */ (decoded[10])), // signature_r
            s: hex.decode(/** @type {string} */ (decoded[11])), // signature_s
        });
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        // Encode authorization list: each entry is [chainId, contractAddress, nonce, yParity, r, s]
        const encodedAuthorizationList = this.authorizationList.map(
            ([chainId, contractAddress, nonce, yParity, r, s]) => [
                hex.encode(chainId),
                hex.encode(contractAddress),
                hex.encode(nonce),
                hex.encode(yParity),
                hex.encode(r),
                hex.encode(s),
            ],
        );

        // RLP encoding order per spec: [chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, data, access_list, [[contract_code, y_parity, r, s], ...], signature_y_parity, signature_r, signature_s]
        const encoded = rlp.encode([
            this.chainId, // chain_id
            this.nonce, // nonce
            this.maxPriorityGas, // max_priority_fee_per_gas
            this.maxGas, // max_fee_per_gas
            this.gasLimit, // gas_limit
            this.to, // destination
            this.value,
            this.callData, // data
            this.accessList, // access_list
            encodedAuthorizationList, // [[contract_code, y_parity, r, s], ...]
            this.recId, // signature_y_parity
            this.r, // signature_r
            this.s, // signature_s
        ]);
        return hex.decode("04" + encoded.substring(2)); // Type 4 prefix
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON(), null, 2);
    }

    /**
     * @returns {EthereumTransactionDataEip7702JSON}
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
            authorizationList: this.authorizationList.map(
                ([chainId, contractAddress, nonce, yParity, r, s]) => [
                    hex.encode(chainId),
                    hex.encode(contractAddress),
                    hex.encode(nonce),
                    hex.encode(yParity),
                    hex.encode(r),
                    hex.encode(s),
                ],
            ),
            accessList: this.accessList.map((v) => hex.encode(v)),
            recId: hex.encode(this.recId),
            r: hex.encode(this.r),
            s: hex.encode(this.s),
        };
    }
}

CACHE.setEthereumTransactionDataEip7702FromBytes((bytes) =>
    EthereumTransactionDataEip7702.fromBytes(bytes),
);
