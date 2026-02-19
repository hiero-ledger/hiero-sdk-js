# Introduction

The JS SDK package supports loading of configuration from an `.env` file or via the environment. You can use these environmental variables to configure the client. This document will explain the environmental variables needed and the client configuration.

# Table of content

-   [Environment Variables](#environment-variables)
    -   [Required](#required)
    -   [ED25519 or ECDSA key](#ed25519-or-ecdsa-key)
        -   [Integration tests](#integration-tests)
        -   [Examples](#examples)
            -   [`fromStringDer`](#-fromstringder-)
            -   [Optional Parameters](#optional-parameters)
        -   [React Native Example](#react-native-example)
        -   [Simple REST Signature Provider](#simple-rest-signature-provider)
    -   [Which network to use?](#which-network-to-use-)
    -   [How to get my account keys and IDs?](#how-to-get-my-account-keys-and-ids-)
        -   [Local network](#local-network)
        -   [Testnet and previewnet](#testnet-and-previewnet)
    -   [Possible configuration issues](#possible-configuration-issues)
    -   [Should I have multiple .env files like .env.local, .env.production, .envdevelopment etc?](#should-i-have-multiple-env-files-like-envlocal--envproduction--envdevelopment-etc-)
-   [Client Configuration](#client-configuration)
    -   [Network Configuration](#network-configuration)
    -   [Operator Settings](#operator-settings)
    -   [Transaction Settings](#transaction-settings)
    -   [Query Settings](#query-settings)
    -   [Retry and Timeout Settings](#retry-and-timeout-settings)
        -   [Node Management](#node-management)
        -   [Network Update Settings](#network-update-settings)
        -   [Logging](#logging)

# Environment Variables

## Required

| Name           | Value                                                                       | Example                                                                                          |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| OPERATOR_ID    | Account ID of the operator account used to pay for transactions and queries | 0.0.12345                                                                                        |
| OPERATOR_KEY   | ED25519 private key of the operator account                                 | 302e020100300506032b657004220420db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10 |
| HEDERA_NETWORK | Network to connect to: mainnet, testnet, previewnet, or localhost           | localhost                                                                                        |

### Default client settings values:

| Key Name                          | Default Value                                              |
| --------------------------------- | ---------------------------------------------------------- |
| setDefaultRegenerateTransactionId | true                                                       |
| setSignOnDemand                   | false                                                      |
| setDefaultMaxQueryPayment         | 1 Hbar                                                     |
| setAllowReceiptNodeFailover       | false                                                      |
| setMinBackoff                     | 250 (milliseconds)                                         |
| setMaxBackoff                     | 8000 (milliseconds)                                        |
| setNetworkUpdatePeriod            | 1 day                                                      |
| setAutoValidateChecksums          | false                                                      |
| setMaxExecutionTime               | If you use NodeClient default value is 10000 (miliseconds) |

## ED25519 or ECDSA key

### Integration tests

For integration tests, an Ed25519 private key should be used. This is configured here. If you are using an ECDSA key, update the line as follows:

```javascript
const operatorKey = PrivateKey.fromStringECDSA(options.env.OPERATOR_KEY);
```

It's recomended to use ED25519 due to it's better speed and performance.

### Examples

The examples use both ED25519 and ECDSA keys. These examples come with a pre-filled `.env` file, so you generally don’t need to make changes. However, if you modify the `.env` file, ensure the correct type of private key is used.

To verify which type of key is required, check the example code for the initialization method in the client/wallet. Look for either `fromStringED25519` or `fromStringECDSA`.

_Note that some examples (like the ones that interact with the relay) are designed to work only with ECDSA private keys._

#### `fromStringDer`

This example uses `fromString`, which internally calls `fromStringED25519`.

#### Optional Parameters

Certain examples simulate different actors in the network, such as Alice, Bob, or Treasury. These examples require additional environment variables, which are pre-configured in the `.env` file. Examples of such variables include:

-   `ALICE_KEY`
-   `BOB_KEY`
-   `TREASURY_KEY`
-   `ALICE_ID`
-   `BOB_ID`
-   `TREASURY_ID`

### React Native Example

Path: [examples/react-native-example](../examples/react-native-example)

This example uses `fromString`, which internally will try to execute the example with `fromStringED25519`.

### Simple REST Signature Provider

Path: [examples/simple_rest_signature_provider](../examples/simple_rest_signature_provider)

This example behaves the same way as the React Native example.

## Which network to use?

-   The maintainers of this repository use **Solo** (the official Hiero local network solution) when running integration tests. Running integration tests on testnet costs far too much HBARs making it unsustainable.
-   When running the examples, you can use any network of your choice. These examples are designed to demonstrate how a feature is intended to work and are optimized to function on any network you prefer.
-   Unit tests do not require environment variables.

See the [Solo Setup Guide](./SOLO_SETUP.md) for detailed instructions on setting up your local development environment.

## How to get my account keys and IDs?

### Local network

If you have followed our best practices and set up Solo using `task solo:setup`, the account keys and IDs are **automatically generated and configured** in your `.env` file. You don't need to manually copy or configure anything.

The automated setup creates:

-   `OPERATOR_KEY` and `OPERATOR_ID` - A dedicated ECDSA test account for regular integration tests
-   `GENESIS_OPERATOR_ID` and `GENESIS_OPERATOR_KEY` - The genesis account (only for genesis-specific tests)

For additional test accounts (Alice, Bob, Treasury, etc.), you can create them manually using Solo CLI:

```bash
npx solo ledger account create --generate-ecdsa-key --deployment-name solo-deployment --dev
```

See the [Solo Setup Guide](./SOLO_SETUP.md) for more details.

### Testnet and previewnet

To run the examples on the testnet, you can obtain your account keys and IDs from the Hedera Portal Dashboard.

## Possible configuration issues

-   The most common issue occurs when users mistakenly use an ED25519 key instead of an ECDSA key, or vice versa. Please verify that you are using the correct key type.
-   If you're using Solo for local development, ensure the cluster is running before running tests. Check with `task solo:status`.
-   Occasionally, some tests may fail unexpectedly. However, rerunning them usually resolves the issue.
-   If you encounter network connectivity issues with Solo, try tearing down and setting up again: `task solo:teardown && task solo:setup`.
-   Always use the `task install` command to install dependencies. Avoid manual installation with npm or yarn, as it can lead to configuration problems.
-   Make sure Docker is running before starting Solo.

For more troubleshooting help, see the [Solo Setup Guide](./SOLO_SETUP.md#troubleshooting).

## Should I have multiple .env files like .env.local, .env.production, .envdevelopment etc?

[Owner of dotenv says - no.](https://github.com/motdotla/dotenv#should-i-have-multiple-env-files)

# Client Configuration

## Network Configuration

-   `setNetwork` - The method configures the network nodes that your client will communicate with on the Hedera network. It's a fundamental configuration step that determines which nodes will process your transactions and queries.

Example:

```javascript
const client = Client.forNetwork();
client.setNetwork({
    "2.testnet.hedera.com:50211": new AccountId(0, 0, 5),
});
```

You can find the nodes addresses and their `AccountIds` here - `[mainnet](https://docs.hedera.com/hedera/networks/mainnet/mainnet-nodes), [testnet](https://docs.hedera.com/hedera/networks/testnet/testnet-nodes), [previewnet](https://docs.hedera.com/hedera/networks/testnet/testnet-nodes#preview-testnet-nodes).

-   `setMirrorNetwork` - Configure the mirror nodes

```javascript
const client = Client.forNetwork();
client.setMirrorNode(["https://testnet.mirrornode.hedera.com"]);
```

-   `setNetworkFromAddressBook` - Set network using address book response from the AddressBookQuery execution.

```javascript
const result = await new AddressBookQuery()
    .setFileId(FileId.ADDRESS_BOOK)
    .execute(client);

client = client.setNetworkFromAddressBook(result);
```

-   `setLedgerId` - Set the network ledger ID (mainnet/testnet/previewnet)

```javascript
let client = Client.forNetwork().setLedgerId(LedgerId.PREVIEWNET);
```

or

```javascript
let client = Client.forNetwork().setLedgerId("previewnet");
```

-   `setTransportSecurity` - The `setTransportSecurity` method in the Hiero JavaScript SDK is used to enable or disable transport security for the communication between the SDK and the Hedera network nodes. Transport security refers to the mechanisms used to secure the communication channel, typically involving encryption and authentication protocols.
    When transport security is enabled, the SDK will establish a secure connection with the Hedera network nodes using protocols like Transport Layer Security (TLS). This ensures that the data transmitted between the SDK and the nodes is encrypted, protecting it from eavesdropping and tampering. It also provides authentication mechanisms to verify the identity of the nodes and prevent man-in-the-middle attacks.

```javascript
const client = Client.forNetwork();
client.setTransportSecurity(true);
```

## Operator Settings

-   `setOperator` - Set the operator account and private key. The operator is the account that will pay for the transactions the user executes.

```javascript
const operatorId = AccountId.fromString("...");
const operatorKey = PrivateKey.generateED25519();
const client = Client.forNetwork().setOperator(operatorId, operatorKey);
```

-   `setOperatorWith` - Set the operator id and key and also provide a custom transaction signer function instead of using the default one.

```javascript
tx.setOperatorWith(accountId, key.publicKey, (message) =>
    Promise.resolve(key.sign(message)),
);
```

## Transaction Settings

-   `setDefaultMaxTransactionFee` - Set maximum transaction fee user is willing to pay.

```javascript
const client = Client.forTestnet().setDefaultMaxTransactionFee(
    Hbar.fromTinybars(1),
);
// the network used here doesn't matter
```

-   `setDefaultRegenerateTransactionId` - Configure transaction ID regeneration. This function accepts a boolean type of value. When set to true it will regenerate the transaction ID when a `TRANSACTION_EXPIRED` status is returned.

```javascript
const client = Client.forTestnet();
client.setDefaultRegenerateTransactionId(true);
```

-   `setSignOnDemand` - Configure on-demand transaction signing

The `setSignOnDemand` method in the Hiero JavaScript SDK allows you to configure how transactions are signed before being submitted to the Hedera network. By default, transactions are signed immediately after being constructed. However, in some cases, you may want to delay the signing process until just before the transaction is submitted. This can be useful in scenarios where you need to perform additional operations or validations on the transaction before signing it.

When you call `client.setSignOnDemand(true)`, it instructs the SDK to defer the signing of transactions until the transaction.sign() method is explicitly called. This means that when you create a transaction using the SDK, it will not be signed automatically. Instead, you will need to call `transaction.sign()` manually before submitting the transaction to the network.

```javascript
const client = Client.forTestnet();
client.setSignOnDemand(true);
```

## Query Settings

-   `setDefaultMaxQueryPayment` - Same as `setDefaultMaxTransactionFee` but for queries.

-   `setAllowReceiptNodeFailover` - Configure receipt query node failover behavior. By default, receipt queries are pinned exclusively to the node that submitted the transaction. When enabled, receipt queries can fail over to other nodes while still prioritizing the submitting node first.

```javascript
const client = Client.forTestnet();
client.setAllowReceiptNodeFailover(true); // Enable receipt query failover
```

When failover is disabled (default):
- Receipt queries will only be sent to the node that originally processed the transaction
- If that node is unavailable or slow to respond, the query will retry only on that same node
- This ensures consistency but may result in delays if the submitting node is experiencing issues

When failover is enabled:
- Receipt queries start with the submitting node (to maximize consistency)
- If the submitting node fails or is unavailable, the query can fail over to other nodes in the network
- The node list respects the transaction's configured nodes if specified, otherwise uses the client's network nodes
- Duplicate nodes are automatically filtered out

This setting is particularly useful in scenarios where:
- You need higher availability for receipt retrieval
- The submitting node may be temporarily unavailable
- You're willing to trade some consistency guarantees for improved reliability

**Note**: This setting affects both `getReceipt()` and `getRecord()` queries on transaction responses. The getter `client.allowReceiptNodeFailover` can be used to check the current setting.

## Retry and Timeout Settings

-   `setMaxAttempts` - Sets maximum retry attempts before an error is thrown.
-   `setMaxNodeAttempts` - Set maximum node retry attempts
-   `setMinBackoff` - Set minimum backoff time for retries.
    There's a time the SDK waits for after every failed attempt. A lower minBackoff value will result in more frequent retries initially, which can be useful for faster recovery from transient failures. This time increases exponentially. The default values provided by the SDK are generally reasonable for most use cases, but you may want to adjust them based on your specific requirements.

-   `setMaxBackoff` - Set maximum backoff time for retries
    Same as above but this sets on the maximum amount of seconds the backoff time may go.

-   `setRequestTimeout` - This timeout is the maximum allowed time for the entire transaction/query, including all retries. This timeout must be larger than the `grpcDeadline` to ensure that individual gRPC requests have enough time to complete within the overall operation timeout.

```javascript
let client = Client.forTestnet();
client.setOperator(operatorAccountId, operatorPrivateKey);
client.setRequestTimeout(30000);
// Network doesn't matter here.
```

-   `setGrpcDeadline` - This timeout applies to each single gRPC request within the transaction/query. It's the maximum time allowed for a single gRPC call before it times out. This value must be smaller than the `requestTimeout` to ensure that individual requests can complete within the overall operation timeout.

```javascript
const client = Client.forNetwork();
client.setGrpcDeadline(5000); // Set gRPC deadline to 5 seconds (5000 milliseconds)
```

-   `setMaxExecutionTime` - This is an alias for `setGrpcDeadline` and is maintained for backward compatibility. It applies to each single gRPC request within the transaction/query. It's used for the edge cases where 10 seconds are not enough for the execution of a single gRPC request and the user can pass more.

```javascript
const client = Client.forNetwork();
const timeInMs = 10000;
client.setMaxExecutionTime(10000); // Set the gRPC deadline to 10 seconds (10000 milliseconds)
```

**Important**: When configuring timeouts, ensure that `requestTimeout` is always larger than `grpcDeadline`. The SDK will display deprecation warnings if you attempt to set `grpcDeadline` greater than or equal to `requestTimeout`, or if you set `requestTimeout` less than or equal to `grpcDeadline`. These warnings will become errors in the next major version. This validation ensures that individual gRPC requests have sufficient time to complete within the overall operation timeout.

**Deprecation Notice**: Invalid timeout configurations currently show warnings but will throw errors in the next major version. Please update your timeout configurations to avoid future breaking changes.

### Node Management

-   `setMaxNodesPerTransaction` - Set maximum nodes per transaction
    This sets the maximum amount of nodes that the transaction will try to execute to.

    Setting a higher value for setMaxNodesPerTransaction can improve the reliability of transaction execution, but it also increases the network load and the overall cost of the transaction (since you'll be paying transaction fees for each node that executes the transaction).

-   `setNodeMinBackoff` - The `setNodeMinBackoff` method is SDK is used to set the minimum backoff time (in milliseconds) for retrying operations on a specific node.
    When you send a request to a node in the Hedera network, and the node fails to respond or encounters an error, the SDK will attempt to retry the request on the same node after a certain amount of time. This time is known as the backoff time, and it starts at a minimum value (set by setNodeMinBackoff) and increases exponentially with each subsequent retry attempt, up to a maximum value (set by setNodeMaxBackoff).
    The backoff mechanism is designed to prevent overwhelming the nodes with too many retries in a short period of time, while still allowing the SDK to recover from transient failures or network issues.
    Here's an example of how you can set the minimum node backoff time using the setNodeMinBackoff method:

```javascript
const client = Client.forNetwork();
client.setNodeMinBackoff(500); // Set minimum node backoff to 500 milliseconds (0.5 seconds)
```

-   `setNodeMaxBackoff` - It sets the maximum seconds allowed for the node backoff explained in the previous setting.

-   `setNodeMinReadmitPeriod` - When a node fails to respond or encounters an error while processing a request, the SDK will temporarily remove that node from the pool of available nodes. This is done to prevent the SDK from repeatedly sending requests to a node that is experiencing issues, which could further exacerbate the problem.
    The `setNodeMinReadmitPeriod` method allows you to configure the minimum amount of time that a node must wait before it can be readmitted to the pool of available nodes. During this period, the SDK will not send any requests to that node, giving it time to recover or resolve any issues it may be experiencing.

-   `setNodeMaxReadmitPeriod` - Set maximum node readmit period.
    The setNodeMaxReadmitPeriod method allows you to configure the maximum amount of time that a node can be excluded from the pool of available nodes. After this period has elapsed, the SDK will automatically readmit the node to the pool, regardless of whether it has recovered or not.

-   `setNodeWaitTime` - The `setNodeWaitTime` method in the Hiero JavaScript SDK is used to set the minimum amount of time (in milliseconds) that the SDK will wait before attempting to send a request to a node that has recently failed or encountered an error.

```javascript
const client = Client.forNetwork();
client.setNodeWaitTime(5000); // Set node wait time to 5 seconds (5000 milliseconds)
```

### Network Update Settings

-   `setNetworkUpdatePeriod` - The setNetworkUpdatePeriod method in the Hiero JavaScript SDK is used to configure the frequency at which the SDK updates its internal representation of the Hedera network topology.
    The Hedera network is a distributed ledger system that consists of multiple nodes spread across different geographic locations. These nodes can join or leave the network at any time, and their availability and performance can vary depending on various factors such as network conditions, hardware issues, or software updates.
    To ensure that the SDK has an up-to-date view of the network topology, it periodically retrieves information about the available nodes and their respective performance metrics. This information is used to determine which nodes to send requests to and to adjust the load balancing and failover strategies accordingly.

-   `setAutoValidateChecksums` - Configure automatic checksum validation

### Logging

-   `setLogger` - Configure client logger. Setting a logger can give you additional information for debugging processes. This is an example of how you can use this fucntionality.

```javascript
const infoLogger = new Logger(LogLevel.Info);
client.setLogger(infoLogger);
```

There are different LogLevels: `LogLevel.Info`, `LogLevel.Silent`, `LogLeve.Trace`, `LogLevel.Debug`, `LogLevel.Warn`, `LogLevel.Error`, `LogLevel.Fatal`.
