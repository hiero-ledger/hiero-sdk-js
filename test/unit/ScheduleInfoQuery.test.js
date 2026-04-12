import { describe, it, expect } from "vitest";
import ScheduleInfoQuery from "../../src/schedule/ScheduleInfoQuery.js";
import ScheduleId from "../../src/schedule/ScheduleId.js";

describe("ScheduleInfoQuery", () => {
    it("should set scheduleId from string", () => {
        const query = new ScheduleInfoQuery({
            scheduleId: "0.0.123"
        });

        expect(query.scheduleId).toBeInstanceOf(ScheduleId);
    })


    it("should set scheduleId from ScheduleId object", () => {
        const id = ScheduleId.fromString("0.0.456");
        const query = new ScheduleInfoQuery();

        query.setScheduleId(id);

        expect(query.scheduleId.toString()).toBe(id.toString());
    });

        it("should create from protobuf with scheduleID", () => {
        const mockQuery = {
            scheduleGetInfo: {
                scheduleID: { shardNum: 0, realmNum: 0, scheduleNum: 123 }
            }
        };

        const result = ScheduleInfoQuery._fromProtobuf(mockQuery);

        expect(result.scheduleId).not.toBeNull();
    });

        it("should handle protobuf without scheduleID", () => {
        const mockQuery = {
            scheduleGetInfo: {}
        };

        const result = ScheduleInfoQuery._fromProtobuf(mockQuery);

        expect(result.scheduleId).toBeNull();
    });

        it("should build request with scheduleId", () => {
        const query = new ScheduleInfoQuery({
            scheduleId: "0.0.123"
        });

        const request = query._onMakeRequest({});

        expect(request.scheduleGetInfo.scheduleID).not.toBeNull();
    });

    it("should build request without scheduleId", () => {
        const query = new ScheduleInfoQuery();

        const request = query._onMakeRequest({});

        expect(request.scheduleGetInfo.scheduleID).toBeNull();
    });

        it("should validate checksum when scheduleId exists", () => {
        const query = new ScheduleInfoQuery({
            scheduleId: "0.0.123"
        });

        const client = { 
             _network: {
                _ledgerId: null, 
            }, 
        };

        // Should not throw
        query._validateChecksums(client);
    });

        it("should use timestamp when no paymentTransactionId", () => {
        const query = new ScheduleInfoQuery();

        const logId = query._getLogId();

        expect(logId).toContain("ScheduleInfoQuery:");
    });

    it("should use paymentTransactionId when available", () => {
        const query = new ScheduleInfoQuery();

        query._paymentTransactionId = {
            validStart: { toString: () => "12345" }
        };

        const logId = query._getLogId();

        expect(logId).toContain("12345");
    });
});