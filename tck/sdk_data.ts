import { Client } from "@hiero-ledger/sdk";

/**
 * Client registry for session-based client management.
 * Supports concurrent test execution by maintaining separate client instances per session.
 */
class ClientRegistry {
    private clients: Map<string, Client> = new Map();

    /**
     * Gets a client for the specified session.
     * @param sessionId - Session ID for parallel test execution
     * @returns The client instance
     * @throws Error if no client is set up for the session
     */
    getClient(sessionId: string): Client {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client not set up for session: ${sessionId}`);
        }

        return client;
    }

    /**
     * Sets a client for the specified session.
     * @param client - The client instance to store
     * @param sessionId - Session ID for parallel test execution
     */
    setClient(client: Client, sessionId: string): void {
        this.clients.set(sessionId, client);
    }

    /**
     * Removes a client for the specified session.
     * @param sessionId - Session ID for parallel test execution
     */
    removeClient(sessionId: string): void {
        const client = this.clients.get(sessionId);
        if (client) {
            client.close();
            this.clients.delete(sessionId);
        }
    }

    /**
     * Checks if a client exists for the specified session.
     * @param sessionId - Session ID
     * @returns true if a client exists
     */
    hasClient(sessionId: string): boolean {
        return this.clients.has(sessionId);
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
