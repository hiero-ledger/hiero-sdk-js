import ContractFunctionParameters from "../contract/ContractFunctionParameters.js";
import {
    isRetryableNetworkError,
    readErrorDetail,
} from "../network/mirrorRestRetry.js";

/** @constant {number} Initial retry backoff in milliseconds. */
const INITIAL_BACKOFF_MS = 250;

/** @constant {number} Maximum retry attempts for transient mirror errors. */
const MAX_ATTEMPTS = 5;

/** @constant {number} Maximum retry backoff in milliseconds. */
const MAX_BACKOFF_MS = 8000;

/**
 * @typedef {import("../contract/ContractId").default} ContractId
 * @typedef {import("../account/AccountId").default} AccountId
 * @typedef {import("../client/Client.js").default<*, *>} Client
 *
 */

/**
 * @typedef {object} MirrorNodeResponse
 * @property {string} result
 * @property {string} [error]
 * @property {string} [gasUsed]
 * @property {string} [contractAddress]
 * @property {string} [status]
 */

/**
 * MirrorNodeContractQuery returns a result from EVM execution such as cost-free execution of read-only smart contract
 * queries, gas estimation, and transient simulation of read-write operations.
 * When working with sender that has ECDSA key with alias, you MUST:
 * 1. Retrieve the account's EVM address from the Mirror Node API first
 * 2. Use setSenderEvmAddress() instead of setSender()
 *
 * This is because EVM addresses for accounts with ECDSA keys and aliases cannot be automatically
 * derived and must be fetched from the Mirror Node. Example:
 *
 * ```javascript
 * // For accounts with ECDSA keys and aliases:
 * const evmAddress = // ... fetch from Mirror Node API ...
 * query.setSenderEvmAddress(evmAddress);
 * ```
 */
export default class MirrorNodeContractQuery {
    constructor() {
        this._contractId = null;
        this._contractEvmAddress = null;
        this._sender = null;
        this._senderEvmAddress = null;
        this._functionName = null;
        this._functionParameters = null;
        this._value = null;
        this._gasLimit = null;
        this._gasPrice = null;
        this._blockNumber = null;
    }

    /**
     *
     * @param {ContractId} contractId
     * @description Sets the contract instance to call.
     * @returns {this}
     */
    setContractId(contractId) {
        this._contractId = contractId;
        return this;
    }

    /**
     * @param {AccountId} sender
     * @description Sets the sender of the transaction simulation.
     * @returns {this}
     */
    setSender(sender) {
        this._sender = sender;
        return this;
    }

    /**
     * @param {string} sender
     * @description Set the 20-byte EVM address of the sender.
     * This method must be used explicitly when working with accounts that have ECDSA keys with aliases,
     * as their EVM addresses cannot be automatically derived and must be retrieved from the Mirror Node API.
     * The EVM address can be filled using `accountId.populateAccountEvmAddress(client)`
     * @returns {this}
     */
    setSenderEvmAddress(sender) {
        this._senderEvmAddress = sender;
        return this;
    }

    /**
     *
     * @param {string} name
     * @param {ContractFunctionParameters} functionParameters
     * @description Sets the function to call, and the parameters to pass to the function
     * @returns {this}
     */
    setFunction(name, functionParameters) {
        this._functionParameters =
            functionParameters != null
                ? functionParameters._build(name)
                : new ContractFunctionParameters()._build(name);

        return this;
    }

    /**
     * @param {Long} value
     * @description Sets the amount of value (in tinybars or wei) to be sent to the contract in the transaction.
     * Use this to specify an amount for a payable function call.
     * @returns {this}
     */
    setValue(value) {
        this._value = value;
        return this;
    }

    /**
     * @param {Long} gasLimit
     * @description Sets the gas limit for the contract call.
     * This specifies the maximum amount of gas that the transaction can consume.
     * @returns {this}
     */
    setGasLimit(gasLimit) {
        this._gasLimit = gasLimit;
        return this;
    }

    /**
     * @param {Long} gasPrice
     * @description Sets the gas price to be used for the contract call. This specifies the price of each unit of gas used in the transaction.
     * @returns {this}
     */
    setGasPrice(gasPrice) {
        this._gasPrice = gasPrice;
        return this;
    }

    /**
     * @param {Long} blockNumber
     * @description  Sets the block number for the simulation of the contract call.
     * The block number determines the context of the contract call simulation within the blockchain.
     * @returns {this}
     */
    setBlockNumber(blockNumber) {
        this._blockNumber = blockNumber;
        return this;
    }

    /**
     * @returns {ContractId?}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * @returns {string}
     */
    get contractEvmAddress() {
        const solidityAddress = this._contractId?.toEvmAddress();
        if (solidityAddress == null) {
            throw new Error("Contract ID is not set");
        }
        return solidityAddress;
    }

    /**
     * @returns {AccountId?}
     */
    get sender() {
        return this._sender;
    }

    /**
     * @returns {string | null }
     */
    get senderEvmAddress() {
        return this._senderEvmAddress;
    }

    /**
     * @returns {Uint8Array | null | undefined}
     */
    get callData() {
        return this._functionParameters;
    }

    /**
     * @returns {Long?}
     */
    get value() {
        return this._value;
    }

    /**
     * @returns {Long?}
     */
    get gasLimit() {
        return this._gasLimit;
    }

    /**
     * @returns {Long?}
     */
    get gasPrice() {
        return this._gasPrice;
    }

    /**
     * @returns {Long?}
     */
    get blockNumber() {
        return this._blockNumber;
    }

    /**
     *
     * @param {Client} client
     * @param {object} jsonPayload
     * @returns {Promise<MirrorNodeResponse>}
     */
    async performMirrorNodeRequest(client, jsonPayload) {
        if (this.contractId == null) {
            throw new Error("Contract ID is not set");
        }
        this._fillEvmAddress();
        let mirrorRestApiBaseUrl = client.mirrorRestApiBaseUrl;
        const contractCallEndpointPath = "/contracts/call";

        // Check if this is a local environment (localhost or 127.0.0.1)
        const mirrorNode = client._mirrorNetwork.getNextMirrorNode();
        const host = mirrorNode.address.address;
        const isLocalEnvironment = host === "localhost" || host === "127.0.0.1";

        if (isLocalEnvironment) {
            // For local environments, use HTTP scheme and port 8545 for contract calls
            // (different from general mirror node REST API port 5551)
            const url = new URL(mirrorRestApiBaseUrl);
            url.protocol = "http:";
            url.port = "8545";
            mirrorRestApiBaseUrl = url.toString();
        }

        const contractCallEndpointUrl = `${mirrorRestApiBaseUrl}${contractCallEndpointPath}`;

        let lastError = null;
        let backoff = INITIAL_BACKOFF_MS;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                // eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(contractCallEndpointUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(jsonPayload),
                });

                if (response.ok) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const data = /** @type {MirrorNodeResponse} */ (
                        await response.json()
                    );
                    return data;
                }

                const errorDetail = await readErrorDetail(response);

                if (
                    response.status === 500 ||
                    response.status === 503 ||
                    response.status === 504
                ) {
                    lastError = new Error(
                        `HTTP ${response.status}${errorDetail ? `: ${errorDetail}` : ""}`,
                    );
                    if (attempt < MAX_ATTEMPTS) {
                        await _sleep(backoff);
                        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
                        continue;
                    }
                    throw lastError;
                }

                // 4xx and other non-retryable errors — throw immediately.
                throw new Error(
                    `HTTP ${response.status}${errorDetail ? `: ${errorDetail}` : ""}`,
                );
            } catch (err) {
                lastError = /** @type {Error} */ (err);
                if (attempt < MAX_ATTEMPTS && isRetryableNetworkError(err)) {
                    await _sleep(backoff);
                    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
                    continue;
                }
                throw lastError;
            }
        }

        throw lastError ?? new Error("Failed to perform mirror node contract call");
    }

    _fillEvmAddress() {
        if (this.senderEvmAddress == null && this.sender != null) {
            this._senderEvmAddress = this.sender.toEvmAddress();
        }
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @returns {object}
     */
    get JSONPayload() {
        throw new Error(
            "JSONPayload getter is not implemented. Please implement this method in the subclass.",
        );
    }
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
