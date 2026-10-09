# JS SDK TCK server

This is a server that implements the [SDK TCK specification](https://github.com/hiero-ledger/hiero-sdk-tck/) for the JS SDK.

# TCK Server Start-Up Guide 🛠️

This guide will help you set up, start, and test the TCK server using Docker and Node.js. Follow the steps below to ensure a smooth setup.

# ⚡ TCK Server Start-Up

## Prerequisites

Before you begin, make sure you have:

-   Node.js → Version 20 or higher

-   npm → Version 10 or higher

-   Task → used to build the SDK at the repository root

## 🚀 Start the TCK Server

The server resolves `@hiero-ledger/sdk` to this repository (`"file:.."` in `package.json`), so build the SDK first. From the repository root:

```bash
task build
```

Then install the server dependencies and start it:

```bash
cd tck
npm install
npm run start
```

Rebuild with `task build` whenever the SDK sources change and restart the server to pick up the new build.

Once started, your TCK server will be up and running! 🚦

# Continuous integration

Every pull request runs the TCK against the commit under test, as the `TCK Compatibility` job of the Build & Test workflow (`.github/workflows/build.yml`). The job starts after the required Build and Test jobs pass. It builds the SDK, starts this server with `npm run start`, prepares a Solo network and runs the [hiero-sdk-tck](https://github.com/hiero-ledger/hiero-sdk-tck) suite pinned to the commit in `TCK_REF`. The counts land in the job summary and the mochawesome report in the `tck-compatibility` artifact. To move to a newer TCK, change `TCK_REF`, diff the TCK's `js_compatibility.yml` between the two commits and mirror any change to its environment or Solo inputs.

# Start All TCK Tests with Docker 🐳

This section covers setting up and running TCK tests using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: Version 20 or higher
-   **npm**: Version 10 or higher
-   **Docker**: Latest version
-   **Docker Compose**: Latest version

## 🔹 Run a specific test

```bash
task run-specific-test TEST=AccountCreate
```

This will:

-   Verifies prerequisites

-   Starts the TCK server

-   Launches required containers

-   Run only the `AccountCreate` tests

## 🔹 Run all tests

To run all tests:

```bash
task start-all-tests
```

This will:

-   Verifies prerequisites

-   Starts the TCK server

-   Launches required containers

-   Run all tests automatically

Sit back and let Docker do the work! 🚀

### ⚙️ Running Tests Against Hiero Testnet

To run tests against the Hiero Testnet, use the following command:

```bash
task run-specific-test \
  NETWORK=testnet \
  OPERATOR_ACCOUNT_ID=your-account-id \
  OPERATOR_ACCOUNT_PRIVATE_KEY=your-private-key \
  MIRROR_NODE_REST_URL=https://testnet.mirrornode.hedera.com \
  MIRROR_NODE_REST_JAVA_URL=https://testnet.mirrornode.hedera.com \
  # Run specific test
  TEST=AccountCreate
```

## TCK (server) Release Process

To release a new version of the TCK (server), follow these steps:

1. **Rename the previous 'latest' Docker image with last tag in the repository**:

    ```sh
    # This pulls the current 'latest' image, tags it with the specified
    # version number, and pushes it to DockerHub

    task tag-previous-version VERSION=v*.*.*
    ```

2. **Build and Push New Docker Image:**
    ```sh
    # Builds the Docker image and pushes it with the 'latest' tag
    task release-js-tck-server
    ```

> **Docker Image Versioning:** The `latest` tag always points to the most recent version. Previous versions are preserved by tagging them with their specific version numbers in **step 1**.

**Note:** Ensure all tests pass before creating a new release.

### 🎉 All Done!

Your TCK server is now running inside Docker! 🚀 You can now execute tests and validate the system.

Need help? Reach out to the team! 💬👨‍💻

Happy coding! 💻✨
