#!/usr/bin/env node

import {
    SOLO_CLUSTER_NAME,
    SOLO_NAMESPACE,
    SOLO_DEPLOYMENT,
    killPortForwardProcesses,
    stopKindClusterContainers,
    runSoloCommand,
    log,
} from "./solo-lib.js";

const deploymentName = process.env.SOLO_DEPLOYMENT || SOLO_DEPLOYMENT;

function showHelp() {
    console.log("Usage: ./scripts/solo-pause.js");
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
            `Unknown option: ${argument}\nRun './scripts/solo-pause.js --help' for usage information`,
        );
    }
}

async function destroyMirrorNode() {
    log.info("Destroying mirror node...");
    const result = await runSoloCommand(
        [
            "mirror",
            "node",
            "destroy",
            "--deployment",
            deploymentName,
            "--force",
            "--dev",
        ],
        { allowFailure: true },
    );

    if (result.code === 0) {
        log.success("Mirror node destroyed");
    } else {
        log.warning("Mirror node destroy failed (it may not exist)");
    }
}

async function stopConsensusNodes() {
    log.info("Stopping consensus nodes...");
    const result = await runSoloCommand(
        ["consensus", "node", "stop", "--deployment", deploymentName, "--dev"],
        { allowFailure: true },
    );

    if (result.code === 0) {
        log.success("Consensus nodes stopped");
    } else {
        log.warning("Consensus node stop failed");
    }
}

async function removePortForwards() {
    log.info("Removing port forwarding processes...");
    const removed = await killPortForwardProcesses(SOLO_NAMESPACE);

    if (removed) {
        log.success("Port forwarding processes removed");
    } else {
        log.info("No port forwarding processes found");
    }
}

async function stopCluster() {
    log.info("Stopping Kind cluster...");

    const result = await stopKindClusterContainers(SOLO_CLUSTER_NAME);

    if (!result.exists) {
        log.warning(
            `Kind cluster '${SOLO_CLUSTER_NAME}' containers were not found`,
        );
        return;
    }

    if (result.changed) {
        log.success(`Kind cluster stopped (${result.containers.join(", ")})`);
    } else {
        log.info("Kind cluster was already stopped");
    }
}

async function main() {
    parseArgs(process.argv.slice(2));

    log.info("======================================");
    log.info("Solo Services Pause");
    log.info("======================================");
    console.log("");

    await destroyMirrorNode();
    await stopConsensusNodes();
    await removePortForwards();
    await stopCluster();

    console.log("");
    log.success("======================================");
    log.success("Solo services paused!");
    log.success("======================================");
    console.log("");
    log.info("To resume services: task solo:resume");
    log.info("To teardown all:    task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
