// SPDX-License-Identifier: Apache-2.0

import MirrorNodeClprConnector from "../clpr/MirrorNodeClprConnector.js";
import { query } from "../clpr/mirror.js";
import * as hex from "../encoding/hex.js";
import Status from "../Status.js";
import { requireUint8ArrayLength } from "../util.js";

/**
 * Read one active Connector on a Channel through the shared mirror REST transport.
 * Deregistered/banned rows are retained by the mirror as DELETED and are excluded.
 * A not-found result can be transient while the mirror ingests a new Connector.
 */
export default class MirrorNodeClprConnectorQuery {
    /** @type {?Uint8Array} */
    #channelId = null;
    /** @type {?Uint8Array} */
    #connectorId = null;

    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     * @param {Uint8Array} [props.connectorId]
     */
    constructor(props = {}) {
        if (props.channelId != null) this.setChannelId(props.channelId);
        if (props.connectorId != null) this.setConnectorId(props.connectorId);
    }

    /** @returns {?Uint8Array} */
    get channelId() {
        return this.#channelId == null ? null : new Uint8Array(this.#channelId);
    }
    /** @returns {?Uint8Array} */
    get connectorId() {
        return this.#connectorId == null
            ? null
            : new Uint8Array(this.#connectorId);
    }

    /**
     * @param {Uint8Array} channelId
     * @returns {this}
     */
    setChannelId(channelId) {
        requireUint8ArrayLength(channelId, 32, "channelId");
        this.#channelId = new Uint8Array(channelId);
        return this;
    }

    /**
     * @param {Uint8Array} connectorId
     * @returns {this}
     */
    setConnectorId(connectorId) {
        requireUint8ArrayLength(connectorId, 32, "connectorId");
        this.#connectorId = new Uint8Array(connectorId);
        return this;
    }

    /**
     * @param {import("../client/Client.js").default<import("../channel/Channel.js").default, import("../channel/MirrorChannel.js").default>} client
     * @param {number} [requestTimeout] total operation deadline in milliseconds
     * @returns {Promise<MirrorNodeClprConnector>}
     */
    async execute(client, requestTimeout) {
        if (this.#channelId == null || this.#connectorId == null) {
            throw new Error(
                "MirrorNodeClprConnectorQuery requires channelId and connectorId",
            );
        }
        const channelId = hex.encode(this.#channelId);
        const connectorId = hex.encode(this.#connectorId);
        const row = await query(
            client,
            `/clpr/channels/0x${channelId}/connectors?connector.id=eq:0x${connectorId}&status=eq:ACTIVE`,
            "connectors",
            Status.ClprConnectorNotFound,
            requestTimeout,
        );
        const connector = MirrorNodeClprConnector._fromJson(row);
        if (
            hex.encode(connector.channelId) !== channelId ||
            hex.encode(connector.connectorId) !== connectorId
        ) {
            throw new Error(
                "CLPR mirror response: IDs do not match the requested Connector",
            );
        }
        return connector;
    }
}
