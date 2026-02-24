# Hiero JavaScript SDK

[![](https://img.shields.io/discord/373889138199494658)](https://discord.com/channels/373889138199494658/616725732650909710)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://docs.hedera.com/hedera/getting-started/environment-set-up)
[![JSDoc](https://img.shields.io/badge/jsdoc-%F0%9F%93%84-green)](https://hiero-ledger.github.io/hiero-sdk-js/)
[![NPM Package](https://img.shields.io/npm/v/@hiero-ledger/sdk.svg)](https://www.npmjs.org/package/@hiero-ledger/sdk)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hiero-ledger/hiero-sdk-js/badge)](https://scorecard.dev/viewer/?uri=github.com/hiero-ledger/hiero-sdk-js)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/10697/badge)](https://bestpractices.coreinfrastructure.org/projects/10697)
[![License](https://img.shields.io/badge/license-apache2-blue.svg)](LICENSE)

> The JavaScript SDK for interacting with a Hiero based network

> [!NOTE]  
> The project has been transferred from the [https://github.com/hashgraph](https://github.com/hashgraph) org and therefore the namespace is at several locations still based on `hashgraph` and `hedera`.
> We are working actively on migrating the namespace fully to hiero.

## Install

**NOTE**: v1 of the SDK is deprecated and support will be discontinued after October 2021. Please install the latest version 2.x or migrate from v1 to the latest 2.x version. You can reference the [migration documentation](./manual//MIGRATING_V1.md).

```
# with NPM
$ npm install --save @hiero-ledger/sdk

# with Yarn
$ yarn add @hiero-ledger/sdk

# with PNPM
$ pnpm add @hiero-ledger/sdk
```

## Browser Usage

The SDK is also available as a UMD (Universal Module Definition) build, which can be loaded directly in the browser from popular CDNs:

### UNPKG

```html
<script src="https://unpkg.com/@hiero-ledger/sdk@2.70.0/dist/umd.js"></script>
```

When using the UMD build in the browser, the SDK will be available as a global variable `sdk`. A minified version is also available at `dist/umd.min.js`.

## Build

### Prerequisites

1. [Taskfile](https://taskfile.dev/) tool installation
2. **Node.js**: It is **recommended** to use Node.js **v20 or higher** for best performance and compatibility. The package may also work with **Node.js v16**, but this version has **not been officially tested**.

```
# with npm
$ npm install -g @go-task/cli

# with homebrew
$ brew install go-task
```

2. [pNpm](https://pnpm.io/) package manager installation

```
# with npm
$ npm install -g pnpm

# with homebrew
$ brew install pnpm
```
### Windows 

>[!Note]
> Long paths must be enabled. Link to official documentation: [Windows-Long-Path](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=registry)
>
> Git must support long paths
>
> LF line endings must be enforced.

After downloading the repo run:

1. `task install`

2. `task build` to build the SDK

## Development

### Local Development Workflow

The SDK uses `pnpm workspaces` to manage its monorepo structure with sub-packages (`@hiero-ledger/proto` and `@hiero-ledger/cryptography`). For local development and testing the SDK in other projects, use the following workflow:

#### Build and Link Globally

Build the SDK and link it globally for use in other local projects:

```bash
task build:dev
```

This command:
- Builds all packages (`proto`, `cryptography`, and the main SDK)
- Creates global symlinks for all three packages
- Allows you to use the local SDK in any other project on your machine

#### Use in Another Project

In your other project, link to the globally linked SDK:

```bash
cd /path/to/your/other/project
pnpm link --global @hiero-ledger/sdk
```

Now any changes you make to the SDK and rebuild will be immediately available in your project.

#### Unlink and Clean

When you're done with local development:

```bash
# In the hiero-sdk-js repository
task clean
```

This removes all global links and cleans up `node_modules`.

To unlink in your other project:

```bash
# In your other project
pnpm unlink @hiero-ledger/sdk
pnpm install
```

## React Native Support

The Hiero JavaScript SDK provides comprehensive support for React Native environments, including Expo. To ensure seamless integration, follow the guidelines based on your Expo version:

✅ Hiero Javascript SDK Version 2.60 and Above
For projects using SDK version 2.60 and above, Expo SDK version 51+ is supported, the SDK requires the `react-native-get-random-values` package in order to work.
To install it, run:

```bash
npm install react-native-get-random-values
```

After installation, the native dependency must be linked for the respective platforms:

🔗 Linking for Native Platforms

1. iOS:
   Run the following command to install the native modules:

```bash
cd ios && pod install
```

Then, rebuild the iOS project.

2. Android:
   Rebuild the Android project to link the dependency

⚠️ ✅ Hiero Javascript SDK Version 2.59 and Below
For projects using SDK version 2.59 and below, Expo SDK Version 49 and below is supported, keep in mind that the SDK uses some functionalities provided from ethers/ethersproject and there is an issue using parts of ethers.js in this environment. A [shims](https://www.npmjs.com/package/@ethersproject/shims) package has to be installed and imported before importing the SDK in your project.

-   Useful information: [here](https://github.com/ethers-io/ethers.js/discussions/3652) and [here](https://docs.ethers.org/v5/cookbook/react-native/)

```bash
npm install @ethersproject/shims
```

Import it before importing the SDK as shown below:

```bash
import '@ethersproject/shims';

import {
    Client,
    PrivateKey
    AccountBalance,
} from "@hiero-ledger/sdk";
...
```

The Hiero JavaScript SDK does not currently support the following:

-   React Native Bare

## Usage

See [examples](./examples).

Every example can be executed using the following command from the root directory: `node examples/[name-of-example].js`.

**Note:** Before running any examples, ensure you have:

1. Built the SDK by running `task build` in the root directory.
2. Installed dependencies by running `pnpm install` in the `examples` directory

## Configuration

For detailed information on configuring the SDK, including environment variables and client settings, please refer to the [CONFIGURATION.md](./manual/CONFIGURATION.md) file.

## Local Development Setup

For contributors and developers who want to run integration tests locally, we provide **[Solo](https://solo.hiero.org/)** - the official Hiero local network solution. Solo provides a production-like Kubernetes-based environment with consensus nodes and mirror node services.

> **Platform Requirements:** Solo can only run on **macOS** or **Linux**. Windows users must use WSL2.
> 
> **RAM Requirements:**
> - Single node setup: Minimum **12 GB RAM**
> - Dual node setup: Minimum **24 GB RAM** (required for dynamic address book tests)
>
> For complete system requirements, see the [official Solo documentation](https://solo.hiero.org/latest/docs/step-by-step-guide/#prerequisites).

### Quick Setup

1. **Install dependencies:**
   ```bash
   task install
   ```
   
   **Important:** This installs Solo and all project dependencies. Must be run before setup.

2. **Set up Solo local network:**
   ```bash
   # Single node setup (default, requires 12 GB RAM)
   task solo:setup
   
   # OR dual node setup (requires 24 GB RAM, needed for DAB tests)
   task solo:setup:dual-node
   ```
   
   This will automatically:
   - Create a local Kubernetes cluster with Kind
   - Deploy a consensus network (default: v0.69.1)
   - Deploy mirror node services (default: v0.145.2)
   - Create a dedicated ECDSA test account
   - Generate a `.env` file with all necessary credentials

   **Optional:** Specify custom versions or use local build:
   ```bash
   # Custom consensus node version
   task solo:setup -- --consensus-node-version v0.70.0
   
   # Custom mirror node version
   task solo:setup -- --mirror-node-version v0.146.0
   
   # Both custom versions
   task solo:setup -- --consensus-node-version v0.70.0 --mirror-node-version v0.146.0
   
   # Dual node with custom versions
   task solo:setup:dual-node -- --consensus-node-version v0.70.0 --mirror-node-version v0.146.0
   
   # Use local build (overrides consensus-node-version)
   task solo:setup -- --local-build-path ../hiero-consensus-node/hedera-node/data
   ```

3. **(Required for dynamic address book tests) Configure hosts:**
   
   Before running dynamic address book tests with dual-node setup, add Kubernetes service names to your `/etc/hosts` file:
   
   ```bash
   echo "127.0.0.1 network-node1-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
   echo "127.0.0.1 envoy-proxy-node1-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
   echo "127.0.0.1 network-node2-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
   echo "127.0.0.1 envoy-proxy-node2-svc.solo.svc.cluster.local" | sudo tee -a /etc/hosts
   ```
   
   **Note:** This is only required for dynamic address book tests with dual-node setup. Skip if you're running single-node or other integration tests.

4. **Run integration tests:**
   ```bash
   task test:integration
   ```

5. **Teardown when done:**
   ```bash
   task solo:teardown
   ```

For detailed setup instructions, troubleshooting, and advanced usage, see the [Solo Setup Guide](./manual/SOLO_SETUP.md).

### Prerequisites

Before setting up Solo, ensure you have:
- Docker Desktop (or Docker Engine)
- Kind (Kubernetes in Docker)
- kubectl
- Node.js v18+ (comes with npm/npx)

See the [Solo Setup Guide](./manual/SOLO_SETUP.md#prerequisites) for installation instructions.

## Running Tests

### Unit Tests

Unit tests do not require a local network and can be run directly:

```bash
task test:unit
```

Or separately for Node.js and browser:

```bash
task test:unit:node
task test:unit:browser
```

### Integration Tests

Integration tests require a running local network. After setting up Solo (see above):

```bash
# Run all integration tests
task test:integration

# Run Node.js integration tests only
task test:integration:node

# Run browser integration tests only
task test:integration:browser

# Run dual-mode tests
task test:integration:dual-mode
```

#### Running Dynamic Address Book Tests

Dynamic address book (DAB) tests require:
1. **Dual-node setup**: Run `task solo:setup:dual-node` (requires 24 GB RAM)
2. **`/etc/hosts` configuration**: See step 3 in the setup section above

These tests validate that the SDK can correctly handle node address changes and reconnections using Kubernetes service names.

**Note:** All integration tests should pass reliably with the Solo setup. If you encounter failures:
1. Verify Solo is running: `task solo:status`
2. For dynamic address book test failures, ensure you're using dual-node setup and `/etc/hosts` is configured
3. Check the troubleshooting section in the [Solo Setup Guide](./manual/SOLO_SETUP.md#troubleshooting)
4. Try a fresh setup: `task solo:teardown && task solo:setup` (or `task solo:setup:dual-node` for DAB tests)

## Contributing

Whether you’re fixing bugs, enhancing features, or improving documentation, your contributions are important — let’s build something great together!
Please read our [contributing guide](https://github.com/hiero-ledger/.github/blob/main/CONTRIBUTING.md) to see how you can get involved.

## Code of Conduct

Hiero uses the Linux Foundation Decentralised Trust [Code of Conduct](https://www.lfdecentralizedtrust.org/code-of-conduct).

## License

[Apache License 2.0](LICENSE)
