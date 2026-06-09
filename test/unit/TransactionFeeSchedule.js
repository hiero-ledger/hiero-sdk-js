import { expect, describe, it } from "vitest";
import TransactionFeeSchedule from "../../src/TransactionFeeSchedule.js";
import RequestType from "../../src/RequestType.js";

describe("TransactionFeeSchedule", function () {
    
    // Test 1: Null-guards check කිරීම
    it("should handle null-guards for _fromProtobuf", function () {
        const schedule = TransactionFeeSchedule._fromProtobuf({});
        
        expect(schedule.hederaFunctionality).to.be.undefined;
        expect(schedule.feeData).to.be.undefined;
        expect(schedule.fees).to.be.undefined;
    });

    // Test 2: RequestType mapping එක check කිරීම
    it("should map hederaFunctionality to RequestType", function () {
        const schedule = TransactionFeeSchedule._fromProtobuf({ hederaFunctionality: 0 });
        
        expect(schedule.hederaFunctionality).to.equal(RequestType._fromCode(0));
    });

    // Test 3: toBytes සහ fromBytes round-trip එක check කිරීම
    it("should successfully execute toBytes and fromBytes round-trip", function () {
        const schedule = TransactionFeeSchedule._fromProtobuf({ hederaFunctionality: 0 });
        
        const bytes = schedule.toBytes();
        const recovered = TransactionFeeSchedule.fromBytes(bytes);
        
        expect(recovered.hederaFunctionality.toString()).to.equal(schedule.hederaFunctionality.toString());
    });
});