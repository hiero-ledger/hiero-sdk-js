// SPDX-License-Identifier: Apache-2.0

import MirrorNodeClprChannel from "../clpr/MirrorNodeClprChannel.js";
import { query } from "../clpr/mirror.js";
import * as hex from "../encoding/hex.js";
import Status from "../Status.js";
import { requireUint8ArrayLength } from "../util.js";

/**
 * Read one completed Channel through the client's shared mirror REST transport.
 * Mirror ingestion lags consensus; a not-found result can be transient.
 * Does not fetch historical states or follow pagination.
 */
export default class MirrorNodeClprChannelQuery {
    /** @type {?Uint8Array} */
    #channelId = null;

    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.channelId]
     */
    constructor(props = {}) {
        if (props.channelId != null) this.setChannelId(props.channelId);
    }

    /** @returns {?Uint8Array} */
    get channelId() {
        return this.#channelId == null ? null : new Uint8Array(this.#channelId);
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
     * @param {import("../client/Client.js").default<import("../channel/Channel.js").default, import("../channel/MirrorChannel.js").default>} client
     * @param {number} [requestTimeout] total operation deadline in milliseconds
     * @returns {Promise<MirrorNodeClprChannel>}
     */
    async execute(client, requestTimeout) {
        if (this.#channelId == null) {
            throw new Error("MirrorNodeClprChannelQuery requires a channelId");
        }
        const id = hex.encode(this.#channelId);
        const row = await query(
            client,
            `/clpr/channels?channel.id=eq:0x${id}`,
            "channels",
            Status.ClprChannelNotFound,
            requestTimeout,
        );
        const channel = MirrorNodeClprChannel._fromJson(row);
        if (hex.encode(channel.channelId) !== id) {
            throw new Error(
                "CLPR mirror response: channel_id does not match the requested Channel",
            );
        }
        return channel;
    }
}
