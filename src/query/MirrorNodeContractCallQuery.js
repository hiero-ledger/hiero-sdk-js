import MirrorNodeContractQuery from "./MirrorNodeContractQuery.js";
import * as hex from "../encoding/hex.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 A query that simulates a contract function call using the Hedera Mirror Node.
 * 
 * This query allows you to execute a read-only smart contract call without submitting a transaction
 * to the main network. It's useful for querying contract state or executing view/pure functions.
 * The simulation is performed against the state of the contract at a specific block height.
 */
export default class MirrorNodeContractCallQuery extends MirrorNodeContractQuery {
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
            estimate: false,
            gasPrice: this.gasPrice?.toString(),
            gas: this.gasLimit?.toString(),
            blockNumber: this.blockNumber?.toString(),
            value: this.value?.toString(),
        };
    }

    /**
     * @param {Client} client
     * @returns {Promise<string>}
     */
    async execute(client) {
        const mirrorNodeRequest = await this.performMirrorNodeRequest(
            client,
            this.JSONPayload,
        );

        return mirrorNodeRequest.result;
    }
}
