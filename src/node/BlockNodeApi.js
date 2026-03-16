// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.RegisteredServiceEndpoint.BlockNodeEndpoint.BlockNodeApi} IBlockNodeApi
 */

/**
 * An enumeration of well-known block node endpoint APIs.
 */
export default class BlockNodeApi {
    /**
     * @hideconstructor
     * @internal
     * @param {number} code
     */
    constructor(code) {
        /** @readonly */
        this._code = code;

        Object.freeze(this);
    }

    /**
     * @returns {string}
     */
    toString() {
        switch (this) {
            case BlockNodeApi.Other:
                return "OTHER";
            case BlockNodeApi.Status:
                return "STATUS";
            case BlockNodeApi.Publish:
                return "PUBLISH";
            case BlockNodeApi.SubscribeStream:
                return "SUBSCRIBE_STREAM";
            case BlockNodeApi.StateProof:
                return "STATE_PROOF";
            default:
                return `UNKNOWN (${this._code})`;
        }
    }

    /**
     * @internal
     * @param {number} code
     * @returns {BlockNodeApi}
     */
    static _fromCode(code) {
        switch (code) {
            case 0:
                return BlockNodeApi.Other;
            case 1:
                return BlockNodeApi.Status;
            case 2:
                return BlockNodeApi.Publish;
            case 3:
                return BlockNodeApi.SubscribeStream;
            case 4:
                return BlockNodeApi.StateProof;
        }

        throw new Error(
            `(BUG) BlockNodeApi._fromCode() does not handle code: ${code}`,
        );
    }

    /**
     * @returns {IBlockNodeApi}
     */
    valueOf() {
        return this._code;
    }
}

BlockNodeApi.Other = new BlockNodeApi(0);
BlockNodeApi.Status = new BlockNodeApi(1);
BlockNodeApi.Publish = new BlockNodeApi(2);
BlockNodeApi.SubscribeStream = new BlockNodeApi(3);
BlockNodeApi.StateProof = new BlockNodeApi(4);
