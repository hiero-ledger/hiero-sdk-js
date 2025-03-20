# Migration Guide: Transaction Signing in Hedera SDK

## Overview

The Hedera SDK has updated its transaction signing mechanism to provide better type safety and a more structured approach to managing signatures. This guide will help you migrate from the legacy mode to the new mode.

## Key Changes

### Signing a transaction

-   Legacy mode returns raw signatures as `Uint8Array` or `Uint8Array[]` when signing transactions with a private keys
-   New mode returns `SignatureMap` when signing transactions with a private key

### Adding a signature

#### Legacy mode:

-   Signatures are raw byte arrays (`Uint8Array`)
-   No built-in organization of signatures by node or transaction ID
-   Simpler but less structured approach

#### New Mode:

-   **Supports signing of chunked transactions e.g FileAppend chunk transaction**
-   Signatures are organized in a SignatureMap class
-   Signatures are mapped to specific node IDs and transaction IDs
-   More structured and type-safe approach

## Important Considerations

1. Backward Compatibility - Legacy mode still works but new code should always use the new mode
2. Performance wasn't reduced with these latest changes
3. Error Handling:

-   New mode provides better error messages
-   Easier to debug signature-related issues

4. Multi-signature Operations:

-   Much cleaner handling of multiple signatures
-   Better tracking of which keys have signed

5. Users can still use both legacy and non-legacy signing of transactions

## Code examples:

### Signing a transaction

#### Legacy mode:

```
const transaction = new AccountCreateTransaction()
    .setKey(newKey.publicKey)
    .freezeWith(client);

const signature = privateKey.signTransaction(transaction, true);
```

#### New mode

```
const transaction = new AccountCreateTransaction()
    .setKey(newKey.publicKey)
    .freezeWith(client);

// Modern signing - returns SignatureMap
const signatureMap = privateKey.signTransaction(transaction); // legacy parameter defaults to false
```

### Adding signatures

#### Legacy mode

```
// Adding signatures directly with Uint8Array
const signatures = privateKey.signTransaction(transaction, true);
transaction.addSignature(privateKey.publicKey, signatures);
```

#### New Mode:

```
// SignatureMap handles the signature organization
const signatureMap = privateKey.signTransaction(transaction);
transaction.addSignature(privateKey.publicKey, signatureMap);
```

### Why and when?

## When did we make this change?

-   Current Status: The change is being implemented in response to Issue [#2595](https://github.com/hiero-ledger/hiero-sdk-js/issues/2595)

## Implementation Timeline:

-   Available now: New signature mode with SignatureMap
-   Deprecation: Legacy mode is deprecated and will be removed in v3.0.0
-   Migration Period: Users should migrate their code before updating to v1.0.0

## Legacy Signature Mode Deprecation Notice

The legacy transaction signing mode (using signTransaction(transaction, true) and raw Uint8Array signatures) is scheduled for removal in the next major version (v3.0.0) of the SDK. This legacy mode has been deprecated in favor of the new SignatureMap-based signature system, which provides better type safety, improved signature organization, and more robust multi-signature support. Users should migrate their applications to use the new signature mode before updating to v1.0.0. The new mode is already available and can be used by simply removing the legacy parameter from signTransaction() calls and updating signature handling to work with SignatureMap. For migration assistance, please refer to our Migration Guide. After v3.0.0, only the new signature mode will be supported, and applications using the legacy mode will need to be updated to continue functioning.
