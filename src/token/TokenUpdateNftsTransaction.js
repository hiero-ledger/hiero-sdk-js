// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenUpdateNftsTransactionBody} HieroProto.proto.ITokenUpdateNftsTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * At consensus, updates an already created Non Fungible Token to the given values.
 *
 * If no value is given for a field, that field is left unchanged.
 * Only certain fields such as metadata can be updated.
 *
 * Updating the metadata of an NFT does not affect its ownership or transferability.
 * This operation is intended for updating attributes of individual NFTs in a collection.
 */
export default class TokenUpdateNftsTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {TokenId | string} [props.tokenId]
     * @param {Long[]} [props.serialNumbers]
     * @param {?Uint8Array} [props.metadata]
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
         * @type {?Long[]}
         */
        this._serialNumbers = [];

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._metadata = null;

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        if (props.serialNumbers != null) {
            this.setSerialNumbers(props.serialNumbers);
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
     * @returns {TokenUpdateNftsTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const tokenUpdate =
            /** @type {HieroProto.proto.ITokenUpdateNftsTransactionBody} */ (
                body.tokenUpdateNfts
            );

        return Transaction._fromProtobufTransactions(
            new TokenUpdateNftsTransaction({
                tokenId:
                    tokenUpdate.token != null
                        ? TokenId._fromProtobuf(tokenUpdate.token)
                        : undefined,
                serialNumbers:
                    tokenUpdate.serialNumbers != null
                        ? tokenUpdate.serialNumbers
                        : [],
                metadata:
                    tokenUpdate.metadata != null
                        ? Object.hasOwn(tokenUpdate.metadata, "value")
                            ? tokenUpdate.metadata.value
                            : undefined
                        : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @description Assign the token id.
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
     * @description Assign the list of serial numbers.
     * @param {Long[]} serialNumbers
     * @returns {this}
     */
    setSerialNumbers(serialNumbers) {
        this._requireNotFrozen();
        this._serialNumbers = serialNumbers;

        return this;
    }

    /**
     * @param {Uint8Array} metadata
     * @returns {this}
     */
    setMetadata(metadata) {
        this._requireNotFrozen();
        this._metadata = metadata;

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
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.token.pauseToken(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenUpdateNfts";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ITokenUpdateNftsTransactionBody}
     */
    _makeTransactionData() {
        return {
            token: this._tokenId != null ? this._tokenId._toProtobuf() : null,
            serialNumbers:
                this._serialNumbers != null ? this._serialNumbers : [],
            ...(this._metadata != null
                ? {
                      metadata: {
                          value: this._metadata,
                      },
                  }
                : null),
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenUpdateNftsTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenUpdateNfts",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenUpdateNftsTransaction._fromProtobuf,
);
