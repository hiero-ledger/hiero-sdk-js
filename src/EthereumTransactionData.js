import CACHE from "./Cache.js";

/**
 * Represents the base class for Ethereum transaction data.
 * This class provides the foundation for different types of Ethereum transactions
 * including Legacy, EIP-1559, and EIP-2930 transactions.
 */
export default class EthereumTransactionData {
    /**
     * @protected
     * @param {object} props
     * @param {Uint8Array} props.callData
     */
    constructor(props) {
        this.callData = props.callData;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {EthereumTransactionData}
     */
    static fromBytes(bytes) {
        if (bytes.length === 0) {
            throw new Error("empty bytes");
        }

        switch (bytes[0]) {
            case 1:
                return CACHE.ethereumTransactionDataEip2930FromBytes(bytes);
            case 2:
                return CACHE.ethereumTransactionDataEip1559FromBytes(bytes);
            default:
                return CACHE.ethereumTransactionDataLegacyFromBytes(bytes);
        }
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        throw new Error("not implemented");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {string}
     */
    toString() {
        throw new Error("not implemented");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {{[key: string]: any}}
     */
    toJSON() {
        throw new Error("not implemented");
    }
}
