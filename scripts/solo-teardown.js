#!/usr/bin/env node

import fs from "node:fs/promises";
import {
    SOLO_CLUSTER_NAME,
    SOLO_DIR,
    clusterExists,
    directoryExists,
    runCommand,
    log,
} from "./solo-lib.js";

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

async function main() {
    await cleanupPrevious();
}

main().catch((error) => {
    log.error(error.message);
    process.exit(1);
});
