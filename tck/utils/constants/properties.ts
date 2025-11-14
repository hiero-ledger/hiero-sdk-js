import { TokenType, TokenSupplyType } from "@hiero-ledger/sdk";

export const tokenTypeMap = {
    ft: TokenType.FungibleCommon,
    nft: TokenType.NonFungibleUnique,
};

export const supplyTypeMap = {
    finite: TokenSupplyType.Finite,
    infinite: TokenSupplyType.Infinite,
};
