import TokenId from "./TokenId.js";
import CustomFee from "./CustomFee.js";
import AccountId from "../account/AccountId.js";
import Long from "long";
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ICustomFee} proto.ICustomFee
 * @typedef {import("@exodus/hashgraph-proto").IFixedFee} proto.IFixedFee
 */

export default class CustomFixedFee extends CustomFee {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.feeCollectorAccountId]
     * @param {TokenId | string} [props.denominatingTokenId]
     * @param {Long | number} [props.amount]
     */
    constructor(props = {}) {
        super(props);

        /**
         * @type {?TokenId}
         */
        this._denominatingTokenId;

        if (props.denominatingTokenId != null) {
            this.setDenominatingTokenId(props.denominatingTokenId);
        }

        /**
         * @type {?Long}
         */
        this._amount;

        if (props.amount != null) {
            this.setAmount(props.amount);
        }
    }

    /**
     * @param {Hbar} amount
     * @returns {CustomFixedFee}
     */
    setHbarAmount(amount) {
        this._amount = amount.toTinybars();
        this._denominatingTokenId = null;
        return this;
    }

    /**
     * @returns {TokenId | Hbar | null}
     */
    get hbarAmount() {
        return this._denominatingTokenId != null
            ? null
            : Hbar.fromTinybars(this._amount != null ? this._amount : 0);
    }

    /**
     * @returns {CustomFixedFee}
     */
    setDenominatingTokenToSameToken() {
        this._denominatingTokenId = new TokenId(0, 0, 0);
        return this;
    }

    /**
     * @returns {?TokenId}
     */
    get denominatingTokenId() {
        return this._denominatingTokenId;
    }

    /**
     * @param {TokenId | string} denominatingTokenId
     * @returns {CustomFixedFee}
     */
    setDenominatingTokenId(denominatingTokenId) {
        this._denominatingTokenId =
            typeof denominatingTokenId === "string"
                ? TokenId.fromString(denominatingTokenId)
                : denominatingTokenId;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get amount() {
        return this._amount;
    }

    /**
     * @param {Long | number} amount
     * @returns {CustomFixedFee}
     */
    setAmount(amount) {
        this._amount =
            typeof amount === "number" ? Long.fromNumber(amount) : amount;
        return this;
    }

    /**
     * @internal
     * @override
     * @param {proto.ICustomFee} info
     * @returns {CustomFee}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _fromProtobuf(info) {
        const fee = /** @type {proto.IFixedFee} */ (info.fixedFee);

        return new CustomFixedFee({
            feeCollectorAccountId:
                info.feeCollectorAccountId != null
                    ? AccountId._fromProtobuf(info.feeCollectorAccountId)
                    : undefined,
            denominatingTokenId:
                fee.denominatingTokenId != null
                    ? TokenId._fromProtobuf(fee.denominatingTokenId)
                    : undefined,
            amount: fee.amount != null ? fee.amount : undefined,
        });
    }

    /**
     * @internal
     * @abstract
     * @returns {proto.ICustomFee}
     */
    _toProtobuf() {
        return {
            feeCollectorAccountId:
                this.feeCollectorAccountId != null
                    ? this.feeCollectorAccountId._toProtobuf()
                    : null,
            fixedFee: {
                denominatingTokenId:
                    this._denominatingTokenId != null
                        ? this._denominatingTokenId._toProtobuf()
                        : null,
                amount: this._amount,
            },
        };
    }
}
