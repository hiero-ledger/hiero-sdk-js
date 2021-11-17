import Hbar from "../Hbar.js";
import TokenId from "../token/TokenId.js";
import AccountId from "./AccountId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Long from "long";
import TokenTransferMap from "./TokenTransferMap.js";
import HbarTransferMap from "./HbarTransferMap.js";
import TokenNftTransferMap from "./TokenNftTransferMap.js";
import * as util from "../util.js";
import NftId from "../token/NftId.js";

/**
 * @typedef {import("../long.js").LongObject} LongObject
 * @typedef {import("bignumber.js").default} BigNumber
 */

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ICryptoTransferTransactionBody} proto.ICryptoTransferTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITokenID} proto.ITokenID
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 * @typedef {import("@exodus/hashgraph-proto").IAccountAmount} proto.IAccountAmount
 * @typedef {import("@exodus/hashgraph-proto").ITokenTransferList} proto.ITokenTransferList
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
export default class TransferTransaction extends Transaction {
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
         * @type {TokenTransferMap}
         */
        this._tokenTransfers = new TokenTransferMap();

        /**
         * @private
         * @type {HbarTransferMap}
         */
        this._hbarTransfers = new HbarTransferMap();

        /**
         * @private
         * @type {TokenNftTransferMap}
         */
        this._nftTransfers = new TokenNftTransferMap();

        this.setMaxTransactionFee(new Hbar(1));

        for (const transfer of props.tokenTransfers != null
            ? props.tokenTransfers
            : []) {
            this.addTokenTransfer(
                transfer.tokenId,
                transfer.accountId,
                transfer.amount
            );
        }

        for (const transfer of props.hbarTransfers != null
            ? props.hbarTransfers
            : []) {
            this.addHbarTransfer(transfer.accountId, transfer.amount);
        }

        for (const transfer of props.nftTransfers != null
            ? props.nftTransfers
            : []) {
            this.addNftTransfer(
                transfer.tokenId,
                transfer.serial,
                transfer.sender,
                transfer.recipient
            );
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {TransferTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const cryptoTransfer =
            /** @type {proto.ICryptoTransferTransactionBody} */ (
                body.cryptoTransfer
            );

        const transfers = new TransferTransaction();
        for (const list of cryptoTransfer.tokenTransfers != null
            ? cryptoTransfer.tokenTransfers
            : []) {
            const tokenId = TokenId._fromProtobuf(
                /** @type {proto.ITokenID} */ (list.token)
            );

            for (const transfer of list.transfers != null
                ? list.transfers
                : []) {
                transfers.addTokenTransfer(
                    tokenId,
                    AccountId._fromProtobuf(
                        /** @type {proto.IAccountID} */ (transfer.accountID)
                    ),
                    /** @type {Long} */ (transfer.amount)
                );
            }

            for (const transfer of list.nftTransfers != null
                ? list.nftTransfers
                : []) {
                transfers.addNftTransfer(
                    tokenId,
                    /** @type {Long} */ (transfer.serialNumber),
                    AccountId._fromProtobuf(
                        /** @type {proto.IAccountID} */ (
                            transfer.senderAccountID
                        )
                    ),
                    AccountId._fromProtobuf(
                        /** @type {proto.IAccountID} */ (
                            transfer.receiverAccountID
                        )
                    )
                );
            }
        }

        const accountAmounts =
            cryptoTransfer.transfers != null
                ? cryptoTransfer.transfers.accountAmounts != null
                    ? cryptoTransfer.transfers.accountAmounts
                    : []
                : [];

        for (const aa of accountAmounts) {
            transfers.addHbarTransfer(
                AccountId._fromProtobuf(
                    /** @type {proto.IAccountID} */ (aa.accountID)
                ),
                Hbar.fromTinybars(/** @type {Long} */ (aa.amount))
            );
        }

        return Transaction._fromProtobufTransactions(
            transfers,
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @returns {TokenTransferMap}
     */
    get tokenTransfers() {
        return this._tokenTransfers;
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} accountId
     * @param {number | Long} amount
     * @returns {this}
     */
    addTokenTransfer(tokenId, accountId, amount) {
        this._requireNotFrozen();

        this._tokenTransfers.__set(
            tokenId instanceof TokenId ? tokenId : TokenId.fromString(tokenId),
            accountId instanceof AccountId
                ? accountId
                : AccountId.fromString(accountId),
            amount instanceof Long ? amount : Long.fromNumber(amount)
        );

        return this;
    }

    /**
     * @returns {HbarTransferMap}
     */
    get hbarTransfers() {
        return this._hbarTransfers;
    }

    /**
     * @internal
     * @param {AccountId | string} accountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {TransferTransaction}
     */
    addHbarTransfer(accountId, amount) {
        this._requireNotFrozen();

        if (this.hbarTransfers.get(accountId) != null) {
            amount = this._squashTransfers(accountId, amount);
        }

        this._hbarTransfers._set(
            accountId instanceof AccountId
                ? accountId
                : AccountId.fromString(accountId),
            amount instanceof Hbar ? amount : new Hbar(amount)
        );

        return this;
    }

    /**
     * @internal
     * @param {AccountId | string} accountId
     * @param {number | string | Long | LongObject | BigNumber | Hbar} amount
     * @returns {Hbar}
     */
    _squashTransfers(accountId, amount) {
        let currentValue = this.hbarTransfers.get(accountId);
        return Hbar.fromTinybars(
            (currentValue == null ? Long.ZERO : currentValue.toTinybars()).add(
                amount instanceof Hbar
                    ? amount.toTinybars()
                    : new Hbar(amount).toTinybars()
            )
        );
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [a, _] of this._hbarTransfers) {
            if (a != null) {
                a.validateChecksum(client);
            }
        }

        for (const [tokenId, transfers] of this._tokenTransfers) {
            if (tokenId != null) {
                tokenId.validateChecksum(client);
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [a, _] of transfers) {
                if (a != null) {
                    a.validateChecksum(client);
                }
            }
        }
    }

    /**
     * @returns {TokenNftTransferMap}
     */
    get nftTransfers() {
        return this._nftTransfers;
    }

    /**
     * @internal
     * @param {NftId | TokenId | string} tokenIdOrNftId
     * @param {AccountId | string | Long | number} senderAccountIdOrSerialNumber
     * @param {AccountId | string} recipientAccountIdOrSenderAccountId
     * @param {(AccountId | string)=} recipient
     * @returns {TransferTransaction}
     */
    addNftTransfer(
        tokenIdOrNftId,
        senderAccountIdOrSerialNumber,
        recipientAccountIdOrSenderAccountId,
        recipient
    ) {
        this._requireNotFrozen();

        let tokenId;
        let serial;
        let senderId;
        let recipientId;

        if (typeof tokenIdOrNftId === "string") {
            if (tokenIdOrNftId.includes("/") || tokenIdOrNftId.includes("@")) {
                tokenIdOrNftId = NftId.fromString(tokenIdOrNftId);
            } else {
                tokenIdOrNftId = TokenId.fromString(tokenIdOrNftId);
            }
        }

        if (tokenIdOrNftId instanceof NftId) {
            tokenId = tokenIdOrNftId.tokenId;
            serial = tokenIdOrNftId.serial;
            senderId = /** @type {AccountId | string} */ (
                senderAccountIdOrSerialNumber
            );
            recipientId = /** @type {AccountId | string} */ (
                recipientAccountIdOrSenderAccountId
            );
        } else if (tokenIdOrNftId instanceof TokenId) {
            tokenId = /** @type {TokenId} */ (tokenIdOrNftId);
            serial = /** @type {Long|number} */ (senderAccountIdOrSerialNumber);
            senderId = /** @type {AccountId | string} */ (
                recipientAccountIdOrSenderAccountId
            );
            util.requireNonNull(recipient);
            recipientId = /** @type {AccountId | string} */ (recipient);
        } else {
            throw new Error("unintended type for tokenIdOrNftId");
        }

        this._nftTransfers.__set(
            typeof tokenId === "string" ? TokenId.fromString(tokenId) : tokenId,
            {
                serial:
                    typeof serial === "number"
                        ? Long.fromNumber(serial)
                        : serial,
                sender:
                    typeof senderId === "string"
                        ? AccountId.fromString(senderId)
                        : senderId,

                recipient:
                    typeof recipientId === "string"
                        ? AccountId.fromString(recipientId)
                        : recipientId,
            }
        );

        return this;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.cryptoTransfer(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoTransfer";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ICryptoTransferTransactionBody}
     */
    _makeTransactionData() {
        /** @type {Set<string>} */
        const tokenIds = new Set();

        for (const tokenId of this._tokenTransfers.keys()) {
            tokenIds.add(tokenId.toString());
        }

        for (const tokenId of this._nftTransfers.keys()) {
            tokenIds.add(tokenId.toString());
        }

        const tokenTransfers = Array.from(tokenIds, (tokenId) => {
            const thisTokenTransfers = this._tokenTransfers.get(tokenId);
            const thisNftTransfers = this._nftTransfers.get(tokenId);

            let transfers;
            let nftTransfers;

            if (thisTokenTransfers != null) {
                transfers = Array.from(
                    thisTokenTransfers,
                    ([accountId, amount]) => {
                        return {
                            accountId,
                            amount,
                        };
                    }
                );

                transfers.sort((a, b) => {
                    const accountIdComparison = a.accountId.compare(
                        b.accountId
                    );
                    if (accountIdComparison != 0) {
                        return accountIdComparison;
                    }

                    return a.amount.compare(b.amount);
                });
            }

            if (thisNftTransfers != null) {
                // eslint-disable-next-line ie11/no-loop-func
                nftTransfers = thisNftTransfers.map((transfer) => {
                    return {
                        sender: transfer.sender,
                        recipient: transfer.recipient,
                        serialNumber: transfer.serial,
                    };
                });

                nftTransfers.sort((a, b) => {
                    const senderComparision = a.sender.compare(b.sender);
                    if (senderComparision != 0) {
                        return senderComparision;
                    }

                    const recipientComparision = a.recipient.compare(
                        b.recipient
                    );
                    if (recipientComparision != 0) {
                        return recipientComparision;
                    }

                    return a.serialNumber.compare(b.serialNumber);
                });
            }

            return {
                token: TokenId.fromString(tokenId),
                transfers,
                nftTransfers,
            };
        });

        const hbarTransfers = Array.from(
            this._hbarTransfers,
            ([accountId, amount]) => {
                return {
                    accountId,
                    amount,
                };
            }
        );

        tokenTransfers.sort((a, b) => {
            return a.token.compare(b.token);
        });

        hbarTransfers.sort((a, b) => {
            const accountIdComparison = a.accountId.compare(b.accountId);
            if (accountIdComparison != 0) {
                return accountIdComparison;
            }

            return a.amount.toTinybars().compare(b.amount.toTinybars());
        });

        return {
            transfers: {
                accountAmounts: hbarTransfers.map((transfer) => {
                    return {
                        accountID: transfer.accountId._toProtobuf(),
                        amount: transfer.amount.toTinybars(),
                    };
                }),
            },
            tokenTransfers: tokenTransfers.map((tokenTransfer) => {
                return {
                    token: tokenTransfer.token._toProtobuf(),
                    transfers: (tokenTransfer.transfers != null
                        ? tokenTransfer.transfers
                        : []
                    ).map((transfer) => {
                        return {
                            accountID: transfer.accountId._toProtobuf(),
                            amount: transfer.amount,
                        };
                    }),
                    nftTransfers: (tokenTransfer.nftTransfers != null
                        ? tokenTransfer.nftTransfers
                        : []
                    ).map((nftTransfer) => {
                        return {
                            senderAccountID: nftTransfer.sender._toProtobuf(),
                            receiverAccountID:
                                nftTransfer.recipient._toProtobuf(),
                            serialNumber: nftTransfer.serialNumber,
                        };
                    }),
                };
            }),
        };
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoTransfer",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TransferTransaction._fromProtobuf
);
