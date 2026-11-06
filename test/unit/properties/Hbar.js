// SPDX-License-Identifier: Apache-2.0

import fc from "fast-check";
import Hbar from "../../../src/Hbar.js";
import HbarUnit from "../../../src/HbarUnit.js";

/**
 * Any value an amount of tinybars can hold: a signed 64-bit integer.
 */
const int64 = fc.bigInt({ min: -(2n ** 63n), max: 2n ** 63n - 1n });

const unit = fc.constantFrom(
    HbarUnit.Tinybar,
    HbarUnit.Microbar,
    HbarUnit.Millibar,
    HbarUnit.Hbar,
    HbarUnit.Kilobar,
    HbarUnit.Megabar,
    HbarUnit.Gigabar,
);

// A retry runs with a new seed and could hide a failing property, so these
// tests never retry (the browser config sets `retry: 1`).
describe("Hbar properties", { retry: 0 }, function () {
    it("toTinybars() reads back what fromTinybars() writes", function () {
        fc.assert(
            fc.property(int64, (amount) => {
                const hbar = Hbar.fromTinybars(amount.toString());
                expect(hbar.toTinybars().toString()).to.equal(
                    amount.toString(),
                );
            }),
        );
    });

    it("from() reads back what to() writes for any unit", function () {
        fc.assert(
            fc.property(int64, unit, (amount, u) => {
                const hbar = Hbar.fromTinybars(amount.toString());
                const converted = Hbar.from(hbar.to(u), u);
                expect(converted.toTinybars().toString()).to.equal(
                    amount.toString(),
                );
            }),
        );
    });

    it("fromString() reads back what toString() writes", function () {
        fc.assert(
            fc.property(int64, (amount) => {
                const hbar = Hbar.fromTinybars(amount.toString());
                const parsed = Hbar.fromString(hbar.toString());
                expect(parsed.toTinybars().toString()).to.equal(
                    amount.toString(),
                );
            }),
        );
    });

    // Skipped until #4685 is fixed: toString(unit) can print exponent notation
    // (for example "1e-8 ℏ") that fromString() rejects.
    it.skip("fromString() reads back what toString(unit) writes for any unit", function () {
        fc.assert(
            fc.property(int64, unit, (amount, u) => {
                const hbar = Hbar.fromTinybars(amount.toString());
                const parsed = Hbar.fromString(hbar.toString(u));
                expect(parsed.toTinybars().toString()).to.equal(
                    amount.toString(),
                );
            }),
        );
    });
});
