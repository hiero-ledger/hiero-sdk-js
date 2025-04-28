/**
 * @param {Mocha.Context} this
 * @returns {number}
 */
export function getBackoffBasedOnAttempt() {
    const MIN_BACKOFF = 250;
    const MAX_BACKOFF = 16000;

    const attempt = this.currentTest.currentRetry();
    if (attempt === 0) {
        return 0;
    }

    return Math.min(MIN_BACKOFF * 2 ** attempt, MAX_BACKOFF);
}
