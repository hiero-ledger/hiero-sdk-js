// SPDX-License-Identifier: Apache-2.0

import CustomFee from "./CustomFee.js";
import AccountId from "../account/AccountId.js";
import Long from "long";
import CustomFixedFee from "./CustomFixedFee.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IFraction} HieroProto.proto.IFraction
 * @typedef {import("@hashgraph/proto").proto.IRoyaltyFee} HieroProto.proto.IRoyaltyFee
 * @typedef {import("@hashgraph/proto").proto.ICustomFee} HieroProto.proto.ICustomFee
 * @typedef {import("@hashgraph/proto").proto.IFixedFee} HieroProto.proto.IFixedFee
 */

export default class CustomRoyalyFee extends CustomFee {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.feeCollectorAccountId]
     * @param {boolean} [props.allCollectorsAreExempt]
     * @param {Long | number} [props.numerator]
     * @param {Long | number} [props.denominator]
     * @param {CustomFixedFee} [props.fallbackFee]
     */
    constructor(props = {}) {
        super(props);

        /**
         * @type {?CustomFixedFee}
         */
        this._fallbackFee = null;

        if (props.fallbackFee != null) {
            this.setFallbackFee(props.fallbackFee);
        }

        /**
         * @type {?Long}
         */
        this._numerator = null;

        if (props.numerator != null) {
            this.setNumerator(props.numerator);
        }

        /**
         * @type {?Long}
         */
        this._denominator = null;

        if (props.denominator != null) {
            this.setDenominator(props.denominator);
        }
    }

    /**
     * @returns {?CustomFixedFee}
     */
    get fallbackFee() {
        return this._fallbackFee;
    }

    /**
     * @param {CustomFixedFee} fallbackFee
     * @returns {CustomRoyalyFee}
     */
    setFallbackFee(fallbackFee) {
        this._fallbackFee = fallbackFee;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get numerator() {
        return this._numerator;
    }

    /**
     * @param {Long | number} numerator
     * @returns {CustomRoyalyFee}
     */
    setNumerator(numerator) {
        this._numerator =
            typeof numerator === "number"
                ? Long.fromNumber(numerator)
                : numerator;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get denominator() {
        return this._denominator;
    }

    /**
     * @param {Long | number} denominator
     * @returns {CustomRoyalyFee}
     */
    setDenominator(denominator) {
        this._denominator =
            typeof denominator === "number"
                ? Long.fromNumber(denominator)
                : denominator;
        return this;
    }

    /**
     * @internal
     * @override
     * @param {HieroProto.proto.ICustomFee} info
     * @returns {CustomFee}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _fromProtobuf(info) {
        const fee = /** @type {HieroProto.proto.IRoyaltyFee} */ (
            info.royaltyFee
        );
        const fraction = /** @type {HieroProto.proto.IFraction} */ (
            fee.exchangeValueFraction
        );

        return new CustomRoyalyFee({
            feeCollectorAccountId:
                info.feeCollectorAccountId != null
                    ? AccountId._fromProtobuf(info.feeCollectorAccountId)
                    : undefined,
            allCollectorsAreExempt:
                info.allCollectorsAreExempt != null
                    ? info.allCollectorsAreExempt
                    : undefined,
            fallbackFee:
                fee.fallbackFee != null
                    ? /** @type {CustomFixedFee} */ (
                          CustomFixedFee._fromProtobuf({
                              fixedFee: fee.fallbackFee,
                          })
                      )
                    : undefined,
            numerator:
                fraction.numerator != null ? fraction.numerator : undefined,
            denominator:
                fraction.denominator != null ? fraction.denominator : undefined,
        });
    }

    /**
     * @internal
     * @abstract
     * @returns {HieroProto.proto.ICustomFee}
     */
    _toProtobuf() {
        return {
            feeCollectorAccountId:
                this.feeCollectorAccountId != null
                    ? this.feeCollectorAccountId._toProtobuf()
                    : null,
            allCollectorsAreExempt: this.allCollectorsAreExempt,
            royaltyFee: {
                exchangeValueFraction: {
                    numerator: this._numerator,
                    denominator: this._denominator,
                },
                fallbackFee:
                    this._fallbackFee != null
                        ? this._fallbackFee._toProtobuf().fixedFee
                        : null,
            },
        };
    }
}
