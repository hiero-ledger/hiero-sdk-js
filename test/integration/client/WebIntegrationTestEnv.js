import Wallet from "../../../src/Wallet.js";
import Client from "../../../src/client/WebClient.js";
import BaseIntegrationTestEnv from "./BaseIntegrationTestEnv.js";

export { Client };

export function skipTestDueToNodeJsVersion() {
    return true;
}
export default class IntegrationTestEnv extends BaseIntegrationTestEnv {
    /**
     * @param {object} [options]
     * @property {number} [options.nodeAccountIds]
     * @property {number} [options.balance]
     * @property {boolean} [options.throwaway]
     */
    static async new(options = {}) {
        return BaseIntegrationTestEnv.new({
            client: Client,
            wallet: Wallet,
            env: {
                OPERATOR_ID: import.meta.env.VITE_OPERATOR_ID,
                OPERATOR_KEY: import.meta.env.VITE_OPERATOR_KEY,
                HEDERA_NETWORK: import.meta.env.VITE_HEDERA_NETWORK,
                GENESIS_OPERATOR_ID: import.meta.env.VITE_GENESIS_OPERATOR_ID,
                GENESIS_OPERATOR_KEY: import.meta.env.VITE_GENESIS_OPERATOR_KEY,
                // A browser reaches the consensus node through its gRPC-Web
                // proxy, so NODE_WEB_IP stands in for NODE_IP. The mirror
                // gRPC endpoint does not apply: browsers stream over gRPC-Web.
                NODE_IP: import.meta.env.VITE_NODE_WEB_IP,
                NODE_ACCOUNT_ID: import.meta.env.VITE_NODE_ACCOUNT_ID,
                MIRROR_NODE_REST_URL: import.meta.env.VITE_MIRROR_NODE_REST_URL,
            },
            nodeAccountIds: options.nodeAccountIds,
            balance: options.balance,
            throwaway: options.throwaway,
        });
    }
}
