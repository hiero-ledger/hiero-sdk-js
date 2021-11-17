import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITimestamp} proto.ITimestamp
 */

const MAX_NS = Long.fromNumber(1000000000);

export default class Timestamp {
    /**
     * @param {Long | number} seconds
     * @param {Long | number} nanos
     */
    constructor(seconds, nanos) {
        /**
         * @readonly
         * @type {Long}
         */
        this.seconds =
            seconds instanceof Long ? seconds : Long.fromNumber(seconds);

        /**
         * @readonly
         * @type {Long}
         */
        this.nanos = nanos instanceof Long ? nanos : Long.fromNumber(nanos);

        Object.freeze(this);
    }

    /**
     * @returns {Timestamp}
     */
    static generate() {
        const jitter = Math.floor(Math.random() * 5000) + 8000;
        const now = Date.now() - jitter;
        const seconds = Math.floor(now / 1000);
        const nanos =
            Math.floor(now % 1000) * 1000000 +
            Math.floor(Math.random() * 1000000);

        return new Timestamp(seconds, nanos);
    }

    /**
     * @param {string | number | Date} date
     * @returns {Timestamp}
     */
    static fromDate(date) {
        let ms;

        if (typeof date === "number") {
            ms = date;
        } else if (typeof date === "string") {
            ms = Date.parse(date);
        } else if (date instanceof Date) {
            ms = date.getTime();
        } else {
            throw new TypeError(
                `invalid type '${typeof date}' for 'data', expected 'Date'`
            );
        }

        const seconds = Math.floor(ms / 1000);
        const nanos = Math.floor(ms % 1000) * 1000000;

        return new Timestamp(seconds, nanos);
    }

    /**
     * @returns {Date}
     */
    toDate() {
        return new Date(
            this.seconds.toInt() * 1000 +
                Math.floor(this.nanos.toInt() / 1000000)
        );
    }

    /**
     * @param {Long | number} nanos
     * @returns {Timestamp}
     */
    plusNanos(nanos) {
        const ns = this.nanos.add(nanos);

        return new Timestamp(this.seconds.add(ns.div(MAX_NS)), ns.mod(MAX_NS));
    }

    /**
     * @internal
     * @returns {proto.ITimestamp}
     */
    _toProtobuf() {
        return {
            seconds: this.seconds,
            nanos: this.nanos.toInt(),
        };
    }

    /**
     * @internal
     * @param {proto.ITimestamp} timestamp
     * @returns {Timestamp}
     */
    static _fromProtobuf(timestamp) {
        return new Timestamp(
            timestamp.seconds instanceof Long
                ? timestamp.seconds.toInt()
                : timestamp.seconds != null
                ? timestamp.seconds
                : 0,

            timestamp.nanos != null ? timestamp.nanos : 0
        );
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.seconds.toString()}.${this.nanos.toString()}`;
    }

    /**
     * @param {Timestamp} other
     * @returns {number}
     */
    compare(other) {
        const comparison = this.seconds.compare(other.seconds);

        if (comparison != 0) {
            return comparison;
        }

        return this.nanos.compare(other.nanos);
    }
}
