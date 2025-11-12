export interface SdkSetupParams {
    readonly operatorAccountId: string;
    readonly operatorPrivateKey: string;
    readonly nodeIp?: string;
    readonly nodeAccountId?: string;
    readonly mirrorNetworkIp?: string;
    readonly sessionId?: string;
}

type RpcMethod = {
    readonly name: string;
    readonly param: any;
};

export interface RpcMethodParams {
    readonly callClass: string;
    readonly methods: RpcMethod[];
    readonly sessionId?: string;
}
