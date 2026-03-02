#!/usr/bin/env node

import {
    DEFAULT_NUM_NODES,
    SOLO_CLUSTER_NAME,
    SOLO_NAMESPACE,
    SOLO_CLUSTER_SETUP_NAMESPACE,
    SOLO_DEPLOYMENT,
    SOLO_DIR,
    commandExists,
    soloInstalled,
    validateNumNodes,
    log,
    runCommand,
    clusterExists,
    directoryExists,
    localConfigContains,
} from "./solo-lib.js";

function showHelp() {
    console.log("Usage: ./scripts/init-solo.js [options]");
    console.log("");
    console.log("Options:");
    console.log(
        `  --num-nodes <number>    Number of consensus nodes (default: ${DEFAULT_NUM_NODES})`,
    );
    console.log("  -h, --help             Show this help message");
    console.log("");
    console.log("Examples:");
    console.log(
        "  ./scripts/init-solo.js                # Single node (default)",
    );
    console.log(
        "  ./scripts/init-solo.js --num-nodes 2  # Two nodes (for DAB tests)",
    );
}

function parseArgs(argv) {
    let numNodes = DEFAULT_NUM_NODES;

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
            case "-h":
            case "--help": {
                showHelp();
                process.exit(0);
                break;
            }
            default:
                throw new Error(
                    `Unknown option: ${argument}\nRun './scripts/init-solo.js --help' for usage information`,
                );
        }
    }

    return { numNodes };
}

function setEnvironment() {
    process.env.SOLO_CLUSTER_NAME = SOLO_CLUSTER_NAME;
    process.env.SOLO_NAMESPACE = SOLO_NAMESPACE;
    process.env.SOLO_CLUSTER_SETUP_NAMESPACE = SOLO_CLUSTER_SETUP_NAMESPACE;
    process.env.SOLO_DEPLOYMENT = SOLO_DEPLOYMENT;
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
        log.info("Please run 'task install' or 'pnpm install' first");
        process.exit(1);
    }

    log.success("All dependencies are installed");
}

async function createCluster() {
    if (await clusterExists(SOLO_CLUSTER_NAME)) {
        log.info(`Kind cluster '${SOLO_CLUSTER_NAME}' already exists`);
        return;
    }

    log.info(`Creating Kind cluster: ${SOLO_CLUSTER_NAME}...`);
    await runCommand("kind", ["create", "cluster", "-n", SOLO_CLUSTER_NAME]);
    log.success("Cluster created");
}

async function initializeSolo() {
    if (await directoryExists(SOLO_DIR)) {
        log.info("Solo already initialized");
        return;
    }

    log.info("Initializing Solo...");
    await runCommand("npx", ["solo", "init"]);
    log.success("Solo initialized");
}

async function setupDeployment(numNodes) {
    log.info("Setting up Solo deployment configuration...");

    const deploymentExists = await localConfigContains(
        `name: ${SOLO_DEPLOYMENT}`,
    );
    if (deploymentExists) {
        log.info(`Deployment '${SOLO_DEPLOYMENT}' already configured`);
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

    log.success("Deployment configured");
}

async function main() {
    const { numNodes } = parseArgs(process.argv.slice(2));
    setEnvironment();

    log.info("======================================");
    log.info("Solo Infrastructure Init");
    log.info("======================================");
    console.log("");
    log.info("Configuration:");
    log.info(`  - Number of nodes: ${numNodes}`);
    console.log("");

    await checkDependencies();
    await createCluster();
    await initializeSolo();
    await setupDeployment(numNodes);

    console.log("");
    log.success("======================================");
    log.success("Solo infrastructure initialized!");
    log.success("======================================");
    console.log("");
    log.info("Next steps:");
    log.info("  1. Start services: task solo:start");
    log.info("  2. Stop services:  task solo:stop");
    log.info("  3. Full teardown:  task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
