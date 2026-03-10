import { BaseParams } from "./base";
import type Long from "long";

export interface GetAddressBookParams extends BaseParams {
    readonly fileId?: string;
    readonly limit?: number;
}

/**
 * Type for SDK NodeAddress (from @hiero-ledger/sdk)
 */
export type SdkNodeAddress = {
    addresses?: Array<{
        address?: string | { toString(): string };
        port?: number | null;
    }>;
    nodeId?: Long | null;
    accountId?: { toString(): string } | null;
    publicKey?: string | null;
    certHash?: Uint8Array | null;
    description?: string | null;
};
