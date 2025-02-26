// SPDX-License-Identifier: Apache-2.0

import ExchangeRate from "./ExchangeRate.js";
import * as HieroProto from "@hashgraph/proto";

const { proto } = HieroProto;

/**
 *  Represents a pair of exchange rates for HBAR to USD cents conversion.
 * Contains both the current exchange rate and the next exchange rate that will take effect.
 */
export default class ExchangeRates {
    /**
     * @private
     * @param {object} props
     * @param {ExchangeRate} props.currentRate
     * @param {ExchangeRate} props.nextRate
     */
    constructor(props) {
        /**
         * @readonly
         */
        this.currentRate = props.currentRate;

        /**
         * @readonly
         */
        this.nextRate = props.nextRate;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.IExchangeRateSet} rateSet
     * @returns {ExchangeRates}
     */
    static _fromProtobuf(rateSet) {
        return new ExchangeRates({
            currentRate: ExchangeRate._fromProtobuf(
                /** @type {HieroProto.proto.IExchangeRate} */ (
                    rateSet.currentRate
                ),
            ),
            nextRate: ExchangeRate._fromProtobuf(
                /** @type {HieroProto.proto.IExchangeRate} */ (
                    rateSet.nextRate
                ),
            ),
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IExchangeRateSet}
     */
    _toProtobuf() {
        return {
            currentRate: this.currentRate._toProtobuf(),
            nextRate: this.nextRate._toProtobuf(),
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {ExchangeRates}
     */
    static fromBytes(bytes) {
        return ExchangeRates._fromProtobuf(proto.ExchangeRateSet.decode(bytes));
    }
}
