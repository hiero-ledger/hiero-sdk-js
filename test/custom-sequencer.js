// custom-sequencer.js
import { BaseSequencer } from "vitest/node";

/**
 * @typedef {import("vitest/node").TestSpecification} TestSpecification
 */

/**
 * Test files in this list run AFTER the alphabetical block, in the order
 * given. Used to delay tests that need the mirror node's rest-java service
 * to have finished its first fee-schedule refresh — the @Scheduled task in
 * `FeeEstimationService` runs every 10 minutes, and on freshly-started solo
 * deployments the calculator is null until the first refresh fires. Putting
 * `FeeEstimateQueryIntegrationTest` at the end of the suite gives the
 * mirror the maximum amount of wall-clock time to become ready before the
 * tests run.
 *
 * `BatchTransactionIntegrationTest` was already deferred for unrelated
 * reasons; preserved here.
 *
 * @type {string[]}
 */
const RUN_LAST = [
    "BatchTransactionIntegrationTest",
    "FeeEstimateQueryIntegrationTest",
];

/**
 * Returns the index of the matching deferred test, or -1 if the file is
 * not in the deferred list.
 *
 * @param {string} moduleId
 * @returns {number}
 */
function deferredIndex(moduleId) {
    for (let i = 0; i < RUN_LAST.length; i++) {
        if (moduleId.includes(RUN_LAST[i])) {
            return i;
        }
    }
    return -1;
}

export default class CustomSequencer extends BaseSequencer {
    /**
     *
     * @param {TestSpecification[]} files
     * @returns
     */
    sort(files) {
        return files.sort((a, b) => {
            const ia = deferredIndex(a.moduleId);
            const ib = deferredIndex(b.moduleId);

            // Both alphabetical: stable alphabetical order.
            if (ia === -1 && ib === -1) {
                return a.moduleId.localeCompare(b.moduleId);
            }

            // One is deferred: the non-deferred one runs first.
            if (ia === -1) return -1;
            if (ib === -1) return 1;

            // Both deferred: order by RUN_LAST index.
            return ia - ib;
        });
    }
}
