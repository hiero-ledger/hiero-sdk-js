import {
    AccountCreateTransaction,
    Hbar,
    AccountId,
    AccountUpdateTransaction,
    AccountDeleteTransaction,
    Timestamp,
    AccountAllowanceApproveTransaction,
    AccountAllowanceDeleteTransaction,
    TransferTransaction,
    NftId,
    TokenId,
    EvmAddress,
    AccountBalanceQuery,
} from "@hashgraph/sdk";
import Long from "long";

import { sdk } from "../sdk_data";
import {
    AccountResponse,
    GetAccountBalanceResponse,
} from "../response/account";

import { getKeyFromString } from "../utils/key";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { handleNftAllowances } from "../utils/helpers/account";

import {
    AccountAllowanceApproveParams,
    CreateAccountParams,
    DeleteAccountParams,
    DeleteAllowanceParams,
    GetAccountBalanceParams,
    UpdateAccountParams,
} from "../params/account";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { TransferCryptoParams } from "../params/transfer";

// buildCreateAccount builds an AccountCreateTransaction from parameters
export const buildCreateAccount = (
    {
        key,
        initialBalance,
        receiverSignatureRequired,
        maxAutoTokenAssociations,
        commonTransactionParams,
        stakedAccountId,
        stakedNodeId,
        declineStakingReward,
        memo,
        autoRenewPeriod,
        alias,
    }: CreateAccountParams,
    client,
): AccountCreateTransaction => {
    let transaction = new AccountCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (key != null) {
        transaction.setKeyWithoutAlias(getKeyFromString(key));
    }

    if (initialBalance != null) {
        transaction.setInitialBalance(Hbar.fromTinybars(initialBalance));
    }

    if (receiverSignatureRequired != null) {
        transaction.setReceiverSignatureRequired(receiverSignatureRequired);
    }

    if (maxAutoTokenAssociations != null) {
        transaction.setMaxAutomaticTokenAssociations(maxAutoTokenAssociations);
    }

    if (stakedAccountId != null) {
        const accountId = AccountId.fromString(stakedAccountId);

        transaction.setStakedAccountId(accountId);
    }

    if (stakedNodeId != null) {
        transaction.setStakedNodeId(Long.fromString(stakedNodeId));
    }

    if (declineStakingReward != null) {
        transaction.setDeclineStakingReward(declineStakingReward);
    }

    if (memo != null) {
        transaction.setAccountMemo(memo);
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
    }

    if (alias != null) {
        transaction.setAlias(alias);
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

export const createAccount = async (
    params: CreateAccountParams,
): Promise<AccountResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildCreateAccount(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        accountId: receipt.accountId?.toString(),
        status: receipt.status.toString(),
    };
};

// buildUpdateAccount builds an AccountUpdateTransaction from parameters
const buildUpdateAccount = (
    {
        accountId,
        key,
        autoRenewPeriod,
        expirationTime,
        receiverSignatureRequired,
        memo,
        maxAutoTokenAssociations,
        stakedAccountId,
        stakedNodeId,
        declineStakingReward,
        commonTransactionParams,
    }: UpdateAccountParams,
    client,
): AccountUpdateTransaction => {
    let transaction = new AccountUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (accountId != null) {
        transaction.setAccountId(accountId);
    }

    if (key != null) {
        transaction.setKey(getKeyFromString(key));
    }

    if (receiverSignatureRequired != null) {
        transaction.setReceiverSignatureRequired(receiverSignatureRequired);
    }

    if (maxAutoTokenAssociations != null) {
        transaction.setMaxAutomaticTokenAssociations(maxAutoTokenAssociations);
    }

    if (stakedAccountId != null) {
        const accountId = AccountId.fromString(stakedAccountId);

        transaction.setStakedAccountId(accountId);
    }

    if (stakedNodeId != null) {
        transaction.setStakedNodeId(Long.fromString(stakedNodeId));
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (declineStakingReward != null) {
        transaction.setDeclineStakingReward(declineStakingReward);
    }

    if (memo != null) {
        transaction.setAccountMemo(memo);
    }

    if (autoRenewPeriod != null) {
        transaction.setAutoRenewPeriod(Long.fromString(autoRenewPeriod));
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

export const updateAccount = async (
    params: UpdateAccountParams,
): Promise<AccountResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildUpdateAccount(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildDeleteAccount builds an AccountDeleteTransaction from parameters
const buildDeleteAccount = (
    {
        deleteAccountId,
        transferAccountId,
        commonTransactionParams,
    }: DeleteAccountParams,
    client,
): AccountDeleteTransaction => {
    let transaction = new AccountDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (deleteAccountId != null) {
        transaction.setAccountId(AccountId.fromString(deleteAccountId));
    }

    if (transferAccountId != null) {
        transaction.setTransferAccountId(
            AccountId.fromString(transferAccountId),
        );
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

export const deleteAccount = async (
    params: DeleteAccountParams,
): Promise<AccountResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildDeleteAccount(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const getAccountBalance = async ({
    accountId,
    contractId,
    sessionId,
}: GetAccountBalanceParams): Promise<GetAccountBalanceResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new AccountBalanceQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (accountId != null) {
        transaction.setAccountId(accountId);
    }

    if (contractId != null) {
        transaction.setContractId(contractId);
    }

    const txResponse = await transaction.execute(client);

    let tokenBalances = {};
    for (const [tokenId, amount] of txResponse.tokens) {
        tokenBalances[tokenId.toString()] = amount.toString();
    }

    let tokenDecimals = {};
    for (const [tokenId, decimals] of txResponse.tokenDecimals) {
        tokenDecimals[tokenId.toString()] = decimals;
    }

    return {
        hbars: txResponse.hbars.toTinybars().toString(),
        tokenBalances: tokenBalances,
        tokenDecimals: tokenDecimals,
    };
};

// buildApproveAllowance builds an AccountAllowanceApproveTransaction from parameters
export const buildApproveAllowance = (
    {
        allowances,
        commonTransactionParams,
    }: AccountAllowanceApproveParams,
    client,
): AccountAllowanceApproveTransaction => {
    const transaction = new AccountAllowanceApproveTransaction();
    transaction.setGrpcDeadline(DEFAULT_GRPC_DEADLINE);

    for (const allowance of allowances) {
        const { ownerAccountId, spenderAccountId, hbar, token, nft } =
            allowance;
        const owner = AccountId.fromString(ownerAccountId);
        const spender = AccountId.fromString(spenderAccountId);

        if (hbar) {
            transaction.approveHbarAllowance(
                owner,
                spender,
                Hbar.fromTinybars(hbar.amount),
            );
        } else if (token) {
            transaction.approveTokenAllowance(
                TokenId.fromString(token.tokenId),
                owner,
                spender,
                Long.fromString(token.amount),
            );
        } else if (nft) {
            handleNftAllowances(transaction, nft, owner, spender);
        } else {
            throw new Error("No valid allowance type provided.");
        }
    }

    if (commonTransactionParams) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const approveAllowance = async (
    params: AccountAllowanceApproveParams,
): Promise<AccountResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildApproveAllowance(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildDeleteAllowance builds an AccountAllowanceDeleteTransaction from parameters
const buildDeleteAllowance = (
    {
        allowances,
        commonTransactionParams,
    }: DeleteAllowanceParams,
    client,
): AccountAllowanceDeleteTransaction => {
    let transaction = new AccountAllowanceDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    for (const allowance of allowances) {
        const owner = AccountId.fromString(allowance.ownerAccountId);
        const tokenId = TokenId.fromString(allowance.tokenId);

        for (const serialNumber of allowance.serialNumbers) {
            const nftId = new NftId(tokenId, Long.fromString(serialNumber));

            transaction.deleteAllTokenNftAllowances(nftId, owner);
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

export const deleteAllowance = async (
    params: DeleteAllowanceParams,
): Promise<AccountResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildDeleteAllowance(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

// buildTransferCrypto builds a TransferTransaction from parameters
export const buildTransferCrypto = (
    {
        transfers,
        commonTransactionParams,
    }: TransferCryptoParams,
    client,
): TransferTransaction => {
    if (!transfers.length) {
        throw new Error("No transfers provided.");
    }

    let transaction = new TransferTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    for (const txParams of transfers) {
        const isApproved = txParams.approved ?? false;

        if (txParams.hbar) {
            const amount = Hbar.fromTinybars(txParams.hbar.amount);

            if (txParams.hbar.accountId != null) {
                const accountId = AccountId.fromString(txParams.hbar.accountId);

                isApproved
                    ? transaction.addApprovedHbarTransfer(accountId, amount)
                    : transaction.addHbarTransfer(accountId, amount);
            } else if (txParams.hbar.evmAddress != null) {
                const evmAddress = EvmAddress.fromString(
                    txParams.hbar.evmAddress,
                );
                const accountId = AccountId.fromEvmAddress(0, 0, evmAddress);

                isApproved
                    ? transaction.addApprovedHbarTransfer(accountId, amount)
                    : transaction.addHbarTransfer(accountId, amount);
            }
        } else if (txParams.token != null) {
            const accountId = AccountId.fromString(txParams.token.accountId);
            const tokenId = TokenId.fromString(txParams.token.tokenId);
            const amount = Long.fromString(txParams.token.amount);

            if (txParams.token.decimals !== undefined) {
                isApproved
                    ? transaction.addApprovedTokenTransfer(
                          tokenId,
                          accountId,
                          amount,
                      )
                    : transaction.addTokenTransferWithDecimals(
                          tokenId,
                          accountId,
                          amount,
                          txParams.token.decimals,
                      );
            } else {
                isApproved
                    ? transaction.addApprovedTokenTransfer(
                          tokenId,
                          accountId,
                          amount,
                      )
                    : transaction.addTokenTransfer(tokenId, accountId, amount);
            }
        } else if (txParams.nft != null) {
            const senderAccountId = AccountId.fromString(
                txParams.nft.senderAccountId,
            );
            const receiverAccountId = AccountId.fromString(
                txParams.nft.receiverAccountId,
            );
            const nftId = new NftId(
                TokenId.fromString(txParams.nft.tokenId),
                Long.fromString(txParams.nft.serialNumber),
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

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    return transaction;
};

export const transferCrypto = async (
    params: TransferCryptoParams,
): Promise<AccountResponse> => {
    const client = sdk.getClient(params.sessionId);
    const transaction = buildTransferCrypto(params, client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};
