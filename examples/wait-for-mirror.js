// SPDX-License-Identifier: Apache-2.0

/**
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Build an error classifier for SDK errors that expose a `status` property.
 * Matching by status preserves compatibility across consensus- and
 * mirror-node error classes.
 *
 * @template T
 * @param {T} expectedStatus
 * @returns {(error: unknown) => boolean}
 */
export function retryOnStatus(expectedStatus) {
    return (error) =>
        typeof error === "object" &&
        error != null &&
        "status" in error &&
        error.status === expectedStatus;
}

/**
 * Poll a mirror-node read until it returns a non-null result.
 *
 * Callers express a stale result by returning `null`. Errors are propagated
 * unless `retryError` explicitly classifies them as an expected, temporary
 * ingestion condition.
 *
 * @template T
 * @param {(remainingMs: number) => Promise<T | null>} read
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.pollIntervalMs]
 * @param {(error: unknown) => boolean} [options.retryError]
 * @param {() => number} [options.now]
 * @param {(milliseconds: number) => Promise<void>} [options.sleep]
 * @returns {Promise<T>}
 */
export async function untilMirror(
    read,
    {
        timeoutMs = 60000,
        pollIntervalMs = 2000,
        retryError = () => false,
        now = Date.now,
        sleep: wait = sleep,
    } = {},
) {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
        throw new RangeError("timeoutMs must be a non-negative finite number");
    }
    if (!Number.isFinite(pollIntervalMs) || pollIntervalMs <= 0) {
        throw new RangeError("pollIntervalMs must be a positive finite number");
    }

    const deadline = now() + timeoutMs;
    /** @type {unknown} */
    let lastRetryableError;
    let firstAttempt = true;

    for (;;) {
        const remainingMs = Math.max(0, deadline - now());
        if (!firstAttempt && remainingMs === 0) {
            throw timeoutError(lastRetryableError);
        }
        firstAttempt = false;

        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let timeout;

        try {
            // Passing the remaining budget lets mirror queries cancel their
            // HTTP request. The race is still required for provider wrappers,
            // React Native fetch implementations without AbortSignal.timeout,
            // and callbacks that accidentally ignore the budget.
            /** @type {Promise<never>} */
            const deadlineReached = new Promise((_, reject) => {
                timeout = setTimeout(
                    () => reject(timeoutError(lastRetryableError)),
                    remainingMs,
                );
            });
            const result = await Promise.race([
                read(remainingMs),
                deadlineReached,
            ]);
            if (result != null) {
                return result;
            }
        } catch (error) {
            if (!retryError(error)) {
                throw error;
            }
            lastRetryableError = error;
        } finally {
            clearTimeout(timeout);
        }

        const delayMs = Math.min(pollIntervalMs, Math.max(0, deadline - now()));
        if (delayMs === 0) {
            throw timeoutError(lastRetryableError);
        }

        await wait(delayMs);
    }
}

/**
 * @param {unknown} lastRetryableError
 * @returns {Error}
 */
function timeoutError(lastRetryableError) {
    const detail =
        lastRetryableError == null
            ? ""
            : `; last retryable error: ${String(lastRetryableError)}`;
    return new Error(`mirror node did not ingest in time${detail}`);
}
