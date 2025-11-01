import { BaseParams } from "./base";

import {
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
} from "@hashgraph/sdk";

import { TransferParams } from "./transfer";

export interface CreateTokenParams extends BaseParams {
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
    readonly commonTransactionParams?: Record<string, any>;
}

export interface UpdateTokenParams extends BaseParams {
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
    readonly commonTransactionParams?: Record<string, any>;
}

export interface DeleteTokenParams extends BaseParams {
    readonly tokenId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface UpdateTokenFeeScheduleParams extends BaseParams {
    readonly tokenId?: string;
    readonly customFees?:
        | CustomFixedFee[]
        | CustomFractionalFee[]
        | CustomRoyaltyFee[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface AssociateDisassociateTokenParams extends BaseParams {
    readonly accountId?: string;
    readonly tokenIds?: string[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface PauseUnpauseTokenParams extends BaseParams {
    readonly tokenId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface FreezeUnfreezeTokenParams extends BaseParams {
    readonly accountId?: string;
    readonly tokenId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface GrantRevokeTokenKycParams extends BaseParams {
    readonly tokenId?: string;
    readonly accountId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface MintTokenParams extends BaseParams {
    readonly tokenId?: string;
    readonly amount?: string;
    readonly metadata?: string[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface BurnTokenParams extends BaseParams {
    readonly tokenId?: string;
    readonly amount?: string;
    readonly metadata?: string[];
    readonly serialNumbers?: string[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface WipeTokenParams extends BaseParams {
    readonly tokenId?: string;
    readonly accountId?: string;
    readonly amount?: string;
    readonly serialNumbers?: string[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface AirdropTokenParams extends BaseParams {
    readonly tokenTransfers: TransferParams[];
    readonly commonTransactionParams?: Record<string, any>;
}

interface PendingAirdrop {
    readonly senderAccountId?: string;
    readonly receiverAccountId?: string;
    readonly tokenId?: string;
    readonly serialNumbers?: string[];
}

export interface AirdropCancelTokenParams extends BaseParams {
    readonly pendingAirdrops: PendingAirdrop[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface AirdropClaimTokenParams extends BaseParams {
    readonly senderAccountId?: string;
    readonly receiverAccountId?: string;
    readonly tokenId?: string;
    readonly serialNumbers?: string[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface RejectTokenParams extends BaseParams {
    readonly ownerId?: string;
    readonly tokenIds?: string[];
    readonly nftIds?: string[];
    readonly serialNumbers?: string[];
    readonly commonTransactionParams?: Record<string, any>;
}
