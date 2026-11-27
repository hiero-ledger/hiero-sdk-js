// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Timestamp from "../Timestamp.js";
import MirrorNodeStatusError from "../MirrorNodeStatusError.js";
import * as hex from "../encoding/hex.js";
import {
    bodyJson,
    errorMessage,
    statusMessage,
} from "../mirror_node/MirrorNodeHttpClient.js";

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {Record<string, unknown>}
 */
export function object(value, name) {
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`CLPR mirror response: '${name}' must be an object`);
    }
    return /** @type {Record<string, unknown>} */ (value);
}

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {string}
 */
export function string(value, name) {
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`CLPR mirror response: '${name}' must be a string`);
    }
    return value;
}

/**
 * @param {unknown} value
 * @param {string} name
 * @param {number} [length]
 * @returns {Uint8Array}
 */
export function bytes(value, name, length) {
    const encoded = string(value, name);
    if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(encoded)) {
        throw new Error(`CLPR mirror response: '${name}' must be hex bytes`);
    }
    const decoded = hex.decode(encoded.slice(2));
    if (length != null && decoded.length !== length) {
        throw new Error(
            `CLPR mirror response: '${name}' must be ${length} bytes`,
        );
    }
    return decoded;
}

/**
 * Validate before Long conversion, which otherwise silently wraps overflow.
 * @param {unknown} value
 * @param {string} name
 * @returns {Long}
 */
export function uint64(value, name) {
    if (
        !(
            (typeof value === "number" &&
                Number.isSafeInteger(value) &&
                value >= 0) ||
            (typeof value === "string" && /^\d+$/.test(value))
        )
    ) {
        throw new Error(`CLPR mirror response: '${name}' must be a uint64`);
    }
    const decimal = BigInt(value);
    if (decimal > 18446744073709551615n) {
        throw new Error(`CLPR mirror response: '${name}' exceeds uint64`);
    }
    return Long.fromString(decimal.toString(), true);
}

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {Timestamp}
 */
export function timestamp(value, name) {
    const match = /^(\d+)\.(\d{1,9})$/.exec(string(value, name));
    if (match == null || BigInt(match[1]) > 9223372036854775807n) {
        throw new Error(`CLPR mirror response: '${name}' must be a timestamp`);
    }
    return new Timestamp(
        Long.fromString(match[1]),
        Long.fromString(match[2].padEnd(9, "0")),
    );
}

/**
 * Read a known-ID CLPR row through the client's existing REST transport.
 * @param {import("../client/Client.js").default<import("../channel/Channel.js").default, import("../channel/MirrorChannel.js").default>} client
 * @param {string} path
 * @param {"channels" | "connectors"} field
 * @param {import("../Status.js").default} notFoundStatus
 * @param {number} [requestTimeout]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function query(
    client,
    path,
    field,
    notFoundStatus,
    requestTimeout,
) {
    const http = client._mirrorNodeHttpClient({
        totalDeadline: requestTimeout,
    });
    const url = `${http.baseUrl}${path}`;
    try {
        const response = await http.get(path);
        if (!response.ok) {
            throw new Error(statusMessage(response));
        }
        const rows = object(bodyJson(response), "response")[field];
        if (!Array.isArray(rows)) {
            throw new Error(`response has no ${field} array`);
        }
        if (rows.length === 0) {
            throw new MirrorNodeStatusError(
                { status: notFoundStatus },
                `CLPR ${field} lookup ${url} was not found on the mirror node; ingestion may be delayed`,
            );
        }
        if (rows.length !== 1) {
            throw new Error(`known-ID lookup returned multiple ${field}`);
        }
        return object(rows[0], field);
    } catch (error) {
        if (error instanceof MirrorNodeStatusError) {
            throw error;
        }
        throw new Error(`Failed to query ${url}: ${errorMessage(error)}`, {
            cause: error,
        });
    }
}
