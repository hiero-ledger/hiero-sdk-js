# Hiero JavaScript SDK

[![](https://img.shields.io/discord/373889138199494658)](https://discord.com/channels/373889138199494658/616725732650909710)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://docs.hedera.com/hedera/getting-started/environment-set-up)
[![JSDoc](https://img.shields.io/badge/jsdoc-%F0%9F%93%84-green)](https://hiero-ledger.github.io/hiero-sdk-js/)
[![NPM Package](https://img.shields.io/npm/v/@hashgraph/sdk.svg)](https://www.npmjs.org/package/@hashgraph/sdk)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hiero-ledger/hiero-sdk-js/badge)](https://scorecard.dev/viewer/?uri=github.com/hiero-ledger/hiero-sdk-js)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/10697/badge)](https://bestpractices.coreinfrastructure.org/projects/10697)
[![License](https://img.shields.io/badge/license-apache2-blue.svg)](LICENSE)

> The JavaScript SDK for interacting with a Hiero based network

> [!NOTE]  
> The project has been transfered from the https://github.com/hashgraph org and therefore the namespace is at several locations still based on `hashgraph` and `hedera`.
> We are working activly on migration the namespace fully to hiero.

## Install

**NOTE**: v1 of the SDK is deprecated and support will be discontinued after October 2021. Please install the latest version 2.x or migrate from v1 to the latest 2.x version. You can reference the [migration documentation](./manual//MIGRATING_V1.md).

```
# with NPM
$ npm install --save @hashgraph/sdk

# with Yarn
$ yarn add @hashgraph/sdk

# with PNPM
$ pnpm add @hashgraph/sdk
```

## Browser Usage

The SDK is also available as a UMD (Universal Module Definition) build, which can be loaded directly in the browser from popular CDNs:

### UNPKG

```html
<script src="https://unpkg.com/@hashgraph/sdk@2.62.0-beta.3/dist/umd.js"></script>
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

After downloading the repo run:

1. `task install`

2. `task build` to build the SDK

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
} from "@hashgraph/sdk";
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

## Start tests

- To start the integration tests follow the next steps:
    - Run the [local node](https://github.com/hiero-ledger/hiero-local-node)
    - Rename [sample.env](https://github.com/hiero-ledger/hiero-sdk-js/blob/main/.env.sample) in the root directory to .env
        - Ensure the `OPERATOR_ID` and `OPERATOR_KEY` are fields populated from accounts created by the local node
        - Update the network to `HEDERA_NETWORK="local-node"`
    - Run `task test:integration:node`
    - Stop the [local node](https://github.com/hiero-ledger/hiero-local-node)
- To start unit tests follow the next steps:
    - Run `task test:unit`

## Contributing

Whether you’re fixing bugs, enhancing features, or improving documentation, your contributions are important — let’s build something great together!
Please read our [contributing guide](https://github.com/hiero-ledger/.github/blob/main/CONTRIBUTING.md) to see how you can get involved.

## Code of Conduct

Hiero uses the Linux Foundation Decentralised Trust [Code of Conduct](https://www.lfdecentralizedtrust.org/code-of-conduct).

## License

[Apache License 2.0](LICENSE)
