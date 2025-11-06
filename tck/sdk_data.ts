import { Client } from "@hashgraph/sdk";

/**
 * Client registry for session-based client management.
 * Supports concurrent test execution by maintaining separate client instances per session.
 */
class ClientRegistry {
    private clients: Map<string, Client> = new Map();
    private defaultClient: Client | null = null;
    private requestCounts: Map<string, number> = new Map();
    private sessionCreationTime: Map<string, number> = new Map();

    /**
     * Gets a client for the specified session, or the default client if no session is provided.
     * @param sessionId - Optional session ID for parallel test execution
     * @returns The client instance
     * @throws Error if no client is set up for the session or default
     */
    getClient(sessionId?: string): Client {
        // Track request count
        const trackingId = sessionId || "default";
        this.requestCounts.set(
            trackingId,
            (this.requestCounts.get(trackingId) || 0) + 1,
        );

        if (sessionId) {
            const client = this.clients.get(sessionId);
            if (!client) {
                throw new Error(`Client not set up for session: ${sessionId}`);
            }

            return client;
        }

        if (this.defaultClient == null) {
            throw new Error("Client not set up for default session");
        }

        return this.defaultClient;
    }

    /**
     * Sets a client for the specified session, or as the default client.
     * @param client - The client instance to store
     * @param sessionId - Optional session ID for parallel test execution
     */
    setClient(client: Client, sessionId?: string): void {
        if (sessionId) {
            this.clients.set(sessionId, client);
            this.sessionCreationTime.set(sessionId, Date.now());
            this.requestCounts.set(sessionId, 0);
        } else {
            this.defaultClient = client;
        }
    }

    /**
     * Removes a client for the specified session, or the default client.
     * @param sessionId - Optional session ID for parallel test execution
     */
    removeClient(sessionId?: string): void {
        if (sessionId) {
            const client = this.clients.get(sessionId);
            if (client) {
                client.close();
                this.clients.delete(sessionId);
                this.requestCounts.delete(sessionId);
                this.sessionCreationTime.delete(sessionId);
            }
        } else {
            if (this.defaultClient) {
                this.defaultClient.close();
                this.defaultClient = null;
            }
        }
    }

    /**
     * Checks if a client exists for the specified session or as default.
     * @param sessionId - Optional session ID
     * @returns true if a client exists
     */
    hasClient(sessionId?: string): boolean {
        if (sessionId) {
            return this.clients.has(sessionId);
        }
        return this.defaultClient !== null;
    }

    /**
     * Gets the number of active sessions.
     * @returns The number of active client sessions
     */
    getActiveSessionCount(): number {
        return this.clients.size;
    }
}

export const sdk = new ClientRegistry();
