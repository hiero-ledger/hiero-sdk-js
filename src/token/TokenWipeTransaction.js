// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import AccountId from "../account/AccountId.js";
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
 * @typedef {import("@hashgraph/proto").proto.ITokenWipeAccountTransactionBody} HieroProto.proto.ITokenWipeAccountTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * Wipe a new Hedera™ crypto-currency token.
 */
export default class TokenWipeTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {TokenId | string} [props.tokenId]
     * @param {AccountId | string} [props.accountId]
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
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?Long[]}
         */
        this._serials = [];

        /**
         * @private
         * @type {?Long}
         */
        this._amount = null;

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
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
     * @returns {TokenWipeTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const wipeToken =
            /** @type {HieroProto.proto.ITokenWipeAccountTransactionBody} */ (
                body.tokenWipe
            );

        return Transaction._fromProtobufTransactions(
            new TokenWipeTransaction({
                tokenId:
                    wipeToken.token != null
                        ? TokenId._fromProtobuf(wipeToken.token)
                        : undefined,
                accountId:
                    wipeToken.account != null
                        ? AccountId._fromProtobuf(wipeToken.account)
                        : undefined,
                amount: wipeToken.amount != null ? wipeToken.amount : undefined,
                serials:
                    wipeToken.serialNumbers != null
                        ? wipeToken.serialNumbers
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
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._requireNotFrozen();
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();

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

        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
        }
    }

    /**
     * @returns {?Long[]}
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
            typeof serial === "number" ? Long.fromNumber(serial) : serial,
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
        return channel.token.wipeTokenAccount(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenWipe";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ITokenWipeAccountTransactionBody}
     */
    _makeTransactionData() {
        return {
            amount: this._amount,
            token: this._tokenId != null ? this._tokenId._toProtobuf() : null,
            account:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            serialNumbers: this.serials,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenWipeTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenWipe",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenWipeTransaction._fromProtobuf,
);
