// SPDX-License-Identifier: Apache-2.0
import AccountId from "../account/AccountId.js";
import Transaction from "../transaction/Transaction.js";
import { TRANSACTION_REGISTRY } from "../transaction/Transaction.js";
import TokenReference from "../token/TokenReference.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenRejectTransactionBody} HieroProto.proto.ITokenRejectTransactionBody
 * @typedef {import("@hashgraph/proto").proto.TokenReference} HieroProto.proto.TokenReference
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../token/TokenId.js").default} TokenId
 * @typedef {import("../token/NftId.js").default} NftId
 */

/**
 * Reject a new Hedera™ crypto-currency token.
 */
export default class TokenRejectTransaction extends Transaction {
    /**
     *
     * @param {object} [props]
     * @param {?AccountId} [props.owner]
     * @param {NftId[]} [props.nftIds]
     * @param {TokenId[]} [props.tokenIds]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?AccountId}
         */
        this._owner = null;

        if (props.owner != null) {
            this.setOwnerId(props.owner);
        }

        /**
         * @private
         * @type {TokenId[]}
         */
        this._tokenIds = [];

        /**
         * @private
         * @type {NftId[]}
         */
        this._nftIds = [];

        if (props.tokenIds != null) {
            this.setTokenIds(props.tokenIds);
        }

        if (props.nftIds != null) {
            this.setNftIds(props.nftIds);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenRejectTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const rejectToken =
            /** @type {HieroProto.proto.ITokenRejectTransactionBody} */ (
                body.tokenReject
            );

        const tokenIds = rejectToken.rejections?.map((rejection) =>
            TokenReference._fromProtobuf(rejection),
        );
        const ftIds = tokenIds
            ?.filter((token) => token.fungibleToken)
            .map(({ fungibleToken }) => {
                if (fungibleToken == null) {
                    throw new Error("Fungible Token cannot be null");
                }
                return fungibleToken;
            });

        const nftIds = tokenIds
            ?.filter((token) => token.nft)
            .map(({ nft }) => {
                if (nft == null) {
                    throw new Error("Nft cannot be null");
                }
                return nft;
            });

        return Transaction._fromProtobufTransactions(
            new TokenRejectTransaction({
                owner:
                    rejectToken.owner != null
                        ? AccountId._fromProtobuf(rejectToken.owner)
                        : undefined,

                tokenIds: ftIds,
                nftIds: nftIds,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {TokenId[]}
     */
    get tokenIds() {
        return this._tokenIds;
    }

    /**
     * @param {TokenId[]} tokenIds
     * @returns {this}
     */
    setTokenIds(tokenIds) {
        this._requireNotFrozen();
        this._tokenIds = tokenIds;
        return this;
    }

    /**
     * @param {TokenId} tokenId
     * @returns {this}
     */
    addTokenId(tokenId) {
        this._requireNotFrozen();
        this._tokenIds?.push(tokenId);
        return this;
    }

    /**
     * @returns {NftId[]}
     *
     */
    get nftIds() {
        return this._nftIds;
    }

    /**
     *
     * @param {NftId[]} nftIds
     * @returns {this}
     */
    setNftIds(nftIds) {
        this._requireNotFrozen();
        this._nftIds = nftIds;
        return this;
    }

    /**
     * @param {NftId} nftId
     * @returns {this}
     */
    addNftId(nftId) {
        this._requireNotFrozen();
        this._nftIds?.push(nftId);
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get ownerId() {
        return this._owner;
    }

    /**
     * @param {AccountId} owner
     * @returns {this}
     */
    setOwnerId(owner) {
        this._requireNotFrozen();
        this._owner = owner;
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
        return channel.token.rejectToken(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenReject";
    }

    /**
     * @returns {HieroProto.proto.ITokenRejectTransactionBody}
     */
    _makeTransactionData() {
        /** @type {HieroProto.proto.TokenReference[]} */
        const rejections = [];
        for (const tokenId of this._tokenIds) {
            rejections.push({
                fungibleToken: tokenId._toProtobuf(),
            });
        }

        for (const nftId of this._nftIds) {
            rejections.push({
                nft: nftId._toProtobuf(),
            });
        }
        return {
            owner: this.ownerId?._toProtobuf() ?? null,
            rejections,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenRejectTransaction:${timestamp.toString()}`;
    }
}
TRANSACTION_REGISTRY.set(
    "tokenReject",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenRejectTransaction._fromProtobuf,
);
