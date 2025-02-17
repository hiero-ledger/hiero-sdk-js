# Hiero JavaScript SDK

[![](https://img.shields.io/discord/373889138199494658)](https://discord.com/channels/373889138199494658/616725732650909710)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://docs.hedera.com/hedera/getting-started/environment-set-up)
[![NPM Package](https://img.shields.io/npm/v/@hashgraph/sdk.svg)](https://www.npmjs.org/package/@hashgraph/sdk)

> The JavaScript SDK for interacting with a Hiero based network

> [!NOTE]  
> The project has been transfered from the https://github.com/hashgraph org and therefore the namespace is at several locations still based on `hashgraph` and `hedera`.
> We are working activly on migration the namespace fully to hiero.

## Install

**NOTE**: v1 of the SDK is deprecated and support will be discontinued after October 2021. Please install the latest version 2.x or migrate from v1 to the latest 2.x version. You can reference the [migration documentation](/MIGRATING_V1.md).

```
# with NPM
$ npm install --save @hashgraph/sdk

# with Yarn
$ yarn add @hashgraph/sdk

# with PNPM
$ pnpm add @hashgraph/sdk
```
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

After downloading the repo run:

1. `task install`

2. `task build` to build the SDK

## React Native Support

The Hiero JavaScript SDK supports the following:

* React Native with Expo - keep in mind that the SDK uses some functionalities provided from ethers/ethersproject and there is an issue using parts of ethers.js in this environment. A [shims](https://www.npmjs.com/package/@ethersproject/shims) package has to be installed and imported before importing the SDK in your project as it is showed [here](./examples/react-native-example/App.tsx)
* Useful information: [here](https://github.com/ethers-io/ethers.js/discussions/3652) and [here](https://docs.ethers.org/v5/cookbook/react-native/)

The Hiero JavaScript SDK does not currently support the following:

* React Native Bare

## Usage

See [examples](./examples).

Every example can be executed using the following command from the root directory: `node examples/[name-of-example].js`

## Configuration

For detailed information on configuring the SDK, including environment variables and client settings, please refer to the [CONFIGURATION.md](CONFIGURATION.md) file.

## Start tests

* To start the integration tests follow the next steps:
    - Run the [local node](https://github.com/hashgraph/hedera-local-node)
    - Run `task test:integration:node`
    - Stop the [local node](https://github.com/hashgraph/hedera-local-node)
* To start unit tests follow the next steps:
    - Run `task test:unit` (Note: the local node should not be running)

## Contributing
Whether you’re fixing bugs, enhancing features, or improving documentation, your contributions are important — let’s build something great together!
Please read our [contributing guide](https://github.com/hiero-ledger/.github/blob/main/CONTRIBUTING.md) to see how you can get involved.

## Code of Conduct
Hiero uses the Linux Foundation Decentralised Trust [Code of Conduct](https://www.lfdecentralizedtrust.org/code-of-conduct).

## License
[Apache License 2.0](LICENSE)
