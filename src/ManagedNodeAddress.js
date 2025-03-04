// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./channel/Channel.js").default} Channel
 * @typedef {import("./channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("./address_book/NodeAddress.js").default} NodeAddress
 */

export const HOST_AND_PORT = /^(\S+):(\d+)$/;

export default class ManagedNodeAddress {
    /**
     * @param {object} props
     * @param {string} [props.address]
     * @param {string} [props.host]
     * @param {number | null} [props.port]
     */
    constructor(props = {}) {
        if (props.address != null) {
            const hostAndPortResult = HOST_AND_PORT.exec(props.address);

            if (hostAndPortResult == null) {
                throw new Error(`failed to parse address: ${props.address}`);
            }

            /** @type {string} */
            this._address = /** @type {string} */ (hostAndPortResult[1]);

            /** @type {number | null} */
            this._port =
                hostAndPortResult[2] != null
                    ? parseInt(/** @type {string }*/ (hostAndPortResult[2]))
                    : null;
        } else if (props.host != null && props.port != null) {
            /** @type {string} */
            this._address = props.host;

            /** @type {number | null} */
            this._port = props.port;
        } else {
            throw new Error(
                `failed to create a managed node address: ${JSON.stringify(
                    props,
                )}`,
            );
        }

        Object.freeze(this);
    }

    /**
     * @param {string} address
     * @returns {ManagedNodeAddress};
     */
    static fromString(address) {
        return new ManagedNodeAddress({ address });
    }

    toInsecure() {
        let port = this.port === 50212 ? 50211 : this.port;
        return new ManagedNodeAddress({ host: this.address, port });
    }

    toSecure() {
        let port = this.port === 50211 ? 50212 : this.port;
        return new ManagedNodeAddress({ host: this.address, port });
    }

    /**
     * @returns {string}
     */
    get address() {
        return this._address;
    }

    /**
     * @returns {number | null}
     */
    get port() {
        return this._port;
    }

    /**
     * @returns {boolean}
     */
    isTransportSecurity() {
        return this._port == 50212 || this._port == 443;
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.port == null) {
            return this.address;
        } else {
            return `${this.address}:${this.port}`;
        }
    }
}
