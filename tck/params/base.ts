/**
 * Base interface for all RPC method parameters.
 * Includes sessionId for concurrent test execution support.
 */
export interface BaseParams {
    readonly sessionId?: string;
}

/**
 * Helper type to add sessionId to existing parameter interfaces.
 * Usage: WithSession<ExistingParams>
 */
export type WithSession<T> = T & BaseParams;


