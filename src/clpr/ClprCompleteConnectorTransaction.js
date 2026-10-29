// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ClprTransaction from "./ClprTransaction.js";
import ContractId from "../contract/ContractId.js";
import Key from "../Key.js";
import Hbar from "../Hbar.js";
import HbarUnit from "../HbarUnit.js";
import { arrayEqual, copyBytes32 } from "../util.js";
import OwnershipProofState from "./OwnershipProofState.js";
import { CLPR_SERVICE_ADDRESS, computeConnectorId } from "./ownership.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.TransactionBody} TransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} ITransactionResponse
 */

/**
 * @namespace com.hedera.hapi.node.clpr
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.IClprCompleteConnectorTransactionBody} IClprCompleteConnectorTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../PrivateKey.js").default} PrivateKey
 * @typedef {import("./ClprSignatureScheme.js").default} ClprSignatureScheme
 */

/**
 * Completes a CLPR Connector registration by revealing its ownership proof.
 *
 * First register the commitment with ClprRegisterConnectorTransaction. The reveal
 * checks that connectorId matches the Channel ID, ownership public key and salt
 * before signing connectorId || the CLPR service address. The ownership private
 * key is used only during setOwnershipProof() and is never retained.
 * Changing channelId, connectorId or salt clears the proof; identical bytes keep it.
 *
 * The required admin key keeps deregistration possible and may be any SDK Key,
 * including a threshold key or key list. The payer funds the locked stake, which
 * defaults to zero and must be an integer in 0..2^63-1 tinybars. The network
 * enforces its configured minimum stake and contract requirements.
 * CLPR is off by default and requires the network setting `clpr.enabled`.
 * This transaction cannot be scheduled.
 */
export default class ClprCompleteConnectorTransaction extends ClprTransaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {Uint8Array} [props.connectorId]
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
        this._lockedStake = new Hbar(0);

        /**
         * @private
         * @type {OwnershipProofState}
         */
        this._ownershipProof = new OwnershipProofState();

        if (props?.channelId != null) {
            this.setChannelId(props.channelId);
        }
        if (props?.connectorId != null) {
            this.setConnectorId(props.connectorId);
        }
        if (props?.salt != null) {
            this.setSalt(props.salt);
        }
        if (props?.connectorContract != null) {
            this.setConnectorContract(props.connectorContract);
        }
        if (props?.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }
        if (props?.lockedStake != null) {
            this.setLockedStake(props.lockedStake);
        }
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {ClprCompleteConnectorTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const completion =
            /** @type {IClprCompleteConnectorTransactionBody} */ (
                bodies[0].clprCompleteConnector
            );
        const transaction = new ClprCompleteConnectorTransaction({
            channelId: completion.channelId?.length
                ? completion.channelId
                : undefined,
            connectorId: completion.connectorId?.length
                ? completion.connectorId
                : undefined,
            salt: completion.salt?.length ? completion.salt : undefined,
            connectorContract:
                completion.connectorContract != null
                    ? ContractId._fromProtobuf(completion.connectorContract)
                    : undefined,
            adminKey:
                completion.adminKey != null
                    ? Key._fromProtobufKey(completion.adminKey)
                    : undefined,
        });

        // Wire values retain the full uint64 range, independently of builder limits.
        if (completion.lockedStake != null) {
            transaction._lockedStake = Hbar.fromTinybars(
                completion.lockedStake,
            );
        }
        transaction._ownershipProof.restore(completion);

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
     * Sets and copies the 32-byte Channel ID. Only different bytes clear the proof.
     * @param {Uint8Array} channelId
     * @returns {this}
     */
    setChannelId(channelId) {
        this._requireNotFrozen();
        const bytes = copyBytes32(channelId, "channelId");
        this._ownershipProof.clearIfChanged(this._channelId, channelId);
        this._channelId = bytes;
        return this;
    }

    /**
     * Returns a copy of the Channel ID, or null when it has not been set.
     * @returns {?Uint8Array}
     */
    get channelId() {
        return this._channelId == null
            ? null
            : copyBytes32(this._channelId, "channelId");
    }

    /**
     * Sets and copies the 32-byte Connector ID. Only different bytes clear the proof.
     * @param {Uint8Array} connectorId
     * @returns {this}
     */
    setConnectorId(connectorId) {
        this._requireNotFrozen();
        const bytes = copyBytes32(connectorId, "connectorId");
        this._ownershipProof.clearIfChanged(this._connectorId, connectorId);
        this._connectorId = bytes;
        return this;
    }

    /**
     * Returns a copy of the Connector ID, or null when it has not been set.
     * @returns {?Uint8Array}
     */
    get connectorId() {
        return this._connectorId == null
            ? null
            : copyBytes32(this._connectorId, "connectorId");
    }

    /**
     * Sets and copies the 32-byte salt. Only different bytes clear the proof.
     * @param {Uint8Array} salt
     * @returns {this}
     */
    setSalt(salt) {
        this._requireNotFrozen();
        const bytes = copyBytes32(salt, "salt");
        this._ownershipProof.clearIfChanged(this._salt, salt);
        this._salt = bytes;
        return this;
    }

    /**
     * Returns a copy of the salt, or null when it has not been set.
     * @returns {?Uint8Array}
     */
    get salt() {
        return this._salt == null ? null : copyBytes32(this._salt, "salt");
    }

    /**
     * Checks the Connector ID, then signs its reveal using the shared signer.
     * Set channelId, connectorId and salt first. The private key is never stored.
     * @param {PrivateKey} privateKey
     * @returns {this}
     */
    setOwnershipProof(privateKey) {
        this._requireNotFrozen();
        this._requireFields(
            {
                channelId: this._channelId,
                connectorId: this._connectorId,
                salt: this._salt,
            },
            "calling setOwnershipProof()",
        );
        const channelId = /** @type {Uint8Array} */ (this._channelId);
        const connectorId = /** @type {Uint8Array} */ (this._connectorId);
        const salt = /** @type {Uint8Array} */ (this._salt);
        const expectedId = computeConnectorId(
            channelId,
            privateKey.publicKey,
            salt,
        );
        if (!arrayEqual(connectorId, expectedId)) {
            throw new Error(
                "ClprCompleteConnectorTransaction: 'connectorId' does not match channelId, ownership public key and salt.",
            );
        }
        this._ownershipProof.sign(
            privateKey,
            new Uint8Array([...connectorId, ...CLPR_SERVICE_ADDRESS]),
        );
        return this;
    }

    /**
     * Returns a copy of the canonical ownership public key, or null without a proof.
     * @returns {?Uint8Array}
     */
    get publicKey() {
        return this._ownershipProof.publicKey;
    }

    /**
     * Returns a copy of the ownership signature, or null without a proof.
     * @returns {?Uint8Array}
     */
    get signature() {
        return this._ownershipProof.signature;
    }

    /**
     * Returns the proof's scheme, including ECDSA code zero, or null without a proof.
     * @returns {?ClprSignatureScheme}
     */
    get signatureScheme() {
        return this._ownershipProof.signatureScheme;
    }

    /**
     * Sets the local Connector authorization contract and copies its ID.
     * @param {ContractId | string} connectorContract
     * @returns {this}
     */
    setConnectorContract(connectorContract) {
        this._requireNotFrozen();
        this._connectorContract =
            typeof connectorContract === "string"
                ? ContractId.fromString(connectorContract)
                : connectorContract.clone();
        return this;
    }

    /**
     * @returns {?ContractId}
     */
    get connectorContract() {
        return this._connectorContract?.clone() ?? null;
    }

    /**
     * Sets the administrative key required for future deregistration.
     * Supports every SDK Key, including threshold keys and key lists.
     * @param {Key} adminKey
     * @returns {this}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();
        this._adminKey = Key._fromProtobufKey(adminKey._toProtobufKey());
        return this;
    }

    /**
     * Returns a copy of the administrative key, or null when it has not been set.
     * @returns {?Key}
     */
    get adminKey() {
        return this._adminKey == null
            ? null
            : Key._fromProtobufKey(this._adminKey._toProtobufKey());
    }

    /**
     * Sets the payer-funded stake after validating its tinybar value with BigNumber.
     * The amount must be an integer in 0..2^63-1 tinybars, checked before conversion
     * to Long so overflow cannot wrap the value.
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
                "ClprCompleteConnectorTransaction: 'lockedStake' must be an integer in 0..2^63-1 tinybars.",
            );
        }
        this._lockedStake = Hbar.fromTinybars(tinybars);
        return this;
    }

    /**
     * Returns the locked stake, which defaults to zero Hbar.
     * @returns {Hbar}
     */
    get lockedStake() {
        return Hbar.fromTinybars(this._lockedStake.to(HbarUnit.Tinybar));
    }

    /**
     * @override
     * @protected
     * @returns {Record<string, unknown>}
     */
    _getRequiredFields() {
        return {
            channelId: this._channelId,
            connectorId: this._connectorId,
            salt: this._salt,
            adminKey: this._adminKey,
            ownershipProof: this._ownershipProof,
        };
    }
    /**
     * @override
     * @protected
     * @returns {boolean}
     */
    _isSchedulable() {
        return false;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.clpr.completeConnector(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "clprCompleteConnector";
    }

    /**
     * @override
     * @protected
     * @returns {IClprCompleteConnectorTransactionBody}
     */
    _makeTransactionData() {
        return {
            channelId: this.channelId,
            connectorId: this.connectorId,
            salt: this.salt,
            connectorContract: this._connectorContract?._toProtobuf(),
            adminKey: this._adminKey?._toProtobufKey(),
            lockedStake: this._lockedStake.toTinybars().toUnsigned(),
            ...this._ownershipProof._toProtobuf(),
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `ClprCompleteConnectorTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "clprCompleteConnector",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprCompleteConnectorTransaction._fromProtobuf,
);
