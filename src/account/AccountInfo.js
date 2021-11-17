import AccountId from "./AccountId.js";
import LiveHash from "./LiveHash.js";
import Hbar from "../Hbar.js";
import Timestamp from "../Timestamp.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import Long from "long";
import TokenRelationshipMap from "./TokenRelationshipMap.js";
import * as proto from "@exodus/hashgraph-proto";
import Duration from "../Duration.js";

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 */

/**
 * Current information about an account, including the balance.
 */
export default class AccountInfo {
    /**
     * @private
     * @param {object} props
     * @param {AccountId} props.accountId
     * @param {?string} props.contractAccountId
     * @param {boolean} props.isDeleted
     * @param {?AccountId} props.proxyAccountId
     * @param {Hbar} props.proxyReceived
     * @param {Key} props.key
     * @param {Hbar} props.balance
     * @param {Hbar} props.sendRecordThreshold
     * @param {Hbar} props.receiveRecordThreshold
     * @param {boolean} props.isReceiverSignatureRequired
     * @param {Timestamp} props.expirationTime
     * @param {Duration} props.autoRenewPeriod
     * @param {LiveHash[]} props.liveHashes
     * @param {TokenRelationshipMap} props.tokenRelationships
     * @param {string} props.accountMemo
     * @param {Long} props.ownedNfts
     * @param {Long} props.maxAutomaticTokenAssociations
     */
    constructor(props) {
        /**
         * The account ID for which this information applies.
         *
         * @readonly
         */
        this.accountId = props.accountId;

        /**
         * The Contract Account ID comprising of both the contract instance and the cryptocurrency
         * account owned by the contract instance, in the format used by Solidity.
         *
         * @readonly
         */
        this.contractAccountId = props.contractAccountId;

        /**
         * If true, then this account has been deleted, it will disappear when it expires, and
         * all transactions for it will fail except the transaction to extend its expiration date.
         *
         * @readonly
         */
        this.isDeleted = props.isDeleted;

        /**
         * The Account ID of the account to which this is proxy staked. If proxyAccountID is null,
         * or is an invalid account, or is an account that isn't a node, then this account is
         * automatically proxy staked to a node chosen by the network, but without earning payments.
         * If the proxyAccountID account refuses to accept proxy staking , or if it is not currently
         * running a node, then it will behave as if proxyAccountID was null.
         *
         * @readonly
         */
        this.proxyAccountId = props.proxyAccountId;

        /**
         * The total number of tinybars proxy staked to this account.
         *
         * @readonly
         */
        this.proxyReceived = props.proxyReceived;

        /**
         * The key for the account, which must sign in order to transfer out, or to modify the account
         * in any way other than extending its expiration date.
         *
         * @readonly
         */
        this.key = props.key;

        /**
         * The current balance of account.
         *
         * @readonly
         */
        this.balance = props.balance;

        /**
         * The threshold amount (in tinybars) for which an account record is created (and this account
         * charged for them) for any send/withdraw transaction.
         *
         * @readonly
         */
        this.sendRecordThreshold = props.sendRecordThreshold;

        /**
         * The threshold amount (in tinybars) for which an account record is created
         * (and this account charged for them) for any transaction above this amount.
         *
         * @readonly
         */
        this.receiveRecordThreshold = props.receiveRecordThreshold;

        /**
         * If true, no transaction can transfer to this account unless signed by this account's key.
         *
         * @readonly
         */
        this.isReceiverSignatureRequired = props.isReceiverSignatureRequired;

        /**
         * The TimeStamp time at which this account is set to expire.
         *
         * @readonly
         */
        this.expirationTime = props.expirationTime;

        /**
         * The duration for expiration time will extend every this many seconds. If there are
         * insufficient funds, then it extends as long as possible. If it is empty when it
         * expires, then it is deleted.
         *
         * @readonly
         */
        this.autoRenewPeriod = props.autoRenewPeriod;

        /** @readonly */
        this.liveHashes = props.liveHashes;

        /** @readonly */
        this.tokenRelationships = props.tokenRelationships;

        /** @readonly */
        this.accountMemo = props.accountMemo;

        /** @readonly */
        this.ownedNfts = props.ownedNfts;

        /** @readonly */
        this.maxAutomaticTokenAssociations =
            props.maxAutomaticTokenAssociations;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.IAccountInfo} info
     * @returns {AccountInfo}
     */
    static _fromProtobuf(info) {
        return new AccountInfo({
            accountId: AccountId._fromProtobuf(
                /** @type {proto.IAccountID} */ (info.accountID)
            ),
            contractAccountId:
                info.contractAccountID != null ? info.contractAccountID : null,
            isDeleted: info.deleted != null ? info.deleted : false,
            key: keyFromProtobuf(/** @type {proto.IKey} */ (info.key)),
            balance: Hbar.fromTinybars(info.balance != null ? info.balance : 0),
            sendRecordThreshold: Hbar.fromTinybars(
                info.generateSendRecordThreshold != null
                    ? info.generateSendRecordThreshold
                    : 0
            ),
            receiveRecordThreshold: Hbar.fromTinybars(
                info.generateReceiveRecordThreshold != null
                    ? info.generateReceiveRecordThreshold
                    : 0
            ),
            isReceiverSignatureRequired:
                info.receiverSigRequired != null
                    ? info.receiverSigRequired
                    : false,
            expirationTime: Timestamp._fromProtobuf(
                /** @type {proto.ITimestamp} */ (info.expirationTime)
            ),
            autoRenewPeriod:
                info.autoRenewPeriod != null
                    ? new Duration(
                          /** @type {Long} */ (info.autoRenewPeriod.seconds)
                      )
                    : new Duration(0),
            proxyAccountId:
                info.proxyAccountID != null &&
                Long.fromValue(
                    /** @type {Long | number} */ (info.proxyAccountID.shardNum)
                ).toInt() !== 0 &&
                Long.fromValue(
                    /** @type {Long | number} */ (info.proxyAccountID.realmNum)
                ).toInt() !== 0 &&
                Long.fromValue(
                    /** @type {Long | number} */ (
                        info.proxyAccountID.accountNum
                    )
                ).toInt() !== 0
                    ? AccountId._fromProtobuf(info.proxyAccountID)
                    : null,
            proxyReceived: Hbar.fromTinybars(
                info.proxyReceived != null ? info.proxyReceived : 0
            ),
            liveHashes: (info.liveHashes != null ? info.liveHashes : []).map(
                (hash) => LiveHash._fromProtobuf(hash)
            ),
            tokenRelationships: TokenRelationshipMap._fromProtobuf(
                info.tokenRelationships != null ? info.tokenRelationships : []
            ),
            accountMemo: info.memo != null ? info.memo : "",
            ownedNfts: info.ownedNfts ? info.ownedNfts : Long.ZERO,
            maxAutomaticTokenAssociations: info.maxAutomaticTokenAssociations
                ? Long.fromNumber(info.maxAutomaticTokenAssociations)
                : Long.ZERO,
        });
    }

    /**
     * @returns {proto.IAccountInfo}
     */
    _toProtobuf() {
        return {
            accountID: this.accountId._toProtobuf(),
            contractAccountID: this.contractAccountId,
            deleted: this.isDeleted,
            proxyAccountID:
                this.proxyAccountId != null
                    ? this.proxyAccountId._toProtobuf()
                    : null,
            proxyReceived: this.proxyReceived.toTinybars(),
            key: keyToProtobuf(this.key),
            balance: this.balance.toTinybars(),
            generateSendRecordThreshold: this.sendRecordThreshold.toTinybars(),
            generateReceiveRecordThreshold:
                this.receiveRecordThreshold.toTinybars(),
            receiverSigRequired: this.isReceiverSignatureRequired,
            expirationTime: this.expirationTime._toProtobuf(),
            autoRenewPeriod: this.autoRenewPeriod._toProtobuf(),
            liveHashes: this.liveHashes.map((hash) => hash._toProtobuf()),
            tokenRelationships:
                this.tokenRelationships != null
                    ? this.tokenRelationships._toProtobuf()
                    : null,
            memo: this.accountMemo,
            ownedNfts: this.ownedNfts,
            maxAutomaticTokenAssociations:
                this.maxAutomaticTokenAssociations.toInt(),
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {AccountInfo}
     */
    static fromBytes(bytes) {
        return AccountInfo._fromProtobuf(
            proto.CryptoGetInfoResponse.AccountInfo.decode(bytes)
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.CryptoGetInfoResponse.AccountInfo.encode(
            this._toProtobuf()
        ).finish();
    }
}
