# Custom Network Configuration with gRPC Web Proxies

This guide demonstrates how to configure the Hedera SDK to communicate with a custom network using gRPC web proxies in a React application. The example sets up a transfer transaction, which is triggered when the page is loaded, using a custom network configuration with multiple gRPC web proxies.

## Steps to configure the custom network

### Prerequisites

-   Install the required Node modules by running `npm install`
-   Create a `.env` file in the root directory and add your credentials.

### 1. Setup the operator account

First, you need to set up your operator account and private key. These credentials are required to sign and authorize the transaction.

```javascript
const operatorId = AccountId.fromString("<YOUR_ACCOUNT_ID>");
const operatorKey = PrivateKey.fromStringECDSA("<YOUR_PRIVATE_KEY>");
```

### 2. Create a custom network with gRPC web proxies

Define a list of gRPC web proxies to communicate with your custom network. Each entry consists of a proxy URL and its associated account ID.

```javascript
const nodes = {
    "https://testnet-node02-00-grpc.hedera.com:443": new AccountId(5),
    "https://testnet-node03-00-grpc.hedera.com:443": new AccountId(6),
    "https://testnet-node04-00-grpc.hedera.com:443": new AccountId(7),
};
```

These proxy URLs correspond to the gRPC web proxies you wish to use for the custom network.

### 3. Setup the `Client` using `Client.forNetwork()`

To configure the client with the custom network, use `Client.forNetwork()` and pass the list of nodes you defined. The SDK automatically detects the environment (whether it's a browser or Node.js environment).

```javascript
const client = Client.forNetwork(nodes);
client.setOperator(operatorId, operatorKey);
```

In the browser environment, this will use gRPC web proxies.

### 4. Configure the transaction for the Custom Network

Before sending a transaction, you need to configure it with the necessary parameters, such as the sender, receiver, and amount. Here's how to create a transfer transaction using the configured client for the custom network.

```javascript
const transferTransaction = new TransferTransaction()
    .addSender(senderAccountId, amountToSend)
    .addReceiver(receiverAccountId, amountToReceive)
    .setTransactionMemo("Transfer via custom gRPC web proxy network")
    .setTransactionFee(transactionFee);

const response = await transferTransaction.execute(client);
```

### 5. Running the application

Once you've set up the client and transaction as described above, you can run your React application with `npm start`. The transfer transaction will be executed using the **custom gRPC web proxies** configured in the Client.forNetwork() method.
