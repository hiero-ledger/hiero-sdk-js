// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("../Hbar.js").default} Hbar
 */

/**
 * Read-only HBAR balance returned by `MirrorNodeAccountBalanceQuery`.
 *
 * Token balances are deliberately not included: the mirror node balances
 * endpoint does not paginate them, and fetching a full token portfolio
 * would require unbounded pagination against the mirror node. Use the
 * mirror node token endpoints directly if token balances are needed.
 */
export default class MirrorNodeAccountBalance {
    /**
     * @param {object} props
     * @param {Hbar} props.hbars
     */
    constructor(props) {
        /**
         * The HBAR balance of the account.
         *
         * @readonly
         */
        this.hbars = props.hbars;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.hbars.toString();
    }
}
