import { setupWorker } from "msw/browser";
/**
 * Setup MSW worker with handlers
 * @param {Array} handlers - MSW handlers
 */
export const startMSW = async (handlers) => {
    const worker = setupWorker(...handlers);
    await worker.start({ quiet: true });
    return worker;
};

/**
 * Clean up MSW worker. The caller must drop its reference afterwards:
 * msw 3 throws when a stopped worker is stopped again.
 */
export const cleanupMSW = async (worker) => {
    if (worker) {
        await worker.stop();
    }
};
