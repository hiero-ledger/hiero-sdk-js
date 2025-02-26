// SPDX-License-Identifier: Apache-2.0
import TokenRejectTransaction from "../token/TokenRejectTransaction.js";
import TokenDissociateTransaction from "../token/TokenDissociateTransaction.js";

/**
 * @typedef {import("../PrivateKey.js").default} PrivateKey
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Signer.js").default} Signer
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../transaction/Transaction.js").default} Transaction
 * @typedef {import("../transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("../token/TokenId.js").default} TokenId
 * @typedef {import("../token/NftId.js").default} NftId
 * @typedef {import("../PublicKey.js").default} PublicKey
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Reject undesired token(s) and dissociate in a single flow.
 */
export default class TokenRejectFlow {
    constructor() {
        /**
         * @private
         * @type {?AccountId}
         */
        this._ownerId = null;

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

        /**
         * @private
         * @type {?Client}
         */
        this._freezeWithClient = null;

        /**
         * @private
         * @type {?PrivateKey}
         */
        this._signPrivateKey = null;

        /**
         * @private
         * @type {?PublicKey}
         */
        this._signPublicKey = null;

        /**
         * @private
         * @type {?(message: Uint8Array) => Promise<Uint8Array>}
         */
        this._transactionSigner = null;
    }

    /**
     *
     * @param {AccountId} ownerId
     * @returns {this}
     */
    setOwnerId(ownerId) {
        this.requireNotFrozen();
        this._ownerId = ownerId;
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get ownerId() {
        return this._ownerId;
    }

    /**
     *
     * @param {TokenId[]} ids
     * @returns {this}
     */
    setTokenIds(ids) {
        this.requireNotFrozen();
        this._tokenIds = ids;
        return this;
    }

    /**
     *
     * @param {TokenId} id
     * @returns {this}
     */
    addTokenId(id) {
        this.requireNotFrozen();
        this._tokenIds.push(id);
        return this;
    }

    /**
     *
     * @returns {TokenId[]}
     */
    get tokenIds() {
        return this._tokenIds;
    }

    /**
     *
     * @param {NftId[]} ids
     * @returns {this}
     */
    setNftIds(ids) {
        this.requireNotFrozen();
        this._nftIds = ids;
        return this;
    }

    /**
     *
     * @param {NftId} id
     * @returns {this}
     */
    addNftId(id) {
        this.requireNotFrozen();
        this._nftIds.push(id);
        return this;
    }

    /**
     *
     * @returns {NftId[]}
     */
    get nftIds() {
        return this._nftIds;
    }

    /**
     *
     * @param {PrivateKey} privateKey
     * @returns {this}
     */
    sign(privateKey) {
        this._signPrivateKey = privateKey;
        this._signPublicKey = null;
        this._transactionSigner = null;
        return this;
    }

    /**
     *
     * @param {PublicKey} publicKey
     * @param {((message: Uint8Array) => Promise<Uint8Array>)} signer
     * @returns {this}
     */
    signWith(publicKey, signer) {
        this._signPublicKey = publicKey;
        this._transactionSigner = signer;
        this._signPrivateKey = null;
        return this;
    }

    /**
     * @param {Client} client
     * @returns {this}
     */
    signWithOperator(client) {
        const operator = client.getOperator();
        if (operator == null) {
            throw new Error("Client operator must be set");
        }
        this._signPublicKey = operator.publicKey;
        this._transactionSigner = operator.transactionSigner;
        this._signPrivateKey = null;
        return this;
    }

    /**
     * @private
     * @param {Transaction} transaction
     */
    fillOutTransaction(transaction) {
        if (this._freezeWithClient) {
            transaction.freezeWith(this._freezeWithClient);
        }
        if (this._signPrivateKey) {
            void transaction.sign(this._signPrivateKey);
        } else if (this._signPublicKey && this._transactionSigner) {
            void transaction.signWith(
                this._signPublicKey,
                this._transactionSigner,
            );
        }
    }
    /**
     *
     * @param {Client} client
     * @returns {this}
     */
    freezeWith(client) {
        this._freezeWithClient = client;
        return this;
    }

    /**
     * @param {Client} client
     * @returns {Promise<TransactionResponse>}
     */
    async execute(client) {
        const tokenRejectTxn = new TokenRejectTransaction()
            .setTokenIds(this.tokenIds)
            .setNftIds(this.nftIds);

        if (this.ownerId) {
            tokenRejectTxn.setOwnerId(this.ownerId);
        }

        this.fillOutTransaction(tokenRejectTxn);

        /* Get all token ids from NFT and remove duplicates as duplicated IDs 
        will trigger a TOKEN_REFERENCE_REPEATED error. */
        const nftTokenIds = this.nftIds
            .map((nftId) => nftId.tokenId)
            .filter(function (value, index, array) {
                return array.indexOf(value) === index;
            });

        const tokenDissociateTxn = new TokenDissociateTransaction().setTokenIds(
            [...this.tokenIds, ...nftTokenIds],
        );

        if (this.ownerId != null) {
            tokenDissociateTxn.setAccountId(this.ownerId);
        }

        this.fillOutTransaction(tokenDissociateTxn);

        const tokenRejectResponse = await tokenRejectTxn.execute(client);
        await tokenRejectResponse.getReceipt(client);

        const tokenDissociateResponse =
            await tokenDissociateTxn.execute(client);
        await tokenDissociateResponse.getReceipt(client);

        return tokenRejectResponse;
    }

    requireNotFrozen() {
        if (this._freezeWithClient != null) {
            throw new Error(
                "Transaction is already frozen and cannot be modified",
            );
        }
    }
}
