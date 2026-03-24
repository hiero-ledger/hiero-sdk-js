/**
 * Services barrel export.
 *
 * Re-exports all SDK service functions and types from a single entry point.
 * UI components import from '@/services' instead of individual files.
 *
 * Example usage in a screen:
 * ```tsx
 * import { initClient, createAccount } from '@/services';
 * import type { NetworkConfig, SDKResult, AccountInfo } from '@/services';
 * ```
 */

export {
  initClient,
  createAccount,
  getAccountBalance,
  transferHbar,
  createFungibleToken,
  transferToken,
} from './hiero-service';

export type {
  SDKResult,
  AccountInfo,
  BalanceInfo,
  TransferResult,
  TokenInfo,
  TokenTransferResult,
  NetworkConfig,
} from './types';
