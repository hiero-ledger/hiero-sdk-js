import { BaseParams } from "./base";

export interface GetAddressBookParams extends BaseParams {
    readonly fileId?: string;
    readonly limit?: number;
}

