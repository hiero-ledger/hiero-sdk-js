import { BaseTransactionParams } from "./base";

export interface TransferCryptoParams extends BaseTransactionParams {
    readonly transfers?: TransferParams[];
}

export interface TransferParams {
    readonly hbar?: HbarTransferParams;
    readonly token?: TokenTransferParams;
    readonly nft?: NftTransferParams;
    readonly approved?: boolean;
}

export interface HbarTransferParams {
    readonly accountId: string;
    readonly evmAddress: string;
    readonly amount: string;
}

export interface NftTransferParams {
    readonly senderAccountId: string;
    readonly receiverAccountId: string;
    readonly tokenId: string;
    readonly serialNumber: string;
}

export interface TokenTransferParams {
    readonly accountId: string;
    readonly tokenId: string;
    readonly amount: string;
    readonly decimals: number;
}
