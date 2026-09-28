import Long from "long";

/**
 * Builds a value shaped like a `Long` created by a second copy of the `long`
 * package: same fields and methods, but a prototype chain the SDK's own `Long`
 * does not recognise. `value instanceof Long` is `false` for it while
 * `Long.isLong(value)` is `true`, exactly like a `Long` coming from another
 * install of the package.
 *
 * @param {Long | number | string} value
 * @returns {Long}
 */
export function longFromOtherCopy(value) {
    const long = Long.fromValue(value);
    const prototype = Object.assign({}, Long.prototype);
    Object.defineProperty(prototype, "__isLong__", { value: true });

    return Object.assign(Object.create(prototype), {
        low: long.low,
        high: long.high,
        unsigned: long.unsigned,
    });
}
