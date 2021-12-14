import ManagedNodeAddress from "./ManagedNodeAddress.js";

/**
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./channel/Channel.js").default} Channel
 * @typedef {import("./address_book/NodeAddress.js").default} NodeAddress
 */

/**
 * @template {Channel} ChannelT
 * @typedef {object} NewNode
 * @property {string | ManagedNodeAddress} address
 * @property {(address: string, cert?: string) => ChannelT} channelInitFunction
 */

/**
 * @template {Channel} ChannelT
 * @typedef {object} CloneNode
 * @property {ManagedNode<ChannelT>} node
 * @property {ManagedNodeAddress} address
 */

/**
 * @abstract
 * @template {Channel} ChannelT
 */
export default class ManagedNode {
    /**
     * @param {object} props
     * @param {NewNode<ChannelT>=} [props.newNode]
     * @param {CloneNode<ChannelT>=} [props.cloneNode]
     */
    constructor(props = {}) {
        if (props.newNode != null) {
            this._address =
                typeof props.newNode.address === "string"
                    ? ManagedNodeAddress.fromString(props.newNode.address)
                    : props.newNode.address;

            /** @type {string=} */
            this._cert = undefined;

            /** @type {ChannelT | null} */
            this._channel = null;

            /** @type {(address: string, cert?: string) => ChannelT} */
            this._channelInitFunction = props.newNode.channelInitFunction;

            this._currentBackoff = 250;
            this._lastUsed = Date.now();
            this._backoffUntil = Date.now();
            this._useCount = 0;
            this._attempts = 0;
            this._minBackoff = 250;
            this._maxBackoff = 8000;
        } else if (props.cloneNode != null) {
            /** @type {ManagedNodeAddress} */
            this._address = props.cloneNode.address;

            /** @type {string=} */
            this._cert = props.cloneNode.node._cert;

            /** @type {ChannelT | null} */
            this._channel = props.cloneNode.node._channel;

            /** @type {(address: string, cert?: string) => ChannelT} */
            this._channelInitFunction =
                props.cloneNode.node._channelInitFunction;

            /** @type {number} */
            this._currentBackoff = props.cloneNode.node._currentBackoff;

            /** @type {number} */
            this._lastUsed = props.cloneNode.node._lastUsed;

            /** @type {number} */
            this._backoffUntil = props.cloneNode.node._backoffUntil;

            /** @type {number} */
            this._useCount = props.cloneNode.node._useCount;

            /** @type {number} */
            this._attempts = props.cloneNode.node._attempts;

            /** @type {number} */
            this._minBackoff = props.cloneNode.node._minBackoff;

            /** @type {number} */
            this._maxBackoff = props.cloneNode.node._minBackoff;
        } else {
            throw new Error(
                `failed to create ManagedNode: ${JSON.stringify(props)}`
            );
        }
    }

    /**
     * @abstract
     * @returns {string}
     */
    // eslint-disable-next-line jsdoc/require-returns-check
    getKey() {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @returns {ManagedNode<ChannelT>}
     */
    // eslint-disable-next-line jsdoc/require-returns-check
    toInsecure() {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @returns {ManagedNode<ChannelT>}
     */
    // eslint-disable-next-line jsdoc/require-returns-check
    toSecure() {
        throw new Error("not implemented");
    }

    /**
     * @param {string} ledgerId
     * @returns {this}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setCert(ledgerId) {
        return this;
    }

    /**
     * @returns {ManagedNodeAddress}
     */
    get address() {
        return this._address;
    }

    /**
     * @returns {number}
     */
    get attempts() {
        return this._attempts;
    }

    /**
     * @returns {number}
     */
    get minBackoff() {
        return this._minBackoff;
    }

    /**
     * @param {number} minBackoff
     * @returns {this}
     */
    setMinBackoff(minBackoff) {
        if (this._currentBackoff <= minBackoff) {
            this._currentBackoff = minBackoff;
        }

        this._minBackoff = minBackoff;
        return this;
    }

    /**
     * @returns {number}
     */
    get maxBackoff() {
        return this._maxBackoff;
    }

    /**
     * @param {number} maxBackoff
     * @returns {this}
     */
    setmaxBackoff(maxBackoff) {
        if (this._currentBackoff <= maxBackoff) {
            this._currentBackoff = maxBackoff;
        }

        this._maxBackoff = maxBackoff;
        return this;
    }

    getChannel() {
        this._useCount++;
        this.__lastUsed = Date.now();

        if (this._channel != null) {
            return this._channel;
        }

        this._channel = this._channelInitFunction(
            this.address.toString(),
            this._cert
        );
        return this._channel;
    }

    /**
     * Determines if this node is healthy by checking if this node hasn't been
     * in use for a the required `_currentBackoff` period. Since this looks at `this._lastUsed`
     * and that value is only set in the `wait()` method, any node that has not
     * returned a bad gRPC status will always be considered healthy.
     *
     * @returns {boolean}
     */
    isHealthy() {
        return this._backoffUntil <= Date.now();
    }

    increaseDelay() {
        this._currentBackoff = Math.min(
            this._currentBackoff * 2,
            this._maxBackoff
        );
        this._backoffUntil = Date.now() + this._currentBackoff;
    }

    decreaseDelay() {
        this._currentBackoff = Math.max(
            this._currentBackoff / 2,
            this._minBackoff
        );
    }

    /**
     * This is only ever called if the node itself is down.
     * A node returning a transaction with a bad status code does not indicate
     * the node is down, and hence this method will not be called.
     *
     * @returns {Promise<void>}
     */
    wait() {
        const _currentBackoff = this._backoffUntil - this._lastUsed;
        return new Promise((resolve) => setTimeout(resolve, _currentBackoff));
    }

    /**
     * @param {ManagedNode<*>} node
     * @returns {number}
     */
    compare(node) {
        if (this.isHealthy() && node.isHealthy()) {
            if (this._useCount < node._useCount) {
                return -1;
            } else if (this._useCount > node._useCount) {
                return 1;
            } else {
                if (this._lastUsed < node._lastUsed) {
                    return -1;
                } else if (this._lastUsed > node._lastUsed) {
                    return 1;
                } else {
                    return 0;
                }
            }
        } else if (this.isHealthy() && !node.isHealthy()) {
            return -1;
        } else if (!this.isHealthy() && node.isHealthy()) {
            return 1;
        } else {
            if (this._useCount < node._useCount) {
                return -1;
            } else if (this._useCount > node._useCount) {
                return 1;
            } else {
                if (this._lastUsed < node._lastUsed) {
                    return -1;
                } else if (this._lastUsed > node._lastUsed) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }
    }

    close() {
        if (this._channel != null) {
            this._channel.close();
        }

        this._channel = null;
    }
}
