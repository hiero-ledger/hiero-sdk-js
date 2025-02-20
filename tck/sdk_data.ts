import { Client } from "@hashgraph/sdk";

export const sdk = {
    client: null,
    getClient(): Client {
        if (this.client == null) {
            throw new Error("Client not set up");
        }

        return this.client;
    },
};
