// SPDX-License-Identifier: Apache-2.0

/**
 * Header normalization shared by `HttpRequest` and `HttpResponse`.
 *
 * Header names are ASCII-lowercased on both sides of an exchange, and
 * comparison is byte equality after lowercasing. The same wire header
 * otherwise produces three different keys: Go canonicalises to
 * `Retry-After`, Node and every browser lowercase to `retry-after`, and
 * HTTP/2 lowercases every name on the wire while HTTP/1.1 does not.
 */

/**
 * Lowercase the names of a single-valued request header map.
 *
 * @param {Record<string, string> | null | undefined} headers
 * @returns {Record<string, string>}
 */
export function normalizeRequestHeaders(headers) {
    // A null prototype, so a header named `constructor` or `__proto__`
    // is an ordinary key rather than an inherited property.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const normalized = /** @type {Record<string, string>} */ (
        Object.create(null)
    );

    if (headers == null) {
        return normalized;
    }

    for (const [name, value] of Object.entries(headers)) {
        if (name.length === 0) {
            throw new TypeError("header names must be non-empty strings");
        }
        if (typeof value !== "string") {
            throw new TypeError(`header "${name}" must be a string`);
        }
        normalized[name.toLowerCase()] = value;
    }

    return normalized;
}

/**
 * Lowercase the names of a response header collection and make every
 * value a list, so a repeated header keeps every value.
 *
 * Accepts a plain object whose values are a string or a list of strings,
 * or any iterable of `[name, value]` pairs such as a fetch `Headers`
 * object or Node's `rawHeaders` grouped into pairs.
 *
 * @param {Record<string, string | string[]> | Iterable<[string, string]> | null | undefined} headers
 * @returns {Record<string, string[]>}
 */
export function normalizeResponseHeaders(headers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const normalized = /** @type {Record<string, string[]>} */ (
        Object.create(null)
    );

    if (headers == null) {
        return normalized;
    }

    /**
     * @param {string} name
     * @param {string} value
     */
    const add = (name, value) => {
        const key = name.toLowerCase();
        const values = normalized[key];
        if (values === undefined) {
            normalized[key] = [String(value)];
        } else {
            values.push(String(value));
        }
    };

    if (
        typeof (
            /** @type {Iterable<[string, string]>} */ (headers)[Symbol.iterator]
        ) === "function"
    ) {
        for (const [name, value] of /** @type {Iterable<[string, string]>} */ (
            headers
        )) {
            add(name, value);
        }
        return normalized;
    }

    for (const [name, value] of Object.entries(
        /** @type {Record<string, string | string[]>} */ (headers),
    )) {
        if (Array.isArray(value)) {
            for (const entry of value) {
                add(name, entry);
            }
        } else {
            add(name, value);
        }
    }

    return normalized;
}

/**
 * Freeze a header map and its lists so a transport or a caller cannot
 * alter a request or response after the fact.
 *
 * @template {Record<string, string> | Record<string, string[]>} T
 * @param {T} headers
 * @returns {Readonly<T>}
 */
export function freezeHeaders(headers) {
    for (const value of Object.values(headers)) {
        if (Array.isArray(value)) {
            Object.freeze(value);
        }
    }
    return Object.freeze(headers);
}
