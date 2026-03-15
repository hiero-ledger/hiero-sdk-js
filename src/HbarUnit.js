// SPDX-License-Identifier: Apache-2.0

/**
 * Represents a unit of HBAR currency measurement in the Hedera network.
 * Defines the various denominations of HBAR (tinybar, microbar, millibar, hbar, kilobar, megabar, gigabar)
 * and provides utilities for converting between these units. Each unit has a name, symbol, and conversion
 * rate to tinybar (the smallest unit of HBAR).
 */
export default class HbarUnit {
    /**
     * @internal
     * @param {string} name
     * @param {string} symbol
     * @param {bigint} tinybar
     */
    constructor(name, symbol, tinybar) {
        /**
         * @internal
         * @readonly
         */
        this._name = name;

        /**
         * @internal
         * @readonly
         */
        this._symbol = symbol;

        /**
         * @internal
         * @readonly
         */
        this._tinybar = tinybar;

        Object.freeze(this);
    }

    /**
     * @param {string} unit
     * @returns {HbarUnit}
     */
    static fromString(unit) {
        switch (unit) {
            case HbarUnit.Hbar._symbol:
                return HbarUnit.Hbar;
            case HbarUnit.Tinybar._symbol:
                return HbarUnit.Tinybar;
            case HbarUnit.Microbar._symbol:
                return HbarUnit.Microbar;
            case HbarUnit.Millibar._symbol:
                return HbarUnit.Millibar;
            case HbarUnit.Kilobar._symbol:
                return HbarUnit.Kilobar;
            case HbarUnit.Megabar._symbol:
                return HbarUnit.Megabar;
            case HbarUnit.Gigabar._symbol:
                return HbarUnit.Gigabar;
            default:
                throw new Error("Unknown unit.");
        }
    }
}

HbarUnit.Tinybar = new HbarUnit("tinybar", "tℏ", 1n);

HbarUnit.Microbar = new HbarUnit("microbar", "μℏ", 100n);

HbarUnit.Millibar = new HbarUnit("millibar", "mℏ", 100000n);

HbarUnit.Hbar = new HbarUnit("hbar", "ℏ", 100000000n);

HbarUnit.Kilobar = new HbarUnit("kilobar", "kℏ", 100000000000n);

HbarUnit.Megabar = new HbarUnit("megabar", "Mℏ", 100000000000000n);

HbarUnit.Gigabar = new HbarUnit("gigabar", "Gℏ", 100000000000000000n);
