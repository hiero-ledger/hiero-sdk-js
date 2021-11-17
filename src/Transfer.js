import AccountId from "./account/AccountId.js";
import Hbar from "./Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IAccountAmount} proto.IAccountAmount
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("long")} Long
 */

/**
 * An account, and the amount that it sends or receives during a cryptocurrency transfer.
 */
export default class Transfer {
    /**
     * @internal
     * @param {object} props
     * @param {AccountId | string} props.accountId
     * @param {number | string | Long | BigNumber | Hbar} props.amount
     */
    constructor(props) {
        /**
         * The Account ID that sends or receives cryptocurrency.
         *
         * @readonly
         */
        this.accountId =
            props.accountId instanceof AccountId
                ? props.accountId
                : AccountId.fromString(props.accountId);

        /**
         * The amount of tinybars that the account sends(negative) or receives(positive).
         *
         * @readonly
         */
        this.amount =
            props.amount instanceof Hbar
                ? props.amount
                : new Hbar(props.amount);

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.IAccountAmount} transfer
     * @returns {Transfer}
     */
    static _fromProtobuf(transfer) {
        return new Transfer({
            accountId: AccountId._fromProtobuf(
                /** @type {proto.IAccountID} */ (transfer.accountID)
            ),
            amount: Hbar.fromTinybars(
                transfer.amount != null ? transfer.amount : 0
            ),
        });
    }

    /**
     * @internal
     * @returns {proto.IAccountAmount}
     */
    _toProtobuf() {
        return {
            accountID: this.accountId._toProtobuf(),
            amount: this.amount.toTinybars(),
        };
    }
}
