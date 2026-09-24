// SPDX-License-Identifier: Apache-2.0

import MirrorNodeHttpError, {
    MirrorNodeHttpErrorCode,
} from "./MirrorNodeHttpError.js";

const PATH_PATTERN = /^\/[^\s]*$/;
const API_PREFIX = "/api/v1";

/**
 * A path below the mirror node REST base URL.
 *
 * The type is the mechanism: no mirror REST call site can name a foreign
 * host, because the only way to reach `MirrorNodeHttpClient` is through
 * this type and this type cannot express one. Resolution against the base
 * URL is plain concatenation, never URL-reference resolution, which would
 * let an absolute or protocol-relative reference replace the host.
 *
 * @internal
 */
export default class MirrorNodeRestPath {
    /**
     * @hideconstructor
     * @param {string} value
     */
    constructor(value) {
        /**
         * @readonly
         * @type {string}
         */
        this.value = value;

        Object.freeze(this);
    }

    /**
     * @param {string} path - `/segment[?query]`, relative to the base URL
     * (which already carries `/api/v1`)
     * @returns {MirrorNodeRestPath}
     */
    static of(path) {
        if (typeof path !== "string" || !PATH_PATTERN.test(path)) {
            throw invalid(
                `a mirror node REST path must start with "/" and contain no whitespace, got ${JSON.stringify(
                    path,
                )}`,
            );
        }
        if (path.startsWith("//")) {
            throw invalid(
                `a mirror node REST path must not be protocol-relative, got ${JSON.stringify(
                    path,
                )}`,
            );
        }
        const pathOnly = path.split(/[?#]/, 1)[0];
        if (pathOnly.split("/").includes("..")) {
            throw invalid(
                `a mirror node REST path must not contain a ".." segment, got ${JSON.stringify(
                    path,
                )}`,
            );
        }
        return new MirrorNodeRestPath(path);
    }

    /**
     * Convert a mirror node `links.next` value into a path, stripping the
     * `/api/v1` prefix the mirror node includes and the base URL already
     * carries. A value naming a host is rejected, so a paginated walk can
     * never be steered to another server.
     *
     * @param {string} link
     * @returns {MirrorNodeRestPath}
     */
    static fromNextLink(link) {
        if (typeof link !== "string") {
            throw invalid(
                `a mirror node next link must be a string, got ${String(link)}`,
            );
        }
        if (link.includes("://") || link.startsWith("//")) {
            throw invalid(
                `a mirror node next link must not name a host, got ${JSON.stringify(
                    link,
                )}`,
            );
        }

        let path = link;
        if (
            path === API_PREFIX ||
            path.startsWith(`${API_PREFIX}/`) ||
            path.startsWith(`${API_PREFIX}?`)
        ) {
            path = path.slice(API_PREFIX.length);
            if (path.length === 0 || path.startsWith("?")) {
                path = `/${path}`;
            }
        }

        return MirrorNodeRestPath.of(path);
    }

    /**
     * Resolve against a base URL by concatenation. Both spellings of a
     * trailing slash on the base URL behave identically.
     *
     * @param {string} baseUrl
     * @returns {string}
     */
    resolve(baseUrl) {
        return `${baseUrl.replace(/\/+$/, "")}${this.value}`;
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value;
    }
}

/**
 * @param {string} message
 * @returns {MirrorNodeHttpError}
 */
function invalid(message) {
    return new MirrorNodeHttpError(
        MirrorNodeHttpErrorCode.INVALID_PATH_ERROR,
        message,
    );
}
