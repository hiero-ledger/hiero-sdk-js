// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Cache from "./Cache.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITimestamp} HieroProto.proto.ITimestamp
 */

const MAX_NS = Long.fromNumber(1000000000);
const generatedIds = new Set();

/**
 * Represents a point in time with seconds and nanoseconds precision.
 *
 * The `Timestamp` class provides methods for creating, manipulating, and converting
 * timestamps. It supports operations such as addition of nanoseconds, conversion to
 * JavaScript Date objects, and generation of timestamps based on the current time.
 */
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
     * @param {boolean} hasJitter
     * @returns {Timestamp}
     */
    static generate(hasJitter = true) {
        let jitter;
        if (hasJitter) {
            jitter = Math.floor(Math.random() * 5000) + 3000;
        } else {
            jitter = 0;
        }
        const now = Date.now() - jitter;
        const seconds = Math.floor(now / 1000) + Cache.timeDrift;
        const nanos =
            Math.floor(now % 1000) * 1000000 +
            Math.floor(Math.random() * 1000000);

        const timestamp = new Timestamp(seconds, nanos);
        if (generatedIds.has(timestamp.toString())) {
            return this.generate();
        } else {
            generatedIds.add(timestamp.toString());
            return timestamp;
        }
    }

    /**
     * @param {string | number | Date} date
     * @returns {Timestamp}
     */
    static fromDate(date) {
        let nanos;

        if (typeof date === "number") {
            nanos = Long.fromNumber(date);
        } else if (typeof date === "string") {
            nanos = Long.fromNumber(Date.parse(date)).mul(1000000);
        } else if (date instanceof Date) {
            nanos = Long.fromNumber(date.getTime()).mul(1000000);
        } else {
            throw new TypeError(
                `invalid type '${typeof date}' for 'data', expected 'Date'`,
            );
        }

        return new Timestamp(0, 0).plusNanos(nanos);
    }

    /**
     * @returns {Date}
     */
    toDate() {
        return new Date(
            this.seconds.toInt() * 1000 +
                Math.floor(this.nanos.toInt() / 1000000),
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
     * @returns {HieroProto.proto.ITimestamp}
     */
    _toProtobuf() {
        return {
            seconds: this.seconds,
            nanos: this.nanos.toInt(),
        };
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITimestamp} timestamp
     * @returns {Timestamp}
     */
    static _fromProtobuf(timestamp) {
        return new Timestamp(
            timestamp.seconds instanceof Long
                ? timestamp.seconds.toInt()
                : timestamp.seconds != null
                ? timestamp.seconds
                : 0,

            timestamp.nanos != null ? timestamp.nanos : 0,
        );
    }

    /**
     * @returns {string}
     */
    toString() {
        const zeroPaddedNanos = String(this.nanos).padStart(9, "0");
        return `${this.seconds.toString()}.${zeroPaddedNanos}`;
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
