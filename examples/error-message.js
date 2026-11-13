// SPDX-License-Identifier: Apache-2.0

/**
 * Describe a thrown value without hiding the original error behind a JSON error.
 * @param {unknown} error
 * @returns {string}
 */
export function errorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (
        typeof error === "string" ||
        typeof error === "number" ||
        typeof error === "bigint" ||
        typeof error === "boolean" ||
        typeof error === "symbol"
    ) {
        return String(error);
    }
    if (error == null) {
        return error === null ? "null" : "undefined";
    }
    if (typeof error === "function") {
        return Function.prototype.toString.call(error);
    }
    try {
        return JSON.stringify(error) ?? Object.prototype.toString.call(error);
    } catch {
        return Object.prototype.toString.call(error);
    }
}
