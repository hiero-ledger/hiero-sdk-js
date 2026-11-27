// SPDX-License-Identifier: Apache-2.0

import Transaction from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import ContractId from "../contract/ContractId.js";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";
import Hbar from "../Hbar.js";
import HbarUnit from "../HbarUnit.js";
import { arrayEqual, copyBytes32 } from "../util.js";
import { copyContractId, copyKey } from "./copy.js";
import { computeReusableConnectorId, encodePublicKey } from "./ownership.js";

/**
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} ITransactionResponse
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprCreateConnectorTransactionBody} IClprCreateConnectorTransactionBody
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Creates a CLPR Connector on an existing Channel in one transaction.
 * Sign the frozen transaction with the identity key in addition to the payer.
 */
export default class ClprCreateConnectorTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {Uint8Array} [props.connectorId]
     * @param {PublicKey} [props.identityKey]
     * @param {Uint8Array} [props.salt]
     * @param {ContractId | string} [props.connectorContract]
     * @param {Key} [props.adminKey]
     * @param {Hbar} [props.lockedStake]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._channelId = null;
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._connectorId = null;
        /**
         * @private
         * @type {?PublicKey}
         */
        this._identityKey = null;
        /**
         * @private
         * @type {?Uint8Array}
         */
        this._salt = null;
        /**
         * @private
         * @type {?ContractId}
         */
        this._connectorContract = null;
        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = null;
        /**
         * @private
         * @type {Hbar}
         */
        this._lockedStake = Hbar.fromTinybars(0);

        if (props?.channelId != null) this.setChannelId(props.channelId);
        if (props?.connectorId != null) this.setConnectorId(props.connectorId);
        if (props?.identityKey != null) this.setIdentityKey(props.identityKey);
        if (props?.salt != null) this.setSalt(props.salt);
        if (props?.connectorContract != null)
            this.setConnectorContract(props.connectorContract);
        if (props?.adminKey != null) this.setAdminKey(props.adminKey);
        if (props?.lockedStake != null) this.setLockedStake(props.lockedStake);
    }

    /**
     * Derives the reusable Connector ID from the identity key and 32-byte salt.
     * @param {PublicKey} identityKey
     * @param {Uint8Array} salt
     * @returns {Uint8Array}
     */
    static computeConnectorId(identityKey, salt) {
        return computeReusableConnectorId(identityKey, salt);
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprCreateConnectorTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const data = bodies[0].clprCreateConnector;
        const identityKey =
            data?.identityKey == null
                ? undefined
                : Key._fromProtobufKey(data.identityKey);
        if (identityKey != null && !(identityKey instanceof PublicKey)) {
            throw new Error(
                "identityKey must be an Ed25519 or ECDSA public key",
            );
        }
        const transaction = new ClprCreateConnectorTransaction({
            channelId: data?.channelId?.length ? data.channelId : undefined,
            connectorId: data?.connectorId?.length
                ? data.connectorId
                : undefined,
            identityKey,
            salt: data?.salt?.length ? data.salt : undefined,
            connectorContract:
                data?.connectorContract == null
                    ? undefined
                    : ContractId._fromProtobuf(data.connectorContract),
            adminKey:
                data?.adminKey == null
                    ? undefined
                    : Key._fromProtobufKey(data.adminKey),
        });
        // Preserve the wire range on decode. The builder accepts signed-range Hbar.
        if (data?.lockedStake != null) {
            transaction._lockedStake = Hbar.fromTinybars(
                data.lockedStake.toString(),
            );
        }
        return Transaction._fromProtobufTransactions(
            transaction,
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @param {Uint8Array} channelId
     * @returns {this}
     */
    setChannelId(channelId) {
        this._requireNotFrozen();
        this._channelId = copyBytes32(channelId, "channelId");
        return this;
    }

    /** @returns {?Uint8Array} */
    get channelId() {
        return this._channelId == null ? null : new Uint8Array(this._channelId);
    }

    /**
     * @param {Uint8Array} connectorId
     * @returns {this}
     */
    setConnectorId(connectorId) {
        this._requireNotFrozen();
        this._connectorId = copyBytes32(connectorId, "connectorId");
        return this;
    }

    /** @returns {?Uint8Array} */
    get connectorId() {
        return this._connectorId == null
            ? null
            : new Uint8Array(this._connectorId);
    }

    /**
     * @param {PublicKey} identityKey
     * @returns {this}
     */
    setIdentityKey(identityKey) {
        this._requireNotFrozen();
        encodePublicKey(identityKey);
        this._identityKey = PublicKey.fromBytes(identityKey.toBytesDer());
        return this;
    }

    /** @returns {?PublicKey} */
    get identityKey() {
        return this._identityKey == null
            ? null
            : PublicKey.fromBytes(this._identityKey.toBytesDer());
    }

    /**
     * @param {Uint8Array} salt
     * @returns {this}
     */
    setSalt(salt) {
        this._requireNotFrozen();
        this._salt = copyBytes32(salt, "salt");
        return this;
    }

    /** @returns {?Uint8Array} */
    get salt() {
        return this._salt == null ? null : new Uint8Array(this._salt);
    }

    /**
     * @param {ContractId | string} connectorContract
     * @returns {this}
     */
    setConnectorContract(connectorContract) {
        this._requireNotFrozen();
        this._connectorContract = copyContractId(
            typeof connectorContract === "string"
                ? ContractId.fromString(connectorContract)
                : connectorContract,
        );
        return this;
    }

    /** @returns {?ContractId} */
    get connectorContract() {
        return this._connectorContract == null
            ? null
            : copyContractId(this._connectorContract);
    }

    /**
     * @param {Key} adminKey
     * @returns {this}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();
        this._adminKey = copyKey(adminKey);
        return this;
    }

    /** @returns {?Key} */
    get adminKey() {
        return this._adminKey == null ? null : copyKey(this._adminKey);
    }

    /**
     * @param {Hbar} lockedStake
     * @returns {this}
     */
    setLockedStake(lockedStake) {
        this._requireNotFrozen();
        const tinybars = lockedStake.to(HbarUnit.Tinybar);
        if (
            !tinybars.isInteger() ||
            tinybars.isNegative() ||
            tinybars.isGreaterThan("9223372036854775807")
        ) {
            throw new Error(
                "lockedStake must be an integer in 0..2^63-1 tinybars",
            );
        }
        this._lockedStake = Hbar.fromTinybars(tinybars);
        return this;
    }

    /** @returns {Hbar} */
    get lockedStake() {
        return Hbar.fromTinybars(this._lockedStake.to(HbarUnit.Tinybar));
    }

    /** @override */
    _getName() {
        return "ClprCreateConnectorTransaction";
    }

    /** @override */
    _getRequiredFields() {
        const { _connectorId, _identityKey, _salt } = this;
        if (
            _connectorId != null &&
            _identityKey != null &&
            _salt != null &&
            !arrayEqual(
                _connectorId,
                computeReusableConnectorId(_identityKey, _salt),
            )
        ) {
            throw new Error(
                "connectorId does not match the identity key and salt",
            );
        }
        return {
            channelId: this._channelId,
            connectorId: _connectorId,
            identityKey: _identityKey,
            salt: _salt,
            adminKey: this._adminKey,
            connectorContract: this._connectorContract,
        };
    }

    /** @override */
    _isSchedulable() {
        return false;
    }

    /**
     * @override
     * @param {import("../channel/Channel.js").default} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.clpr.createConnector(request);
    }

    /**
     * @override
     * @returns {"clprCreateConnector"}
     */
    _getTransactionDataCase() {
        return "clprCreateConnector";
    }

    /**
     * @override
     * @returns {IClprCreateConnectorTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this.channelId,
            connectorId: this.connectorId,
            identityKey: this.identityKey?._toProtobufKey(),
            salt: this.salt,
            connectorContract: this.connectorContract?._toProtobuf(),
            adminKey: this.adminKey?._toProtobufKey(),
            lockedStake: this._lockedStake.toTinybars().toUnsigned(),
        };
    }
}
