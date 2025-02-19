// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import TokenId from "../token/TokenId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenRelationship} HieroProto.proto.ITokenRelationship
 * @typedef {import("@hashgraph/proto").proto.TokenKycStatus} HieroProto.proto.TokenKycStatus
 * @typedef {import("@hashgraph/proto").proto.TokenFreezeStatus} HieroProto.proto.TokenFreezeStatus
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 */

/**
 * Token's information related to the given Account
 */
export default class TokenRelationship {
    /**
     * @param {object} props
     * @param {TokenId} props.tokenId
     * @param {string} props.symbol
     * @param {Long} props.balance
     * @param {boolean | null} props.isKycGranted
     * @param {boolean | null} props.isFrozen
     * @param {boolean | null} props.automaticAssociation
     */
    constructor(props) {
        /**
         * The ID of the token
         *
         * @readonly
         */
        this.tokenId = props.tokenId;

        /**
         * The Symbol of the token
         *
         * @readonly
         */
        this.symbol = props.symbol;

        /**
         * The balance that the Account holds in the smallest denomination
         *
         * @readonly
         */
        this.balance = props.balance;

        /**
         * The KYC status of the account (KycNotApplicable, Granted or Revoked). If the token does
         * not have KYC key, KycNotApplicable is returned
         *
         * @readonly
         */
        this.isKycGranted = props.isKycGranted;

        /**
         * The Freeze status of the account (FreezeNotApplicable, Frozen or Unfrozen). If the token
         * does not have Freeze key, FreezeNotApplicable is returned
         *
         * @readonly
         */
        this.isFrozen = props.isFrozen;

        /**
         * Specifies if the relationship is created implicitly. False : explicitly associated, True :
         * implicitly associated.
         *
         * @readonly
         */
        this.automaticAssociation = props.automaticAssociation;

        Object.freeze(this);
    }

    /**
     * @param {HieroProto.proto.ITokenRelationship} relationship
     * @returns {TokenRelationship}
     */
    static _fromProtobuf(relationship) {
        const tokenId = TokenId._fromProtobuf(
            /** @type {HieroProto.proto.ITokenID} */ (relationship.tokenId),
        );
        const isKycGranted =
            relationship.kycStatus == null || relationship.kycStatus === 0
                ? null
                : relationship.kycStatus === 1;
        const isFrozen =
            relationship.freezeStatus == null || relationship.freezeStatus === 0
                ? null
                : relationship.freezeStatus === 1;

        return new TokenRelationship({
            tokenId,
            symbol: /** @type {string} */ (relationship.symbol),
            balance:
                relationship.balance != null
                    ? relationship.balance instanceof Long
                        ? relationship.balance
                        : Long.fromValue(relationship.balance)
                    : Long.ZERO,
            isKycGranted,
            isFrozen,
            automaticAssociation:
                relationship.automaticAssociation != null
                    ? relationship.automaticAssociation
                    : null,
        });
    }

    /**
     * @returns {HieroProto.proto.ITokenRelationship}
     */
    _toProtobuf() {
        return {
            tokenId: this.tokenId._toProtobuf(),
            symbol: this.symbol,
            balance: this.balance,
            kycStatus:
                this.isKycGranted == null ? 0 : this.isKycGranted ? 1 : 2,
            freezeStatus: this.isFrozen == null ? 0 : this.isFrozen ? 1 : 2,
            automaticAssociation: this.automaticAssociation,
        };
    }
}
