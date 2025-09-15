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
 * @typedef {import("./Transaction.js").default} Transaction
 * @typedef {import("./TransactionReceipt.js").default} TransactionReceipt
 * @typedef {import("./TransactionRecord.js").default} TransactionRecord
 * @typedef {import("../Signer.js").Signer} Signer
 * @typedef {import("../logger/Logger.js").default} Logger
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
     * @param {Transaction} [props.transaction]
     * @param {Logger | null} [props.logger]
     */
    constructor(props) {
        /** @readonly */
        this.nodeId = props.nodeId;

        /** @readonly */
        this.transactionHash = props.transactionHash;

        this.transactionId = props.transactionId;

        this.transaction = props.transaction;

        this.logger = props.logger;
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
        let receipt;
        try {
            receipt = await this.getReceiptQuery().execute(client);
        } catch (err) {
            if (
                err instanceof ReceiptStatusError &&
                err.status === Status.ThrottledAtConsensus
            ) {
                this.logger?.info("Transaction throttled at consensus");
                // need to reset the transaction to its initial state before retrying
                return this._retryTransaction(client);
            }
            throw err;
        }

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
    async _retryTransaction(client) {
        if (!this.transaction) {
            throw new Error(
                "If you retry transaction you should have the transaction set",
            );
        }

        if (
            client.operatorAccountId?.toString() !==
            this.transaction.transactionId?.accountId?.toString()
        ) {
            throw new Error(
                "Retry mechanism is not supported when tx id is not generated by the operator account",
            );
        }

        if (client.operatorAccountId === null) {
            throw new Error("Operator account is not set");
        }

        const MAX_RETRIES = 5;
        const MAX_BACKOFF = 16000;
        let BACKOFF = 250; // milliseconds

        for (let i = 0; i < MAX_RETRIES; i++) {
            this.logger?.trace(`Transaction throttled, retry attempt ${i}`);
            this.transaction?._resetTransaction(client);
            if (
                this.transaction == null ||
                this.transaction.transactionId == null
            ) {
                throw new Error(
                    "Transaction or Transaction ID is null after reset",
                );
            }
            // need to set the transactionId again in case we are doing getRecord afterwards
            this.transactionId = this.transaction.transactionId;
            if (i > 0) {
                // Wait with exponential backoff before retrying
                await wait(Math.min(BACKOFF, MAX_BACKOFF));
                BACKOFF *= 2; // Double the backoff for next retry
            }

            try {
                this.transaction._resetTransaction(client);
                const resp = await this.transaction.execute(client);

                const receipt = await new TransactionReceiptQuery()
                    .setTransactionId(resp.transactionId)
                    .setNodeAccountIds([resp.nodeId])
                    .execute(client);

                if (receipt.status !== Status.ThrottledAtConsensus) {
                    this.logger?.info(
                        `Transaction throttle retry succeeded after attempt ${i}`,
                    );
                    return receipt;
                }
            } catch (err) {
                if (
                    err instanceof ReceiptStatusError &&
                    err.status === Status.ThrottledAtConsensus
                ) {
                    this.logger?.info("Transaction throttled at consensus");
                    // Continue to next retry on error
                    continue;
                }
                this.logger?.error(
                    `An error occurred after throttle retry: ${
                        err instanceof Error ? err.message : String(err)
                    }`,
                );
                throw err;
            }
        }

        this.logger?.error(
            "Transaction throttle retry failed after maximum attempts",
        );
        throw new Error("Transaction retry failed after maximum attempts");
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
