// SPDX-License-Identifier: Apache-2.0

/** Lifecycle of a completed CLPR Channel returned by the mirror node. */
export default class ClprChannelStatus {
    /**
     * @internal
     * @param {string} name
     */
    constructor(name) {
        /** @readonly */
        this._name = name;
        Object.freeze(this);
    }

    /**
     * @internal
     * @param {unknown} name
     * @returns {ClprChannelStatus}
     */
    static _fromString(name) {
        switch (name) {
            case "ACTIVE":
                return ClprChannelStatus.ACTIVE;
            case "PAUSED":
                return ClprChannelStatus.PAUSED;
            case "CLOSING":
                return ClprChannelStatus.CLOSING;
            case "DRAINED":
                return ClprChannelStatus.DRAINED;
            case "CLOSED":
                return ClprChannelStatus.CLOSED;
            default:
                throw new Error(
                    `unrecognized CLPR Channel status: ${String(name)}`,
                );
        }
    }

    /** @returns {string} */
    toString() {
        return this._name;
    }
}

ClprChannelStatus.ACTIVE = new ClprChannelStatus("ACTIVE");
ClprChannelStatus.PAUSED = new ClprChannelStatus("PAUSED");
ClprChannelStatus.CLOSING = new ClprChannelStatus("CLOSING");
ClprChannelStatus.DRAINED = new ClprChannelStatus("DRAINED");
ClprChannelStatus.CLOSED = new ClprChannelStatus("CLOSED");
