// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import CustomFixedFee from "./CustomFixedFee.js";
import CustomFractionalFee from "./CustomFractionalFee.js";
import CustomRoyaltyFee from "./CustomRoyaltyFee.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenFeeScheduleUpdateTransactionBody} HieroProto.proto.ITokenFeeScheduleUpdateTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./CustomFee.js").default} CustomFee
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * FeeScheduleUpdate a new Hedera™ crypto-currency token.
 */
export default class TokenFeeScheduleUpdateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {TokenId | string} [props.tokenId]
     * @param {CustomFee[]} [props.customFees]
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
         * @type {CustomFee[]}
         */
        this._customFees = [];

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        if (props.customFees != null) {
            this.setCustomFees(props.customFees);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenFeeScheduleUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const feeScheduleUpdate =
            /** @type {HieroProto.proto.ITokenFeeScheduleUpdateTransactionBody} */ (
                body.tokenFeeScheduleUpdate
            );

        return Transaction._fromProtobufTransactions(
            new TokenFeeScheduleUpdateTransaction({
                tokenId:
                    feeScheduleUpdate.tokenId != null
                        ? TokenId._fromProtobuf(feeScheduleUpdate.tokenId)
                        : undefined,
                customFees:
                    feeScheduleUpdate.customFees != null
                        ? feeScheduleUpdate.customFees.map((fee) => {
                              if (fee.fixedFee != null) {
                                  return CustomFixedFee._fromProtobuf(fee);
                              } else if (fee.fractionalFee != null) {
                                  return CustomFractionalFee._fromProtobuf(fee);
                              } else {
                                  return CustomRoyaltyFee._fromProtobuf(fee);
                              }
                          })
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
                : TokenId._fromProtobuf(tokenId._toProtobuf());

        return this;
    }

    /**
     * @returns {CustomFee[]}
     */
    get customFees() {
        return this._customFees;
    }

    /**
     * @param {CustomFee[]} fees
     * @returns {this}
     */
    setCustomFees(fees) {
        this._requireNotFrozen();
        this._customFees = fees;

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
        return channel.token.updateTokenFeeSchedule(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenFeeScheduleUpdate";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ITokenFeeScheduleUpdateTransactionBody}
     */
    _makeTransactionData() {
        return {
            tokenId: this._tokenId != null ? this._tokenId._toProtobuf() : null,
            customFees: this._customFees.map((fee) => fee._toProtobuf()),
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenFeeScheduleUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenFeeScheduleUpdate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenFeeScheduleUpdateTransaction._fromProtobuf,
);
