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
        this.stack = "";
        if (messageOrCause instanceof Error) {
            /** @type {Error=} */
            this.cause = messageOrCause;
            this.stack = messageOrCause.stack || this.stack || "";
        }
    }
}
