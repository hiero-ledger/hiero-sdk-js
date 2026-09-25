// SPDX-License-Identifier: Apache-2.0

/**
 * HTTP statuses a mirror node REST call is retried on. The set is data
 * rather than a rule like "5xx": `501`, `505` and the other 5xx statuses
 * describe a server that will answer identically next time.
 */
export const DEFAULT_RETRYABLE_STATUS_CODES = Object.freeze([
    408, 429, 500, 502, 503, 504,
]);

export const DEFAULT_MAX_ATTEMPTS = 5;
export const DEFAULT_PER_ATTEMPT_TIMEOUT = 30 * 1000;
export const DEFAULT_INITIAL_BACKOFF = 250;
export const DEFAULT_MAX_BACKOFF = 8 * 1000;

/**
 * Attempt budget on a loopback mirror base URL: a mirror node that is still
 * starting under a local test harness is not a flaky request, and with
 * `maxBackoff` at 8 s roughly fifteen attempts cover a 90 s startup.
 */
export const LOCAL_MAX_ATTEMPTS = 15;
export const LOCAL_TOTAL_DEADLINE = 90 * 1000;

/**
 * How a mirror node REST call is retried and bounded.
 *
 * This is a value, not client state: it is resolved per call as package
 * default, then the `Client`'s policy, then any per-query setter, and is
 * carried into the call by value. It is separate from the gRPC retry knobs
 * on `Client` (`maxAttempts`, `minBackoff`, `maxBackoff`), which govern
 * consensus node requests only and are never aliased onto HTTP.
 *
 * Every field has a default, and no construction path yields a partially
 * defaulted instance: `new MirrorNodeHttpRetryPolicy({ maxAttempts: 3 })`
 * keeps every other field at its default. Derive a changed copy from an
 * existing value with `new MirrorNodeHttpRetryPolicy({ ...policy, maxAttempts: 3 })`.
 *
 * On a loopback mirror base URL (`localhost`, `127.0.0.1`) the package
 * default is `maxAttempts: 15` and `totalDeadline: 90000`, so a mirror node
 * still starting under a local test harness is waited for. An explicit
 * policy set on the client overrides that as it would anywhere else.
 */
export default class MirrorNodeHttpRetryPolicy {
    /**
     * @param {object} [props]
     * @param {number} [props.maxAttempts] - attempts per request (one
     * initial request plus up to `maxAttempts - 1` retries), counted afresh
     * for every page of a paginated call. Default 5, minimum 1.
     * @param {number} [props.perAttemptTimeout] - bound on one attempt, end
     * to end, in milliseconds. Default 30 s. `0` means no per-attempt cap;
     * the total bound still applies.
     * @param {number} [props.totalDeadline] - bound on the whole call, every
     * page and every backoff included, in milliseconds. `0` (the default)
     * inherits `Client.requestTimeout`.
     * @param {number} [props.initialBackoff] - base of the exponential
     * backoff in milliseconds, default 250. With full jitter the wait before
     * retry `n` is drawn uniformly from `[0, min(maxBackoff, initialBackoff * 2^n))`,
     * so this is not a floor.
     * @param {number} [props.maxBackoff] - cap on the computed backoff in
     * milliseconds, default 8 s. A `Retry-After` header is bounded by the
     * remaining total deadline instead, never by this.
     * @param {readonly number[]} [props.retryableStatusCodes] - default
     * `[408, 429, 500, 502, 503, 504]`.
     */
    constructor(props = {}) {
        const maxAttempts = props.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
        if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
            throw new RangeError(
                `MirrorNodeHttpRetryPolicy.maxAttempts must be an integer >= 1, got ${String(
                    maxAttempts,
                )}`,
            );
        }

        const perAttemptTimeout =
            props.perAttemptTimeout ?? DEFAULT_PER_ATTEMPT_TIMEOUT;
        const totalDeadline = props.totalDeadline ?? 0;
        const initialBackoff = props.initialBackoff ?? DEFAULT_INITIAL_BACKOFF;
        const maxBackoff = props.maxBackoff ?? DEFAULT_MAX_BACKOFF;

        for (const [name, value] of [
            ["perAttemptTimeout", perAttemptTimeout],
            ["totalDeadline", totalDeadline],
            ["initialBackoff", initialBackoff],
            ["maxBackoff", maxBackoff],
        ]) {
            if (
                typeof value !== "number" ||
                !Number.isFinite(value) ||
                value < 0
            ) {
                throw new RangeError(
                    `MirrorNodeHttpRetryPolicy.${String(
                        name,
                    )} must be a non-negative number of milliseconds, got ${String(
                        value,
                    )}`,
                );
            }
        }

        /** @type {unknown} */
        const rawStatusCodes =
            props.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
        if (!Array.isArray(rawStatusCodes)) {
            throw new RangeError(
                "MirrorNodeHttpRetryPolicy.retryableStatusCodes must be a list of HTTP status codes",
            );
        }
        /** @type {readonly number[]} */
        const retryableStatusCodes = /** @type {readonly number[]} */ (
            rawStatusCodes
        );
        for (const code of retryableStatusCodes) {
            if (!Number.isInteger(code) || code < 100 || code > 599) {
                throw new RangeError(
                    `MirrorNodeHttpRetryPolicy.retryableStatusCodes must be a list of HTTP status codes, got ${String(
                        code,
                    )}`,
                );
            }
        }

        /**
         * @readonly
         * @type {number}
         */
        this.maxAttempts = maxAttempts;

        /**
         * @readonly
         * @type {number}
         */
        this.perAttemptTimeout = perAttemptTimeout;

        /**
         * @readonly
         * @type {number}
         */
        this.totalDeadline = totalDeadline;

        /**
         * @readonly
         * @type {number}
         */
        this.initialBackoff = initialBackoff;

        /**
         * @readonly
         * @type {number}
         */
        this.maxBackoff = maxBackoff;

        /**
         * @readonly
         * @type {readonly number[]}
         */
        this.retryableStatusCodes = Object.freeze([
            ...new Set(retryableStatusCodes),
        ]);

        Object.freeze(this);
    }

    /**
     * The package default policy.
     *
     * @returns {MirrorNodeHttpRetryPolicy}
     */
    static get DEFAULT() {
        return DEFAULT_POLICY;
    }

    /**
     * The default policy for a loopback mirror base URL: `maxAttempts: 15`
     * and `totalDeadline: 90000`, every other field unchanged.
     *
     * @returns {MirrorNodeHttpRetryPolicy}
     */
    static get LOCAL_DEFAULT() {
        return LOCAL_DEFAULT_POLICY;
    }

    /**
     * @param {MirrorNodeHttpRetryPolicy | ConstructorParameters<typeof MirrorNodeHttpRetryPolicy>[0] | null | undefined} value
     * @returns {MirrorNodeHttpRetryPolicy}
     */
    static from(value) {
        return value instanceof MirrorNodeHttpRetryPolicy
            ? value
            : new MirrorNodeHttpRetryPolicy(value ?? {});
    }

    /**
     * @param {number} statusCode
     * @returns {boolean}
     */
    isRetryableStatus(statusCode) {
        return this.retryableStatusCodes.includes(statusCode);
    }

    /**
     * @param {MirrorNodeHttpRetryPolicy} other
     * @returns {boolean}
     */
    equals(other) {
        return (
            this.maxAttempts === other.maxAttempts &&
            this.perAttemptTimeout === other.perAttemptTimeout &&
            this.totalDeadline === other.totalDeadline &&
            this.initialBackoff === other.initialBackoff &&
            this.maxBackoff === other.maxBackoff &&
            this.retryableStatusCodes.length ===
                other.retryableStatusCodes.length &&
            this.retryableStatusCodes.every((code) =>
                other.retryableStatusCodes.includes(code),
            )
        );
    }
}

const DEFAULT_POLICY = new MirrorNodeHttpRetryPolicy();
const LOCAL_DEFAULT_POLICY = new MirrorNodeHttpRetryPolicy({
    maxAttempts: LOCAL_MAX_ATTEMPTS,
    totalDeadline: LOCAL_TOTAL_DEADLINE,
});
