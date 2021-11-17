import AccountId from "./AccountId.js";
import { KeyList } from "@exodus/hashgraph-cryptography";
import {
    keyListFromProtobuf,
    keyListToProtobuf,
} from "../cryptography/protobuf.js";
import Duration from "../Duration.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 * @typedef {import("@exodus/hashgraph-proto").ILiveHash} proto.ILiveHash
 * @typedef {import("@exodus/hashgraph-proto").IDuration} proto.IDuration
 */

/**
 * Response when the client sends the node CryptoGetInfoQuery.
 */
export default class LiveHash {
    /**
     * @private
     * @param {object} props
     * @param {AccountId} props.accountId
     * @param {Uint8Array} props.hash
     * @param {KeyList} props.keys
     * @param {Duration} props.duration
     */
    constructor(props) {
        /** @readonly */
        this.accountId = props.accountId;

        /** @readonly */
        this.hash = props.hash;

        /** @readonly */
        this.keys = props.keys;

        /** @readonly */
        this.duration = props.duration;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.ILiveHash} liveHash
     * @returns {LiveHash}
     */
    static _fromProtobuf(liveHash) {
        const liveHash_ = /** @type {proto.ILiveHash} */ (liveHash);

        return new LiveHash({
            accountId: AccountId._fromProtobuf(
                /** @type {proto.IAccountID} */ (liveHash_.accountId)
            ),
            hash: liveHash_.hash != null ? liveHash_.hash : new Uint8Array(),
            keys:
                liveHash_.keys != null
                    ? keyListFromProtobuf(liveHash_.keys)
                    : new KeyList(),
            duration: Duration._fromProtobuf(
                /** @type {proto.IDuration} */ (liveHash_.duration)
            ),
        });
    }

    /**
     * @internal
     * @returns {proto.ILiveHash}
     */
    _toProtobuf() {
        return {
            accountId: this.accountId._toProtobuf(),
            hash: this.hash,
            keys: keyListToProtobuf(this.keys),
            duration: this.duration._toProtobuf(),
        };
    }
}
