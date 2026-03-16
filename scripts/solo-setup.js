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
        "  --mirror-node-chart-dir <path>       Mirror node local chart directory path (omits --mirror-node-version when present)",
    );
    console.log(
        "  --local-build-path <path>            Path to local build (overrides consensus-node-version for node setup)",
    );
    console.log(
        "  --block-node-release-tag <version>   Optional block node Helm chart version (maps to --chart-version)",
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
    console.log(
        "  ./scripts/solo-setup.js --mirror-node-chart-dir ~/hiero-mirror-node/charts",
    );
    console.log(
        "  ./scripts/solo-setup.js --consensus-node-version v0.70.0 --block-node-release-tag v0.18.0",
    );
}

function parseArgs(argv) {
    let numNodes = DEFAULT_NUM_NODES;
    let consensusVersion = DEFAULT_CONSENSUS_NODE_VERSION;
    let mirrorVersion = DEFAULT_MIRROR_NODE_VERSION;
    let mirrorNodeChartDir = "";
    let localBuildPath = "";
    let blockNodeReleaseTag = process.env.BLOCK_NODE_RELEASE_TAG || "";

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

        if (argument.startsWith("--mirror-node-chart-dir=")) {
            const value = argument.slice("--mirror-node-chart-dir=".length);
            if (!value) {
                throw new Error("Missing value for --mirror-node-chart-dir");
            }
            mirrorNodeChartDir = value;
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

        if (argument.startsWith("--block-node-release-tag=")) {
            const value = argument.slice("--block-node-release-tag=".length);
            if (!value) {
                throw new Error("Missing value for --block-node-release-tag");
            }
            blockNodeReleaseTag = value;
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
            case "--mirror-node-chart-dir": {
                const value = argv[index + 1];
                if (!value) {
                    throw new Error(
                        "Missing value for --mirror-node-chart-dir",
                    );
                }
                mirrorNodeChartDir = value;
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
            case "--block-node-release-tag": {
                const value = argv[index + 1];
                if (!value) {
                    throw new Error(
                        "Missing value for --block-node-release-tag",
                    );
                }
                blockNodeReleaseTag = value;
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
        mirrorNodeChartDir,
        localBuildPath,
        blockNodeReleaseTag,
    };
}

function setEnvironment({
    consensusVersion,
    mirrorVersion,
    mirrorNodeChartDir,
    blockNodeReleaseTag,
}) {
    process.env.SOLO_CLUSTER_NAME = SOLO_CLUSTER_NAME;
    process.env.SOLO_NAMESPACE = SOLO_NAMESPACE;
    process.env.SOLO_CLUSTER_SETUP_NAMESPACE = SOLO_CLUSTER_SETUP_NAMESPACE;
    process.env.SOLO_DEPLOYMENT = SOLO_DEPLOYMENT;
    if (mirrorNodeChartDir) {
        delete process.env.MIRROR_NODE_VERSION;
    } else {
        process.env.MIRROR_NODE_VERSION = mirrorVersion;
    }
    if (blockNodeReleaseTag) {
        process.env.BLOCK_NODE_RELEASE_TAG = blockNodeReleaseTag;
    }
    process.env.CONSENSUS_NODE_VERSION = consensusVersion;
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
        await runCommand(
            "npx",
            [
                "solo",
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

async function deployBlockNode({
    consensusVersion,
    localBuildPath,
    blockNodeReleaseTag,
}) {
    const blockNodeArgs = [
        "solo",
        "block",
        "node",
        "add",
        "--deployment",
        SOLO_DEPLOYMENT,
        "--cluster-ref",
        SOLO_CLUSTER_NAME,
    ];

    if (!localBuildPath) {
        blockNodeArgs.push("--release-tag", consensusVersion);
        log.info(`Deploying block node (release tag: ${consensusVersion})...`);
    } else {
        log.info(
            "Deploying block node (release tag omitted for local build)...",
        );
    }

    if (blockNodeReleaseTag) {
        blockNodeArgs.push("--chart-version", blockNodeReleaseTag);
        log.info(`Using block node chart version: ${blockNodeReleaseTag}`);
    }

    await runCommand("npx", blockNodeArgs);

    log.success("Block node deployed");
}

async function deployNetwork({
    numNodes,
    localBuildPath,
    consensusVersion,
    blockNodeReleaseTag,
}) {
    await ensureDeploymentConfig(numNodes);

    const nodeIds = createNodeIdList(numNodes);

    await deployBlockNode({
        consensusVersion,
        localBuildPath,
        blockNodeReleaseTag,
    });

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

async function deployMirror({ mirrorVersion, mirrorNodeChartDir }) {
    const mirrorNodeArgs = [
        "solo",
        "mirror",
        "node",
        "add",
        "--deployment",
        SOLO_DEPLOYMENT,
        "--cluster-ref",
        SOLO_CLUSTER_NAME,
    ];

    if (mirrorNodeChartDir) {
        mirrorNodeArgs.push("--mirror-node-chart-dir", mirrorNodeChartDir);
        log.info(
            `Deploying mirror node services from local chart dir: ${mirrorNodeChartDir}`,
        );
    } else {
        mirrorNodeArgs.push("--mirror-node-version", mirrorVersion);
        log.info(
            `Deploying mirror node services (version: ${mirrorVersion})...`,
        );
    }

    mirrorNodeArgs.push("--pinger", "--dev");

    await runCommand("npx", mirrorNodeArgs);

    log.success("Mirror node deployed");
}

async function main() {
    const {
        numNodes,
        consensusVersion,
        mirrorVersion,
        mirrorNodeChartDir,
        localBuildPath,
        blockNodeReleaseTag,
    } = parseArgs(process.argv.slice(2));

    setEnvironment({
        consensusVersion,
        mirrorVersion,
        mirrorNodeChartDir,
        blockNodeReleaseTag,
    });

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
    if (mirrorNodeChartDir) {
        log.info(
            "  - Mirror Node Version: <omitted (local mirror chart mode)>",
        );
        log.info(`  - Mirror Node Chart Dir: ${mirrorNodeChartDir}`);
    } else {
        log.info(`  - Mirror Node Version: ${process.env.MIRROR_NODE_VERSION}`);
    }
    if (localBuildPath) {
        log.info("  - Block Node Release Tag: <omitted (local build mode)>");
    } else {
        log.info(`  - Block Node Release Tag: ${consensusVersion}`);
    }
    if (blockNodeReleaseTag) {
        log.info(`  - Block Node Chart Version: ${blockNodeReleaseTag}`);
    }
    log.info(`  - Consensus Nodes: ${numNodes}`);
    console.log("");

    await checkDependencies();
    await initializeSolo();
    await setupDeployment(numNodes);
    await deployNetwork({
        numNodes,
        localBuildPath,
        consensusVersion,
        blockNodeReleaseTag,
    });
    await deployMirror({ mirrorVersion, mirrorNodeChartDir });
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
    if (mirrorNodeChartDir) {
        log.info(
            "  - Mirror Node Version: <omitted (local mirror chart mode)>",
        );
        log.info(`  - Mirror Node Chart Dir: ${mirrorNodeChartDir}`);
    } else {
        log.info(`  - Mirror Node Version: ${process.env.MIRROR_NODE_VERSION}`);
    }
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
