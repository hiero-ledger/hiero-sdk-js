#!/usr/bin/env node

import {
    SOLO_CLUSTER_NAME,
    SOLO_NAMESPACE,
    SOLO_DEPLOYMENT,
    commandExists,
    clusterExists,
    createNodeIdList,
    runCommand,
    runSoloCommand,
    setupPortForwarding,
    sleep,
    startKindClusterContainers,
    log,
} from "./solo-lib.js";

const deploymentName = process.env.SOLO_DEPLOYMENT || SOLO_DEPLOYMENT;
const kubeContext = `kind-${SOLO_CLUSTER_NAME}`;

function showHelp() {
    console.log("Usage: ./scripts/solo-resume.js");
    console.log("");
    console.log("Options:");
    console.log("  -h, --help    Show this help message");
}

function parseArgs(argv) {
    if (argv.length === 0) {
        return;
    }

    for (const argument of argv) {
        if (argument === "-h" || argument === "--help") {
            showHelp();
            process.exit(0);
        }

        throw new Error(
            `Unknown option: ${argument}\nRun './scripts/solo-resume.js --help' for usage information`,
        );
    }
}

async function checkPrerequisites() {
    if (!commandExists("solo") || !commandExists("kubectl")) {
        throw new Error(
            "Missing required dependency: solo and kubectl are required",
        );
    }

    if (!(await clusterExists(SOLO_CLUSTER_NAME))) {
        throw new Error(
            `Kind cluster '${SOLO_CLUSTER_NAME}' not found. Run 'task solo:setup' first.`,
        );
    }
}

async function startCluster() {
    log.info("Starting Kind cluster...");

    const result = await startKindClusterContainers(SOLO_CLUSTER_NAME);

    if (!result.exists) {
        throw new Error(
            `Kind cluster '${SOLO_CLUSTER_NAME}' containers were not found. Run 'task solo:setup' first.`,
        );
    }

    if (result.changed) {
        log.success(`Kind cluster started (${result.containers.join(", ")})`);
    } else {
        log.info("Kind cluster is already running");
    }
}

async function waitForClusterReady() {
    log.info("Waiting for cluster API to become ready...");

    const maxAttempts = 30;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const result = await runCommand(
            "kubectl",
            ["--context", kubeContext, "version", "--request-timeout=5s"],
            {
                allowFailure: true,
                captureOutput: true,
            },
        );

        if (result.code === 0) {
            log.success("Cluster API is ready");
            return;
        }

        await sleep(2000);
    }

    throw new Error(
        "Kind cluster did not become ready in time. Check Docker/Kind status and try again.",
    );
}

async function getNumNodes() {
    const node2Service = await runCommand(
        "kubectl",
        [
            "--context",
            kubeContext,
            "get",
            "svc",
            "haproxy-node2-svc",
            "-n",
            SOLO_NAMESPACE,
        ],
        { allowFailure: true, captureOutput: true },
    );

    if (node2Service.code === 0) {
        return 2;
    }

    return 1;
}

async function waitForSoloNetworkPods(numNodes) {
    log.info("Waiting for Solo network pods to be present...");

    const expectedAliases = Array.from(
        { length: numNodes },
        (_, index) => `network-node${index + 1}`,
    );

    const maxAttempts = 60;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const result = await runCommand(
            "kubectl",
            [
                "--context",
                kubeContext,
                "get",
                "pods",
                "-n",
                SOLO_NAMESPACE,
                "-o",
                "name",
            ],
            { allowFailure: true, captureOutput: true },
        );

        if (result.code === 0) {
            const podNames = result.stdout
                .split(/\r?\n/u)
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((line) => line.replace(/^pod\//u, ""));

            const found = expectedAliases.every((alias) =>
                podNames.some((name) => name.includes(alias)),
            );

            if (found) {
                log.success("Solo network pods are present");
                return;
            }

            if (attempt % 5 === 0) {
                log.info(
                    `Still waiting for pods: ${expectedAliases.join(
                        ", ",
                    )} (attempt ${attempt}/${maxAttempts})`,
                );
            }
        }

        await sleep(2000);
    }

    throw new Error(
        "Solo network pods were not detected in time after cluster start.",
    );
}

async function startConsensusNodesOnce(numNodes) {
    log.info("Starting consensus nodes...");

    const defaultStart = await runSoloCommand(
        ["consensus", "node", "start", "--deployment", deploymentName, "--dev"],
        { allowFailure: true },
    );

    if (defaultStart.code === 0) {
        log.success("Consensus nodes started");
        return true;
    }

    const nodeIds = createNodeIdList(numNodes);
    log.warning(
        "Consensus node start without explicit node IDs failed, retrying with explicit node IDs...",
    );

    const explicitStart = await runSoloCommand(
        [
            "consensus",
            "node",
            "start",
            "--deployment",
            deploymentName,
            "-i",
            nodeIds,
            "--dev",
        ],
        { allowFailure: true },
    );

    if (explicitStart.code === 0) {
        log.success("Consensus nodes started");
        return true;
    }

    return false;
}

async function startConsensusNodesWithRetry(numNodes) {
    const maxAttempts = 12;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const started = await startConsensusNodesOnce(numNodes);
        if (started) {
            return;
        }

        if (attempt === maxAttempts) {
            break;
        }

        log.warning(
            `Consensus node start failed (attempt ${attempt}/${maxAttempts}). Retrying in 10s...`,
        );
        await sleep(10000);
        await waitForClusterReady();
    }

    throw new Error(
        "Failed to start consensus nodes after multiple retries. Please check pod/container status.",
    );
}

async function addMirrorNode() {
    log.info("Adding mirror node...");
    await runSoloCommand([
        "mirror",
        "node",
        "add",
        "--deployment",
        deploymentName,
        "--cluster-ref",
        SOLO_CLUSTER_NAME,
        "--pinger",
        "--dev",
    ]);

    log.success("Mirror node added");
}

async function main() {
    parseArgs(process.argv.slice(2));

    log.info("======================================");
    log.info("Solo Services Resume");
    log.info("======================================");
    console.log("");

    await checkPrerequisites();
    await startCluster();
    await waitForClusterReady();

    const numNodes = await getNumNodes();
    await waitForSoloNetworkPods(numNodes);
    await startConsensusNodesWithRetry(numNodes);
    await addMirrorNode();
    await setupPortForwarding({
        numNodes,
        namespace: SOLO_NAMESPACE,
        kubeContext,
        logger: log,
    });

    console.log("");
    log.success("======================================");
    log.success("Solo services resumed!");
    log.success("======================================");
    console.log("");
    log.info("To pause services: task solo:pause");
    log.info("To teardown all:   task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
