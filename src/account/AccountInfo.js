/*-
 * ‌
 * Hedera JavaScript SDK
 * ​
 * Copyright (C) 2020 - 2023 Hedera Hashgraph, LLC
 * ​
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ‍
 */

import AccountId from "./AccountId.js";
import StakingInfo from "../StakingInfo.js";
import LiveHash from "./LiveHash.js";
import Hbar from "../Hbar.js";
import Timestamp from "../Timestamp.js";
import Long from "long";
import TokenRelationshipMap from "./TokenRelationshipMap.js";
import * as HashgraphProto from "@hashgraph/proto";
import Duration from "../Duration.js";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";
import LedgerId from "../LedgerId.js";

/**
 * @typedef {import("./HbarAllowance.js").default} HbarAllowance
 * @typedef {import("./TokenAllowance.js").default} TokenAllowance
 * @typedef {import("./TokenNftAllowance.js").default} TokenNftAllowance
 * @typedef {import("../StakingInfo.js").StakingInfoJson} StakingInfoJson
 */

/**
 * @typedef {object} AccountInfoJson
 * @property {string} accountId
 * @property {?string} contractAccountId
 * @property {boolean} isDeleted
 * @property {?string} proxyAccountId
 * @property {string} proxyReceived
 * @property {?string} key
 * @property {string} balance
 * @property {string} sendRecordThreshold
 * @property {string} receiveRecordThreshold
 * @property {boolean} isReceiverSignatureRequired
 * @property {string} expirationTime
 * @property {string} autoRenewPeriod
 * @property {string} accountMemo
 * @property {string} ownedNfts
 * @property {string} maxAutomaticTokenAssociations
 * @property {?string} aliasKey
 * @property {?string} ledgerId
 * @property {?string} ethereumNonce
 * @property {?StakingInfoJson} stakingInfo
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
     * @param {PublicKey | null} props.aliasKey
     * @param {LedgerId | null} props.ledgerId
     * @param {HbarAllowance[]} props.hbarAllowances
     * @param {TokenAllowance[]} props.tokenAllowances
     * @param {TokenNftAllowance[]} props.nftAllowances
     * @param {?Long} props.ethereumNonce
     * @param {?StakingInfo} props.stakingInfo
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
         * @deprecated
         *
         * The Account ID of the account to which this is proxy staked. If proxyAccountID is null,
         * or is an invalid account, or is an account that isn't a node, then this account is
         * automatically proxy staked to a node chosen by the network, but without earning payments.
         * If the proxyAccountID account refuses to accept proxy staking , or if it is not currently
         * running a node, then it will behave as if proxyAccountID was null.
         * @readonly
         */
        // eslint-disable-next-line deprecation/deprecation
        this.proxyAccountId = props.proxyAccountId;

        /**
         * @deprecated
         * The total number of tinybars proxy staked to this account.
         *
         * @readonly
         */
        // eslint-disable-next-line deprecation/deprecation
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

        this.aliasKey = props.aliasKey;

        this.ledgerId = props.ledgerId;
        /*
         * @deprecated - no longer supported
         */
        this.hbarAllowances = props.hbarAllowances;
        /*
         * @deprecated - no longer supported
         */
        this.tokenAllowances = props.tokenAllowances;
        /*
         * @deprecated - no longer supported
         */
        this.nftAllowances = props.nftAllowances;

        /**
         * The ethereum transaction nonce associated with this account.
         */
        this.ethereumNonce = props.ethereumNonce;

        /**
         * Staking metadata for this account.
         */
        this.stakingInfo = props.stakingInfo;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.CryptoGetInfoResponse.IAccountInfo} info
     * @returns {AccountInfo}
     */
    static _fromProtobuf(info) {
        let aliasKey =
            info.alias != null && info.alias.length > 0
                ? Key._fromProtobufKey(
                      HashgraphProto.proto.Key.decode(info.alias),
                  )
                : null;

        if (!(aliasKey instanceof PublicKey)) {
            aliasKey = null;
        }

        const accountId = AccountId._fromProtobuf(
            /** @type {HashgraphProto.proto.IAccountID} */ (info.accountID),
        );

        return new AccountInfo({
            accountId,
            contractAccountId:
                info.contractAccountID != null ? info.contractAccountID : null,
            isDeleted: info.deleted != null ? info.deleted : false,
            key: Key._fromProtobufKey(
                /** @type {HashgraphProto.proto.IKey} */ (info.key),
            ),
            balance: Hbar.fromTinybars(info.balance != null ? info.balance : 0),
            sendRecordThreshold: Hbar.fromTinybars(
                info.generateSendRecordThreshold != null
                    ? info.generateSendRecordThreshold
                    : 0,
            ),
            receiveRecordThreshold: Hbar.fromTinybars(
                info.generateReceiveRecordThreshold != null
                    ? info.generateReceiveRecordThreshold
                    : 0,
            ),
            isReceiverSignatureRequired:
                info.receiverSigRequired != null
                    ? info.receiverSigRequired
                    : false,
            expirationTime: Timestamp._fromProtobuf(
                /** @type {HashgraphProto.proto.ITimestamp} */ (
                    info.expirationTime
                ),
            ),
            autoRenewPeriod:
                info.autoRenewPeriod != null
                    ? new Duration(
                          /** @type {Long} */ (info.autoRenewPeriod.seconds),
                      )
                    : new Duration(0),
            proxyAccountId:
                info.proxyAccountID != null &&
                Long.fromValue(
                    /** @type {Long | number} */ (info.proxyAccountID.shardNum),
                ).toInt() !== 0 &&
                Long.fromValue(
                    /** @type {Long | number} */ (info.proxyAccountID.realmNum),
                ).toInt() !== 0 &&
                Long.fromValue(
                    /** @type {Long | number} */ (
                        info.proxyAccountID.accountNum
                    ),
                ).toInt() !== 0
                    ? AccountId._fromProtobuf(info.proxyAccountID)
                    : null,
            proxyReceived: Hbar.fromTinybars(
                info.proxyReceived != null ? info.proxyReceived : 0,
            ),
            liveHashes: (info.liveHashes != null ? info.liveHashes : []).map(
                (hash) => LiveHash._fromProtobuf(hash),
            ),
            tokenRelationships: TokenRelationshipMap._fromProtobuf(
                info.tokenRelationships != null ? info.tokenRelationships : [],
            ),
            accountMemo: info.memo != null ? info.memo : "",
            ownedNfts: info.ownedNfts ? info.ownedNfts : Long.ZERO,
            maxAutomaticTokenAssociations: info.maxAutomaticTokenAssociations
                ? Long.fromNumber(info.maxAutomaticTokenAssociations)
                : Long.ZERO,
            aliasKey,
            ledgerId:
                info.ledgerId != null
                    ? LedgerId.fromBytes(info.ledgerId)
                    : null,
            hbarAllowances: [],
            tokenAllowances: [],
            nftAllowances: [],
            ethereumNonce:
                info.ethereumNonce != null ? info.ethereumNonce : null,
            stakingInfo:
                info.stakingInfo != null
                    ? StakingInfo._fromProtobuf(info.stakingInfo)
                    : null,
        });
    }

    /**
     * @returns {HashgraphProto.proto.CryptoGetInfoResponse.IAccountInfo}
     */
    _toProtobuf() {
        return {
            accountID: this.accountId._toProtobuf(),
            contractAccountID: this.contractAccountId,
            deleted: this.isDeleted,
            proxyAccountID:
                // eslint-disable-next-line deprecation/deprecation
                this.proxyAccountId != null
                    ? // eslint-disable-next-line deprecation/deprecation
                      this.proxyAccountId._toProtobuf()
                    : null,
            // eslint-disable-next-line deprecation/deprecation
            proxyReceived: this.proxyReceived.toTinybars(),
            key: this.key._toProtobufKey(),
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
            alias:
                this.aliasKey != null
                    ? HashgraphProto.proto.Key.encode(
                          this.aliasKey._toProtobufKey(),
                      ).finish()
                    : null,
            ledgerId: this.ledgerId != null ? this.ledgerId.toBytes() : null,
            ethereumNonce: this.ethereumNonce,
            stakingInfo:
                this.stakingInfo != null
                    ? this.stakingInfo._toProtobuf()
                    : null,
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {AccountInfo}
     */
    static fromBytes(bytes) {
        return AccountInfo._fromProtobuf(
            HashgraphProto.proto.CryptoGetInfoResponse.AccountInfo.decode(
                bytes,
            ),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HashgraphProto.proto.CryptoGetInfoResponse.AccountInfo.encode(
            this._toProtobuf(),
        ).finish();
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @returns {AccountInfoJson}
     */
    toJSON() {
        return {
            balance: this.balance.toString(),
            accountId: this.accountId.toString(),
            contractAccountId: this.contractAccountId,
            isDeleted: this.isDeleted,
            proxyAccountId:
                // eslint-disable-next-line deprecation/deprecation
                this.proxyAccountId != null
                    ? // eslint-disable-next-line deprecation/deprecation
                      this.proxyAccountId.toString()
                    : null,
            // eslint-disable-next-line deprecation/deprecation
            proxyReceived: this.proxyReceived.toString(),
            key: this.key != null ? this.key.toString() : null,
            sendRecordThreshold: this.sendRecordThreshold.toString(),
            receiveRecordThreshold: this.receiveRecordThreshold.toString(),
            isReceiverSignatureRequired: this.isReceiverSignatureRequired,
            expirationTime: this.expirationTime.toString(),
            autoRenewPeriod: this.autoRenewPeriod.toString(),
            accountMemo: this.accountMemo,
            ownedNfts: this.ownedNfts.toString(),
            maxAutomaticTokenAssociations:
                this.maxAutomaticTokenAssociations.toString(),
            aliasKey: this.aliasKey != null ? this.aliasKey.toString() : null,
            ledgerId: this.ledgerId != null ? this.ledgerId.toString() : null,
            ethereumNonce:
                this.ethereumNonce != null
                    ? this.ethereumNonce.toString()
                    : null,
            stakingInfo:
                this.stakingInfo != null ? this.stakingInfo.toJSON() : null,
        };
    }
}
