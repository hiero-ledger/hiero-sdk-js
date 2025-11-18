import {
    AccountId,
    AccountAllowanceApproveTransaction,
    TokenId,
    NftId,
    AccountInfo,
} from "@hiero-ledger/sdk";
import Long from "long";

import { NftAllowanceParams } from "../../params/allowance";
import {
    GetAccountInfoResponse,
    TokenRelationshipInfo,
} from "../../response/account";

export const handleNftAllowances = (
    transaction: AccountAllowanceApproveTransaction,
    nft: NftAllowanceParams,
    owner: AccountId,
    spender: AccountId,
) => {
    const { tokenId, serialNumbers, delegateSpenderAccountId, approvedForAll } =
        nft;

    if (delegateSpenderAccountId === "") {
        throw new Error("delegateSpenderAccountId cannot be an empty string!");
    }

    if (serialNumbers) {
        for (const serialNumber of serialNumbers) {
            const nftId = new NftId(
                TokenId.fromString(tokenId),
                Long.fromString(serialNumber),
            );

            if (delegateSpenderAccountId) {
                transaction.approveTokenNftAllowanceWithDelegatingSpender(
                    nftId,
                    owner,
                    spender,
                    AccountId.fromString(delegateSpenderAccountId),
                );
            } else {
                transaction.approveTokenNftAllowance(nftId, owner, spender);
            }
        }
    } else if (approvedForAll) {
        transaction.approveTokenNftAllowanceAllSerials(
            TokenId.fromString(tokenId),
            owner,
            spender,
        );
    } else {
        transaction.deleteTokenNftAllowanceAllSerials(
            TokenId.fromString(tokenId),
            owner,
            spender,
        );
    }
};

export const mapAccountInfoResponse = (
    accountInfo: AccountInfo,
): GetAccountInfoResponse => {
    const liveHashes = accountInfo.liveHashes.map((liveHash) => ({
        accountId: liveHash.accountId.toString(),
        hash: Buffer.from(liveHash.hash).toString("base64"),
        keys: liveHash.keys.toArray().map((key) => key.toString()),
        duration: liveHash.duration.seconds.toString(),
    }));

    const tokenRelationships: Record<string, TokenRelationshipInfo> = {};
    for (const [tokenId, relationship] of accountInfo.tokenRelationships) {
        tokenRelationships[tokenId.toString()] = {
            tokenId: relationship.tokenId.toString(),
            symbol: relationship.symbol ?? null,
            balance: relationship.balance.toString(),
            isKycGranted: relationship.isKycGranted ?? null,
            isFrozen: relationship.isFrozen ?? null,
            automaticAssociation: relationship.automaticAssociation ?? null,
        };
    }

    const hbarAllowances = accountInfo.hbarAllowances.map((allowance) => ({
        ownerAccountId:
            allowance.ownerAccountId != null
                ? allowance.ownerAccountId.toString()
                : null,
        spenderAccountId:
            allowance.spenderAccountId != null
                ? allowance.spenderAccountId.toString()
                : null,
        amount:
            allowance.amount != null
                ? allowance.amount.toTinybars().toString()
                : null,
    }));

    const tokenAllowances = accountInfo.tokenAllowances.map((allowance) => ({
        tokenId: allowance.tokenId.toString(),
        ownerAccountId:
            allowance.ownerAccountId != null
                ? allowance.ownerAccountId.toString()
                : null,
        spenderAccountId:
            allowance.spenderAccountId != null
                ? allowance.spenderAccountId.toString()
                : null,
        amount: allowance.amount != null ? allowance.amount.toString() : null,
    }));

    const nftAllowances = accountInfo.nftAllowances.map((allowance) => ({
        tokenId: allowance.tokenId.toString(),
        ownerAccountId:
            allowance.ownerAccountId != null
                ? allowance.ownerAccountId.toString()
                : null,
        spenderAccountId:
            allowance.spenderAccountId != null
                ? allowance.spenderAccountId.toString()
                : null,
        serialNumbers:
            allowance.serialNumbers != null
                ? allowance.serialNumbers.map((serial) => serial.toString())
                : null,
        allSerials: allowance.allSerials ?? null,
        delegatingSpender:
            allowance.delegatingSpender != null
                ? allowance.delegatingSpender.toString()
                : null,
    }));

    const stakingInfo = accountInfo.stakingInfo
        ? {
              declineStakingReward:
                  accountInfo.stakingInfo.declineStakingReward,
              stakePeriodStart: accountInfo.stakingInfo.stakePeriodStart
                  ? accountInfo.stakingInfo.stakePeriodStart.toString()
                  : null,
              pendingReward: accountInfo.stakingInfo.pendingReward
                  ? accountInfo.stakingInfo.pendingReward
                        .toTinybars()
                        .toString()
                  : null,
              stakedToMe: accountInfo.stakingInfo.stakedToMe
                  ? accountInfo.stakingInfo.stakedToMe.toTinybars().toString()
                  : null,
              stakedAccountId: accountInfo.stakingInfo.stakedAccountId
                  ? accountInfo.stakingInfo.stakedAccountId.toString()
                  : null,
              stakedNodeId: accountInfo.stakingInfo.stakedNodeId
                  ? accountInfo.stakingInfo.stakedNodeId.toString()
                  : null,
          }
        : null;

    return {
        accountId: accountInfo.accountId.toString(),
        contractAccountId: accountInfo.contractAccountId ?? null,
        isDeleted: accountInfo.isDeleted,
        proxyAccountId:
            accountInfo.proxyAccountId != null
                ? accountInfo.proxyAccountId.toString()
                : null,
        proxyReceived: accountInfo.proxyReceived.toTinybars().toString(),
        key: accountInfo.key != null ? accountInfo.key.toString() : null,
        balance: accountInfo.balance.toTinybars().toString(),
        sendRecordThreshold: accountInfo.sendRecordThreshold
            .toTinybars()
            .toString(),
        receiveRecordThreshold: accountInfo.receiveRecordThreshold
            .toTinybars()
            .toString(),
        isReceiverSignatureRequired: accountInfo.isReceiverSignatureRequired,
        expirationTime: accountInfo.expirationTime.toString(),
        autoRenewPeriod: accountInfo.autoRenewPeriod.seconds.toString(),
        liveHashes,
        tokenRelationships,
        accountMemo: accountInfo.accountMemo,
        ownedNfts: accountInfo.ownedNfts.toString(),
        maxAutomaticTokenAssociations:
            accountInfo.maxAutomaticTokenAssociations.toString(),
        aliasKey:
            accountInfo.aliasKey != null
                ? accountInfo.aliasKey.toString()
                : null,
        ledgerId:
            accountInfo.ledgerId != null
                ? accountInfo.ledgerId.toString()
                : null,
        hbarAllowances,
        tokenAllowances,
        nftAllowances,
        ethereumNonce:
            accountInfo.ethereumNonce != null
                ? accountInfo.ethereumNonce.toString()
                : null,
        stakingInfo,
    };
};
