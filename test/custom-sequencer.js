// custom-sequencer.js
import { BaseSequencer } from "vitest/node";

/**
 * @typedef {import("vitest/node").TestSpecification} TestSpecification
 */

export default class CustomSequencer extends BaseSequencer {
    /**
     *
     * @param {TestSpecification[]} files
     * @returns
     */
    sort(files) {
        return files.sort((a, b) => {
            if (b.moduleId.includes("BatchTransactionIntegrationTest")) {
                return -1;
            } else return a.moduleId.localeCompare(b.moduleId);
        });
    }
}
