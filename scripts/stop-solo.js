#!/usr/bin/env node

import {
    SOLO_CLUSTER_NAME,
    SOLO_NAMESPACE,
    SOLO_DEPLOYMENT,
    SOLO_GLOBAL_INSTALL_COMMAND,
    commandExists,
    clusterExists,
    killPortForwardProcesses,
    runSoloCommand,
    log,
} from "./solo-lib.js";

function showHelp() {
    console.log("Usage: ./scripts/stop-solo.js");
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
            `Unknown option: ${argument}\nRun './scripts/stop-solo.js --help' for usage information`,
        );
    }
}

async function cleanupPortForwarding() {
    log.info("Stopping port forwarding processes...");

    const stopped = await killPortForwardProcesses(SOLO_NAMESPACE);
    if (stopped) {
        log.success("Port forwarding processes stopped");
    } else {
        log.info("No port forwarding processes found");
    }
}

async function destroyServices() {
    log.info("Destroying Solo services...");

    if (!commandExists("kind") || !(await clusterExists(SOLO_CLUSTER_NAME))) {
        log.warning("Kind cluster not found, nothing to destroy");
        return;
    }

    if (!commandExists("solo")) {
        log.error("Solo CLI is not available globally");
        log.info(`Please run '${SOLO_GLOBAL_INSTALL_COMMAND}' and try again`);
        process.exit(1);
    }

    log.info("Destroying mirror node...");
    const mirrorResult = await runSoloCommand(
        [
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
        log.warning("Failed to destroy mirror node (may not exist)");
    }

    log.info("Destroying consensus network...");
    const networkResult = await runSoloCommand(
        [
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
        log.warning("Failed to destroy consensus network (may not exist)");
    }
}

async function main() {
    parseArgs(process.argv.slice(2));

    log.info("======================================");
    log.info("Solo Services Stop");
    log.info("======================================");
    console.log("");

    await cleanupPortForwarding();
    await destroyServices();

    console.log("");
    log.success("======================================");
    log.success("Solo services stopped!");
    log.success("======================================");
    console.log("");
    log.info("Infrastructure preserved (cluster, config, images)");
    console.log("");
    log.info("To restart services: task solo:resume");
    log.info("To teardown all:     task solo:teardown");
    console.log("");
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
