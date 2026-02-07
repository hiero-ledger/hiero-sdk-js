import {
    AccountId,
    Timestamp,
    TokenCreateTransaction,
    TokenDeleteTransaction,
    TokenUpdateTransaction,
    TokenFeeScheduleUpdateTransaction,
    TokenAssociateTransaction,
    TokenPauseTransaction,
    TokenUnpauseTransaction,
    TokenDissociateTransaction,
    TokenFreezeTransaction,
    TokenUnfreezeTransaction,
    TokenGrantKycTransaction,
    TokenRevokeKycTransaction,
    TokenMintTransaction,
    TokenBurnTransaction,
    TokenWipeTransaction,
    TokenAirdropTransaction,
    TokenId,
    NftId,
    TokenClaimAirdropTransaction,
    PendingAirdropId,
    TokenRejectTransaction,
    TokenCancelAirdropTransaction,
    TokenInfoQuery,
    TokenNftInfoQuery,
    Hbar,
} from "@hiero-ledger/sdk";
import Long from "long";

import { sdk } from "../sdk_data";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { supplyTypeMap, tokenTypeMap } from "../utils/constants/properties";
import { getKeyFromString } from "../utils/key";
import {
    configureTokenManagementTransaction,
    createCustomFees,
    executeTokenManagementTransaction,
    mapTokenInfoResponse,
    mapTokenNftInfoResponse,
} from "../utils/helpers/token";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import {
    CreateTokenParams,
    DeleteTokenParams,
    UpdateTokenParams,
    UpdateTokenFeeScheduleParams,
    AssociateDisassociateTokenParams,
    PauseUnpauseTokenParams,
    FreezeUnfreezeTokenParams,
    GrantRevokeTokenKycParams,
    BurnTokenParams,
    MintTokenParams,
    WipeTokenParams,
    AirdropTokenParams,
    AirdropCancelTokenParams,
    AirdropClaimTokenParams,
    RejectTokenParams,
    GetTokenInfoParams,
    GetTokenNftInfoParams,
} from "../params/token";

import {
    TokenResponse,
    TokenBurnResponse,
    TokenMintResponse,
    TokenInfoQueryResponse,
    TokenNftInfoQueryResponse,
} from "../response/token";

// buildCreateToken builds a TokenCreateTransaction from parameters
const buildCreateToken = (
    {
        name,
        symbol,
        decimals,
        initialSupply,
        treasuryAccountId,
        adminKey,
        kycKey,
        freezeKey,
        wipeKey,
        supplyKey,
        freezeDefault,
        expirationTime,
        autoRenewPeriod,
        autoRenewAccountId,
        memo,
        tokenType,
        supplyType,
        maxSupply,
        feeScheduleKey,
        customFees,
        pauseKey,
        metadata,
        metadataKey,
        commonTransactionParams,
    }: CreateTokenParams,
    client,
): TokenCreateTransaction => {
    let transaction = new TokenCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (name != null) {
        transaction.setTokenName(name);
    }

    if (symbol != null) {
        transaction.setTokenSymbol(symbol);
    }

    if (decimals != null) {
        transaction.setDecimals(decimals);
    }

    if (initialSupply != null) {
        transaction.setInitialSupply(Long.fromString(initialSupply));
    }

    if (treasuryAccountId != null) {
        transaction.setTreasuryAccountId(
            AccountId.fromString(treasuryAccountId),
        );
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (kycKey != null) {
        transaction.setKycKey(getKeyFromString(kycKey));
    }

    if (freezeKey != null) {
        transaction.setFreezeKey(getKeyFromString(freezeKey));
    }

    if (wipeKey != null) {
        transaction.setWipeKey(getKeyFromString(wipeKey));
    }

    if (supplyKey != null) {
        transaction.setSupplyKey(getKeyFromString(supplyKey));
    }

    if (freezeDefault != null) {
        transaction.setFreezeDefault(freezeDefault);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(
            AccountId.fromString(autoRenewAccountId),
        );
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (memo != null) {
        transaction.setTokenMemo(memo);
    }

    if (tokenType != null) {
        const selectedTokenType = tokenTypeMap[tokenType];
        if (selectedTokenType) {
            transaction.setTokenType(selectedTokenType);
        } else {
            throw new Error(`Invalid token type: ${tokenType}`);
        }
    }

    if (supplyType != null) {
        const selectedSupplyType = supplyTypeMap[supplyType];
        if (selectedSupplyType) {
            transaction.setSupplyType(selectedSupplyType);
        } else {
            throw new Error(`Invalid supply type: ${supplyType}`);
        }
    }

    if (maxSupply != null) {
        transaction.setMaxSupply(Long.fromString(maxSupply));
    }

    if (feeScheduleKey != null) {
        transaction.setFeeScheduleKey(getKeyFromString(feeScheduleKey));
    }

    if (customFees != null && customFees.length > 0) {
        const customFeeList = createCustomFees(customFees);
        transaction.setCustomFees(customFeeList);
    }

    if (pauseKey != null) {
        transaction.setPauseKey(getKeyFromString(pauseKey));
    }

    if (metadata != null) {
        transaction.setMetadata(Buffer.from(metadata, "utf8"));
    }

    if (metadataKey != null) {
        transaction.setMetadataKey(getKeyFromString(metadataKey));
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const createToken = async (
    params: CreateTokenParams,
): Promise<TokenResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildCreateToken(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        tokenId: receipt.tokenId.toString(),
        status: receipt.status.toString(),
    };
};

// buildUpdateToken builds a TokenUpdateTransaction from parameters
const buildUpdateToken = (
    {
        tokenId,
        symbol,
        name,
        treasuryAccountId,
        adminKey,
        kycKey,
        freezeKey,
        wipeKey,
        supplyKey,
        autoRenewAccountId,
        autoRenewPeriod,
        expirationTime,
        memo,
        feeScheduleKey,
        pauseKey,
        metadata,
        metadataKey,
        commonTransactionParams,
    }: UpdateTokenParams,
    client,
): TokenUpdateTransaction => {
    let transaction = new TokenUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (tokenId != null) {
        transaction.setTokenId(tokenId);
    }

    if (symbol != null) {
        transaction.setTokenSymbol(symbol);
    }

    if (name != null) {
        transaction.setTokenName(name);
    }

    if (treasuryAccountId != null) {
        transaction.setTreasuryAccountId(
            AccountId.fromString(treasuryAccountId),
        );
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (kycKey != null) {
        transaction.setKycKey(getKeyFromString(kycKey));
    }

    if (freezeKey != null) {
        transaction.setFreezeKey(getKeyFromString(freezeKey));
    }

    if (wipeKey != null) {
        transaction.setWipeKey(getKeyFromString(wipeKey));
    }

    if (supplyKey != null) {
        transaction.setSupplyKey(getKeyFromString(supplyKey));
    }

    if (autoRenewAccountId != null) {
        transaction.setAutoRenewAccountId(
            AccountId.fromString(autoRenewAccountId),
        );
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(new Date(Number(expirationTime) * 1000));
    }

    if (memo != null) {
        transaction.setTokenMemo(memo);
    }

    if (feeScheduleKey != null) {
        transaction.setFeeScheduleKey(getKeyFromString(feeScheduleKey));
    }

    if (pauseKey != null) {
        transaction.setPauseKey(getKeyFromString(pauseKey));
    }

    if (metadata != null) {
        transaction.setMetadata(Buffer.from(metadata, "utf8"));
    }

    if (metadataKey != null) {
        transaction.setMetadataKey(getKeyFromString(metadataKey));
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const updateToken = async (
    params: UpdateTokenParams,
): Promise<TokenResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildUpdateToken(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildDeleteToken builds a TokenDeleteTransaction from parameters
const buildDeleteToken = (
    { tokenId, commonTransactionParams }: DeleteTokenParams,
    client,
): TokenDeleteTransaction => {
    let transaction = new TokenDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (tokenId != null) {
        transaction.setTokenId(tokenId);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const deleteToken = async (
    params: DeleteTokenParams,
): Promise<TokenResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildDeleteToken(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildUpdateTokenFeeSchedule builds a TokenFeeScheduleUpdateTransaction from parameters
const buildUpdateTokenFeeSchedule = (
    {
        tokenId,
        customFees,
        commonTransactionParams,
    }: UpdateTokenFeeScheduleParams,
    client,
): TokenFeeScheduleUpdateTransaction => {
    let transaction = new TokenFeeScheduleUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (tokenId != null) {
        transaction.setTokenId(tokenId);
    }

    if (customFees != null && customFees.length > 0) {
        const customFeeList = createCustomFees(customFees);
        transaction.setCustomFees(customFeeList);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const updateTokenFeeSchedule = async (
    params: UpdateTokenFeeScheduleParams,
): Promise<TokenResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildUpdateTokenFeeSchedule(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const associateToken = async (
    params: AssociateDisassociateTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenAssociateTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

export const dissociateToken = async (
    params: AssociateDisassociateTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenDissociateTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

export const pauseToken = async (
    params: PauseUnpauseTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenPauseTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

export const unpauseToken = async (
    params: PauseUnpauseTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenUnpauseTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

export const freezeToken = async (
    params: FreezeUnfreezeTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenFreezeTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

export const unfreezeToken = async (
    params: FreezeUnfreezeTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenUnfreezeTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

export const grantTokenKyc = async (
    params: GrantRevokeTokenKycParams,
): Promise<TokenResponse> => {
    const transaction = new TokenGrantKycTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);
    const receipt = await executeTokenManagementTransaction(
        transaction,
        client,
    );
    return { status: receipt.status.toString() };
};

export const revokeTokenKyc = async (
    params: GrantRevokeTokenKycParams,
): Promise<TokenResponse> => {
    const transaction = new TokenRevokeKycTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    return await executeTokenManagementTransaction(transaction, client);
};

// buildMintToken builds a TokenMintTransaction from parameters
export const buildMintToken = (
    params: MintTokenParams,
    client,
): TokenMintTransaction => {
    const transaction = new TokenMintTransaction();
    configureTokenManagementTransaction(transaction, params, client);
    return transaction;
};

export const mintToken = async (
    params: MintTokenParams,
): Promise<TokenMintResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildMintToken(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
        newTotalSupply: receipt.totalSupply.toString(),
        serialNumbers: receipt.serials.map((serial) => serial.toString()),
    };
};

// buildBurnToken builds a TokenBurnTransaction from parameters
export const buildBurnToken = (
    params: BurnTokenParams,
    client,
): TokenBurnTransaction => {
    const transaction = new TokenBurnTransaction();
    configureTokenManagementTransaction(transaction, params, client);
    return transaction;
};

export const burnToken = async (
    params: BurnTokenParams,
): Promise<TokenBurnResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildBurnToken(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
        newTotalSupply: receipt.totalSupply.toString(),
    };
};

export const wipeToken = async (
    params: WipeTokenParams,
): Promise<TokenBurnResponse> => {
    const transaction = new TokenWipeTransaction();
    const client = sdk.getClient(params.sessionId);
    configureTokenManagementTransaction(transaction, params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildAirdropToken builds a TokenAirdropTransaction from parameters
const buildAirdropToken = (
    { tokenTransfers, commonTransactionParams }: AirdropTokenParams,
    client,
): TokenAirdropTransaction => {
    const transaction = new TokenAirdropTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (tokenTransfers != null) {
        for (const tokenTransfer of tokenTransfers) {
            const isApproved = tokenTransfer.approved ?? false;

            // Token airdrop transfer
            if (tokenTransfer.token != null) {
                const tokenId = TokenId.fromString(tokenTransfer.token.tokenId);
                const accountId = AccountId.fromString(
                    tokenTransfer.token.accountId,
                );
                const amount = Long.fromString(tokenTransfer.token.amount);

                if (tokenTransfer.token.decimals != null) {
                    const decimals = tokenTransfer.token.decimals;

                    isApproved
                        ? transaction.addApprovedTokenTransferWithDecimals(
                            tokenId,
                            accountId,
                            amount,
                            decimals,
                        )
                        : transaction.addTokenTransferWithDecimals(
                            tokenId,
                            accountId,
                            amount,
                            decimals,
                        );
                } else {
                    isApproved
                        ? transaction.addApprovedTokenTransfer(
                            tokenId,
                            accountId,
                            amount,
                        )
                        : transaction.addTokenTransfer(
                            tokenId,
                            accountId,
                            amount,
                        );
                }
            } else {
                // NFT airdrop transfer
                const senderAccountId = AccountId.fromString(
                    tokenTransfer.nft.senderAccountId,
                );
                const receiverAccountId = AccountId.fromString(
                    tokenTransfer.nft.receiverAccountId,
                );
                const nftId = new NftId(
                    TokenId.fromString(tokenTransfer.nft.tokenId),
                    Long.fromString(tokenTransfer.nft.serialNumber),
                );

                isApproved
                    ? transaction.addApprovedNftTransfer(
                        nftId,
                        senderAccountId,
                        receiverAccountId,
                    )
                    : transaction.addNftTransfer(
                        nftId,
                        senderAccountId,
                        receiverAccountId,
                    );
            }
        }
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const airdropToken = async (
    params: AirdropTokenParams,
): Promise<TokenResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildAirdropToken(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const claimToken = async ({
    senderAccountId,
    receiverAccountId,
    tokenId,
    serialNumbers,
    commonTransactionParams,
    sessionId,
}: AirdropClaimTokenParams): Promise<TokenResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new TokenClaimAirdropTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    // NFT token claiming
    if (serialNumbers && serialNumbers.length) {
        for (const serialNumber of serialNumbers) {
            transaction.addPendingAirdropId(
                new PendingAirdropId({
                    senderId: AccountId.fromString(senderAccountId),
                    receiverId: AccountId.fromString(receiverAccountId),
                    nftId: new NftId(
                        TokenId.fromString(tokenId),
                        Long.fromString(serialNumber.toString()),
                    ),
                }),
            );
        }
    } else {
        // Fungible token claiming
        transaction.addPendingAirdropId(
            new PendingAirdropId({
                senderId: AccountId.fromString(senderAccountId),
                receiverId: AccountId.fromString(receiverAccountId),
                tokenId: TokenId.fromString(tokenId),
            }),
        );
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const rejectToken = async ({
    ownerId,
    tokenIds,
    serialNumbers,
    commonTransactionParams,
    sessionId,
}: RejectTokenParams): Promise<TokenResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new TokenRejectTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (ownerId != null) {
        transaction.setOwnerId(AccountId.fromString(ownerId));
    }

    if (tokenIds.length > 0 && !serialNumbers) {
        for (const tokenId of tokenIds) {
            transaction.addTokenId(TokenId.fromString(tokenId));
        }
    }

    // NFT token rejecting
    if (serialNumbers) {
        for (const tokenId of tokenIds) {
            for (const serialNumber of serialNumbers) {
                transaction.addNftId(
                    new NftId(
                        TokenId.fromString(tokenId),
                        Long.fromString(serialNumber),
                    ),
                );
            }
        }
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const cancelAirdrop = async ({
    pendingAirdrops,
    commonTransactionParams,
    sessionId,
}: AirdropCancelTokenParams): Promise<TokenResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new TokenCancelAirdropTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    for (const pendingAirdrop of pendingAirdrops) {
        if (
            pendingAirdrop.serialNumbers &&
            pendingAirdrop.serialNumbers.length
        ) {
            for (const serialNumber of pendingAirdrop.serialNumbers) {
                transaction.addPendingAirdropId(
                    new PendingAirdropId({
                        senderId: AccountId.fromString(
                            pendingAirdrop.senderAccountId,
                        ),
                        receiverId: AccountId.fromString(
                            pendingAirdrop.receiverAccountId,
                        ),
                        nftId: new NftId(
                            TokenId.fromString(pendingAirdrop.tokenId),
                            Long.fromString(serialNumber.toString()),
                        ),
                    }),
                );
            }
        } else {
            // Fungible token canceling
            transaction.addPendingAirdropId(
                new PendingAirdropId({
                    senderId: AccountId.fromString(
                        pendingAirdrop.senderAccountId,
                    ),
                    receiverId: AccountId.fromString(
                        pendingAirdrop.receiverAccountId,
                    ),
                    tokenId: TokenId.fromString(pendingAirdrop.tokenId),
                }),
            );
        }
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const getTokenInfo = async ({
    tokenId,
    queryPayment,
    maxQueryPayment,
    getCost,
    sessionId,
}: GetTokenInfoParams): Promise<TokenInfoQueryResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new TokenInfoQuery().setGrpcDeadline(DEFAULT_GRPC_DEADLINE);

    if (tokenId != null) {
        query.setTokenId(tokenId);
    }

    if (queryPayment != null) {
        query.setQueryPayment(Hbar.fromTinybars(queryPayment));
    }

    if (maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(maxQueryPayment));
    }

    if (getCost) {
        const cost = await query.getCost(client);

        return {
            cost: cost.toTinybars().toString(),
        };
    }

    const response = await query.execute(client);

    return mapTokenInfoResponse(response);
};

export const getTokenNftInfo = async ({
    nftId,
    queryPayment,
    maxQueryPayment,
    getCost,
    sessionId,
}: GetTokenNftInfoParams): Promise<TokenNftInfoQueryResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new TokenNftInfoQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (nftId != null) {
        query.setNftId(nftId);
    }

    if (queryPayment != null) {
        query.setQueryPayment(Hbar.fromTinybars(queryPayment));
    }

    if (maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(maxQueryPayment));
    }

    if (getCost) {
        const cost = await query.getCost(client);

        return {
            cost: cost.toTinybars().toString(),
        };
    }

    const response = await query.execute(client);

    // TokenNftInfoQuery returns an array, but for a single NFT query, we return the first result
    if (response && response.length > 0) {
        return mapTokenNftInfoResponse(response[0]);
    }

    throw new Error("No NFT info returned");
};
