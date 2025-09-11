// SPDX-License-Identifier: Apache-2.0

import Transaction from "../transaction/Transaction.js";
import AccountId from "./AccountId.js";
import ContractId from "../contract/ContractId.js";
import TokenId from "../token/TokenId.js";
import NftId from "../token/NftId.js";
import Long from "long";
import Hbar from "../Hbar.js";
import HbarAllowance from "./HbarAllowance.js";
import TokenAllowance from "./TokenAllowance.js";
import TokenNftAllowance from "./TokenNftAllowance.js";
import * as util from "../util.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 * @typedef {import("@hashgraph/proto").proto.IContractID} HieroProto.proto.IContractID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("../long.js").LongObject} LongObject
 */

/**
 * @deprecated - No longer supported via Hedera Protobufs
 * Change properties for the given account.
 */
export default class AccountAllowanceAdjustTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {HbarAllowance[]} [props.hbarAllowances]
     * @param {TokenAllowance[]} [props.tokenAllowances]
     * @param {TokenNftAllowance[]} [props.nftAllowances]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {HbarAllowance[]}
         */
        this._hbarAllowances =
            props.hbarAllowances != null ? props.hbarAllowances : [];

        /**
         * @private
         * @type {TokenAllowance[]}
         */
        this._tokenAllowances =
            props.tokenAllowances != null ? props.tokenAllowances : [];

        /**
         * @private
         * @type {TokenNftAllowance[]}
         */
        this._nftAllowances =
            props.nftAllowances != null ? props.nftAllowances : [];
    }

    /**
     * @returns {HbarAllowance[]}
     */
    get hbarAllowances() {
        return this._hbarAllowances;
    }

    /**
     * @deprecated
     * @param {AccountId | string} spenderAccountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    addHbarAllowance(spenderAccountId, amount) {
        const value = amount instanceof Hbar ? amount : new Hbar(amount);
        return this._adjustHbarAllowance(
            null,
            spenderAccountId,
            util.requireNotNegative(value),
        );
    }

    /**
     * @param {AccountId | string | null} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {Hbar} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    _adjustHbarAllowance(ownerAccountId, spenderAccountId, amount) {
        this._requireNotFrozen();

        this._hbarAllowances.push(
            new HbarAllowance({
                spenderAccountId:
                    typeof spenderAccountId === "string"
                        ? AccountId.fromString(spenderAccountId)
                        : spenderAccountId instanceof ContractId
                        ? AccountId.fromEvmAddress(
                              spenderAccountId.shard,
                              spenderAccountId.realm,
                              spenderAccountId.toEvmAddress(),
                          )
                        : spenderAccountId,
                ownerAccountId:
                    typeof ownerAccountId === "string"
                        ? AccountId.fromString(ownerAccountId)
                        : ownerAccountId instanceof ContractId
                        ? AccountId.fromEvmAddress(
                              ownerAccountId.shard,
                              ownerAccountId.realm,
                              ownerAccountId.toEvmAddress(),
                          )
                        : ownerAccountId,
                amount: amount,
            }),
        );

        return this;
    }

    /**
     * @deprecated
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    grantHbarAllowance(ownerAccountId, spenderAccountId, amount) {
        const value = amount instanceof Hbar ? amount : new Hbar(amount);
        return this._adjustHbarAllowance(
            ownerAccountId,
            spenderAccountId,
            util.requireNotNegative(value),
        );
    }

    /**
     * @deprecated
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    revokeHbarAllowance(ownerAccountId, spenderAccountId, amount) {
        const value = amount instanceof Hbar ? amount : new Hbar(amount);
        return this._adjustHbarAllowance(
            ownerAccountId,
            spenderAccountId,
            util.requireNotNegative(value).negated(),
        );
    }

    /**
     * @returns {TokenAllowance[]}
     */
    get tokenAllowances() {
        return this._tokenAllowances;
    }

    /**
     * @deprecated
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} spenderAccountId
     * @param {Long | number} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    addTokenAllowance(tokenId, spenderAccountId, amount) {
        return this._adjustTokenAllowance(
            tokenId,
            null,
            spenderAccountId,
            util.requireNotNegative(Long.fromValue(amount)),
        );
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string | null} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {Long | number} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    _adjustTokenAllowance(tokenId, ownerAccountId, spenderAccountId, amount) {
        this._requireNotFrozen();

        this._tokenAllowances.push(
            new TokenAllowance({
                tokenId:
                    typeof tokenId === "string"
                        ? TokenId.fromString(tokenId)
                        : tokenId,
                spenderAccountId:
                    typeof spenderAccountId === "string"
                        ? AccountId.fromString(spenderAccountId)
                        : spenderAccountId instanceof ContractId
                        ? AccountId.fromEvmAddress(
                              spenderAccountId.shard,
                              spenderAccountId.realm,
                              spenderAccountId.toEvmAddress(),
                          )
                        : spenderAccountId,
                ownerAccountId:
                    typeof ownerAccountId === "string"
                        ? AccountId.fromString(ownerAccountId)
                        : ownerAccountId instanceof ContractId
                        ? AccountId.fromEvmAddress(
                              ownerAccountId.shard,
                              ownerAccountId.realm,
                              ownerAccountId.toEvmAddress(),
                          )
                        : ownerAccountId,
                amount:
                    typeof amount === "number"
                        ? Long.fromNumber(amount)
                        : amount,
            }),
        );

        return this;
    }

    /**
     * @deprecated
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @param {Long | number} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    grantTokenAllowance(tokenId, ownerAccountId, spenderAccountId, amount) {
        return this._adjustTokenAllowance(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            util.requireNotNegative(Long.fromValue(amount)),
        );
    }

    /**
     * @deprecated
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @param {Long | number} amount
     * @returns {AccountAllowanceAdjustTransaction}
     */
    revokeTokenAllowance(tokenId, ownerAccountId, spenderAccountId, amount) {
        return this._adjustTokenAllowance(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            util.requireNotNegative(Long.fromValue(amount)),
        );
    }

    /**
     * @deprecated
     * @param {NftId | string} nftId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    addTokenNftAllowance(nftId, spenderAccountId) {
        const id = typeof nftId === "string" ? NftId.fromString(nftId) : nftId;
        return this._adjustTokenNftAllowance(id, null, spenderAccountId);
    }

    /**
     * @param {NftId} nftId
     * @param {AccountId | string | null} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    _adjustTokenNftAllowance(nftId, ownerAccountId, spenderAccountId) {
        this._requireNotFrozen();

        const spender =
            typeof spenderAccountId === "string"
                ? AccountId.fromString(spenderAccountId)
                : spenderAccountId instanceof ContractId
                ? AccountId.fromEvmAddress(
                      spenderAccountId.shard,
                      spenderAccountId.realm,
                      spenderAccountId.toEvmAddress(),
                  )
                : spenderAccountId;
        const owner =
            typeof ownerAccountId === "string"
                ? AccountId.fromString(ownerAccountId)
                : ownerAccountId instanceof ContractId
                ? AccountId.fromEvmAddress(
                      ownerAccountId.shard,
                      ownerAccountId.realm,
                      ownerAccountId.toEvmAddress(),
                  )
                : ownerAccountId;
        let found = false;

        for (const allowance of this._nftAllowances) {
            if (
                allowance.tokenId.compare(nftId.tokenId) === 0 &&
                allowance.spenderAccountId != null &&
                allowance.spenderAccountId.compare(spender) === 0
            ) {
                if (allowance.serialNumbers != null) {
                    allowance.serialNumbers.push(nftId.serial);
                }
                found = true;
                break;
            }
        }

        if (!found) {
            this._nftAllowances.push(
                new TokenNftAllowance({
                    tokenId: nftId.tokenId,
                    spenderAccountId: spender,
                    serialNumbers: [nftId.serial],
                    ownerAccountId: owner,
                    allSerials: false,
                    delegatingSpender: null,
                }),
            );
        }

        return this;
    }

    /**
     * @deprecated
     * @param {NftId | string} nftId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    grantTokenNftAllowance(nftId, ownerAccountId, spenderAccountId) {
        const id = typeof nftId === "string" ? NftId.fromString(nftId) : nftId;

        util.requireNotNegative(id.serial);

        return this._adjustTokenNftAllowance(
            id,
            ownerAccountId,
            spenderAccountId,
        );
    }

    /**
     * @deprecated
     * @param {NftId | string} nftId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    revokeTokenNftAllowance(nftId, ownerAccountId, spenderAccountId) {
        const id = typeof nftId === "string" ? NftId.fromString(nftId) : nftId;

        util.requireNotNegative(id.serial);
        return this._adjustTokenNftAllowance(
            new NftId(id.tokenId, id.serial.negate()),
            ownerAccountId,
            spenderAccountId,
        );
    }

    /**
     * @deprecated - use `grantTokenNftAllowanceAllSerials()` instead
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    addAllTokenNftAllowance(tokenId, spenderAccountId) {
        return this._adjustTokenNftAllowanceAllSerials(
            tokenId,
            null,
            spenderAccountId,
            true,
        );
    }

    /**
     * @deprecated
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    grantTokenNftAllowanceAllSerials(
        tokenId,
        ownerAccountId,
        spenderAccountId,
    ) {
        return this._adjustTokenNftAllowanceAllSerials(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            true,
        );
    }

    /**
     * @deprecated
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceAdjustTransaction}
     */
    revokeTokenNftAllowanceAllSerials(
        tokenId,
        ownerAccountId,
        spenderAccountId,
    ) {
        return this._adjustTokenNftAllowanceAllSerials(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            false,
        );
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string | null} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {boolean} allSerials
     * @returns {AccountAllowanceAdjustTransaction}
     */
    _adjustTokenNftAllowanceAllSerials(
        tokenId,
        ownerAccountId,
        spenderAccountId,
        allSerials,
    ) {
        this._requireNotFrozen();

        this._nftAllowances.push(
            new TokenNftAllowance({
                tokenId:
                    typeof tokenId === "string"
                        ? TokenId.fromString(tokenId)
                        : tokenId,
                ownerAccountId:
                    ownerAccountId != null
                        ? typeof ownerAccountId === "string"
                            ? AccountId.fromString(ownerAccountId)
                            : ownerAccountId instanceof ContractId
                            ? AccountId.fromEvmAddress(
                                  ownerAccountId.shard,
                                  ownerAccountId.realm,
                                  ownerAccountId.toEvmAddress(),
                              )
                            : ownerAccountId
                        : null,
                spenderAccountId:
                    typeof spenderAccountId === "string"
                        ? AccountId.fromString(spenderAccountId)
                        : spenderAccountId instanceof ContractId
                        ? AccountId.fromEvmAddress(
                              spenderAccountId.shard,
                              spenderAccountId.realm,
                              spenderAccountId.toEvmAddress(),
                          )
                        : spenderAccountId,
                serialNumbers: null,
                allSerials,
                delegatingSpender: null,
            }),
        );

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        this._hbarAllowances.map((allowance) =>
            allowance._validateChecksums(client),
        );
        this._tokenAllowances.map((allowance) =>
            allowance._validateChecksums(client),
        );
        this._nftAllowances.map((allowance) =>
            allowance._validateChecksums(client),
        );
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _execute(channel, request) {
        return Promise.reject(
            new Error("This feature has been deprecated for this class."),
        );
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @deprecated
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        throw new Error("This feature has been deprecated for this class.");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * @override
     * @protected
     * @returns {object}
     */
    _makeTransactionData() {
        throw new Error("This feature has been deprecated.");
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `AccountAllowanceAdjustTransaction:${timestamp.toString()}`;
    }
}
