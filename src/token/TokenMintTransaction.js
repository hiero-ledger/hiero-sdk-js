// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Long from "long";
import * as hex from "../encoding/hex.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenMintTransactionBody} HieroProto.proto.ITokenMintTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Mint a new Hedera™ crypto-currency token.
 */
export default class TokenMintTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {TokenId | string} [props.tokenId]
     * @param {Long | number} [props.amount]
     * @param {Uint8Array[]} [props.metadata]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?TokenId}
         */
        this._tokenId = null;

        /**
         * @private
         * @type {?Long}
         */
        this._amount = null;

        /**
         * @private
         * @type {Uint8Array[]}
         */
        this._metadata = [];

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        if (props.amount != null) {
            this.setAmount(props.amount);
        }

        if (props.metadata != null) {
            this.setMetadata(props.metadata);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenMintTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const mintToken =
            /** @type {HieroProto.proto.ITokenMintTransactionBody} */ (
                body.tokenMint
            );

        return Transaction._fromProtobufTransactions(
            new TokenMintTransaction({
                tokenId:
                    mintToken.token != null
                        ? TokenId._fromProtobuf(mintToken.token)
                        : undefined,
                amount: mintToken.amount != null ? mintToken.amount : undefined,
                metadata:
                    mintToken.metadata != null ? mintToken.metadata : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {?TokenId}
     */
    get tokenId() {
        return this._tokenId;
    }

    /**
     * @param {TokenId | string} tokenId
     * @returns {this}
     */
    setTokenId(tokenId) {
        this._requireNotFrozen();
        this._tokenId =
            typeof tokenId === "string"
                ? TokenId.fromString(tokenId)
                : tokenId.clone();

        return this;
    }

    /**
     * @returns {?Long}
     */
    get amount() {
        return this._amount;
    }

    /**
     * @param {Long | number} amount
     * @returns {this}
     */
    setAmount(amount) {
        this._requireNotFrozen();
        this._amount = amount instanceof Long ? amount : Long.fromValue(amount);

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._tokenId != null) {
            this._tokenId.validateChecksum(client);
        }
    }

    /**
     * @returns {Uint8Array[]}
     */
    get metadata() {
        return this._metadata;
    }

    /**
     * @param {Uint8Array | string} metadata
     * @returns {this}
     */
    addMetadata(metadata) {
        this._requireNotFrozen();

        if (typeof metadata === "string") {
            console.warn(
                "Passing a `string` for token metadata is considered a bug, and has been removed. Please provide a `Uint8Array` instead.",
            );
        }

        this._metadata.push(
            typeof metadata === "string" ? hex.decode(metadata) : metadata,
        );

        return this;
    }

    /**
     * @param {Uint8Array[]} metadata
     * @returns {this}
     */
    setMetadata(metadata) {
        this._requireNotFrozen();

        for (const data of metadata) {
            if (typeof data === "string") {
                console.warn(
                    "Passing a `string` for token metadata is considered a bug, and has been removed. Please provide a `Uint8Array` instead.",
                );
                break;
            }
        }

        this._metadata = metadata.map((data) =>
            typeof data === "string" ? hex.decode(data) : data,
        );

        return this;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.token.mintToken(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenMint";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ITokenMintTransactionBody}
     */
    _makeTransactionData() {
        return {
            amount: this._amount,
            token: this._tokenId != null ? this._tokenId._toProtobuf() : null,
            metadata: this._metadata,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenMintTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenMint",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenMintTransaction._fromProtobuf,
);
