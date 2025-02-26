// SPDX-License-Identifier: Apache-2.0

export default class IPv4AddressPart {
    /**
     * @param {object} props
     * @param {number} [props.left]
     * @param {number} [props.right]
     */
    constructor(props = {}) {
        /**
         * @type {number | null}
         */
        this._left = null;

        if (props.left != null) {
            this.setLeft(props.left);
        }

        /**
         * @type {number | null}
         */
        this._right = null;

        if (props.right != null) {
            this.setRight(props.right);
        }
    }

    /**
     * @returns {?number}
     */
    get left() {
        return this._left;
    }

    /**
     * @param {number} part
     * @returns {this}
     */
    setLeft(part) {
        this._left = part;
        return this;
    }

    /**
     * @returns {?number}
     */
    get right() {
        return this._right;
    }

    /**
     * @param {number} part
     * @returns {this}
     */
    setRight(part) {
        this._right = part;
        return this;
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this._left != null && this._right != null) {
            return `${this._left.toString()}.${this._right.toString()}`;
        } else {
            return "";
        }
    }
}
