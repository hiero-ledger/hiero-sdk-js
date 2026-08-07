import TransactionFeeSchedule from "../../src/TransactionFeeSchedule.js";
import RequestType from "../../src/RequestType.js";
import { describe, it } from "vitest";
import { expect } from "vitest";

describe("TransactionFeeSchedule", function () {
    it("_fromProtobuf should handle null-guards correctly when empty object is passed", function () {
        const schedule = TransactionFeeSchedule._fromProtobuf({});

        expect(schedule.hederaFunctionality).toBeUndefined();
        expect(schedule.feeData).toBeUndefined();
        expect(schedule.fees).toBeUndefined();
    });

    it("_fromProtobuf should map hederaFunctionality correctly when code is present", function () {
        const schedule = TransactionFeeSchedule._fromProtobuf({
            hederaFunctionality: 0,
        });

        expect(schedule.hederaFunctionality).toBeDefined();
        expect(schedule.hederaFunctionality).toEqual(RequestType._fromCode(0));
    });

    it("should perform toBytes and fromBytes round-trip successfully", function () {
        const schedule = new TransactionFeeSchedule({
            hederaFunctionality: RequestType._fromCode(0),
        });

        const bytes = schedule.toBytes();
        const recovered = TransactionFeeSchedule.fromBytes(bytes);

        expect(recovered.hederaFunctionality.toString()).toEqual(
            schedule.hederaFunctionality.toString(),
        );
        expect(recovered.feeData).toBeUndefined();
        expect(recovered.fees).toEqual([]);
    });
});
