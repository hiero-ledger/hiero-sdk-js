// SPDX-License-Identifier: Apache-2.0

import ContractId from "./ContractId.js";
import AccountId from "../account/AccountId.js";
import StakingInfo from "../StakingInfo.js";
import Timestamp from "../Timestamp.js";
import Duration from "../Duration.js";
import Hbar from "../Hbar.js";
import Long from "long";
import * as HieroProto from "@hashgraph/proto";
import TokenRelationshipMap from "../account/TokenRelationshipMap.js";
import Key from "../Key.js";
import LedgerId from "../LedgerId.js";

const { proto } = HieroProto;

/**
 * @typedef {import("../StakingInfo.js").StakingInfoJson} StakingInfoJson
 */

/**
 * Response when the client sends the node CryptoGetInfoQuery.
 */
export default class ContractInfo {
    /**
     * @private
     * @param {object} props
     * @param {ContractId} props.contractId
     * @param {AccountId} props.accountId
     * @param {string} props.contractAccountId
     * @param {?Key} props.adminKey
     * @param {Timestamp} props.expirationTime
     * @param {Duration} props.autoRenewPeriod
     * @param {?AccountId} props.autoRenewAccountId
     * @param {Long} props.storage
     * @param {string} props.contractMemo
     * @param {Hbar} props.balance
     * @param {boolean} props.isDeleted
     * @param {TokenRelationshipMap} props.tokenRelationships
     * @param {LedgerId|null} props.ledgerId
     * @param {?StakingInfo} props.stakingInfo
     * @param {Long} props.maxAutomaticTokenAssociations
     */
    constructor(props) {
        /**
         * ID of the contract instance, in the format used in transactions.
         *
         * @readonly
         */
        this.contractId = props.contractId;

        /**
         * ID of the cryptocurrency account owned by the contract instance,
         * in the format used in transactions.
         *
         * @readonly
         */
        this.accountId = props.accountId;

        /**
         * ID of both the contract instance and the cryptocurrency account owned by the contract
         * instance, in the format used by Solidity.
         *
         * @readonly
         */
        this.contractAccountId = props.contractAccountId;

        /**
         * The state of the instance and its fields can be modified arbitrarily if this key signs a
         * transaction to modify it. If this is null, then such modifications are not possible,
         * and there is no administrator that can override the normal operation of this smart
         * contract instance. Note that if it is created with no admin keys, then there is no
         * administrator to authorize changing the admin keys, so there can never be any admin keys
         * for that instance.
         *
         * @readonly
         */
        this.adminKey = props.adminKey != null ? props.adminKey : null;

        /**
         * The current time at which this contract instance (and its account) is set to expire.
         *
         * @readonly
         */
        this.expirationTime = props.expirationTime;

        /**
         * The expiration time will extend every this many seconds. If there are insufficient funds,
         * then it extends as long as possible. If the account is empty when it expires,
         * then it is deleted.
         *
         * @readonly
         */
        this.autoRenewPeriod = props.autoRenewPeriod;

        /**
         * ID of the an account to charge for auto-renewal of this contract. If not set, or set
         * to an account with zero hbar balance, the contract's own hbar balance will be used
         * to cover auto-renewal fees.
         *
         * @readonly
         */
        this.autoRenewAccountId = props.autoRenewAccountId;

        /**
         * Number of bytes of storage being used by this instance (which affects the cost to
         * extend the expiration time).
         *
         * @readonly
         */
        this.storage = props.storage;

        /**
         * The memo associated with the contract (max 100 bytes).
         *
         * @readonly
         */
        this.contractMemo = props.contractMemo;

        /**
         * The current balance of the contract.
         *
         * @readonly
         */
        this.balance = props.balance;

        /**
         * Whether the contract has been deleted
         *
         * @readonly
         */
        this.isDeleted = props.isDeleted;

        /**
         * The tokens associated to the contract
         *
         * @readonly
         */
        this.tokenRelationships = props.tokenRelationships;

        /**
         * The maximum number of automatic token associations allowed for this contract.
         * @readonly
         */
        this.maxAutomaticTokenAssociations =
            props.maxAutomaticTokenAssociations;

        /**
         * The ledger ID the response was returned from; please see <a href="https://github.com/hashgraph/hedera-improvement-proposal/blob/master/HIP/hip-198.md">HIP-198</a> for the network-specific IDs.
         */
        this.ledgerId = props.ledgerId;

        /**
         * Staking metadata for this account.
         */
        this.stakingInfo = props.stakingInfo;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.ContractGetInfoResponse.IContractInfo} info
     * @returns {ContractInfo}
     */
    static _fromProtobuf(info) {
        const autoRenewPeriod = /** @type {Long | number} */ (
            /** @type {HieroProto.proto.IDuration} */ (info.autoRenewPeriod)
                .seconds
        );

        return new ContractInfo({
            contractId: ContractId._fromProtobuf(
                /** @type {HieroProto.proto.IContractID} */ (info.contractID),
            ),
            accountId: AccountId._fromProtobuf(
                /** @type {HieroProto.proto.IAccountID} */ (info.accountID),
            ),
            contractAccountId:
                info.contractAccountID != null ? info.contractAccountID : "",
            adminKey:
                info.adminKey != null
                    ? Key._fromProtobufKey(info.adminKey)
                    : null,
            expirationTime: Timestamp._fromProtobuf(
                /** @type {HieroProto.proto.ITimestamp} */ (
                    info.expirationTime
                ),
            ),
            autoRenewPeriod: new Duration(autoRenewPeriod),
            autoRenewAccountId:
                info.autoRenewAccountId != null
                    ? AccountId._fromProtobuf(info.autoRenewAccountId)
                    : null,
            storage:
                info.storage != null
                    ? info.storage instanceof Long
                        ? info.storage
                        : Long.fromValue(info.storage)
                    : Long.ZERO,
            contractMemo: info.memo != null ? info.memo : "",
            balance: Hbar.fromTinybars(info.balance != null ? info.balance : 0),
            isDeleted: /** @type {boolean} */ (info.deleted),
            tokenRelationships: TokenRelationshipMap._fromProtobuf(
                info.tokenRelationships != null ? info.tokenRelationships : [],
            ),
            ledgerId:
                info.ledgerId != null
                    ? LedgerId.fromBytes(info.ledgerId)
                    : null,
            stakingInfo:
                info.stakingInfo != null
                    ? StakingInfo._fromProtobuf(info.stakingInfo)
                    : null,
            maxAutomaticTokenAssociations:
                info.maxAutomaticTokenAssociations != null
                    ? Long.isLong(info.maxAutomaticTokenAssociations)
                        ? info.maxAutomaticTokenAssociations
                        : Long.fromValue(info.maxAutomaticTokenAssociations)
                    : Long.ZERO,
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ContractGetInfoResponse.IContractInfo}
     */
    _toProtobuf() {
        return {
            contractID: this.contractId._toProtobuf(),
            accountID: this.accountId._toProtobuf(),
            contractAccountID: this.contractAccountId,
            adminKey:
                this.adminKey != null ? this.adminKey._toProtobufKey() : null,
            expirationTime: this.expirationTime._toProtobuf(),
            autoRenewPeriod:
                this.autoRenewPeriod != null
                    ? this.autoRenewPeriod._toProtobuf()
                    : null,
            autoRenewAccountId:
                this.autoRenewAccountId != null
                    ? this.autoRenewAccountId._toProtobuf()
                    : null,
            storage: this.storage,
            memo: this.contractMemo,
            balance: this.balance.toTinybars(),
            deleted: this.isDeleted,
            tokenRelationships:
                this.tokenRelationships != null
                    ? this.tokenRelationships._toProtobuf()
                    : null,
            ledgerId: this.ledgerId != null ? this.ledgerId.toBytes() : null,
            stakingInfo:
                this.stakingInfo != null
                    ? this.stakingInfo._toProtobuf()
                    : null,
            maxAutomaticTokenAssociations:
                this.maxAutomaticTokenAssociations.toNumber(),
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {ContractInfo}
     */
    static fromBytes(bytes) {
        return ContractInfo._fromProtobuf(
            proto.ContractGetInfoResponse.ContractInfo.decode(bytes),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.ContractGetInfoResponse.ContractInfo.encode(
            this._toProtobuf(),
        ).finish();
    }
}
