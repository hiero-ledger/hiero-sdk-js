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
    TokenCancelAirdropTransaction,
} from "@hashgraph/sdk";
import Long from "long";

import { sdk } from "../sdk_data";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { supplyTypeMap, tokenTypeMap } from "../utils/constants/properties";
import { getKeyFromString } from "../utils/key";
import {
    configureTokenManagementTransaction,
    createCustomFees,
    executeTokenManagementTransaction,
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
} from "../params/token";

import {
    TokenResponse,
    TokenBurnResponse,
    TokenMintResponse,
} from "../response/token";

export const createToken = async ({
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
}: CreateTokenParams): Promise<TokenResponse> => {
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
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        tokenId: receipt.tokenId.toString(),
        status: receipt.status.toString(),
    };
};

export const updateToken = async ({
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
}: UpdateTokenParams): Promise<TokenResponse> => {
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
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

export const deleteToken = async ({
    tokenId,
    commonTransactionParams,
}: DeleteTokenParams): Promise<TokenResponse> => {
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
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

export const updateTokenFeeSchedule = async ({
    tokenId,
    customFees,
    commonTransactionParams,
}: UpdateTokenFeeScheduleParams): Promise<TokenResponse> => {
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
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

export const associateToken = async (
    params: AssociateDisassociateTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenAssociateTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const dissociateToken = async (
    params: AssociateDisassociateTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenDissociateTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const pauseToken = async (
    params: PauseUnpauseTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenPauseTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const unpauseToken = async (
    params: PauseUnpauseTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenUnpauseTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const freezeToken = async (
    params: FreezeUnfreezeTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenFreezeTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const unfreezeToken = async (
    params: FreezeUnfreezeTokenParams,
): Promise<TokenResponse> => {
    const transaction = new TokenUnfreezeTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const grantTokenKyc = async (
    params: GrantRevokeTokenKycParams,
): Promise<TokenResponse> => {
    const transaction = new TokenGrantKycTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());
    const receipt = await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
    return { status: receipt.status.toString() };
};

export const revokeTokenKyc = async (
    params: GrantRevokeTokenKycParams,
): Promise<TokenResponse> => {
    const transaction = new TokenRevokeKycTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    return await executeTokenManagementTransaction(
        transaction,
        sdk.getClient(),
    );
};

export const mintToken = async (
    params: MintTokenParams,
): Promise<TokenMintResponse> => {
    const transaction = new TokenMintTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
        newTotalSupply: receipt.totalSupply.toString(),
        serialNumbers: receipt.serials.map((serial) => serial.toString()),
    };
};

export const burnToken = async (
    params: BurnTokenParams,
): Promise<TokenBurnResponse> => {
    const transaction = new TokenBurnTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
        newTotalSupply: receipt.totalSupply.toString(),
    };
};

export const wipeToken = async (
    params: WipeTokenParams,
): Promise<TokenBurnResponse> => {
    const transaction = new TokenWipeTransaction();
    configureTokenManagementTransaction(transaction, params, sdk.getClient());

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

export const airdropToken = async ({
    tokenTransfers,
    commonTransactionParams,
}: AirdropTokenParams): Promise<TokenResponse> => {
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
                        : transaction.addTokenTransfer(
                              tokenId,
                              accountId,
                              amount,
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
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

export const cancelAirdrop = async ({
    senderAccountId,
    receiverAccountId,
    tokenId,
    commonTransactionParams,
}: AirdropCancelTokenParams): Promise<TokenResponse> => {
    const transaction = new TokenCancelAirdropTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    // Create PendingAirdropId with raw values to allow invalid IDs
    let pendingAirdropId: PendingAirdropId;
    try {
        pendingAirdropId = new PendingAirdropId({
            senderId: AccountId.fromString(senderAccountId),
            receiverId: AccountId.fromString(receiverAccountId),
            tokenId: TokenId.fromString(tokenId),
        });
    } catch (error) {
        throw new Error("Invalid pending airdrop ID");
    }

    transaction.addPendingAirdropId(pendingAirdropId);

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};
