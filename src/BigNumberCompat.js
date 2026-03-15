// SPDX-License-Identifier: Apache-2.0

/**
 * BigNumber compatibility shim backed by native BigInt.
 *
 * Provides the subset of the bignumber.js public API used by this SDK so that
 * consumers experience no breaking changes, while the internal implementation
 * no longer depends on the bignumber.js package.
 *
 * Values are stored as a reduced rational number { _num: bigint, _den: bigint }
 * so that fractional arithmetic (e.g. unit conversions like tinybar→hbar) is
 * exact without floating-point error.
 */

/**
 * Euclidean GCD (always returns a positive value).
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a === 0n ? 1n : a;
}

/**
 * Format a rational number (num/den, den > 0) as a decimal string.
 * @param {bigint} num
 * @param {bigint} den  must be positive
 * @returns {string}
 */
function fracToDecString(num, den) {
    const negative = num < 0n;
    const absNum = negative ? -num : num;
    const intPart = absNum / den;
    const remainder = absNum % den;

    if (remainder === 0n) {
        return (negative ? "-" : "") + intPart.toString();
    }

    // Compute up to 20 decimal digits
    let decStr = "";
    let rem = remainder;
    while (rem !== 0n && decStr.length < 20) {
        rem *= 10n;
        decStr += (rem / den).toString();
        rem %= den;
    }

    return (negative ? "-" : "") + intPart.toString() + "." + decStr;
}

/**
 * Parse a decimal string (e.g. "1.5", "-3.14") into a {num, den} pair.
 * @param {string} str
 * @returns {{ num: bigint, den: bigint }}
 */
function parseDecString(str) {
    const dotIdx = str.indexOf(".");
    if (dotIdx === -1) {
        return { num: BigInt(str), den: 1n };
    }
    const decimals = str.length - dotIdx - 1;
    const den = 10n ** BigInt(decimals);
    const num = BigInt(str.replace(".", ""));
    const g = gcd(num < 0n ? -num : num, den);
    return { num: num / g, den: den / g };
}

export default class BigNumberCompat {
    /**
     * @param {bigint | number | string | BigNumberCompat | object} value
     * @param {number} [radix]
     */
    constructor(value, radix = 10) {
        /** @type {bigint} */
        this._num = 0n;
        /** @type {bigint} */
        this._den = 1n;

        if (value instanceof BigNumberCompat) {
            this._num = value._num;
            this._den = value._den;
            return;
        }

        if (typeof value === "bigint") {
            this._num = value;
            return;
        }

        if (typeof value === "number") {
            if (Number.isInteger(value)) {
                this._num = BigInt(value);
            } else {
                const { num, den } = parseDecString(value.toString());
                this._num = num;
                this._den = den;
            }
            return;
        }

        if (typeof value === "string") {
            const str = value.trim();
            if (radix === 16) {
                this._num = BigInt("0x" + str);
                return;
            }
            const { num, den } = parseDecString(str);
            this._num = num;
            this._den = den;
            return;
        }

        // Duck-type: Long, legacy BigNumber, or any .toString()-able object
        if (typeof value === "object" && value !== null) {
            const asStr = /** @type {any} */ (value).toString();
            const { num, den } = parseDecString(asStr);
            this._num = num;
            this._den = den;
            return;
        }

        throw new TypeError(
            `Cannot construct BigNumberCompat from ${typeof value}`,
        );
    }

    // ── Static helpers ────────────────────────────────────────────────────────

    /**
     * Returns true for BigNumberCompat instances AND for legacy bignumber.js
     * objects (duck-typed by the presence of toFixed + isNegative methods).
     * @param {any} value
     * @returns {boolean}
     */
    static isBigNumber(value) {
        if (value instanceof BigNumberCompat) return true;
        return (
            typeof value === "object" &&
            value !== null &&
            typeof value.toFixed === "function" &&
            typeof value.isNegative === "function"
        );
    }

    /** Bignumber.js ROUND_DOWN constant (value ignored by integerValue). */
    static get ROUND_DOWN() {
        return 1;
    }

    /**
     * @param {bigint} num
     * @param {bigint} den
     * @returns {BigNumberCompat}
     */
    static _fromFraction(num, den) {
        if (den === 0n) throw new RangeError("Division by zero");
        if (den < 0n) {
            num = -num;
            den = -den;
        }
        const g = gcd(num < 0n ? -num : num, den);
        const result = new BigNumberCompat(0n);
        result._num = num / g;
        result._den = den / g;
        return result;
    }

    // ── Private coercion ──────────────────────────────────────────────────────

    /**
     * @param {BigNumberCompat | number | string | bigint | object} other
     * @returns {BigNumberCompat}
     */
    _coerce(other) {
        return other instanceof BigNumberCompat
            ? other
            : new BigNumberCompat(/** @type {any} */ (other));
    }

    // ── Arithmetic ────────────────────────────────────────────────────────────

    /** @param {BigNumberCompat | number | string | bigint} other */
    multipliedBy(other) {
        const o = this._coerce(other);
        return BigNumberCompat._fromFraction(
            this._num * o._num,
            this._den * o._den,
        );
    }

    /** Alias for multipliedBy. */
    times(other) {
        return this.multipliedBy(other);
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    dividedBy(other) {
        const o = this._coerce(other);
        return BigNumberCompat._fromFraction(
            this._num * o._den,
            this._den * o._num,
        );
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    dividedToIntegerBy(other) {
        const o = this._coerce(other);
        // Compute floor(this / other) using cross-multiplication
        let num = this._num * o._den;
        let den = this._den * o._num;
        if (den < 0n) {
            num = -num;
            den = -den;
        }
        const result = new BigNumberCompat(0n);
        result._num = num / den;
        result._den = 1n;
        return result;
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    plus(other) {
        const o = this._coerce(other);
        return BigNumberCompat._fromFraction(
            this._num * o._den + o._num * this._den,
            this._den * o._den,
        );
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    minus(other) {
        const o = this._coerce(other);
        return BigNumberCompat._fromFraction(
            this._num * o._den - o._num * this._den,
            this._den * o._den,
        );
    }

    negated() {
        const result = new BigNumberCompat(0n);
        result._num = -this._num;
        result._den = this._den;
        return result;
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    modulo(other) {
        const o = this._coerce(other);
        const divided = this.dividedToIntegerBy(o);
        return this.minus(divided.multipliedBy(o));
    }

    /** Alias for modulo. */
    mod(other) {
        return this.modulo(other);
    }

    /** @param {number | bigint} exp */
    pow(exp) {
        const e = typeof exp === "bigint" ? exp : BigInt(exp);
        if (e < 0n) throw new RangeError("Negative exponent not supported");
        return BigNumberCompat._fromFraction(this._num ** e, this._den ** e);
    }

    /**
     * Returns the integer part (truncates toward zero).
     * The roundingMode argument is accepted for API compatibility but ignored.
     * @param {number} [_roundingMode]
     * @returns {BigNumberCompat}
     */
    integerValue(_roundingMode) {
        const result = new BigNumberCompat(0n);
        result._num = this._num / this._den;
        result._den = 1n;
        return result;
    }

    // ── Comparisons ───────────────────────────────────────────────────────────

    isNegative() {
        return this._num < 0n;
    }

    isInteger() {
        return this._den === 1n;
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    isLessThan(other) {
        const o = this._coerce(other);
        return this._num * o._den < o._num * this._den;
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    isGreaterThan(other) {
        const o = this._coerce(other);
        return this._num * o._den > o._num * this._den;
    }

    /** @param {BigNumberCompat | number | string | bigint} other */
    isEqualTo(other) {
        const o = this._coerce(other);
        return this._num * o._den === o._num * this._den;
    }

    // ── Conversion ────────────────────────────────────────────────────────────

    /**
     * @param {number} [radix]
     * @returns {string}
     */
    toString(radix = 10) {
        if (this._den === 1n) {
            return this._num.toString(radix);
        }
        if (radix !== 10) {
            // Non-decimal radix: return integer part only (sufficient for hex encoding)
            return (this._num / this._den).toString(radix);
        }
        return fracToDecString(this._num, this._den);
    }

    /**
     * Returns a plain decimal string (no scientific notation).
     * For integers returns the integer string; for fractions returns the full decimal.
     * @returns {string}
     */
    toFixed() {
        if (this._den === 1n) {
            return this._num.toString();
        }
        return fracToDecString(this._num, this._den);
    }

    /**
     * @returns {number}
     */
    toNumber() {
        if (this._den === 1n) {
            return Number(this._num);
        }
        return Number(this._num) / Number(this._den);
    }
}
