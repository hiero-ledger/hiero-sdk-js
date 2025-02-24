import AccountId from "../account/AccountId.js";
import CustomFixedFee from "../token/CustomFixedFee.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IFixedFee} HashgraphProto.proto.IFixedFee
 * @typedef {import("@hashgraph/proto").proto.ICustomFeeLimit} HashgraphProto.proto.ICustomFeeLimit
 */

export default class CustomFeeLimit {
    /**
     *
     * @param {object} props
     * @param {?AccountId | string} [props.accountId]
     * @param {?CustomFixedFee[]} [props.fees]
     */
    constructor(props = {}) {
        /**
         * @type {?AccountId}
         */
        this._accountId = null;

        if (props.accountId) {
            this.setAccountId(props.accountId);
        }

        /**
         * @type {?CustomFixedFee[]}
         */
        this._fees = null;

        if (props.fees) {
            this.setFees(props.fees);
        }
    }

    /**
     * @static
     * @param {HashgraphProto.proto.ICustomFeeLimit} customFeeLimit
     * @returns {CustomFeeLimit}
     */
    static _fromProtobuf(customFeeLimit) {
        return new CustomFeeLimit({
            accountId:
                customFeeLimit.accountId != null
                    ? AccountId._fromProtobuf(customFeeLimit.accountId)
                    : null,
            fees:
                customFeeLimit.fees != null
                    ? customFeeLimit.fees.map((fixedFee) => {
                          return CustomFixedFee._fromProtobuf({
                              fixedFee: fixedFee,
                          });
                      })
                    : null,
        });
    }

    /**
     * @returns {?AccountId}
     */
    getAccountId() {
        return this._accountId;
    }

    /**
     *
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        if (accountId instanceof AccountId) {
            this._accountId = accountId;
        } else {
            this._accountId = AccountId.fromString(accountId);
        }
        return this;
    }

    /**
     * @returns {?CustomFixedFee[]}
     */
    getFees() {
        return this._fees;
    }

    /**
     *
     * @param {CustomFixedFee[]} fees
     * @returns {this}
     */
    setFees(fees) {
        this._fees = fees;

        return this;
    }

    /**
     *
     * @returns {HashgraphProto.proto.ICustomFeeLimit}
     */
    _toProtobuf() {
        /** @type {HashgraphProto.proto.IFixedFee[]} */
        const protoFixedFees = [];

        if (this._fees != null) {
            this._fees.forEach((fixedFee) => {
                const fixedFeeProto = fixedFee._toProtobuf();
                if (fixedFeeProto.fixedFee != null) {
                    protoFixedFees.push(fixedFeeProto.fixedFee);
                }
            });
        }

        return {
            accountId:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            fees: protoFixedFees,
        };
    }
}
