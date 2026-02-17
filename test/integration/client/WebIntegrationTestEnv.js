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
            },
            nodeAccountIds: options.nodeAccountIds,
            balance: options.balance,
            throwaway: options.throwaway,
        });
    }
}
