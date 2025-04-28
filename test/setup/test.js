import { setTimeout } from "timers/promises";
import { getBackoffBasedOnAttempt } from "../integration/utils/backoff.js";

export const mochaHooks = {
    beforeEach: async function () {
        const backoffMs = getBackoffBasedOnAttempt.call(this);
        await setTimeout(backoffMs);
    },
    afterEach: async function () {
        console.log(this.currentTest.currentRetry());
    },
};
