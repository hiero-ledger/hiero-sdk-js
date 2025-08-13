# Migrating to Async Client Methods

This guide explains the new async client factory methods introduced in the Hedera SDK. **These async methods are now the preferred way to create clients** as they automatically initialize with the latest network state from the address book.

## Overview

New async factory methods have been added to both `WebClient` and `NodeClient` classes that automatically query the address book and update the network configuration with the latest node information when creating clients. This ensures you're always using the most current network state and reduces issues caused by stale network node lists.

## Why Use Async Methods?

-   **Always Current**: Gets the latest network state from the address book
-   **Reduces Issues**: Avoids problems caused by stale network node lists
-   **Automatic Updates**: No need to manually call `updateNetwork()`
-   **Production Ready**: Ensures your application uses the most reliable network configuration

## New Methods

### WebClient Async Methods

```javascript
// Preferred way - automatically gets latest network state
const mainnetClient = await WebClient.forMainnetAsync();
const testnetClient = await WebClient.forTestnetAsync();
const previewnetClient = await WebClient.forPreviewnetAsync();
const customClient = await WebClient.forNameAsync("mainnet");
```

### NodeClient Async Methods

```javascript
// Preferred way - automatically gets latest network state
const mainnetClient = await NodeClient.forMainnetAsync();
const testnetClient = await NodeClient.forTestnetAsync();
const previewnetClient = await NodeClient.forPreviewnetAsync();
const customClient = await NodeClient.forNameAsync("mainnet");

// With optional props
const client = await NodeClient.forMainnetAsync({
    scheduleNetworkUpdate: false,
});
```

## Migration Examples

### Before (Manual Network Update)

```javascript
// Old way - create client then manually update network
const client = Client.forMainnet();
await client.updateNetwork();
```

### After (Automatic Network Update) - **PREFERRED**

```javascript
// New way - network is automatically updated with latest state
const client = await Client.forMainnetAsync();
```

### Before (Manual Network Update with Custom Network)

```javascript
// Old way
const client = Client.forName("mainnet");
await client.updateNetwork();
```

### After (Automatic Network Update) - **PREFERRED**

```javascript
// New way
const client = await Client.forNameAsync("mainnet");
```

## Special Cases

### Local Node

For local-node networks, `forNameAsync()` does not call `updateNetwork()` since local nodes don't use address book queries:

```javascript
// This will NOT update the network (as expected for local nodes)
const localClient = await Client.forNameAsync("local-node");
```

### Error Handling

Unknown network names will throw an error:

```javascript
try {
    const client = await Client.forNameAsync("unknown-network");
} catch (error) {
    // Handle error: "unknown network name: unknown-network"
}
```

## Benefits

-   **Latest Network State**: Always uses the most current network configuration from the address book
-   **Reduced Issues**: Eliminates problems caused by stale network node lists
-   **Simplified Setup**: No need to manually call `updateNetwork()`
-   **Automatic Configuration**: Network is automatically updated with latest node information
-   **Consistent Behavior**: All async methods follow the same pattern
-   **Backward Compatible**: Existing sync methods continue to work

## Backward Compatibility

All existing sync methods remain unchanged and continue to work, but are no longer recommended for new code:

```javascript
// These still work as before, but NOT recommended for new code
const client1 = Client.forMainnet();
const client2 = Client.forTestnet();
const client3 = Client.forName("mainnet");
```

## When to Use

-   **Use async methods** (PREFERRED) for all new code and production applications
-   **Use async methods** when you want the latest network state from the address book
-   **Use async methods** to avoid issues with stale network node lists
-   **Use sync methods** only for legacy code or when you specifically need immediate client creation without network updates
-   **Use sync methods** only when you're certain the hardcoded network configuration is current

## Best Practices

1. **Always use async methods** for new code
2. **Migrate existing code** to use async methods when possible
3. **Use async methods** in production applications to ensure reliability
4. **Consider the slight delay** of address book queries as an investment in reliability
