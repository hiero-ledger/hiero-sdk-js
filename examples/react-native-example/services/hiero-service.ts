/**
 * Hiero SDK Service Layer
 *
 * This module isolates all Hiero SDK interactions from the UI layer.
 * It provides a clean, typed API for common blockchain operations.
 *
 * Architecture:
 * - Each function accepts a Client instance and returns SDKResult<T>
 * - The Client is created once via initClient() and shared across calls
 * - Error handling is centralised — callers just check result.success
 * - All SDK imports come from "@hiero-ledger/sdk" which resolves to
 *   the React Native entry point (src/native.js → NativeClient)
 *
 * Supported operations:
 * 1. initClient()        — Configures the Hiero client for a given network
 * 2. createAccount()     — Generates a new key pair and creates an account
 * 3. getAccountBalance() — Queries the HBAR balance of any account
 * 4. transferHbar()      — Sends HBAR from the operator to another account
 * 5. createFungibleToken() — Creates a new fungible token (HTS)
 * 6. transferToken()     — Transfers fungible tokens between accounts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  AccountCreateTransaction,
  AccountBalanceQuery,
  TransferTransaction,
  TokenCreateTransaction,
  TokenAssociateTransaction,
} from '@hiero-ledger/sdk';

import type {
  SDKResult,
  AccountInfo,
  BalanceInfo,
  TransferResult,
  TokenInfo,
  TokenTransferResult,
  NetworkConfig,
} from './types';

// ─── Client Initialisation ──────────────────────────────────────────────────

/**
 * Initialises and returns a Hiero Client configured for the chosen network.
 *
 * How it works:
 * 1. Creates a Client instance for "testnet" or "previewnet"
 * 2. Sets the operator account — this is the account that pays transaction fees
 * 3. The operator's private key is used to automatically sign transactions
 *
 * The Client object is the main entry point for all SDK interactions.
 * It manages gRPC connections to Hiero network nodes.
 *
 * @param config - Network configuration with operator credentials
 * @returns A configured Client instance, or an error message
 */
export function initClient(config: NetworkConfig): SDKResult<Client> {
  try {
    // Parse the operator account ID from its string form (e.g., "0.0.12345")
    const operatorId = AccountId.fromString(config.operatorId);

    // Parse the operator's private key from its DER-encoded hex string
    // fromStringDer() handles both ED25519 and ECDSA keys automatically
    const operatorKey = PrivateKey.fromStringDer(config.operatorKey);

    // Create a client for the specified network
    // Client.forTestnet() and Client.forPreviewnet() come pre-configured
    // with the correct node addresses for each network
    let client: Client;
    if (config.network === 'testnet') {
      client = Client.forTestnet();
    } else {
      client = Client.forPreviewnet();
    }

    // Set the operator — this account pays all transaction/query fees
    // and its key is used to automatically sign transactions
    client.setOperator(operatorId, operatorKey);

    return { success: true, data: client };
  } catch (error) {
    return {
      success: false,
      error: `Failed to initialise client: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ─── Account Operations ─────────────────────────────────────────────────────

/**
 * Creates a new Hiero account with an auto-generated key pair.
 *
 * How it works:
 * 1. Generates a new ED25519 private/public key pair
 * 2. Submits an AccountCreateTransaction to the network
 * 3. The transaction creates an account with the generated public key
 * 4. An initial balance of 10 HBAR is transferred from the operator
 * 5. Returns the new account ID and keys
 *
 * Key concepts:
 * - Every account on Hiero has at least one public key
 * - The private key is needed to authorise transactions FROM this account
 * - The operator pays the initial balance from their own funds
 * - The receipt confirms the transaction was processed and gives us the new account ID
 *
 * @param client - An initialised Hiero Client (from initClient)
 * @returns The new account's ID and key pair
 */
export async function createAccount(client: Client): Promise<SDKResult<AccountInfo>> {
  try {
    // Step 1: Generate a new ED25519 key pair
    // This key pair will control the new account
    const newKey = PrivateKey.generateED25519();

    // Step 2: Build and execute the AccountCreateTransaction
    // - setKeyWithoutAlias: sets the account's public key
    // - setInitialBalance: transfers HBAR from operator to the new account
    const transaction = new AccountCreateTransaction()
      .setKeyWithoutAlias(newKey.publicKey)
      .setInitialBalance(new Hbar(10));

    // Step 3: Execute the transaction — the operator's key signs automatically
    const response = await transaction.execute(client);

    // Step 4: Get the receipt — this waits for consensus and gives us the result
    // The receipt contains the newly created account ID
    const receipt = await response.getReceipt(client);

    return {
      success: true,
      data: {
        accountId: receipt.accountId!.toString(),
        privateKey: newKey.toStringDer(),
        publicKey: newKey.publicKey.toStringDer(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Account creation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ─── Balance Queries ─────────────────────────────────────────────────────────

/**
 * Queries the HBAR balance of any account on the network.
 *
 * How it works:
 * 1. Creates an AccountBalanceQuery with the target account ID
 * 2. Executes the query against a network node
 * 3. Returns the HBAR balance as a human-readable string
 *
 * Key concepts:
 * - Queries are free (no transaction fee) — they read data without modifying state
 * - The balance includes both HBAR and any associated tokens
 * - We only return the HBAR balance here for simplicity
 *
 * @param client - An initialised Hiero Client
 * @param accountId - The account ID to query (e.g., "0.0.12345")
 * @returns The account's HBAR balance
 */
export async function getAccountBalance(
  client: Client,
  accountId: string,
): Promise<SDKResult<BalanceInfo>> {
  try {
    // Parse the account ID string into an AccountId object
    const id = AccountId.fromString(accountId);

    // Execute the balance query — this is a free operation (no fees)
    const balance = await new AccountBalanceQuery()
      .setAccountId(id)
      .execute(client);

    return {
      success: true,
      data: {
        accountId: accountId,
        balance: balance?.hbars.toString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Balance query failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ─── HBAR Transfers ──────────────────────────────────────────────────────────

/**
 * Transfers HBAR from the operator account to another account.
 *
 * How it works:
 * 1. Creates a TransferTransaction with debit and credit entries
 * 2. The operator is debited (negative amount) and the recipient is credited
 * 3. The transaction is executed and the receipt confirms success
 *
 * Key concepts:
 * - Transfers use a double-entry model: debits must equal credits
 * - addHbarTransfer() with a negative amount = sending
 * - addHbarTransfer() with a positive amount = receiving
 * - The operator's key signs automatically (set during client init)
 * - Transaction fees are paid by the operator in addition to the transfer amount
 *
 * @param client - An initialised Hiero Client
 * @param toAccountId - The recipient's account ID (e.g., "0.0.12345")
 * @param amount - The amount of HBAR to transfer (as a number)
 * @returns The transaction ID and status
 */
export async function transferHbar(
  client: Client,
  toAccountId: string,
  amount: number,
): Promise<SDKResult<TransferResult>> {
  try {
    // Get the operator's account ID (the sender)
    const operatorId = client.operatorAccountId!;
    const recipientId = AccountId.fromString(toAccountId);

    // Build the transfer transaction using double-entry accounting:
    // - Debit the operator (negative amount)
    // - Credit the recipient (positive amount)
    const transaction = new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-amount))
      .addHbarTransfer(recipientId, new Hbar(amount));

    // Execute and wait for the receipt
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      success: true,
      data: {
        transactionId: response.transactionId.toString(),
        status: receipt.status.toString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `HBAR transfer failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ─── Token Operations ────────────────────────────────────────────────────────

/**
 * Creates a new fungible token using the Hiero Token Service (HTS).
 *
 * How it works:
 * 1. Creates a TokenCreateTransaction with the token properties
 * 2. The operator becomes the treasury account (holds initial supply)
 * 3. The operator's key is set as the admin and supply key
 * 4. Returns the new token ID
 *
 * Key concepts:
 * - HTS allows creating tokens natively on Hiero (no smart contracts needed)
 * - The treasury account receives the initial token supply
 * - Admin key: can modify/delete the token
 * - Supply key: can mint/burn additional supply
 * - Tokens must be "associated" with an account before it can hold them
 *
 * @param client - An initialised Hiero Client
 * @param name - Human-readable token name (e.g., "My Token")
 * @param symbol - Short token symbol (e.g., "MTK")
 * @param initialSupply - Number of tokens to mint initially
 * @returns The new token's ID, name, and symbol
 */
export async function createFungibleToken(
  client: Client,
  name: string,
  symbol: string,
  initialSupply: number,
): Promise<SDKResult<TokenInfo>> {
  try {
    const operatorId = client.operatorAccountId!;

    // Build the token creation transaction
    // - Treasury account holds the initial supply
    // - Admin key allows modifying the token later
    // - Supply key allows minting/burning tokens
    // - Decimals define the smallest unit (2 decimals = 0.01)
    const transaction = new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setDecimals(2)
      .setInitialSupply(initialSupply)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(client.operatorPublicKey!)
      .setSupplyKey(client.operatorPublicKey!);

    // Execute and get the receipt with the new token ID
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      success: true,
      data: {
        tokenId: receipt.tokenId!.toString(),
        name,
        symbol,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Token creation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Transfers fungible tokens from the operator to another account.
 *
 * How it works:
 * 1. First associates the token with the recipient account (if needed)
 * 2. Then transfers the specified amount using TransferTransaction
 * 3. Uses the same double-entry model as HBAR transfers
 *
 * Key concepts:
 * - Tokens must be associated with an account before it can receive them
 * - TokenAssociateTransaction links a token ID to an account
 * - The recipient must sign the association (here we use the provided key)
 * - addTokenTransfer() works like addHbarTransfer() but for tokens
 * - Negative amount = sending, positive amount = receiving
 *
 * @param client - An initialised Hiero Client
 * @param tokenId - The token ID to transfer (e.g., "0.0.12345")
 * @param toAccountId - The recipient's account ID
 * @param amount - Number of token units to transfer
 * @param recipientKey - The recipient's private key (needed to sign association)
 * @returns The transaction ID and status
 */
export async function transferToken(
  client: Client,
  tokenId: string,
  toAccountId: string,
  amount: number,
  recipientKey?: string,
): Promise<SDKResult<TokenTransferResult>> {
  try {
    const operatorId = client.operatorAccountId!;
    const recipientId = AccountId.fromString(toAccountId);

    // Step 1: Associate the token with the recipient account
    // This is required before the account can hold this token type.
    // The recipient's private key must sign this transaction.
    if (recipientKey) {
      const key = PrivateKey.fromStringDer(recipientKey);

      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(recipientId)
        .setTokenIds([tokenId])
        .freezeWith(client);

      // The recipient must sign the association transaction
      const signedTx = await associateTx.sign(key);
      const associateResponse = await signedTx.execute(client);
      await associateResponse.getReceipt(client);
    }

    // Step 2: Transfer tokens using the double-entry model
    // Debit the operator's token balance, credit the recipient
    const transferTx = new TransferTransaction()
      .addTokenTransfer(tokenId, operatorId, -amount)
      .addTokenTransfer(tokenId, recipientId, amount);

    const response = await transferTx.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      success: true,
      data: {
        transactionId: response.transactionId.toString(),
        status: receipt.status.toString(),
        tokenId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Token transfer failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
