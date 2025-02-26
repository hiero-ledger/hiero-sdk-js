// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "../account/AccountId.js";
import Timestamp from "../Timestamp.js";
import Duration from "../Duration.js";
import Key from "../Key.js";
import TokenKeyValidation from "./TokenKeyValidation.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenUpdateTransactionBody} HieroProto.proto.ITokenUpdateTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Update a new Hedera™ crypto-currency token.
 */
export default class TokenUpdateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {TokenId | string} [props.tokenId]
     * @param {?string} [props.tokenName]
     * @param {?string} [props.tokenSymbol]
     * @param {AccountId | string} [props.treasuryAccountId]
     * @param {Key} [props.adminKey]
     * @param {Key} [props.kycKey]
     * @param {Key} [props.freezeKey]
     * @param {Key} [props.wipeKey]
     * @param {Key} [props.supplyKey]
     * @param {AccountId | string} [props.autoRenewAccountId]
     * @param {Timestamp | Date} [props.expirationTime]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {?string} [props.tokenMemo]
     * @param {Key} [props.feeScheduleKey]
     * @param {Key} [props.pauseKey]
     * @param {Key} [props.metadataKey]
     * @param {?Uint8Array} [props.metadata]
     * @param {TokenKeyValidation} [props.keyVerificationMode]
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
         * @type {?string}
         */
        this._tokenName = null;

        /**
         * @private
         * @type {?string}
         */
        this._tokenSymbol = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._treasuryAccountId = null;

        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = null;

        /**
         * @private
         * @type {?Key}
         */
        this._kycKey = null;

        /**
         * @private
         * @type {?Key}
         */
        this._freezeKey = null;

        /**
         * @private
         * @type {?Key}
         */
        this._wipeKey = null;

        /**
         * @private
         * @type {?Key}
         */
        this._supplyKey = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._autoRenewAccountId = null;

        /**
         * @private
         * @type {?Timestamp}
         */
        this._expirationTime = null;

        /**
         * @private
         * @type {?Duration}
         */
        this._autoRenewPeriod = null;

        /**
         * @private
         * @type {?string}
         */
        this._tokenMemo = null;

        /**
         * @private
         * @type {?Key}
         */
        this._feeScheduleKey = null;

        /**
         * @private
         * @type {?Key}
         */
        this._pauseKey = null;

        /**
         * @private
         * @type {?Key}
         */
        this._metadataKey = null;

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._metadata = null;

        /**
         * @private
         * @type {?TokenKeyValidation}
         * Determines whether the system should check the validity of the passed keys for update.
         * Defaults to FULL_VALIDATION
         */
        this._keyVerificationMode = TokenKeyValidation.FullValidation;

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        if (props.tokenName != null) {
            this.setTokenName(props.tokenName);
        }

        if (props.tokenSymbol != null) {
            this.setTokenSymbol(props.tokenSymbol);
        }

        if (props.treasuryAccountId != null) {
            this.setTreasuryAccountId(props.treasuryAccountId);
        }

        if (props.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }

        if (props.kycKey != null) {
            this.setKycKey(props.kycKey);
        }

        if (props.freezeKey != null) {
            this.setFreezeKey(props.freezeKey);
        }

        if (props.wipeKey != null) {
            this.setWipeKey(props.wipeKey);
        }

        if (props.supplyKey != null) {
            this.setSupplyKey(props.supplyKey);
        }

        if (props.autoRenewAccountId != null) {
            this.setAutoRenewAccountId(props.autoRenewAccountId);
        }

        if (props.expirationTime != null) {
            this.setExpirationTime(props.expirationTime);
        }

        if (props.autoRenewPeriod != null) {
            this.setAutoRenewPeriod(props.autoRenewPeriod);
        }

        if (props.tokenMemo != null) {
            this.setTokenMemo(props.tokenMemo);
        }

        if (props.feeScheduleKey != null) {
            this.setFeeScheduleKey(props.feeScheduleKey);
        }

        if (props.pauseKey != null) {
            this.setPauseKey(props.pauseKey);
        }

        if (props.metadataKey != null) {
            this.setMetadataKey(props.metadataKey);
        }

        if (props.metadata != null) {
            this.setMetadata(props.metadata);
        }

        if (props.keyVerificationMode != null) {
            this.setKeyVerificationMode(props.keyVerificationMode);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const update =
            /** @type {HieroProto.proto.ITokenUpdateTransactionBody} */ (
                body.tokenUpdate
            );

        return Transaction._fromProtobufTransactions(
            new TokenUpdateTransaction({
                tokenId:
                    update.token != null
                        ? TokenId._fromProtobuf(update.token)
                        : undefined,
                tokenName: Object.hasOwn(update, "name")
                    ? update.name
                    : undefined,
                tokenSymbol: Object.hasOwn(update, "symbol")
                    ? update.symbol
                    : undefined,
                treasuryAccountId:
                    update.treasury != null
                        ? AccountId._fromProtobuf(update.treasury)
                        : undefined,
                adminKey:
                    update.adminKey != null
                        ? Key._fromProtobufKey(update.adminKey)
                        : undefined,
                kycKey:
                    update.kycKey != null
                        ? Key._fromProtobufKey(update.kycKey)
                        : undefined,
                freezeKey:
                    update.freezeKey != null
                        ? Key._fromProtobufKey(update.freezeKey)
                        : undefined,
                wipeKey:
                    update.wipeKey != null
                        ? Key._fromProtobufKey(update.wipeKey)
                        : undefined,
                supplyKey:
                    update.supplyKey != null
                        ? Key._fromProtobufKey(update.supplyKey)
                        : undefined,
                autoRenewAccountId:
                    update.autoRenewAccount != null
                        ? AccountId._fromProtobuf(update.autoRenewAccount)
                        : undefined,
                expirationTime:
                    update.expiry != null
                        ? Timestamp._fromProtobuf(update.expiry)
                        : undefined,
                autoRenewPeriod:
                    update.autoRenewPeriod != null
                        ? Duration._fromProtobuf(update.autoRenewPeriod)
                        : undefined,
                tokenMemo:
                    update.memo != null
                        ? Object.hasOwn(update.memo, "value")
                            ? update.memo.value
                            : undefined
                        : undefined,
                feeScheduleKey:
                    update.feeScheduleKey != null
                        ? Key._fromProtobufKey(update.feeScheduleKey)
                        : undefined,
                pauseKey:
                    update.pauseKey != null
                        ? Key._fromProtobufKey(update.pauseKey)
                        : undefined,
                metadataKey:
                    update.metadataKey != null
                        ? Key._fromProtobufKey(update.metadataKey)
                        : undefined,
                metadata:
                    update.metadata != null
                        ? Object.hasOwn(update.metadata, "value")
                            ? update.metadata.value
                            : undefined
                        : undefined,
                keyVerificationMode:
                    update.keyVerificationMode != null
                        ? TokenKeyValidation._fromCode(
                              update.keyVerificationMode,
                          )
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
     * @returns {?string}
     */
    get tokenName() {
        return this._tokenName;
    }

    /**
     * @param {string} name
     * @returns {this}
     */
    setTokenName(name) {
        this._requireNotFrozen();
        this._tokenName = name;

        return this;
    }

    /**
     * @returns {?string}
     */
    get tokenSymbol() {
        return this._tokenSymbol;
    }

    /**
     * @param {string} symbol
     * @returns {this}
     */
    setTokenSymbol(symbol) {
        this._requireNotFrozen();
        this._tokenSymbol = symbol;

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get treasuryAccountId() {
        return this._treasuryAccountId;
    }

    /**
     * @param {AccountId | string} id
     * @returns {this}
     */
    setTreasuryAccountId(id) {
        this._requireNotFrozen();
        this._treasuryAccountId =
            typeof id === "string" ? AccountId.fromString(id) : id.clone();

        return this;
    }

    /**
     * @returns {?Key}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setAdminKey(key) {
        this._requireNotFrozen();
        this._adminKey = key;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get kycKey() {
        return this._kycKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setKycKey(key) {
        this._requireNotFrozen();
        this._kycKey = key;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get freezeKey() {
        return this._freezeKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setFreezeKey(key) {
        this._requireNotFrozen();
        this._freezeKey = key;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get wipeKey() {
        return this._wipeKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setWipeKey(key) {
        this._requireNotFrozen();
        this._wipeKey = key;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get supplyKey() {
        return this._supplyKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setSupplyKey(key) {
        this._requireNotFrozen();
        this._supplyKey = key;

        return this;
    }

    /**
     * @deprecated
     * @param {Key} key
     * @returns {this}
     */
    setsupplyKey(key) {
        this._requireNotFrozen();
        this._supplyKey = key;

        return this;
    }

    /**
     * @returns {?Timestamp}
     */
    get expirationTime() {
        return this._expirationTime;
    }

    /**
     * @param {Timestamp | Date} time
     * @returns {this}
     */
    setExpirationTime(time) {
        this._requireNotFrozen();
        this._expirationTime =
            time instanceof Timestamp ? time : Timestamp.fromDate(time);

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get autoRenewAccountId() {
        return this._autoRenewAccountId;
    }

    /**
     * @param {AccountId | string} id
     * @returns {this}
     */
    setAutoRenewAccountId(id) {
        this._requireNotFrozen();
        this._autoRenewAccountId =
            id instanceof AccountId ? id : AccountId.fromString(id);

        return this;
    }

    /**
     * @returns {?Duration}
     */
    get autoRenewPeriod() {
        return this._autoRenewPeriod;
    }

    /**
     * Set the auto renew period for this token.
     *
     * @param {Duration | Long | number} autoRenewPeriod
     * @returns {this}
     */
    setAutoRenewPeriod(autoRenewPeriod) {
        this._requireNotFrozen();
        this._autoRenewPeriod =
            autoRenewPeriod instanceof Duration
                ? autoRenewPeriod
                : new Duration(autoRenewPeriod);

        return this;
    }

    /**
     * @returns {?string}
     */
    get tokenMemo() {
        return this._tokenMemo;
    }

    /**
     * @param {string} tokenMemo
     * @returns {this}
     */
    setTokenMemo(tokenMemo) {
        this._requireNotFrozen();
        this._tokenMemo = tokenMemo;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get feeScheduleKey() {
        return this._feeScheduleKey;
    }

    /**
     * @param {Key} feeScheduleKey
     * @returns {this}
     */
    setFeeScheduleKey(feeScheduleKey) {
        this._requireNotFrozen();
        this._feeScheduleKey = feeScheduleKey;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get pauseKey() {
        return this._pauseKey;
    }

    /**
     * @param {Key} pauseKey
     * @returns {this}
     */
    setPauseKey(pauseKey) {
        this._requireNotFrozen();
        this._pauseKey = pauseKey;
        return this;
    }

    /**
     * @returns {?Key}
     */
    get metadataKey() {
        return this._metadataKey;
    }

    /**
     * @param {Key} metadataKey
     * @returns {this}
     */
    setMetadataKey(metadataKey) {
        this._requireNotFrozen();
        this._metadataKey = metadataKey;

        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get metadata() {
        return this._metadata;
    }

    /**
     * @param {Uint8Array} metadata
     * @returns {this}
     */
    setMetadata(metadata) {
        this._requireNotFrozen();
        this._metadata = metadata;

        return this;
    }

    /**
     * @returns {?TokenKeyValidation}
     */
    get keyVerificationMode() {
        return this._keyVerificationMode;
    }

    /**
     * @param {TokenKeyValidation} keyVerificationMode
     * @returns {this}
     */
    setKeyVerificationMode(keyVerificationMode) {
        this._requireNotFrozen();
        this._keyVerificationMode = keyVerificationMode;

        return this;
    }

    /**
     * @returns {this}
     */
    clearTokenMemo() {
        this._requireNotFrozen();
        this._tokenMemo = null;

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._tokenId != null) {
            this._tokenId.validateChecksum(client);
        }

        if (this._treasuryAccountId != null) {
            this._treasuryAccountId.validateChecksum(client);
        }

        if (this._autoRenewAccountId != null) {
            this._autoRenewAccountId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.token.updateToken(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenUpdate";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ITokenUpdateTransactionBody}
     */
    _makeTransactionData() {
        return {
            token: this._tokenId != null ? this._tokenId._toProtobuf() : null,
            name: this.tokenName != null ? this.tokenName : null,
            symbol: this.tokenSymbol,
            treasury:
                this._treasuryAccountId != null
                    ? this._treasuryAccountId._toProtobuf()
                    : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            kycKey: this._kycKey != null ? this._kycKey._toProtobufKey() : null,
            freezeKey:
                this._freezeKey != null
                    ? this._freezeKey._toProtobufKey()
                    : null,
            pauseKey:
                this._pauseKey != null ? this._pauseKey._toProtobufKey() : null,
            wipeKey:
                this._wipeKey != null ? this._wipeKey._toProtobufKey() : null,
            supplyKey:
                this._supplyKey != null
                    ? this._supplyKey._toProtobufKey()
                    : null,
            autoRenewAccount:
                this._autoRenewAccountId != null
                    ? this._autoRenewAccountId._toProtobuf()
                    : null,
            expiry:
                this._expirationTime != null
                    ? this._expirationTime._toProtobuf()
                    : null,
            autoRenewPeriod:
                this._autoRenewPeriod != null
                    ? this._autoRenewPeriod._toProtobuf()
                    : null,
            memo:
                this._tokenMemo != null
                    ? {
                          value: this._tokenMemo,
                      }
                    : null,
            feeScheduleKey:
                this._feeScheduleKey != null
                    ? this._feeScheduleKey._toProtobufKey()
                    : null,
            metadataKey:
                this._metadataKey != null
                    ? this._metadataKey._toProtobufKey()
                    : null,
            metadata:
                this._metadata != null
                    ? {
                          value: this._metadata,
                      }
                    : null,
            keyVerificationMode:
                this._keyVerificationMode != null
                    ? this._keyVerificationMode._code
                    : undefined,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenUpdate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenUpdateTransaction._fromProtobuf,
);
