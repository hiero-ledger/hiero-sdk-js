// SPDX-License-Identifier: Apache-2.0

import IPv4AddressPart from "./IPv4AddressPart.js";

export default class IPv4Address {
    /**
     * @param {object} props
     * @param {IPv4AddressPart} [props.network]
     * @param {IPv4AddressPart} [props.host]
     */
    constructor(props = {}) {
        /**
         * @type {IPv4AddressPart | null}
         */
        this._network = null;

        if (props.network != null) {
            this.setNetwork(props.network);
        }

        /**
         * @type {IPv4AddressPart | null}
         */
        this._host = null;

        if (props.host != null) {
            this.setHost(props.host);
        }
    }

    /**
     * @returns {?IPv4AddressPart}
     */
    get newtork() {
        return this._network;
    }

    /**
     * @param {IPv4AddressPart} part
     * @returns {this}
     */
    setNetwork(part) {
        this._network = part;
        return this;
    }

    /**
     * @returns {?IPv4AddressPart}
     */
    get host() {
        return this._host;
    }

    /**
     * @param {IPv4AddressPart} part
     * @returns {this}
     */
    setHost(part) {
        this._host = part;
        return this;
    }

    /**
     * @internal
     * @param {Uint8Array} bytes
     * @returns {IPv4Address}
     */
    static _fromProtobuf(bytes) {
        return new IPv4Address({
            network: new IPv4AddressPart().setLeft(bytes[0]).setRight(bytes[1]),
            host: new IPv4AddressPart().setLeft(bytes[2]).setRight(bytes[3]),
        });
    }

    /**
     * @returns {Uint8Array}
     */
    _toProtobuf() {
        return Uint8Array.of(
            this._network != null && this._network._left != null
                ? this._network._left
                : 0,
            this._network != null && this._network.right != null
                ? this._network.right
                : 0,
            this._host != null && this._host.left != null ? this._host.left : 0,
            this._host != null && this._host.right != null
                ? this._host.right
                : 0,
        );
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this._network != null && this._host != null) {
            return `${this._network.toString()}.${this._host.toString()}`;
        } else {
            return "";
        }
    }
}
