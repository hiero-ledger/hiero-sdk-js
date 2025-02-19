// SPDX-License-Identifier: Apache-2.0

import TokenId from "../token/TokenId.js";
import AccountId from "./AccountId.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IGrantedTokenAllowance} HieroProto.proto.IGrantedTokenAllowance
 * @typedef {import("@hashgraph/proto").proto.ITokenAllowance} HieroProto.proto.ITokenAllowance
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 */

/**
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * Represents a token allowance granted to a spender account by an owner account.
 *
 * The `TokenAllowance` class manages the permissions for one account to spend a specified
 * amount of tokens on behalf of another account. It includes details about the token, the
 * spender, the owner, and the amount allowed.
 */
export default class TokenAllowance {
    /**
     * @internal
     * @param {object} props
     * @param {TokenId} props.tokenId
     * @param {AccountId | null} props.spenderAccountId
     * @param {AccountId | null} props.ownerAccountId
     * @param {Long | null} props.amount
     */
    constructor(props) {
        /**
         * The token that the allowance pertains to.
         *
         * @readonly
         */
        this.tokenId = props.tokenId;

        /**
         * The account ID of the spender of the hbar allowance.
         *
         * @readonly
         */
        this.spenderAccountId = props.spenderAccountId;

        /**
         * The account ID of the owner of the hbar allowance.
         *
         * @readonly
         */
        this.ownerAccountId = props.ownerAccountId;

        /**
         * The current balance of the spender's token allowance.
         * **NOTE**: If `null`, the spender has access to all of the account owner's NFT instances
         * (currently owned and any in the future).
         *
         * @readonly
         */
        this.amount = props.amount;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITokenAllowance} allowance
     * @returns {TokenAllowance}
     */
    static _fromProtobuf(allowance) {
        return new TokenAllowance({
            tokenId: TokenId._fromProtobuf(
                /** @type {HieroProto.proto.ITokenID} */ (allowance.tokenId),
            ),
            spenderAccountId: AccountId._fromProtobuf(
                /** @type {HieroProto.proto.IAccountID} */ (allowance.spender),
            ),
            ownerAccountId:
                allowance.owner != null
                    ? AccountId._fromProtobuf(
                          /**@type {HieroProto.proto.IAccountID}*/ (
                              allowance.owner
                          ),
                      )
                    : null,
            amount:
                allowance.amount != null
                    ? Long.fromValue(/** @type {Long} */ (allowance.amount))
                    : null,
        });
    }

    /**
     * @internal
     * @param {HieroProto.proto.IGrantedTokenAllowance} allowance
     * @param {AccountId} ownerAccountId
     * @returns {TokenAllowance}
     */
    static _fromGrantedProtobuf(allowance, ownerAccountId) {
        return new TokenAllowance({
            tokenId: TokenId._fromProtobuf(
                /** @type {HieroProto.proto.ITokenID} */ (allowance.tokenId),
            ),
            spenderAccountId: AccountId._fromProtobuf(
                /** @type {HieroProto.proto.IAccountID} */ (allowance.spender),
            ),
            ownerAccountId,
            amount:
                allowance.amount != null
                    ? Long.fromValue(/** @type {Long} */ (allowance.amount))
                    : null,
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ITokenAllowance}
     */
    _toProtobuf() {
        return {
            tokenId: this.tokenId._toProtobuf(),
            spender:
                this.spenderAccountId != null
                    ? this.spenderAccountId._toProtobuf()
                    : null,
            owner:
                this.ownerAccountId != null
                    ? this.ownerAccountId._toProtobuf()
                    : null,
            amount: this.amount,
        };
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        this.tokenId.validateChecksum(client);

        if (this.ownerAccountId != null) {
            this.ownerAccountId.validateChecksum(client);
        }

        if (this.spenderAccountId != null) {
            this.spenderAccountId.validateChecksum(client);
        }
    }
}
