// SPDX-License-Identifier: Apache-2.0

export default class HttpStatus {
    /**
     * @hideconstructor
     * @internal
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {number} code
     * @returns {HttpStatus}
     */
    static _fromValue(code) {
        return new HttpStatus(code);
    }

    /**
     * @returns {string}
     */
    toString() {
        return this._code.toString();
    }

    /**
     * @returns {number}
     */
    valueOf() {
        return this._code;
    }
}
