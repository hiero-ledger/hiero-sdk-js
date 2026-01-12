import {
    PrivateKey,
    TokenDeleteTransaction,
    AccountId,
    Wallet,
} from "../../../src/exports.js";
import LocalProvider from "../../../src/LocalProvider.js";

/**
 * @typedef {import("../../../src/exports.js").TokenId} TokenId
 * @typedef {import("../../../src/client/Client.js").Client<*, *>} Client
 */

export default class BaseIntegrationTestEnv {
    /**
     * @param {object} options
     * @property {Client} props.client
     * @property {PublicKey} options.originalOperatorKey
     * @property {AccountId} options.originalOperatorId
     * @property {PrivateKey} options.originalOperatorKey
     * @property {AccountId} options.operatorKey
     * @property {AccountId[]} options.operatorId
     * @property {Wallet} options.wallet
     */
    constructor(options) {
        /** @type {Client} */
        this.client = options.client;

        /** @type {PrivateKey} */
        this.operatorKey = options.operatorKey;

        /** @type {AccountId} */
        this.operatorId = options.operatorId;

        /** @type {PrivateKey} */
        this.genesisOperatorKey = options.genesisOperatorKey;

        /** @type {AccountId} */
        this.genesisOperatorId = options.genesisOperatorId;

        this.throwaway = options.throwaway;

        /** @type {Wallet} */
        this.wallet = options.wallet;

        Object.freeze(this);
    }

    /**
     * @param {object} [options]
     * @property {Client<*, *>} options.client
     * @property {{ [key: string]: string}} options.env
     * @property {number} [options.nodeAccountIds]
     * @property {boolean} [options.throwaway]
     */
    static async new(options = {}) {
        let client, wallet;

        if (
            options.env.HEDERA_NETWORK != null &&
            options.env.HEDERA_NETWORK == "previewnet"
        ) {
            client = options.client.forPreviewnet();
        } else if (
            options.env.HEDERA_NETWORK != null &&
            options.env.HEDERA_NETWORK == "testnet"
        ) {
            client = options.client.forTestnet();
        } else if (
            (options.env.HEDERA_NETWORK != null &&
                options.env.HEDERA_NETWORK == "localhost") ||
            options.env.HEDERA_NETWORK == "local-node"
        ) {
            client = options.client.forLocalNode();
        } else if (options.env.CONFIG_FILE != null) {
            client = await options.client.fromConfigFile(
                options.env.CONFIG_FILE,
            );
        } else {
            throw new Error(
                "Failed to construct client for IntegrationTestEnv",
            );
        }

        if (
            options.env.OPERATOR_ID != null &&
            options.env.OPERATOR_KEY != null
        ) {
            this.operatorId = AccountId.fromString(options.env.OPERATOR_ID);
            this.operatorKey = PrivateKey.fromStringDer(
                options.env.OPERATOR_KEY,
            );

            client.setOperator(this.operatorId, this.operatorKey);
            client.setMirrorNetwork(options.env.HEDERA_NETWORK);
        }

        if (
            options.env.GENESIS_OPERATOR_ID != null &&
            options.env.GENESIS_OPERATOR_KEY != null
        ) {
            const genesisOperatorId = AccountId.fromString(
                options.env.GENESIS_OPERATOR_ID,
            );
            const genesisOperatorKey = PrivateKey.fromStringDer(
                options.env.GENESIS_OPERATOR_KEY,
            );

            this.genesisOperatorId = genesisOperatorId;
            this.genesisOperatorKey = genesisOperatorKey;
        }

        client
            .setMaxNodeAttempts(1)
            .setNodeMinBackoff(0)
            .setNodeMaxBackoff(0)
            .setNodeMinReadmitPeriod(0)
            .setNodeMaxReadmitPeriod(0);

        const network = {};
        const nodeAccountIds =
            options.nodeAccountIds != null ? options.nodeAccountIds : 1;
        for (const [key, value] of Object.entries(client.network)) {
            network[key] = value;

            if (Object.keys(network).length >= nodeAccountIds) {
                break;
            }
        }
        client.setNetwork(network);
        wallet = new Wallet(
            this.operatorId,
            this.operatorKey,
            new LocalProvider(),
        );

        return new BaseIntegrationTestEnv({
            client: client,
            wallet: wallet,
            operatorKey: this.operatorKey,
            operatorId: this.operatorId,
            genesisOperatorKey: this.genesisOperatorKey,
            genesisOperatorId: this.genesisOperatorId,
            throwaway: options.throwaway,
        });
    }

    /**
     * @param {object} [options]
     * @property {TokenId | TokenId[]} token
     */
    async close(options = {}) {
        if (options.token != null) {
            if (!Array.isArray(options.token)) {
                options.token = [options.token];
            }

            for (const token of options.token) {
                await (
                    await new TokenDeleteTransaction()
                        .setTokenId(token)
                        .execute(this.client)
                ).getReceipt(this.client);
            }
        }

        this.client.close();
    }
}
