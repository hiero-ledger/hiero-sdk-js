import Hbar from "../Hbar.js";
import Transaction, {
    DEFAULT_AUTO_RENEW_PERIOD,
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import Long from "long";
import AccountId from "../account/AccountId.js";
import Timestamp from "../Timestamp.js";
import Duration from "../Duration.js";
import CustomFixedFee from "./CustomFixedFee.js";
import CustomFractionalFee from "./CustomFractionalFee.js";
import CustomRoyaltyFee from "./CustomRoyaltyFee.js";
import TokenType from "./TokenType.js";
import TokenSupplyType from "./TokenSupplyType.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ITokenCreateTransactionBody} proto.ITokenCreateTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITokenID} proto.ITokenID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("./CustomFee.js").default} CustomFee
 */

/**
 * Create a new Hedera™ crypto-currency token.
 */
export default class TokenCreateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {string} [props.tokenName]
     * @param {string} [props.tokenSymbol]
     * @param {Long | number} [props.decimals]
     * @param {Long | number} [props.initialSupply]
     * @param {AccountId | string} [props.treasuryAccountId]
     * @param {Key} [props.adminKey]
     * @param {Key} [props.kycKey]
     * @param {Key} [props.freezeKey]
     * @param {Key} [props.pauseKey]
     * @param {Key} [props.wipeKey]
     * @param {Key} [props.supplyKey]
     * @param {Key} [props.feeScheduleKey]
     * @param {boolean} [props.freezeDefault]
     * @param {AccountId | string} [props.autoRenewAccountId]
     * @param {Timestamp | Date} [props.expirationTime]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {string} [props.tokenMemo]
     * @param {CustomFee[]} [props.customFees]
     * @param {TokenType} [props.tokenType]
     * @param {TokenSupplyType} [props.supplyType]
     * @param {Long | number} [props.maxSupply]
     */
    constructor(props = {}) {
        super();

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
         * @type {?Long}
         */
        this._decimals = null;

        /**
         * @private
         * @type {?Long}
         */
        this._initialSupply = null;

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
        this._pauseKey = null;

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
         * @type {?Key}
         */
        this._feeScheduleKey = null;

        /**
         * @private
         * @type {?boolean}
         */
        this._freezeDefault = null;

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
        this._autoRenewPeriod = new Duration(DEFAULT_AUTO_RENEW_PERIOD);

        /**
         * @private
         * @type {?string}
         */
        this._tokenMemo = null;

        /**
         * @private
         * @type {CustomFee[]}
         */
        this._customFees = [];

        /**
         * @private
         * @type {?TokenType}
         */
        this._tokenType = null;

        /**
         * @private
         * @type {?TokenSupplyType}
         */
        this._supplyType = null;

        /**
         * @private
         * @type {?Long}
         */
        this._maxSupply = null;

        this.setMaxTransactionFee(new Hbar(30));

        if (props.tokenName != null) {
            this.setTokenName(props.tokenName);
        }

        if (props.tokenSymbol != null) {
            this.setTokenSymbol(props.tokenSymbol);
        }

        if (props.decimals != null) {
            this.setDecimals(props.decimals);
        }

        if (props.initialSupply != null) {
            this.setInitialSupply(props.initialSupply);
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

        if (props.pauseKey != null) {
            this.setPauseKey(props.pauseKey);
        }

        if (props.wipeKey != null) {
            this.setWipeKey(props.wipeKey);
        }

        if (props.supplyKey != null) {
            this.setSupplyKey(props.supplyKey);
        }

        if (props.feeScheduleKey != null) {
            this.setFeeScheduleKey(props.feeScheduleKey);
        }

        if (props.freezeDefault != null) {
            this.setFreezeDefault(props.freezeDefault);
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

        if (props.customFees != null) {
            this.setCustomFees(props.customFees);
        }

        if (props.tokenType != null) {
            this.setTokenType(props.tokenType);
        }

        if (props.supplyType != null) {
            this.setSupplyType(props.supplyType);
        }

        if (props.maxSupply != null) {
            this.setMaxSupply(props.maxSupply);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {TokenCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const create = /** @type {proto.ITokenCreateTransactionBody} */ (
            body.tokenCreation
        );

        return Transaction._fromProtobufTransactions(
            new TokenCreateTransaction({
                tokenName: create.name != null ? create.name : undefined,
                tokenSymbol: create.symbol != null ? create.symbol : undefined,
                decimals: create.decimals != null ? create.decimals : undefined,
                initialSupply:
                    create.initialSupply != null
                        ? create.initialSupply
                        : undefined,
                treasuryAccountId:
                    create.treasury != null
                        ? AccountId._fromProtobuf(create.treasury)
                        : undefined,
                adminKey:
                    create.adminKey != null
                        ? keyFromProtobuf(create.adminKey)
                        : undefined,
                kycKey:
                    create.kycKey != null
                        ? keyFromProtobuf(create.kycKey)
                        : undefined,
                freezeKey:
                    create.freezeKey != null
                        ? keyFromProtobuf(create.freezeKey)
                        : undefined,
                pauseKey:
                    create.pauseKey != null
                        ? keyFromProtobuf(create.pauseKey)
                        : undefined,
                wipeKey:
                    create.wipeKey != null
                        ? keyFromProtobuf(create.wipeKey)
                        : undefined,
                supplyKey:
                    create.supplyKey != null
                        ? keyFromProtobuf(create.supplyKey)
                        : undefined,
                feeScheduleKey:
                    create.feeScheduleKey != null
                        ? keyFromProtobuf(create.feeScheduleKey)
                        : undefined,
                freezeDefault:
                    create.freezeDefault != null
                        ? create.freezeDefault
                        : undefined,
                autoRenewAccountId:
                    create.autoRenewAccount != null
                        ? AccountId._fromProtobuf(create.autoRenewAccount)
                        : undefined,
                expirationTime:
                    create.expiry != null
                        ? Timestamp._fromProtobuf(create.expiry)
                        : undefined,
                autoRenewPeriod:
                    create.autoRenewPeriod != null
                        ? Duration._fromProtobuf(create.autoRenewPeriod)
                        : undefined,
                tokenMemo: create.memo != null ? create.memo : undefined,
                customFees:
                    create.customFees != null
                        ? create.customFees.map((fee) => {
                              if (fee.fixedFee != null) {
                                  return CustomFixedFee._fromProtobuf(fee);
                              } else if (fee.fractionalFee != null) {
                                  return CustomFractionalFee._fromProtobuf(fee);
                              } else {
                                  return CustomRoyaltyFee._fromProtobuf(fee);
                              }
                          })
                        : undefined,
                tokenType:
                    create.tokenType != null
                        ? TokenType._fromCode(create.tokenType)
                        : undefined,
                supplyType:
                    create.supplyType != null
                        ? TokenSupplyType._fromCode(create.supplyType)
                        : undefined,
                maxSupply:
                    create.maxSupply != null ? create.maxSupply : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
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
     * @returns {?Long}
     */
    get decimals() {
        return this._decimals;
    }

    /**
     * @param {Long | number} decimals
     * @returns {this}
     */
    setDecimals(decimals) {
        this._requireNotFrozen();
        this._decimals =
            decimals instanceof Long ? decimals : Long.fromValue(decimals);

        return this;
    }

    /**
     * @returns {?Long}
     */
    get initialSupply() {
        return this._initialSupply;
    }

    /**
     * @param {Long | number} initialSupply
     * @returns {this}
     */
    setInitialSupply(initialSupply) {
        this._requireNotFrozen();
        this._initialSupply = Long.fromValue(initialSupply);

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
    get pauseKey() {
        return this._pauseKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setPauseKey(key) {
        this._requireNotFrozen();
        this._pauseKey = key;

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
     * @returns {?Key}
     */
    get feeScheduleKey() {
        return this._feeScheduleKey;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setFeeScheduleKey(key) {
        this._requireNotFrozen();
        this._feeScheduleKey = key;

        return this;
    }

    /**
     * @returns {?boolean}
     */
    get freezeDefault() {
        return this._freezeDefault;
    }

    /**
     * @param {boolean} freeze
     * @returns {this}
     */
    setFreezeDefault(freeze) {
        this._requireNotFrozen();
        this._freezeDefault = freeze;

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
        this._autoRenewPeriod = null;
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
     * @param {string} memo
     * @returns {this}
     */
    setTokenMemo(memo) {
        this._requireNotFrozen();
        this._tokenMemo = memo;

        return this;
    }

    /**
     * @returns {CustomFee[]}
     */
    get customFees() {
        return this._customFees;
    }

    /**
     * @param {CustomFee[]} customFees
     * @returns {this}
     */
    setCustomFees(customFees) {
        this._customFees = customFees;
        return this;
    }

    /**
     * @returns {?TokenType}
     */
    get tokenType() {
        return this._tokenType;
    }

    /**
     * @param {TokenType} tokenType
     * @returns {this}
     */
    setTokenType(tokenType) {
        this._tokenType = tokenType;
        return this;
    }

    /**
     * @returns {?TokenSupplyType}
     */
    get supplyType() {
        return this._supplyType;
    }

    /**
     * @param {TokenSupplyType} supplyType
     * @returns {this}
     */
    setSupplyType(supplyType) {
        this._supplyType = supplyType;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get maxSupply() {
        return this._maxSupply;
    }

    /**
     * @param {Long | number} maxSupply
     * @returns {this}
     */
    setMaxSupply(maxSupply) {
        this._maxSupply =
            typeof maxSupply === "number"
                ? Long.fromNumber(maxSupply)
                : maxSupply;
        return this;
    }

    /**
     * @param {?import("../client/Client.js").default<Channel, *>} client
     * @returns {this}
     */
    freezeWith(client) {
        if (
            this._autoRenewPeriod != null &&
            client != null &&
            client.operatorAccountId
        ) {
            this._autoRenewAccountId = client.operatorAccountId;
        }

        return super.freezeWith(client);
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
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
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.token.createToken(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenCreation";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ITokenCreateTransactionBody}
     */
    _makeTransactionData() {
        return {
            name: this._tokenName,
            symbol: this._tokenSymbol,
            decimals: this._decimals != null ? this._decimals.toInt() : null,
            initialSupply: this._initialSupply,
            treasury:
                this._treasuryAccountId != null
                    ? this._treasuryAccountId._toProtobuf()
                    : null,
            adminKey:
                this._adminKey != null ? keyToProtobuf(this._adminKey) : null,
            kycKey: this._kycKey != null ? keyToProtobuf(this._kycKey) : null,
            freezeKey:
                this._freezeKey != null ? keyToProtobuf(this._freezeKey) : null,
            pauseKey:
                this._pauseKey != null ? keyToProtobuf(this._pauseKey) : null,
            wipeKey:
                this._wipeKey != null ? keyToProtobuf(this._wipeKey) : null,
            supplyKey:
                this._supplyKey != null ? keyToProtobuf(this._supplyKey) : null,
            feeScheduleKey:
                this._feeScheduleKey != null
                    ? keyToProtobuf(this._feeScheduleKey)
                    : null,
            freezeDefault: this._freezeDefault,
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
            memo: this._tokenMemo,
            customFees: this.customFees.map((fee) => fee._toProtobuf()),
            tokenType: this._tokenType != null ? this._tokenType._code : null,
            supplyType:
                this._supplyType != null ? this._supplyType._code : null,
            maxSupply: this.maxSupply,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "tokenCreation",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenCreateTransaction._fromProtobuf
);
