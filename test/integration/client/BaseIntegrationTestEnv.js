import {
    AccountInfoQuery,
    PrivateKey,
    TokenDeleteTransaction,
    AccountId,
    Wallet,
    MaxAttemptsOrTimeoutError,
} from "../../../src/exports.js";
import GrpcServiceError from "../../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../../src/grpc/GrpcStatus.js";
import LocalProvider from "../../../src/LocalProvider.js";
import { applyEndpointOverrides } from "./endpointOverrides.js";

/**
 * Whether the consensus node answers, shared by every test file this worker
 * runs (the suites run with `isolate: false`). Once two probes in a row have
 * found the node unreachable, every later `new()` fails at once instead of
 * waiting out its hook timeout: vitest's bail only counts failed tests, not
 * failed hooks, so a node that stops answering between files would
 * otherwise cost 120 s per remaining file. A single failed probe only fails
 * its own setup, so one short stall does not take the rest of the run down.
 */
const reachability = {
    /** @type {string | null} */
    unreachableSince: null,
    lastConfirmedAt: 0,
    failedProbesInARow: 0,
};
const REACHABILITY_PROBE_INTERVAL_MS = 30_000;
const REACHABILITY_PROBE_DEADLINE_MS = 10_000;
const REACHABILITY_FAILED_PROBES_TO_LATCH = 2;

/**
 * Asks the node for the cost of an account info query, the same free
 * request `Client.ping()` makes, at most every 30 s. Only a transport
 * failure marks the network unreachable; a status such as BUSY proves the
 * node is there.
 *
 * @param {Client} client
 * @returns {Promise<void>}
 */
async function assertNetworkReachable(client) {
    if (
        client.operatorAccountId == null ||
        Date.now() - reachability.lastConfirmedAt <
            REACHABILITY_PROBE_INTERVAL_MS
    ) {
        return;
    }
    try {
        await new AccountInfoQuery()
            .setAccountId(client.operatorAccountId)
            .setMaxAttempts(2)
            .setGrpcDeadline(REACHABILITY_PROBE_DEADLINE_MS)
            .getCost(client);
    } catch (error) {
        if (isTransportFailure(error)) {
            reachability.failedProbesInARow += 1;
            if (
                reachability.failedProbesInARow >=
                REACHABILITY_FAILED_PROBES_TO_LATCH
            ) {
                reachability.unreachableSince = new Date().toISOString();
            }
            throw new Error(
                `the network stopped answering: ${
                    /** @type {Error} */ (error).message
                }`,
            );
        }
    }
    reachability.failedProbesInARow = 0;
    reachability.lastConfirmedAt = Date.now();
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isTransportFailure(error) {
    if (error instanceof GrpcServiceError) {
        return [
            GrpcStatus.Unavailable,
            GrpcStatus.DeadlineExceeded,
            GrpcStatus.Timeout,
        ].some((status) => status._code === error.status._code);
    }
    return (
        error instanceof MaxAttemptsOrTimeoutError &&
        /timeout|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(error.message)
    );
}

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
        if (reachability.unreachableSince != null) {
            throw new Error(
                `the network has not answered since ${reachability.unreachableSince}, failing setup at once`,
            );
        }

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
            // The config file's endpoints are explicit; an environment
            // override would silently replace them.
            if (options.env.NODE_IP || options.env.MIRROR_NETWORK) {
                throw new Error(
                    "CONFIG_FILE sets the network itself; remove NODE_IP and MIRROR_NETWORK or move them into the file",
                );
            }
            client = await options.client.fromConfigFile(
                options.env.CONFIG_FILE,
            );
        } else {
            throw new Error(
                "Failed to construct client for IntegrationTestEnv",
            );
        }

        applyEndpointOverrides(client, options.env);

        if (
            options.env.OPERATOR_ID != null &&
            options.env.OPERATOR_KEY != null
        ) {
            this.operatorId = AccountId.fromString(options.env.OPERATOR_ID);
            this.operatorKey = PrivateKey.fromStringDer(
                options.env.OPERATOR_KEY,
            );

            client.setOperator(this.operatorId, this.operatorKey);
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
        await assertNetworkReachable(client);
        wallet = new Wallet(
            this.operatorId,
            this.operatorKey,
            LocalProvider.fromClient(client),
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
