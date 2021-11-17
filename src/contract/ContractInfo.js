import ContractId from "./ContractId.js";
import AccountId from "../account/AccountId.js";
import Timestamp from "../Timestamp.js";
import Duration from "../Duration.js";
import Hbar from "../Hbar.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import Long from "long";
import * as proto from "@exodus/hashgraph-proto";
import TokenRelationshipMap from "../account/TokenRelationshipMap.js";

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
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
     * @param {Long} props.storage
     * @param {string} props.contractMemo
     * @param {Hbar} props.balance
     * @param {boolean} props.isDeleted
     * @param {TokenRelationshipMap} props.tokenRelationships
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

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.IContractInfo} info
     * @returns {ContractInfo}
     */
    static _fromProtobuf(info) {
        const autoRenewPeriod = /** @type {Long | number} */ (
            /** @type {proto.IDuration} */ (info.autoRenewPeriod).seconds
        );

        return new ContractInfo({
            contractId: ContractId._fromProtobuf(
                /** @type {proto.IContractID} */ (info.contractID)
            ),
            accountId: AccountId._fromProtobuf(
                /** @type {proto.IAccountID} */ (info.accountID)
            ),
            contractAccountId:
                info.contractAccountID != null ? info.contractAccountID : "",
            adminKey:
                info.adminKey != null ? keyFromProtobuf(info.adminKey) : null,
            expirationTime: Timestamp._fromProtobuf(
                /** @type {proto.ITimestamp} */ (info.expirationTime)
            ),
            autoRenewPeriod: new Duration(autoRenewPeriod),
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
                info.tokenRelationships != null ? info.tokenRelationships : []
            ),
        });
    }

    /**
     * @internal
     * @returns {proto.IContractInfo}
     */
    _toProtobuf() {
        return {
            contractID: this.contractId._toProtobuf(),
            accountID: this.accountId._toProtobuf(),
            contractAccountID: this.contractAccountId,
            adminKey:
                this.adminKey != null ? keyToProtobuf(this.adminKey) : null,
            expirationTime: this.expirationTime._toProtobuf(),
            autoRenewPeriod:
                this.autoRenewPeriod != null
                    ? this.autoRenewPeriod._toProtobuf()
                    : null,
            storage: this.storage,
            memo: this.contractMemo,
            balance: this.balance.toTinybars(),
            deleted: this.isDeleted,
            tokenRelationships:
                this.tokenRelationships != null
                    ? this.tokenRelationships._toProtobuf()
                    : null,
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {ContractInfo}
     */
    static fromBytes(bytes) {
        return ContractInfo._fromProtobuf(
            proto.ContractGetInfoResponse.ContractInfo.decode(bytes)
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return proto.ContractGetInfoResponse.ContractInfo.encode(
            this._toProtobuf()
        ).finish();
    }
}
