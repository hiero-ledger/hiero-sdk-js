// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {object} MirrorError
 * @property {number} code
 * @property {string} details
 */

/**
 * @internal
 * @abstract
 */
export default class MirrorChannel {
    /**
     * @abstract
     * @returns {void}
     */
    close() {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @internal
     * @param {string} serviceName
     * @param {string} methodName
     * @param {Uint8Array} requestData
     * @param {(data: Uint8Array) => void} callback
     * @param {(error: MirrorError | Error) => void} error
     * @param {() => void} end
     * @returns {() => void}
     */
    makeServerStreamRequest(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        serviceName,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        methodName,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        requestData,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        callback,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        error,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        end,
    ) {
        throw new Error("not implemented");
    }
}
