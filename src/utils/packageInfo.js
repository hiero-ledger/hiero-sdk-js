// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

/**
 * Reads the package.json and returns the parsed content
 * @returns {{ version: string }}
 */
export function getPackageInfo() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    /** @type {{ version: string }} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pkg = JSON.parse(
        readFileSync(path.resolve(__dirname, "../../../package.json"), "utf-8"),
    );

    return pkg;
}

/**
 * Returns the current SDK version from package.json
 * @returns {string}
 */
export function getVersion() {
    return getPackageInfo().version;
}

/**
 * Returns the user agent string in the format `hiero-sdk-js/{version}`
 * @returns {string}
 */
export function getUserAgent() {
    return `hiero-sdk-js/${getVersion()}`;
}
