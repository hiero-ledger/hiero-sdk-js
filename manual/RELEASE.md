## Release process of JS SDK

- **Create** a new release branch following the naming convention for:
    - stable release - `release-v*.*.*`
    - beta release - `release-v*.*.*-beta.*`
- **Run** the [local node](https://github.com/hiero-ledger/hiero-local-node)
- **Run** `task test:integration:node`
- **Stop** the [local node](https://github.com/hiero-ledger/hiero-local-node)
- **Run** `task test:release` (Note: the local node should not be running)
- **Update** the SDK version in `package.json` file
- **Update** the CHANGELOG file
- **Merge** release branch into main
- **Create** a new tag as running following command for:
    - stable release - `git tag -a "v*.*.*" -m "[message]"`
    - beta release - `git tag -a "v*.*.*-beta.*" -m "[message]"`
- **Run** the following command for:
    - stable release - `git push origin v*.*.*`
    - beta release - `git push origin v*.*.*-beta.*`
- **Monitor** the [status](https://github.com/hiero-ledger/hiero-sdk-js/actions/workflows/publish_release.yaml) of this CI pipeline