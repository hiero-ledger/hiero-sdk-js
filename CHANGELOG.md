# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# 2.81.0-beta.1

### Added

- HIP-1195 support. [#3535](https://github.com/hiero-ledger/hiero-sdk-js/pull/3535)  - *Released but not supported on Testnet yet*
- Allow multiple nodes on getRecord/getReceipt. [#3741](https://github.com/hiero-ledger/hiero-sdk-js/pull/3741)
- TCK: implement FileContentsResponse endpoint. [#3633](https://github.com/hiero-ledger/hiero-sdk-js/pull/3633)
- TCK: implement AddressBookQuery endpoint. [#3624](https://github.com/hiero-ledger/hiero-sdk-js/pull/3624)

### Changed

- TCK: update token info query to match the Java response. [#3694](https://github.com/hiero-ledger/hiero-sdk-js/pull/3694)
- TCK: update airdrop method. [#3685](https://github.com/hiero-ledger/hiero-sdk-js/pull/3685)

# 2.80.0

### Fixed
- Fixed an integer overflow issue where `validStart` and `expirationTime` (Unix seconds stored as 64-bit values) were incorrectly converted using `Long.toInt()`, causing dates beyond `2^32−1` seconds (e.g., year 2125) to decode incorrectly (e.g., as 1988). `ExchangeRate` and `ExpirationTime` now correctly use 64-bit values. [#3641](https://github.com/hiero-ledger/hiero-sdk-js/pull/3641)
- Resolved a race condition in node health handling where concurrent failures could repeatedly increase backoff and mark a node unhealthy for an excessive duration. Backoff is now only increased when the node is healthy, preventing runaway backoff under high concurrency. [#3647](https://github.com/hiero-ledger/hiero-sdk-js/pull/3647)

# 2.80.0-beta.1

### Changed
- Switched to **pnpm workspaces** for local development library linking, replacing the unsupported `yalc`. This improves maintainability and contributor development experience. ([#3610](https://github.com/hiero-ledger/hiero-sdk-js/pull/3610))
- Improved contributor experience by integrating **solo** as a development dependency with predefined start scripts and supporting documentation. ([#3614](https://github.com/hiero-ledger/hiero-sdk-js/pull/3614))

# 2.79.0

### Addded 

- Tests for HIP-1300

# 2.79.0-beta.13

### Added

- Support for Ethereum type 4 transaction (currently not supported in consensus node)

# 2.79.0-beta.12

### Added

- Updated publishing mechanism to support npmjs' new OIDC trusted publishers [#3572](https://github.com/hiero-ledger/hiero-sdk-js/pull/3572)

# 2.78.0

### Added 

- Retry mechanism when a transaction hits `INVALID_NODE_ACCOUNT_ID` that updates the network automatically in accordance to [#53](https://github.com/hiero-ledger/sdk-collaboration-hub/pull/53)

### Fixed 

-  Fix of the pollyfills for react native environment not being loaded correctly, causing No PRNG errors [#3526](https://github.com/hiero-ledger/hiero-sdk-js/pull/3526)

# v2.78.0-beta.2

### Changed

- Updated the entire codebase to use the definitions from the @hiero-ledger/* packages instead of @hashgraph/* packages. This is part of the transition to the new @hiero-ledger namespace for all SDK packages. [#3400]
- Swap publishing order of @hiero-ledger and @hashgraph packages to ensure @hiero-ledger packages are published first. [#3400]

## v2.77.0

### Fixed
- Resolved an issue where the mirror network was not correctly set in the client state when using `WebClient.forMirrorNetwork` in web environments. [#3510](https://github.com/hiero-ledger/hiero-sdk-js/pull/3510)
- Fixed a bug preventing `AddressBookQuery` from executing when the `Client` class had an empty network state. [#3510](https://github.com/hiero-ledger/hiero-sdk-js/pull/3510)
- Corrected a model definition issue where a property of the `Node` model was not marked as optional. [#3510](https://github.com/hiero-ledger/hiero-sdk-js/pull/3510)


## v2.76.0

### Added

- Added New gRPC web proxy for node 32. [#3482](https://github.com/hiero-ledger/hiero-sdk-js/pull/3482)

### Fixed

- Restored backward compatibility for custom network configurations in the web environment that include a URL scheme (e.g., https://node00.swirldslabs.com:443). The SDK now normalizes these endpoints internally to the expected host:port format to prevent breaking existing integrations. A deprecation warning is logged to encourage migration to the correct format.[#3480](https://github.com/hiero-ledger/hiero-sdk-js/pull/3480)

### Deprecated

- Endpoints with URL schemes (http:// or https://) are now deprecated. While still accepted for backward compatibility, developers should update their configurations to use the documented host:port format (e.g., node00.swirldslabs.com:443). Support for scheme-prefixed endpoints will be removed in a future release.[#3480](https://github.com/hiero-ledger/hiero-sdk-js/pull/3480)

## v2.75.0

### Fixed

- Fixed pagination issue in `AddressBookQuery` for web environments where only the first page of nodes from the Mirror Node API was being retrieved instead of all available pages. [#3421](https://github.com/hiero-ledger/hiero-sdk-js/pull/3421)

## v2.74.0

### Fixed

- Fixed an issue where setMaxNodesPerTransaction() had no effect if called after a transaction was frozen. The setting is now applied correctly, allowing dApps and wallets to reduce redundant signing prompts when executing transactions. [#3383](https://github.com/hiero-ledger/hiero-sdk-js/pull/3383)

### Added

- Extended amount field support across the SDK to accept BigNumber and bigint types in addition to existing Long and number types, ensuring consistent handling of large amounts throughout the codebase. [#3394](https://github.com/hiero-ledger/hiero-sdk-js/pull/3394)
- Added support for latest Metro bundler by adding "react-native" to `package.json`'s exports [#3388](https://github.com/hiero-ledger/hiero-sdk-js/pull/3388)

### Changed

- This moves the mirrorRestApiBaseUrl construction from the client to the MirrorNode class for better separation of concerns.
Additional fix - port for the rest api is handled correctly for local dev environments. [#3395](https://github.com/hiero-ledger/hiero-sdk-js/pull/3395)
- Added New gRPC web proxies for node 33 and node 34[#3384](https://github.com/hiero-ledger/hiero-sdk-js/pull/3384)

## v2.73.2

### Added
- Introduced `Client.mirrorRestApiBaseUrl` getter to provide the full Mirror Node REST API base URL, including scheme and port. [#3376](https://github.com/hiero-ledger/hiero-sdk-js/pull/3376)

### Changed
- Updated `AccountId.populateAccountEvmAddress`, `AccountId.populateAccountNum`  `MirrorNodeContractQuery` to construct URLs using `mirrorRestApiBaseUrl` instead of manually parsing strings. [#3376](https://github.com/hiero-ledger/hiero-sdk-js/pull/3376)

### Fixed
- Resolved an issue in `MirrorNodeContractQuery` where the port was incorrectly overridden to `8545` for custom network configurations. [#3376](https://github.com/hiero-ledger/hiero-sdk-js/pull/3376)

## v2.73.1

### Added

- Added negative NodeId check in the NodeUpdateTransaction and NodeDeleteTransaction
- Updated NodeDeleteTransaction and NodeUpdateTransaction to transform the input always to Long

### Changed

- Pin all dependency versions in the SDK package/proto package/cryptography

## v2.72.0

### Added
- Validation for negative gas in `ContractExecuteTransaction`, ensuring safer transaction execution. [#3317](https://github.com/hiero-ledger/hiero-sdk-js/pull/3317)
- Support for `CustomFee` in scheduled transaction body, enabling more flexible fee structures in scheduled transactions. [#3254](https://github.com/hiero-ledger/hiero-sdk-js/pull/3254)

## v2.71.0

### Added
- Async client initialization support for `WebClient` to allow fetching the latest address book during setup:
  - `WebClient.forMainnetAsync()`
  - `WebClient.forTestnetAsync()`
  - `WebClient.forPreviewnetAsync()`
  - `WebClient.forNameAsync(name)` [#3274](https://github.com/hiero-ledger/hiero-sdk-js/pull/3274)

  These methods default to performing an address book update unless `scheduleNetworkUpdate` is explicitly set to `false`, improving client reliability.
- Async client initialization for `NativeClient` (intended for **React Native / Expo users**), allowing automatic address book updates at instantiation time. [#3285](https://github.com/hiero-ledger/hiero-sdk-js/pull/3285)
  - `NativeClient.forMainnetAsync()`
  - `NativeClient.forTestnetAsync()`
  - `NativeClient.forPreviewnetAsync()`
  - `NativeClient.forNameAsync(networkName)`

  These methods fetch the latest address book unless `scheduleNetworkUpdate` is explicitly set to `false`.
- Support for HIP-1046 ([HIP Link](https://hips.hedera.com/hip/hip-1046)): Enabled in native environments to expand protocol capabilities. [#3283](https://github.com/hiero-ledger/hiero-sdk-js/pull/3283)
- Implemented `permanentRemoval` in `ContractDeleteTransaction`, enabling permanent contract deletion behavior. [#3304](https://github.com/hiero-ledger/hiero-sdk-js/pull/3304)
- Added ability to remove auto-renew account in `ContractUpdateTransaction` by setting it to `0.0.0`.
- Added validation in `ContractCreateTransaction` to reject gas values less than 0.
- Added validations in `hex.js` to reject invalid hex string decoding. [#3299](https://github.com/hiero-ledger/hiero-sdk-js/pull/3299)

### Changed
- Native clients (React Native / Expo) now attempt to retrieve node addresses from mirror nodes before falling back to hardcoded values in Web environments. [#3283](https://github.com/hiero-ledger/hiero-sdk-js/pull/3283)
- Made `setStakedAccountId` and `setStakedNodeId` explicitly mutually exclusive. Setting one clears the other.
- Made `setTransferAccountId` and `setTransferContractId` explicitly mutually exclusive. Setting one clears the other. [#3299](https://github.com/hiero-ledger/hiero-sdk-js/pull/3299)


### Fixed
- Fixed a bug where an error status triggered the error callback twice. [#3280](https://github.com/hiero-ledger/hiero-sdk-js/pull/3280)

## v2.71.0-beta.0

### Added

- Added `maxAutomaticTokenAssociations` property with integration test [#3289](https://github.com/hiero-ledger/hiero-sdk-js/pull/3289)

## v2.70.0

> ⚠️ **Important Notice**
> Starting from this version (`v2.70.0`), we will be releasing all packages under both the `@hiero-ledger` and `@hashgraph` namespaces for a transitional period.
> Eventually, `@hashgraph/*` packages will be **deprecated** and all development will continue solely under the `@hiero-ledger/*` scope.
>
> No breaking changes are introduced in this release from a user perspective.
>
> To support this transition, a detailed [migration guide is available here](https://github.com/hiero-ledger/hiero-sdk-js/blob/main/manual/migration_hiero.md).
> Please begin migrating to `@hiero-ledger` packages at your earliest convenience.

---

### Added
- `deleteGrpcWebProxyEndpoint` method in `NodeUpdateTransaction` to support the removal of web proxy. [#3268](https://github.com/hiero-ledger/hiero-sdk-js/pull/3268)

### Fixed
- Aligned `clear` methods for array properties in `TopicUpdateTransaction` with other SDKs, ensuring they correctly remove the arrays from network state. [#3265](https://github.com/hiero-ledger/hiero-sdk-js/pull/3265)

### Removed
- Removed the gRPC proxy endpoint for node with account ID `0.0.5`, as it was taken out of the address book by a council member. [#3256](https://github.com/hiero-ledger/hiero-sdk-js/pull/3256)

## v2.69.0

### Added
- Added validation to NodeUpdateTransaction and NodeDeleteTransaction ensuring that nodeId is explicitly set before execution. This prevents accidental updates to node 0.0.3 due to protobuf's default uint64 = 0 behavior. [3228](https://github.com/hiero-ledger/hiero-sdk-js/pull/3228)

### Fixed
- Fixed formatting of the X-User-Agent header in the JavaScript SDK to ensure correct identification by the Consensus Node. The header now uses the format: X-User-Agent: hiero-sdk-js/<version> (e.g., hiero-sdk-js/1.2.3), preventing misclassification as unknown/unspecified usage. [3216](https://github.com/hiero-ledger/hiero-sdk-js/pull/3216)

## v2.69.0-beta.1

### Added
- `WebClient.forMirrorNetwork()` factory method now works and correctly initializes and updates the address book during initialization.
- `WebClient` now supports scheduled network updates via the `scheduleNetworkUpdate: true` option, and manual updates using the `updateNetwork()` method.
- `AddressBookQuery` is now supported in browser environments.
- `MirrorNodeContractCallQuery` is now supported in browser environments.
- `MirrorNodeContractЕstimateQuery` is now supported in browser environments. [#3092](https://github.com/hiero-ledger/hiero-sdk-js/pull/3092)
- For `Mainnet`, `Testnet`, and `Previewnet`, a fallback mechanism is in place: if the mirror node returns null or missing `grpc_proxy_endpoint` values, the SDK will retain and use the hardcoded list of gRPC web proxy endpoints.

## v2.68.0

### Added
- `<EntityId>.toEvmAddress()` for `AccountId`, `ContractId`, `ContractDelegateId`, `TopicId`, `TokenId`, `FileId`. [#3200](https://github.com/hiero-ledger/hiero-sdk-js/pull/3200)

### Changed
- `<EntityId>.fromEvmAddress(shard, realm, evmAddress)` for `AccountId`, `ContractId`, and `ContractDelegateId`:
  - Shard and realm must now be explicitly provided and are **not encoded** in the EVM address.
  [#3200](https://github.com/hiero-ledger/hiero-sdk-js/pull/3200)

### Deprecated
- Replaced `fromSolidityAddress()` with `fromEvmAddress()`
- Replaced `toSolidityAddress()` with `toEvmAddress()` [#3200](https://github.com/hiero-ledger/hiero-sdk-js/pull/3200)
- EthereumFlow, with the introduction of jumbo transactions, it should always be less cost and more efficient to use EthereumTransaction instead [#3187](https://github.com/hiero-ledger/hiero-sdk-js/pull/3187)

### Documentation
- Migration guide to `@hiero/sdk` v3:
  - Step-by-step instructions, automated scripts, supported file types, and issue template. [#3207](https://github.com/hiero-ledger/hiero-sdk-js/pull/3207)



## v2.67.0

### Added

- Getter for `shard` set in the client
- Getter for `realm` set in the client

### Changed

- `ClientConfiguration` type updated: The `Client` constructor now accepts `shard` and `realm` parameters directly. [#3133](https://github.com/hiero-ledger/hiero-sdk-js/pull/3133)
- `Client.forMirrorNetwork` now supports two additional arguments: `shard` and `realm`. [#3133](https://github.com/hiero-ledger/hiero-sdk-js/pull/3133)
- When a custom network is provided in the `Client` constructor, the `shard` and `realm` values are now automatically inferred from the specified network. [#3133](https://github.com/hiero-ledger/hiero-sdk-js/pull/3133)
- An error is now thrown if the nodes defined in a custom network are not all in the same `shard` and `realm`, enforcing consistency and preventing misconfiguration. [#3133](https://github.com/hiero-ledger/hiero-sdk-js/pull/3133)



## v2.66.0

### Added

-  Extended `setPayableAmount` function in ContractExecuteTransaction, by allowing the user to pass a HbarUnit as optional second parameter. [#3129](https://github.com/hiero-ledger/hiero-sdk-js/pull/3129)


### Fixed
- Prevented unintended removal of transaction type registrations by disabling tree shaking for modules with critical side effects, ensuring proper runtime functionality. [#3149](https://github.com/hiero-ledger/hiero-sdk-js/pull/3149)


## v2.66.0-beta.1

### Added

-   New APIs in `NodeCreateTransaction` and `NodeUpdateTransaction` to support setting a `grpcWebProxyEndpoint`, enabling web proxy access for gRPC from non-gRPC clients:

    -   `setGrpcWebProxyEndpoint(Endpoint)`
    -   getter `grpcWebProxyEndpoint()`

    This addition enhances node configuration flexibility for diverse client environments. [#3138](https://github.com/hiero-ledger/hiero-sdk-js/pull/3138)

## v2.65.1

### Added

-   Support for external transaction signing via HSM:
    -   Introduced `SignableNodeTransactionBodyBytes` to encapsulate `nodeAccountId`, `transactionId`, and canonical `bodyBytes`.
    -   Added `Transaction.signableNodeBodyBytesList()` API to return node-specific, signable transaction bytes for HSM workflows, enabling secure external signing and signature injection.
    -   Improves usability in enterprise and regulated environments. [#3119](https://github.com/hiero-ledger/hiero-sdk-js/pull/3119)
-   Test coverage for HSM-based signing added to the JavaScript SDK, including usage examples. [#3119](https://github.com/hiero-ledger/hiero-sdk-js/pull/3119)
-   Added a library to determine key type and updated relevant files to use the correct key type determination logic. [#3068](https://github.com/hiero-ledger/hiero-sdk-js/pull/3068)
-   Introduced transaction size getter for normal and chunked transactions. [#2961](https://github.com/hiero-ledger/hiero-sdk-js/pull/2961)

### Fixed

-   Regressions in `ContractCreateTransaction` and `TokenCreateTransaction` resolved. [#3125](https://github.com/hiero-ledger/hiero-sdk-js/pull/3125)

### Removed

-   Skipped batch transaction integration tests due to regressions. [#3125](https://github.com/hiero-ledger/hiero-sdk-js/pull/3125)

### Documentation

-   Added usage instructions in an example for HSM-based signing in SDK. [#3119](https://github.com/hiero-ledger/hiero-sdk-js/pull/3119)
-   Local command introduced for checking code coverage without relying on remote results. [#3116](https://github.com/hiero-ledger/hiero-sdk-js/pull/3116)

## v2.64.5

### Added

-   Support for HIP-1064 Daily Rewards For Active Nodes https://hips.hedera.com/hip/hip-1064 This HIP proposes a reward mechanism that will incentivize nodes to remain active on the network. [#3099](https://github.com/hiero-ledger/hiero-sdk-js/pull/3099)
    -   NodeCreateTransaction `declineReward`: whether the node declines rewards
    -   NodeCreateTransaction `setDeclineReward`: update whether the node declines reward
-   Added the `x-user-agent` header to all gRPC calls to enable SDK version tracking, following the approach outlined in [#3089](https://github.com/hiero-ledger/hiero-sdk-js/pull/3089)
-   Included examples that demonstrate proper error handling in realistic, real-world scenarios, including how to manage network connectivity issues when interacting with a single node. [#3064](https://github.com/hiero-ledger/hiero-sdk-js/pull/3064)

## v2.64.0-beta.1

### Added

-   Support for HIP-551 Batch Transaction https://hips.hedera.com/hip/hip-551 It defines a mechanism to execute batch transactions such that a series of transactions (HAPI calls) depending on each other can be rolled into one transaction that passes the ACID test (atomicity, consistency, isolation, and durability). [#3039](https://github.com/hiero-ledger/hiero-sdk-js/pull/3039)
    -   New `BatchTransaction` struct that has a list of `innerTransactions` and `innerTransactionIds`.
    -   New `batchKey` field in Transaction class that must sign the BatchTransaction
    -   New `batchify` method that sets the batch key and marks a transaction as part of a batch transaction (inner transaction). The transaction is signed by the client of the operator and frozen.
-   Extend `setKeyWithAlias` funcs to support PublicKey. [#3051](https://github.com/hiero-ledger/hiero-sdk-js/pull/3051)
-   Enhancing the retry mechanism for the status code `THROTTLED_AT_CONSENSUS` using backoffs retry mechanism. [#3065](https://github.com/hiero-ledger/hiero-sdk-js/pull/3065) [#3076](https://github.com/hiero-ledger/hiero-sdk-js/pull/3076)

## v2.63.0

### Added

-   Added a UMD example demonstrating usage of the SDK in browser environments [#3028](https://github.com/hiero-ledger/hiero-sdk-js/pull/3028)
-   Added `PrivateKey.getRecoveryId(r, s, message)` method to enable recovery ID (v) calculation from raw `ECDSA` signature components.
    This addition allows developers to compute the recovery ID directly, enabling full support for signing and serializing Ethereum transactions (including `EIP-155`) within the SDK. It enhances compatibility with external Ethereum clients and tooling. [#3021](https://github.com/hiero-ledger/hiero-sdk-js/pull/3021)
-   Added an example demonstrating how to sign and recover Ethereum addresses using the Hedera SDK, Ethereum-style signature hashing (`EIP-191`), and the ecrecover contract. [#3029](https://github.com/hiero-ledger/hiero-sdk-js/pull/3029)
-   Implemented dynamic generation of `RequestType.js` and `Status.js` by parsing protobuf definitions. [#3018](https://github.com/hiero-ledger/hiero-sdk-js/pull/3018)

### Changed

-   Improved reliability of `getReceiptQuery` and `getRecordQuery`, which are single-node requests. These queries now retry up to 10 times with a delay when encountering node-specific issues (e.g., "All nodes are unhealthy") to handle transient network or node health problems more gracefully. [#3038](https://github.com/hiero-ledger/hiero-sdk-js/pull/3038)
-   Extracted `_makePaymentTransaction` function used by both Query and CostQuery for initiating payment transactions.
    The filename begins with an underscore to indicate it is not meant for public use and is placed in the queries folder to clearly indicate its internal scope. [#3017](https://github.com/hiero-ledger/hiero-sdk-js/pull/3017)
-   Fixed a bug in `TopicUpdateTransaction` related to the handling of `feeExemptKeys` and `customFees` properties when they are unset. Previously, the transaction would include empty arrays for these fields, unintentionally clearing existing values on the topic. This change ensures that unset properties are treated as null, preserving existing topic configurations.[#3031](https://github.com/hiero-ledger/hiero-sdk-js/pull/3031)
-   Updated README.md to reflect support for the UMD package [#3028](https://github.com/hiero-ledger/hiero-sdk-js/pull/3028)

### Removed

-   MyHbarWallet gRPC web proxies [#3053](https://github.com/hiero-ledger/hiero-sdk-js/pull/3053)

## v2.63.0-beta.1

### Changed

-   Replaced elliptic package with @noble/curves package by @venilinvasilev in #2937

Unlike elliptic, @noble/curves automatically enforces a normalized s value in ECDSA signatures, aligning with best practices in cryptographic security. This ensures better interoperability while preventing malleability-related issues.

### Removed

-   Removed support of non-normalized signatures by @venilinvasilev in #2937

This is NOT a Breaking Change. The SDK continues to function exactly as before, as @noble/curves produces valid signatures compatible with existing verification logic. The normalized s value behavior is already an industry standard (Ethereum's EIP-2, Bitcoin's BIP-66).

## v2.62.0

### Added

-   Added support for hollow account detection (`num=0` with alias) in `AccountId`. This improves account alias handling and protobuf conversion logic. by @ivaylonikolov7 in #2994

### Changed

-   Improved `AccountId` behavior with more explicit protobuf conversion in the following scenarios:
    -   Both `AccountId` number and alias are set
    -   Only alias is set
    -   Only `AccountId` number is set
        Comprehensive test coverage was added. by @ivaylonikolov7 in #2994

### Documentation

-   Added documentation for mirror node contract queries, providing guidance on usage patterns and expected behavior. by @ivaylonikolov7 in #2993

### Tests

-   Added unit tests for `PublicKey.verifyTransaction` to ensure robust signature validation logic. by @0xivanov in #2971

### Dependencies

-   **Development Dependencies**:
    -   Bumped `chromedriver` from `133.0.3` to `134.0.5` (including cryptography package).
    -   Bumped `sinon` from `19.0.2` to `20.0.0`.
    -   Bumped `vite` from `6.1.0` to `6.1.3` (including cryptography package).
    -   Bumped `axios` from `1.7.7` to `1.8.2` in `/examples/simple_rest_signature_provider`.

## v2.62.0-beta.3

### Added

-   Support for browser and CDN distribution by generating UMD build files. by @ivaylonikolov7 in #2980
    -   UMD files are output to the `dist/` directory during the build process.
    -   These files can be served via [unpkg.com](https://www.unpkg.com/) for easy integration in browser environments without a bundler.

## v2.62.0-beta.2

-   fix: remove circular dependancy in dependencies by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2985
-   chore: bump elliptic peer dep by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2976
-   refactor: remove account creation in integration tests by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2970
-   chore: bump elliptic version by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2977
-   chore: regenerate lock file for tck by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2978

## v2.62.0-beta.1

-   chore: return Privatekey, Transaction and PublicKey legacy functionality by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2943

## v2.61.0

-   fix: disable auto renew assignment on topic and token create by @SimiHunjan in @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2945
-   feat: manual update client address book by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2928
-   docs: add some comments about the toSolidityAddress function by @Neurone in https://github.com/hiero-ledger/hiero-sdk-js/pull/2220
-   docs: add note in documentation when running examples by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2962
-   chore(deps): bump @babel/runtime in /examples/react-native-example by @dependabot in
    https://github.com/hiero-ledger/hiero-sdk-js/pull/2947
-   chore(deps): bump @babel/helpers in /examples/react-native-example by @dependabot in
    https://github.com/hiero-ledger/hiero-sdk-js/pull/2949
-   chore(deps): bump @babel/helpers from 7.26.0 to 7.26.10 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2948
-   chore(deps): bump axios from 1.7.9 to 1.8.2 in /examples by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2942
-   chore(deps): bump @babel/helpers by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2951
-   chore(deps): bump @babel/runtime from 7.26.0 to 7.26.10 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2950
-   chore(deps): bump actions/setup-node from 4.2.0 to 4.3.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2958
-   chore(deps): bump renovatebot/github-action from 41.0.14 to 41.0.15 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2957

## v2.61.0-beta.2

-   feat: Verify the SDK can use .setMirrorNetwork() with Solo by @ivaylogarnev-limechain in https://github.com/hiero-ledger/hiero-sdk-js/pull/2933
-   fix: Enabled gRPC retry mechanism by @ivaylogarnev-limechain in https://github.com/hiero-ledger/hiero-sdk-js/pull/2940
-   fix: Hashgraph/cryptography within browser tests by @ivaylogarnev-limechain in https://github.com/hiero-ledger/hiero-sdk-js/pull/2927
-   ci: refactor: used fixtures in tests by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2914
-   ci: change workflow to pull_request_target by @andrewb1269hg in https://github.com/hiero-ledger/hiero-sdk-js/pull/2925
-   chore: remove node08,node13,node23 from mainnet constants by @kfbr in https://github.com/hiero-ledger/hiero-sdk-js/pull/2913
-   chore(deps-dev): bump c8 from 8.0.1 to 10.1.3 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2785
-   chore(deps-dev): bump chai and @types/chai by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2908
-   chore(deps-dev): bump eslint-plugin-n from 16.6.2 to 17.16.1 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2916
-   chore(deps-dev): bump eslint-plugin-n from 16.2.0 to 17.16.1 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2915

## v2.60.1

-   fix: ECDSA private key by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2903
-   chore: fix committers group access by @PavelSBorisov in https://github.com/hiero-ledger/hiero-sdk-js/pull/2885
-   chore(deps): bump pino-pretty from 10.3.1 to 13.0.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2907
-   chore(deps-dev): bump chromedriver from 132.0.0 to 133.0.3 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2910
-   chore(deps-dev): bump chromedriver from 132.0.0 to 133.0.3 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2906
-   chore(deps-dev): bump mocha from 10.8.2 to 11.1.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2909
-   chore(deps-dev): bump eslint-plugin-compat from 4.2.0 to 6.0.2 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2905
-   chore(deps-dev): bump chai from 4.3.8 to 5.2.0 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2917

## v2.60.0-beta.3

-   feat: Improve assignment of auto renew account id for topics(HIP-1021) by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2890
-   fix: zero assumed shard and realm by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2897
-   fix: build issues with browser aliases by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2902

## v2.60.0-beta.2

-   feat: add expo sdk v51+ support by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2895
-   chore: optimize bundle size by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2863
-   chore(deps-dev): bump expo in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2896

## v2.60.0-beta.1

-   fix: Changed Protobufs submodule path by @ivaylogarnev-limechain in https://github.com/hiero-ledger/hiero-sdk-js/pull/2884

## v2.59.0

-   feat(hip 991): Permissionless revenue generating topics by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2875
-   fix: broken docs link in README by @arshadkazmi42 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2671
-   chore: bump grpc-js by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2844

## v2.59.0-beta.1

-   chore: Update protobufs to v0.59.0 by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2845 ( Deprecated LiveHashAddTransaction, LiveHashDeleteTransaction, LiveHashQuery, SystemDeleteTransaction, SystemUndeleteTransaction)

## v2.58.0

-   feat: account create transaction with key derived alias by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2834
-   feat: parallel testing by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2821
-   feat: fix examples and run them in every new PR/per push by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2830
-   fix: Hitting unhealthy node 10 times by @ivaylogarnev-limechain in https://github.com/hiero-ledger/hiero-sdk-js/pull/2819
-   fix: resolve incompatibility with latest pnpm by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2829
-   fix: create-contract-with-value example by @venilinvasilev in https://github.com/hiero-ledger/hiero-sdk-js/pull/2825
-   test: add topic info tests by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2756
-   docs: update README.md title by @hendrikebbers in https://github.com/hiero-ledger/hiero-sdk-js/pull/2810
-   docs: generate documentation for batch 2 @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2831
-   chore(deps-dev): bump vite from 5.4.11 to 6.1.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2853
-   chore(deps-dev): bump vite from 4.5.3 to 6.1.0 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2852
-   chore(deps-dev): bump geckodriver from 4.2.1 to 5.0.0 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2838
-   chore(deps-dev): bump eslint-plugin-jsdoc from 46.8.2 to 50.6.3 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2836
-   chore(deps): bump renovatebot/github-action from 41.0.12 to 41.0.13 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2850
-   chore(deps): bump pnpm/action-setup from 4.0.0 to 4.1.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2847
-   chore(deps): bump renovatebot/github-action from 41.0.11 to 41.0.12 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2843
-   chore(deps): bump actions/setup-java from 4.6.0 to 4.7.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2833
-   chore(deps): bump actions/setup-node from 4.1.0 to 4.2.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2826
-   chore(deps): bump renovatebot/github-action from 41.0.10 to 41.0.11 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2827

## v2.57.2

-   test: fix TopicMessage related tests by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2799
-   docs: documentation batch for classes by @ivaylonikolov7 in https://github.com/hiero-ledger/hiero-sdk-js/pull/2771
-   docs: update chunk size comments by @SimiHunjan in https://github.com/hiero-ledger/hiero-sdk-js/pull/2738
-   docs: update token-airdrop-example.js by @michielmulders in https://github.com/hiero-ledger/hiero-sdk-js/pull/2593
-   chore(deps): bumped Typescript version by @ivaylogarnev-limechain in https://github.com/hiero-ledger/hiero-sdk-js/pull/2797
-   chore(deps): bump renovatebot/github-action from 41.0.8 to 41.0.10 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2805
-   chore(deps): bump typedoc by @ivaylonikolov in https://github.com/hiero-ledger/hiero-sdk-js/pull/2800
-   chore(deps): bump step-security/harden-runner from 2.10.3 to 2.10.4 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2798
-   chore(deps-dev): bump c8 from 8.0.1 to 10.1.3 in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2753
-   chore(deps-dev): bump mocha in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2778
-   chore(deps): bump pino from 8.21.0 to 9.6.0 by dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2779
-   chore(deps-dev): bump nyc from 15.1.0 to 17.1.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2794
-   chore(deps-dev): bump eslint-plugin-deprecation by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2780
-   chore(deps-dev): bump sinon from 18.0.1 to 19.0.2 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2783
-   chore(deps-dev): bump geckodriver from 4.5.1 to 5.0.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2787
-   chore(deps-dev): bump eslint-plugin-compat in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2782
-   chore(deps-dev): bump chromedriver in /packages/cryptography by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2788
-   chore(deps-dev): bump chromedriver from 119.0.1 to 132.0.0 by @dependabot in https://github.com/hiero-ledger/hiero-sdk-js/pull/2784

## v2.57.0-beta.3

## What's Changed

-   feat: Implement MirrorNodeContractQuery by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2723
-   feat: Add configurable commit hash for JS builds. by @ggstyokov in https://github.com/hashgraph/hedera-sdk-js/pull/2751
-   feat: add new nextExchangeRate property to receipt by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2727
-   docs: add configuration.md file by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2687
-   chore(deps): bump ncipollo/release-action from 1.14.0 to 1.15.0 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2760
-   chore(deps): bump step-security/harden-runner from 2.10.2 to 2.10.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2758
-   chore: delete AccountStakersQuery by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2742
-   chore(deps): bump actions/setup-java from 4.5.0 to 4.6.0 by @andrewb1269hg in https://github.com/hashgraph/hedera-sdk-js/pull/2735
-   chore(deps-dev): bump replace-in-file from 7.0.2 to 8.3.0 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2745
-   chore(deps): bump path-to-regexp and express in /tck by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2698
-   chore(deps): bump renovatebot/github-action from 41.0.6 to 41.0.8 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2752
-   chore(deps-dev): bump eslint-plugin-n from 16.2.0 to 17.15.1 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2746
-   chore(deps-dev): bump eslint-plugin-jsdoc from 46.8.2 to 50.6.1 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2731
-   chore(deps-dev): bump eslint-plugin-jsdoc from 46.8.2 to 50.6.1 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2749
-   chore(deps-dev): bump eslint-plugin-compat from 4.0.2 to 6.0.2 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2748
-   chore(deps): bump ws from 8.14.2 to 8.18.0 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2750
-   chore(deps-dev): bump cross-spawn from 6.0.5 to 6.0.6 in /examples/simple_rest_signature_provider by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2655
-   chore(deps-dev): bump body-parser from 1.20.2 to 1.20.3 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2524
-   chore(deps): bump cross-spawn from 6.0.5 to 6.0.6 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2667
-   chore(deps): bump elliptic from 6.5.4 to 6.6.0 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2744

## v2.56.0

## What's Changed

-   feat: Custom web proxies usage and documentation @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2729
-   feat: bump node version by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2647
-   feat: HIP 423 Long Term Scheduled Transactions by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2708
-   feat: Enhance gRPC TLS by Dynamic Certificate Retrieval by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2718
-   fix: check for successful node execution by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2730
-   chore(deps-dev): bump rollup in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2544
-   chore(deps): bump nanoid in /examples/simple_rest_signature_provider by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2714
-   chore(deps): bump nanoid from 3.3.7 to 3.3.8 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2716
-   chore(deps): bump nanoid from 3.3.6 to 3.3.8 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2715
-   chore(deps): bump renovatebot/github-action from 41.0.5 to 41.0.6 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2709

## v2.55.1

## What's Changed

-   feat: update \_makeTransactionData of NodeUpdateTransaction by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2658
-   chore: update protobufs by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/265

## v2.55.0

## What's Changed

-   feat: Added InvalidNode check in the Executable by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2661
-   feat: Pull protos from services by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2611
-   fix: Protobufs updated by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2691
-   fix: typescript issue with long by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2692
-   fix: rework examples by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2646
-   chore: replace pnpm/action-setup with a step-security maintained one by @PavelSBorisov in https://github.com/hashgraph/hedera-sdk-js/pull/2676
-   docs: fix readme by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2685
-   ci: Issues with codecov upload by @san-est in https://github.com/hashgraph/hedera-sdk-js/pull/2684
-   ci: add pr title check workflow to ensure conventional commits by @PavelSBorisov in https://github.com/hashgraph/hedera-sdk-js/pull/2661

## v2.55.0-beta.1

## What's Changed

-   feat: Pull protos from services by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2611
-   fix: rework examples by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2646
-   docs: fix readme by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2685
-   chore: replace pnpm/action-setup with a step-security maintained one by @PavelSBorisov in https://github.com/hashgraph/hedera-sdk-js/pull/2676
-   ci: Issues with codecov upload by @san-est in https://github.com/hashgraph/hedera-sdk-js/pull/2684

## v2.54.2

## What's Changed

-   feat: Add node AccountId to timeout/max attempt errors by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2631
-   feat: Add method to NodeClient for Initialization with MirrorNetwork only by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2635
-   fix: \_fromProtobuf functions where google primitive wrappers used (#2657) by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2657
-   fix: update typescript version by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2666
-   chore(deps-dev): bump vite from 4.4.9 to 4.5.3 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2237
-   chore(deps-dev): bump fast-xml-parser from 4.2.7 to 4.4.1 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2420
-   chore(deps-dev): bump eslint-plugin-deprecation from 2.0.0 to 3.0.0 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2426
-   chore(deps-dev): bump body-parser from 1.20.2 to 1.20.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2525
-   chore(deps-dev): bump pino-pretty from 10.0.0 to 11.2.2 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2427
-   chore(deps-dev): bump vite from 4.4.9 to 5.3.5 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2429
-   chore(deps): bump micromatch from 4.0.5 to 4.0.8 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2485
-   chore(deps): bump codecov/codecov-action from 5.0.2 to 5.0.4 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2656
-   chore(deps): bump actions/setup-java from 4.4.0 to 4.5.0 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2608
-   chore(deps): bump actions/setup-node from 4.0.4 to 4.1.0 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2609
-   chore(deps): bump dcarbone/install-jq-action from 2.0.2 to 3.0.1 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2650
-   chore(deps): bump codecov/codecov-action from 4.6.0 to 5.0.2 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2651
-   chore(deps): bump step-security/harden-runner from 2.10.1 to 2.10.2 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2653
-   chore(deps): bump renovatebot/github-action from 40.3.3 to 41.0.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2653
-   chore(deps): bump cross-spawn from 6.0.5 to 6.0.6 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2666

## v2.54.0-beta.1

## What's Changed

-   feat: Add node AccountId to timeout/max attempt errors by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2631
-   feat: Add method to NodeClient for Initialization with MirrorNetwork only by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2635
-   chore(deps-dev): bump vite from 4.4.9 to 4.5.3 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2237
-   chore(deps-dev): bump fast-xml-parser from 4.2.7 to 4.4.1 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2420
-   chore(deps-dev): bump eslint-plugin-deprecation from 2.0.0 to 3.0.0 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2426
-   chore(deps-dev): bump body-parser from 1.20.2 to 1.20.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2525
-   chore(deps-dev): bump pino-pretty from 10.0.0 to 11.2.2 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2427
-   chore(deps-dev): bump vite from 4.4.9 to 5.3.5 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2429
-   chore(deps): bump micromatch from 4.0.5 to 4.0.8 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2485

## v2.53.0

## What's Changed

-   feat: Refactor SignatureMap for Multi-Transaction Support in \_signedTransactions by @ivaylonikolov7 and @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2601
-   feat: export NodeAddressBook class by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2599
-   feat: exports WebClient for testing grpc-web proxies by @agadzhalov in https://github.com/hashgraph/hedera-sdk-js/pull/2603
-   feat: adding account 32, 33, and 34 endpoints to the clientconstants.js by @rustyShacklefurd in https://github.com/hashgraph/hedera-sdk-js/pull/2607
-   feat: tokenTransfer property exposed in AbstractTokenTransferTransaction by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2616
-   feat: example for get file contents by @b-l-u-e in https://github.com/hashgraph/hedera-sdk-js/pull/2578
-   feat: example for create account with threshold key @b-l-u-e in https://github.com/hashgraph/hedera-sdk-js/pull/2579
-   fix: incomplete file append transaction by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2600
-   fix: comment-out-not-working-examples by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2620
-   fix: TopicMessageQuery#unsubscribe() attempts to re-subscribe by @Jexsie in https://github.com/hashgraph/hedera-sdk-js/pull/2582
-   fix: incorrect protobuf body field used by @kantorcodes in https://github.com/hashgraph/hedera-sdk-js/pull/2613
-   fix: new eslint settings because of eslint bump in simple_rest_signature_provider by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2624
-   ci: fix vulnerable library versions by @mishomihov00 in https://github.com/hashgraph/hedera-sdk-js/pull/2594
-   chore(deps): bump actions/checkout from 4.2.1 to 4.2.2 by @dependabot https://github.com/hashgraph/hedera-sdk-js/pull/2602

## v2.53.0-beta.4

## What's Changed

-   fix: comment-out-not-working-examples by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2620
-   feat: adding account 32, 33, and 34 endpoints to the clientconstants.js by @rustyShacklefurd in https://github.com/hashgraph/hedera-sdk-js/pull/2607
-   feat: Refactor SignatureMap for Multi-Transaction Support in \_signedTransactions by @ivaylonikolov7 and @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2601
-   feat: tokenTransfer property exposed in AbstractTokenTransferTransaction by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2616
-   feat: example for get file contents by @b-l-u-e in https://github.com/hashgraph/hedera-sdk-js/pull/2578
-   feat: example for create account with threshold key @b-l-u-e in https://github.com/hashgraph/hedera-sdk-js/pull/2579
-   fix: TopicMessageQuery#unsubscribe() attempts to re-subscribe by @Jexsie in https://github.com/hashgraph/hedera-sdk-js/pull/2582
-   fix: incorrect protobuf body field used by @kantorcodes in https://github.com/hashgraph/hedera-sdk-js/pull/2613
-   chore(deps): bump actions/checkout from 4.2.1 to 4.2.2 by @dependabot https://github.com/hashgraph/hedera-sdk-js/pull/2602
-   fix: new eslint settings because of eslint bump in simple_rest_signature_provider by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2624
-   ci: fix vulnerable library versions by @mishomihov00 in https://github.com/hashgraph/hedera-sdk-js/pull/2594

## v2.53.0-beta.1

## What's Changed

-   feat: export NodeAddressBook class by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2599
-   feat: exports WebClient for testing grpc-web proxies by @agadzhalov in https://github.com/hashgraph/hedera-sdk-js/pull/2603
-   fix: incomplete file append transaction by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2600

## v2.52.0

## What's Changed

-   fix: file append transaction id after deserialization by @SvetBorislavov in https://github.com/hashgraph/hedera-sdk-js/pull/2583

## v2.52.0-beta.4

## What's Changed

-   feat: expose PendingAirdropId by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2567
-   feat: Changed the return type of removeAllSignatures method by @ivaylogarnev in https://github.com/hashgraph/hedera-sdk-js/pull/2559
-   fix: lock protobufjs version by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2569
-   fix: increase test timeout globally by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2566
-   ci: set codecov config by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2575
-   chore(deps): bump actions/checkout from 4.1.7 to 4.2.1 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2568
-   chore(deps): bump micromatch in /examples/simple_rest_signature_provider by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2484
-   chore(deps): bump micromatch in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2483
-   chore(deps): bump ws in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2357
-   chore(deps-dev): bump braces from 3.0.2 to 3.0.3 in /examples by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2357
-   Bump tar from 6.2.0 to 6.2.1 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2249
-   Bump ip from 1.1.8 to 1.1.9 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2150
-   Bump express in /examples/simple_rest_signature_provider by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2224
-   Bump express in /examples/simple_rest_signature_provider by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2224
-   chore(deps): bump body-parser and express in /tck by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2523
-   chore(deps): bump send and express in /tck by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2522
-   chore(deps): bump path-to-regexp and express in /tck by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2521
-   chore(deps): bump renovatebot/github-action from 40.2.6 to 40.3.1 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2550
-   chore(deps): bump actions/setup-java from 4.2.2 to 4.4.0 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2540
-   chore(deps): bump step-security/harden-runner from 2.9.1 to 2.10.1 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2515
-   Bump vite from 4.4.9 to 4.5.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2236
-   chore(deps): bump serve-static and express in /tck by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2520
-   chore(deps): bump renovatebot/github-action from 40.3.1 to 40.3.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2577

## v2.52.0-beta.3

## What's Changed

-   fix: serialize deserialize FileAppend by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2532
-   fix: change FEE_SCHEDULE_FILE_PART_UPLOADED to not show as an error by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2537
-   ci: Updating the build workflow to use Codecov actions instead of codecov npm package by @san-est in https://github.com/hashgraph/hedera-sdk-js/pull/2558

## v2.52.0-beta.1

## What's Changed

-   feat: Add multi-signature and multi-node support for signing and adding signatures by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2514
-   feat: Add removeSignature/clearAllSignatures methods by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2491
-   chore(deps): bump actions/setup-node from 4.0.3 to 4.0.4 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2538

## v2.51.0

## What's Changed

-   feat: token airdrop transactions by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2492
-   fix: react native's bip32 should use array instead of buffer due to incompatibility by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2502
-   ci: update workflows to use latitude.sh based runners by @nathanklick in https://github.com/hashgraph/hedera-sdk-js/pull/2495
-   chore: Added prerequisites for building the project by @ivaylogarnev-limechain in https://github.com/hashgraph/hedera-sdk-js/pull/2478
-   chore(deps-dev): bump braces in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2347
-   chore(deps): bump braces from 3.0.2 to 3.0.3 in /common_js_test by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2344
-   chore(deps-dev): bump braces from 3.0.2 to 3.0.3 in /packages/proto by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2345
-   chore(deps): bump braces in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2346

## v2.50.0

## What's Changed

-   Bump follow-redirects from 1.15.2 to 1.15.6 in /packages/cryptography by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2205/
-   Bump follow-redirects from 1.15.4 to 1.15.6 in /examples by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2206
-   Bump follow-redirects from 1.15.4 to 1.15.6 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2207
-   Bump follow-redirects from 1.15.4 to 1.15.6 in /examples/simple_rest_signature_provider by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2208
-   Bump follow-redirects from 1.15.4 to 1.15.6 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2209
-   feat: add dynamic address book unit tests by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2459

## v2.50.0-beta.3

## What's Changed

-   chore(deps): bump renovatebot/github-action from 40.2.5 to 40.2.6 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2456
-   feat: dynamic address book \[HIP-869\] by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2403

## v2.50.0-beta.2

## What's Changed

-   fix: ECDSA and ED25519 public key mismatch when you get it from mnemonic by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2451
-   fix: do not reset receiverSignatureRequired in AccountUpdateTransaction by default by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2450
-   chore(deps): bump renovatebot/github-action from 40.1.12 to 40.2.5 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2447
-   chore(deps): bump step-security/harden-runner from 2.8.0 to 2.9.1 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2446
-   chore(deps): bump actions/setup-java from 4.2.1 to 4.2.2 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2445
-   chore(deps): bump actions/setup-node from 4.0.2 to 4.0.3 by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/2396

## v2.49.2

## What's Changed

-   fix: update taskfile status check for submodules task by @isavov in https://github.com/hashgraph/hedera-sdk-js/pull/2435
-   chore: fix token permissions for deploy to github pages by @isavov in https://github.com/hashgraph/hedera-sdk-js/pull/2418
-   fix: reconnect to working node by @0xivanov in https://github.com/hashgraph/hedera-sdk-js/pull/2417
-   release: proto v2.15.0-beta.3 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2415
-   update: add node id to the precheck error by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2414
-   feat: Implement TokenRejectTransaction by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2411
-   update: handle PLATFORM_NOT_ACTIVE error gracefully by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2401
-   feat: pull protobuf changes from latest tag by @isavov in https://github.com/hashgraph/hedera-sdk-js/pull/2435
-   chore: fix token permissions for deploy to github pages by @isavov in https://github.com/hashgraph/hedera-sdk-js/pull/2389
-   update: release all skipped tests by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2395
-   test: add maxAutomaticTokenAssociations tests by @ivaylonikolov7 in https://github.com/hashgraph/hedera-sdk-js/pull/2390

## v2.48.1

## What's Changed

-   release: proto v2.15.0-beta.2 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2367
-   ci: update publishing workflow to use appropriate pre release and stable versions by @rbarkerSL in https://github.com/hashgraph/hedera-sdk-js/pull/2364
-   feature: custom derivation paths in Mnemonic ECDSA private key derivation by @bguiz in https://github.com/hashgraph/hedera-sdk-js/pull/2341

## v2.48.0

## What's Changed

-   release: proto v2.15.0-beta.2 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2367
-   ci: update publishing workflow to use appropriate pre release and stable versions by @rbarkerSL in https://github.com/hashgraph/hedera-sdk-js/pull/2364
-   feature: custom derivation paths in Mnemonic ECDSA private key derivation by @bguiz in https://github.com/hashgraph/hedera-sdk-js/pull/2341

## v2.47.0

## What's Changed

-   revert: mirror node queries changes by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2328
-   feature: change or remove existing keys from a token [HIP-540] by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2299
-   release: proto v2.15.0-beta.1 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2351

## v2.46.0

## What's Changed

-   fix: naming convention by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2303
-   fix: enhanced Logger to accept a log file location by @jeromy-cannon in https://github.com/hashgraph/hedera-sdk-js/pull/2298
-   fix: typo in SDK query file by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2293
-   feature: solution to query the mirror node for the account balance, account info, and contract info data by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2289

## v2.45.0

## What's Changed

-   fix: solve backward compatibility issues between the SDK and hedera-services v0.49 (modularized code) by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2240
-   feature: update metadata field of fungible and non-fungible tokens, and dynamic NFTs (HIP-646, HIP-765 and HIP-657) by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2210

## v2.45.0-beta.1

## What's Changed

-   fix: solve backward compatibility issues between the SDK and hedera-services v0.49 (modularized code) by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2240
-   feature: update metadata field of fungible and non-fungible tokens, and dynamic NFTs (HIP-646, HIP-765 and HIP-657) by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2210

## v2.44.0

## What's Changed

-   fix: set correct autoRenrewAccountId by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2217
-   update: add a new getter to the TransferTransaction class by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2214
-   fix: integer overflow isuue for defaultMaxQueryPayment field by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2213
-   chore(ci): update the publish workflow to release the cryptography and proto artifacts if needed by @nathanklick in https://github.com/hashgraph/hedera-sdk-js/pull/2198

## v2.43.0

## What's Changed

-   fix: do not instantiate logger inside a method by @leninmehedy in https://github.com/hashgraph/hedera-sdk-js/pull/2195
-   release: proto beta version 2.14.0-beta.5 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2196
-   fix: hbar presentation after serialization/deserialization by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2189
-   fix: inability to create and execute freeze transaction by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2171
-   update: update steps for release process in RELEASE.md file by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2201
-   update: add section in README.md file on how to start the tests by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2201

## v2.43.0-beta.1

## What's Changed

-   fix: do not instantiate logger inside a method by @leninmehedy in https://github.com/hashgraph/hedera-sdk-js/pull/2195
-   release: proto beta version 2.14.0-beta.5 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2196
-   fix: hbar presentation after serialization/deserialization by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2189
-   fix: inability to create and execute freeze transaction by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2171
-   update: update steps for release process in REALEASE.md file by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2201
-   update: add section in README.md file on how to start the tests by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2201

## v2.42.0

## What's Changed

-   feature: handling and externalisation improvements for account nonce updates (HIP-844) by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2176

## v2.42.0-beta.4

## What's Changed

-   fix: use one of preselected nodes to execute the transaction by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2165

## v2.42.0-beta.3

## What's Changed

-   fix: deserialize the FileAppendTransaction by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2145
-   chore: ensure CI release workflow properly handles prerelease builds by @nathanklick in https://github.com/hashgraph/hedera-sdk-js/pull/2142
-   fix: update copy of transaction in transaction list by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2139

## v2.42.0-beta.2

## What's Changed

-   Add HIP-745: Optionally send transaction data without required transaction fields by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2067

## v2.42.0-beta.1

## What's Changed

-   Add HIP-745: Optionally send transaction data without required transaction fields by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2067

## v2.41.0

## What's Changed

-   Cannot read properties of undefined (reading 'accountId') by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2103
-   Export Long from SDK by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2107

## v2.41.0-beta.1

## What's Changed

-   [#2102] Cannot read properties of undefined (reading 'accountId') by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2103

## v2.40.0

## What's Changed

-   Added alias utils for parsing from/to public address by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/2066
-   Update axios by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/2090
-   Update react yarn by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/2093
-   Add a Pause Key to TokenUpdateTransaction's fromProtobuf method by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2095

## v2.39.0

## What's Changed

-   Release new cryptography package version by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/2041
-   Release new proto package beta version by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/2040
-   New web proxy for nodeAccountId 3 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2051
-   Update dependencies and apply new linter rules by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/2043

## v2.38.0

## What's Changed

-   Add two grpc-web endpoints for node27/28 to ClientConstants.js by @ElijahLynn in https://github.com/hashgraph/hedera-sdk-js/pull/2019
-   LocalProvider - close method by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2020
-   Method fromEvmAddress() fails to return the contract id from long zero address by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2018
-   Add support for Long and BigNumber to the array methods of ContractFunctionParameters by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2013
-   Added fromStringDer() method (and tests) and deprecated fromString() method by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2030
-   Remove all warnings by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2033

## v2.37.0

## What's Changed

-   Bug on mnemonic.toStandardECDSAsecp256k1PrivateKey() and mnemonic.toEcdsaPrivateKey() by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1989
-   Add Long and BigNumber support for ContractFunctionParameters methods #1972 by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1997
-   Update readme file by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/2004

## v2.37.0-beta.2

## What's Changed

-   Bug on mnemonic.toStandardECDSAsecp256k1PrivateKey() and mnemonic.toEcdsaPrivateKey() by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1989

## v2.37.0-beta.1

## What's Changed

-   Bug on mnemonic.toStandardECDSAsecp256k1PrivateKey() and mnemonic.toEcdsaPrivateKey() by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1989

## v2.36.0

## What's Changed

-   Fix the fromBytes for tokenWipeTransaction by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1968
-   Exposing client operator with a getter by @rokn in https://github.com/hashgraph/hedera-sdk-js/pull/1970
-   Examples related changes by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1953
-   Fix integration tests and remove .only by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1971

## v2.35.0

## What's Changed

-   Fix integration tests by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1896
-   Update packages and release beta versions by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1891
-   Fix typos by @omahs in https://github.com/hashgraph/hedera-sdk-js/pull/1889
-   Fixed duplicated doc comments by @0xMimir in https://github.com/hashgraph/hedera-sdk-js/pull/1888
-   Fix topic subscription error handling by @rokn in https://github.com/hashgraph/hedera-sdk-js/pull/1907
-   Update precompile system contracts by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1910
-   Update/packages vol2 by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1905
-   Ignore minor and patch updates by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1937
-   Fix/dependabot updates by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1938
-   Fix/dependabot updates by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1939
-   Fix/dependabot updates by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1940
-   Add keepalive_time property when we init grpc client by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1908
-   Update the precompiled jsons of the contracts by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1954
-   Add setDefaultMaxQueryPayment() and deprecate setMaxQueruPayment() by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1897
-   Fixed toJSON functionality in TranasctionRecord/Receipt/Response by @rokn in https://github.com/hashgraph/hedera-sdk-js/pull/1956
-   [#1857] Аdding task to run all example by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1955
-   Adding new env variable by @svetoslav-nikol0v in https://github.com/hashgraph/hedera-sdk-js/pull/1957

## v2.34.1

## What's Changed

-   Follow convention toJSON by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1885

## v2.34.0

## What's Changed

-   Add toJSON method for tx response, receipt and record by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1859
-   Add example on how to generate transaction IDs on demand and scenarios by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1860
-   Ensure that generated tx ids are unique by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1862
-   Fix the examples to work with local node as well as with the new precompile contracts by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1863
-   Update dependencies across examples and packages v2 by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1879
-   Finalize toJson functionality by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1880

## v2.33.0

## What's Changed

-   Handle EvmAddress when passed to addAddress as a ContractFunctionParameter by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1819
-   Fix node selection improvement by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1815
-   Enhance AccountId.toSolidityAddress() to handle alias field by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1820
-   Allow ED25519 keys to generate long-zero address from alias by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1822
-   Fix warning issues during build by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1850
-   Add mapi call that queries the mirror node to get the actual evm address field by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1853

## v2.32.0

## What's Changed

-   Update the client constants file with the mainnet proxies by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1780
-   Add method that queries the mirror node to get the actual num field by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1790
-   Add retry logic on grpc web errors by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1802
-   Add method handler by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1804
-   Comment out unavailable web proxies nodes by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1810
-   Fix deprecation and add comments by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1811

## v2.32.0-beta.2

## What's Changed

-   Comment out unavailable web proxies nodes by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1810

## v2.32.0-beta.1

## What's Changed

-   Update the client constants file with the mainnet proxies by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1780
-   Add method that queries the mirror node to get the actual num field by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1790
-   Add retry logic on grpc web errors by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1802

## v2.31.0

## What's Changed

-   Add logger tests by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1725
-   Change copyright year by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1738
-   Add handlers inside parsing methods from evm address by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1741

## v2.30.0

## What's Changed

-   Added new transaction type based on EIP-2930 by @rokn in https://github.com/hashgraph/hedera-sdk-js/pull/1702
-   Fix contract function params by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1703
-   Fix integration tests fees by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1715
-   Fix zero padding for nanos in timestamp by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1713
-   Added release doc by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1720
-   Fix DER and PEM headers by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1706
-   Fix dependencies by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1722
-   Feature contract nonces - HIP-729 support by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1723

## v2.29.0

## What's Changed

-   GRPC improvements by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1656
-   Update the addressbook on SDK build by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1658

## v2.29.0-beta.1

## What's Changed

-   GRPC improvements by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1656

## v2.28.0

## What's Changed

-   Fix conditions in getNode by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1654

## v2.28.0-beta.1

## What's Changed

-   Fix conditions in getNode by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1654

## v2.27.0

## What's Changed

-   Added record for failed transaction by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1643
-   Fix encode/decode scheduled transactions by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1638
-   Fix/issue with encode decode by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1647
-   fix exact version of grpc library by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1652
-   Fix/remove ping all by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1650

## v2.26.0

## What's Changed

-   Fix: decrement unhealthy nodes count on readmit time expiry by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1613
-   Fix: unhealthy nodes by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1611
-   Add logger and transaction stats inside the SDK by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1607

## v2.26.0-beta.3

## What's Changed

-   Fix: decrement unhealthy nodes count on readmit time expiry by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1613

## v2.26.0-beta.2

## What's Changed

-   Fix: unhealthy nodes by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1611

## v2.26.0-beta.1

## What's Changed

-   Add logger and transaction stats inside the SDK by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1607

## v2.25.0

## What's Changed

-   Create example of deploy contract with value by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1604
-   Unhealthy node info by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1605
-   Fix: encoding decoding function params by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1608

## v2.24.2

## What's Changed

-   Fix: list is locked when trying to get the hash before signing the transaction by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1576
-   Add zero padding for nanos by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1573
-   Аdd export for EntityIdHelper by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1574
-   Add contractId as possible input for AccountAllowancesApproveTransaction by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1575
-   Add assessment method support for custom fractional fees by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1600

## v2.24.1-beta.1

## What's Changed

-   Fix: list is locked when trying to get the hash before signing the transaction by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1576
-   Add zero padding for nanos by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1573
-   Аdd export for EntityIdHelper by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1574
-   Add contractId as possible input for AccountAllowancesApproveTransaction by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1575

## v2.24.1

## What's Changed

-   Fix: remove the insecure port of mirror nodes by @dikel in https://github.com/hashgraph/hedera-sdk-js/pull/1535
-   Fix: mnemonic refactoring by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1550
-   Change dependabot interval to monthly by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1547
-   Create example for getting all chunked messages statuses by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1536
-   Fix: spelling of `HARDENED` exported constant by @bguiz in https://github.com/hashgraph/hedera-sdk-js/pull/1561
-   Feature add alias support in AccountCreateTX by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1563
-   Add exports for types by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1566

## v2.24.0-beta.1

## What's Changed

-   Fix: remove the insecure port of mirror nodes by @dikel in https://github.com/hashgraph/hedera-sdk-js/pull/1535
-   Fix: mnemonic refactoring by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1550
-   Change dependabot interval to monthly by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1547
-   Create example for getting all chunked messages statuses by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1536

## v2.24.0

## What's Changed

-   Expose some PublicKey methods by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1521
-   Fix operator and operator account id override in beforeExecute by @dikel in https://github.com/hashgraph/hedera-sdk-js/pull/1531
-   fix contract create flow with external signer by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1533

## v2.23.0

## What's Changed

-   Fix examples build warnings by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1475
-   Refactor variables by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1481
-   Fix/loop nodes accounts by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1493
-   Fix/get cost query by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1496
-   Create github workflow for updating the docs by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1516

## v2.22.0

## What's Changed

-   Feature nft allowance tests by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1468
-   Release/hip 583 by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1472

## v2.20.0

## What's Changed

-   Add new status codes by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1400
-   chore(deps-dev): bump typescript from 4.9.4 to 4.9.5 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/1438
-   chore(deps): bump react-native from 0.71.1 to 0.71.2 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/1437
-   chore(deps): bump react-native-web from 0.18.10 to 0.18.12 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/1436
-   chore(deps): bump ua-parser-js from 0.7.31 to 0.7.33 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/1435
-   chore(deps): bump decode-uri-component from 0.2.0 to 0.2.2 in /examples/react-native-example by @dependabot in https://github.com/hashgraph/hedera-sdk-js/pull/1434
-   Fix \_maxAutomaticTokenAssociations in contract create and contract up… by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1444
-   Feature/extend ethereumflow by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1447
-   Fix/timeout issue by @ochikov in #1414
-   Updated Protobuf statuses
-   fix ping to throw by @ochikov in #1426
-   Bump up dependencies by @ochikov in #1402
-   Removed unnecessary check by @petreze in #1429
-   Fix inaccurate cost calculation by @petreze in #1430
-   Fix/update mirror endpoints #1448
-   Add delete nft allowances and add delegate spender functionality by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1452

**Full Changelog**: https://github.com/hashgraph/hedera-sdk-js/compare/v2.19.2...v2.20.0

## v2.19.2

## What's Changed

-   Return dependabot dependency checker by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1361
-   Release/cryptography v1.4.2 by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1366
-   Fix web proxy by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1395
-   Fix `PublicKey.fromString(newAccountPublicKey.toStringDer());`

## v2.19.1

## What's Changed

-   KeyList now handles single key properly as first parameter by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1348
-   Fix typo in deprecation suggestion by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1352
-   Update contribution guide by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1353
-   Add max execution time setter for NodeChannel GRPC by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1354
-   Update the addressbook update to be 24 hours by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1359

## v2.19.0

## What's Changed

-   Update the Mainnet mirror node and add integration test by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1327
-   Bug/1326 mirror network update by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1328
-   Added getters and deprecated old ones by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1329
-   Integration test workflow by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1330
-   Added proxies for different networks by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1331
-   Аdded NFKD normalization for mnemonic passphrase by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1335
-   Change param of getNftInfo from allowanceSpenderAccountId to spenderId by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1337
-   Fix for optional param of transaction range by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1339

## v2.18.6

## What's Changed

-   Fix some of the Github workflows by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1311
-   Bug/unhealthy node by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1321

## v2.18.5

## What's Changed

-   Throw timeout error and do not make the node unhealthy by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1298
-   Refactor the HIP to point to testnet by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1303
-   Fix for fromBytes to return the range in PrngTransaction by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1302
-   Fix HIP-573 example by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1300

## v2.18.4

## What's Changed

-   Example/hip 573 by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1292
-   Example/hip 564 by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1285
-   Example/hip 542 by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1293
-   bug: fix and improve taskfiles workflow by @petreze in https://github.com/hashgraph/hedera-sdk-js/pull/1283
-   Fix the task test:release command by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1296
-   Fix the offset for uint24 & int24 datatypes in contract functions params by @ochikov in https://github.com/hashgraph/hedera-sdk-js/pull/1295

## v2.19.0-beta.1

### Added

-   `CustomFee.allCollectorsAreExempt`

## v2.18.3

### Added

-   `PrecheckStatusError.contractFunctionResult`
-   `TransactionReceiptQuery.[set|get]ValidateStatus()`
-   `TransactionRecrodQuery.[set|get]ValidateReceiptStatus()`

### Fixed

-   `WebClient` and `NativeClient` do not schedule network updates

## v2.18.2

### Added

-   `TransactionId.getReceipt()`
-   `TransactionId.getRecord()`
-   `AccountCreateTransaction.[set|get]Alias[Key|EvmAddress]()`
-   `ContractCreateFlow.[set|get]MaxChunks()`
-   Support for automatically updating networks
-   `Client.[set|get]NetworkUpdatePeriod()`
-   `Client` constructor supports `scheduleNetworkUpdate` to disable auto updates
-   Support for `local-node` as one of the networks

### Fixed

-   `ContractCreateFlow.executeWithSigner()`
-   `PublicKey.fromString()` for ECDSA keys
-   `WebChannel` not checking headers before decoding body

## v2.18.1

### Fixed

-   `TransferTransaction` incorrectly merging FT and NFT tranfers
-   `ContractCreateFlow.execute()` not using keys provided in `.sign()`
-   `PublicKey.equals()`

## v2.18.0

### Added

-   `Mnemonic.to[Ed25519|Ecdsa]PrivateKey()`

### Deprecated

-   `Mnemonic.toPrivateKey()` - Use `Mnemonic.to[Ed25519|Ecdsa]PrivateKey()`

### Fixed

-   #1188 - Undeprecate `*ContractId.fromSolidityAddress()`

## v2.17.3

### Fixed

-   `Query.queryPayment`, `Query.maxQueryPayment`, and `Client.maxQueryPayment` interactions
-   Remove making empty requests to `grpc.myhbarwallet.com` to calculate time drift

### Added

-   Expose setters/getters for `Cache` to allow users to set their own calculated values

## v2.17.2

### Fixed

-   `TokenUpdateTransaction.pauseKey` not being serialized into protobuf

## v2.17.1

### Added

-   `TokenNftInfo.allowanceSpenderAccountId`
-   `ContractCreateFlow.sign[With]()`

### Fixed

-   `FileAppendTransaction` chunk size should default to 4096
-   `ContractFunctionResult.gas` can be `-1` when `null` in protobufs: #1208
-   `FileAppendTransaction.setTransactionId()` not locking the transaction ID list
-   `TopicMessageSubmitTransaction.setTransactionId()` not locking the transaction ID list

### Deprecated

-   `AccountBalance.tokens` - Use the mirror node API https://docs.hedera.com/guides/docs/mirror-node-api/rest-api#api-v1-accounts instead
-   `AccountBalance.tokenDecimals` - Use same API as above

## v2.17.0

### Added

-   `PrngThansaction`
-   `TransactionRecord.prngBytes`
-   `TransactionRecord.prngNumber`

### Deprecated

-   `ContractFunctionResult.stateChanges` - Use mirror node for contract traceability instead
-   `ContractStateChanges`
-   `StorageChange`

## v2.16.6

### Added

-   `ContractCreateTransaction.autoRenewAccountId`
-   `ContractUpdateTransaction.autoRenewAccountId`

## v2.17.0-beta.1

### Added

-   `PrngThansaction`
-   `TransactionRecord.prngBytes`
-   `TransactionRecord.prngNumber`

## v2.16.5

### Fixed

-   `EthereumFlow` contract creation should hex encode bytes

## v2.16.4

### Fixed

-   Time syncing should not continue if `response.headers.date` is NaN
-   Time drift should use a POST request with content type set correctly
-   Transaction ID generation should no longer fail in browsers

## v2.16.4-beta.3

### Fixed

-   Time syncing should not continue if `response.headers.date` is NaN

## v2.16.4-beta.2

### Fixed

-   Time drift should use a POST request with content type set correctly

## v2.16.4-beta.1

### Fixed

-   Time drift should use a HEAD request to avoid issues with content type

## v2.16.3

### Fixed

-   Implement `AccountAllowanceApproveTransaction.tokenNftApprovals`
-   Implement `AccountAllowanceDeleteTransaction.tokenNftAllowanceDeletions`

## v2.16.2

### Fixed

-   `TokenNftAllowance` to/from protobuf should not assume `spenderAccountId` is set
-   Time drift sync should use myhbarwallet to prevent CORS issues

## v2.16.1

### Fixed

-   Syncing time drift should use https://google.com

## v2.16.0

### Added

-   `StakingInfo`
-   `AccountCreateTransaction.stakedAccountId`
-   `AccountCreateTransaction.stakedNodeId`
-   `AccountCreateTransaction.declineStakingReward`
-   `ContractCreateTransaction.stakedAccountId`
-   `ContractCreateTransaction.stakedNodeId`
-   `ContractCreateTransaction.declineStakingReward`
-   `AccountUpdateTransaction.stakedAccountId`
-   `AccountUpdateTransaction.stakedNodeId`
-   `AccountUpdateTransaction.declineStakingReward`
-   `ContractUpdateTransaction.stakedAccountId`
-   `ContractUpdateTransaction.stakedNodeId`
-   `ContractUpdateTransaction.declineStakingReward`
-   `TransactionRecord.paidStakingRewards`
-   `ScheduleCreateTransaction.expirationTime`
-   `ScheduleCreateTransaction.waitForExpiry`
-   Variants to `FeeDataType`
-   `TopicMessage.initialTransactionId`

### Fixed

-   `TransactionRecord.[to|from]Bytes()` should round trip correclty

## v2.16.0-beta.1

### Added

-   `StakingInfo`
-   `AccountCreateTransaction.stakedAccountId`
-   `AccountCreateTransaction.stakedNodeId`
-   `AccountCreateTransaction.declineStakingReward`
-   `ContractCreateTransaction.stakedAccountId`
-   `ContractCreateTransaction.stakedNodeId`
-   `ContractCreateTransaction.declineStakingReward`
-   `AccountUpdateTransaction.stakedAccountId`
-   `AccountUpdateTransaction.stakedNodeId`
-   `AccountUpdateTransaction.declineStakingReward`
-   `ContractUpdateTransaction.stakedAccountId`
-   `ContractUpdateTransaction.stakedNodeId`
-   `ContractUpdateTransaction.declineStakingReward`
-   `TransactionRecord.paidStakingRewards`
-   `ScheduleCreateTransaction.expirationTime`
-   `ScheduleCreateTransaction.waitForExpiry`

## v2.15.0

### Added

-   `EthereumFlow`
-   `EthereumTransactionData`
-   `EthereumTransactionDataLegacy`
-   `EthereumTransactionDataEip1559`
-   `Signer.getAccountKey()` - Signature providers _should_ be implementing this method, but
    it was added in a none-breaking change way so old signer provider implementations won't
    break when updating to the latest JS SDK version
-   `ContractCreateFlow.executeWithSigner()` - Execute a flow using a signer
-   `AccountInfoFlow.verify[Signature|Transaction]WithSigner()` - Execute a flow using a signer
-   A third party time source will be used for transaction ID generation when possible.

### Deprecated

-   `EthereumTransaction.[set|get]CallData()` - Use `EthereumTransaction.[set|get]CallDataFileId()` instead
-   `EthereumTransaction.[set|get]MaxGasAllowance()` - Use `EthereumTransaction.[set|get]MaxGasAllowanceHbar()` instead

## v2.14.2

### Added

-   Exported `RequestType`

### Fixed

-   `RequestType` missing codes

## v2.14.1

### Added

-   Exported `FeeComponents`
-   Exported `FeeData`
-   Exported `FeeDataType`
-   Exported `FeeSchedule`
-   Exported `FeeSchedules`
-   Exported `TransactionFeeSchedule`

## v2.14.0

### Added

-   `AccountId.aliasEvmAddress`
-   `ContractCreateTransaction.[get|set]MaxAutomaticTokenAssociations()`
-   `ContractCreateTransaction.[get|set]Bytecode()`
-   `ContractUpdateTransaction.[get|set]MaxAutomaticTokenAssociations()`
-   `ContractCreateFlow.[get|set]MaxAutomaticTokenAssociations()`
-   `AccountInfo.ethereumNonce`
-   `ContractCallResult.senderAccountId`
-   `ContractCallQuery.[get|set]SenderAccountId()`
-   `TransactionRecord.ethereumHash`
-   `EthereumTransaction`
-   `TransactionResponse.get[Receipt|Record]Query()`
-   `[Wallet|Signer|Provider].sendRequest()` -> `[Wallet|Signer|Provider].call()`
-   `[Wallet|Signer].[sign|populate|check]Transaction()` are now generic over the parameter
-   `Wallet.checkTransaction` should not error if the `Transaction.transactionId` is `null`
-   More status codes to `Status`

### Fixed

-   Bumped `@hashgraph/proto` version to correctly support account allowances
-   `TransactionId.transactionId` accessor should not error if there is no transaction ID set and
    instead should return a nullable `TransactionId`
-   `ContractFunctionParameters.addBytes()` where the byte length is a factor of 32 and greater than 32
-   `[Web|Native]Channel` should correctly propagate the error from `fetch()`

## v2.14.0-beta.2

### Added

-   `ContractEvmTransaction`

## v2.14.0-beta.1

### Added

-   More status codes to `Status`

### Changed

-   `[Wallet|Signer|Provider].sendRequest()` -> `[Wallet|Signer|Provider].call()`
-   `[Wallet|Signer].[sign|populate|check]Transaction()` are now generic over the parameter
-   `Wallet.checkTransaction` should not error if the `Transaction.transactionId` is `null`

### Fixed

-   Bumped `@hashgraph/proto` version to correctly support account allowances
-   `TransactionId.transactionId` accessor should not error if there is no transaction ID set and
    instead should return a nullable `TransactionId`
-   `ContractFunctionParameters.addBytes()` where the byte length is a factor of 32 and greater than 32
-   `[Web|Native]Channel` should correctly propagate the error from `fetch()`

## v2.13.1

### Fixed

-   `AccountId.clone()` should clone the `aliasKey`

## v2.13.0

### Added

-   `ContractFunctionResult.[gas|amount|functionParameters]`
-   `AccountAllowanceDeleteTransaction`
-   `Wallet.createRandom[ED25519|ECDSA]()`

### Fixed

-   `WebChannel` and `NativeChannel` using `HashgraphProto.proto` instead of `proto` in the URL
-   `TransactionReceiptQuery`'s error should contain the transaction set on the request instead
    of the payment transaction ID
-   `Query.maxQueryPayment` should be used before `Client.maxQueryPayment`
-   request timeout check being reversed

### Changed

-   Updated `Signer` and `Provider` to be interfaces instead of classes

### Deprecated

-   `AccountAllowanceAdjustTransaction`

### Removed

-   `LocalWallet` - Use `Wallet` instead

## v2.13.0-beta.1

### Fixed

-   `TopicUpdateTransaction` should be able to call [get|set]ExpirationTime().
-   `Status` should contain a return code for 314.

### Added

-   `ContractFunctionResult.[gas|amount|functionParameters]`
-   `AccountAllowanceDeleteTransaction`

## v2.12.1

### Fixed

-   Only check for logging environment variables inside `index.js`
-   Update `Exectuable`, `Query`, and `CostQuery` to correctly set `nodeAccountIds`
-   Make suer `Query` saves the operator from the client to be used when building
    new payment transactions

## v2.12.0

### Added

-   `AccountInfoFlow.verify[Signature|Transaction]()`
-   `Client.[set|get]NodeMinReadmitPeriod()`
-   Support for using any node from the entire network upon execution
    if node account IDs have no been locked for the request.
-   Support for all integer widths for `ContractFunction[Result|Selector|Params]`
-   `AccountAllowanceApproveTransaction.approve[Hbar|Token|TokenNft]Allowance()`
-   `AccountAllowanceAdjustTransaction.[grant|revoke][Hbar|Token|TokenNft]Allowance()`
-   `AccountAllowanceAdjustTransaction.[grant|revoke]TokenNftAllowanceAllSerials()`
-   `TransactionRecord.[hbar|token|tokenNft]AllowanceAdjustments`
-   `TransferTransaction.addApproved[Hbar|Token|Nft]Transfer()`

### Deprecated

-   `AccountAllowanceApproveTransaction.add[Hbar|Token|TokenNft]Allowance[WithOwner]()`, use `approve*Allowance()` instead.
-   `AccountAllowanceAdjustTransaction.add[Hbar|Token|TokenNft]Allowance[WithOwner]()`, use `[grant|revoke]*Allowance()` instead.
-   `TransferTransaction.set[Hbar|Token|Nft]TransferApproval()`, use `addApproved*Transfer()` instead.

### Changed

-   Network behavior to follow a more standard approach (remove the sorting we
    used to do).

### Fixed

-   Ledger ID checksums
-   `Transaction.fromBytes()` should validate all the transaction bodies are the same
-   `ExchangeRate._[from|to]Protobuf()` should correctly decode `expirationTime`
-   Mark `expo` as a optional peer dependency
-   `SubscriptionHandle` should be exported
-   `TransferTransaction` transfers merging

## v2.11.3

### Fixed

-   Scheduled transactions should use the default transaction fee if a fee was not
    explicitly set

## v2.11.2

### Added

-   `TransactionRecord.[hbar|token|tokenNft]AllowanceAdjustments`
-   `TransferTransaction.addApproved[Hbar|Token|Nft]Transfer()`

## v2.11.1

### Added

-   `AccountAllowanceApproveTransaction.approve[Hbar|Token|TokenNft]Allowance()`
-   `AccountAllowanceAdjustTransaction.[grant|revoke][Hbar|Token|TokenNft]Allowance()`
-   `AccountAllowanceAdjustTransaction.[grant|revoke]TokenNftAllowanceAllSerials()`

## v2.12.0-beta.1

### Added

-   `AccountInfoFlow.verify[Signature|Transaction]()`
-   `Client.[set|get]NodeMinReadmitPeriod()`
-   Support for using any node from the entire network upon execution
    if node account IDs have no been locked for the request.
-   Support for all integer widths for `ContractFunction[Result|Selector|Params]`
-   `AccountAllowanceApproveTransaction.approve[Hbar|Token|TokenNft]Allowance()`
-   `AccountAllowanceAdjustTransaction.[grant|revoke][Hbar|Token|TokenNft]Allowance()`
-   `AccountAllowanceAdjustTransaction.[grant|revoke]TokenNftAllowanceAllSerials()`
-   `TransactionRecord.[hbar|token|tokenNft]AllowanceAdjustments`
-   `TransferTransaction.addApproved[Hbar|Token|Nft]Transfer()`
-   Ledger ID checksums
-   `Transaction.fromBytes()` should validate all the transaction bodies are the same

### Deprecated

-   `AccountAllowanceApproveTransaction.add[Hbar|Token|TokenNft]Allowance[WithOwner]()`, use `approve*Allowance()` instead.
-   `AccountAllowanceAdjustTransaction.add[Hbar|Token|TokenNft]Allowance[WithOwner]()`, use `[grant|revoke]*Allowance()` instead.
-   `TransferTransaction.set[Hbar|Token|Nft]TransferApproval()`, use `addApproved*Transfer()` instead.

### Changed

-   Network behavior to follow a more standard approach (remove the sorting we
    used to do).

### Fixed

-   Ledger ID checksums
-   `Transaction.fromBytes()` should validate all the transaction bodies are the same
-   `ExchangeRate._[from|to]Protobuf()` should correctly decode `expirationTime`
-   Mark `expo` as a optional peer dependency

### Added

## v2.11.0

### Added

-   `LocalWallet`
-   `LocalProvider`
-   `Provider`
-   `Signer`
-   `Wallet`
-   `SignerSignature`
-   Verbose logging using `js-logger`
-   `Client.setRequestTimeout()`

### Fixed

-   TLS for mirror nodes
-   Transactions should have an appropriate default (copied from Java SDK)
-   Min/max backoff for nodes should start at 8s to 60s
-   The current backoff for nodes should be used when sorting inside of network
    meaning nodes with a smaller current backoff will be prioritized
-   Chunked transactions (`FileAppendTransaction` and `TopicMessageSubmitTransaction`) should
    use the correct transation ID per transaction
-   Transaction removing signatures when calling `Transaction.[toBytes|getTransactionHash]()`

## v2.11.0-beta.1

### Added

-   `LocalWallet`
-   `LocalProvider`
-   `Provider`
-   `Signer`
-   `Wallet`
-   `SignerSignature`
-   Verbose logging using `js-logger`
-   `Client.setRequestTimeout()`

### Fixed

-   TLS for mirror nodes
-   Transactions should have an appropriate default (copied from Java SDK)
-   Min/max backoff for nodes should start at 8s to 60s
-   The current backoff for nodes should be used when sorting inside of network
    meaning nodes with a smaller current backoff will be prioritized
-   Chunked transactions (`FileAppendTransaction` and `TopicMessageSubmitTransaction`) should
    use the correct transation ID per transaction
-   Transaction removing signatures when calling `Transaction.[toBytes|getTransactionHash]()`

## v2.10.1

### Fixes

-   `NativeClient` IPs should have a port

## v2.10.0

### Added

-   `AddressBookQuery`
-   Status codes
-   `*[Transaction|Query].setGrpcDeadline()`
-   `*Allowance.ownerAccountId`

### Fixed

-   Mirror network incorrectly using `433` for TLS instead of `443`
-   `TransactionReceipt` protobuf encoding
-   `ContractId.fromString()`

## v2.10.0-beta.1

### Added

-   `AddressBookQuery`
-   Status codes
-   `*[Transaction|Query].setGrpcDeadline()`
-   `*Allowance.ownerAccountId`

## v2.9.1

### Fixed

-   Mirror network incorrectly using `433` for TLS instead of `443`
-   `TransactionReceipt` protobuf encoding
-   `ContractId.fromString()`

## v2.10.0-beta.1

### Added

-   `AddressBookQuery`
-   Status codes
-   `*[Transaction|Query].setGrpcDeadline()`
-   `*Allowance.ownerAccountId`

### Fixed

-   Mirror network incorrectly using `433` for TLS instead of `443`
-   `TransactionReceipt` protobuf encoding
-   `ContractId.fromString()`

## v2.9.0

### Added

-   `ContractId.fromEvmAddress()`
-   `ContractFunctionResult.stateChanges`
-   `ContractFunctionResult.evmAddress`
-   `ContractStateChange`
-   `StorageChange`
-   `[FileAppend|TopicMessageSubmit]Transaction.[set|get]ChunkSize()`, and changed default chunk size for `FileAppendTransaction` to 2048.
-   `AccountAllowance[Adjust|Approve]Transaction`
-   `TransactionRecord.tokenTransfersList`

## v2.9.0-beta.1

### Added

-   `ContractId.fromEvmAddress()`
-   `ContractFunctionResult.stateChanges`
-   `ContractFunctionResult.evmAddress`
-   `ContractStateChange`
-   `StorageChange`
-   `[FileAppend|TopicMessageSubmit]Transaction.[set|get]ChunkSize()`, and changed default chunk size for `FileAppendTransaction` to 2048.
-   `AccountAllowance[Adjust|Approve]Transaction`
-   `TransactionRecord.tokenTransfersList`
-   `AccountAllowance[Adjust|Approve]Transaction`
-   `AccountInfo.[hbar|token|tokenNft]Allowances`
-   `[Hbar|Token|TokenNft]Allowance`
-   `[Hbar|Token|TokenNft]Allowance`
-   `TransferTransaction.set[Hbar|Token|TokenNft]TransferApproval()`

## v2.8.0

### Added

-   Support for regenerating transaction IDs on demand if a request
    responses with `TRANSACITON_EXPIRED`

### Fixed

-   `Transaction.sign()` should correctly save public keys and signers when sign on demand is disabled
-   `WebClient` failing to be constructed because its network was missing ports

## v2.8.0-beta.2

### Fixed

-   `Transaction.sign()` should correctly save public keys and signers when sign on demand is disabled
-   `WebClient` failing to be constructed because its network was missing ports

## v2.7.1

### Fixed

-   `WebClient` failing to be constructed because its network was missing ports

## v2.8.0-beta.1

### Added

-   Support for regenerating transaction IDs on demand if a request
    responses with `TRANSACITON_EXPIRED`

## v2.7.0

### Added

-   `[Private|Public]Key.toAccountId()`
-   `TokenUpdateTransaction.[get|set]PauseKey()`
-   `TokenUpdateTransaction.setSupplyKey()`
-   Updated `Status` with new response codes
-   `AccountId.aliasKey`, including `AccountId.[to|from]String()` support.
-   `[PublicKey|PrivateKey].toAccountId()`.
-   `aliasKey` fields in `TransactionRecord` and `AccountInfo`.
-   `nonce` field in `TransactionId`, including `TransactionId.[set|get]Nonce()`
-   `children` fields in `TransactionRecord` and `TransactionReceipt`
-   `duplicates` field in `TransactionReceipt`
-   `[TransactionReceiptQuery|TransactionRecordQuery].[set|get]IncludeChildren()`
-   `TransactionReceiptQuery.[set|get]IncludeDuplicates()`
-   New response codes.
-   Support for ECDSA SecP256K1 keys.
-   `PrivateKey.generate[ED25519|ECDSA]()`
-   `[Private|Public]Key.from[Bytes|String][DER|ED25519|ECDSA]()`
-   `[Private|Public]Key.to[Bytes|String][Raw|DER]()`

### Fixed

-   Requests should retry on `INTERNAL` consistently
-   Signing data which contains bytes larger than a value of 127
-   `[Private|Public]Key.fromBytesEcdsa()` checking for the wrong bytes length

### Deprecated

-   `TokenUpdateTransaction.setsupplyKey()` - use `setSupplyKey()` instead
-   `PrivateKey.generate()`, use `PrivateKey.generate[ED25519|ECDSA]()` instead.

## v2.7.0-beta.4

### Fixed

-   Signing data which contains bytes larger than a value of 127
-   `[Private|Public]Key.fromBytesEcdsa()` checking for the wrong bytes length

## v2.7.0-beta.3

### Added

-   `TokenUpdateTransaction.[get|set]PauseKey()`
-   `TokenUpdateTransaction.setSupplyKey()`
-   Updated `Status` with new response codes

### Deprecated

-   `TokenUpdateTransaction.setsupplyKey()` - use `setSupplyKey()` instead

## v2.7.0-beta.2

### Added

-   `[Private|Public]Key.toAccountId()`

## v2.7.0-beta.1

### Added

-   `AccountId.aliasKey`, including `AccountId.[to|from]String()` support.
-   `[PublicKey|PrivateKey].toAccountId()`.
-   `aliasKey` fields in `TransactionRecord` and `AccountInfo`.
-   `nonce` field in `TransactionId`, including `TransactionId.[set|get]Nonce()`
-   `children` fields in `TransactionRecord` and `TransactionReceipt`
-   `duplicates` field in `TransactionReceipt`
-   `[TransactionReceiptQuery|TransactionRecordQuery].[set|get]IncludeChildren()`
-   `TransactionReceiptQuery.[set|get]IncludeDuplicates()`
-   New response codes.
-   Support for ECDSA SecP256K1 keys.
-   `PrivateKey.generate[ED25519|ECDSA]()`
-   `[Private|Public]Key.from[Bytes|String][DER|ED25519|ECDSA]()`
-   `[Private|Public]Key.to[Bytes|String][Raw|DER]()`

### Deprecated

-   `PrivateKey.generate()`, use `PrivateKey.generate[ED25519|ECDSA]()` instead.

### Fixed

-   Requests should retry on `INTERNAL` consistently

## v2.6.0

### Added

-   Support for multiple IPs per node
-   New smart contract response codes

### Fixed

-   `TransferTransaction` should deterministically order transfers before submitting transaction

## v2.6.0-beta.1

## Added

-   New smart contract response codes

## v2.5.0

### Fixed

-   `WebClient` should be able to construct an empty `MirrorNetwork`
-   Bad imports while using Common JS

### Deprecated

-   `ContractUpdateTransaction.[set|get]ByteCodeFileId()`
-   `ContractCallQuery.[set|get]MaxResultSize()`

## v2.5.0-beta.2

### Fixed

-   Bad imports while using Common JS

## v2.5.0-beta.1

### Deprecated

-   `ContractUpdateTransaction.[set|get]ByteCodeFileId()`
-   `ContractCallQuery.[set|get]MaxResultSize()`

## v2.4.1

### Fixed

-   Bad imports while using Common JS

## v2.4.0

### Added

-   TLS support
-   `Client.[get|set]TransportSecurity()` - Enable/Disable TLS
-   `*Id.toSolidityAddress()`
-   Support for `number` in all `ContractFunctionParam.add[Uint|Int]*()` methods

### Fixed

-   `*Id.fromSolidityAddress()`

## v2.3.0

### Added

-   `FreezeType`
-   `FreezeTransaction.[get|set]FreezeType()`
-   `FreezeTransaction.[get|set]FileId()`
-   `FreezeTransaction.[get|set]FileHash()`

### Deprecated

-   `FreezeTransaction.[get|set]UpdateFileId()`, use `.[get|set]FileId()` instead.

## v2.2.0

### Fixed

-   gRPC client not timing out on unresponsive connections

## v2.2.0-beta.1

### Added

-   Support for HIP-24 (token pausing)
    -   `TokenInfo.pauseKey`
    -   `TokenInfo.pauseStatus`
    -   `TokenCreateTransaction.pauseKey`
    -   `TokenUpdateTransaction.pauseKey`
    -   `TokenPauseTransaction`
    -   `TokenUnpauseTransaction`

## v2.1.1

### Fixed

-   UTF8 encoding and ecoding in React Native

## v2.1.0

### Added

-   Support for automatic token associations
    -   `TransactionRecord.automaticTokenAssociations`
    -   `AccountInfo.maxAutomaticTokenAssociations`
    -   `AccountCreateTransaction.maxAutomaticTokenAssociations`
    -   `AccountUpdateTransaction.maxAutomaticTokenAssociations`
    -   `TokenRelationship.automaticAssociation`
    -   `TokenAssociation`

### Fixed

-   `TransferTransaction.addHbarTransfer()` was not combining transfers

## v2.1.0-beta.1

### Added

-   Support for automatic token associations
    -   `TransactionRecord.automaticTokenAssociations`
    -   `AccountInfo.maxAutomaticTokenAssociations`
    -   `AccountCreateTransaction.maxAutomaticTokenAssociations`
    -   `AccountUpdateTransaction.maxAutomaticTokenAssociations`
    -   `TokenRelationship.automaticAssociation`
    -   `TokenAssociation`

## v2.0.30

### Added

-   `TokenNftInfo.toString()` - Stringifies the JSON representation of the current `TokenNftInfo`
-   `TokenNftInfo.toJson()` - JSON representation of the current `TokenNftInfo`
-   `Timestamp.toString()` - displays as `<seconds>.<nanos>`. Use `Timestamp.toDate()` to print differently

### Deprecated

-   `TokenNftInfoQuery.[set|get]AccountId()` with no replacement
-   `TokenNftInfoQuery.[set|get]TokenId()` with no replacement
-   `TokenNftInfoQuery.[set|get]Start()` with no replacement
-   `TokenNftInfoQuery.[set|get]End()` with no replacement
-   `TokenMintTransaction.[add|set]Metadata()` support for string metadata

## v2.0.29

### Added

-   Support for `CustomRoyaltyFees`
-   Updated `Status` with new response codes
-   Implemented `Client.[set|get]NetworkName()`

## v2.0.28

### Added

-   `Client.pingAll()` - pings all network nodes
-   `Client.[set|get]NodeWaitTime()` - minimum delay for nodes that are nto responding
-   `Client.[set|get]MaxAttempts()` - max number of attempts for each request
-   `Client.[set|get]MaxNodesPerTransaction()` - number of node account IDs to use per request
-   `CustomFixedFee.[set|get]HbarAmount()` - helper method to set both `denominatingTokenId` and `amount` when fee is an `Hbar` amount
-   `CustomFixedFee.setDenominatingTokenToSameToken()` - helper method to set `denominatingTokenId` to `0.0.0` which is not obvious

### Changed

-   `Client.ping()` will no longer throw an error

### Deprecated

-   `*[Transaction|Query].[set|get]MaxRetries()` - Use `*[Transaction|Query].[set|get]MaxAttempts()` instead

### Fixed

-   `PrivateKey.signTransaction()` and `PublicKey.verifyTransaction()` should correctly freeze an unfrozen transaction

## v2.0.27

### Added

-   Updated `Status` with new response codes
-   Support for `Hbar.[from|to]String()` to be reversible
-   `Client.setAutoValidateChecksums()` set whether checksums on ids will be automatically validated upon attempting to execute a transaction or query. Disabled by default. Check status with `Client.isAutoValidateChecksumsEnabled()`
-   `*Id.toString()` no longer stringifies with checksums. Use `*Id.getChecksum()` to get the checksum that was parsed, or use `*Id.toStringWithChecksum(client)` to stringify with the correct checksum for that ID on the client's network.
-   `*Id.validateChecksum()` to validate a checksum. Throws new `BadEntityIdException`

### Fixed

-   Free queries should not longer attempt to sign payment transactions
-   All enitty IDs within response should no longer contain a checskum.
    Use `*Id.toStringWithChecksum(Client)` to stringify with a checksum
-   `ReceiptStatusError` should contain a properly filled out `TransactionReceipt`

### Deprecated

-   `*Id.validate()` use `*Id.validateChecksum()` instead

## v2.0.26

### Changed

-   Updated `Status` and `FeeDataType` with new codes

## v2.0.25

### Added

-   `TokenCreateTransaction.[get|set]FeeScheduleKey()`
-   Support for parsing file 0.0.111 using `FeeSchedules`

### Fixed

-   `TokenMintTransaction.[to|from]Bytes()` incorrectly parsing the transaction body

### Removed

-   `TokenCreateTransaction.addCustomFee()` - use `TokenCreateTransaction.setCustomFees()` instead

## v2.0.25-beta.1

### Added

-   Support for NFTS
    -   Creating NFT tokens
    -   Minting NFTs
    -   Burning NFTs
    -   Transfering NFTs
    -   Wiping NFTs
    -   Query NFT information
-   Support for Custom Fees on tokens:
    -   Setting custom fees on a token
    -   Updating custom fees on an existing token

### Fixed

-   Loading keystore should no longer error when `CipherAlgorithm` doesn't match case
-   `PrivateKey.legacyDerive()` should now be consistent with the v1.4.6 JS SDK

## v2.0.24

### Added

-   `Hbar.fromTinybar()` supports `BigNumber`
-   `Hbar.toString()` supports `HbarUnit`
-   Implemented to and from bytes for `TopicInfo` and `TokenInfo`
-   Support for `sign-on-demand`
    -   This is disabled by default to you'll need to enable it using `Client.setSignOnDemand(true)`
    -   If `sign-on-demand` is enabled you'll need to use `async` versions of these methods:
        -   `*Transaction.toBytes()` -> `*Transaction.toBytesAsync()`
        -   `*Transaction.getSignatures()` -> `*Transaction.getSignaturesAsync()`
        -   `*Transaction.getTransactionHash()` -> `*Transaction.getTransactionHashAsync()`

### Changes

-   All requests now retry on gRPC status `INTERNAL` if error returned contains `RST_STREAM`

## v2.0.23

### Added

-   Added support for TLS on mirror node connections
-   Implemented `*Id.clone()` (this is used internally to fix some issues that only surface in React Native)
-   Implement `Timestamp.plusNanos()`
-   Added support for entity ID checksums. The network will be extracted from the checksum of the
    entity ID and validated on each request to make sure a request is not happening on one network
    while an entity ID references another network. Entity IDs with a network will print with a checksum
    while entity IDs without a checksum will not print the checksum part.

### Fixed

-   `TopicMessageQuery.startTime` not updating start time by one nanosecond causing a message to appear twice
    if the connection reset
-   `TopicMessageQuery` should log retries
-   `TransactionReceipt` error handling; this should now throw an error contain the receipt

## v2.0.22

### Fixed

-   `TopicMessageQuery.maxBackoff` was not being used at all
-   `TopicMessageQuery.limit` was being incorrectly update with full `TopicMessages` rather than per chunk
-   `TopicMessageQuery.startTime` was not being updated each time a message was received
-   `TopicMessageQuery.completionHandler` was be called at incorrect times

## v2.0.21

### Added

-   Exposed `AccountBalance.tokenDecimals`
-   Support for `string` parameters in `Hbar.fromTinybars()`
-   `Hbar.toBigNumber()` which is a simple wrapper around `Hbar.to(HbarUnit.Hbar)`
-   `AccountBalance.toJSON()`
-   Support for `maxBackoff`, `maxAttempts`, `retryHandler`, and `completionHandler` in `TopicMessageQuery`
-   Default logging behavior to `TopicMessageQuery` if an error handler or completion handler was not set

### Fixed

-   `TopicMessageQuery` retry handling; this should retry on more gRPC errors
-   `TopicMessageQuery` max retry timeout; before this would could wait up to 4m with no feedback
-   Missing `@readonly` tag on `TokenInfo.tokenMemo`
-   `Keystore` failing to recognize keystores generated by v1 SDKs
-   Errors caused by the use `?.` and `??` within a node 12 context
-   `TopicMessageQuery`

## v2.0.20

### Added

-   `PrivateKey.legacyDerive()` - Derive private key using legacy derivations
-   `Hbar.fromTinybars()` supports `string` parameter
-   `Hbar.toBigNumber()` aliases `Hbar.to(HbarUnit.Hbar)`
-   `AccountBalance.tokenDecimals` - Represents the decimals on a token
-   `AccountBalance.toString()` should print a `JSON.stringified()` output
-   `AccountBalance.toJSON()`

### Changed

-   `Mnemonic.toLegacyPrivateKey()` no longer automaticaly derives `PrivateKey`, instead produces root `PrivateKey`
    Use `PrivateKey.legacyDerive()` to derive the proper `PrivateKey` manually
-   Removed the use of `@hashgraph/protobufjs` in favor of `protobufjs`
    The reason `@hashgraph/protobufjs` even exists is because `protobufjs` contains `eval`
    which fails CSP in browser. However, while running integration tests through `vite` and
    `mocha` it seems the `eval` was never hit.
-   Moved from `yarn` to `pnpm` because of performance issues with `yarn`

## v2.0.19

### Added

-   Scheduled transaction support: `ScheduleCreateTransaction`, `ScheduleDeleteTransaction`, and `ScheduleSignTransaction`
-   React Native support
-   Support for raw `proto.Transaction` bytes in `Transaction.fromBytes()`
    -   This means v1 SDK's `Transaction.toBytes()` will now be supported in v2 `Transaction.fromBytes()`
        However, `Transaction.toBytes()` and `Transaction.getTransactionHas()` in v2 will produce different
        results in the v1 SDK's.

### Fixed

-   addSignature() Behavior Differs Between Implementations [NCC-E001154-005]
-   Decreased `CHUNK_SIZE` 4096->1024 and increased default max chunks 10->20
-   Export `StatusError`, `PrecheckStatusError`, `ReceiptStatusError`, and `BadKeyError`
-   `KeyList.toString()`
-   `AccountBalance.toString()`

### Deprecated

-   `new TransactionId(AccountId, Instant)` - Use `TransactionId.withValidStart()` instead.

## v2.0.18 - Deprecated

## v2.0.17-beta.7

### Fixed

-   addSignature() Behavior Differs Between Implementations [NCC-E001154-005]
-   Decreased `CHUNK_SIZE` 4096->1024 and increased default max chunks 10->20
-   Renamed `ScheduleInfo.getTransaction()` -> `ScheduleInfo.getScheduledTransaction()`

## v2.0.17-beta.6

### Added

-   React Native support

## v2.0.17-beta.5 - Deprecated

## v2.0.17-beta.4

### Fixed

-   Scheduled transactions should use new HAPI protobufs
-   Removed `nonce` from `TransactionId`
-   `schedule-multi-sig-transaction` example to use new scheduled transaction API

### Removed

-   `ScheduleCreateTransaction.addScheduledSignature()`
-   `ScheduleCreateTransaction.scheduledSignatures()`
-   `ScheduleSignTransaction.addScheduledSignature()`
-   `ScheduleSignTransaction.scheduledSignatures()`

## v2.0.17-beta.3

### Added

-   Support for raw `proto.Transaction` bytes in `Transaction.fromBytes()`
    -   This means v1 SDK's `Transaction.toBytes()` will now be supported in v2 `Transaction.fromBytes()`
        However, `Transaction.toBytes()` and `Transaction.getTransactionHas()` in v2 will produce different
        results in the v1 SDK's.
-   Export `StatusError`, `PrecheckStatusError`, `ReceiptStatusError`, and `BadKeyError`

### Fixed

-   A few examples that did not work with `CONFIG_FILE` environment variable

## v2.0.17-beta.2

### Added

-   Support for setting signatures on the underlying scheduled transaction
-   `TransactionReceipt.scheduledTransactionId`
-   `ScheduleInfo.scheduledTransactionId`
-   `TransactionRecord.scheduleRef`
-   Support for scheduled and nonce in `TransactionId`
    -   `TransactionId.withNonce()` - Supports creating transaction ID with random bytes.
    -   `TransactionId.[set|get]Scheduled()` - Supports scheduled transaction IDs.
-   `memo` fields for both create and update transactions and info queries
    -   `Account[Create|Update]Transaction.[set|get]AccountMemo()`
    -   `File[Create|Update]Transaction.[set|get]AccountMemo()`
    -   `Token[Create|Update]Transaction.[set|get]AccountMemo()`
    -   `AccountInfoQuery.accountMemo`
    -   `FileInfoQuery.fileMemo`
    -   `TokenInfoQuery.tokenMemo`

### Fixed

-   `ScheduleInfo.*ID` field names should use `Id`
    Ex. `ScheduleInfo.creatorAccountID` -> `ScheduleInfo.creatorAccountId`
-   Renamed `ScheduleInfo.memo` -> `ScheduleInfo.scheduleMemo`
-   Chunked transactions should not support scheduling if the data provided is too large
    -   `TopicMessageSubmitTransaction`
    -   `FileAppendTransaction`

## v2.0.17-beta.1

### Added

-   Support for scheduled transactions.
    -   `ScheduleCreateTransaction` - Create a new scheduled transaction
    -   `ScheduleSignTransaction` - Sign an existing scheduled transaction on the network
    -   `ScheduleDeleteTransaction` - Delete a scheduled transaction
    -   `ScheduleInfoQuery` - Query the info including `bodyBytes` of a scheduled transaction
    -   `ScheduleId`

### Fixed

-   `KeyList.toString()`
-   `AccountBalance.toString()`

### Deprecated

-   `new TransactionId(AccountId, Instant)` - Use `TransactionId.withValidStart()` instead.

## v2.0.15

### Added

-   Implement `Client.forName()` to support construction of client from network name.
-   Implement `PrivateKey.verifyTransaction()` to allow a user to verify a transaction was signed with a partiular key.

## v2.0.14

### General Changes

    * All queries and transactions support setting fields in the constructor using
      an object, e.g. `new AccountBalanceQuery({ accountId: "0.0.3" })`, or
      `new AccountCreateTransaction({ key: client.operatorPublicKey, initialBalance: 10 })`.
    * Almost all instances of `BigNumber` have been replaced with `Long`

## v1.1.12

### Fixed

-   `Ed25519PrivateKey.fromMnemonic` regressed in v1.1.8 and was not working in the browser.

-   Use detached signatures when signing the transaction. This should allow for much larger transactions to be submitted.

## v1.1.11

### Fixed

-   `Ed25519PrivateKey.fromKeystore` regressed in v1.1.9 and was not working in the browser

## v1.1.10

### Added

-   `Client.ping(id: AccountIdLike)` Pings a node by account ID.

-   `Ed25519PrivateKey.fromMnemonic` works with legacy 22-word phrases.

### Deprecated

-   `Client.getAccountBalance()` to match the Java SDK. Use `AccountBalanceQuery` directly instead.

## v1.1.9

### Added

-   Allow BigNumber or String to be used as Tinybar where Tinybar was accepted

-   Add support for decoding `Ed25519PrivateKey` from a PEM file using `Ed25519PrivateKey.fromPem()`

-   Add support for passing no argument to `ContractFunctionResult.get*()` methods.

-   Add `MnemonicValidationResult` which is the response type for `Mnemonic.validte()`

-   Add public method `Mnemonic.validate(): MnemonicValidationResult` which validates if the mnemonic
    came from the same wordlist, in the right order, and without misspellings.

-   Add `BadPemFileError` which is thrown when decoding a pem file fails.

### Fixed

-   Fixes `AddBytes32Array`

-   Fixes `Hbar.isNegative()` failing with `undefined`.

-   Fixes `CryptoTransferTransaction.addTransfer()` not supporting `BigNumber` or
    `number` as arguments.

-   Fixes `ConsensusTopicInfoQuery.setTopicId()` not supporting `ConsensusTopicIdLike`.

### Deprecated

-   Deprecates `Client.maxTransactionFee` and `Client.maxQueryPayment` getters.

-   Deprecates `ConsensusTopicCreateTransaction.setAutoRenewAccount()` was simply
    renamed to `ConsensusTopicCreateTransaction.setAutoRenewAccountId()`.

-   Deprecates `ConsensusTopicCreateTransaction.setExpirationTime()` with no replacement.

-   Deprecates `ConsensusTopicCreateTransaction.setValidStart()` with no replacement.

-   Deprecates `ConsensusTopicUpdateTransaction.setAutoRenewAccount()` with no replacement.

## v1.1.8

### Fixed

-   `TransactionRecord.getContractCallResult` and `TransactionRecord.getContractExecuteResult` were swapped
    internally and neither worked before.

-   Export `ConsensusMessageSubmitTransaction`.

## v1.1.7

### Fixed

-   Do not provide (and sign) a payment transaction for `AccountBalanceQuery`. It is not required.

## v1.1.6

### Added

-   Add `TransactionBuilder.getCost()` to return a very close estimate of the transaction fee (within 1%).

-   Add additional error classes to allow more introspection on errors:

    -   `HederaPrecheckStatusError` - Thrown when the transaction fails at the node (the precheck)
    -   `HederaReceiptStatusError` - Thrown when the receipt is checked and has a failing status. The error object contains the full receipt.
    -   `HederaRecordStatusError` - Thrown when the record is checked and it has a failing status. The error object contains the full record.

-   `console.log(obj)` now prints out nice debug information for several types in the SDK including receipts

## v1.1.5

### Added

-   Add `TransactionReceipt.getConsensusTopicId()`.

-   Add `TransactionReceipt.getConsensusTopicRunningHash()`.

-   Add `TransactionReceipt.getConsensusTopicSequenceNumber()`.

-   Adds support for addresses with a leading `0x` prefix with `ContractFunctionParams.addAddress()`.

### Deprecated

-   Deprecates `Client.putNode()`. Use `Client.replaceNodes()` instead.

-   Depreactes `Transaction.getReceipt()` and `Transaction.getRecord()`. Use `TransactionId.getReceipt()` or
    `TransactionId.getRecord()` instead. The `execute` method on `Transaction` returns a `TransactionId`.

-   Deprecates `ConsensusSubmitMessageTransaction`. This was renamed to `ConsensusMessageSubmitTransaction` to
    match the Java SDK.

## v1.1.2

### Fixed

-   https://github.com/hashgraph/hedera-sdk-js/issues/175

## v1.1.1

### Fixed

-   `RECEIPT_NOT_FOUND` is properly considered and internally retried within `TransactionReceiptQuery`

## v1.1.0

### Fixed

-   Contract parameter encoding with BigNumbers

### Added

Add support for Hedera Consensus Service (HCS).

-   Add `ConsensusTopicCreateTransaction`, `ConsensusTopicUpdateTransaction`, `ConsensusTopicDeleteTransaction`, and `ConsensusMessageSubmitTransaction` transactions

-   Add `ConsensusTopicInfoQuery` query (returns `ConsensusTopicInfo`)

-   Add `MirrorClient` and `MirrorConsensusTopicQuery` which can be used to listen for HCS messages from a mirror node.

### Changed

Minor version bumps may add deprecations as we improve parity between SDKs
or fix reported issues. Do not worry about upgrading in a timely manner. All v1+ APIs
will be continuously supported.

-   Deprecated `SystemDelete#setId`; replaced with `SystemDelete#setFileId` or `SystemDelete#setContractId`

-   Deprecated `SystemUndelete#setId`; replaced with `SystemUndelete#setFileId` or `SystemUndelete#setContractId`

-   Deprecated `Hbar.of(val)`; replaced with `new Hbar(val)`

-   Deprecated `FreezeTransaction#setStartTime(Date)`; replaced with `FreezeTransaction#setStartTime(hour: number, minute: number)`

-   Deprecated `FreezeTransaction#setEndTime(Date)`; replaced with `FreezeTransaction#setEndTime(hour: number, minute: number)`

-   All previous exception types are no longer thrown. Instead there are a set of new exception types to match the Java SDK.

    -   `HederaError` becomes `HederaStatusError`
    -   `ValidationError` becomes `LocalValidationError`
    -   `TinybarValueError` becomes `HbarRangeError`
    -   `MaxPaymentExceededError` becomes `MaxQueryPaymentExceededError`
    -   `BadKeyError` is a new exception type when attempting to parse or otherwise use a key that doesn't look like a key

## v1.0.1

### Added

-   Allow passing a string for a private key in `Client.setOperator`

### Fixed

-   Correct list of testnet node addresses

## v1.0.0

No significant changes since v1.0.0-beta.5

## v1.0.0-beta.5

### Fixed

-   Fix `getCost` for entity Info queries where the entity was deleted

### Added

-   Add support for unsigned integers (incl. Arrays) for contract encoding and decoding

-   Add `AccountUpdateTransaction.setReceiverSignatureRequired`

-   Add `AccountUpdateTransaction.setProxyAccountId`

### Changed

-   Rename `ContractExecuteTransaction.setAmount()` to `ContractExecuteTransaction.setPayableAmount()`

## v1.0.0-beta.4

### Added

-   `Client.forTestnet` makes a new client configured to talk to TestNet (use `.setOperator` to set an operater)

-   `Client.forMainnet` makes a new client configured to talk to Mainnet (use `.setOperator` to set an operater)

### Changed

-   Renamed `TransactionReceipt.accountId`, `TransactionReceipt.contractId`, `TransactionReceipt.fileId`, and
    `TransactionReceipt.contractId` to `TransactionReceipt.getAccountId()`, etc. to add an explicit illegal
    state check as these fields are mutually exclusive

-   Renamed `TransactionRecord.contractCallResult` to `TransactionRecord.getContractExecuteResult()`

-   Renamed `TransactionRecord.contractCreateResult` to `TransactionRecord.getContractCreateResult()`

## v1.0.0-beta.3

### Changed

-   `TransactionBuilder.setMemo` is renamed to `TransactionBuilder.setTransactionMemo` to avoid confusion
    as there are 2 other kinds of memos on transactions

### Fixed

-   Fix usage on Node versions less than 12.x

## v1.0.0-beta.2

### Changed

-   `CallParams` is removed in favor of `ContractFunctionParams` and closely mirrors type names from solidity

    -   `addInt32`
    -   `addInt256Array`
    -   `addString`
    -   etc.

-   `ContractFunctionResult` now closely mirrors the solidity type names

    -   `getInt32`
    -   etc.

-   `setFunctionParams(params)` on `ContractCallQuery` and `ContractExecuteTransaction` is now
    `setFunction(name, params)`

-   `ContractLogInfo.topicList` -> `ContractLogInfo.topics`

-   `FileInfo.deleted` -> `FileInfo.isDeleted`

-   `FileContentsQuery.execute` now directly returns `Uint8Array`

-   `ContractRecordsQuery.execute` now directly returns `TransactionRecord[]`

-   `AccountAmount.amount` (`String`) -> `AccountAmount.amount` (`Hbar`)

-   TransactionReceipt
    -   `receiverSigRequired` -> `isReceiverSignatureRequired`
    -   `autoRenewPeriodSeconds` -> `autoRenewPeriod`

### Fixed

-   Remove incorrect local validation for FileCreateTransaction and FileUpdateTransaction

-   Any `key` fields on response types (e.g., `AccountInfo`) are
    now `PublicKey` and can be any of the applicable key types

-   Fix transaction back-off when BUSY is returned

-   Default autoRenewPeriod on ContractCreate appropriately

## v0.8.0-beta.3

### Changed

-   Client constructor takes the network as `{ network: ... }` instead of `{ nodes: ... }`

-   Transactions and queries do not take `Client` in the constructor; instead, `Client` is passed to `execute`.

-   Removed `Transaction.executeForReceipt` and `Transaction.executeForRecord`

    These methods have been identified as harmful as they hide too much. If one fails, you do not know if the transaction failed to execute; or, the receipt/record could not be retrieved. In a mission-critical application, that is, of course, an important distinction.

    Now there is only `Transaction.execute` which returns a `TransactionId`. If you don't care about waiting for consensus or retrieving a receipt/record in your application, you're done. Otherwise you can now use any `TransactionId` and ask for the receipt/record (with a stepped retry interval until consensus) with `TransactionId.getReceipt` and `TransactionId.getRecord`.

    v0.7.x and below

    ```js
    let newAccountId = new AccountCreateTransaction(hederaClient)
        .setKey(newKey.publicKey)
        .setInitialBalance(1000)
        .executeForReceipt().accountId; // TransactionReceipt
    ```

    v0.8.x and above

    ```js
    let newAccountId = new AccountCreateTransaction()
        .setKey(newKey.publicKey)
        .setInitialBalance(1000)
        .execute(hederaClient) // TranactionId
        .getReceipt(hederaClient).accountId; // TransactionReceipt
    ```

-   Rename `setPaymentDefault` to `setPaymentAmount`

### Added

-   All transaction and query types that were in the Java SDK but not yet in the JS SDK (GetBySolidityIdQuery, AccountStakersQuery, etc.)

-   `TransactionId.getReceipt`

-   `TransactionId.getRecord`

-   `Transaction.toString`. This will dump the transaction (incl. the body) to a stringified JSON object representation of the transaction. Useful for debugging.

-   A default of 1 Hbar is now set for both maximum transaction fees and maximum query payments.

-   Smart Contract type encoding and decoding to match Java.

-   To/From string methods on AccountId, FileId, etc.

-   Internal retry handling for Transactions and Queries (incl. BUSY)

### Removed

-   `Transaction` and `Query` types related to claims
