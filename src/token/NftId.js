// SPDX-License-Identifier: Apache-2.0

import * as HashgraphProto from "@hashgraph/proto";
import TokenId from "../token/TokenId.js";
import Long from "long";

/**
 * The ID for a crypto-currency token on Hedera.
 *
 * @augments {EntityId<HashgraphProto.proto.INftID>}
 */
export default class NftId {
    /**
     * @param {TokenId} token
     * @param {number | Long} serial
     */
    constructor(token, serial) {
        this.tokenId = token;
        this.serial =
            typeof serial === "number" ? Long.fromNumber(serial) : serial;

        Object.freeze(this);
    }

    /**
     * @param {string} text
     * @returns {NftId}
     */
    static fromString(text) {
        const strings =
            text.split("/").length > 1 ? text.split("/") : text.split("@");

        for (const string of strings) {
            if (string === "") {
                throw new Error(
                    "invalid format for NftId: use [token]/[serial] or [token]@[serial]",
                );
            }
        }

        const token = TokenId.fromString(strings[0]);
        const serial = Long.fromString(strings[1]);

        return new NftId(token, serial);
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.INftID} id
     * @returns {NftId}
     */
    static _fromProtobuf(id) {
        return new NftId(
            TokenId._fromProtobuf(
                /** @type {HashgraphProto.proto.ITokenID} */ (id.token_ID),
            ),
            id.serialNumber != null ? id.serialNumber : Long.ZERO,
        );
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {NftId}
     */
    static fromBytes(bytes) {
        return NftId._fromProtobuf(HashgraphProto.proto.NftID.decode(bytes));
    }

    /**
     * @internal
     * @returns {HashgraphProto.proto.INftID}
     */
    _toProtobuf() {
        return {
            token_ID: this.tokenId._toProtobuf(),
            serialNumber: Long.fromValue(
                this.serial !== undefined ? this.serial : 0,
            ),
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.tokenId.toString()}/${this.serial.toString()}`;
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HashgraphProto.proto.NftID.encode(this._toProtobuf()).finish();
    }
}
