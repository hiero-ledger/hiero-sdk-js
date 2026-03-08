#!/usr/bin/env node

import fs from "node:fs/promises";
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
    ENV_FILE,
    commandExists,
    soloInstalled,
    validateNumNodes,
    directoryExists,
    clusterExists,
    localConfigContains,
    killPortForwardProcesses,
    createNodeIdList,
    createTestAccount,
    generateEnvFile,
    setupPortForwarding,
    sleep,
    runCommand,
    log,
} from "./solo-lib.js";

function showHelp() {
    console.log("Usage: ./scripts/setup-solo.js [options]");
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
        "  --clean-previous                     Full cleanup: delete cluster and Solo config (slower but complete)",
    );
    console.log(
        "  -h, --help                           Show this help message",
    );
    console.log("");
    console.log("Examples:");
    console.log(
        "  ./scripts/setup-solo.js                                    # Single node (default)",
    );
    console.log(
        "  ./scripts/setup-solo.js --num-nodes 2                      # Two nodes (for DAB tests)",
    );
    console.log("  ./scripts/setup-solo.js --consensus-node-version v0.70.0");
    console.log(
        "  ./scripts/setup-solo.js --num-nodes 2 --consensus-node-version v0.70.0 --mirror-node-version v0.146.0",
    );
    console.log(
        "  ./scripts/setup-solo.js --local-build-path ../hiero-consensus-node/hedera-node/data",
    );
    console.log(
        "  ./scripts/setup-solo.js --clean-previous                   # Full cleanup before setup (deletes cluster)",
    );
}

function parseArgs(argv) {
    let numNodes = DEFAULT_NUM_NODES;
    let consensusVersion = DEFAULT_CONSENSUS_NODE_VERSION;
    let mirrorVersion = DEFAULT_MIRROR_NODE_VERSION;
    let localBuildPath = "";
    let cleanPrevious = false;

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

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
            case "--clean-previous":
                cleanPrevious = true;
                break;
            case "-h":
            case "--help":
                showHelp();
                process.exit(0);
                break;
            default:
                throw new Error(
                    `Unknown option: ${argument}\nRun './scripts/setup-solo.js --help' for usage information`,
                );
        }
    }

    return {
        numNodes,
        consensusVersion,
        mirrorVersion,
        localBuildPath,
        cleanPrevious,
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

    if (!commandExists("npx")) {
        missingDependencies.push("npx");
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
                case "npx":
                    console.log(
                        "  - npx: comes with Node.js (npm install -g npx)",
                    );
                    break;
                default:
                    break;
            }
        }

        process.exit(1);
    }

    log.info("Checking if Solo is installed...");
    if (!(await soloInstalled())) {
        log.error("Solo is not installed as a project dependency");
        log.info(
            "Please run 'task install' or 'pnpm install' first to install project dependencies including Solo",
        );
        process.exit(1);
    }

    log.success("All dependencies are installed");
}

async function cleanupPrevious() {
    log.info("Cleaning up previous Solo state...");

    if (await clusterExists(SOLO_CLUSTER_NAME)) {
        log.info(`Deleting existing cluster: ${SOLO_CLUSTER_NAME}`);
        await runCommand(
            "kind",
            ["delete", "cluster", "--name", SOLO_CLUSTER_NAME],
            {
                allowFailure: true,
            },
        );
    }

    if (await directoryExists(SOLO_DIR)) {
        log.info("Removing ~/.solo directory");
        await fs.rm(SOLO_DIR, { recursive: true, force: true });
    }

    log.success("Cleanup complete");
}

async function softCleanupPrevious() {
    log.info(
        "Destroying previous Solo services (keeping cluster and images)...",
    );

    if (!(await clusterExists(SOLO_CLUSTER_NAME))) {
        log.info("No existing cluster found, skipping soft cleanup");
        return;
    }

    const stoppedPortForwarding =
        await killPortForwardProcesses(SOLO_NAMESPACE);
    if (stoppedPortForwarding) {
        log.info("Stopping port forwarding processes...");
        await sleep(2000);
    }

    log.info("Destroying mirror node...");
    const mirrorResult = await runCommand(
        "npx",
        [
            "solo",
            "mirror",
            "node",
            "destroy",
            "--deployment",
            SOLO_DEPLOYMENT,
            "--force",
            "--dev",
        ],
        { allowFailure: true },
    );

    if (mirrorResult.code === 0) {
        log.success("Mirror node destroyed");
    } else {
        log.info("Mirror node not found or already destroyed");
    }

    log.info("Destroying consensus network...");
    const networkResult = await runCommand(
        "npx",
        [
            "solo",
            "consensus",
            "network",
            "destroy",
            "--deployment",
            SOLO_DEPLOYMENT,
            "--force",
            "--dev",
        ],
        { allowFailure: true },
    );

    if (networkResult.code === 0) {
        log.success("Consensus network destroyed");
    } else {
        log.info("Consensus network not found or already destroyed");
    }

    log.success("Soft cleanup complete");
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
        await runCommand("npx", ["solo", "init"]);
        log.success("Solo initialized");
    }
}

async function setupDeployment(numNodes) {
    log.info("Setting up Solo deployment...");

    const deploymentList = await runCommand(
        "npx",
        ["solo", "deployment", "config", "list", "--dev"],
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
    await runCommand("npx", [
        "solo",
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
    await runCommand("npx", [
        "solo",
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
    await runCommand("npx", [
        "solo",
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
    await runCommand("npx", [
        "solo",
        "cluster-ref",
        "config",
        "setup",
        "--cluster-ref",
        SOLO_CLUSTER_NAME,
        "--dev",
    ]);

    log.success("Deployment setup complete");
}

async function deployNetwork({ numNodes, localBuildPath }) {
    const nodeIds = createNodeIdList(numNodes);

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
        await runCommand("npx", [
            "solo",
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
    await runCommand("npx", [
        "solo",
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
        await runCommand("npx", [
            "solo",
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
        await runCommand("npx", [
            "solo",
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
    await runCommand("npx", [
        "solo",
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
    await runCommand("npx", [
        "solo",
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
    const {
        numNodes,
        consensusVersion,
        mirrorVersion,
        localBuildPath,
        cleanPrevious,
    } = parseArgs(process.argv.slice(2));

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
    console.log("");

    await checkDependencies();

    let setupMode = "Fast restart";

    if (cleanPrevious) {
        await cleanupPrevious();
        setupMode = "Fresh install";
    } else {
        await softCleanupPrevious();

        if (await clusterExists(SOLO_CLUSTER_NAME)) {
            setupMode = "Fast restart (reusing cluster)";
        } else {
            setupMode = "Initial setup";
        }
    }

    log.info(`Setup mode: ${setupMode}`);
    console.log("");

    await initializeSolo();
    await setupDeployment(numNodes);
    await deployNetwork({ numNodes, localBuildPath });
    await deployMirror();
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
    log.success("Solo cluster setup complete!");
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
    log.info("To stop services (fast, keeps cluster/images):");
    log.info("  task solo:stop");
    console.log("");
    log.info("To restart quickly (soft cleanup):");
    log.info("  task solo:start");
    console.log("");
    log.info("To fully tear down the cluster:");
    log.info("  task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
