// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Long from "long";
import { convertAmountToLong } from "../util.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenBurnTransactionBody} HieroProto.proto.ITokenBurnTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * Burn a new Hedera™ crypto-currency token.
 */
export default class TokenBurnTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {TokenId | string} [props.tokenId]
     * @param {Long | number | BigNumber | bigint} [props.amount]
     * @param {(Long | number)[]} [props.serials]
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
         * @type {Long[]}
         */
        this._serials = [];

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        if (props.amount != null) {
            this.setAmount(props.amount);
        }

        if (props.serials != null) {
            this.setSerials(props.serials);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenBurnTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const burnToken =
            /** @type {HieroProto.proto.ITokenBurnTransactionBody} */ (
                body.tokenBurn
            );

        return Transaction._fromProtobufTransactions(
            new TokenBurnTransaction({
                tokenId:
                    burnToken.token != null
                        ? TokenId._fromProtobuf(burnToken.token)
                        : undefined,
                amount: burnToken.amount != null ? burnToken.amount : undefined,
                serials:
                    burnToken.serialNumbers != null
                        ? burnToken.serialNumbers
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
     * @param {Long | number | BigNumber | bigint} amount
     * @returns {this}
     */
    setAmount(amount) {
        this._requireNotFrozen();
        this._amount = convertAmountToLong(amount);

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
     * @returns {Long[]}
     */
    get serials() {
        return this._serials;
    }

    /**
     * @param {(Long | number)[]} serials
     * @returns {this}
     */
    setSerials(serials) {
        this._requireNotFrozen();
        this._serials = serials.map((serial) =>
            serial instanceof Long ? serial : Long.fromValue(serial),
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
        return channel.token.burnToken(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenBurn";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ITokenBurnTransactionBody}
     */
    _makeTransactionData() {
        return {
            amount: this._amount,
            serialNumbers: this._serials,
            token: this._tokenId != null ? this._tokenId._toProtobuf() : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenBurnTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenBurn",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenBurnTransaction._fromProtobuf,
);
