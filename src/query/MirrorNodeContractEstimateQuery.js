import MirrorNodeContractQuery from "./MirrorNodeContractQuery.js";
import * as hex from "../encoding/hex.js";
/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * A query that estimates the gas required for a contract function call using the Hedera Mirror Node.
 *
 * This query simulates a contract call to estimate the amount of gas that would be required
 * to execute the same call on the main network. It's useful for determining the appropriate
 * gas limit before submitting an actual transaction.
 */
export default class MirrorNodeContractEstimateQuery extends MirrorNodeContractQuery {
    /**
     * @returns {object}
     */
    get JSONPayload() {
        if (this.callData == null) {
            throw new Error("Call data is required.");
        }

        return {
            data: hex.encode(this.callData),
            from: this.senderEvmAddress,
            to: this.contractEvmAddress,
            estimate: true,
            gasPrice: this.gasPrice?.toString(),
            gas: this.gasLimit?.toString(),
            blockNumber: this.blockNumber?.toString(),
            value: this.value?.toString(),
        };
    }

    /**
     * @param {Client} client
     * @returns {Promise<number>}
     */
    async execute(client) {
        const mirrorNodeRequest = await this.performMirrorNodeRequest(
            client,
            this.JSONPayload,
        );

        return Number(mirrorNodeRequest.result);
    }
}
