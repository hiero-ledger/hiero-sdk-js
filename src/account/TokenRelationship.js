import Long from "long";
import TokenId from "../token/TokenId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").ITokenRelationship} proto.ITokenRelationship
 * @typedef {import("@hashgraph/proto").TokenKycStatus} proto.TokenKycStatus
 * @typedef {import("@hashgraph/proto").TokenFreezeStatus} proto.TokenFreezeStatus
 * @typedef {import("@hashgraph/proto").ITokenID} proto.ITokenID
 */

/**
 * @typedef {object} TokenRelationshipJson
 * @param {string} tokenId
 * @param {string} symbol
 * @param {string} balance
 * @param {string | null} isKycGranted
 * @param {string | null} isFrozen
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

        Object.freeze(this);
    }

    /**
     * @param {proto.ITokenRelationship} relationship
     * @returns {TokenRelationship}
     */
    static _fromProtobuf(relationship) {
        const tokenId = TokenId._fromProtobuf(
            /** @type {proto.ITokenID} */ (relationship.tokenId)
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
        });
    }

    /**
     * @returns {proto.ITokenRelationship}
     */
    _toProtobuf() {
        return {
            tokenId: this.tokenId._toProtobuf(),
            symbol: this.symbol,
            balance: this.balance,
            kycStatus:
                this.isKycGranted == null ? 0 : this.isKycGranted ? 1 : 2,
            freezeStatus: this.isFrozen == null ? 0 : this.isFrozen ? 1 : 2,
        };
    }

    /**
     * @param {string} tokenRelationship
     * @returns {TokenRelationship}
     */
    static fromString(tokenRelationship){
        return TokenRelationship.fromJSON(JSON.parse(tokenRelationship));
    }

    /**
     * @returns {string}
     */
    toString(){
        return JSON.stringify(this.toJSON());
    }

    /**
     * @param {any} tokenRelationshipJson
     * @returns {TokenRelationship}
     */
    static fromJSON(tokenRelationshipJson){
        let props={
            tokenId:TokenId.fromString(tokenRelationshipJson["tokenId"]),
            symbol:tokenRelationshipJson["symbol"],
            balance:tokenRelationshipJson["balance"],
            isKycGranted:tokenRelationshipJson["isKycGranted"],
            isFrozen:tokenRelationshipJson["isFrozen"],
        };
        return new TokenRelationship(props);
    }

    /**
     * @returns {TokenRelationshipJson}
     */
    toJSON(){
        return {
            tokenId:this.tokenId.toString(),
            symbol:this.symbol,
            balance: this.balance.toString(),
            isKycGranted:this.isKycGranted,
            isFrozen:this.isFrozen,
        };
    }
}
