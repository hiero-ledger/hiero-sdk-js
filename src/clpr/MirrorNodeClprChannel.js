// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import ContractId from "../contract/ContractId.js";
import Timestamp from "../Timestamp.js";
import ClprChannelStatus from "./ClprChannelStatus.js";
import { copyContractId } from "./copy.js";
import { bytes, object, string, timestamp, uint64 } from "./mirror.js";

/**
 * Current state of one completed Channel. Queue acknowledgements do not prove
 * that a receiving application callback succeeded.
 *
 * The verifier contract ID, verifier fingerprint and trust anchor ID are null
 * when the mirror node returns null. The mirror node reads only a contract's
 * number, so a contract set by EVM address can come back as null.
 */
export default class MirrorNodeClprChannel {
    /** @type {Uint8Array} */
    #channelId;
    /** @type {?ContractId} */
    #verifierContractId;
    /** @type {?Uint8Array} */
    #verifierFingerprint;
    /** @type {?Uint8Array} */
    #trustAnchorId;
    /** @type {Long} */
    #nextMessageId;
    /** @type {Long} */
    #ackedMessageId;
    /** @type {Long} */
    #receivedMessageId;
    /** @type {Timestamp} */
    #createdTimestamp;
    /** @type {Timestamp} */
    #modifiedTimestamp;

    /**
     * @private
     * @param {Record<string, unknown>} json
     */
    constructor(json) {
        this.#channelId = bytes(json.channel_id, "channel_id", 32);
        /** @readonly */
        this.chainId = string(json.chain_id, "chain_id");
        /** @readonly */
        this.status = ClprChannelStatus._fromString(json.status);
        this.#verifierContractId =
            json.verifier_contract_id == null
                ? null
                : ContractId.fromString(
                      string(json.verifier_contract_id, "verifier_contract_id"),
                  );
        this.#verifierFingerprint =
            json.verifier_fingerprint == null
                ? null
                : bytes(json.verifier_fingerprint, "verifier_fingerprint");
        this.#trustAnchorId =
            json.trust_anchor_id == null
                ? null
                : bytes(json.trust_anchor_id, "trust_anchor_id");
        this.#nextMessageId = uint64(json.next_message_id, "next_message_id");
        this.#ackedMessageId = uint64(
            json.acked_message_id,
            "acked_message_id",
        );
        this.#receivedMessageId = uint64(
            json.received_message_id,
            "received_message_id",
        );
        this.#createdTimestamp = timestamp(
            json.created_timestamp,
            "created_timestamp",
        );
        this.#modifiedTimestamp = timestamp(
            object(json.timestamp, "timestamp").from,
            "timestamp.from",
        );
        Object.freeze(this);
    }

    /** @returns {Uint8Array} */
    get channelId() {
        return new Uint8Array(this.#channelId);
    }
    /** @returns {?ContractId} */
    get verifierContractId() {
        return this.#verifierContractId == null
            ? null
            : copyContractId(this.#verifierContractId);
    }
    /** @returns {?Uint8Array} */
    get verifierFingerprint() {
        return this.#verifierFingerprint == null
            ? null
            : new Uint8Array(this.#verifierFingerprint);
    }
    /** @returns {?Uint8Array} */
    get trustAnchorId() {
        return this.#trustAnchorId == null
            ? null
            : new Uint8Array(this.#trustAnchorId);
    }
    /** @returns {Long} */
    get nextMessageId() {
        return new Long(
            this.#nextMessageId.low,
            this.#nextMessageId.high,
            true,
        );
    }
    /** @returns {Long} */
    get ackedMessageId() {
        return new Long(
            this.#ackedMessageId.low,
            this.#ackedMessageId.high,
            true,
        );
    }
    /** @returns {Long} */
    get receivedMessageId() {
        return new Long(
            this.#receivedMessageId.low,
            this.#receivedMessageId.high,
            true,
        );
    }
    /** @returns {Timestamp} */
    get createdTimestamp() {
        return new Timestamp(
            Long.fromString(this.#createdTimestamp.seconds.toString()),
            Long.fromString(this.#createdTimestamp.nanos.toString()),
        );
    }
    /** @returns {Timestamp} */
    get modifiedTimestamp() {
        return new Timestamp(
            Long.fromString(this.#modifiedTimestamp.seconds.toString()),
            Long.fromString(this.#modifiedTimestamp.nanos.toString()),
        );
    }

    /**
     * @internal
     * @param {Record<string, unknown>} json
     * @returns {MirrorNodeClprChannel}
     */
    static _fromJson(json) {
        return new MirrorNodeClprChannel(json);
    }
}
