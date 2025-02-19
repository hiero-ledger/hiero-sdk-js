import { Client, AccountId } from "@hashgraph/sdk";

export const sdk = {
    client: null,
    getClient(): Client {
        if (this.client == null) {
            throw new Error("Client not set up");
        }

        if (process.env.RUNNING_IN_DOCKER && process.env.NETWORK === "local") {
            this.client.setNetwork({
                "network-node:50211": new AccountId(3),
            });
        }

        return this.client;
    },
};
