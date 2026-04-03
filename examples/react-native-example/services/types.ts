/**
 * TypeScript interfaces for the Hiero SDK service layer.
 *
 * These types provide a clean contract between the SDK service module
 * and the UI layer. Every service function returns an SDKResult<T>,
 * making it trivial for UI components to handle success and error states.
 */

/**
 * Generic result wrapper for all SDK operations.
 *
 * @template T - The type of data returned on success.
 *
 * Usage pattern in UI:
 * ```tsx
 * const result = await createAccount(client);
 * if (result.success) {
 *   // result.data is typed as AccountInfo
 * } else {
 *   // result.error contains the error message string
 * }
 * ```
 */
export type SDKResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Data returned after successfully creating a new account.
 */
export interface AccountInfo {
  /** The new account's ID (e.g., "0.0.12345") */
  accountId: string;
  /** The new account's private key (DER-encoded hex) — for demo purposes only */
  privateKey: string;
  /** The new account's public key (DER-encoded hex) */
  publicKey: string;
}

/**
 * Data returned from a balance query.
 */
export interface BalanceInfo {
  /** The queried account ID */
  accountId: string;
  /** HBAR balance as a human-readable string (e.g., "100 ℏ") */
  balance: string;
}

/**
 * Data returned after a successful HBAR transfer.
 */
export interface TransferResult {
  /** The transaction ID for the transfer */
  transactionId: string;
  /** Human-readable status (e.g., "SUCCESS") */
  status: string;
}

/**
 * Data returned after successfully creating a fungible token.
 */
export interface TokenInfo {
  /** The new token's ID (e.g., "0.0.12345") */
  tokenId: string;
  /** The token's name */
  name: string;
  /** The token's symbol */
  symbol: string;
}

/**
 * Data returned after a successful token transfer.
 */
export interface TokenTransferResult {
  /** The transaction ID for the token transfer */
  transactionId: string;
  /** Human-readable status (e.g., "SUCCESS") */
  status: string;
  /** The token ID that was transferred */
  tokenId: string;
}

/**
 * Configuration for connecting to the Hiero network.
 * These values come from user input (Settings screen) or environment variables.
 */
export interface NetworkConfig {
  /** Operator account ID (e.g., "0.0.12345") */
  operatorId: string;
  /** Operator private key (DER-encoded hex string) */
  operatorKey: string;
  /** Network name: "testnet" or "previewnet" */
  network: 'testnet' | 'previewnet';
}
