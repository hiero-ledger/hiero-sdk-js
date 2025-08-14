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
                OPERATOR_ID: "0.0.2",
                OPERATOR_KEY:
                    "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137",
                HEDERA_NETWORK: "local-node",
            },
            nodeAccountIds: options.nodeAccountIds,
            balance: options.balance,
            throwaway: options.throwaway,
        });
    }
}
