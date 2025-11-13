import { Client, AccountId } from "@hiero-ledger/sdk";

import { sdk } from "../sdk_data";
import { SdkResponse } from "../response/sdk";
import { SdkSetupParams } from "../params/sdk";

export default {
    setup: ({
        operatorAccountId,
        operatorPrivateKey,
        nodeIp,
        nodeAccountId,
        mirrorNetworkIp,
    }: SdkSetupParams): SdkResponse => {
        let client: Client;

        if (nodeIp && nodeAccountId && mirrorNetworkIp) {
            const node = { [nodeIp]: AccountId.fromString(nodeAccountId) };
            client = Client.forNetwork(node);
        } else {
            client = Client.forTestnet();
        }

        client.setOperator(operatorAccountId, operatorPrivateKey);
        client.setRequestTimeout(30000);

        sdk.client = client;

        return {
            message: `Successfully setup ${client} client.`,
            status: "SUCCESS",
        };
    },
    reset: (): SdkResponse => {
        sdk.client = null;
        return { status: "SUCCESS" };
    },
};
