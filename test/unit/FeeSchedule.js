import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import { FeeSchedule } from "../../src/index.js";

describe("FeeSchedule", function () {
    it("round-trips a CLPR functionality without changing the fee schedule bytes", function () {
        const bytes = HieroProto.proto.FeeSchedule.encode({
            transactionFeeSchedule: [
                {
                    hederaFunctionality: 117,
                    feeData: { nodedata: { constant: Long.fromNumber(10) } },
                    fees: [
                        {
                            subType: 0,
                            nodedata: { min: Long.fromNumber(1) },
                            networkdata: { max: Long.fromNumber(100) },
                            servicedata: { constant: Long.fromNumber(20) },
                        },
                    ],
                },
            ],
            expiryTime: { seconds: Long.fromString("1800000000") },
        }).finish();

        const schedule = FeeSchedule.fromBytes(bytes);
        const functionality =
            schedule.transactionFeeSchedule[0].hederaFunctionality;

        expect(functionality.toString()).to.equal(
            "ClprUpdateLedgerConfiguration",
        );
        expect(functionality.valueOf()).to.equal(117);
        expect(schedule.toBytes()).to.deep.equal(bytes);
    });
});
