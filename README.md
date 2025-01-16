# Hedera™ Hashgraph JavaScript SDK

[![](https://img.shields.io/discord/373889138199494658)](https://discord.com/channels/373889138199494658/616725732650909710)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://docs.hedera.com/hedera/getting-started/environment-set-up)
[![NPM Package](https://img.shields.io/npm/v/@hashgraph/sdk.svg)](https://www.npmjs.org/package/@hashgraph/sdk)

> The JavaScript SDK for interacting with Hedera Hashgraph: the official distributed
> consensus platform built using the hashgraph consensus algorithm for fast,
> fair and secure transactions. Hedera enables and empowers developers to
> build an entirely new class of decentralized applications.

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

The Hedera JavaScript SDK supports the following:

* React Native with Expo - keep in mind that the SDK uses some functionalities provided from ethers/ethersproject and there is an issue using parts of ethers.js in this environment. A [shims](https://www.npmjs.com/package/@ethersproject/shims) package has to be installed and imported before importing the SDK in your project as it is showed [here](./examples/react-native-example/App.tsx)
* Useful information: [here](https://github.com/ethers-io/ethers.js/discussions/3652) and [here](https://docs.ethers.org/v5/cookbook/react-native/)

The Hedera JavaScript SDK does not currently support the following:

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

## Contributing to this Project

We welcome participation from all developers!
For instructions on how to contribute to this repo, please
review the [Contributing Guide](CONTRIBUTING.md).

## License Information

Licensed under Apache License,
Version 2.0 – see [LICENSE](LICENSE) in this repo
or [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0).
