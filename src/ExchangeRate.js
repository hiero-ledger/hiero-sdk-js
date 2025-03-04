// SPDX-License-Identifier: Apache-2.0

import Long from "long";

/**
 * @typedef {object} ExchangeRateJSON
 * @property {number} hbars
 * @property {number} cents
 * @property {Date} expirationTime
 * @property {number} exchangeRateInCents
 */

/**
 * Represents an exchange rate between hbars and cents (USD).
 * This class provides functionality for handling and converting exchange rates
 * between Hedera's native HBAR currency and US cents.
 */
export default class ExchangeRate {
    /**
     * @private
     * @param {object} props
     * @param {number} props.hbars
     * @param {number} props.cents
     * @param {Date} props.expirationTime
     */
    constructor(props) {
        /**
         * Denotes Hbar equivalent to cents (USD)
         *
         * @readonly
         * @type {number}
         */
        this.hbars = props.hbars;

        /**
         * Denotes cents (USD) equivalent to Hbar
         *
         * @readonly
         * @type {number}
         */
        this.cents = props.cents;

        /**
         * Expiration time of this exchange rate
         *
         * @readonly
         * @type {Date}
         */
        this.expirationTime = props.expirationTime;

        /**
         * Calculated exchange rate
         *
         * @readonly
         * @type {number}
         */
        this.exchangeRateInCents = props.cents / props.hbars;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {import("@hashgraph/proto").proto.IExchangeRate} rate
     * @returns {ExchangeRate}
     */
    static _fromProtobuf(rate) {
        return new ExchangeRate({
            hbars: /** @type {number} */ (rate.hbarEquiv),
            cents: /** @type {number} */ (rate.centEquiv),
            expirationTime: new Date(
                rate.expirationTime != null
                    ? rate.expirationTime.seconds != null
                        ? Long.isLong(rate.expirationTime.seconds)
                            ? rate.expirationTime.seconds.toInt() * 1000
                            : rate.expirationTime.seconds
                        : 0
                    : 0,
            ),
        });
    }

    /**
     * @internal
     * @returns {import("@hashgraph/proto").proto.IExchangeRate}
     */
    _toProtobuf() {
        return {
            hbarEquiv: this.hbars,
            centEquiv: this.cents,
            expirationTime: {
                seconds: Long.fromNumber(
                    Math.trunc(this.expirationTime.getTime() / 1000),
                ),
            },
        };
    }

    /**
     * @returns {ExchangeRateJSON}
     */
    toJSON() {
        return {
            hbars: this.hbars,
            cents: this.cents,
            expirationTime: this.expirationTime,
            exchangeRateInCents: this.exchangeRateInCents,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
