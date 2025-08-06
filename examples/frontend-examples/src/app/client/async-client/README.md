# Async Client Example - Testnet

This example demonstrates the new async client methods introduced in the Hedera SDK, specifically focusing on testnet. It shows how to use the preferred async factory methods that automatically update the network configuration with the latest state from the address book.

## Features

- **Async Client Creation**: Demonstrates `forTestnetAsync()` with automatic network updates
- **Context Provider**: Uses React Context to manage client state across components
- **Network State Display**: Shows the current testnet network nodes from the address book
- **Account Creation**: Demonstrates creating accounts with the async client
- **Real-time Updates**: Shows network updates and client status

## Key Components

### AsyncClientProvider

- Manages client state and network configuration
- Provides methods for creating async testnet client
- Handles loading states and error messages

### AsyncClientDemo

- Main UI component demonstrating async client usage
- Single "Create Async Testnet Client" button
- Real-time network state display
- Account creation functionality

## Usage

1. **Create Client**: Click "Create Async Testnet Client" to initialize with latest network state
2. **View Network**: See the current testnet network nodes from the address book
3. **Create Account**: Test account creation with the async client
4. **Update Network**: Manually trigger network updates if needed

## Benefits Demonstrated

- **Latest Network State**: Always uses current testnet network configuration from address book
- **Reduced Issues**: Avoids problems with stale network node lists
- **Automatic Updates**: No need to manually call `updateNetwork()`
- **Production Ready**: Ensures reliable network configuration

## Environment Variables

Make sure to set these environment variables:

- `NEXT_PUBLIC_OPERATOR_ID`: Your Hedera account ID
- `NEXT_PUBLIC_OPERATOR_KEY`: Your Hedera private key

## Navigation

Access this example at: `/client/async-client`

## Key Differences from Sync Methods

This example demonstrates the key advantages of async client methods:

- **Automatic Network Updates**: The client is created with the latest network state
- **Address Book Integration**: Uses the address book to get current node information
- **Simplified Setup**: No need to manually call `updateNetwork()`
- **Reliability**: Ensures you're always using the most current network configuration
