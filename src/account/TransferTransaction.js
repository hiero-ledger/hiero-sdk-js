// SPDX-License-Identifier: Apache-2.0

import Hbar from "../Hbar.js";
import TokenId from "../token/TokenId.js";
import AccountId from "./AccountId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Transfer from "../Transfer.js";
import TokenTransfer from "../token/TokenTransfer.js";
import HbarTransferMap from "./HbarTransferMap.js";
import TokenNftTransfer from "../token/TokenNftTransfer.js";
import NftId from "../token/NftId.js";
import AbstractTokenTransferTransaction from "../token/AbstractTokenTransferTransaction.js";
import FungibleHookCall from "../hooks/FungibleHookCall.js";
import NftHookCall from "../hooks/NftHookCall.js";

/**
 * @typedef {import("../long.js").LongObject} LongObject
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hiero-ledger/proto").proto.ICryptoTransferTransactionBody} HieroProto.proto.ICryptoTransferTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * @typedef {object} TransferTokensInput
 * @property {TokenId | string} tokenId
 * @property {AccountId | string} accountId
 * @property {Long | number} amount
 */

/**
 * @typedef {object} TransferTokenObject
 * @property {TokenId} tokenId
 * @property {AccountId} accountId
 * @property {Long} amount
 */

/**
 * @typedef {object} TransferHbarInput
 * @property {AccountId | string} accountId
 * @property {number | string | Long | BigNumber | Hbar} amount
 */

/**
 * @typedef {object} TransferNftInput
 * @property {TokenId | string} tokenId
 * @property {AccountId | string} sender
 * @property {AccountId | string} recipient
 * @property {Long | number} serial
 */

/**
 * Transfers a new Hedera™ crypto-currency token.
 */
export default class TransferTransaction extends AbstractTokenTransferTransaction {
    /**
     * @param {object} [props]
     * @param {(TransferTokensInput)[]} [props.tokenTransfers]
     * @param {(TransferHbarInput)[]} [props.hbarTransfers]
     * @param {(TransferNftInput)[]} [props.nftTransfers]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {Transfer[]}
         */
        this._hbarTransfers = [];

        this._defaultMaxTransactionFee = new Hbar(1);

        for (const transfer of props.hbarTransfers != null
            ? props.hbarTransfers
            : []) {
            this.addHbarTransfer(transfer.accountId, transfer.amount);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TransferTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const cryptoTransfer =
            /** @type {HieroProto.proto.ICryptoTransferTransactionBody} */ (
                body.cryptoTransfer
            );

        const transfers = new TransferTransaction();

        transfers._tokenTransfers = TokenTransfer._fromProtobuf(
            cryptoTransfer.tokenTransfers != null
                ? cryptoTransfer.tokenTransfers
                : [],
        );

        transfers._hbarTransfers = Transfer._fromProtobuf(
            cryptoTransfer.transfers != null
                ? cryptoTransfer.transfers.accountAmounts != null
                    ? cryptoTransfer.transfers.accountAmounts
                    : []
                : [],
        );

        transfers._nftTransfers = TokenNftTransfer._fromProtobuf(
            cryptoTransfer.tokenTransfers != null
                ? cryptoTransfer.tokenTransfers
                : [],
        );

        return Transaction._fromProtobufTransactions(
            transfers,
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {HbarTransferMap}
     */
    get hbarTransfers() {
        const map = new HbarTransferMap();

        for (const transfer of this._hbarTransfers) {
            map._set(transfer.accountId, transfer.amount);
        }

        return map;
    }

    /**
     * @returns {Transfer[]}
     */
    get hbarTransfersList() {
        return this._hbarTransfers;
    }

    /**
     * @internal
     * @param {AccountId | string} accountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @param {boolean} isApproved
     * @param {FungibleHookCall} [hookCall]
     * @returns {TransferTransaction}
     */
    _addHbarTransfer(accountId, amount, isApproved, hookCall) {
        this._requireNotFrozen();

        const account =
            accountId instanceof AccountId
                ? accountId.clone()
                : AccountId.fromString(accountId);
        const hbars = amount instanceof Hbar ? amount : new Hbar(amount);

        for (const transfer of this._hbarTransfers) {
            if (transfer.accountId.compare(account) === 0) {
                transfer.amount = Hbar.fromTinybars(
                    transfer.amount.toTinybars().add(hbars.toTinybars()),
                );
                return this;
            }
        }

        this._hbarTransfers.push(
            new Transfer({
                accountId: account,
                amount: hbars,
                isApproved,
                hookCall,
            }),
        );

        return this;
    }

    /**
     * @internal
     * @param {AccountId | string} accountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {TransferTransaction}
     */
    addHbarTransfer(accountId, amount) {
        return this._addHbarTransfer(accountId, amount, false);
    }

    /**
     * @internal
     * @param {AccountId | string} accountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {TransferTransaction}
     */
    addApprovedHbarTransfer(accountId, amount) {
        return this._addHbarTransfer(accountId, amount, true);
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const transfer of this._hbarTransfers) {
            transfer.accountId.validateChecksum(client);
        }

        for (const transfer of this._tokenTransfers) {
            transfer.tokenId.validateChecksum(client);
            transfer.accountId.validateChecksum(client);
        }

        for (const transfer of this._nftTransfers) {
            transfer.tokenId.validateChecksum(client);
            transfer.senderAccountId.validateChecksum(client);
            transfer.receiverAccountId.validateChecksum(client);
        }
    }

    /**
     * @deprecated - Use `addApprovedHbarTransfer()` instead
     * @param {AccountId | string} accountId
     * @param {boolean} isApproved
     * @returns {TransferTransaction}
     */
    setHbarTransferApproval(accountId, isApproved) {
        const account =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId;

        for (const transfer of this._hbarTransfers) {
            if (transfer.accountId.compare(account) === 0) {
                transfer.isApproved = isApproved;
            }
        }

        return this;
    }

    /**
     * @deprecated - Use `addApprovedTokenTransfer()` instead
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} accountId
     * @param {boolean} isApproved
     * @returns {TransferTransaction}
     */
    setTokenTransferApproval(tokenId, accountId, isApproved) {
        const token =
            typeof tokenId === "string" ? TokenId.fromString(tokenId) : tokenId;
        const account =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId;

        for (const tokenTransfer of this._tokenTransfers) {
            if (
                tokenTransfer.tokenId.compare(token) === 0 &&
                tokenTransfer.accountId.compare(account) === 0
            ) {
                tokenTransfer.isApproved = isApproved;
            }
        }

        return this;
    }

    /**
     * @deprecated - Use `addApprovedNftTransfer()` instead
     * @param {NftId | string} nftId
     * @param {boolean} isApproved
     * @returns {TransferTransaction}
     */
    setNftTransferApproval(nftId, isApproved) {
        const nft = typeof nftId === "string" ? NftId.fromString(nftId) : nftId;

        for (const transfer of this._nftTransfers) {
            if (
                transfer.tokenId.compare(nft.tokenId) === 0 &&
                transfer.serialNumber.compare(nft.serial) === 0
            ) {
                transfer.isApproved = isApproved;
            }
        }

        return this;
    }

    /**
     *
     * @param {AccountId} accountId
     * @param {Long} amount
     * @param {FungibleHookCall} hook
     * @returns {TransferTransaction}
     */
    addHbarTransferWithHook(accountId, amount, hook) {
        const isApproved = false; // this is not approved transfer, adding comment for clarity
        return this._addHbarTransfer(
            accountId,
            amount,
            isApproved,
            new FungibleHookCall({
                hookId: hook.hookId,
                evmHookCall: hook.evmHookCall,
                type: hook.type,
            }),
        );
    }

    /**
     *
     * @param {NftId} nftId
     * @param {AccountId} sender
     * @param {AccountId} receiver
     * @param {NftHookCall} senderHookCall
     * @param {NftHookCall} receiverHookCall
     * @returns {TransferTransaction}
     */
    addNftTransferWithHook(
        nftId,
        sender,
        receiver,
        senderHookCall,
        receiverHookCall,
    ) {
        return this._addNftTransfer(
            false,
            nftId,
            sender,
            receiver,
            undefined, // receiver
            senderHookCall,
            receiverHookCall,
        );
    }

    /**
     *
     * @param {TokenId} tokenId
     * @param {AccountId} accountId
     * @param {Long} amount
     * @param {FungibleHookCall} hook
     * @returns {TransferTransaction}
     */
    addTokenTransferWithHook(tokenId, accountId, amount, hook) {
        const fungibleHook = new FungibleHookCall({
            hookId: hook.hookId != null ? hook.hookId : undefined,
            evmHookCall:
                hook.evmHookCall != null ? hook.evmHookCall : undefined,
            type: hook.type,
        });

        const isApproved = false; // this is not approved transfer, adding comment for clarity
        const expectedDecimals = null; // we don't expect  decimals here, adding comment for clarity

        return this._addTokenTransfer(
            tokenId,
            accountId,
            amount,
            isApproved,
            expectedDecimals,
            fungibleHook,
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
        return channel.crypto.cryptoTransfer(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoTransfer";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ICryptoTransferTransactionBody}
     */
    _makeTransactionData() {
        const { tokenTransfers } = super._makeTransactionData();

        this._hbarTransfers.sort((a, b) => a.accountId.compare(b.accountId));

        return {
            transfers: {
                accountAmounts: this._hbarTransfers.map((transfer) =>
                    transfer._toProtobuf(),
                ),
            },
            tokenTransfers,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TransferTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoTransfer",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TransferTransaction._fromProtobuf,
);
