// SPDX-License-Identifier: Apache-2.0
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import TokenTransfer from "./TokenTransfer.js";
import NftTransfer from "./TokenNftTransfer.js";
import AbstractTokenTransferTransaction from "./AbstractTokenTransferTransaction.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenAirdropTransactionBody} HieroProto.proto.ITokenAirdropTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionID} HieroProto.proto.TransactionID
 * @typedef {import("@hashgraph/proto").proto.AccountID} HieroProto.proto.AccountID
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("./NftId.js").default} NftId
 * @typedef {import("./TokenId.js").default} TokenId
 */

/**
 * Airdrop one or more tokens to one or more accounts.
 *
 * ### Effects
 * This distributes tokens from the balance of one or more sending account(s)
 * to the balance of one or more recipient accounts. Accounts MAY receive the
 * tokens in one of four ways.
 *
 *  - An account already associated to the token to be distributed SHALL
 *    receive the airdropped tokens immediately to the recipient account
 *    balance.<br/>
 *    The fee for this transfer SHALL include the transfer, the airdrop fee,
 *    and any custom fees.
 *  - An account with available automatic association slots SHALL be
 *    automatically associated to the token, and SHALL immediately receive
 *    the airdropped tokens to the recipient account balance.<br/>
 *    The fee for this transfer SHALL include the transfer, the association,
 *    the cost to renew that association once, the airdrop fee, and
 *    any custom fees.
 *  - An account with "receiver signature required" set SHALL have a
 *    "Pending Airdrop" created and must claim that airdrop with a
 *    `claimAirdrop` transaction.<br/>
 *    The fee for this transfer SHALL include the transfer, the association,
 *    the cost to renew that association once, the airdrop fee, and
 *    any custom fees.<br/>
 *    If the pending airdrop is not claimed immediately, the `sender` SHALL
 *    pay the cost to renew the token association, and the cost to maintain
 *    the pending airdrop, until the pending airdrop is claimed or cancelled.
 *  - An account with no available automatic association slots SHALL have a
 *    "Pending Airdrop" created and must claim that airdrop with a
 *    `claimAirdrop` transaction.<br/>
 *    The fee for this transfer SHALL include the transfer, the association,
 *    the cost to renew that association once, the airdrop fee, and any custom
 *    fees.<br/>
 *    If the pending airdrop is not claimed immediately, the `sender` SHALL
 *    pay the cost to renew the token association, and the cost to maintain
 *    the pending airdrop, until the pending airdrop is claimed or cancelled.
 *
 * If an airdrop would create a pending airdrop for a fungible/common token,
 * and a pending airdrop for the same sender, receiver, and token already
 * exists, the existing pending airdrop SHALL be updated to add the new
 * amount to the existing airdrop, rather than creating
 * a new pending airdrop.<br/>
 * Any airdrop that completes immediately SHALL be irreversible. Any airdrop
 * that results in a "Pending Airdrop" MAY be canceled via a `cancelAirdrop`
 * transaction.<br/>
 * All transfer fees (including custom fees and royalties), as well as the
 * rent cost for the first auto-renewal period for any automatic-association
 * slot occupied by the airdropped tokens, SHALL be charged to the account
 * paying for this transaction.<br/>
 */
export default class TokenAirdropTransaction extends AbstractTokenTransferTransaction {
    /**
     * @param {object} props
     * @param {TokenTransfer[]} [props.tokenTransfers]
     * @param {NftTransfer[]} [props.nftTransfers]
     */
    constructor(props = {}) {
        super();

        if (props.tokenTransfers != null) {
            for (const tokenTransfer of props.tokenTransfers) {
                this._addTokenTransfer(
                    tokenTransfer.tokenId,
                    tokenTransfer.accountId,
                    tokenTransfer.amount,
                    tokenTransfer.isApproved,
                    tokenTransfer.expectedDecimals,
                );
            }
        }
        /**
         * @private
         * @type {NftTransfer[]}
         */
        this._nftTransfers = [];
        if (props.nftTransfers != null) {
            for (const nftTransfer of props.nftTransfers) {
                this._addNftTransfer(
                    nftTransfer.isApproved,
                    nftTransfer.tokenId,
                    nftTransfer.serialNumber,
                    nftTransfer.senderAccountId,
                    nftTransfer.receiverAccountId,
                );
            }
        }
    }

    /**
     *
     * @param {TokenId} tokenId
     * @param {AccountId} accountId
     * @param {Long} amount
     * @param {number} expectedDecimals
     * @returns {this}
     */
    addApprovedTokenTransferWithDecimals(
        tokenId,
        accountId,
        amount,
        expectedDecimals,
    ) {
        this._requireNotFrozen();
        this._addTokenTransfer(
            tokenId,
            accountId,
            amount,
            true,
            expectedDecimals,
        );
        return this;
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenAirdropTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const tokenAirdrop =
            /** @type {HieroProto.proto.ITokenAirdropTransactionBody} */ (
                body.tokenAirdrop
            );

        const tokenTransfers = TokenTransfer._fromProtobuf(
            tokenAirdrop.tokenTransfers ?? [],
        );
        const nftTransfers = NftTransfer._fromProtobuf(
            tokenAirdrop.tokenTransfers ?? [],
        );

        return Transaction._fromProtobufTransactions(
            new TokenAirdropTransaction({
                nftTransfers: nftTransfers,
                tokenTransfers: tokenTransfers,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
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
        return channel.token.airdropTokens(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenAirdrop";
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenAirdropTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenAirdrop",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenAirdropTransaction._fromProtobuf,
);
