/**
 * Base interface for all RPC method parameters.
 * Includes sessionId for concurrent test execution support.
 */
export interface BaseParams {
    readonly sessionId?: string;
}

/**
 * Base interface for transaction parameters.
 * Extends BaseParams and includes common transaction parameters.
 */
export interface BaseTransactionParams extends BaseParams {
    readonly commonTransactionParams?: Record<string, any>;
}
