// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("../token/TokenId.js").default} TokenId
 * @typedef {import("long")} Long
 */

/**
 * Read-only token balance returned by `MirrorNodeTokenBalanceQuery`.
 *
 * Carries the decimals alongside the raw balance because the balance is
 * denominated in the token's smallest unit: a `balance` of `1234` with
 * `decimals` of `2` represents `12.34` of the token.
 */
export default class MirrorNodeTokenBalance {
    /**
     * @param {object} props
     * @param {TokenId} props.tokenId
     * @param {Long} props.balance
     * @param {number} props.decimals
     */
    constructor(props) {
        /**
         * The token this balance is for.
         *
         * @readonly
         */
        this.tokenId = props.tokenId;

        /**
         * The balance in the token's smallest denomination.
         *
         * @readonly
         */
        this.balance = props.balance;

        /**
         * The number of decimal places the token is divided into.
         *
         * @readonly
         */
        this.decimals = props.decimals;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.tokenId.toString()}: ${this.balance.toString()} (${
            this.decimals
        } decimals)`;
    }
}
