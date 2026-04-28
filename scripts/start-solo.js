#!/usr/bin/env node

import {
    DEFAULT_CONSENSUS_NODE_VERSION,
    DEFAULT_MIRROR_NODE_VERSION,
    DEFAULT_HBAR_AMOUNT,
    SOLO_CLUSTER_NAME,
    SOLO_NAMESPACE,
    SOLO_DEPLOYMENT,
    SOLO_DIR,
    SOLO_LOCAL_CONFIG_PATH,
    ENV_FILE,
    commandExists,
    fileExists,
    directoryExists,
    localConfigContains,
    clusterExists,
    log,
    runCommand,
    runSoloCommand,
    SOLO_GLOBAL_INSTALL_COMMAND,
    createNodeIdList,
    setupPortForwarding,
    createTestAccount,
    generateEnvFile,
} from "./solo-lib.js";

function showHelp() {
    console.log("Usage: ./scripts/start-solo.js [options]");
    console.log("");
    console.log("Options:");
    console.log(
        `  --consensus-node-version <version>   Consensus node version (default: ${DEFAULT_CONSENSUS_NODE_VERSION})`,
    );
    console.log(
        `  --mirror-node-version <version>      Mirror node version (default: ${DEFAULT_MIRROR_NODE_VERSION})`,
    );
    console.log(
        "  --local-build-path <path>            Path to local build (overrides consensus-node-version)",
    );
    console.log(
        "  -h, --help                           Show this help message",
    );
    console.log("");
    console.log("Examples:");
    console.log("  ./scripts/start-solo.js");
    console.log("  ./scripts/start-solo.js --consensus-node-version v0.70.0");
    console.log(
        "  ./scripts/start-solo.js --local-build-path ../hiero-consensus-node/hedera-node/data",
    );
}

function parseArgs(argv) {
    let consensusVersion = DEFAULT_CONSENSUS_NODE_VERSION;
    let mirrorVersion = DEFAULT_MIRROR_NODE_VERSION;
    let localBuildPath = "";

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        switch (argument) {
            case "--consensus-node-version": {
                const value = argv[index + 1];
                if (!value) {
                    throw new Error(
                        "Missing value for --consensus-node-version",
                    );
                }
                consensusVersion = value;
                index += 1;
                break;
            }
            case "--mirror-node-version": {
                const value = argv[index + 1];
                if (!value) {
                    throw new Error("Missing value for --mirror-node-version");
                }
                mirrorVersion = value;
                index += 1;
                break;
            }
            case "--local-build-path": {
                const value = argv[index + 1];
                if (!value) {
                    throw new Error("Missing value for --local-build-path");
                }
                localBuildPath = value;
                index += 1;
                break;
            }
            case "-h":
            case "--help":
                showHelp();
                process.exit(0);
                break;
            default:
                throw new Error(
                    `Unknown option: ${argument}\nRun './scripts/start-solo.js --help' for usage information`,
                );
        }
    }

    return {
        consensusVersion,
        mirrorVersion,
        localBuildPath,
    };
}

function setEnvironment({ consensusVersion, mirrorVersion, localBuildPath }) {
    process.env.SOLO_CLUSTER_NAME = SOLO_CLUSTER_NAME;
    process.env.SOLO_NAMESPACE = SOLO_NAMESPACE;
    process.env.SOLO_DEPLOYMENT = SOLO_DEPLOYMENT;
    process.env.MIRROR_NODE_VERSION = mirrorVersion;

    if (localBuildPath) {
        delete process.env.CONSENSUS_NODE_VERSION;
    } else {
        process.env.CONSENSUS_NODE_VERSION = consensusVersion;
    }
}

async function checkPrerequisites() {
    if (!commandExists("solo")) {
        log.error("Solo CLI is not available globally");
        log.info(`Please run '${SOLO_GLOBAL_INSTALL_COMMAND}' and try again`);
        process.exit(1);
    }

    log.info("Checking prerequisites...");

    if (!(await clusterExists(SOLO_CLUSTER_NAME))) {
        log.error(`Kind cluster '${SOLO_CLUSTER_NAME}' not found`);
        log.info(
            "Please run 'task solo:setup' first to create the cluster and deployment",
        );
        process.exit(1);
    }

    if (!(await directoryExists(SOLO_DIR))) {
        log.error("Solo not initialized");
        log.info("Please run 'task solo:setup' first");
        process.exit(1);
    }

    const localConfigExists = await fileExists(SOLO_LOCAL_CONFIG_PATH);
    const hasClusterRef = await localConfigContains(`${SOLO_CLUSTER_NAME}:`);

    if (!localConfigExists || !hasClusterRef) {
        log.error(`Cluster reference '${SOLO_CLUSTER_NAME}' not found`);
        log.info("Please run 'task solo:setup' first");
        process.exit(1);
    }

    log.success("Prerequisites met");
}

async function getNumNodes() {
    const podsResult = await runCommand(
        "kubectl",
        ["get", "pods", "-n", SOLO_NAMESPACE],
        { allowFailure: true, captureOutput: true },
    );

    if (podsResult.code === 0 && podsResult.stdout.includes("network-node2")) {
        return 2;
    }

    return 1;
}

async function deployNetwork(localBuildPath) {
    const numNodes = await getNumNodes();
    const nodeIds = createNodeIdList(numNodes);

    const remoteConfigResult = await runCommand(
        "kubectl",
        ["get", "configmap", "solo-remote-config", "-n", SOLO_NAMESPACE],
        { allowFailure: true },
    );

    if (remoteConfigResult.code !== 0) {
        log.warning("Deployment configuration missing, recreating...");

        if (await localConfigContains(`name: ${SOLO_DEPLOYMENT}`)) {
            log.info("Removing stale deployment from local config...");
            await runSoloCommand(
                [
                    "deployment",
                    "config",
                    "delete",
                    "--deployment",
                    SOLO_DEPLOYMENT,
                    "--dev",
                ],
                { allowFailure: true },
            );
        }

        log.info("Reconnecting to cluster...");
        await runSoloCommand([
            "cluster-ref",
            "config",
            "connect",
            "--cluster-ref",
            SOLO_CLUSTER_NAME,
            "--context",
            `kind-${SOLO_CLUSTER_NAME}`,
            "--dev",
        ]);

        log.info(`Creating deployment: ${SOLO_DEPLOYMENT}...`);
        await runSoloCommand([
            "deployment",
            "config",
            "create",
            "--deployment",
            SOLO_DEPLOYMENT,
            "--namespace",
            SOLO_NAMESPACE,
            "--dev",
        ]);

        log.info(`Attaching cluster to deployment (${numNodes} node(s))...`);
        await runSoloCommand([
            "deployment",
            "cluster",
            "attach",
            "--deployment",
            SOLO_DEPLOYMENT,
            "--cluster-ref",
            SOLO_CLUSTER_NAME,
            "--num-consensus-nodes",
            String(numNodes),
            "--dev",
        ]);

        log.info("Setting up cluster...");
        await runSoloCommand([
            "cluster-ref",
            "config",
            "setup",
            "--cluster-ref",
            SOLO_CLUSTER_NAME,
            "--dev",
        ]);

        log.success("Deployment configuration recreated");
    }

    log.info("Checking consensus keys...");
    const secretResult = await runCommand(
        "kubectl",
        ["get", "secret", "-n", SOLO_NAMESPACE],
        { allowFailure: true, captureOutput: true },
    );

    if (/node1-.*-key/u.test(secretResult.stdout)) {
        log.info("Consensus keys already exist, skipping key generation");
    } else {
        log.info("Generating consensus keys...");
        await runSoloCommand([
            "keys",
            "consensus",
            "generate",
            "--gossip-keys",
            "--tls-keys",
            "--deployment",
            SOLO_DEPLOYMENT,
            "--dev",
        ]);
    }

    log.info(
        `Deploying consensus network (${numNodes} node(s): ${nodeIds})...`,
    );
    await runSoloCommand([
        "consensus",
        "network",
        "deploy",
        "--deployment",
        SOLO_DEPLOYMENT,
        "-i",
        nodeIds,
        "--dev",
    ]);

    log.info("Setting up consensus nodes...");
    if (localBuildPath) {
        log.info(`Using local build path: ${localBuildPath}`);
        await runSoloCommand([
            "consensus",
            "node",
            "setup",
            "--deployment",
            SOLO_DEPLOYMENT,
            "-i",
            nodeIds,
            "--local-build-path",
            localBuildPath,
            "--dev",
        ]);
    } else {
        log.info(
            `Using consensus node version: ${process.env.CONSENSUS_NODE_VERSION}`,
        );
        await runSoloCommand([
            "consensus",
            "node",
            "setup",
            "--deployment",
            SOLO_DEPLOYMENT,
            "-i",
            nodeIds,
            "--dev",
        ]);
    }

    log.info("Starting consensus nodes...");
    await runSoloCommand([
        "consensus",
        "node",
        "start",
        "--deployment",
        SOLO_DEPLOYMENT,
        "-i",
        nodeIds,
        "--dev",
    ]);

    log.success("Network deployed and started");
}

async function deployMirror() {
    log.info("Deploying mirror node services...");
    await runSoloCommand([
        "mirror",
        "node",
        "add",
        "--deployment",
        SOLO_DEPLOYMENT,
        "--cluster-ref",
        SOLO_CLUSTER_NAME,
        "--pinger",
        "--dev",
    ]);

    log.success("Mirror node deployed");
}

async function main() {
    const { consensusVersion, mirrorVersion, localBuildPath } = parseArgs(
        process.argv.slice(2),
    );

    setEnvironment({ consensusVersion, mirrorVersion, localBuildPath });

    log.info("======================================");
    log.info("Solo Services Start");
    log.info("======================================");
    console.log("");
    log.info("Configuration:");
    if (localBuildPath) {
        log.info(`  - Using local build: ${localBuildPath}`);
    } else {
        log.info(
            `  - Consensus Node Version: ${process.env.CONSENSUS_NODE_VERSION}`,
        );
    }
    log.info(`  - Mirror Node Version: ${process.env.MIRROR_NODE_VERSION}`);
    console.log("");

    await checkPrerequisites();
    await deployNetwork(localBuildPath);
    await deployMirror();

    const numNodes = await getNumNodes();
    await setupPortForwarding({
        numNodes,
        namespace: SOLO_NAMESPACE,
        logger: log,
    });

    const account = await createTestAccount({
        deployment: SOLO_DEPLOYMENT,
        namespace: SOLO_NAMESPACE,
        hbarAmount: DEFAULT_HBAR_AMOUNT,
        logger: log,
    });

    await generateEnvFile({
        envFilePath: ENV_FILE,
        operatorId: account.accountId,
        operatorKey: account.accountPrivateKey,
        logger: log,
    });

    console.log("");
    log.success("======================================");
    log.success("Solo services started!");
    log.success("======================================");
    console.log("");
    log.info("Your local Hiero network is now running");
    log.info(`Test account: ${account.accountId}`);
    console.log("");
    log.info("To pause services: task solo:pause");
    log.info("To resume:         task solo:resume");
    log.info("To teardown:      task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
