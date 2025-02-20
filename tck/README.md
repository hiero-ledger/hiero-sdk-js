# JS SDK TCK server

This is a server that implements the [SDK TCK specification](https://github.com/hiero-ledger/hiero-sdk-tck/) for the JS SDK.

# TCK Server Start-Up Guide 🛠️

This guide will help you set up, start, and test the TCK server using Docker and Node.js. Follow the steps below to ensure a smooth setup.

# ⚡ TCK Server Start-Up

## Prerequisites

Before you begin, make sure you have:

- Node.js → Version 20 or higher

- npm → Version 10 or higher

## 🚀 Start the TCK Server

Run the following commands to install dependencies and start the server:

```bash
npm install
npm run start
```

Once started, your TCK server will be up and running! 🚦

# Start All TCK Tests with Docker 🐳

This section covers setting up and running TCK tests using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20 or higher
- **npm**: Version 10 or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version

## 🔹 Run a specific test

```bash
task run-specific-test TEST=AccountCreate
```

This will:

- Verifies prerequisites

- Starts the TCK server

- Launches required containers

- Run only the `AccountCreate` tests

## 🔹 Run all tests

To run all tests:

```bash
task start-all-tests
```

This will:

- Verifies prerequisites

- Starts the TCK server

- Launches required containers

- Run all tests automatically

Sit back and let Docker do the work! 🚀

### ⚙️ Running Tests Against Hiero Testnet

To run tests against the Hiero Testnet, use the following command:

```bash
task run-specific-test \
  NETWORK=testnet \
  OPERATOR_ACCOUNT_ID=your-account-id \
  OPERATOR_ACCOUNT_PRIVATE_KEY=your-private-key \
  MIRROR_NODE_REST_URL=https://testnet.mirrornode.hedera.com \
  # Run specific test
  TEST=AccountCreate
```

### 🎉 All Done!

Your TCK server is now running inside Docker! 🚀 You can now execute tests and validate the system.

Need help? Reach out to the team! 💬👨‍💻

Happy coding! 💻✨
