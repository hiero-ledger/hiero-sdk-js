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

This guide will help you set up and start the TCK server, local node and run all TKC tests using Docker. Follow these steps to ensure all dependencies are installed and the server runs smoothly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20 or higher
- **npm**: Version 10 or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version

## 🔧 Setup Instructions

### 1. Check Node.js and npm

Verify that Node.js and npm are installed and meet the version requirements:

```bash
node -v
npm -v
```

### 2. Install Hedera Local Node CLI

If not already installed, run the following command:

```bash
npm install @hashgraph/hedera-local -g
```

### 3. Start the Local Hedera Network

Run the following command to start the local Hedera network:

```bash
task start-local-node
```

### 4. Build the Docker Image

Build the Docker image for the TCK JS server:

```bash
task build-tck-js-server
```

### 5. Run a specific test

```bash
task run-specific-test -- TEST=AccountCreate
```

This will:

- Spin up the TCK server

- Start required containers

- Run only the AccountCreate tests

### 6. Start All Services

Now, let’s fire up all the services using Docker Compose:

```bash
task start-all-tests
```

This will:

- Spin up the TCK server

- Start required containers

- Run all tests automatically

Sit back and let Docker do the magic!

### Additional info:

To run tests against Hiero Testnet:

```bash
task run-specific-test \
  NETWORK=testnet \
  OPERATOR_ACCOUNT_ID=your-account-id \
  OPERATOR_ACCOUNT_PRIVATE_KEY=your-private-key \
  # Run specific test
  TEST=AccountCreate
```

### 🎉 All Done!

Your TCK server is now running inside Docker! 🚀 You can now execute tests and validate the system.

Need help? Reach out to the team! 💬👨‍💻

Happy coding! 💻✨
