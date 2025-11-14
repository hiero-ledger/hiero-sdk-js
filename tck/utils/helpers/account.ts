import {
    AccountId,
    AccountAllowanceApproveTransaction,
    TokenId,
    NftId,
} from "@hiero-ledger/sdk";
import Long from "long";

import { NftAllowanceParams } from "../../params/allowance";

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
