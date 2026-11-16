// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import ContractId from "../contract/ContractId.js";
import Hbar from "../Hbar.js";
import Timestamp from "../Timestamp.js";
import keyFromJson from "../mirror_node/keyFromJson.js";
import { copyContractId, copyKey } from "./copy.js";
import { bytes, object, string, timestamp, uint64 } from "./mirror.js";

/** @typedef {import("../Key.js").default} Key */

/** Current active Connector state, including remaining stake and in-flight messages. */
export default class MirrorNodeClprConnector {
    /** @type {Uint8Array} */
    #channelId;
    /** @type {Uint8Array} */
    #connectorId;
    /** @type {ContractId} */
    #connectorContractId;
    /** @type {Key} */
    #adminKey;
    /** @type {string} */
    #lockedStake;
    /** @type {Long} */
    #inFlightMessageCount;
    /** @type {Long} */
    #slashCount;
    /** @type {Timestamp} */
    #createdTimestamp;

    /**
     * @private
     * @param {Record<string, unknown>} json
     */
    constructor(json) {
        if (json.status !== "ACTIVE") {
            throw new Error("CLPR mirror response: Connector must be ACTIVE");
        }
        this.#channelId = bytes(json.channel_id, "channel_id", 32);
        this.#connectorId = bytes(json.connector_id, "connector_id", 32);
        this.#connectorContractId = ContractId.fromString(
            string(json.connector_contract_id, "connector_contract_id"),
        );
        const key = object(json.admin_key, "admin_key");
        this.#adminKey = keyFromJson({
            _type: string(key._type, "admin_key._type"),
            key: string(key.key, "admin_key.key"),
        });
        const stake = uint64(
            string(json.locked_stake, "locked_stake"),
            "locked_stake",
        );
        if (stake.greaterThan(Long.MAX_VALUE.toUnsigned())) {
            throw new Error(
                "CLPR mirror response: 'locked_stake' exceeds portable Hbar range",
            );
        }
        this.#lockedStake = stake.toString();
        this.#inFlightMessageCount = uint64(
            json.in_flight_message_count,
            "in_flight_message_count",
        );
        this.#slashCount = uint64(json.slash_count, "slash_count");
        this.#createdTimestamp = timestamp(
            json.created_timestamp,
            "created_timestamp",
        );
        Object.freeze(this);
    }

    /** @returns {Uint8Array} */
    get channelId() {
        return new Uint8Array(this.#channelId);
    }
    /** @returns {Uint8Array} */
    get connectorId() {
        return new Uint8Array(this.#connectorId);
    }
    /** @returns {ContractId} */
    get connectorContractId() {
        return copyContractId(this.#connectorContractId);
    }
    /** @returns {Key} */
    get adminKey() {
        return copyKey(this.#adminKey);
    }
    /** @returns {Hbar} */
    get lockedStake() {
        return Hbar.fromTinybars(this.#lockedStake);
    }
    /** @returns {Long} */
    get inFlightMessageCount() {
        return new Long(
            this.#inFlightMessageCount.low,
            this.#inFlightMessageCount.high,
            true,
        );
    }
    /** @returns {Long} */
    get slashCount() {
        return new Long(this.#slashCount.low, this.#slashCount.high, true);
    }
    /** @returns {Timestamp} */
    get createdTimestamp() {
        return new Timestamp(
            Long.fromString(this.#createdTimestamp.seconds.toString()),
            Long.fromString(this.#createdTimestamp.nanos.toString()),
        );
    }

    /**
     * @internal
     * @param {Record<string, unknown>} json
     * @returns {MirrorNodeClprConnector}
     */
    static _fromJson(json) {
        return new MirrorNodeClprConnector(json);
    }
}
