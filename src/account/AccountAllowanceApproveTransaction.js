// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "./AccountId.js";
import ContractId from "../contract/ContractId.js";
import TokenId from "../token/TokenId.js";
import NftId from "../token/NftId.js";
import Hbar from "../Hbar.js";
import HbarAllowance from "./HbarAllowance.js";
import TokenAllowance from "./TokenAllowance.js";
import TokenNftAllowance from "./TokenNftAllowance.js";
import { convertAmountToLong } from "../util.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ICryptoApproveAllowanceTransactionBody} HieroProto.proto.ICryptoApproveAllowanceTransactionBody
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
 * Change properties for the given account.
 */
export default class AccountAllowanceApproveTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {HbarAllowance[]} [props.hbarApprovals]
     * @param {TokenAllowance[]} [props.tokenApprovals]
     * @param {TokenNftAllowance[]} [props.nftApprovals]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {HbarAllowance[]}
         */
        this._hbarApprovals =
            props.hbarApprovals != null ? props.hbarApprovals : [];

        /**
         * @private
         * @type {TokenAllowance[]}
         */
        this._tokenApprovals =
            props.tokenApprovals != null ? props.tokenApprovals : [];

        /**
         * @private
         * @type {TokenNftAllowance[]}
         */
        this._nftApprovals =
            props.nftApprovals != null ? props.nftApprovals : [];
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {AccountAllowanceApproveTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const allowanceApproval =
            /** @type {HieroProto.proto.ICryptoApproveAllowanceTransactionBody} */ (
                body.cryptoApproveAllowance
            );

        return Transaction._fromProtobufTransactions(
            new AccountAllowanceApproveTransaction({
                hbarApprovals: (allowanceApproval.cryptoAllowances != null
                    ? allowanceApproval.cryptoAllowances
                    : []
                ).map((approval) => HbarAllowance._fromProtobuf(approval)),
                tokenApprovals: (allowanceApproval.tokenAllowances != null
                    ? allowanceApproval.tokenAllowances
                    : []
                ).map((approval) => TokenAllowance._fromProtobuf(approval)),
                nftApprovals: (allowanceApproval.nftAllowances != null
                    ? allowanceApproval.nftAllowances
                    : []
                ).map((approval) => TokenNftAllowance._fromProtobuf(approval)),
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {HbarAllowance[]}
     */
    get hbarApprovals() {
        return this._hbarApprovals;
    }

    /**
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {AccountAllowanceApproveTransaction}
     */
    approveHbarAllowance(ownerAccountId, spenderAccountId, amount) {
        this._requireNotFrozen();

        this._hbarApprovals.push(
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
                amount: amount instanceof Hbar ? amount : new Hbar(amount),
            }),
        );

        return this;
    }

    /**
     * @deprecated - Use `approveHbarAllowance()` instead
     * @param {AccountId | string} spenderAccountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {AccountAllowanceApproveTransaction}
     */
    addHbarAllowance(spenderAccountId, amount) {
        this._requireNotFrozen();

        this._hbarApprovals.push(
            new HbarAllowance({
                spenderAccountId:
                    typeof spenderAccountId === "string"
                        ? AccountId.fromString(spenderAccountId)
                        : spenderAccountId,
                amount: amount instanceof Hbar ? amount : new Hbar(amount),
                ownerAccountId: null,
            }),
        );

        return this;
    }

    /**
     * @returns {TokenAllowance[]}
     */
    get tokenApprovals() {
        return this._tokenApprovals;
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {Long | number | BigNumber | bigint} amount
     * @returns {AccountAllowanceApproveTransaction}
     */
    approveTokenAllowance(tokenId, ownerAccountId, spenderAccountId, amount) {
        this._requireNotFrozen();

        // Convert amount to Long
        const amountLong = convertAmountToLong(amount);

        this._tokenApprovals.push(
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
                amount: amountLong,
            }),
        );

        return this;
    }

    /**
     * @deprecated - Use `approveTokenAllowance()` instead
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} spenderAccountId
     * @param {Long | number | BigNumber | bigint} amount
     * @returns {AccountAllowanceApproveTransaction}
     */
    addTokenAllowance(tokenId, spenderAccountId, amount) {
        this._requireNotFrozen();

        // Convert amount to Long
        const amountLong = convertAmountToLong(amount);

        this._tokenApprovals.push(
            new TokenAllowance({
                tokenId:
                    typeof tokenId === "string"
                        ? TokenId.fromString(tokenId)
                        : tokenId,
                spenderAccountId:
                    typeof spenderAccountId === "string"
                        ? AccountId.fromString(spenderAccountId)
                        : spenderAccountId,
                amount: amountLong,
                ownerAccountId: null,
            }),
        );

        return this;
    }

    /**
     * @deprecated - Use `approveTokenNftAllowance()` instead
     * @param {NftId | string} nftId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @returns {AccountAllowanceApproveTransaction}
     */
    addTokenNftAllowance(nftId, spenderAccountId) {
        return this._approveTokenNftAllowance(
            nftId,
            null,
            spenderAccountId,
            null,
        );
    }

    /**
     * @returns {TokenNftAllowance[]}
     */
    get tokenNftApprovals() {
        return this._nftApprovals;
    }

    /**
     * @param {NftId | string} nftId
     * @param {AccountId | string | null} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {AccountId | string | null} delegatingSpender
     * @returns {AccountAllowanceApproveTransaction}
     */
    _approveTokenNftAllowance(
        nftId,
        ownerAccountId,
        spenderAccountId,
        delegatingSpender,
    ) {
        this._requireNotFrozen();

        const id = typeof nftId === "string" ? NftId.fromString(nftId) : nftId;
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
        let found = false;

        for (const allowance of this._nftApprovals) {
            if (
                allowance.tokenId.compare(id.tokenId) === 0 &&
                allowance.spenderAccountId != null &&
                allowance.spenderAccountId.compare(spender) === 0
            ) {
                if (allowance.serialNumbers != null) {
                    allowance.serialNumbers.push(id.serial);
                }
                found = true;
                break;
            }
        }

        if (!found) {
            this._nftApprovals.push(
                new TokenNftAllowance({
                    tokenId: id.tokenId,
                    spenderAccountId: spender,
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
                    serialNumbers: [id.serial],
                    allSerials: false,
                    delegatingSpender:
                        typeof delegatingSpender === "string"
                            ? AccountId.fromString(delegatingSpender)
                            : delegatingSpender,
                }),
            );
        }

        return this;
    }

    /**
     * @param {NftId | string} nftId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @returns {AccountAllowanceApproveTransaction}
     */
    approveTokenNftAllowance(nftId, ownerAccountId, spenderAccountId) {
        return this._approveTokenNftAllowance(
            nftId,
            ownerAccountId,
            spenderAccountId,
            null,
        );
    }

    /**
     * @param {NftId | string} nftId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {AccountId | string} delegatingSpender
     * @returns {AccountAllowanceApproveTransaction}
     */
    approveTokenNftAllowanceWithDelegatingSpender(
        nftId,
        ownerAccountId,
        spenderAccountId,
        delegatingSpender,
    ) {
        return this._approveTokenNftAllowance(
            nftId,
            ownerAccountId,
            spenderAccountId,
            delegatingSpender,
        );
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string | null} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @param {boolean} allSerials
     * @returns {AccountAllowanceApproveTransaction}
     */
    _approveAllTokenNftAllowance(
        tokenId,
        ownerAccountId,
        spenderAccountId,
        allSerials,
    ) {
        this._requireNotFrozen();

        this._nftApprovals.push(
            new TokenNftAllowance({
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
                serialNumbers: null,
                allSerials,
                delegatingSpender: null,
            }),
        );

        return this;
    }

    /**
     * @deprecated - Use `approveTokenNftAllowanceAllSerials()` instead
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | string} spenderAccountId
     * @returns {AccountAllowanceApproveTransaction}
     */
    addAllTokenNftAllowance(tokenId, ownerAccountId, spenderAccountId) {
        return this._approveAllTokenNftAllowance(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            true,
        );
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @returns {AccountAllowanceApproveTransaction}
     */
    approveTokenNftAllowanceAllSerials(
        tokenId,
        ownerAccountId,
        spenderAccountId,
    ) {
        return this._approveAllTokenNftAllowance(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            true,
        );
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @param {AccountId | ContractId | string} spenderAccountId
     * @returns {AccountAllowanceApproveTransaction}
     */
    deleteTokenNftAllowanceAllSerials(
        tokenId,
        ownerAccountId,
        spenderAccountId,
    ) {
        return this._approveAllTokenNftAllowance(
            tokenId,
            ownerAccountId,
            spenderAccountId,
            false,
        );
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        this._hbarApprovals.map((approval) =>
            approval._validateChecksums(client),
        );
        this._tokenApprovals.map((approval) =>
            approval._validateChecksums(client),
        );
        this._nftApprovals.map((approval) =>
            approval._validateChecksums(client),
        );
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.approveAllowances(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoApproveAllowance";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ICryptoApproveAllowanceTransactionBody}
     */
    _makeTransactionData() {
        return {
            cryptoAllowances: this._hbarApprovals.map((approval) =>
                approval._toProtobuf(),
            ),
            tokenAllowances: this._tokenApprovals.map((approval) =>
                approval._toProtobuf(),
            ),
            nftAllowances: this._nftApprovals.map((approval) =>
                approval._toProtobuf(),
            ),
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `AccountAllowanceApproveTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoApproveAllowance",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountAllowanceApproveTransaction._fromProtobuf,
);
