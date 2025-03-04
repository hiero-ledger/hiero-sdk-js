// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Hbar from "../Hbar.js";
import TokenId from "../token/TokenId.js";
import TokenBalanceMap from "./TokenBalanceMap.js";
import TokenDecimalMap from "./TokenDecimalMap.js";
import * as HieroProto from "@hashgraph/proto";

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
 * Represents the balance of an account on the Hedera network, including both HBAR and token balances.
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
         * The Hbar balance of the account
         *
         * @readonly
         */
        this.hbars = props.hbars;

        this.tokens = props.tokens;

        this.tokenDecimals = props.tokenDecimals;

        Object.freeze(this);
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {AccountBalance}
     */
    static fromBytes(bytes) {
        return AccountBalance._fromProtobuf(
            HieroProto.proto.CryptoGetAccountBalanceResponse.decode(bytes),
        );
    }

    /**
     * @internal
     * @param {HieroProto.proto.ICryptoGetAccountBalanceResponse} accountBalance
     * @returns {AccountBalance}
     */
    static _fromProtobuf(accountBalance) {
        const tokenBalances = new TokenBalanceMap();
        const tokenDecimals = new TokenDecimalMap();

        if (accountBalance.tokenBalances != null) {
            for (const balance of accountBalance.tokenBalances) {
                const tokenId = TokenId._fromProtobuf(
                    /** @type {HieroProto.proto.ITokenID} */ (balance.tokenId),
                );

                tokenDecimals._set(
                    tokenId,
                    balance.decimals != null ? balance.decimals : 0,
                );
                tokenBalances._set(
                    tokenId,
                    Long.fromValue(/** @type {Long} */ (balance.balance)),
                );
            }
        }

        return new AccountBalance({
            hbars: Hbar.fromTinybars(
                /** @type {Long} */ (accountBalance.balance),
            ),
            tokens: tokenBalances,
            tokenDecimals,
        });
    }

    /**
     * @returns {HieroProto.proto.ICryptoGetAccountBalanceResponse}
     */
    _toProtobuf() {
        /** @type {HieroProto.proto.ITokenBalance[]} */
        const list = [];

        // eslint-disable-next-line deprecation/deprecation
        for (const [key, value] of this.tokens != null ? this.tokens : []) {
            list.push({
                tokenId: key._toProtobuf(),
                balance: value,
                decimals:
                    // eslint-disable-next-line deprecation/deprecation
                    this.tokenDecimals != null
                        ? // eslint-disable-next-line deprecation/deprecation
                          this.tokenDecimals.get(key)
                        : null,
            });
        }

        return {
            balance: this.hbars.toTinybars(),
            tokenBalances: list,
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.CryptoGetAccountBalanceResponse.encode(
            this._toProtobuf(),
        ).finish();
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
        // eslint-disable-next-line deprecation/deprecation
        for (const [key, value] of this.tokens != null ? this.tokens : []) {
            const decimals =
                // eslint-disable-next-line deprecation/deprecation
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
