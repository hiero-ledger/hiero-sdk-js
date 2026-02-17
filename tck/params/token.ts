import { BaseParams, BaseTransactionParams } from "./base";

import {
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
} from "@hiero-ledger/sdk";

import { TransferParams } from "./transfer";

export interface CreateTokenParams extends BaseTransactionParams {
    readonly name?: string;
    readonly symbol?: string;
    readonly decimals?: number;
    readonly initialSupply?: string;
    readonly treasuryAccountId?: string;
    readonly adminKey?: string;
    readonly kycKey?: string;
    readonly freezeKey?: string;
    readonly wipeKey?: string;
    readonly supplyKey?: string;
    readonly freezeDefault?: boolean;
    readonly expirationTime?: string;
    readonly autoRenewPeriod?: string;
    readonly autoRenewAccountId?: string;
    readonly memo?: string;
    readonly tokenType?: string;
    readonly supplyType?: string;
    readonly maxSupply?: string;
    readonly feeScheduleKey?: string;
    readonly customFees?:
        | CustomFixedFee[]
        | CustomFractionalFee[]
        | CustomRoyaltyFee[];
    readonly pauseKey?: string;
    readonly metadata?: string;
    readonly metadataKey?: string;
}

export interface UpdateTokenParams extends BaseTransactionParams {
    readonly tokenId?: string;
    readonly symbol?: string;
    readonly name?: string;
    readonly treasuryAccountId?: string;
    readonly adminKey?: string;
    readonly kycKey?: string;
    readonly freezeKey?: string;
    readonly wipeKey?: string;
    readonly supplyKey?: string;
    readonly autoRenewAccountId?: string;
    readonly autoRenewPeriod?: string;
    readonly expirationTime?: string;
    readonly memo?: string;
    readonly feeScheduleKey?: string;
    readonly pauseKey?: string;
    readonly metadata?: string;
    readonly metadataKey?: string;
}

export interface DeleteTokenParams extends BaseTransactionParams {
    readonly tokenId?: string;
}

export interface UpdateTokenFeeScheduleParams extends BaseTransactionParams {
    readonly tokenId?: string;
    readonly customFees?:
        | CustomFixedFee[]
        | CustomFractionalFee[]
        | CustomRoyaltyFee[];
}

export interface AssociateDisassociateTokenParams
    extends BaseTransactionParams {
    readonly accountId?: string;
    readonly tokenIds?: string[];
}

export interface PauseUnpauseTokenParams extends BaseTransactionParams {
    readonly tokenId?: string;
}

export interface FreezeUnfreezeTokenParams extends BaseTransactionParams {
    readonly accountId?: string;
    readonly tokenId?: string;
}

export interface GrantRevokeTokenKycParams extends BaseTransactionParams {
    readonly tokenId?: string;
    readonly accountId?: string;
}

export interface MintTokenParams extends BaseTransactionParams {
    readonly tokenId?: string;
    readonly amount?: string;
    readonly metadata?: string[];
}

export interface BurnTokenParams extends BaseTransactionParams {
    readonly tokenId?: string;
    readonly amount?: string;
    readonly metadata?: string[];
    readonly serialNumbers?: string[];
}

export interface WipeTokenParams extends BaseTransactionParams {
    readonly tokenId?: string;
    readonly accountId?: string;
    readonly amount?: string;
    readonly serialNumbers?: string[];
}

export interface AirdropTokenParams extends BaseTransactionParams {
    readonly tokenTransfers: TransferParams[];
}

interface PendingAirdrop {
    readonly senderAccountId?: string;
    readonly receiverAccountId?: string;
    readonly tokenId?: string;
    readonly serialNumbers?: string[];
}

export interface AirdropCancelTokenParams extends BaseTransactionParams {
    readonly pendingAirdrops: PendingAirdrop[];
}

export interface AirdropClaimTokenParams extends BaseTransactionParams {
    readonly senderAccountId?: string;
    readonly receiverAccountId?: string;
    readonly tokenId?: string;
    readonly serialNumbers?: string[];
}

export interface RejectTokenParams extends BaseTransactionParams {
    readonly ownerId?: string;
    readonly tokenIds?: string[];
    readonly nftIds?: string[];
    readonly serialNumbers?: string[];
}

export interface GetTokenInfoParams extends BaseParams {
    readonly tokenId?: string;
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
    readonly getCost?: boolean;
}

export interface GetTokenNftInfoParams extends BaseParams {
    readonly nftId?: string;
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
    readonly getCost?: boolean;
}
