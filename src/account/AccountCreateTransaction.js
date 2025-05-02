// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as HieroProto from "@hashgraph/proto";
import Hbar from "../Hbar.js";
import AccountId from "./AccountId.js";
import Transaction, {
    DEFAULT_AUTO_RENEW_PERIOD,
    DEFAULT_RECORD_THRESHOLD,
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Duration from "../Duration.js";
import Long from "long";
import Key from "../Key.js";
import PrivateKey from "../PrivateKey.js";
import EvmAddress from "../EvmAddress.js";
import PublicKey from "../PublicKey.js";
/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Create a new Hedera™ crypto-currency account.
 */
export default class AccountCreateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Key} [props.key]
     * @param {number | string | Long | BigNumber | Hbar} [props.initialBalance]
     * @param {boolean} [props.receiverSignatureRequired]
     * @param {AccountId} [props.proxyAccountId]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {string} [props.accountMemo]
     * @param {Long | number} [props.maxAutomaticTokenAssociations]
     * @param {AccountId | string} [props.stakedAccountId]
     * @param {Long | number} [props.stakedNodeId]
     * @param {boolean} [props.declineStakingReward]
     * @param {EvmAddress} [props.alias]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Key}
         */
        this._key = null;

        /**
         * @private
         * @type {?Hbar}
         */
        this._initialBalance = null;

        /**
         * @private
         * @type {Hbar}
         */
        this._sendRecordThreshold = DEFAULT_RECORD_THRESHOLD;

        /**
         * @private
         * @type {Hbar}
         */
        this._receiveRecordThreshold = DEFAULT_RECORD_THRESHOLD;

        /**
         * @private
         * @type {boolean}
         */
        this._receiverSignatureRequired = false;

        /**
         * @private
         * @type {?AccountId}
         */
        this._proxyAccountId = null;

        /**
         * @private
         * @type {Duration}
         */
        this._autoRenewPeriod = new Duration(DEFAULT_AUTO_RENEW_PERIOD);

        /**
         * @private
         * @type {?string}
         */
        this._accountMemo = null;

        /**
         * @private
         * @type {?Long}
         */
        this._maxAutomaticTokenAssociations = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._stakedAccountId = null;

        /**
         * @private
         * @type {?Long}
         */
        this._stakedNodeId = null;

        /**
         * @private
         * @type {boolean}
         */
        this._declineStakingReward = false;

        /**
         * @private
         * @type {?EvmAddress}
         */
        this._alias = null;

        if (props.key != null) {
            this.setKeyWithoutAlias(props.key);
        }

        if (props.receiverSignatureRequired != null) {
            this.setReceiverSignatureRequired(props.receiverSignatureRequired);
        }

        if (props.initialBalance != null) {
            this.setInitialBalance(props.initialBalance);
        }

        if (props.proxyAccountId != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setProxyAccountId(props.proxyAccountId);
        }

        if (props.autoRenewPeriod != null) {
            this.setAutoRenewPeriod(props.autoRenewPeriod);
        }

        if (props.accountMemo != null) {
            this.setAccountMemo(props.accountMemo);
        }

        if (props.maxAutomaticTokenAssociations != null) {
            this.setMaxAutomaticTokenAssociations(
                props.maxAutomaticTokenAssociations,
            );
        }

        if (props.stakedAccountId != null) {
            this.setStakedAccountId(props.stakedAccountId);
        }

        if (props.stakedNodeId != null) {
            this.setStakedNodeId(props.stakedNodeId);
        }

        if (props.declineStakingReward != null) {
            this.setDeclineStakingReward(props.declineStakingReward);
        }

        if (props.alias != null) {
            this.setAlias(props.alias);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {AccountCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const create =
            /** @type {HieroProto.proto.ICryptoCreateTransactionBody} */ (
                body.cryptoCreateAccount
            );

        let alias = undefined;
        if (create.alias != null && create.alias.length > 0) {
            if (create.alias.length === 20) {
                alias = EvmAddress.fromBytes(create.alias);
            }
        }

        return Transaction._fromProtobufTransactions(
            new AccountCreateTransaction({
                key:
                    create.key != null
                        ? Key._fromProtobufKey(create.key)
                        : undefined,
                initialBalance:
                    create.initialBalance != null
                        ? Hbar.fromTinybars(create.initialBalance)
                        : undefined,
                receiverSignatureRequired:
                    create.receiverSigRequired != null
                        ? create.receiverSigRequired
                        : undefined,
                proxyAccountId:
                    create.proxyAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {HieroProto.proto.IAccountID} */ (
                                  create.proxyAccountID
                              ),
                          )
                        : undefined,
                autoRenewPeriod:
                    create.autoRenewPeriod != null
                        ? create.autoRenewPeriod.seconds != null
                            ? create.autoRenewPeriod.seconds
                            : undefined
                        : undefined,
                accountMemo: create.memo != null ? create.memo : undefined,
                maxAutomaticTokenAssociations:
                    create.maxAutomaticTokenAssociations != null
                        ? create.maxAutomaticTokenAssociations
                        : undefined,
                stakedAccountId:
                    create.stakedAccountId != null
                        ? AccountId._fromProtobuf(create.stakedAccountId)
                        : undefined,
                stakedNodeId:
                    create.stakedNodeId != null
                        ? create.stakedNodeId
                        : undefined,
                declineStakingReward: create.declineReward == true,
                alias,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {?Key}
     */
    get key() {
        return this._key;
    }

    /**
     * Set the key for this account.
     *
     * This is the key that must sign each transfer out of the account.
     *
     * If `receiverSignatureRequired` is true, then the key must also sign
     * any transfer into the account.
     *
     * @deprecated Use `setKeyWithoutAlias` instead.
     * @param {Key} key
     * @returns {this}
     */
    setKey(key) {
        this._requireNotFrozen();
        this._key = key;

        return this;
    }

    /**
     * Sets an ECDSA key (private or public) and a derived alias from this key in the background.
     * @param {Key} key - An ECDSA key (private or public) used for signing transactions and alias derivation.
     * @returns {this}
     * @throws {Error} If the key is not an ECDSA key.
     */
    setECDSAKeyWithAlias(key) {
        this.setKeyWithoutAlias(key);

        const alias = this._deriveECDSAKeyAlias(key);

        this.setAlias(alias);
        return this;
    }

    /**
     * Sets an account key and an alias derived from a separate ECDSA key.
     * The transaction must be signed by both keys.
     * @param {Key} key - The primary account key used for signing transactions.
     * @param {Key} aliasKey - The ECDSA key (private or public) used to derive the EVM address.
     * @returns {this}
     * @throws {Error} If the aliasKey is not an ECDSA key.
     */
    setKeyWithAlias(key, aliasKey) {
        this.setKeyWithoutAlias(key);

        const alias = this._deriveECDSAKeyAlias(aliasKey);

        this.setAlias(alias);
        return this;
    }

    /**
     * Set the key for this account without an alias.
     *
     * This is the key that must sign each transfer out of the account.
     *
     * If `receiverSignatureRequired` is true, then the key must also sign
     * any transfer into the account.
     *
     *
     * @param {Key} key
     * @returns {this}
     */
    setKeyWithoutAlias(key) {
        this._requireNotFrozen();
        this._key = key;

        return this;
    }

    /**
     * @returns {?Hbar}
     */
    get initialBalance() {
        return this._initialBalance;
    }

    /**
     * Set the initial amount to transfer into this account.
     *
     * @param {number | string | Long | BigNumber | Hbar} initialBalance
     * @returns {this}
     */
    setInitialBalance(initialBalance) {
        this._requireNotFrozen();
        this._initialBalance =
            initialBalance instanceof Hbar
                ? initialBalance
                : new Hbar(initialBalance);

        return this;
    }

    /**
     * @returns {boolean}
     */
    get receiverSignatureRequired() {
        return this._receiverSignatureRequired;
    }

    /**
     * Set to true to require the key for this account to sign any transfer of
     * hbars to this account.
     *
     * @param {boolean} receiverSignatureRequired
     * @returns {this}
     */
    setReceiverSignatureRequired(receiverSignatureRequired) {
        this._requireNotFrozen();
        this._receiverSignatureRequired = receiverSignatureRequired;

        return this;
    }

    /**
     * @deprecated
     * @returns {?AccountId}
     */
    get proxyAccountId() {
        return this._proxyAccountId;
    }

    /**
     * @deprecated
     *
     * Set the ID of the account to which this account is proxy staked.
     * @param {AccountId} proxyAccountId
     * @returns {this}
     */
    setProxyAccountId(proxyAccountId) {
        this._requireNotFrozen();
        this._proxyAccountId = proxyAccountId;

        return this;
    }

    /**
     * @returns {Duration}
     */
    get autoRenewPeriod() {
        return this._autoRenewPeriod;
    }

    /**
     * Set the auto renew period for this account.
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
    get accountMemo() {
        return this._accountMemo;
    }

    /**
     * @param {string} memo
     * @returns {this}
     */
    setAccountMemo(memo) {
        this._requireNotFrozen();
        this._accountMemo = memo;

        return this;
    }

    /**
     * @returns {?Long}
     */
    get maxAutomaticTokenAssociations() {
        return this._maxAutomaticTokenAssociations;
    }

    /**
     * @param {Long | number} maxAutomaticTokenAssociations
     * @returns {this}
     */
    setMaxAutomaticTokenAssociations(maxAutomaticTokenAssociations) {
        this._requireNotFrozen();
        this._maxAutomaticTokenAssociations =
            typeof maxAutomaticTokenAssociations === "number"
                ? Long.fromNumber(maxAutomaticTokenAssociations)
                : maxAutomaticTokenAssociations;

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get stakedAccountId() {
        return this._stakedAccountId;
    }

    /**
     * @param {AccountId | string} stakedAccountId
     * @returns {this}
     */
    setStakedAccountId(stakedAccountId) {
        this._requireNotFrozen();
        this._stakedAccountId =
            typeof stakedAccountId === "string"
                ? AccountId.fromString(stakedAccountId)
                : stakedAccountId;

        return this;
    }

    /**
     * @returns {?Long}
     */
    get stakedNodeId() {
        return this._stakedNodeId;
    }

    /**
     * @param {Long | number} stakedNodeId
     * @returns {this}
     */
    setStakedNodeId(stakedNodeId) {
        this._requireNotFrozen();
        this._stakedNodeId = Long.fromValue(stakedNodeId);

        return this;
    }

    /**
     * @returns {boolean}
     */
    get declineStakingRewards() {
        return this._declineStakingReward;
    }

    /**
     * @param {boolean} declineStakingReward
     * @returns {this}
     */
    setDeclineStakingReward(declineStakingReward) {
        this._requireNotFrozen();
        this._declineStakingReward = declineStakingReward;

        return this;
    }

    /**
     * The bytes to be used as the account's alias.
     *
     * The bytes must be formatted as the calcluated last 20 bytes of the
     * keccak-256 of the ECDSA primitive key.
     *
     * All other types of keys, including but not limited to ED25519, ThresholdKey, KeyList, ContractID, and
     * delegatable_contract_id, are not supported.
     *
     * At most only one account can ever have a given alias on the network.
     *
     * @returns {?EvmAddress}
     */
    get alias() {
        return this._alias;
    }

    /**
     * The bytes to be used as the account's alias.
     *
     * The bytes must be formatted as the calcluated last 20 bytes of the
     * keccak-256 of the ECDSA primitive key.
     *
     * All other types of keys, including but not limited to ED25519, ThresholdKey, KeyList, ContractID, and
     * delegatable_contract_id, are not supported.
     *
     * At most only one account can ever have a given alias on the network.
     *
     * @param {string | EvmAddress} alias
     * @returns {this}
     */
    setAlias(alias) {
        if (typeof alias === "string") {
            if (
                (alias.startsWith("0x") && alias.length == 42) ||
                alias.length == 40
            ) {
                this._alias = EvmAddress.fromString(alias);
            } else {
                throw new Error(
                    'evmAddress must be a valid EVM address with or without "0x" prefix',
                );
            }
        } else {
            this._alias = alias;
        }

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._proxyAccountId != null) {
            this._proxyAccountId.validateChecksum(client);
        }
    }

    /**
     * Derives an EVM alias from an ECDSA key.
     * @private
     * @internal
     * @param {Key} key
     * @returns {string}
     * @throws {Error} If the key is not a ECDSA (secp256k1) PrivateKey or PublicKey.
     */
    _deriveECDSAKeyAlias(key) {
        const isPrivateECDSAKey =
            key instanceof PrivateKey && key.type === "secp256k1";
        const isPublicECDSAKey =
            key instanceof PublicKey && key.type === "secp256k1";

        if (isPrivateECDSAKey) {
            return key.publicKey.toEvmAddress();
        } else if (isPublicECDSAKey) {
            return key.toEvmAddress();
        }

        throw new Error(
            "Invalid key for alias derivation provided: expected an ECDSA (secp256k1) PrivateKey or PublicKey.",
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
        return channel.crypto.createAccount(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoCreateAccount";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ICryptoCreateTransactionBody}
     */
    _makeTransactionData() {
        let alias = null;
        if (this._alias != null) {
            alias = this._alias.toBytes();
        }

        return {
            key: this._key != null ? this._key._toProtobufKey() : null,
            initialBalance:
                this._initialBalance != null
                    ? this._initialBalance.toTinybars()
                    : null,
            autoRenewPeriod: this._autoRenewPeriod._toProtobuf(),
            proxyAccountID:
                this._proxyAccountId != null
                    ? this._proxyAccountId._toProtobuf()
                    : null,
            receiveRecordThreshold: this._receiveRecordThreshold.toTinybars(),
            sendRecordThreshold: this._sendRecordThreshold.toTinybars(),
            receiverSigRequired: this._receiverSignatureRequired,
            memo: this._accountMemo,
            maxAutomaticTokenAssociations:
                this._maxAutomaticTokenAssociations != null
                    ? this._maxAutomaticTokenAssociations.toInt()
                    : null,
            stakedAccountId:
                this.stakedAccountId != null
                    ? this.stakedAccountId._toProtobuf()
                    : null,
            stakedNodeId: this.stakedNodeId,
            declineReward: this.declineStakingRewards,
            alias,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `AccountCreateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoCreateAccount",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountCreateTransaction._fromProtobuf,
);
