import Long from "long";

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

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {import("@exodus/hashgraph-proto").IExchangeRate} rate
     * @returns {ExchangeRate}
     */
    static _fromProtobuf(rate) {
        return new ExchangeRate({
            hbars: /** @type {number} */ (rate.hbarEquiv),
            cents: /** @type {number} */ (rate.centEquiv),
            expirationTime: new Date(
                rate.expirationTime != null
                    ? rate.expirationTime.seconds != null
                        ? rate.expirationTime.seconds instanceof Long
                            ? rate.expirationTime.seconds.toInt()
                            : rate.expirationTime.seconds
                        : 0 * 1000
                    : 0 * 1000
            ),
        });
    }

    /**
     * @internal
     * @returns {import("@exodus/hashgraph-proto").IExchangeRate}
     */
    _toProtobuf() {
        return {
            hbarEquiv: this.hbars,
            centEquiv: this.cents,
            expirationTime: {
                seconds: Long.fromNumber(this.expirationTime.getSeconds()),
            },
        };
    }
}
