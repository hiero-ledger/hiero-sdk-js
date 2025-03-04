// SPDX-License-Identifier: Apache-2.0
/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.PendingAirdropRecord} HieroProto.proto.PendingAirdropRecord
 */

import Long from "long";
import PendingAirdropId from "./PendingAirdropId.js";

export default class PendingAirdropRecord {
    /**
     * @param {object} props
     * @param {PendingAirdropId} props.airdropId
     * @param {Long} props.amount
     */
    constructor(props) {
        this.airdropId = props.airdropId;
        this.amount = props.amount;
    }

    /**
     * @returns {HieroProto.proto.PendingAirdropRecord}
     */
    toBytes() {
        return {
            pendingAirdropId: this.airdropId.toBytes(),
            pendingAirdropValue: {
                amount: this.amount,
            },
        };
    }

    /**
     * @param {HieroProto.proto.PendingAirdropRecord} pb
     * @returns {PendingAirdropRecord}
     */
    static fromBytes(pb) {
        if (pb.pendingAirdropId == null) {
            throw new Error("pendingAirdropId is required");
        }

        const airdropId = PendingAirdropId.fromBytes(pb.pendingAirdropId);
        const amount = pb.pendingAirdropValue?.amount;

        return new PendingAirdropRecord({
            airdropId: airdropId,
            amount: amount ? amount : Long.ZERO,
        });
    }
}
