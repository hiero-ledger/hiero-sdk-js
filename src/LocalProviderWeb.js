// SPDX-License-Identifier: Apache-2.0

import Client from "./client/WebClient.js";
import AccountBalanceQuery from "./account/AccountBalanceQuery.js";
import AccountInfoQuery from "./account/AccountInfoQuery.js";
import AccountRecordsQuery from "./account/AccountRecordsQuery.js";
import TransactionReceiptQuery from "./transaction/TransactionReceiptQuery.js";

/**
 * @typedef {import("./Provider.js").Provider} Provider
 * @typedef {import("./LedgerId.js").default} LedgerId
 * @typedef {import("./Key.js").default} Key
 * @typedef {import("./transaction/Transaction.js").default} Transaction
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("./transaction/TransactionReceipt.js").default} TransactionReceipt
 * @typedef {import("./transaction/TransactionRecord.js").default} TransactionRecord
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./account/AccountBalance.js").default} AccountBalance
 * @typedef {import("./account/AccountInfo.js").default} AccountInfo
 * @typedef {import("./logger/Logger.js").default} Logger
 */

/**
 * @template {any} O
 * @typedef {import("./query/Query.js").default<O>} Query<O>
 */

/**
 * @template RequestT
 * @template ResponseT
 * @template OutputT
 * @typedef {import("./Executable.js").default<RequestT, ResponseT, OutputT>} Executable<RequestT, ResponseT, OutputT>
 */

/**
 * @implements {Provider}
 */
export default class LocalProviderWeb {
    /**
     * @param {object} props
     * @param {Client} [props.client]
     * @param {"mainnet" | "testnet" | "previewnet" | "local-node"} [props.networkName]
     */
    constructor(props = {}) {
        if (props != null && props.client != null) {
            this._client = props.client;
            return;
        }

        this._client = Client.forName(props.networkName || "local-node");
    }

    /**
     * @param {Client} client
     * @returns {LocalProviderWeb}
     */
    static fromClient(client) {
        return new LocalProviderWeb({ client });
    }

    /**
     * @returns {LedgerId?}
     */
    getLedgerId() {
        return this._client.ledgerId;
    }

    /**
     * @returns {{[key: string]: (string | AccountId)}}
     */
    getNetwork() {
        return this._client.network;
    }

    /**
     * @returns {string[]}
     */
    getMirrorNetwork() {
        return this._client.mirrorNetwork;
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {Promise<AccountBalance>}
     */
    getAccountBalance(accountId) {
        return new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(this._client);
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {Promise<AccountInfo>}
     */
    getAccountInfo(accountId) {
        return new AccountInfoQuery()
            .setAccountId(accountId)
            .execute(this._client);
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {Promise<TransactionRecord[]>}
     */
    getAccountRecords(accountId) {
        return new AccountRecordsQuery()
            .setAccountId(accountId)
            .execute(this._client);
    }

    /**
     * @param {TransactionId | string} transactionId
     * @returns {Promise<TransactionReceipt>}
     */
    getTransactionReceipt(transactionId) {
        return new TransactionReceiptQuery()
            .setTransactionId(transactionId)
            .execute(this._client);
    }

    /**
     * @param {Transaction} transaction
     * @returns {Promise<TransactionResponse>}
     */
    async sendTransaction(transaction) {
        return await transaction.execute(this._client);
    }

    /**
     * @template O
     * @param {Query<O>} query
     * @returns {Promise<O>}
     */
    async sendQuery(query) {
        return await query.execute(this._client);
    }

    /**
     * @param {TransactionResponse} response
     * @returns {Promise<TransactionReceipt>}
     */
    async waitForReceipt(response) {
        return await response.getReceipt(this._client);
    }

    /**
     * @template RequestT
     * @template ResponseT
     * @template OutputT
     * @param {Executable<RequestT, ResponseT, OutputT>} request
     * @returns {Promise<OutputT>}
     */
    async call(request) {
        return await request.execute(this._client);
    }

    /**
     * @returns {void}
     */
    close() {
        this._client.close();
    }
}
