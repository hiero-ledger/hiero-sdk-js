// SPDX-License-Identifier: Apache-2.0

/**
 * The JavaScript binding of the cross-SDK cancellation types: a
 * `Cancellation` is an `AbortSignal`, a `CancellationSource` is an
 * `AbortController`, and a `CancellationRegistration` is the
 * `removeEventListener` closure. Nothing here is new API; these helpers
 * only give the transports and the mirror node adapter one place to get a
 * never-cancelled signal and a cancellable sleep.
 */

/** @type {?AbortSignal} */
let NONE = null;

/**
 * The value for a call with no caller-supplied cancellation. It is a real
 * `AbortSignal` that never aborts, so a transport never has to handle
 * `null`.
 *
 * @returns {AbortSignal}
 */
export function noCancellation() {
    if (NONE == null) {
        NONE =
            typeof AbortController !== "undefined"
                ? new AbortController().signal
                : /** @type {AbortSignal} */ (
                      /** @type {unknown} */ ({
                          aborted: false,
                          reason: undefined,
                          onabort: null,
                          addEventListener() {},
                          removeEventListener() {},
                          dispatchEvent() {
                              return false;
                          },
                          throwIfAborted() {},
                      })
                  );
    }
    return NONE;
}

/**
 * The error an aborted signal carries, or a plain `AbortError` when the
 * runtime does not support abort reasons.
 *
 * @param {AbortSignal} signal
 * @returns {Error}
 */
export function abortReason(signal) {
    const reason = /** @type {unknown} */ (signal.reason);
    if (reason instanceof Error) {
        return reason;
    }
    const error = new Error(
        reason != null ? String(reason) : "This operation was aborted",
    );
    error.name = "AbortError";
    return error;
}

/**
 * Sleep for `ms` milliseconds unless one of `signals` aborts first, in
 * which case reject with that signal's reason. Every listener is released
 * when the sleep settles.
 *
 * @param {number} ms
 * @param {Array<AbortSignal | null | undefined>} signals
 * @returns {Promise<void>}
 */
export function cancellableSleep(ms, signals = []) {
    return new Promise((resolve, reject) => {
        const active = /** @type {AbortSignal[]} */ (
            signals.filter((signal) => signal != null)
        );

        for (const signal of active) {
            if (signal.aborted) {
                reject(abortReason(signal));
                return;
            }
        }

        /** @type {Array<[AbortSignal, () => void]>} */
        const registrations = [];

        const release = () => {
            clearTimeout(timer);
            for (const [signal, listener] of registrations) {
                signal.removeEventListener("abort", listener);
            }
        };

        const timer = setTimeout(() => {
            release();
            resolve();
        }, ms);

        for (const signal of active) {
            const listener = () => {
                release();
                reject(abortReason(signal));
            };
            signal.addEventListener("abort", listener);
            registrations.push([signal, listener]);
        }
    });
}
