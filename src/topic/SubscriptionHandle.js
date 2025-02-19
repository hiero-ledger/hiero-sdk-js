// SPDX-License-Identifier: Apache-2.0

/**
 * Represents a handle for managing subscriptions to topics in the Hedera network.
 *
 * The `SubscriptionHandle` class provides methods to manage the lifecycle of a subscription,
 * including setting a callback function to be executed when an event occurs and unsubscribing
 * from the topic notifications. It is primarily used for handling real-time updates from the
 * Hedera network like topic subscriptions.
 */
export default class SubscriptionHandle {
    constructor() {
        /** @type {{(): void} | null} */
        this._call = null;

        /** @type {boolean} */
        this._unsubscribed = false;
    }

    /**
     * @param {() => void} call
     * @returns {void}
     */
    _setCall(call) {
        this._call = call;
    }

    unsubscribe() {
        if (this._call != null) {
            this._unsubscribed = true;
            this._call();
        }
    }
}
