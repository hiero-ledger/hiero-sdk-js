import { BaseParams } from "./base";

export interface KeyGenerationParams extends BaseParams {
    readonly type: string;
    readonly fromKey?: string;
    readonly threshold?: number;
    readonly keys?: KeyGenerationParams[];
}
