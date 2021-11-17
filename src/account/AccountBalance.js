import Long from "long";
import Hbar from "../Hbar.js";
import TokenId from "../token/TokenId.js";
import TokenBalanceMap from "./TokenBalanceMap.js";
import TokenDecimalMap from "./TokenDecimalMap.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITimestamp} proto.ITimestamp
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 * @typedef {import("@exodus/hashgraph-proto").ICryptoGetAccountBalanceResponse} proto.ICryptoGetAccountBalanceResponse
 * @typedef {import("@exodus/hashgraph-proto").IKey} proto.IKey
 * @typedef {import("@exodus/hashgraph-proto").ITokenID} proto.ITokenID
 * @typedef {import("@exodus/hashgraph-proto").ITokenBalance} proto.ITokenBalance
 */

/**
 * @typedef {object} TokenBalanceJson
 * @property {string} tokenId
 * @property {string} balance
 * @property {number} decimals
 */

/**
 * @typedef {object} AccountBalanceJson
 * @property {string} hbars
 * @property {TokenBalanceJson[]} tokens
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 */

export default class AccountBalance {
    /**
     * @private
     * @param {object} props
     * @param {Hbar} props.hbars
     * @param {?TokenBalanceMap} props.tokens
     * @param {?TokenDecimalMap} props.tokenDecimals
     */
    constructor(props) {
        /**
         * The account ID for which this balancermation applies.
         *
         * @readonly
         */
        this.hbars = props.hbars;

        /** @readonly */
        this.tokens = props.tokens;

        /** @readonly */
        this.tokenDecimals = props.tokenDecimals;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.ICryptoGetAccountBalanceResponse} accountBalance
     * @returns {AccountBalance}
     */
    static _fromProtobuf(accountBalance) {
        const tokenBalances = new TokenBalanceMap();
        const tokenDecimals = new TokenDecimalMap();

        if (accountBalance.tokenBalances != null) {
            for (const balance of accountBalance.tokenBalances) {
                const tokenId = TokenId._fromProtobuf(
                    /** @type {proto.ITokenID} */ (balance.tokenId)
                );

                tokenDecimals._set(
                    tokenId,
                    balance.decimals != null ? balance.decimals : 0
                );
                tokenBalances._set(
                    tokenId,
                    Long.fromValue(/** @type {Long} */ (balance.balance))
                );
            }
        }

        return new AccountBalance({
            hbars: Hbar.fromTinybars(
                /** @type {Long} */ (accountBalance.balance)
            ),
            tokens: tokenBalances,
            tokenDecimals,
        });
    }

    /**
     * @returns {proto.ICryptoGetAccountBalanceResponse}
     */
    _toProtobuf() {
        /** @type {proto.ITokenBalance[]} */
        const list = [];

        for (const [key, value] of this.tokens != null ? this.tokens : []) {
            list.push({
                tokenId: key._toProtobuf(),
                balance: value,
                decimals:
                    this.tokenDecimals != null
                        ? this.tokenDecimals.get(key)
                        : null,
            });
        }

        return {
            balance: this.hbars.toTinybars(),
            tokenBalances: list,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @returns {AccountBalanceJson}
     */
    toJSON() {
        const tokens = [];
        for (const [key, value] of this.tokens != null ? this.tokens : []) {
            const decimals =
                this.tokenDecimals != null ? this.tokenDecimals.get(key) : null;

            tokens.push({
                tokenId: key.toString(),
                balance: value.toString(),
                decimals: decimals != null ? decimals : 0,
            });
        }

        return {
            hbars: this.hbars.toString(),
            tokens,
        };
    }
}
