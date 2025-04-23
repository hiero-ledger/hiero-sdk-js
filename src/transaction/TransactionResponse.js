// SPDX-License-Identifier: Apache-2.0

import ReceiptStatusError from "../ReceiptStatusError.js";
import Status from "../Status.js";
import TransactionReceiptQuery from "./TransactionReceiptQuery.js";
import TransactionRecordQuery from "./TransactionRecordQuery.js";
import AccountId from "../account/AccountId.js";
import TransactionId from "./TransactionId.js";
import * as hex from "../encoding/hex.js";
import { wait } from "../util.js";

/**
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("./TransactionReceipt.js").default} TransactionReceipt
 * @typedef {import("./TransactionRecord.js").default} TransactionRecord
 * @typedef {import("../Signer.js").Signer} Signer
 */

/**
 * @typedef {object} TransactionResponseJSON
 * @property {string} nodeId
 * @property {string} transactionHash
 * @property {string} transactionId
 */

/**
 * When the client sends the node a transaction of any kind, the node
 * replies with this, which simply says that the transaction passed
 * the pre-check (so the node will submit it to the network) or it failed
 * (so it won't). To learn the consensus result, the client should later
 * obtain a receipt (free), or can buy a more detailed record (not free).
 * <br>
 * See <a href="https://docs.hedera.com/guides/docs/hedera-api/miscellaneous/transactionresponse">Hedera Documentation</a>
 */
export default class TransactionResponse {
    /**
     * @internal
     * @param {object} props
     * @param {AccountId} props.nodeId
     * @param {Uint8Array} props.transactionHash
     * @param {TransactionId} props.transactionId
     */
    constructor(props) {
        /** @readonly */
        this.nodeId = props.nodeId;

        /** @readonly */
        this.transactionHash = props.transactionHash;

        this.transactionId = props.transactionId;

        Object.freeze(this);
    }

    /**
     * @param {TransactionResponseJSON} json
     * @returns {TransactionResponse}
     */
    static fromJSON(json) {
        return new TransactionResponse({
            nodeId: AccountId.fromString(json.nodeId),
            transactionHash: hex.decode(json.transactionHash),
            transactionId: TransactionId.fromString(json.transactionId),
        });
    }

    /**
     * @param {Client} client
     * @returns {Promise<TransactionReceipt>}
     */
    async getReceipt(client) {
        const MAX_RETRY_ATTEMPTS = 5;
        const INITIAL_BACKOFF_MS = 250;
        const MAX_BACKOFF_MS = 8000;

        let attempts = 0;
        let lastError = null;
        let backoffMs = INITIAL_BACKOFF_MS;

        while (attempts < MAX_RETRY_ATTEMPTS) {
            try {
                const receipt = await this.getReceiptQuery().execute(client);

                if (
                    receipt.status !== Status.Success &&
                    receipt.status !== Status.FeeScheduleFilePartUploaded
                ) {
                    throw new ReceiptStatusError({
                        transactionReceipt: receipt,
                        status: receipt.status,
                        transactionId: this.transactionId,
                    });
                }

                return receipt;
            } catch (error) {
                // Check if throttled at consensus
                if (
                    error instanceof ReceiptStatusError &&
                    error.status === Status.ThrottledAtConsensus
                ) {
                    lastError = error;
                    attempts++;

                    if (attempts < MAX_RETRY_ATTEMPTS) {
                        // Wait with exponential backoff before retrying
                        await wait(Math.min(backoffMs, MAX_BACKOFF_MS));
                        // Double the backoff for next attempt
                        backoffMs *= 2;

                        try {
                            // Retry the transaction
                            return await this._retryTransaction(client);
                        } catch (retryError) {
                            if (retryError instanceof ReceiptStatusError) {
                                lastError = retryError;
                            } else {
                                throw retryError;
                            }
                        }
                    }
                } else {
                    // If not throttled, rethrow the error immediately
                    throw error;
                }
            }
        }

        // If exhausted all retries, throw the last error
        throw lastError;
    }

    /**
     * getRecord is calling getReceipt and in case the receipt status code is not OK, only the receipt is returned.
     *
     * @param {Client} client
     * @returns {Promise<TransactionRecord>}
     */
    async getRecord(client) {
        await this.getReceipt(client);

        return this.getRecordQuery().execute(client);
    }

    /**
     * getVerboseRecord is calling getReceipt and in case the receipt status code is not OK, the record is returned.
     *
     * @param {Client} client
     * @returns {Promise<TransactionRecord>}
     */
    async getVerboseRecord(client) {
        try {
            // The receipt needs to be called in order to wait for transaction to be included in the consensus. Otherwise we are going to get "DUPLICATE_TRANSACTION".
            await this.getReceiptQuery().execute(client);
            return this.getRecordQuery().execute(client);
        } catch (e) {
            return this.getRecordQuery().execute(client);
        }
    }

    /**
     * @param {Signer} signer
     * @returns {Promise<TransactionReceipt>}
     */
    async getReceiptWithSigner(signer) {
        const receipt = await this.getReceiptQuery().executeWithSigner(signer);

        if (receipt.status !== Status.Success) {
            throw new ReceiptStatusError({
                transactionReceipt: receipt,
                status: receipt.status,
                transactionId: this.transactionId,
            });
        }

        return receipt;
    }

    /**
     * @param {Signer} signer
     * @returns {Promise<TransactionRecord>}
     */
    async getRecordWithSigner(signer) {
        await this.getReceiptWithSigner(signer);

        return this.getRecordQuery().executeWithSigner(signer);
    }

    /**
     * @returns {TransactionReceiptQuery}
     */
    getReceiptQuery() {
        return new TransactionReceiptQuery()
            .setTransactionId(this.transactionId)
            .setNodeAccountIds([this.nodeId]);
    }

    /**
     * @returns {TransactionRecordQuery}
     */
    getRecordQuery() {
        return new TransactionRecordQuery()
            .setTransactionId(this.transactionId)
            .setNodeAccountIds([this.nodeId]);
    }

    /**
     * @returns {TransactionResponseJSON}
     */
    toJSON() {
        return {
            nodeId: this.nodeId.toString(),
            transactionHash: hex.encode(this.transactionHash),
            transactionId: this.transactionId.toString(),
        };
    }

    /**
     *
     * @param {Client} client
     * @returns {Promise<TransactionReceipt>}
     */
    _retryTransaction(client) {
        if (!client.operatorAccountId) {
            throw new Error("Operator account is not set");
        }

        this.transactionId = TransactionId.generate(client.operatorAccountId);
        return this.getReceipt(client);
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
