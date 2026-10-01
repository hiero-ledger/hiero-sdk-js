/**
 * Signals that a key could not be realized from the input.
 */
export default class BadKeyError extends Error {
    /**
     * @param {Error | string} messageOrCause
     */
    constructor(messageOrCause) {
        super(
            messageOrCause instanceof Error
                ? messageOrCause.message
                : messageOrCause,
        );

        this.name = "BadKeyError";

        if (messageOrCause instanceof Error) {
            /** @type {Error=} */
            this.cause = messageOrCause;
            if (messageOrCause.stack !== undefined) {
                // Cast so tsc keeps `Error.stack` inherited and optional.
                /** @type {Error} */ (this).stack = messageOrCause.stack;
            }
        }
    }
}
