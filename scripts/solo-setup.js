#!/usr/bin/env node

import {
    DEFAULT_CONSENSUS_NODE_VERSION,
    DEFAULT_MIRROR_NODE_VERSION,
    DEFAULT_NUM_NODES,
    DEFAULT_HBAR_AMOUNT,
    SOLO_CLUSTER_NAME,
    SOLO_NAMESPACE,
    SOLO_CLUSTER_SETUP_NAMESPACE,
    SOLO_DEPLOYMENT,
    SOLO_DIR,
    SOLO_GLOBAL_INSTALL_COMMAND,
    ENV_FILE,
    commandExists,
    soloInstalled,
    validateNumNodes,
    directoryExists,
    clusterExists,
    localConfigContains,
    createNodeIdList,
    createTestAccount,
    generateEnvFile,
    setupPortForwarding,
    runCommand,
    runSoloCommand,
    log,
} from "./solo-lib.js";

const kubeContext = `kind-${SOLO_CLUSTER_NAME}`;

function showHelp() {
    console.log("Usage: ./scripts/solo-setup.js [options]");
    console.log("");
    console.log("Options:");
    console.log(
        `  --num-nodes <number>                 Number of consensus nodes (default: ${DEFAULT_NUM_NODES})`,
    );
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
    console.log(
        "  ./scripts/solo-setup.js                                    # Single node (default)",
    );
    console.log(
        "  ./scripts/solo-setup.js --num-nodes 2                      # Two nodes (for DAB tests)",
    );
    console.log("  ./scripts/solo-setup.js --consensus-node-version v0.70.0");
    console.log(
        "  ./scripts/solo-setup.js --num-nodes 2 --consensus-node-version v0.70.0 --mirror-node-version v0.146.0",
    );
    console.log(
        "  ./scripts/solo-setup.js --local-build-path ../hiero-consensus-node/hedera-node/data",
    );
}

function parseArgs(argv) {
    let numNodes = DEFAULT_NUM_NODES;
    let consensusVersion = DEFAULT_CONSENSUS_NODE_VERSION;
    let mirrorVersion = DEFAULT_MIRROR_NODE_VERSION;
    let localBuildPath = "";

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (argument.startsWith("--num-nodes=")) {
            const value = argument.slice("--num-nodes=".length);
            if (!value) {
                throw new Error("Missing value for --num-nodes");
            }
            numNodes = validateNumNodes(value);
            continue;
        }

        if (argument.startsWith("--consensus-node-version=")) {
            const value = argument.slice("--consensus-node-version=".length);
            if (!value) {
                throw new Error("Missing value for --consensus-node-version");
            }
            consensusVersion = value;
            continue;
        }

        if (argument.startsWith("--mirror-node-version=")) {
            const value = argument.slice("--mirror-node-version=".length);
            if (!value) {
                throw new Error("Missing value for --mirror-node-version");
            }
            mirrorVersion = value;
            continue;
        }

        if (argument.startsWith("--local-build-path=")) {
            const value = argument.slice("--local-build-path=".length);
            if (!value) {
                throw new Error("Missing value for --local-build-path");
            }
            localBuildPath = value;
            continue;
        }

        switch (argument) {
            case "--num-nodes": {
                const value = argv[index + 1];
                if (!value) {
                    throw new Error("Missing value for --num-nodes");
                }
                numNodes = validateNumNodes(value);
                index += 1;
                break;
            }
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
                    `Unknown option: ${argument}\nRun './scripts/solo-setup.js --help' for usage information`,
                );
        }
    }

    return {
        numNodes,
        consensusVersion,
        mirrorVersion,
        localBuildPath,
    };
}

function setEnvironment({ consensusVersion, mirrorVersion, localBuildPath }) {
    process.env.SOLO_CLUSTER_NAME = SOLO_CLUSTER_NAME;
    process.env.SOLO_NAMESPACE = SOLO_NAMESPACE;
    process.env.SOLO_CLUSTER_SETUP_NAMESPACE = SOLO_CLUSTER_SETUP_NAMESPACE;
    process.env.SOLO_DEPLOYMENT = SOLO_DEPLOYMENT;
    process.env.MIRROR_NODE_VERSION = mirrorVersion;

    if (localBuildPath) {
        delete process.env.CONSENSUS_NODE_VERSION;
    } else {
        process.env.CONSENSUS_NODE_VERSION = consensusVersion;
    }
}

async function checkDependencies() {
    log.info("Checking dependencies...");

    const missingDependencies = [];

    if (!commandExists("kind")) {
        missingDependencies.push("kind");
    }

    if (!commandExists("kubectl")) {
        missingDependencies.push("kubectl");
    }

    if (!commandExists("solo")) {
        missingDependencies.push("solo");
    }

    if (missingDependencies.length > 0) {
        log.error(
            `Missing required dependencies: ${missingDependencies.join(" ")}`,
        );
        log.info("Please install:");

        for (const dependency of missingDependencies) {
            switch (dependency) {
                case "kind":
                    console.log(
                        "  - kind: https://kind.sigs.k8s.io/docs/user/quick-start/#installation",
                    );
                    break;
                case "kubectl":
                    console.log(
                        "  - kubectl: https://kubernetes.io/docs/tasks/tools/",
                    );
                    break;
                case "solo":
                    console.log(`  - solo: ${SOLO_GLOBAL_INSTALL_COMMAND}`);
                    break;
                default:
                    break;
            }
        }

        process.exit(1);
    }

    log.info("Checking if Solo is installed...");
    if (!(await soloInstalled())) {
        log.error("Solo CLI is not available globally");
        log.info(`Please run '${SOLO_GLOBAL_INSTALL_COMMAND}' and try again`);
        process.exit(1);
    }

    log.success("All dependencies are installed");
}

async function initializeSolo() {
    if (await clusterExists(SOLO_CLUSTER_NAME)) {
        log.info("Kind cluster already exists, skipping creation");
    } else {
        log.info(`Creating Kind cluster: ${SOLO_CLUSTER_NAME}...`);
        await runCommand("kind", [
            "create",
            "cluster",
            "-n",
            SOLO_CLUSTER_NAME,
        ]);
        log.success("Cluster created");
    }

    if (await directoryExists(SOLO_DIR)) {
        log.info("Solo already initialized, skipping initialization");
    } else {
        log.info("Initializing Solo...");
        await runSoloCommand(["init"]);
        log.success("Solo initialized");
    }
}

async function setupDeployment(numNodes) {
    log.info("Setting up Solo deployment...");

    const deploymentList = await runSoloCommand(
        ["deployment", "config", "list", "--dev"],
        { allowFailure: true, captureOutput: true },
    );

    if (
        deploymentList.code === 0 &&
        deploymentList.stdout.includes(SOLO_DEPLOYMENT)
    ) {
        log.info(
            `Deployment '${SOLO_DEPLOYMENT}' already exists, skipping deployment setup`,
        );
        return;
    }

    log.info("Connecting to cluster...");
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

    log.success("Deployment setup complete");
}

async function ensureDeploymentConfig(numNodes) {
    const remoteConfigResult = await runCommand(
        "kubectl",
        [
            "--context",
            kubeContext,
            "get",
            "configmap",
            "solo-remote-config",
            "-n",
            SOLO_NAMESPACE,
        ],
        { allowFailure: true },
    );

    if (remoteConfigResult.code === 0) {
        return;
    }

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

    await setupDeployment(numNodes);
}

async function deployNetwork({ numNodes, localBuildPath }) {
    await ensureDeploymentConfig(numNodes);

    const nodeIds = createNodeIdList(numNodes);

    log.info("Checking consensus keys...");
    const secretResult = await runCommand(
        "kubectl",
        ["--context", kubeContext, "get", "secret", "-n", SOLO_NAMESPACE],
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
    const { numNodes, consensusVersion, mirrorVersion, localBuildPath } =
        parseArgs(process.argv.slice(2));

    setEnvironment({ consensusVersion, mirrorVersion, localBuildPath });

    log.info("======================================");
    log.info("Solo Setup for hiero-sdk-js");
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
    log.info(`  - Consensus Nodes: ${numNodes}`);
    console.log("");

    await checkDependencies();
    await initializeSolo();
    await setupDeployment(numNodes);
    await deployNetwork({ numNodes, localBuildPath });
    await deployMirror();
    await setupPortForwarding({
        numNodes,
        namespace: SOLO_NAMESPACE,
        kubeContext,
        logger: log,
    });

    const account = await createTestAccount({
        deployment: SOLO_DEPLOYMENT,
        namespace: SOLO_NAMESPACE,
        kubeContext,
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
    log.success("Solo setup complete!");
    log.success("======================================");
    console.log("");
    log.info("Your local Hiero network is now running with:");
    if (localBuildPath) {
        log.info(`  - Local build from: ${localBuildPath}`);
    } else {
        log.info(
            `  - Consensus Node Version: ${process.env.CONSENSUS_NODE_VERSION}`,
        );
    }
    log.info(`  - Mirror Node Version: ${process.env.MIRROR_NODE_VERSION}`);
    log.info(`  - ${numNodes} consensus node(s)`);
    log.info("  - Mirror node services");
    log.info(`  - Dedicated ECDSA test account: ${account.accountId}`);
    console.log("");
    log.info(`Environment variables have been written to: ${ENV_FILE}`);
    console.log("");
    log.info("To run integration tests:");
    log.info("  npm run test:integration");
    console.log("");
    log.info("To pause services:");
    log.info("  task solo:pause");
    console.log("");
    log.info("To resume services:");
    log.info("  task solo:resume");
    console.log("");
    log.info("To fully tear down the cluster:");
    log.info("  task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
